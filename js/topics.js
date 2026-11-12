/* topics.js: Vocabulary sets (ready-made topic lists you can add to Words) and the Numbers trainer. */
(function () {
  const MS = (window.MS = window.MS || {});

  /* ---------- numbers: pure logic (also used by tools/list-audio.js, no DOM) ---------- */
  const ONES = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
  const HUND = ['', 'ひゃく', 'にひゃく', 'さんびゃく', 'よんひゃく', 'ごひゃく', 'ろっぴゃく', 'ななひゃく', 'はっぴゃく', 'きゅうひゃく'];
  const THOU = ['', 'せん', 'にせん', 'さんぜん', 'よんせん', 'ごせん', 'ろくせん', 'ななせん', 'はっせん', 'きゅうせん'];
  const ALT_ONES = { 4: ['し'], 7: ['しち'], 9: ['く'] };
  const ALT_TENS = { 7: ['しち'] };
  function below10k(n, onesTab, tensTab) {
    const t = Math.floor(n / 1000), hd = Math.floor(n / 100) % 10, te = Math.floor(n / 10) % 10, o = n % 10;
    return THOU[t] + HUND[hd] + (te ? (te === 1 ? '' : tensTab[te]) + 'じゅう' : '') + onesTab[o];
  }
  /* The usual reading: 1234 → せんにひゃくさんじゅうよん */
  function toKana(n) {
    n = Math.floor(Math.abs(n));
    if (n === 0) return 'ゼロ';
    const man = Math.floor(n / 10000), rest = n % 10000;
    return (man ? below10k(man, ONES, ONES) + 'まん' : '') + below10k(rest, ONES, ONES);
  }
  /* Every reading we accept as correct (し/しち/く variants, れい for 0). */
  function readings(n) {
    n = Math.floor(Math.abs(n));
    if (n === 0) return ['ゼロ', 'れい'];
    const out = new Set([toKana(n)]);
    const man = Math.floor(n / 10000), rest = n % 10000;
    const pre = man ? below10k(man, ONES, ONES) + 'まん' : '';
    const o = rest % 10, te = Math.floor(rest / 10) % 10;
    const onesTabs = [ONES].concat((ALT_ONES[o] || []).map((a) => Object.assign([], ONES, { [o]: a })));
    const tensTabs = [ONES].concat((ALT_TENS[te] || []).map((a) => Object.assign([], ONES, { [te]: a })));
    onesTabs.forEach((ot) => tensTabs.forEach((tt) => out.add(pre + below10k(rest, ot, tt))));
    return [...out];
  }
  /* Numbers worth pre-recording: 0–100, the hundreds, the thousands, 10000. */
  function audioList() {
    const ns = [];
    for (let i = 0; i <= 100; i++) ns.push(i);
    for (let i = 2; i <= 9; i++) ns.push(i * 100, i * 1000);
    ns.push(1000, 10000);
    return ns.map(toKana);
  }
  MS.numbers = { toKana, readings, audioList };
  if (typeof document === 'undefined' || !MS.ui) return;   // loaded by a tool outside the browser

  const U = MS.ui, K = MS.kana;
  const { h, T, L, clear, toast, speakBtn, icon } = U;
  const D = () => MS.store.data;

  /* ---------- Vocabulary sets page ---------- */
  function setWords(set) { return set.words.map(([w, en, es]) => ({ w, m: T(en, es) })); }
  function addSet(set) {
    const d = D(), lesson = L(set.title), have = new Set(d.words.map((x) => x.w));
    let n = 0;
    setWords(set).forEach((x) => {
      if (have.has(x.w)) return;
      d.words.push({ id: MS.store.uid(), w: x.w, m: x.m, lesson, ex: '', note: '', img: '', hard: false, added: Date.now(), by: (d.shared && d.shared.name) || '' });
      n++;
    });
    MS.store.save();
    return n;
  }
  function sets(host) {
    const draw = () => {
      const have = new Set(D().words.map((x) => x.w));
      clear(host).appendChild(h('div', { class: 'page' },
        h('header', { class: 'page-head' }, h('h1', null, T('Vocabulary sets', 'Conjuntos de vocabulario')),
          h('p', { class: 'lead' }, T('Ready-made beginner words by topic. Add a set to your Words to practise it (and to share it, if you are in a study room). Then use “Find pictures” on the Words page for picture practice.', 'Palabras básicas por tema. Agrega un conjunto a tus Palabras para practicarlo (y compartirlo, si estás en una sala de estudio). Luego usa “Buscar imágenes” en Palabras para practicar con imágenes.'))),
        h('p', null, h('a', { class: 'btn', href: '#/numbers' }, T('Numbers trainer', 'Entrenador de números'))),
        MS.vocabSets.map((set) => {
          const ws = setWords(set), missing = ws.filter((x) => !have.has(x.w)).length;
          return h('section', { class: 'vset' },
            h('div', { class: 'row between wrap' }, h('h2', null, L(set.title), ' ', h('span', { class: 'muted' }, ws.length - missing + ' / ' + ws.length)),
              h('div', { class: 'row wrap' },
                h('button', { class: 'btn' + (missing ? ' primary' : ''), type: 'button', disabled: !missing, onclick: () => { const n = addSet(set); toast(T(n + ' words added to Words.', n + ' palabras agregadas a Palabras.')); draw(); } },
                  missing ? T('Add to my words (' + missing + ')', 'Agregar a mis palabras (' + missing + ')') : T('All in your words', 'Todas en tus palabras')),
                h('button', { class: 'btn ghost', type: 'button', onclick: () => {
                  addSet(set);
                  MS.session.launch({ sets: ['lesson:' + L(set.title)], acts: ['r_word2meaning', 'r_meaning2word', 'r_audio2meaning', 'r_pic2word', 'r_word2pic', 'w_meaning', 'r_match'], length: 10, mode: 'practice', prioritize: true });
                } }, T('Practise', 'Practicar')))),
            h('ul', { class: 'vset-list' }, ws.map((x) => h('li', { class: have.has(x.w) ? 'have' : '' }, speakBtn(x.w), h('span', { class: 'w-ja', lang: 'ja' }, x.w), h('span', { class: 'muted' }, x.m)))));
        })));
    };
    draw();
  }

  /* ---------- Numbers trainer ---------- */
  const RANGES = [10, 100, 1000, 10000, 99999];
  const fmt = (n) => n.toLocaleString('en-US');
  function numbers(host) {
    const d = D();
    const prefs = d.numbersPrefs || (d.numbersPrefs = { max: 100, mode: 'read' });
    let cur = null, score = { ok: 0, n: 0 }, t0 = Date.now();
    const qBox = h('div', { class: 'qcard' });
    const scoreEl = h('span', { class: 'muted' });

    const rand = () => {
      // Lean towards trickier numbers: skip 0 most of the time, and favour round hundreds/thousands now and then.
      const max = prefs.max;
      let n = Math.floor(Math.random() * (max + 1));
      if (max >= 1000 && Math.random() < 0.25) n = (1 + Math.floor(Math.random() * 9)) * (max >= 10000 && Math.random() < 0.5 ? 1000 : 100);
      if (n === 0 && Math.random() < 0.8) n = 1 + Math.floor(Math.random() * max);
      return n;
    };
    function options(n) {
      const set = new Set([n]);
      const near = [n + 1, n - 1, n + 10, n - 10, n + 100, n - 100, Number(String(n).split('').reverse().join('')), n * 10, Math.floor(n / 10)];
      for (const x of near.sort(() => Math.random() - 0.5)) { if (set.size >= 4) break; if (x >= 0 && x <= Math.max(prefs.max, 10) && !set.has(x)) set.add(x); }
      while (set.size < 4) set.add(Math.floor(Math.random() * (prefs.max + 1)));
      return [...set].sort(() => Math.random() - 0.5);
    }
    function result(ok, given) {
      score.n++; if (ok) score.ok++;
      MS.store.logActivity((Date.now() - t0) / 1000, 1, ok ? 1 : 0); t0 = Date.now();
      scoreEl.textContent = T('Score ', 'Puntos ') + score.ok + ' / ' + score.n;
      const reading = toKana(cur);
      qBox.appendChild(h('div', { class: 'fb ' + (ok ? 'ok' : 'bad') },
        h('p', null, h('strong', null, ok ? T('Correct!', '¡Correcto!') : T('Not quite.', 'Casi.')), given ? ' ' + T('You wrote: ', 'Escribiste: ') + given : ''),
        h('p', { class: 'row wrap' }, speakBtn(reading), h('span', { class: 'num-big' }, fmt(cur)), ' = ', h('span', { lang: 'ja', class: 'w-ja' }, reading),
          h('span', { class: 'muted' }, '(' + K.kanaToRomaji(reading) + ')')),
        h('div', { class: 'row actions' }, h('button', { class: 'btn primary', type: 'button', id: 'num-next', onclick: next }, T('Next', 'Siguiente')))));
      setTimeout(() => { const b = U.$('#num-next'); b && b.focus(); }, 30);
    }
    function next() {
      cur = rand(); t0 = Date.now();
      clear(qBox);
      const reading = toKana(cur);
      if (prefs.mode === 'read') {
        qBox.appendChild(h('p', { class: 'q-task' }, T('Write this number in hiragana.', 'Escribe este número en hiragana.')));
        qBox.appendChild(h('p', { class: 'q-big num-big' }, fmt(cur)));
        const kbd = MS.Keyboard({ compact: true, script: 'hira', onSubmit: () => check(), label: T('Your answer', 'Tu respuesta') });
        const check = () => {
          const v = kbd.getValue().trim(); if (!v) { kbd.focus(); return; }
          kbd.lock(true); btns.querySelectorAll('button').forEach((b) => (b.disabled = true));
          result(readings(cur).some((r) => K.checkAnswer(v, r).ok), v);
        };
        const btns = h('div', { class: 'row actions' }, h('button', { class: 'btn primary', type: 'button', onclick: check }, T('Check', 'Comprobar')),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => { kbd.lock(true); btns.querySelectorAll('button').forEach((b) => (b.disabled = true)); result(false, ''); } }, T("I don't know", 'No sé')));
        qBox.append(kbd.el, btns);
        setTimeout(() => kbd.focus(), 30);
      } else if (prefs.mode === 'choose') {
        qBox.appendChild(h('p', { class: 'q-task' }, T('Which is the right reading?', '¿Cuál es la lectura correcta?')));
        qBox.appendChild(h('p', { class: 'q-big num-big' }, fmt(cur)));
        const opts = options(cur), list = h('div', { class: 'opts' });
        opts.forEach((n, i) => list.appendChild(h('button', { class: 'opt ja', type: 'button', lang: 'ja', onclick: (e) => {
          list.querySelectorAll('button').forEach((b, j) => { b.disabled = true; if (opts[j] === cur) b.classList.add('right'); });
          if (n !== cur) e.currentTarget.classList.add('wrong');
          result(n === cur, '');
        } }, h('span', { class: 'num', 'aria-hidden': 'true' }, String(i + 1)), h('span', { class: 'opt-text' }, toKana(n)))));
        qBox.appendChild(list);
      } else {
        qBox.appendChild(h('p', { class: 'q-task' }, T('Listen and write the number with digits.', 'Escucha y escribe el número con cifras.')));
        qBox.appendChild(h('div', { class: 'q-audio' }, speakBtn(reading, { label: T('Play', 'Escuchar') }), speakBtn(reading, { slow: true, label: T('Slow', 'Lento') })));
        const inp = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', class: 'num-in', 'aria-label': T('Number', 'Número'), onkeydown: (e) => { if (e.key === 'Enter') check(); } });
        const check = () => {
          const v = inp.value.replace(/[^\d]/g, ''); if (!v) { inp.focus(); return; }
          inp.disabled = true; btns.querySelectorAll('button').forEach((b) => (b.disabled = true));
          result(+v === cur, fmt(+v));
        };
        const btns = h('div', { class: 'row actions' }, h('button', { class: 'btn primary', type: 'button', onclick: check }, T('Check', 'Comprobar')),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => { inp.disabled = true; btns.querySelectorAll('button').forEach((b) => (b.disabled = true)); result(false, ''); } }, T("I don't know", 'No sé')));
        qBox.append(inp, btns);
        setTimeout(() => { inp.focus(); MS.ui.Speech.speak(reading); }, 300);
      }
    }
    const radio = (name, val, cur_, label, on) => h('label', { class: 'chip' }, h('input', { type: 'radio', name, checked: cur_ === val, onchange: () => on(val) }), h('span', null, label));
    const setP = (k) => (v) => { prefs[k] = v; MS.store.save(); score = { ok: 0, n: 0 }; scoreEl.textContent = ''; next(); };
    const table = (rows) => h('table', { class: 'tbl' }, h('tbody', null, rows.map((n) => h('tr', null, h('td', null, fmt(n)), h('td', { lang: 'ja' }, speakBtn(toKana(n)), ' ', toKana(n)), h('td', { class: 'muted' }, K.kanaToRomaji(toKana(n)))))));
    clear(host).appendChild(h('div', { class: 'page' },
      h('header', { class: 'page-head' }, h('h1', null, T('Numbers', 'Números')),
        h('p', { class: 'lead' }, T('Read, choose and listen to Japanese numbers. Watch the sound changes: さんびゃく, ろっぴゃく, はっぴゃく, さんぜん, はっせん.', 'Lee, elige y escucha números en japonés. Atención a los cambios de sonido: さんびゃく, ろっぴゃく, はっぴゃく, さんぜん, はっせん.'))),
      h('div', { class: 'ws-controls' },
        h('fieldset', { class: 'fs' }, h('legend', null, T('Exercise', 'Ejercicio')), h('div', { class: 'chips' },
          radio('nm', 'read', prefs.mode, T('Number → write it', 'Número → escríbelo'), setP('mode')),
          radio('nm', 'choose', prefs.mode, T('Number → choose the reading', 'Número → elige la lectura'), setP('mode')),
          radio('nm', 'listen', prefs.mode, T('Listen → write the digits', 'Escucha → escribe las cifras'), setP('mode')))),
        h('fieldset', { class: 'fs' }, h('legend', null, T('Range', 'Rango')), h('div', { class: 'chips' },
          RANGES.map((m) => radio('nr', m, prefs.max, '0 – ' + fmt(m), setP('max')))))),
      h('div', { class: 'row between' }, h('h2', null, T('Practice', 'Práctica')), scoreEl),
      qBox,
      h('details', { class: 'paste' }, h('summary', null, T('Reference table', 'Tabla de referencia')),
        h('div', { class: 'num-ref' }, table([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), table([11, 20, 30, 40, 70, 90, 99]), table([100, 200, 300, 400, 600, 800, 900]), table([1000, 3000, 8000, 10000, 12345])),
        h('p', { class: 'muted' }, T('Also accepted: し for 4, しち for 7, く for 9, れい for 0.', 'También se aceptan: し para 4, しち para 7, く para 9, れい para 0.')))));
    next();
  }

  MS.topics = { sets, numbers, addSet };
})();
