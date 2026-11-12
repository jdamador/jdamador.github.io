/* keyboard.js — the on-screen kana keyboard. One component, used everywhere you enter a word or answer.
   Main input: tap kana. Optional: type romaji on a physical keyboard (Hepburn) and it becomes kana. */
(function () {
  const MS = (window.MS = window.MS || {});

  function Keyboard(opts) {
    opts = opts || {};
    const { h, T, icon } = MS.ui;
    const K = MS.kana;
    const settings = MS.store.data.settings;
    let value = opts.value || '';
    let pending = '';
    let script = opts.script || settings.script || 'hira';
    let showRomaji = opts.romaji != null ? opts.romaji : !!settings.romaji;
    let locked = false;
    const maxLen = opts.maxLength || 40;

    const label = opts.label || T('Your answer', 'Tu respuesta');
    const textSpan = h('span', { class: 'kbd-text', lang: 'ja' });
    const pendSpan = h('span', { class: 'kbd-pend' });
    const ph = h('span', { class: 'kbd-ph' }, opts.placeholder || T('Tap kana or type romaji', 'Toca kana o escribe romaji'));
    const screen = h('div', { class: 'kbd-screen', tabindex: 0, role: 'textbox', 'aria-label': label }, ph, textSpan, pendSpan, h('span', { class: 'kbd-caret', 'aria-hidden': 'true' }));
    const romajiLine = h('div', { class: 'kbd-romaji', 'aria-live': 'polite' });
    const grid = h('div', { class: 'kbd-grid', role: 'group', 'aria-label': T('Kana keys', 'Teclas de kana') });
    const extra = h('div', { class: 'kbd-extra' });
    const bottom = h('div', { class: 'kbd-bottom' });
    const segH = h('button', { type: 'button', class: 'seg-btn', onclick: () => setScript('hira') }, h('span', { lang: 'ja' }, 'あ'), ' ', T('Hiragana', 'Hiragana'));
    const segK = h('button', { type: 'button', class: 'seg-btn', onclick: () => setScript('kata') }, h('span', { lang: 'ja' }, 'ア'), ' ', T('Katakana', 'Katakana'));
    const romajiCb = h('input', { type: 'checkbox', checked: showRomaji, onchange: (e) => { showRomaji = e.target.checked; if (opts.romaji == null) { settings.romaji = showRomaji; MS.store.save(); } update(); } });
    const bar = h('div', { class: 'kbd-bar' },
      h('div', { class: 'seg', role: 'group', 'aria-label': T('Script', 'Escritura') }, segH, segK),
      h('label', { class: 'check sm' }, romajiCb, T('Show romaji', 'Mostrar romaji')));
    const el = h('div', { class: 'kbd' + (opts.compact ? ' compact' : '') }, screen, romajiLine, bar, grid, extra, bottom);

    const glyph = (c) => (script === 'kata' ? K.toKata(c) : c);
    function key(text, press, cls, aria) {
      return h('button', {
        type: 'button', class: 'key ' + (cls || ''), lang: 'ja', 'aria-label': aria || text,
        onclick: (e) => { if (locked) return; press(e.currentTarget); if (e.detail > 0) screen.focus({ preventScroll: true }); },
      }, text);
    }
    const nope = (btn) => { if (!btn) return; btn.classList.add('nope'); setTimeout(() => btn.classList.remove('nope'), 320); };

    function build() {
      MS.ui.clear(grid); MS.ui.clear(extra); MS.ui.clear(bottom);
      K.SERIES.forEach(([, chars]) => {
        [...chars].forEach((c) => grid.appendChild(c === '.' ? h('span', { class: 'key-gap', 'aria-hidden': 'true' }) : key(glyph(c), () => add(glyph(c)))));
      });
      extra.appendChild(key(glyph('ん'), () => add(glyph('ん')), 'key-n'));
      extra.appendChild(key('゛', (b) => mark('daku', b), 'key-fn', T('Dakuten (add voicing mark to the last kana)', 'Dakuten (marca de sonorización al último kana)')));
      extra.appendChild(key('゜', (b) => mark('handaku', b), 'key-fn', T('Handakuten (add circle mark to the last kana)', 'Handakuten (círculo al último kana)')));
      extra.appendChild(key('小', (b) => mark('small', b), 'key-fn', T('Toggle small size of the last kana', 'Alternar tamaño pequeño del último kana')));
      extra.appendChild(key('ー', () => add('ー'), 'key-long', T('Long vowel mark', 'Marca de vocal larga')));
      'っゃゅょぁぃぅぇぉ'.split('').forEach((c) => extra.appendChild(key(glyph(c), () => add(glyph(c)), 'key-small')));
      bottom.appendChild(key(T('Space', 'Espacio'), () => add(' '), 'key-wide', T('Space', 'Espacio')));
      bottom.appendChild(key(T('Backspace', 'Borrar'), () => backspace(), 'key-wide key-fn', T('Backspace', 'Borrar')));
      bottom.appendChild(key(T('Clear', 'Limpiar'), () => clearAll(), 'key-wide key-fn', T('Clear all', 'Limpiar todo')));
      bottom.querySelectorAll('.key').forEach((k) => k.removeAttribute('lang'));
    }

    function update() {
      textSpan.textContent = value;
      pendSpan.textContent = pending;
      ph.hidden = !!(value || pending);
      screen.setAttribute('aria-label', label + (value ? ': ' + value : ''));
      romajiLine.hidden = !showRomaji;
      romajiLine.textContent = showRomaji ? (K.kanaToRomaji(value) || '…') : '';
      segH.setAttribute('aria-pressed', script === 'hira'); segK.setAttribute('aria-pressed', script === 'kata');
      opts.onChange && opts.onChange(value);
    }
    function add(s) {
      pending = '';
      if ([...value].length + [...s].length > maxLen) return;
      if (s === ' ' && (!value || value.endsWith(' '))) return;
      value += s; update();
    }
    function mark(kind, btn) {
      pending = '';
      const r = K.applyMark(value.replace(/ $/, ''), kind);
      if (r === null) { nope(btn); return; }
      value = r; update();
    }
    function backspace() {
      if (pending) pending = pending.slice(0, -1);
      else value = [...value].slice(0, -1).join('');
      update();
    }
    function clearAll() { value = ''; pending = ''; update(); }
    function flushPending() {
      if (!pending) return;
      const r = K.romajiToKana(pending, script, true);
      value += r.kana; pending = '';
    }
    function typeRomaji(ch) {
      pending += ch;
      const r = K.romajiToKana(pending, script, false);
      if ([...value].length + [...r.kana].length <= maxLen) value += r.kana;
      pending = r.rest.slice(-4);
      update();
    }
    function setScript(s) {
      script = s;
      if (opts.persist !== false) { settings.script = s; MS.store.save(); }
      build(); update();
    }

    el.addEventListener('keydown', (e) => {
      if (locked || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const onKey = e.target.closest && e.target.closest('button');
      if (onKey && (e.key === 'Enter' || e.key === ' ')) return; // let the focused key activate
      if (e.key === 'Backspace') { backspace(); e.preventDefault(); }
      else if (e.key === 'Enter') { flushPending(); update(); opts.onSubmit && opts.onSubmit(value); e.preventDefault(); }
      else if (e.key === ' ') { add(' '); e.preventDefault(); }
      else if (/^[a-zA-Z'-]$/.test(e.key)) { typeRomaji(e.key); e.preventDefault(); }
    });

    build(); update();
    return {
      el,
      getValue() { flushPending(); update(); return value; },
      setValue(v) { value = v || ''; pending = ''; update(); },
      clear: clearAll,
      focus() { screen.focus({ preventScroll: true }); },
      setScript,
      lock(b) { locked = b; el.classList.toggle('locked', !!b); el.querySelectorAll('button,input').forEach((x) => (x.disabled = !!b)); screen.tabIndex = b ? -1 : 0; },
      script: () => script,
    };
  }

  MS.Keyboard = Keyboard;
})();
