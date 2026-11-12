/* ui.js — DOM helper, EN/ES helper, toast/dialog, speech, handwriting pad, stroke-order viewer. */
(function () {
  const MS = (window.MS = window.MS || {});
  const lang = () => MS.store.data.settings.lang;
  const T = (en, es) => (lang() === 'es' && es !== undefined ? es : en);
  const L = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang()] != null ? o[lang()] : o.en);
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function h(tag, props) {
    const el = document.createElement(tag);
    for (const k in props || {}) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') { for (const sk in v) { if (sk.slice(0, 2) === '--') el.style.setProperty(sk, v[sk]); else el.style[sk] = v[sk]; } }
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else if (['value', 'checked', 'disabled', 'selected', 'open', 'hidden', 'indeterminate'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    const add = (c) => {
      if (c == null || c === false) return;
      if (Array.isArray(c)) c.forEach(add);
      else el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    };
    for (let i = 2; i < arguments.length; i++) add(arguments[i]);
    return el;
  }
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  const shuffle = (arr, rng) => {
    rng = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const fmtTime = (sec) => { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
  const fmtDate = (d) => new Date(d).toLocaleDateString(lang() === 'es' ? 'es-CR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  /* ---------- Icons (inline, currentColor) ---------- */
  const ICON = {
    speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"/>',
    play: '<path d="M7 5l12 7-12 7z"/>',
    undo: '<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 010 12" transform="translate(0 -6)"/>',
    trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    edit: '<path d="M4 20l1-5L16 4l4 4L9 19l-5 1z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
    theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16" /><path d="M12 4a8 8 0 010 16z" fill="currentColor"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    back: '<path d="M21 5H9l-6 7 6 7h12z"/><path d="M13 9l5 6M18 9l-5 6"/>',
    slow: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6" />',
  };
  const icon = (name, size) =>
    h('span', { class: 'ico', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICON[name] + '</svg>' });

  /* ---------- Toast + dialog ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }
  function dialog(title, body, actions) {
    const dlg = $('#dlg');
    clear(dlg);
    const close = () => { try { dlg.close(); } catch (e) { dlg.removeAttribute('open'); } };
    dlg.appendChild(h('div', { class: 'dlg-head' }, h('h2', null, title), h('button', { class: 'btn ghost sm', 'aria-label': T('Close', 'Cerrar'), onclick: close }, icon('close'))));
    dlg.appendChild(h('div', { class: 'dlg-body' }, body));
    if (actions) dlg.appendChild(h('div', { class: 'dlg-foot' }, actions.map((a) => h('button', { class: 'btn ' + (a.kind || ''), onclick: () => { close(); a.run && a.run(); } }, a.label))));
    try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
    return close;
  }
  function confirmDlg(title, text, okLabel, onOk) {
    dialog(title, h('p', null, text), [{ label: T('Cancel', 'Cancelar'), kind: 'ghost' }, { label: okLabel, kind: 'danger', run: onOk }]);
  }

  /* ---------- Speech ---------- */
  const SPEAK_FIX = { っ: 'きって', ッ: 'キッテ', ぁ: 'あ', ぃ: 'い', ぅ: 'う', ぇ: 'え', ぉ: 'お', ゃ: 'や', ゅ: 'ゆ', ょ: 'よ', ァ: 'ア', ィ: 'イ', ゥ: 'ウ', ェ: 'エ', ォ: 'オ', ャ: 'ヤ', ュ: 'ユ', ョ: 'ヨ', ゎ: 'わ', ー: 'あー', ん: 'ん', ン: 'ン' };
  let noVoiceShown = false;
  const Speech = {
    voices: [],
    supported: 'speechSynthesis' in window,
    refresh() { try { Speech.voices = speechSynthesis.getVoices() || []; } catch (e) { Speech.voices = []; } },
    ja() {
      const vs = Speech.voices.filter((v) => /^ja/i.test(v.lang));
      return vs.find((v) => /nanami|keita|aoi|daichi|mayu|naoki|shiori/i.test(v.name) && /natural|online/i.test(v.name))
        || vs.find((v) => /kyoko|otoya|o-ren|hattori|google 日本語|haruka|ayumi|ichiro|sayaka/i.test(v.name)) || vs[0] || null;
    },
    available() { return Speech.supported && !!Speech.ja(); },
    explain() {
      dialog(T('No Japanese voice found', 'No se encontró una voz japonesa'),
        h('div', { class: 'prose' },
          h('p', null, T('Your browser has no Japanese text-to-speech voice, so I cannot play pronunciation. On a Mac, add one:', 'Tu navegador no tiene una voz japonesa, así que no puedo reproducir la pronunciación. En un Mac, agrega una:')),
          h('ol', null,
            h('li', null, T('Open System Settings › Accessibility › Spoken Content.', 'Abre Ajustes del Sistema › Accesibilidad › Contenido hablado.')),
            h('li', null, T('Click System Voice, then Manage Voices…', 'Haz clic en Voz del sistema y luego en Gestionar voces…')),
            h('li', null, T('Open Japanese and download a voice (for example Kyoko).', 'Abre Japonés y descarga una voz (por ejemplo Kyoko).')),
            h('li', null, T('Reload this page.', 'Recarga esta página.'))),
          h('p', null, T('On Windows, the easiest fix is to open this page in Microsoft Edge or Google Chrome, which include free online Japanese voices. Or install one:', 'En Windows, lo más fácil es abrir esta página en Microsoft Edge o Google Chrome, que incluyen voces japonesas en línea gratis. O instala una:')),
          h('ol', null,
            h('li', null, T('Open Settings › Time & language › Speech › Manage voices › Add voices.', 'Abre Configuración › Hora e idioma › Voz › Administrar voces › Agregar voces.')),
            h('li', null, T('Choose Japanese (日本語) and install it.', 'Elige Japonés (日本語) e instálalo.')),
            h('li', null, T('Close and reopen the browser.', 'Cierra y vuelve a abrir el navegador.'))),
          h('p', { class: 'muted' }, T('On a phone, install a Japanese voice in the system text-to-speech settings.', 'En un teléfono, instala una voz japonesa en los ajustes de texto a voz del sistema.'))));
    },
    speak(text, opts) {
      opts = opts || {};
      if (!text) return false;
      if (!Speech.supported) { Speech.explain(); return false; }
      if (!Speech.voices.length) Speech.refresh();
      const v = Speech.ja();
      if (!v) {
        if (!noVoiceShown) { noVoiceShown = true; Speech.explain(); } else toast(T('No Japanese voice installed (see Data & help).', 'No hay voz japonesa instalada (ver Datos y ayuda).'));
        return false;
      }
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(SPEAK_FIX[text] || text);
        u.lang = 'ja-JP'; u.voice = v;
        u.rate = opts.rate || MS.store.data.settings.rate || 0.85;
        speechSynthesis.speak(u);
        return true;
      } catch (e) { return false; }
    },
  };
  if (Speech.supported) {
    Speech.refresh();
    try { speechSynthesis.addEventListener('voiceschanged', Speech.refresh); } catch (e) { /* old Safari */ }
  }
  const speakBtn = (text, opts) => {
    opts = opts || {};
    return h('button', { class: 'btn sm round', type: 'button', 'aria-label': (opts.slow ? T('Play slowly', 'Reproducir despacio') : T('Play audio', 'Reproducir audio')), onclick: () => Speech.speak(text, { rate: opts.slow ? 0.5 : undefined }) }, icon(opts.slow ? 'slow' : 'speaker'), opts.label ? h('span', null, opts.label) : null);
  };

  /* ---------- Handwriting pad (finger, mouse or Apple Pencil) ---------- */
  function DrawPad(opts) {
    opts = opts || {};
    const cols = opts.cols || 1;
    let cell = opts.cell || 150;
    const strokes = [];               // in cell units
    let cur = null;
    const canvas = h('canvas', { class: 'pad-canvas', 'aria-label': T('Writing area', 'Zona de escritura'), role: 'img' });
    const guide = h('div', { class: 'pad-guide', 'aria-hidden': 'true' });
    const cells = [];
    for (let i = 0; i < cols; i++) cells.push(h('div', { class: 'pad-cell' }));
    const el = h('div', { class: 'pad' }, cells, guide, canvas);
    const ctx = canvas.getContext('2d');

    function size() {
      el.style.setProperty('--cell', cell + 'px');
      el.style.width = cols * cell + 'px';
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cols * cell * dpr); canvas.height = Math.round(cell * dpr);
      canvas.style.width = cols * cell + 'px'; canvas.style.height = cell + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, cols * cell, cell);
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#222';
      ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      strokes.forEach((s) => {
        const pts = s.pts.map((p) => ({ x: p.x * cell, y: p.y * cell, p: p.p }));
        const w = cell * 0.05;
        if (pts.length === 1) { ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, w / 2, 0, 7); ctx.fill(); return; }
        ctx.lineWidth = w * (s.pen ? 0.6 + 0.9 * (pts[0].p || 0.5) : 1);
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      });
    }
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / cell, y: (e.clientY - r.top) / cell, p: e.pressure }; };
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
      cur = { pts: [pos(e)], pen: e.pointerType === 'pen' };
      strokes.push(cur); draw();
      opts.onInk && opts.onInk();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!cur) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (evs.length ? evs : [e]).forEach((ev) => cur.pts.push(pos(ev)));
      draw();
    });
    const end = () => { cur = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    const api = {
      el,
      undo() { strokes.pop(); draw(); },
      clear() { strokes.length = 0; draw(); },
      isEmpty: () => strokes.length === 0,
      setGuide(text, opacity) {
        clear(guide);
        if (!text) return;
        const chars = [...text];
        chars.forEach((c) => guide.appendChild(h('span', { style: { opacity: opacity == null ? 0.18 : opacity } }, c)));
      },
      fit(width) {
        const w = width || (el.parentElement ? el.parentElement.clientWidth : cols * cell);
        const next = Math.max(56, Math.min(opts.cell || 150, Math.floor(w / cols)));
        if (next !== cell) { cell = next; size(); }
      },
      redraw: draw,
    };
    size();
    window.addEventListener('resize', () => api.fit());
    return api;
  }

  /* ---------- Stroke-order viewer (KanjiVG paths, 109×109) ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (name, attrs) => { const e = document.createElementNS(NS, name); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); return e; };
  function hasStrokes(ch) { return !!(window.KANA_STROKES && window.KANA_STROKES[ch]); }

  function StrokeView(ch, opts) {
    opts = opts || {};
    const data = (window.KANA_STROKES && window.KANA_STROKES[ch]) || null;
    const svg = svgEl('svg', { viewBox: '0 0 109 109', class: 'sv', role: 'img', 'aria-label': T('Stroke order of ', 'Orden de trazos de ') + ch });
    svg.appendChild(svgEl('rect', { x: 1, y: 1, width: 107, height: 107, class: 'sv-frame' }));
    svg.appendChild(svgEl('path', { d: 'M54.5 1V108M1 54.5H108', class: 'sv-cross' }));
    const g = svgEl('g', { class: 'sv-strokes' });
    const gn = svgEl('g', { class: 'sv-nums' });
    svg.appendChild(g); svg.appendChild(gn);
    const paths = [], nums = [];
    let shown = 0, anims = [], timers = [];
    if (data) data.forEach((d, i) => {
      const p = svgEl('path', { d, pathLength: 1, class: 'sv-p' });
      p.style.strokeDasharray = '1 2'; p.style.strokeDashoffset = 1; p.style.visibility = 'hidden';
      g.appendChild(p); paths.push(p);
      const m = d.match(/^M\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/);
      const x = m ? +m[1] : 10, y = m ? +m[2] : 10;
      const n = svgEl('g', { class: 'sv-num' });
      n.style.visibility = 'hidden';
      n.appendChild(svgEl('circle', { cx: x, cy: y, r: 5.2 }));
      const tx = svgEl('text', { x, y: y + 2.2, 'text-anchor': 'middle' }); tx.textContent = i + 1;
      n.appendChild(tx); gn.appendChild(n); nums.push(n);
    });
    const markCurrent = () => paths.forEach((p, i) => p.classList.toggle('cur', i === shown - 1));
    function reveal(i, animate, done) {
      const p = paths[i];
      p.style.visibility = 'visible'; nums[i].style.visibility = 'visible';
      if (!animate || reduced() || !p.animate) { p.style.strokeDashoffset = 0; done && done(); return; }
      const a = p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 620, easing: 'ease-in-out', fill: 'forwards' });
      anims.push(a);
      a.onfinish = () => { p.style.strokeDashoffset = 0; done && done(); };
    }
    const api = {
      el: svg, count: paths.length, available: !!data,
      get shown() { return shown; },
      reset() {
        anims.forEach((a) => a.cancel()); anims = []; timers.forEach(clearTimeout); timers = [];
        paths.forEach((p) => { p.style.strokeDashoffset = 1; p.style.visibility = 'hidden'; p.classList.remove('cur'); });
        nums.forEach((n) => (n.style.visibility = 'hidden'));
        shown = 0;
      },
      step(done) {
        if (shown >= paths.length) { done && done(); return false; }
        shown++; markCurrent(); reveal(shown - 1, true, done); return true;
      },
      showAll() {
        api.reset();
        paths.forEach((p, i) => { reveal(i, false); });
        shown = paths.length; markCurrent();
        paths.forEach((p) => p.classList.remove('cur'));
      },
      play(done) {
        api.reset();
        if (reduced() || !paths.length) { api.showAll(); done && done(); return; }
        const next = () => { if (shown >= paths.length) { done && done(); return; } api.step(next); };
        const t = setTimeout(next, 150); timers.push(t);
      },
    };
    return api;
  }

  /* A masu (genkouyoushi square) showing a model character in the handwritten face */
  const masu = (text, cls) => h('span', { class: 'masu ' + (cls || ''), lang: 'ja' }, text);

  MS.ui = { h, $, $$, clear, T, L, lang, reduced, shuffle, fmtTime, fmtDate, icon, toast, dialog, confirmDlg, Speech, speakBtn, DrawPad, StrokeView, hasStrokes, masu };
})();
