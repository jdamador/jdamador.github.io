/* session.js — draws practice questions, runs sessions (practice / quiz / exam), shows the summary,
   and renders the practice hub (the "Generate practice" form). */
(function () {
  const MS = (window.MS = window.MS || {});
  const U = MS.ui, K = MS.kana, P = MS.practice;
  const { h, T, L, clear, icon, speakBtn, Speech } = U;
  const uniq = (a) => Array.from(new Set(a));

  let current = null;       // the session being run (set by launch)
  let cleanups = [], persistent = [];   // per-question cleanups / whole-session timers
  const onClean = (f) => cleanups.push(f);
  const runAll = (list) => list.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
  function cleanup() { runAll(cleanups); cleanups = []; }
  function stopAll() { cleanup(); runAll(persistent); persistent = []; }

  const SAMPLE_WORDS = [
    ['ねこ', 'cat', 'gato'], ['いぬ', 'dog', 'perro'], ['さかな', 'fish', 'pez'],
    ['ありがとう', 'thank you', 'gracias'], ['コーヒー', 'coffee', 'café'], ['ラーメン', 'ramen (noodle soup)', 'ramen (sopa de fideos)'],
  ];
  function addSampleWords() {
    const D = MS.store.data; let n = 0;
    SAMPLE_WORDS.forEach((s) => {
      if (D.words.some((w) => w.w === s[0])) return;
      D.words.push({ id: MS.store.uid(), w: s[0], m: T(s[1], s[2]), lesson: T('Sample', 'Ejemplo'), ex: '', note: '', hard: false, added: Date.now() });
      n++;
    });
    MS.store.save();
    return n;
  }

  /* ---------- small view helpers ---------- */
  const diffNode = (list) => h('span', { class: 'diff', lang: 'ja' }, list.map((x) => h('span', { class: x.ok ? 'ok' : 'bad' }, x.c)));
  function audioRow(text) { return h('div', { class: 'q-audio' }, speakBtn(text, { label: T('Play', 'Escuchar') }), speakBtn(text, { slow: true, label: T('Slow', 'Lento') })); }
  function promptBlock(p, api) {
    const kids = [];
    if (p.task) kids.push(h('p', { class: 'q-task' }, p.task === 'hira' ? T('Write it in hiragana.', 'Escríbelo en hiragana.') : p.task === 'kata' ? T('Write it in katakana.', 'Escríbelo en katakana.') : ''));
    if (p.img) kids.push(h('img', { class: 'q-img', src: p.img, alt: T('Picture', 'Imagen') }));
    if (p.meaning) kids.push(h('p', { class: 'q-meaning' }, p.meaning));
    if (p.pattern) kids.push(h('p', { class: 'q-pattern', lang: 'ja' }, p.pattern));
    if (p.word) kids.push(h('p', { class: 'q-big', lang: 'ja' }, p.word));
    if (p.big) kids.push(h('p', { class: 'q-big', lang: 'ja' }, p.big));
    if (p.romaji) kids.push(h('p', { class: 'q-romaji' }, p.ask ? T('Which one is “', '¿Cuál es “') + p.romaji + '”?' : p.romaji));
    if (p.audio) kids.push(audioRow(p.audio));
    return h('div', { class: 'prompt' }, kids);
  }
  function audioNote() {
    if (!Speech.available()) {
      return h('p', { class: 'note bad' }, T('No Japanese voice is installed. ', 'No hay voz japonesa instalada. '), h('button', { class: 'link', type: 'button', onclick: () => Speech.explain() }, T('How to add one', 'Cómo agregarla')));
    }
    return null;
  }

  /* ---------- renderers: R[kind](q, box, api) → { focus?, lock? } ---------- */
  const R = {};

  R.typed = (q, box, api) => {
    const p = q.prompt;
    box.appendChild(promptBlock(p, api));
    if (q.needsAudio) { const n = audioNote(); n && box.appendChild(n); }
    const task = q.attribute === 'blank'
      ? T('Type the missing kana (' + p.blanks + ').', 'Escribe el kana que falta (' + p.blanks + ').')
      : p.task ? '' : T('Type the word.', 'Escribe la palabra.');
    if (task) box.appendChild(h('p', { class: 'q-task' }, task));
    let script;
    if (q.forceScript) script = q.forceScript;
    else if (api.hints && (p.script === 'hira' || p.script === 'kata')) script = p.script;
    const kbd = MS.Keyboard({ compact: true, script, onSubmit: () => check(), label: T('Your answer', 'Tu respuesta') });
    box.appendChild(kbd.el);
    let hinted = false;
    const hintLine = h('p', { class: 'hint', hidden: true });
    const btnCheck = h('button', { class: 'btn primary', type: 'button', onclick: () => check() }, T('Check', 'Comprobar'));
    const btnSkip = h('button', { class: 'btn ghost', type: 'button', onclick: () => finish('', true) }, T("I don't know", 'No sé'));
    const btnHint = api.hints ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { hinted = true; hintLine.hidden = false; hintLine.textContent = T('Starts with ', 'Empieza con ') + [...q.answer][0] + T(' (' + K.units(q.answer).length + ' kana)', ' (' + K.units(q.answer).length + ' kana)'); } }, T('Hint', 'Pista')) : null;
    box.appendChild(hintLine);
    box.appendChild(h('div', { class: 'row actions' }, btnCheck, btnHint, btnSkip));
    function finish(val, skipped) {
      kbd.lock(true); btnCheck.disabled = btnSkip.disabled = true; btnHint && (btnHint.disabled = true);
      const answers = [q.answer].concat(q.alts || []);
      let best = null;
      for (const a of answers) { const r = K.checkAnswer(val, a); if (r.ok) { best = r; break; } if (!best || (r.kind === 'script' && best.kind !== 'script')) best = r; }
      if (skipped) best = Object.assign({}, K.checkAnswer('', q.answer), { ok: false });
      api.answer({ correct: !!best.ok, given: val, kind: skipped ? 'skipped' : best.kind, diff: best.diff, hinted, skipped: !!skipped });
    }
    function check() {
      const val = kbd.getValue().trim();
      if (!val) { kbd.focus(); return; }
      finish(val, false);
    }
    return { focus: () => kbd.focus() };
  };

  R.choice = (q, box, api) => {
    box.appendChild(promptBlock(q.prompt, api));
    if (q.needsAudio) { const n = audioNote(); n && box.appendChild(n); }
    if (q.prompt.listen) box.appendChild(h('p', { class: 'q-task' }, T('Listen, then choose.', 'Escucha y elige.')));
    const btns = [];
    const list = h('div', { class: 'opts', role: 'group', 'aria-label': T('Answers', 'Respuestas') });
    let done = false;
    q.options.forEach((o, i) => {
      const b = h('button', { type: 'button', class: 'opt' + (o.ja ? ' ja' : '') + (o.img ? ' pic' : ''), lang: o.ja ? 'ja' : null, 'aria-label': o.img ? String(i + 1) : null, onclick: () => pick(i) },
        h('span', { class: 'num', 'aria-hidden': 'true' }, String(i + 1)), o.img ? h('img', { src: o.img, alt: '' }) : h('span', { class: 'opt-text' }, o.text), o.sub ? h('span', { class: 'opt-sub' }, o.sub) : null);
      btns.push(b); list.appendChild(b);
    });
    box.appendChild(list);
    box.appendChild(h('div', { class: 'row actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => pick(-1) }, T("I don't know", 'No sé'))));
    function pick(i) {
      if (done) return; done = true;
      btns.forEach((b, j) => { b.disabled = true; if (api.instant) { if (j === q.answerIndex) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); } else if (j === i) b.classList.add('chosen'); });
      api.answer({ correct: i === q.answerIndex, given: i >= 0 ? q.options[i].text : '', skipped: i < 0 });
    }
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= btns.length) { pick(n - 1); e.preventDefault(); }
    };
    document.addEventListener('keydown', onKey); onClean(() => document.removeEventListener('keydown', onKey));
    return { focus: () => {} };
  };

  R.scramble = (q, box, api) => {
    box.appendChild(h('div', { class: 'prompt' }, h('p', { class: 'q-meaning' }, q.prompt.meaning), h('p', { class: 'q-task' }, T('Tap the kana in the right order.', 'Toca los kana en el orden correcto.'))));
    const tray = h('div', { class: 'tray', 'aria-label': T('Your word', 'Tu palabra'), role: 'group' });
    const bank = h('div', { class: 'bank', role: 'group', 'aria-label': T('Kana tiles', 'Fichas de kana') });
    const tiles = q.tiles.map((t, i) => ({ t, i, used: false }));
    const order = [];
    const render = () => {
      clear(tray); clear(bank);
      order.forEach((i) => tray.appendChild(h('button', { type: 'button', class: 'tile in-tray', lang: 'ja', onclick: () => { tiles[i].used = false; order.splice(order.indexOf(i), 1); render(); } }, tiles[i].t)));
      tiles.forEach((x) => bank.appendChild(h('button', { type: 'button', class: 'tile', lang: 'ja', disabled: x.used, onclick: () => { x.used = true; order.push(x.i); render(); } }, x.t)));
      btnCheck.disabled = order.length !== tiles.length;
    };
    const btnCheck = h('button', { class: 'btn primary', type: 'button', onclick: () => {
      const val = order.map((i) => tiles[i].t).join('');
      const r = K.checkAnswer(val, q.answer);
      lock(); api.answer({ correct: r.ok, given: val, diff: r.diff });
    } }, T('Check', 'Comprobar'));
    const btnReset = h('button', { class: 'btn ghost', type: 'button', onclick: () => { tiles.forEach((x) => (x.used = false)); order.length = 0; render(); } }, T('Start over', 'Reiniciar'));
    const btnSkip = h('button', { class: 'btn ghost', type: 'button', onclick: () => { lock(); api.answer({ correct: false, given: '', skipped: true, diff: K.checkAnswer('', q.answer).diff }); } }, T("I don't know", 'No sé'));
    function lock() { [btnCheck, btnReset, btnSkip].forEach((b) => (b.disabled = true)); box.querySelectorAll('.tile').forEach((b) => (b.disabled = true)); }
    box.append(tray, bank, h('div', { class: 'row actions' }, btnCheck, btnReset, btnSkip));
    render();
    return {};
  };

  R.hand = (q, box, api) => {
    const chars = [...q.answer];
    box.appendChild(h('div', { class: 'prompt' }, h('p', { class: 'q-meaning' }, q.prompt.meaning), q.prompt.audio ? audioRow(q.prompt.audio) : null,
      h('p', { class: 'q-task' }, T('Write the word with your finger, mouse or Apple Pencil, then reveal the answer.', 'Escribe la palabra con el dedo, el mouse o el Apple Pencil y luego revela la respuesta.'))));
    const pad = U.DrawPad({ cols: chars.length, cell: 130 });
    const wrap = h('div', { class: 'pad-wrap' }, pad.el);
    box.appendChild(wrap);
    requestAnimationFrame(() => pad.fit(box.clientWidth - 8));
    const model = h('div', { class: 'masu-row', hidden: true, style: { '--cell': '64px' } }, chars.map((c) => U.masu(c)));
    const marks = h('div', { class: 'row actions', hidden: true },
      h('button', { class: 'btn primary', type: 'button', onclick: () => { api.answer({ correct: true, given: '', self: true, noFeedback: true }); } }, T('I wrote it correctly', 'Lo escribí bien')),
      h('button', { class: 'btn', type: 'button', onclick: () => { api.answer({ correct: false, given: '', self: true, noFeedback: true }); } }, T('Needs more practice', 'Necesito practicar')));
    const reveal = h('button', { class: 'btn primary', type: 'button', onclick: () => { model.hidden = false; marks.hidden = false; reveal.disabled = true; } }, T('Reveal answer', 'Revelar respuesta'));
    box.append(h('div', { class: 'row actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => pad.undo() }, icon('undo'), T('Undo', 'Deshacer')), h('button', { class: 'btn ghost', type: 'button', onclick: () => pad.clear() }, icon('trash'), T('Clear', 'Borrar')), reveal), model, marks);
    return {};
  };

  R.stroke = (q, box, api) => {
    const chars = [...q.prompt.ch];
    const names = [T('Watch', 'Mirar'), T('Trace', 'Calcar'), T('From memory', 'De memoria')];
    let phase = 0, pad = null, modelShown = false;
    const steps = h('ol', { class: 'steps' }, names.map((n) => h('li', null, n)));
    const body = h('div', { class: 'stroke-body' });
    const ctrl = h('div', { class: 'row actions' });
    box.append(h('div', { class: 'prompt' }, h('p', { class: 'q-task' }, T('Learn the stroke order, trace it, then write it without help.', 'Aprende el orden de trazos, calca y luego escribe sin ayuda.'))), steps, body, ctrl);
    const hasData = chars.every((c) => U.hasStrokes(c));
    function fit() { requestAnimationFrame(() => pad && pad.fit(body.clientWidth - 8)); }
    function show() {
      clear(body); clear(ctrl);
      [...steps.children].forEach((li, i) => { li.className = i === phase ? 'now' : i < phase ? 'past' : ''; if (i === phase) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
      if (phase === 0) {
        const views = chars.map((c) => U.StrokeView(c));
        if (hasData) body.appendChild(h('div', { class: 'sv-row' }, views.map((v) => v.el)));
        else {
          body.appendChild(h('div', { class: 'masu-row', style: { '--cell': '150px' } }, chars.map((c) => U.masu(c))));
          body.appendChild(h('p', { class: 'note' }, T('Stroke data is not available for this character, so here is a model to copy instead.', 'No hay datos de trazos para este carácter; aquí tienes un modelo para copiar.')));
        }
        const playAll = () => { views.forEach((v) => v.reset()); let i = 0; const next = () => { if (i < views.length) views[i++].play(next); }; next(); };
        const stepAll = () => { const v = views.find((x) => x.shown < x.count); v && v.step(); };
        if (hasData) {
          ctrl.append(h('button', { class: 'btn', type: 'button', onclick: playAll }, icon('play'), T('Play', 'Reproducir')), h('button', { class: 'btn ghost', type: 'button', onclick: stepAll }, T('Next stroke', 'Siguiente trazo')));
          setTimeout(playAll, 250);
        }
        ctrl.append(speakBtn(q.speak), h('button', { class: 'btn primary', type: 'button', onclick: () => { phase = 1; show(); } }, T('Now trace it', 'Ahora calca')));
      } else if (phase === 1) {
        pad = U.DrawPad({ cols: chars.length, cell: 170 }); pad.setGuide(q.prompt.ch, 0.2);
        body.appendChild(h('div', { class: 'pad-wrap' }, pad.el)); fit();
        ctrl.append(h('button', { class: 'btn ghost', type: 'button', onclick: () => pad.undo() }, icon('undo'), T('Undo', 'Deshacer')), h('button', { class: 'btn ghost', type: 'button', onclick: () => pad.clear() }, icon('trash'), T('Clear', 'Borrar')),
          h('button', { class: 'btn primary', type: 'button', onclick: () => { phase = 2; modelShown = false; show(); } }, T('Write from memory', 'Escribir de memoria')));
      } else {
        pad = U.DrawPad({ cols: chars.length, cell: 170 });
        const model = h('div', { class: 'masu-row', hidden: true, style: { '--cell': '72px' } }, chars.map((c) => U.masu(c)));
        const marks = h('div', { class: 'row actions', hidden: true },
          h('button', { class: 'btn primary', type: 'button', onclick: () => api.answer({ correct: true, self: true, noFeedback: true }) }, T('Looked right', 'Se ve bien')),
          h('button', { class: 'btn', type: 'button', onclick: () => api.answer({ correct: false, self: true, noFeedback: true }) }, T('Needs more practice', 'Necesito practicar')));
        body.append(h('div', { class: 'pad-wrap' }, pad.el), model, marks); fit();
        ctrl.append(h('button', { class: 'btn ghost', type: 'button', onclick: () => pad.undo() }, icon('undo'), T('Undo', 'Deshacer')), h('button', { class: 'btn ghost', type: 'button', onclick: () => pad.clear() }, icon('trash'), T('Clear', 'Borrar')),
          h('button', { class: 'btn primary', type: 'button', onclick: (e) => { model.hidden = false; marks.hidden = false; e.currentTarget.disabled = true; } }, T('Show model', 'Mostrar modelo')));
      }
    }
    show();
    return {};
  };

  R.flash = (q, box, api) => {
    const c = q.card;
    const back = h('div', { class: 'fc-back', hidden: true },
      h('p', { class: 'q-meaning' }, c.m), c.ex ? h('p', { class: 'fc-ex', lang: 'ja' }, c.ex) : null, c.note ? h('p', { class: 'note' }, c.note) : null);
    const grades = h('div', { class: 'row actions grades', hidden: true }, [[0, T('Again', 'Otra vez')], [1, T('Hard', 'Difícil')], [2, T('Good', 'Bien')], [3, T('Easy', 'Fácil')]].map(([g, label]) =>
      h('button', { class: 'btn grade g' + g, type: 'button', onclick: () => grade(g) }, h('span', { class: 'num' }, String(g + 1)), label)));
    const flip = h('button', { class: 'btn primary', type: 'button', onclick: () => reveal() }, T('Show answer', 'Mostrar respuesta'));
    const card = h('div', { class: 'fc' }, h('p', { class: 'q-big', lang: 'ja' }, c.w), h('div', { class: 'q-audio' }, speakBtn(c.w)), back);
    box.append(card, h('div', { class: 'row actions' }, flip), grades);
    let shown = false, done = false;
    function reveal() { if (shown) return; shown = true; back.hidden = false; grades.hidden = false; flip.parentElement.hidden = true; card.classList.add('flipped'); grades.querySelector('button').focus(); }
    function grade(g) { if (done || !shown) return; done = true; api.answer({ correct: g > 0, grade: g, given: ['again', 'hard', 'good', 'easy'][g], noFeedback: true }); }
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!shown && (e.key === ' ' || e.key === 'Enter')) { reveal(); e.preventDefault(); }
      else if (shown && /^[1-4]$/.test(e.key)) { grade(+e.key - 1); e.preventDefault(); }
    };
    document.addEventListener('keydown', onKey); onClean(() => document.removeEventListener('keydown', onKey));
    setTimeout(() => flip.focus(), 30);
    return {};
  };

  R.match = (q, box, api) => {
    const n = q.pairs.length;
    const left = U.shuffle(q.pairs), right = U.shuffle(q.pairs);
    let sel = null, matched = 0, mistakes = 0;
    const wrongKeys = new Set();
    const mk = (side, p) => h('button', { type: 'button', class: 'mt ' + side + (side === 'l' ? ' ja' : ''), lang: side === 'l' ? 'ja' : null, 'data-key': p.key, onclick: (e) => click(e.currentTarget, side, p) }, side === 'l' ? p.w : p.m);
    const colL = h('div', { class: 'mt-col' }, left.map((p) => mk('l', p)));
    const colR = h('div', { class: 'mt-col' }, right.map((p) => mk('r', p)));
    box.append(h('div', { class: 'prompt' }, h('p', { class: 'q-task' }, T('Pair each word with its meaning.', 'Empareja cada palabra con su significado.'))), h('div', { class: 'match' }, colL, colR));
    function click(btn, side, p) {
      if (btn.classList.contains('done')) return;
      if (!sel) { sel = { btn, side, p }; btn.classList.add('sel'); return; }
      if (sel.side === side) { sel.btn.classList.remove('sel'); sel = { btn, side, p }; btn.classList.add('sel'); return; }
      const a = sel; sel = null; a.btn.classList.remove('sel');
      if (a.p.key === p.key) {
        [a.btn, btn].forEach((b) => { b.classList.add('done'); b.disabled = true; });
        if (++matched === n) api.answer({ correct: mistakes === 0, given: mistakes + T(' mistakes', ' errores'), wrongKeys, message: mistakes ? T('Matched with ' + mistakes + ' mistake(s).', 'Emparejado con ' + mistakes + ' error(es).') : T('All pairs matched on the first try.', 'Todos los pares a la primera.') });
      } else {
        mistakes++; wrongKeys.add(side === 'l' ? p.key : a.p.key);
        [a.btn, btn].forEach((b) => { b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 450); });
      }
    }
    return {};
  };

  R.speed = (q, box, api) => {
    const pool = q.pool;
    let left = q.seconds, score = 0, tries = 0, running = false, timer = null, cur = null, lastCh = '';
    const seen = new Set();
    const clock = h('span', { class: 'speed-clock' }, U.fmtTime(left));
    const scoreEl = h('span', { class: 'speed-score' }, '0');
    const area = h('div', { class: 'speed-area' });
    const start = h('button', { class: 'btn primary', type: 'button', onclick: () => begin() }, T('Start (60 seconds)', 'Empezar (60 segundos)'));
    box.append(h('div', { class: 'prompt' }, h('p', { class: 'q-task' }, T('Pick the sound of each kana as fast as you can. Keys 1–4 work too.', 'Elige el sonido de cada kana lo más rápido que puedas. También funcionan las teclas 1–4.'))), h('p', { class: 'speed-bar' }, T('Time ', 'Tiempo '), clock, '  ', T('Score ', 'Puntos '), scoreEl), area, h('div', { class: 'row actions' }, start));
    function next() {
      let it; do { it = pool[Math.floor(Math.random() * pool.length)]; } while (it.ch === lastCh && pool.length > 1);
      lastCh = it.ch;
      const rs = uniq(U.shuffle(pool).map((x) => x.r).filter((r) => r !== it.r)).slice(0, 3);
      const opts = U.shuffle([it.r].concat(rs));
      cur = { it, opts };
      clear(area);
      area.appendChild(h('p', { class: 'q-big', lang: 'ja' }, it.ch));
      area.appendChild(h('div', { class: 'opts' }, opts.map((o, i) => h('button', { type: 'button', class: 'opt', onclick: () => pickOpt(i) }, h('span', { class: 'num' }, String(i + 1)), o))));
    }
    function pickOpt(i) {
      if (!running || !cur) return;
      const ok = cur.opts[i] === cur.it.r;
      tries++; if (ok) score++;
      api.kana(cur.it.ch, ok, !seen.has(cur.it.ch)); seen.add(cur.it.ch);
      scoreEl.textContent = score;
      area.classList.add(ok ? 'flash-ok' : 'flash-bad'); setTimeout(() => area.classList.remove('flash-ok', 'flash-bad'), 160);
      next();
    }
    function begin() {
      running = true; start.parentElement.hidden = true; next();
      timer = setInterval(() => { left--; clock.textContent = U.fmtTime(left); if (left <= 0) end(); }, 1000);
    }
    function end() {
      clearInterval(timer); running = false; clear(area);
      api.answer({ correct: tries > 0 && score / tries >= 0.8, given: score + '/' + tries, message: T('Score: ' + score + ' correct out of ' + tries + '.', 'Puntaje: ' + score + ' correctas de ' + tries + '.'), speed: { score, tries } });
    }
    const onKey = (e) => {
      if (!running) { if (e.key === 'Enter' || e.key === ' ') { if (!document.activeElement || document.activeElement.tagName !== 'BUTTON') { begin(); e.preventDefault(); } } return; }
      if (/^[1-4]$/.test(e.key)) { pickOpt(+e.key - 1); e.preventDefault(); }
    };
    document.addEventListener('keydown', onKey); onClean(() => { document.removeEventListener('keydown', onKey); clearInterval(timer); });
    setTimeout(() => start.focus(), 30);
    return {};
  };

  /* ---------- the runner ---------- */
  function renderRun(host) {
    stopAll();
    const S = current;
    if (!S) { location.hash = '#/practice'; return; }
    if (S.done) { renderSummary(host, S); return; }
    const mode = S.mode;
    const total = S.questions.length;
    S.i = S.i || 0; S.results = S.results || []; S.stats = S.stats || {}; S.byAct = S.byAct || {};
    S.started = S.started || Date.now();
    let qStart = Date.now();
    let examTimer = null;

    const bar = h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': 0 }, h('i'));
    const count = h('span', { class: 'run-count' });
    const clock = h('span', { class: 'run-clock', hidden: mode !== 'exam' });
    const modeLabel = { practice: T('Practice', 'Práctica'), quiz: T('Quiz', 'Quiz'), exam: T('Exam', 'Examen') }[mode];
    const top = h('div', { class: 'run-top' }, h('button', { class: 'btn ghost sm', type: 'button', onclick: () => endSession('quit') }, T('End session', 'Terminar')), h('span', { class: 'run-mode mode-' + mode }, modeLabel), count, clock);
    const stage = h('section', { class: 'stage', 'aria-live': 'off' });
    const fb = h('div', { class: 'fb-wrap', 'aria-live': 'polite' });
    clear(host).append(h('div', { class: 'run' }, top, bar, stage, fb));

    if (mode === 'exam') {
      S.deadline = S.deadline || Date.now() + (S.minutes || Math.max(2, Math.ceil(total * 0.6))) * 60000;
      const tick = () => { const rem = Math.round((S.deadline - Date.now()) / 1000); clock.textContent = '⏱ ' + U.fmtTime(rem); clock.classList.toggle('low', rem <= 30); if (rem <= 0) { clearInterval(examTimer); endSession('timeout'); } };
      examTimer = setInterval(tick, 1000); tick(); persistent.push(() => clearInterval(examTimer));
    }

    function recordKana(ch, ok, srs) {
      const e = K.entryOf(ch); if (!e) return;
      const s = (S.stats[ch] = S.stats[ch] || { ok: 0, bad: 0 });
      if (ok) s.ok++; else s.bad++;
      if (srs !== false) MS.srs.grade('k:' + ch, ok ? 2 : 0);
    }

    function show() {
      cleanup();
      const q = S.questions[S.i];
      clear(fb); clear(stage);
      count.textContent = (S.i + 1) + ' / ' + total;
      bar.firstChild.style.width = (S.i / total) * 100 + '%';
      bar.setAttribute('aria-valuenow', S.i);
      stage.appendChild(h('p', { class: 'act-label' }, L(q.title)));
      const box = h('div', { class: 'q-box' });
      stage.appendChild(box);
      qStart = Date.now();
      let answered = false;
      const api = {
        mode, hints: mode === 'practice', instant: mode === 'practice',
        kana: (ch, ok, srs) => recordKana(ch, ok, srs),
        answer(res) {
          if (answered) return; answered = true;
          const sec = Math.min(90, (Date.now() - qStart) / 1000);
          record(q, res, sec);
          S.results.push({ q, res });
          bar.firstChild.style.width = ((S.i + 1) / total) * 100 + '%';
          if (mode === 'practice' && !res.noFeedback) showFeedback(q, res);
          else {
            fb.appendChild(h('p', { class: 'sr-only' }, T('Answer saved.', 'Respuesta guardada.')));
            setTimeout(next, mode === 'practice' ? 120 : 260);
          }
        },
      };
      if (q.mode_note) box.appendChild(h('p', { class: 'note' }, q.mode_note));
      const ctl = R[q.kind](q, box, api) || {};
      if (q.needsAudio && Speech.available()) setTimeout(() => Speech.speak(q.prompt.audio), 350);
      ctl.focus && setTimeout(ctl.focus, 60);
    }

    function record(q, res, sec) {
      const ok = !!res.correct;
      MS.store.logActivity(sec, 1, ok ? 1 : 0);
      const b = (S.byAct[q.act] = S.byAct[q.act] || { ok: 0, n: 0 }); b.n++; if (ok) b.ok++;
      if (q.kind === 'speed') return;
      if (q.kind === 'match') q.itemKeys.forEach((k) => MS.srs.grade(k, res.wrongKeys && res.wrongKeys.has(k) ? 0 : 2));
      else q.itemKeys.forEach((k) => { if (k.startsWith('w:')) MS.srs.grade(k, res.grade != null ? res.grade : ok ? (res.hinted ? 1 : 2) : 0); });
      if (q.kanaChars) q.kanaChars.forEach((c) => recordKana(c, ok));
      else if (q.attribute === 'diff') {
        const bad = new Set(ok || !res.diff ? [] : res.diff.expected.filter((x) => !x.ok).map((x) => x.c));
        uniq([...q.answer]).forEach((c) => recordKana(c, !bad.has(c)));
      } else if (q.attribute === 'blank') uniq([...q.answer]).forEach((c) => recordKana(c, ok));
    }

    function showFeedback(q, res) {
      const ok = res.correct;
      const parts = [h('p', { class: 'fb-head' }, ok ? T('Correct', 'Correcto') : res.skipped ? T('The answer is', 'La respuesta es') : T('Not quite', 'Casi'))];
      if (res.kind === 'script') parts.push(h('p', null, T('The sounds are right but the script is wrong. Hiragana and katakana are not interchangeable in a word.', 'Los sonidos están bien pero la escritura no. Hiragana y katakana no son intercambiables en una palabra.')));
      if ((q.kind === 'typed' || q.kind === 'scramble') && res.diff && !ok) {
        if (res.given) parts.push(h('p', null, T('You wrote ', 'Escribiste '), diffNode(res.diff.given)));
        parts.push(h('p', null, T('Answer ', 'Respuesta '), diffNode(res.diff.expected)));
        if (q.full) parts.push(h('p', { class: 'muted' }, T('Whole word: ', 'Palabra completa: ') + q.full));
      } else if (q.kind === 'typed' && ok && q.full) parts.push(h('p', null, q.full));
      else if (!ok && q.expected) parts.push(h('p', null, T('Answer ', 'Respuesta '), h('strong', { lang: 'ja' }, q.expected)));
      if (res.message) parts.push(h('p', null, res.message));
      if (res.hinted && ok) parts.push(h('p', { class: 'muted' }, T('You used a hint, so this will come back sooner.', 'Usaste una pista, así que volverá antes.')));
      const nextBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => next() }, S.i + 1 >= total ? T('See results', 'Ver resultados') : T('Next', 'Siguiente'));
      parts.push(h('div', { class: 'row actions' }, nextBtn, q.speak ? speakBtn(q.speak, { label: T('Listen', 'Escuchar') }) : null));
      clear(fb).appendChild(h('div', { class: 'fb ' + (ok ? 'ok' : 'bad') }, parts));
      setTimeout(() => nextBtn.focus(), 30);
    }

    function next() {
      S.i++;
      if (S.i >= total) endSession('done'); else show();
    }
    function endSession(why) {
      stopAll();
      if (why === 'quit' && !S.results.length) { current = null; location.hash = '#/practice'; return; }
      S.done = true; S.ended = why; S.sec = Math.round((Date.now() - S.started) / 1000);
      const n = mode === 'exam' ? total : S.results.length;
      const ok = S.results.filter((r) => r.res.correct).length;
      S.score = { ok, n, pct: n ? Math.round((ok / n) * 100) : 0 };
      MS.store.data.sessions.unshift({ id: MS.store.uid(), date: Date.now(), mode, n, ok, pct: S.score.pct, sec: S.sec });
      MS.store.data.sessions.length = Math.min(MS.store.data.sessions.length, 40);
      MS.store.save();
      renderSummary(host, S);
    }
    show();
  }

  function renderSummary(host, S) {
    stopAll();
    const sc = S.score;
    const band = sc.pct >= 90 ? T('Excellent. You are ready for this material.', 'Excelente. Estás listo para este material.')
      : sc.pct >= 75 ? T('Solid. Go through the mistakes below once more.', 'Bien. Repasa los errores de abajo una vez más.')
      : sc.pct >= 50 ? T('Getting there. Short sessions on the weak kana will help most.', 'Vas bien. Sesiones cortas con los kana débiles ayudarán más.')
      : T('Needs work. Try the daily 10 minutes and the kana chart.', 'Hay que trabajar. Prueba los 10 minutos diarios y la tabla de kana.');
    const wrong = S.results.filter((r) => !r.res.correct);
    const unanswered = S.questions.length - S.results.length;
    const stats = Object.keys(S.stats).map((ch) => ({ ch, ok: S.stats[ch].ok, bad: S.stats[ch].bad, r: S.stats[ch].ok / (S.stats[ch].ok + S.stats[ch].bad) })).sort((a, b) => a.r - b.r || b.bad - a.bad);
    const modeName = { practice: T('Practice', 'Práctica'), quiz: T('Quiz', 'Quiz'), exam: T('Exam', 'Examen') }[S.mode];
    const view = h('div', { class: 'summary' },
      h('h1', null, S.mode === 'exam' ? T('Exam result', 'Resultado del examen') : S.mode === 'quiz' ? T('Quiz result', 'Resultado del quiz') : T('Session done', 'Sesión terminada')),
      h('div', { class: 'score' }, h('span', { class: 'score-num' }, sc.pct + '%'), h('span', { class: 'score-sub' }, sc.ok + ' / ' + sc.n + ' · ' + U.fmtTime(S.sec) + ' · ' + modeName)),
      h('p', { class: 'lead' }, band),
      S.ended === 'timeout' ? h('p', { class: 'note bad' }, T('Time ran out: ' + unanswered + ' unanswered question(s) count as wrong.', 'Se acabó el tiempo: ' + unanswered + ' pregunta(s) sin responder cuentan como incorrectas.')) : null,
      S.ended === 'quit' && unanswered ? h('p', { class: 'muted' }, T('You ended early; only the ' + S.results.length + ' answered question(s) are scored.', 'Terminaste antes; solo se califican las ' + S.results.length + ' preguntas respondidas.')) : null,
      h('div', { class: 'row actions' },
        wrong.length ? h('button', { class: 'btn primary', type: 'button', onclick: () => practiceMistakes(wrong) }, T('Practise these mistakes', 'Practicar estos errores')) : null,
        h('a', { class: 'btn', href: '#/practice' }, T('Back to practice', 'Volver a práctica')),
        h('a', { class: 'btn ghost', href: '#/progress' }, T('See progress', 'Ver progreso'))),
      stats.length ? h('section', null, h('h2', null, T('Accuracy per kana', 'Precisión por kana')),
        h('p', { class: 'muted' }, T('Only kana that appeared in this session. Missing or wrong characters in typed answers count against the kana.', 'Solo los kana que aparecieron en esta sesión. Los caracteres que faltan o están mal en las respuestas escritas cuentan en contra.')),
        h('div', { class: 'chips-acc' }, stats.map((s) => h('span', { class: 'acc-chip ' + (s.r >= 0.8 ? 'good' : s.r >= 0.5 ? 'mid' : 'low') }, h('span', { class: 'ja', lang: 'ja' }, s.ch), h('span', { class: 'acc-n' }, s.ok + '/' + (s.ok + s.bad)))))) : null,
      Object.keys(S.byAct).length ? h('section', null, h('h2', null, T('By activity', 'Por actividad')),
        h('ul', { class: 'plain' }, Object.keys(S.byAct).map((a) => h('li', null, L({ en: P.ACTS[a].en, es: P.ACTS[a].es }) + ': ' + S.byAct[a].ok + ' / ' + S.byAct[a].n)))) : null,
      wrong.length ? h('section', null, h('h2', null, T('Review your mistakes', 'Revisa tus errores')),
        h('ul', { class: 'review' }, wrong.map(({ q, res }) => h('li', null,
          h('div', { class: 'rv-q' }, h('span', { class: 'muted' }, L(q.title) + ': '), h('span', { lang: 'ja' }, q.promptText || '')),
          res.given ? h('div', null, T('You: ', 'Tú: '), h('span', { lang: 'ja', class: 'bad-text' }, res.given)) : h('div', { class: 'muted' }, res.self ? T('Marked as needs practice', 'Marcado para practicar') : T('No answer', 'Sin respuesta')),
          h('div', null, T('Answer: ', 'Respuesta: '), h('strong', { lang: 'ja' }, q.expected)),
          q.speak ? speakBtn(q.speak) : null)))) : h('p', null, T('No mistakes. Nice work.', 'Sin errores. Buen trabajo.')));
    clear(host).appendChild(view);
  }

  function practiceMistakes(wrong) {
    const keys = uniq([].concat(...wrong.map(({ q }) => q.itemKeys)));
    const kanaKeys = keys.filter((k) => k.startsWith('k:'));
    wrong.forEach(({ q }) => (q.kanaChars || []).forEach((c) => kanaKeys.push('k:' + c)));
    const wordIds = keys.filter((k) => k.startsWith('w:')).map((k) => k.slice(2));
    const acts = uniq(wrong.map(({ q }) => q.act)).filter((a) => !P.ACTS[a].special);
    launch({ kanaKeys: uniq(kanaKeys), wordIds, acts: acts.length ? acts : P.PRESETS.daily, length: 10, mode: 'practice', prioritize: true });
  }

  /* ---------- launch ---------- */
  function launch(cfg, title) {
    const data = P.gather(cfg);
    const { questions, warnings } = P.generate(cfg, data);
    if (!questions.length) {
      const why = warnings.includes('no-activities') ? T('Choose at least one activity.', 'Elige al menos una actividad.')
        : T('Nothing to practise with these choices. Word activities need words (add some in Words), and kana activities need a kana selection.', 'No hay nada que practicar con estas opciones. Las actividades de palabras necesitan palabras (agrégalas en Palabras) y las de kana necesitan una selección de kana.');
      U.dialog(T('Cannot generate practice', 'No se puede generar la práctica'), h('p', null, why));
      return false;
    }
    const dropped = warnings.filter((w) => w.startsWith('dropped:') || w.startsWith('skipped:')).map((w) => w.split(':')[1].split(',')).flat();
    if (dropped.length) U.toast(T('Left out (not possible with your selection): ', 'Omitido (no es posible con tu selección): ') + dropped.map((a) => L({ en: P.ACTS[a].en, es: P.ACTS[a].es })).join(', '));
    stopAll();
    const same = location.hash === '#/practice/run';
    current = { questions, mode: cfg.mode || 'practice', minutes: cfg.minutes, cfg, title };
    if (same) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = '#/practice/run';
    return true;
  }

  /* ---------- the hub: "Generate practice" ---------- */
  function hub(host) {
    stopAll();
    const D = MS.store.data;
    const prefs = Object.assign({ sets: ['all'], scripts: ['hira'], groups: ['basic'], only: 'all', length: 10, acts: P.PRESETS.all.slice(), mode: 'practice', minutes: 10 }, D.practicePrefs || {});
    const save = () => { D.practicePrefs = prefs; MS.store.save(); };
    const toggle = (arr, v, on) => { const i = arr.indexOf(v); if (on && i < 0) arr.push(v); if (!on && i >= 0) arr.splice(i, 1); save(); };
    const chk = (label, checked, on, extra) => h('label', { class: 'chip' }, h('input', { type: 'checkbox', checked, onchange: (e) => on(e.target.checked) }), h('span', null, label, extra ? h('small', null, ' ' + extra) : null));
    const radio = (name, label, checked, on) => h('label', { class: 'chip' }, h('input', { type: 'radio', name, checked, onchange: () => on() }), h('span', null, label));

    const plan = P.dailyPlan();
    const lessons = uniq(D.words.map((w) => w.lesson || ''));
    const nWords = D.words.length;
    const sets = [['all', T('All words', 'Todas las palabras'), nWords], ['due', T('Due now', 'Pendientes hoy'), P.wordsInSet('due', D).length], ['hard', T('Difficult words', 'Palabras difíciles'), P.wordsInSet('hard', D).length], ['mistakes', T('Mistake bank', 'Banco de errores'), P.wordsInSet('mistakes', D).length]]
      .concat(lessons.map((l) => ['lesson:' + l, l || T('No lesson', 'Sin lección'), D.words.filter((w) => (w.lesson || '') === l).length]));

    const kanaSummary = h('p', { class: 'muted' });
    const updateKana = () => { const n = P.kanaItemsFor({ scripts: prefs.scripts, groups: prefs.groups, only: prefs.only }, D.srs, D.known, D.mistakes).length; kanaSummary.textContent = T(n + ' kana in this selection', n + ' kana en esta selección'); };

    const actGroups = [['write', T('Writing words from memory', 'Escribir palabras de memoria')], ['kana', T('Writing and recognising kana', 'Escribir y reconocer kana')], ['recog', T('Recognition and meaning', 'Reconocimiento y significado')]];
    const actBoxes = [];
    const actView = h('div', null, actGroups.map(([cat, title]) => h('fieldset', { class: 'fs' }, h('legend', null, title),
      h('div', { class: 'chips' }, P.ACT_ORDER.filter((a) => P.ACTS[a].cat === cat && a !== 'k_speed').map((a) => {
        const b = chk(L({ en: P.ACTS[a].en, es: P.ACTS[a].es }), prefs.acts.includes(a), (on) => toggle(prefs.acts, a, on));
        b.firstChild.dataset.act = a; actBoxes.push(b.firstChild); return b;
      })))));
    const setActs = (list) => { prefs.acts = list.slice(); actBoxes.forEach((b) => (b.checked = prefs.acts.includes(b.dataset.act))); save(); };

    const minutesField = h('label', { class: 'inline', hidden: prefs.mode !== 'exam' }, T('Exam minutes', 'Minutos del examen'), ' ', h('input', { type: 'number', min: 1, max: 90, value: prefs.minutes, onchange: (e) => { prefs.minutes = Math.max(1, +e.target.value || 10); save(); } }));
    const modeDesc = h('p', { class: 'muted' });
    const setModeDesc = () => { modeDesc.textContent = { practice: T('Instant feedback, hints and audio replay.', 'Retroalimentación inmediata, pistas y audio.'), quiz: T('No hints, one attempt. Results and review at the end.', 'Sin pistas, un intento. Resultados y revisión al final.'), exam: T('Timed and mixed. Final grade and a per-kana accuracy report.', 'Con tiempo y mezclado. Nota final e informe de precisión por kana.') }[prefs.mode]; minutesField.hidden = prefs.mode !== 'exam'; };

    const noWords = !nWords ? h('div', { class: 'callout' }, h('p', null, T('You have no words yet. Kana activities work without words; for the rest, add some.', 'Aún no tienes palabras. Las actividades de kana funcionan sin palabras; para el resto, agrega algunas.')),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { addSampleWords(); U.toast(T('Added sample words.', 'Palabras de ejemplo agregadas.')); hub(host); } }, T('Add the sample words (ねこ, いぬ, さかな…)', 'Agregar palabras de ejemplo (ねこ, いぬ, さかな…)')), h('a', { class: 'btn ghost', href: '#/vocab' }, T('Add my own words', 'Agregar mis palabras')))) : null;

    const view = h('div', { class: 'page' },
      h('header', { class: 'page-head' }, h('h1', null, T('Practice', 'Práctica')), h('p', { class: 'lead' }, T('Choose what to study, then generate a mix of activities.', 'Elige qué estudiar y genera una mezcla de actividades.'))),
      h('section', { class: 'daily' },
        h('div', null, h('h2', null, T('Daily 10 minutes', '10 minutos diarios')),
          h('p', null, T(plan.dueKana + ' kana and ' + plan.dueWords + ' words are due' + (plan.fresh && plan.dueKana < 8 ? ', plus ' + plan.fresh + ' new kana.' : '.'), plan.dueKana + ' kana y ' + plan.dueWords + ' palabras pendientes' + (plan.fresh && plan.dueKana < 8 ? ', más ' + plan.fresh + ' kana nuevos.' : '.')))),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => launch(P.dailyPlan().cfg) }, T('Start daily session', 'Empezar sesión diaria')),
          h('button', { class: 'btn', type: 'button', onclick: () => launchSpeed() }, T('Speed round (60 s)', 'Ronda rápida (60 s)')),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => practiceBank() }, T('Mistake bank', 'Banco de errores')),
          h('a', { class: 'btn ghost', href: '#/worksheet' }, T('Printable worksheet', 'Hoja imprimible')))),
      noWords,
      h('form', { class: 'gen', onsubmit: (e) => { e.preventDefault(); generate(); } },
        h('fieldset', { class: 'fs' }, h('legend', null, T('Words', 'Palabras')),
          nWords ? h('div', { class: 'chips' }, sets.filter((s) => s[2] > 0 || s[0] === 'all').map((s) => chk(s[1], prefs.sets.includes(s[0]), (on) => toggle(prefs.sets, s[0], on), '(' + s[2] + ')'))) : h('p', { class: 'muted' }, T('No words yet.', 'Sin palabras todavía.'))),
        h('fieldset', { class: 'fs' }, h('legend', null, T('Kana', 'Kana')),
          h('div', { class: 'chips' },
            chk('ひらがな', prefs.scripts.includes('hira'), (on) => { toggle(prefs.scripts, 'hira', on); updateKana(); }),
            chk('カタカナ', prefs.scripts.includes('kata'), (on) => { toggle(prefs.scripts, 'kata', on); updateKana(); })),
          h('div', { class: 'chips' }, [['basic', T('Basic 46', 'Básicos 46')], ['dakuten', T('Dakuten', 'Dakuten')], ['handakuten', T('Handakuten', 'Handakuten')], ['small', T('Small kana', 'Kana pequeños')], ['yoon', T('Combinations (yoon)', 'Combinaciones (yōon)')]].map(([g, l]) => chk(l, prefs.groups.includes(g), (on) => { toggle(prefs.groups, g, on); updateKana(); }))),
          h('label', { class: 'inline' }, T('Which kana: ', 'Cuáles kana: '), h('select', { onchange: (e) => { prefs.only = e.target.value; save(); updateKana(); } }, [['all', T('All in this selection', 'Todos de esta selección')], ['unknown', T('Not marked as known', 'No marcados como conocidos')], ['known', T('Marked as known', 'Marcados como conocidos')], ['weak', T('My weak kana', 'Mis kana débiles')]].map(([v, l]) => h('option', { value: v, selected: prefs.only === v }, l)))),
          kanaSummary),
        h('fieldset', { class: 'fs' }, h('legend', null, T('How many questions', 'Cuántas preguntas')),
          h('div', { class: 'chips' }, [5, 10, 20, 'all'].map((n) => radio('len', n === 'all' ? T('All', 'Todo') : String(n), prefs.length === n, () => { prefs.length = n; save(); })))),
        h('div', { class: 'fs-group' }, h('div', { class: 'row between' }, h('h2', null, T('Activities', 'Actividades')),
          h('div', { class: 'row' }, [[T('Writing', 'Escritura'), 'write'], [T('Kana', 'Kana'), 'kana'], [T('Recognition', 'Reconocimiento'), 'recog'], [T('Everything', 'Todo'), 'all']].map(([l, k]) => h('button', { class: 'btn ghost sm', type: 'button', onclick: () => setActs(P.PRESETS[k]) }, l)))), actView),
        h('fieldset', { class: 'fs' }, h('legend', null, T('Mode', 'Modo')),
          h('div', { class: 'chips' }, [['practice', T('Practice', 'Práctica')], ['quiz', T('Quiz', 'Quiz')], ['exam', T('Exam simulator', 'Simulador de examen')]].map(([m, l]) => radio('mode', l, prefs.mode === m, () => { prefs.mode = m; save(); setModeDesc(); }))), modeDesc, minutesField),
        h('div', { class: 'row actions' }, h('button', { class: 'btn primary lg', type: 'submit' }, T('Generate practice', 'Generar práctica')))));
    clear(host).appendChild(view);
    updateKana(); setModeDesc();

    function generate() {
      save();
      launch({ sets: prefs.sets, kana: { scripts: prefs.scripts, groups: prefs.groups, only: prefs.only }, length: prefs.length, acts: prefs.acts, mode: prefs.mode, minutes: prefs.mode === 'exam' ? prefs.minutes : undefined, prioritize: true });
    }
    function launchSpeed() {
      launch({ kana: { scripts: prefs.scripts.length ? prefs.scripts : ['hira'], groups: prefs.groups.length ? prefs.groups : ['basic'], only: 'all' }, acts: ['k_speed'], length: 1, mode: 'practice' });
    }
    function practiceBank() {
      const keys = Object.keys(D.mistakes);
      if (!keys.length) { U.toast(T('Your mistake bank is empty.', 'Tu banco de errores está vacío.')); return; }
      launch({ kanaKeys: keys.filter((k) => k.startsWith('k:')), wordIds: keys.filter((k) => k.startsWith('w:')).map((k) => k.slice(2)), acts: P.PRESETS.daily, length: 10, mode: 'practice', prioritize: true });
    }
  }

  MS.session = { launch, hub, renderRun, cleanup: stopAll, addSampleWords, SAMPLE_WORDS, get current() { return current; }, reset() { current = null; } };
})();
