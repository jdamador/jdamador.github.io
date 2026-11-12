/* app.js — shell (rail, search, theme, language), router, and the Japanese views. */
(function () {
  const MS = (window.MS = window.MS || {});
  const U = MS.ui, K = MS.kana, P = MS.practice;
  const { h, $, T, L, clear, icon, toast, speakBtn, Speech } = U;
  const D = () => MS.store.data;
  const save = () => MS.store.save();
  const uniq = (a) => Array.from(new Set(a));

  const NAV = [
    { group: { en: 'Japanese', es: 'Japonés' }, items: [
      { id: 'home', path: '/home', en: 'Today', es: 'Hoy' },
      { id: 'charts', path: '/charts', en: 'Kana charts', es: 'Tablas de kana' },
      { id: 'rules', path: '/rules', en: 'Rules', es: 'Reglas' },
      { id: 'keyboard', path: '/keyboard', en: 'Kana keyboard', es: 'Teclado de kana' },
      { id: 'vocab', path: '/vocab', en: 'Words', es: 'Palabras' },
      { id: 'shared', path: '/shared', en: 'Shared words', es: 'Palabras compartidas' },
      { id: 'practice', path: '/practice', en: 'Practice', es: 'Práctica' },
      { id: 'progress', path: '/progress', en: 'Progress', es: 'Progreso' },
      { id: 'plan', path: '/plan', en: 'Study plan', es: 'Plan de estudio' },
      { id: 'resources', path: '/resources', en: 'Resources', es: 'Recursos' },
    ] },
    { group: { en: 'English', es: 'Inglés' }, items: [
      { id: 'en', path: '/en', en: 'Level and goals', es: 'Nivel y metas' },
      { id: 'enplan', path: '/en/plan', en: 'Weekly plan', es: 'Plan semanal' },
      { id: 'entools', path: '/en/tools', en: 'Tools', es: 'Herramientas' },
      { id: 'enres', path: '/en/resources', en: 'Resources', es: 'Recursos' },
    ] },
    { group: { en: 'This site', es: 'Este sitio' }, items: [{ id: 'data', path: '/data', en: 'Data and help', es: 'Datos y ayuda' }] },
  ];
  /* English sections are hidden unless MS.config.english is on (see js/config.js). */
  const englishOn = () => !!(MS.config && MS.config.english);
  const navGroups = () => NAV.filter((g) => englishOn() || g.group.en !== 'English');

  /* ---------- helpers ---------- */
  const isKataCh = (c) => K.isKata(c[0]);
  const scriptName = (s) => ({ hira: T('Hiragana only', 'Solo hiragana'), kata: T('Katakana only', 'Solo katakana'), mixed: T('Mixed', 'Mixto'), none: T('No letters', 'Sin letras'), empty: '' }[s] || '');
  const kanaEntryNote = (ch) => ({
    は: T('Read “wa” when it is a particle (わたしは…).', 'Se lee “wa” cuando es partícula (わたしは…).'),
    を: T('Read “o”. Only used as a particle (ほんを…).', 'Se lee “o”. Solo se usa como partícula (ほんを…).'),
    へ: T('Read “e” when it is a particle (がっこうへ…).', 'Se lee “e” cuando es partícula (がっこうへ…).'),
    ぢ: T('Sounds the same as じ. Rare.', 'Suena igual que じ. Poco común.'), づ: T('Sounds the same as ず. Rare.', 'Suena igual que ず. Poco común.'),
    っ: T('A pause that doubles the next consonant (きって).', 'Una pausa que duplica la consonante siguiente (きって).'), ッ: T('A pause that doubles the next consonant (ベッド).', 'Una pausa que duplica la consonante siguiente (ベッド).'),
    ん: T('A nasal sound, a syllable on its own. Never starts a word.', 'Un sonido nasal, una sílaba por sí sola. Nunca empieza una palabra.'), ン: T('A nasal sound, a syllable on its own.', 'Un sonido nasal, una sílaba por sí sola.'),
  }[ch] || '');
  const accOf = (key) => MS.srs.recentAccuracy(MS.srs.get(key));
  const heatClass = (acc) => (acc == null ? 'h0' : acc >= 0.9 ? 'h4' : acc >= 0.75 ? 'h3' : acc >= 0.5 ? 'h2' : 'h1');
  const totalSec = () => Object.values(D().activity).reduce((a, b) => a + b.sec, 0);
  const fmtDur = (sec) => (sec >= 3600 ? Math.floor(sec / 3600) + ' h ' + Math.round((sec % 3600) / 60) + ' min' : Math.round(sec / 60) + ' min');

  /* A masu tile with stroke order for a kana entry/char. Returns { el, view(s) } */
  function kanaStage(ch, opts) {
    opts = opts || {};
    const chars = [...ch];
    const views = chars.map((c) => U.StrokeView(c));
    const ok = views.every((v) => v.available);
    const row = h('div', { class: 'sv-row' + (opts.big ? ' big' : '') }, ok ? views.map((v) => v.el) : h('div', { class: 'masu-row', style: { '--cell': (opts.big ? 170 : 120) + 'px' } }, chars.map((c) => U.masu(c))));
    if (ok) views.forEach((v) => v.showAll());
    const play = () => { if (!ok) return; views.forEach((v) => v.reset()); let i = 0; const next = () => { if (i < views.length) views[i++].play(next); }; next(); };
    const step = () => { const v = views.find((x) => x.shown < x.count) || null; if (v) v.step(); else { views.forEach((x) => x.reset()); views[0].step(); } };
    const ctrl = h('div', { class: 'row actions' },
      ok ? h('button', { class: 'btn', type: 'button', onclick: play }, icon('play'), T('Play strokes', 'Ver trazos')) : null,
      ok ? h('button', { class: 'btn ghost', type: 'button', onclick: step }, T('Next stroke', 'Siguiente trazo')) : null,
      speakBtn(ch, { label: T('Listen', 'Escuchar') }), speakBtn(ch, { slow: true, label: T('Slow', 'Lento') }));
    const el = h('div', { class: 'kstage' }, row, ctrl, ok ? null : h('p', { class: 'note' }, T('Stroke data is missing for this character, so only a model is shown.', 'Faltan los datos de trazos de este carácter; solo se muestra un modelo.')));
    return { el, play, ok };
  }

  /* ================= HOME ================= */
  function pickTodayKana() {
    const dueK = MS.srs.dueKeys('k:');
    if (dueK.length) return dueK[0].slice(2);
    for (const s of ['hira', 'kata']) for (const e of K.KANA.filter((x) => x.g === 'basic')) { const ch = s === 'kata' ? e.k : e.h; if (!D().known[ch] && !D().srs['k:' + ch]) return ch; }
    const b = K.KANA.filter((x) => x.g === 'basic'); return b[Math.floor(Math.random() * b.length)].h;
  }

  function home(host) {
    const d = D();
    const dueK = MS.srs.dueKeys('k:').length;
    const dueW = MS.srs.dueKeys('w:').filter((k) => d.words.some((w) => 'w:' + w.id === k)).length + d.words.filter((w) => !d.srs['w:' + w.id]).length;
    const mist = Object.keys(d.mistakes).length;
    const basic = K.KANA.filter((e) => e.g === 'basic');
    const knownH = basic.filter((e) => d.known[e.h]).length, knownK = basic.filter((e) => d.known[e.k]).length;
    const learned = d.words.filter((w) => MS.srs.isLearned(d.srs['w:' + w.id])).length;
    const seenK = Object.keys(d.srs).filter((k) => k.startsWith('k:'));
    const weak = seenK.map((k) => ({ k, st: d.srs[k] })).filter((x) => x.st.seen >= 2 && MS.srs.recentAccuracy(x.st) < 0.8).sort((a, b) => MS.srs.recentAccuracy(a.st) - MS.srs.recentAccuracy(b.st)).slice(0, 8);

    const ch = pickTodayKana(); const entry = K.entryOf(ch);
    const stage = kanaStage(ch, { big: true });
    const todayItems = [];
    if (dueK + dueW > 0) todayItems.push({ t: T(dueK + ' kana and ' + dueW + ' words are ready to review', dueK + ' kana y ' + dueW + ' palabras listos para repasar'), href: '#/practice', btn: T('Start the daily 10 minutes', 'Empezar los 10 minutos diarios'), run: () => MS.session.launch(P.dailyPlan().cfg) });
    const fresh = basic.filter((e) => !d.known[e.h] && !d.srs['k:' + e.h]).slice(0, 5);
    if (fresh.length) todayItems.push({ t: T('Learn new hiragana: ', 'Aprende hiragana nuevo: ') + fresh.map((e) => e.h).join(' '), href: '#/charts?k=' + fresh[0].h });
    if (mist) todayItems.push({ t: T(mist + ' items in your mistake bank', mist + ' elementos en tu banco de errores'), href: '#/practice' });
    if (!d.words.length) todayItems.push({ t: T('Add the words from your class', 'Agrega las palabras de tu clase'), href: '#/vocab' });
    if (!d.quizDate) todayItems.push({ t: T('Enter your next quiz date to get a countdown plan', 'Ingresa la fecha de tu próximo quiz para obtener un plan con cuenta regresiva'), href: '#quiz' });
    if (!todayItems.length) todayItems.push({ t: T('Nothing is due. A short speed round keeps kana fresh.', 'Nada pendiente. Una ronda rápida mantiene frescos los kana.'), href: '#/practice' });

    const quizBox = h('section', { class: 'quiz', id: 'quiz' });
    const drawQuiz = () => {
      clear(quizBox);
      quizBox.appendChild(h('h2', null, T('Quiz countdown', 'Cuenta regresiva del quiz')));
      quizBox.appendChild(h('div', { class: 'row wrap' }, h('label', { class: 'field' }, h('span', { class: 'field-l' }, T('Quiz or exam date', 'Fecha del quiz o examen')), h('input', { type: 'date', value: d.quizDate || '', onchange: (e) => { d.quizDate = e.target.value; save(); drawQuiz(); } })),
        d.quizDate ? h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { d.quizDate = ''; save(); drawQuiz(); } }, T('Remove date', 'Quitar fecha')) : null));
      if (!d.quizDate) { quizBox.appendChild(h('p', { class: 'muted' }, T('Enter the date and I will build a short plan backwards from it.', 'Ingresa la fecha y armaré un plan corto hacia atrás desde ella.'))); return; }
      const qd = new Date(d.quizDate + 'T00:00:00'); const today = new Date(); today.setHours(0, 0, 0, 0);
      const days = Math.round((qd - today) / 86400000);
      quizBox.appendChild(h('p', { class: 'countdown' }, days > 0 ? T(days + ' days to go', 'Faltan ' + days + ' días') : days === 0 ? T('The quiz is today. Good luck.', 'El quiz es hoy. Mucha suerte.') : T('This date has passed. Enter the next one.', 'Esta fecha ya pasó. Ingresa la siguiente.')));
      if (days < 0) return;
      const ms = MS.content.countdown.filter((m) => -m.d <= days);
      const list = h('ul', { class: 'milestones' });
      ms.forEach((m) => {
        const date = new Date(qd); date.setDate(date.getDate() + m.d);
        const k = 'quiz:' + d.quizDate + ':' + m.d;
        list.appendChild(h('li', { class: date < today ? 'past' : '' }, h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!d.checks[k], onchange: (e) => { if (e.target.checked) d.checks[k] = true; else delete d.checks[k]; save(); } }),
          h('span', null, h('strong', null, m.d === 0 ? T('Quiz day', 'Día del quiz') : U.fmtDate(date)), ' ' + L(m)))));
      });
      if (days > 14) list.appendChild(h('li', null, h('span', { class: 'muted' }, T('Until then: the daily 10 minutes, five days a week.', 'Hasta entonces: los 10 minutos diarios, cinco días por semana.'))));
      quizBox.appendChild(list);
      quizBox.appendChild(h('p', { class: 'muted' }, T('Spaced days work better than one long night. This plan is a suggestion; follow your teacher’s instructions first.', 'Días espaciados funcionan mejor que una noche larga. Este plan es una sugerencia; sigue primero las instrucciones de tu profesor.')));
    };

    const voiceNote = Speech.available() ? null : h('p', { class: 'note' }, T('Pronunciation needs a Japanese voice. ', 'La pronunciación necesita una voz japonesa. '), h('button', { class: 'link', type: 'button', onclick: () => Speech.explain() }, T('How to add one', 'Cómo agregarla')));

    const view = h('div', { class: 'page home' },
      h('header', { class: 'home-top' },
        h('div', { class: 'tile-col' }, h('p', { class: 'muted' }, entry ? T('Kana to look at today', 'Kana para mirar hoy') : ''), stage.el,
          h('p', { class: 'tile-cap' }, h('span', { lang: 'ja' }, entry ? (isKataCh(ch) ? entry.k : entry.h) : ''), ' · ', entry ? entry.r : ''), h('a', { class: 'btn ghost sm', href: '#/charts?k=' + encodeURIComponent(ch) }, T('Open on the chart', 'Abrir en la tabla'))),
        h('div', { class: 'today-col' }, h('h1', null, T('Study today', 'Estudiar hoy')),
          h('ul', { class: 'todo' }, todayItems.map((it) => h('li', null, it.run ? h('div', null, h('span', null, it.t), h('div', null, h('button', { class: 'btn primary', type: 'button', onclick: it.run }, it.btn))) : h('a', { href: it.href }, it.t)))),
          voiceNote)),
      h('section', { class: 'facts' },
        h('h2', { class: 'sr-only' }, T('Your progress', 'Tu progreso')),
        h('dl', null,
          h('div', null, h('dt', null, T('Streak', 'Racha')), h('dd', null, T(MS.store.streak() + ' days', MS.store.streak() + ' días'))),
          h('div', null, h('dt', null, T('Kana marked known', 'Kana marcados como conocidos')), h('dd', null, T('Hiragana ' + knownH + '/46 · Katakana ' + knownK + '/46', 'Hiragana ' + knownH + '/46 · Katakana ' + knownK + '/46'))),
          h('div', null, h('dt', null, T('Words learned', 'Palabras aprendidas')), h('dd', null, learned + ' / ' + d.words.length), h('dd', { class: 'muted' }, T('learned = next review a week or more away', 'aprendida = próximo repaso en una semana o más'))),
          h('div', null, h('dt', null, T('Time practised', 'Tiempo practicado')), h('dd', null, fmtDur(totalSec()))))),
      h('section', null, h('h2', null, T('Weakest kana', 'Kana más débiles')),
        weak.length ? h('div', { class: 'weak-row' }, weak.map((x) => h('a', { class: 'weak ' + heatClass(MS.srs.recentAccuracy(x.st)), href: '#/charts?k=' + encodeURIComponent(x.k.slice(2)) }, h('span', { class: 'ja', lang: 'ja' }, x.k.slice(2)), h('small', null, Math.round(MS.srs.recentAccuracy(x.st) * 100) + '%')))) : h('p', { class: 'muted' }, T('Nothing weak yet. Weak kana show up here after a few practice answers.', 'Aún nada débil. Los kana débiles aparecen aquí después de algunas respuestas.'))),
      quizBox);
    clear(host).appendChild(view);
    drawQuiz();
    if (location.hash.endsWith('#quiz')) quizBox.scrollIntoView();
  }

  /* ================= CHARTS ================= */
  function charts(host, query) {
    const d = D();
    let script = d.settings.chartScript || 'hira';
    let showR = d.settings.chartRomaji !== false;
    let sel = query.k ? K.entryOf(query.k) ? query.k : null : null;
    if (sel && isKataCh(sel)) script = 'kata'; else if (sel) script = 'hira';
    const detail = h('aside', { class: 'detail', 'aria-live': 'polite' });
    const body = h('div', { class: 'chart-body' });
    const chOf = (e) => (script === 'kata' ? e.k : e.h);

    function tile(e) {
      if (!e) return h('span', { class: 'kgap', 'aria-hidden': 'true' });
      const c = chOf(e);
      return h('button', { type: 'button', class: 'ktile' + (d.known[c] ? ' known' : '') + (sel === c ? ' sel' : ''), lang: 'ja', 'aria-pressed': sel === c, 'aria-label': c + ' ' + e.r + (d.known[c] ? ' (' + T('known', 'conocido') + ')' : ''), onclick: () => select(c) }, h('span', { class: 'kt-ja' }, c), showR ? h('span', { class: 'kt-r' }, e.r) : null);
    }
    function section(title, cells, cols, rows, extra, byRow) {
      return h('section', { class: 'kgroup' }, h('h2', null, title), extra || null, h('div', { class: 'kgrid' + (byRow ? ' byrow' : ''), 'data-cols': cols, style: { '--cols': cols, '--rows': rows } }, cells.map(tile)));
    }
    function byH(hch) { return K.BY_H[hch] || null; }
    function draw() {
      clear(body);
      // basic
      const basicCells = [];
      K.SERIES.forEach(([, chars]) => [...chars].forEach((c) => basicCells.push(c === '.' ? null : byH(c))));
      body.appendChild(section(T('Basic 46', 'Básicos 46'), basicCells, 10, 5, null));
      body.appendChild(h('div', { class: 'kgrid single' }, tile(byH('ん'))));
      // dakuten + handakuten
      const dk = [];
      [].concat(K.DAKU, K.HANDAKU).forEach(([, chars]) => [...chars].forEach((c) => dk.push(byH(c))));
      body.appendChild(section(T('Dakuten and handakuten', 'Dakuten y handakuten'), dk, 5, 5, h('p', { class: 'muted' }, T('ぢ and づ sound like じ and ず. ゔ (ヴ) is only for foreign words.', 'ぢ y づ suenan como じ y ず. ゔ (ヴ) solo se usa en palabras extranjeras.'))));
      body.appendChild(h('div', { class: 'kgrid single' }, tile(byH('ゔ'))));
      // small
      body.appendChild(section(T('Small kana', 'Kana pequeños'), K.SMALL.map(([c]) => byH(c)), 10, 1, h('p', { class: 'muted' }, T('Small ゃ ゅ ょ make combination sounds; small っ doubles the next consonant; small ぁ ぃ ぅ ぇ ぉ appear mostly in katakana loanwords.', 'Las pequeñas ゃ ゅ ょ forman sonidos combinados; っ duplica la consonante siguiente; ぁ ぃ ぅ ぇ ぉ aparecen sobre todo en préstamos en katakana.'))));
      // yoon
      const yo = [];
      K.YOON.forEach(([s]) => K.KANA.filter((e) => e.g === 'yoon' && e.s === s + 'y').forEach((e) => yo.push(e)));
      body.appendChild(section(T('Combinations (yōon)', 'Combinaciones (yōon)'), yo.filter((e) => !e.dup), 3, 11, null, true));
    }
    function select(c) {
      sel = c; draw(); drawDetail();
      if (window.innerWidth < 900) detail.scrollIntoView({ behavior: U.reduced() ? 'auto' : 'smooth', block: 'start' });
    }
    function drawDetail() {
      clear(detail);
      if (!sel) { detail.appendChild(h('div', { class: 'detail-empty' }, h('p', null, T('Tap a kana to hear it, see how it is written and see its pair.', 'Toca un kana para escucharlo, ver cómo se escribe y ver su pareja.')))); return; }
      const e = K.entryOf(sel); const c = sel; const other = isKataCh(c) ? e.h : e.k;
      const st = MS.srs.get('k:' + c);
      const stage = kanaStage(c, { big: true });
      detail.append(stage.el,
        h('div', { class: 'pair' }, h('span', { class: 'pair-c', lang: 'ja' }, c), h('span', { class: 'pair-sep', 'aria-hidden': 'true' }, '↔'), h('button', { class: 'pair-c alt', lang: 'ja', type: 'button', 'aria-label': T('Show ', 'Ver ') + other, onclick: () => { script = isKataCh(other) ? 'kata' : 'hira'; draw(); select(other); } }, other), h('span', { class: 'pair-r' }, e.r === 'wo' ? 'o (wo)' : e.r)),
        kanaEntryNote(c) ? h('p', { class: 'note' }, kanaEntryNote(c)) : null,
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!d.known[c], onchange: (ev) => { if (ev.target.checked) d.known[c] = true; else delete d.known[c]; save(); draw(); } }), T('I know this kana', 'Conozco este kana')),
        st ? h('p', { class: 'muted' }, T('Practised ' + st.seen + ' times, ' + Math.round((st.ok / st.seen) * 100) + '% right.', 'Practicado ' + st.seen + ' veces, ' + Math.round((st.ok / st.seen) * 100) + '% correcto.')) : h('p', { class: 'muted' }, T('Not practised yet.', 'Aún no practicado.')),
        h('div', { class: 'row' }, h('a', { class: 'btn ghost sm', href: '#/rules' }, T('Read the rules', 'Leer las reglas')), h('a', { class: 'btn ghost sm', href: '#/worksheet?k=' + encodeURIComponent(c) }, T('Practice sheet', 'Hoja de práctica'))));
    }

    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': T('Script', 'Escritura') },
      [['hira', 'ひらがな'], ['kata', 'カタカナ']].map(([s, l]) => h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': script === s, onclick: (ev) => { script = s; d.settings.chartScript = s; save(); if (sel) { const e = K.entryOf(sel); sel = chOf(e); } $$seg(ev.currentTarget.parentNode); draw(); drawDetail(); } }, l)));
    function $$seg(p) { U.$$('button', p).forEach((b, i) => b.setAttribute('aria-pressed', (i === 0) === (script === 'hira'))); }
    const markBasic = (on) => { K.KANA.filter((e) => e.g === 'basic').forEach((e) => { if (on) d.known[chOf(e)] = true; else delete d.known[chOf(e)]; }); save(); draw(); drawDetail(); };
    host.replaceChildren(h('div', { class: 'page' },
      h('header', { class: 'page-head' }, h('h1', null, T('Kana charts', 'Tablas de kana')),
        h('p', { class: 'lead' }, T('Tap a kana to hear it and watch the stroke order. Highlighted kana are the ones you marked as known.', 'Toca un kana para escucharlo y ver el orden de trazos. Los kana resaltados son los que marcaste como conocidos.'))),
      h('div', { class: 'toolbar' }, seg,
        h('label', { class: 'check sm' }, h('input', { type: 'checkbox', checked: showR, onchange: (ev) => { showR = ev.target.checked; d.settings.chartRomaji = showR; save(); draw(); } }), T('Show romaji', 'Mostrar romaji')),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => markBasic(true) }, T('Mark all basic as known', 'Marcar todos los básicos como conocidos')),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => U.confirmDlg(T('Clear known marks?', '¿Quitar las marcas?'), T('This clears the “known” marks on the basic kana of the script shown. Practice history is kept.', 'Esto quita las marcas de “conocido” de los kana básicos de la escritura mostrada. El historial de práctica se conserva.'), T('Clear marks', 'Quitar marcas'), () => markBasic(false)) }, T('Clear marks', 'Quitar marcas'))),
      h('div', { class: 'charts' }, body, detail)));
    draw(); drawDetail();
  }

  /* ================= RULES ================= */
  function rules(host) {
    let showR = false;
    const view = h('div', { class: 'page prose-page' }, h('header', { class: 'page-head' }, h('h1', null, T('Rules and examples', 'Reglas y ejemplos')),
      h('p', { class: 'lead' }, T('The sound rules that trip up beginners. Tap the speaker next to any example.', 'Las reglas de sonido que más confunden a los principiantes. Toca el altavoz junto a cualquier ejemplo.'))));
    const roms = [];
    view.appendChild(h('label', { class: 'check sm' }, h('input', { type: 'checkbox', onchange: (e) => { showR = e.target.checked; roms.forEach((r) => (r.hidden = !showR)); } }), T('Show romaji', 'Mostrar romaji')));
    MS.content.rules.forEach((r) => {
      const sec = h('section', { id: r.id }, h('h2', null, L(r.title)), r.body.map((p) => h('p', null, L(p))));
      if (r.examples) sec.appendChild(h('ul', { class: 'examples' }, r.examples.map((x) => {
        const speakText = x.ja.replace(/ /g, '');
        const ro = h('span', { class: 'ex-r', hidden: true }, K.kanaToRomaji(speakText)); roms.push(ro);
        return h('li', null, speakBtn(speakText), h('span', { class: 'ex-ja', lang: 'ja' }, x.ja), ro, h('span', { class: 'ex-m' }, L(x)));
      })));
      if (r.list) sec.appendChild(h('dl', { class: 'pitfalls' }, r.list.map((x) => [h('dt', { lang: 'ja' }, x.ja), h('dd', null, L(x))])));
      view.appendChild(sec);
    });
    view.appendChild(h('p', { class: 'muted' }, T('Pitch accent and intonation are not covered here. Your teacher’s voice is the best model.', 'El acento tonal y la entonación no se cubren aquí. La voz de tu profesor es el mejor modelo.')));
    clear(host).appendChild(view);
  }

  /* ================= KEYBOARD PLAYGROUND ================= */
  function keyboardPage(host) {
    const out = h('div', { class: 'kb-out' });
    const kbd = MS.Keyboard({ onChange: (v) => upd(v), onSubmit: () => {}, label: T('Typed text', 'Texto escrito') });
    function upd(v) {
      clear(out);
      if (!v) return;
      const sc = K.scriptCheck(v);
      out.append(h('p', null, h('span', { class: 'badge' }, scriptName(sc.script)), ' ', h('span', { class: 'muted' }, T('As katakana: ', 'En katakana: ')), h('span', { lang: 'ja' }, K.toKata(v)), ' ', h('span', { class: 'muted' }, T('As hiragana: ', 'En hiragana: ')), h('span', { lang: 'ja' }, K.toHira(v))));
    }
    clear(host).appendChild(h('div', { class: 'page' }, h('header', { class: 'page-head' }, h('h1', null, T('Kana keyboard', 'Teclado de kana')),
      h('p', { class: 'lead' }, T('Tap kana to build a word. The same keyboard is used everywhere you type an answer.', 'Toca kana para formar una palabra. El mismo teclado se usa en todas partes donde escribes una respuesta.'))),
      kbd.el, out,
      h('div', { class: 'row actions' }, h('button', { class: 'btn', type: 'button', onclick: () => Speech.speak(kbd.getValue()) }, icon('speaker'), T('Listen', 'Escuchar')),
        h('button', { class: 'btn', type: 'button', onclick: () => { const v = kbd.getValue(); if (v) location.hash = '#/vocab?w=' + encodeURIComponent(v); } }, T('Add to my words', 'Agregar a mis palabras')),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { try { navigator.clipboard.writeText(kbd.getValue()); toast(T('Copied.', 'Copiado.')); } catch (e) { toast(T('Copy is not available here.', 'Copiar no está disponible aquí.')); } } }, T('Copy', 'Copiar'))),
      h('section', { class: 'prose' }, h('h2', null, T('How the keys work', 'Cómo funcionan las teclas')),
        h('ul', null,
          h('li', null, h('b', { lang: 'ja' }, '゛'), T(' adds dakuten to the last kana (は → ば, pressing again removes it).', ' añade dakuten al último kana (は → ば, al pulsar de nuevo se quita).')),
          h('li', null, h('b', { lang: 'ja' }, '゜'), T(' adds handakuten (は → ぱ).', ' añade handakuten (は → ぱ).')),
          h('li', null, h('b', { lang: 'ja' }, '小'), T(' switches the last kana to its small form and back (つ ↔ っ, や ↔ ゃ).', ' cambia el último kana a su forma pequeña y de vuelta (つ ↔ っ, や ↔ ゃ).')),
          h('li', null, T('You can also type romaji on a physical keyboard: “kyou” becomes きょう, “kitte” becomes きって, “-” becomes ー.', 'También puedes escribir romaji en un teclado físico: “kyou” se vuelve きょう, “kitte” se vuelve きって, “-” se vuelve ー.'))))));
    setTimeout(() => kbd.focus(), 50);
  }

  /* ================= VOCABULARY ================= */
  function parseLine(line) {
    const m = line.match(/^\s*([^,，、\t]+?)\s*[,，、\t]\s*(.+?)\s*$/);
    return m ? { w: m[1].trim(), m: m[2].trim() } : null;
  }
  function vocab(host, query) {
    const d = D();
    const st = { id: null, w: query.w ? decodeURIComponent(query.w) : '', m: '', lesson: '', ex: '', note: '', target: 'w' };
    const f = { q: query.q ? decodeURIComponent(query.q) : '', lesson: '', script: '', hard: false, sort: 'new' };
    const badge = h('span', { class: 'badge' });
    const warn = h('p', { class: 'note bad', hidden: true });
    const wordPrev = h('button', { type: 'button', class: 'field-prev active', lang: 'ja', onclick: () => target('w') });
    const exPrev = h('button', { type: 'button', class: 'field-prev', lang: 'ja', onclick: () => target('ex') });
    const kbd = MS.Keyboard({ value: st.w, maxLength: 40, label: T('Word', 'Palabra'), onChange: (v) => { st[st.target] = v; syncPrev(); }, placeholder: T('Tap kana to type the word', 'Toca kana para escribir la palabra') });
    function syncPrev() {
      wordPrev.textContent = st.w || T('Word (kana)', 'Palabra (kana)'); wordPrev.classList.toggle('empty', !st.w);
      exPrev.textContent = st.ex || T('Example sentence (optional)', 'Oración de ejemplo (opcional)'); exPrev.classList.toggle('empty', !st.ex);
      wordPrev.classList.toggle('active', st.target === 'w'); exPrev.classList.toggle('active', st.target === 'ex');
      const sc = K.scriptCheck(st.w);
      badge.textContent = st.w ? scriptName(sc.script) : '';
      warn.hidden = true; warn.textContent = '';
      if (st.w && sc.other.length) { warn.hidden = false; warn.textContent = T('This word has characters that are not kana (' + sc.other.join(' ') + '). For now this site is kana-only; kanji support is planned.', 'Esta palabra tiene caracteres que no son kana (' + sc.other.join(' ') + '). Por ahora este sitio es solo de kana; el soporte de kanji está previsto.'); }
      const dup = d.words.find((x) => x.w === st.w && x.id !== st.id);
      if (st.w && dup) { warn.hidden = false; warn.textContent += (warn.textContent ? ' ' : '') + T('You already have “' + st.w + '” (' + dup.m + ').', 'Ya tienes “' + st.w + '” (' + dup.m + ').'); }
    }
    function target(t) { st.target = t; kbd.setValue(st[t]); syncPrev(); kbd.focus(); }
    const meaning = h('input', { type: 'text', placeholder: T('Meaning in Spanish or English', 'Significado en español o inglés'), 'aria-label': T('Meaning', 'Significado'), oninput: (e) => (st.m = e.target.value) });
    const lessonIn = h('input', { type: 'text', list: 'lessons', placeholder: T('e.g. Lesson 3, Food', 'ej. Lección 3, Comida'), 'aria-label': T('Lesson or tag', 'Lección o etiqueta'), oninput: (e) => (st.lesson = e.target.value) });
    const noteIn = h('input', { type: 'text', placeholder: T('Note (optional)', 'Nota (opcional)'), 'aria-label': T('Note', 'Nota'), oninput: (e) => (st.note = e.target.value) });
    const dl = h('datalist', { id: 'lessons' });
    const refreshLessons = () => { clear(dl); uniq(d.words.map((w) => w.lesson).filter(Boolean)).forEach((l) => dl.appendChild(h('option', { value: l }))); };
    const saveBtn = h('button', { class: 'btn primary', type: 'submit' }, T('Add word', 'Agregar palabra'));
    const cancelBtn = h('button', { class: 'btn ghost', type: 'button', hidden: true, onclick: () => resetForm() }, T('Cancel edit', 'Cancelar edición'));
    function resetForm(keepLesson) {
      const lesson = keepLesson ? st.lesson : '';
      Object.assign(st, { id: null, w: '', m: '', lesson, ex: '', note: '', target: 'w' });
      meaning.value = ''; noteIn.value = ''; lessonIn.value = lesson; kbd.setValue(''); saveBtn.textContent = T('Add word', 'Agregar palabra'); cancelBtn.hidden = true; syncPrev();
    }
    function submit(ev) {
      ev.preventDefault();
      if (!st.w.trim()) { toast(T('Type the word with the keyboard first.', 'Primero escribe la palabra con el teclado.')); kbd.focus(); return; }
      if (!st.m.trim()) { toast(T('Add the meaning.', 'Agrega el significado.')); meaning.focus(); return; }
      const rec = { w: st.w.trim(), m: st.m.trim(), lesson: st.lesson.trim(), ex: st.ex.trim(), note: st.note.trim() };
      if (st.id) Object.assign(d.words.find((x) => x.id === st.id), rec);
      else {
        const dup = d.words.find((x) => x.w === rec.w);
        if (dup && !confirm(T('“' + rec.w + '” is already in your list (' + dup.m + '). Add it anyway?', '“' + rec.w + '” ya está en tu lista (' + dup.m + '). ¿Agregarla de todos modos?'))) return;
        d.words.unshift(Object.assign({ id: MS.store.uid(), hard: false, added: Date.now() }, rec));
      }
      save(); toast(st.id ? T('Saved.', 'Guardado.') : T('Added.', 'Agregada.')); resetForm(true); refreshLessons(); drawList(); kbd.focus();
    }

    // paste import
    const paste = h('textarea', { rows: 6, placeholder: 'ねこ, cat\nいぬ, dog\nありがとう, thank you', 'aria-label': T('Words to import', 'Palabras para importar') });
    const pasteLesson = h('input', { type: 'text', list: 'lessons', placeholder: T('Lesson or tag for all (optional)', 'Lección o etiqueta para todas (opcional)') });
    const conv = h('input', { type: 'checkbox', checked: true });
    const preview = h('div');
    let parsed = [];
    function doPreview() {
      clear(preview); parsed = [];
      const seen = new Set(d.words.map((w) => w.w));
      const lines = paste.value.split(/\r?\n/).filter((l) => l.trim());
      if (!lines.length) { toast(T('Paste some lines first.', 'Primero pega algunas líneas.')); return; }
      const rows = lines.map((line) => {
        const p = parseLine(line);
        if (!p) return { line, err: T('Needs “word, meaning”', 'Necesita “palabra, significado”') };
        if (conv.checked && /^[a-zA-Z' -]+$/.test(p.w)) p.w = K.romajiToKana(p.w.replace(/ /g, ''), 'hira', true).kana;
        const sc = K.scriptCheck(p.w);
        const r = { w: p.w, m: p.m, sc };
        if (!p.w) r.err = T('Empty word', 'Palabra vacía');
        else if (seen.has(p.w)) r.dup = true;
        else if (sc.other.length) r.warn = T('Not kana: ' + sc.other.join(' '), 'No es kana: ' + sc.other.join(' '));
        seen.add(p.w);
        return r;
      });
      parsed = rows.filter((r) => !r.err && !r.dup);
      preview.append(h('table', { class: 'tbl' }, h('thead', null, h('tr', null, h('th', null, T('Word', 'Palabra')), h('th', null, T('Meaning', 'Significado')), h('th', null, T('Check', 'Revisión')))),
        h('tbody', null, rows.map((r) => h('tr', { class: r.err ? 'bad' : r.dup ? 'dup' : '' }, h('td', { lang: 'ja' }, r.w || r.line), h('td', null, r.m || ''), h('td', null, r.err || (r.dup ? T('Duplicate: skipped', 'Duplicada: se omite') : r.warn ? r.warn + ' · ' + scriptName(r.sc.script) : scriptName(r.sc.script))))))));
      preview.append(h('div', { class: 'row actions' }, h('button', { class: 'btn primary', type: 'button', disabled: !parsed.length, onclick: () => {
        parsed.forEach((r) => d.words.unshift({ id: MS.store.uid(), w: r.w, m: r.m, lesson: pasteLesson.value.trim(), ex: '', note: '', hard: false, added: Date.now() }));
        save(); toast(T(parsed.length + ' words imported.', parsed.length + ' palabras importadas.')); paste.value = ''; clear(preview); refreshLessons(); drawList();
      } }, T('Import ' + parsed.length + ' words', 'Importar ' + parsed.length + ' palabras'))));
    }

    // list
    const listBox = h('div'); const countEl = h('span', { class: 'muted' });
    const lessonFilter = h('select', { 'aria-label': T('Lesson filter', 'Filtro de lección'), onchange: (e) => { f.lesson = e.target.value; drawList(); } });
    function drawList() {
      clear(lessonFilter); lessonFilter.appendChild(h('option', { value: '' }, T('All lessons', 'Todas las lecciones')));
      uniq(d.words.map((w) => w.lesson || '')).sort().forEach((l) => lessonFilter.appendChild(h('option', { value: l || '__none', selected: f.lesson === (l || '__none') }, l || T('No lesson', 'Sin lección'))));
      clear(listBox);
      const q = f.q.trim().toLowerCase(); const qk = K.romajiToKana(q, 'hira', true).kana;
      let items = d.words.filter((w) => {
        if (q && !(w.w.includes(q) || w.m.toLowerCase().includes(q) || (qk && (w.w.includes(qk) || K.toHira(w.w).includes(qk))) || (w.lesson || '').toLowerCase().includes(q))) return false;
        if (f.lesson && (w.lesson || '__none') !== f.lesson) return false;
        if (f.script && K.scriptCheck(w.w).script !== f.script) return false;
        if (f.hard && !w.hard) return false;
        return true;
      });
      items = f.sort === 'az' ? items.slice().sort((a, b) => a.w.localeCompare(b.w, 'ja')) : items;
      countEl.textContent = items.length + ' / ' + d.words.length;
      if (!items.length) { listBox.appendChild(h('p', { class: 'muted' }, d.words.length ? T('No words match the filters.', 'Ninguna palabra coincide con los filtros.') : T('No words yet. Add your first word above, or paste a list.', 'Aún no hay palabras. Agrega la primera arriba o pega una lista.'))); return; }
      listBox.appendChild(h('ul', { class: 'wlist' }, items.map((w) => {
        const sc = K.scriptCheck(w.w);
        return h('li', { class: w.hard ? 'hard' : '' },
          speakBtn(w.w), h('span', { class: 'w-ja', lang: 'ja' }, w.w),
          h('span', { class: 'w-m' }, w.m, w.ex ? h('small', { lang: 'ja' }, w.ex) : null, w.note ? h('small', null, w.note) : null),
          h('span', { class: 'w-tags' }, w.lesson ? h('span', { class: 'tag' }, w.lesson) : null, h('span', { class: 'badge' + (sc.other.length ? ' warn' : '') }, sc.other.length ? T('has non-kana', 'tiene no-kana') : scriptName(sc.script))),
          h('span', { class: 'w-act' },
            h('button', { class: 'btn ghost sm' + (w.hard ? ' on' : ''), type: 'button', 'aria-pressed': !!w.hard, 'aria-label': T('Difficult', 'Difícil'), title: T('Mark as difficult', 'Marcar como difícil'), onclick: () => { w.hard = !w.hard; save(); drawList(); } }, '★'),
            h('button', { class: 'btn ghost sm', type: 'button', 'aria-label': T('Edit ', 'Editar ') + w.w, onclick: () => { Object.assign(st, { id: w.id, w: w.w, m: w.m, lesson: w.lesson || '', ex: w.ex || '', note: w.note || '', target: 'w' }); meaning.value = w.m; lessonIn.value = w.lesson || ''; noteIn.value = w.note || ''; kbd.setValue(w.w); saveBtn.textContent = T('Save changes', 'Guardar cambios'); cancelBtn.hidden = false; syncPrev(); form.scrollIntoView({ behavior: 'auto' }); } }, icon('edit')),
            h('button', { class: 'btn ghost sm', type: 'button', 'aria-label': T('Delete ', 'Borrar ') + w.w, onclick: () => U.confirmDlg(T('Delete this word?', '¿Borrar esta palabra?'), w.w + ' — ' + w.m, T('Delete', 'Borrar'), () => { d.words = d.words.filter((x) => x.id !== w.id); delete d.srs['w:' + w.id]; delete d.mistakes['w:' + w.id]; save(); drawList(); refreshLessons(); }) }, icon('trash'))));
      })));
    }

    const form = h('form', { class: 'wform', onsubmit: submit },
      h('div', { class: 'wf-fields' }, wordPrev, exPrev), h('div', { class: 'row' }, badge), warn, kbd.el,
      h('div', { class: 'wf-inputs' }, meaning, lessonIn, noteIn), dl, h('div', { class: 'row actions' }, saveBtn, cancelBtn));
    const searchIn = h('input', { type: 'search', value: f.q, placeholder: T('Search words or meanings', 'Buscar palabras o significados'), 'aria-label': T('Search words', 'Buscar palabras'), oninput: (e) => { f.q = e.target.value; drawList(); } });
    host.replaceChildren(h('div', { class: 'page' },
      h('header', { class: 'page-head' }, h('h1', null, T('Words', 'Palabras')), h('p', { class: 'lead' }, T('Your class vocabulary. Type with the kana keyboard, group by lesson, and practise from the Practice page.', 'El vocabulario de tu clase. Escribe con el teclado de kana, agrupa por lección y practica desde la página Práctica.'))),
      h('section', null, h('h2', null, st.id ? T('Edit word', 'Editar palabra') : T('Add a word', 'Agregar una palabra')), form),
      h('details', { class: 'paste' }, h('summary', null, T('Paste a list', 'Pegar una lista')),
        h('p', { class: 'muted' }, T('One word per line: word, meaning. Duplicates are skipped and non-kana characters are flagged.', 'Una palabra por línea: palabra, significado. Las duplicadas se omiten y los caracteres que no son kana se señalan.')), paste,
        h('div', { class: 'row wrap' }, pasteLesson, h('label', { class: 'check sm' }, conv, T('Convert romaji words to kana', 'Convertir palabras en romaji a kana')), h('button', { class: 'btn', type: 'button', onclick: doPreview }, T('Preview', 'Vista previa'))), preview),
      h('section', null, h('div', { class: 'row between wrap' }, h('h2', null, T('Your words', 'Tus palabras'), ' ', countEl), h('div', { class: 'row wrap' }, searchIn, lessonFilter,
        h('select', { 'aria-label': T('Script filter', 'Filtro de escritura'), onchange: (e) => { f.script = e.target.value; drawList(); } }, [['', T('Any script', 'Cualquier escritura')], ['hira', T('Hiragana', 'Hiragana')], ['kata', T('Katakana', 'Katakana')], ['mixed', T('Mixed', 'Mixto')]].map(([v, l]) => h('option', { value: v }, l))),
        h('label', { class: 'check sm' }, h('input', { type: 'checkbox', onchange: (e) => { f.hard = e.target.checked; drawList(); } }), T('Difficult only', 'Solo difíciles')),
        h('label', { class: 'check sm' }, h('input', { type: 'checkbox', onchange: (e) => { f.sort = e.target.checked ? 'az' : 'new'; drawList(); } }), T('Sort あ→ん', 'Ordenar あ→ん')))), listBox)));
    refreshLessons(); syncPrev(); drawList();
    if (st.w) { kbd.setValue(st.w); st.w = kbd.getValue(); syncPrev(); }
    if (query.w) setTimeout(() => meaning.focus(), 50);
  }

  /* ================= PROGRESS ================= */
  function progress(host) {
    const d = D();
    const mk = (script) => h('div', { class: 'heat-grid' }, K.KANA.filter((e) => ['basic', 'dakuten', 'handakuten'].includes(e.g) && !e.dup && !e.rare).map((e) => {
      const c = script === 'kata' ? e.k : e.h; const st = d.srs['k:' + c]; const acc = MS.srs.recentAccuracy(st);
      return h('a', { class: 'heat ' + heatClass(acc), href: '#/charts?k=' + encodeURIComponent(c), 'aria-label': c + ': ' + (acc == null ? T('not practised', 'sin practicar') : Math.round(acc * 100) + '%') }, h('span', { class: 'ja', lang: 'ja' }, c), h('small', null, acc == null ? '–' : Math.round(acc * 100)));
    }));
    // calendar: 12 weeks, columns = weeks (Mon..Sun rows)
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const startMon = new Date(end); startMon.setDate(startMon.getDate() - ((startMon.getDay() + 6) % 7) - 11 * 7);
    const cal = h('div', { class: 'cal', role: 'img', 'aria-label': T('Daily practice calendar for the last 12 weeks', 'Calendario de práctica diaria de las últimas 12 semanas') });
    for (let w = 0; w < 12; w++) {
      const col = h('div', { class: 'cal-col' });
      for (let i = 0; i < 7; i++) {
        const day = new Date(startMon); day.setDate(day.getDate() + w * 7 + i);
        const a = d.activity[MS.store.dayKey(day)]; const min = a ? a.sec / 60 : 0;
        const lv = day > end ? 'fut' : !a || !a.q ? 'l0' : min < 5 ? 'l1' : min < 10 ? 'l2' : min < 20 ? 'l3' : 'l4';
        col.appendChild(h('span', { class: 'cal-d ' + lv, title: U.fmtDate(day) + ': ' + (a ? Math.round(min) + ' min, ' + a.q + ' q' : '–') }));
      }
      cal.appendChild(col);
    }
    const items = Object.keys(d.srs).map((k) => ({ k, st: d.srs[k] })).filter((x) => x.st.seen >= 2 && (x.k.startsWith('k:') || x.k.startsWith('w:'))).sort((a, b) => MS.srs.recentAccuracy(a.st) - MS.srs.recentAccuracy(b.st)).slice(0, 10);
    const labelOf = (k) => k.startsWith('k:') ? k.slice(2) : ((d.words.find((w) => 'w:' + w.id === k) || {}).w || '?');
    const mist = Object.keys(d.mistakes).filter((k) => k.startsWith('k:') || d.words.some((w) => 'w:' + w.id === k));
    const act = Object.values(d.activity); const q = act.reduce((a, b) => a + b.q, 0), ok = act.reduce((a, b) => a + b.ok, 0);
    host.replaceChildren(h('div', { class: 'page' },
      h('header', { class: 'page-head' }, h('h1', null, T('Progress', 'Progreso')),
        h('p', { class: 'lead' }, T(fmtDur(totalSec()) + ' practised in total, ' + q + ' answers' + (q ? ', ' + Math.round((ok / q) * 100) + '% right.' : '.'), fmtDur(totalSec()) + ' practicados en total, ' + q + ' respuestas' + (q ? ', ' + Math.round((ok / q) * 100) + '% correctas.' : '.')))),
      h('section', null, h('h2', null, T('Heat map: hiragana', 'Mapa de calor: hiragana')), mk('hira'), h('h2', null, T('Heat map: katakana', 'Mapa de calor: katakana')), mk('kata'),
        h('p', { class: 'legend-line' }, T('Accuracy over the last 10 answers: ', 'Precisión en las últimas 10 respuestas: '), [['h0', T('not practised', 'sin practicar')], ['h1', '<50%'], ['h2', '50–74%'], ['h3', '75–89%'], ['h4', '90%+']].map(([c, l]) => h('span', { class: 'lg' }, h('i', { class: 'heat-sw ' + c }), l)))),
      h('section', null, h('h2', null, T('Daily activity', 'Actividad diaria')), cal, h('p', { class: 'legend-line' }, T('Last 12 weeks, Monday at the top. Darker means more minutes.', 'Últimas 12 semanas, lunes arriba. Más oscuro significa más minutos.'))),
      h('section', null, h('h2', null, T('Weak spots', 'Puntos débiles')), items.length ? h('ul', { class: 'weak-list' }, items.map((x) => h('li', null, h('span', { class: 'ja', lang: 'ja' }, labelOf(x.k)), h('span', { class: 'muted' }, Math.round(MS.srs.recentAccuracy(x.st) * 100) + '% · ' + x.st.seen + '×')))) : h('p', { class: 'muted' }, T('Practise a few sessions and your weak spots will appear here.', 'Haz algunas sesiones y tus puntos débiles aparecerán aquí.'))),
      h('section', null, h('h2', null, T('Mistake bank', 'Banco de errores')), mist.length ? [h('p', { class: 'muted' }, T('Items leave the bank after two correct answers in a row.', 'Los elementos salen del banco tras dos respuestas correctas seguidas.')), h('div', { class: 'weak-row' }, mist.map((k) => h('span', { class: 'weak h1' }, h('span', { class: 'ja', lang: 'ja' }, labelOf(k))))), h('a', { class: 'btn', href: '#/practice' }, T('Practise them', 'Practicarlos'))] : h('p', { class: 'muted' }, T('Empty. Wrong answers are collected here.', 'Vacío. Las respuestas incorrectas se recogen aquí.'))),
      h('section', null, h('h2', null, T('Recent sessions', 'Sesiones recientes')), d.sessions.length ? h('table', { class: 'tbl' }, h('thead', null, h('tr', null, [T('Date', 'Fecha'), T('Mode', 'Modo'), T('Score', 'Nota'), T('Time', 'Tiempo')].map((x) => h('th', null, x)))), h('tbody', null, d.sessions.slice(0, 10).map((s) => h('tr', null, h('td', null, U.fmtDate(s.date)), h('td', null, { practice: T('Practice', 'Práctica'), quiz: 'Quiz', exam: T('Exam', 'Examen') }[s.mode]), h('td', null, s.pct + '% (' + s.ok + '/' + s.n + ')'), h('td', null, U.fmtTime(s.sec)))))) : h('p', { class: 'muted' }, T('No sessions yet.', 'Aún no hay sesiones.')))));
  }

  /* ================= STUDY PLAN ================= */
  function plan(host) {
    const d = D(); const C = MS.content.plan;
    const box = (list, prefix, afterChange) => h('ul', { class: 'checklist' }, list.map((t) => { const k = prefix + t.id; return h('li', null, h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!d.checks[k], onchange: (e) => { if (e.target.checked) d.checks[k] = true; else delete d.checks[k]; save(); afterChange && afterChange(); } }), L(t))); }));
    const view = h('div', { class: 'page prose-page' }, h('header', { class: 'page-head' }, h('h1', null, T('Study plan', 'Plan de estudio')), h('p', { class: 'lead' }, L(C.note))));
    C.phases.forEach((p) => {
      const prog = h('span', { class: 'prog' }); const upd = () => { prog.textContent = p.tasks.filter((t) => d.checks['jp:' + t.id]).length + ' / ' + p.tasks.length; };
      view.appendChild(h('section', null, h('h2', null, L(p.title), ' ', prog), box(p.tasks, 'jp:', upd))); upd();
    });
    view.appendChild(h('section', null, h('div', { class: 'row between wrap' }, h('h2', null, T('Weekly review', 'Revisión semanal')), h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { C.weekly.forEach((t) => delete d.checks['jp:' + t.id]); save(); plan(host); } }, T('Start a new week', 'Empezar una semana nueva'))), box(C.weekly, 'jp:')));
    view.appendChild(h('section', null, h('h2', null, T('Before the quiz', 'Antes del quiz')), box(C.before, 'jp:'), h('p', null, h('a', { href: '#quiz', onclick: (e) => { e.preventDefault(); location.hash = '#/home'; setTimeout(() => { const q = document.getElementById('quiz'); q && q.scrollIntoView(); }, 80); } }, T('Open the quiz countdown', 'Abrir la cuenta regresiva del quiz')))));
    clear(host).appendChild(view);
  }

  /* ================= RESOURCES (Japanese) ================= */
  function resourcesJp(host) {
    const d = D();
    const link = (r) => { const href = r.url || 'https://duckduckgo.com/?q=' + encodeURIComponent(r.q || ''); const name = typeof r.name === 'string' ? r.name : L(r.name); return r.url || r.q ? h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, name, r.url ? null : h('span', { class: 'muted' }, ' ' + T('(search)', '(búsqueda)'))) : h('strong', null, name); };
    const cost = (c) => ({ free: T('Free', 'Gratis'), paid: T('Paid', 'De pago'), freemium: T('Free + paid', 'Gratis + pago') }[c]);
    const saved = h('span', { class: 'muted', 'aria-live': 'polite' });
    const ta = h('textarea', { rows: 8, 'aria-label': T('Teacher tips and class notes', 'Consejos del profesor y notas de clase'), placeholder: T('Tips from your teacher, things to remember, questions…', 'Consejos de tu profesor, cosas para recordar, preguntas…'), oninput: (e) => { d.notes.teacher = e.target.value; save(); saved.textContent = T('Saved', 'Guardado'); } }, d.notes.teacher || '');
    clear(host).appendChild(h('div', { class: 'page' }, h('header', { class: 'page-head' }, h('h1', null, T('Japanese resources', 'Recursos de japonés')),
      h('p', { class: 'lead' }, T('A short list, one reason each. “Search” links open a web search so they never break. Prices and free tiers change: check them yourself.', 'Una lista corta, una razón cada uno. Los enlaces “búsqueda” abren una búsqueda web para que nunca se rompan. Los precios y niveles gratuitos cambian: compruébalos tú mismo.'))),
      h('ul', { class: 'res' }, MS.content.resources.map((r) => h('li', null, h('div', null, link(r), h('span', { class: 'tag cost-' + r.cost }, cost(r.cost))), h('p', null, L(r.why))))),
      h('section', null, h('h2', null, T('Teacher’s tips and class notes', 'Consejos del profesor y notas de clase')), ta, saved)));
  }

  /* ================= WORKSHEET (printable genkouyoushi) ================= */
  function worksheet(host, query) {
    const d = D();
    const prefs = d.worksheet || (d.worksheet = { mode: 'kana', scripts: ['hira'], groups: ['basic'], sets: ['all'], cols: 10, faint: 2 });
    if (!prefs.reps) prefs.reps = 1;
    if (!prefs.blankRows) prefs.blankRows = 15;
    const sheet = h('div', { class: 'sheet', id: 'sheet' });
    let custom = query.k ? decodeURIComponent(query.k) : '';
    function rowsOf() {
      if (custom) { const c = [...custom]; return c.map((x) => x); }
      if (prefs.mode === 'kana') return P.kanaItemsFor({ scripts: prefs.scripts, groups: prefs.groups }, d.srs, d.known, d.mistakes).filter((i) => !i.e.dup).map((i) => i.ch);
      const ws = []; prefs.sets.forEach((sid) => P.wordsInSet(sid, d).forEach((w) => ws.push(w.w)));
      return uniq(ws);
    }
    function drawSheet() {
      clear(sheet);
      sheet.appendChild(h('div', { class: 'sheet-head' }, h('span', null, T('Name', 'Nombre') + ' ____________________'), h('span', null, T('Date', 'Fecha') + ' ____________'), h('span', { class: 'sheet-title' }, T('Writing practice', 'Práctica de escritura'))));
      if (prefs.mode === 'blank' && !custom) {
        for (let r = 0; r < prefs.blankRows; r++) {
          const row = h('div', { class: 'ws-row', style: { '--n': prefs.cols } });
          for (let c = 0; c < prefs.cols; c++) row.appendChild(h('span', { class: 'ws-cell' }));
          sheet.appendChild(row);
        }
        return;
      }
      const items = rowsOf();
      if (!items.length) { sheet.appendChild(h('p', { class: 'muted' }, T('Nothing to print yet. Choose kana, or add words first.', 'Aún no hay nada para imprimir. Elige kana o agrega palabras primero.'))); return; }
      // Each sound/word gets prefs.reps rows. The first row has the model and faint tracing copies;
      // extra rows are left fully empty for practice.
      items.forEach((t) => {
        const chars = [...t]; const cols = Math.max(prefs.cols, chars.length * 2 + 1);
        for (let rep = 0; rep < prefs.reps; rep++) {
          const row = h('div', { class: 'ws-row' + (prefs.reps > 1 && rep === prefs.reps - 1 ? ' ws-last' : ''), style: { '--n': cols } });
          let n = 0;
          if (rep === 0) chars.forEach((c) => { row.appendChild(h('span', { class: 'ws-cell model', lang: 'ja' }, c)); n++; });
          if (rep === 0) for (let r = 0; r < prefs.faint; r++) chars.forEach((c) => { if (n < cols) { row.appendChild(h('span', { class: 'ws-cell faint', lang: 'ja' }, c)); n++; } });
          while (n < cols) { row.appendChild(h('span', { class: 'ws-cell' })); n++; }
          sheet.appendChild(row);
        }
      });
    }
    const chk = (label, checked, on) => h('label', { class: 'chip' }, h('input', { type: 'checkbox', checked, onchange: (e) => on(e.target.checked) }), h('span', null, label));
    const tog = (arr, v, on) => { const i = arr.indexOf(v); if (on && i < 0) arr.push(v); if (!on && i >= 0) arr.splice(i, 1); custom = ''; save(); drawSheet(); };
    const lessons = uniq(d.words.map((w) => w.lesson || ''));
    const controls = h('div', { class: 'ws-controls no-print' },
      h('fieldset', { class: 'fs' }, h('legend', null, T('What to print', 'Qué imprimir')), h('div', { class: 'chips' },
        h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'wm', checked: prefs.mode === 'kana', onchange: () => { prefs.mode = 'kana'; custom = ''; save(); drawSheet(); } }), h('span', null, T('Kana', 'Kana'))),
        h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'wm', checked: prefs.mode === 'words', onchange: () => { prefs.mode = 'words'; custom = ''; save(); drawSheet(); } }), h('span', null, T('My words', 'Mis palabras'))),
        h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'wm', checked: prefs.mode === 'blank', onchange: () => { prefs.mode = 'blank'; custom = ''; save(); drawSheet(); } }), h('span', null, T('Blank sheet', 'Hoja en blanco'))))),
      h('fieldset', { class: 'fs' }, h('legend', null, T('Kana', 'Kana')), h('div', { class: 'chips' },
        chk('ひらがな', prefs.scripts.includes('hira'), (on) => tog(prefs.scripts, 'hira', on)), chk('カタカナ', prefs.scripts.includes('kata'), (on) => tog(prefs.scripts, 'kata', on)),
        [['basic', T('Basic 46', 'Básicos 46')], ['dakuten', T('Dakuten', 'Dakuten')], ['handakuten', T('Handakuten', 'Handakuten')], ['small', T('Small', 'Pequeños')], ['yoon', T('Yōon', 'Yōon')]].map(([g, l]) => chk(l, prefs.groups.includes(g), (on) => tog(prefs.groups, g, on))))),
      h('fieldset', { class: 'fs' }, h('legend', null, T('Word sets', 'Conjuntos de palabras')), h('div', { class: 'chips' }, [['all', T('All words', 'Todas')], ['hard', T('Difficult', 'Difíciles')], ['mistakes', T('Mistake bank', 'Errores')]].concat(lessons.map((l) => ['lesson:' + l, l || T('No lesson', 'Sin lección')])).map(([v, l]) => chk(l, prefs.sets.includes(v), (on) => tog(prefs.sets, v, on))))),
      h('div', { class: 'row wrap' }, h('label', { class: 'inline' }, T('Boxes per row ', 'Cajas por fila '), h('select', { onchange: (e) => { prefs.cols = +e.target.value; save(); drawSheet(); } }, [8, 10, 12].map((n) => h('option', { value: n, selected: prefs.cols === n }, n)))),
        h('label', { class: 'inline' }, T('Faint copies ', 'Copias tenues '), h('select', { onchange: (e) => { prefs.faint = +e.target.value; save(); drawSheet(); } }, [0, 1, 2, 3].map((n) => h('option', { value: n, selected: prefs.faint === n }, n)))),
        h('label', { class: 'inline' }, T('Rows per sound ', 'Filas por sonido '), h('select', { onchange: (e) => { prefs.reps = +e.target.value; save(); drawSheet(); } }, [1, 2, 3, 4, 5, 6].map((n) => h('option', { value: n, selected: prefs.reps === n }, n)))),
        h('label', { class: 'inline' }, T('Blank sheet rows ', 'Filas de la hoja en blanco '), h('select', { onchange: (e) => { prefs.blankRows = +e.target.value; save(); drawSheet(); } }, [5, 10, 12, 15, 20, 25, 30].map((n) => h('option', { value: n, selected: prefs.blankRows === n }, n)))),
        h('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, T('Print', 'Imprimir'))),
      custom ? h('p', { class: 'note' }, T('Showing only: ', 'Mostrando solo: ') + custom + ' ', h('a', { href: '#/worksheet' }, T('show my selection', 'mostrar mi selección'))) : null);
    clear(host).appendChild(h('div', { class: 'page wide' }, h('header', { class: 'page-head no-print' }, h('h1', null, T('Printable worksheet', 'Hoja imprimible')), h('p', { class: 'lead' }, T('Genkouyoushi-style squares with a model character, faint copies and empty boxes. Print or save as PDF from the print dialog.', 'Cuadros estilo genkouyoushi con un carácter modelo, copias tenues y cajas vacías. Imprime o guarda como PDF desde el diálogo de impresión.'))), controls, sheet));
    drawSheet();
  }

  /* ================= DATA & HELP ================= */
  function dataPage(host) {
    const d = D();
    const fileIn = h('input', { type: 'file', accept: 'application/json,.json', class: 'sr-only', id: 'imp', onchange: (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const mode = (document.querySelector('input[name=impmode]:checked') || {}).value || 'merge';
      const go = () => { try { MS.store.importJSON(r.result, mode); toast(T('Backup imported.', 'Copia importada.')); applyTheme(); renderShell(); route(); } catch (err) { U.dialog(T('Could not import', 'No se pudo importar'), h('p', null, T(err.message, err.message === 'This file is not valid JSON.' ? 'Este archivo no es un JSON válido.' : 'Este archivo no es una copia de Masume.'))); } };
      if (mode === 'replace') U.confirmDlg(T('Replace all data?', '¿Reemplazar todos los datos?'), T('Everything currently in this browser will be replaced by the backup.', 'Todo lo que hay ahora en este navegador será reemplazado por la copia.'), T('Replace', 'Reemplazar'), go); else go(); };
      r.readAsText(f); e.target.value = ''; } });
    const voice = Speech.recorded() ? T('Pronunciation plays from recordings (Microsoft Nanami neural voice), so it works on any device. ', 'La pronunciación usa grabaciones (voz neuronal Microsoft Nanami), así que funciona en cualquier dispositivo. ') + (Speech.supported && Speech.ja() ? T('Typed text uses your system voice: ', 'El texto escrito usa la voz del sistema: ') + Speech.ja().name : T('Typed text needs a Japanese system voice.', 'El texto escrito necesita una voz japonesa del sistema.')) : Speech.supported ? (Speech.available() ? T('A Japanese voice is available: ', 'Hay una voz japonesa disponible: ') + Speech.ja().name : T('No Japanese voice found.', 'No se encontró una voz japonesa.')) : T('This browser has no speech synthesis.', 'Este navegador no tiene síntesis de voz.');
    clear(host).appendChild(h('div', { class: 'page prose-page' }, h('header', { class: 'page-head' }, h('h1', null, T('Data and help', 'Datos y ayuda'))),
      h('section', null, h('h2', null, T('Back up your data', 'Respalda tus datos')),
        h('p', null, T('Everything is saved in this browser only. Export a JSON file now and then, and to move to another computer.', 'Todo se guarda solo en este navegador. Exporta un archivo JSON de vez en cuando y para pasar a otro computador.')),
        MS.store.memoryOnly ? h('p', { class: 'note bad' }, T('Browser storage is blocked here, so changes will be lost when you close the page. Export often.', 'El almacenamiento del navegador está bloqueado aquí; los cambios se perderán al cerrar la página. Exporta con frecuencia.')) : null,
        h('div', { class: 'row actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { try { const blob = new Blob([MS.store.exportJSON()], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'masume-backup-' + MS.store.dayKey() + '.json' }); document.body.appendChild(a); a.click(); a.remove(); toast(T('Backup downloaded.', 'Copia descargada.')); } catch (e) { toast(T('Could not create the file.', 'No se pudo crear el archivo.')); } } }, T('Export backup', 'Exportar copia')),
          h('label', { class: 'btn', for: 'imp' }, T('Import backup', 'Importar copia')), fileIn),
        h('div', { class: 'chips' }, h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'impmode', value: 'merge', checked: true }), h('span', null, T('Merge with what I have', 'Combinar con lo que tengo'))), h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'impmode', value: 'replace' }), h('span', null, T('Replace everything', 'Reemplazar todo'))))),
      h('section', null, h('h2', null, T('Pronunciation', 'Pronunciación')), h('p', null, voice), h('div', { class: 'row actions' }, h('button', { class: 'btn', type: 'button', onclick: () => Speech.speak('こんにちは') }, icon('speaker'), T('Test: こんにちは', 'Probar: こんにちは')), h('button', { class: 'btn ghost', type: 'button', onclick: () => Speech.explain() }, T('How to add a Japanese voice', 'Cómo agregar una voz japonesa'))),
        h('label', { class: 'field' }, h('span', { class: 'field-l' }, T('Speaking speed', 'Velocidad de voz')), h('input', { type: 'range', min: 0.5, max: 1.2, step: 0.05, value: d.settings.rate, oninput: (e) => { d.settings.rate = +e.target.value; save(); } }))),
      h('section', null, h('h2', null, T('Sample data and reset', 'Datos de ejemplo y reinicio')), h('div', { class: 'row actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => { const n = MS.session.addSampleWords(); toast(n ? T(n + ' sample words added.', n + ' palabras de ejemplo agregadas.') : T('Sample words are already there.', 'Las palabras de ejemplo ya están.')); } }, T('Add sample words', 'Agregar palabras de ejemplo')),
        h('button', { class: 'btn danger', type: 'button', onclick: () => U.confirmDlg(T('Delete all data?', '¿Borrar todos los datos?'), T('Words, progress, notes and English data will be erased from this browser. Export first if you want a copy.', 'Se borrarán palabras, progreso, notas y datos de inglés de este navegador. Exporta primero si quieres una copia.'), T('Delete everything', 'Borrar todo'), () => { MS.store.reset(); MS.session.reset(); toast(T('All data deleted.', 'Todos los datos borrados.')); renderShell(); route(); }) }, T('Delete all data', 'Borrar todos los datos')))),
      h('section', null, h('h2', null, T('What is approximate or unchecked', 'Qué es aproximado o sin verificar')), h('ul', null,
        h('li', null, T('Pronunciation is synthetic (recorded with a text-to-speech voice, or your system voice). It is not a native teacher and may misread some isolated kana.', 'La pronunciación es sintética (grabada con una voz de síntesis, o la voz de tu sistema). No es un profesor nativo y puede leer mal algunos kana aislados.')),
        h('li', null, T('The study plan, countdown steps and English plans are suggestions, not part of any official syllabus.', 'El plan de estudio, los pasos de la cuenta regresiva y los planes de inglés son sugerencias, no parte de un programa oficial.')),
        h('li', null, T('CEFR statements are my paraphrases. Level tests are rough estimates. Links marked “search” open a search; prices and free tiers may have changed.', 'Las frases del MCER son paráfrasis mías. Las pruebas de nivel son estimaciones aproximadas. Los enlaces “búsqueda” abren una búsqueda; los precios y niveles gratuitos pueden haber cambiado.')))),
      h('section', { id: 'credits' }, h('h2', null, T('Credits', 'Créditos')), h('ul', null,
        h('li', null, T('Stroke order data: ', 'Datos de orden de trazos: '), h('a', { href: 'http://kanjivg.tagaini.net', target: '_blank', rel: 'noopener noreferrer' }, 'KanjiVG'), ' © Ulrich Apel, ', h('a', { href: 'https://creativecommons.org/licenses/by-sa/3.0/', target: '_blank', rel: 'noopener noreferrer' }, 'CC BY-SA 3.0'), T('. The file data/strokes.js is derived from KanjiVG and shared under the same licence.', '. El archivo data/strokes.js deriva de KanjiVG y se comparte bajo la misma licencia.')),
        h('li', null, T('Fonts (SIL Open Font License, loaded from Google Fonts when online): Bricolage Grotesque, Zen Kaku Gothic New, Klee One. Offline, system fonts take over.', 'Fuentes (SIL Open Font License, cargadas desde Google Fonts cuando hay conexión): Bricolage Grotesque, Zen Kaku Gothic New, Klee One. Sin conexión, se usan las fuentes del sistema.')),
        h('li', null, T('No images or icons from outside this project: icons are drawn inline.', 'No hay imágenes ni íconos externos: los íconos están dibujados en el propio código.'))))));
  }

  /* ================= SHELL ================= */
  function applyTheme() {
    const t = D().settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
    document.documentElement.lang = D().settings.lang === 'es' ? 'es' : 'en';
  }
  const effectiveTheme = () => D().settings.theme === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : D().settings.theme;
  let currentNav = '';
  function renderShell() {
    const nav = U.$('#nav'); clear(nav);
    navGroups().forEach((g) => nav.appendChild(h('div', { class: 'nav-group' }, h('p', { class: 'nav-title' }, L(g.group)), h('ul', null, g.items.map((i) => h('li', null, h('a', { href: '#' + i.path, 'data-nav': i.id, 'aria-current': i.id === currentNav ? 'page' : null }, L(i))))))));
    const s = D().settings;
    const ctrl = U.$('#controls'); clear(ctrl);
    ctrl.append(h('div', { class: 'seg', role: 'group', 'aria-label': 'Language / Idioma' }, ['en', 'es'].map((l) => h('button', { type: 'button', class: 'seg-btn', lang: l, 'aria-pressed': s.lang === l, onclick: () => { s.lang = l; save(); applyTheme(); renderShell(); route(); } }, l.toUpperCase()))),
      h('button', { class: 'btn ghost round', type: 'button', 'aria-label': effectiveTheme() === 'dark' ? T('Switch to light theme', 'Cambiar a tema claro') : T('Switch to dark theme', 'Cambiar a tema oscuro'), onclick: () => { s.theme = effectiveTheme() === 'dark' ? 'light' : 'dark'; save(); applyTheme(); renderShell(); } }, icon('theme')));
    U.$('#search').setAttribute('placeholder', T('Search kana, words, pages', 'Buscar kana, palabras, páginas'));
    U.$('#search').setAttribute('aria-label', T('Search', 'Buscar'));
    U.$('#menu-btn').setAttribute('aria-label', T('Menu', 'Menú'));
    U.$('.skip').textContent = T('Skip to content', 'Saltar al contenido');
    U.$('#brand-sub').textContent = englishOn() ? T('Japanese and English study desk', 'Escritorio de estudio de japonés e inglés') : T('Japanese study desk', 'Escritorio de estudio de japonés');
  }

  /* search */
  function setupSearch() {
    const input = U.$('#search'), box = U.$('#search-results');
    const close = () => { box.hidden = true; clear(box); };
    function run() {
      const q = input.value.trim().toLowerCase();
      clear(box);
      if (!q) { box.hidden = true; return; }
      const res = [];
      navGroups().flatMap((g) => g.items).forEach((n) => { if ((n.en + ' ' + n.es).toLowerCase().includes(q)) res.push({ kind: T('Page', 'Página'), label: L(n), href: '#' + n.path }); });
      const kq = /^[a-z']+$/.test(q) ? K.romajiToKana(q, 'hira', true).kana : '';
      K.KANA.forEach((e) => { if (res.filter((r) => r.k).length < 6 && (e.r === q || e.h === input.value.trim() || e.k === input.value.trim() || (kq && e.h === kq))) res.push({ k: 1, kind: T('Kana', 'Kana'), label: e.h + ' ' + e.k + ' · ' + e.r, href: '#/charts?k=' + encodeURIComponent(e.h) }); });
      D().words.forEach((w) => { if (res.filter((r) => r.w).length < 6 && (w.w.includes(input.value.trim()) || w.m.toLowerCase().includes(q) || (kq && K.toHira(w.w).includes(kq)))) res.push({ w: 1, kind: T('Word', 'Palabra'), label: w.w + ' — ' + w.m, href: '#/vocab?q=' + encodeURIComponent(w.w) }); });
      if (englishOn()) D().en.journal.forEach((x) => { if (res.filter((r) => r.j).length < 4 && (x.phrase + ' ' + x.def).toLowerCase().includes(q)) res.push({ j: 1, kind: T('English journal', 'Diario de inglés'), label: x.phrase, href: '#/en/tools?tab=journal' }); });
      if (!res.length) box.appendChild(h('p', { class: 'muted pad' }, T('No results.', 'Sin resultados.')));
      else box.appendChild(h('ul', { role: 'listbox' }, res.slice(0, 14).map((r) => h('li', { role: 'option' }, h('a', { href: r.href, onclick: () => { close(); input.value = ''; } }, h('span', { class: 'sr-kind' }, r.kind), h('span', { lang: r.k || r.w ? 'ja' : null }, r.label))))));
      box.hidden = false;
    }
    input.addEventListener('input', run);
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); input.blur(); } else if (e.key === 'Enter') { const a = box.querySelector('a'); if (a) { a.click(); location.hash = a.getAttribute('href'); } } else if (e.key === 'ArrowDown') { const a = box.querySelector('a'); a && a.focus(); e.preventDefault(); } });
    box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); input.focus(); } });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search')) close(); });
  }

  /* router */
  const ROUTES = {
    '/home': { nav: 'home', title: ['Today', 'Hoy'], f: home }, '/charts': { nav: 'charts', title: ['Kana charts', 'Tablas de kana'], f: charts }, '/rules': { nav: 'rules', title: ['Rules', 'Reglas'], f: rules },
    '/keyboard': { nav: 'keyboard', title: ['Kana keyboard', 'Teclado de kana'], f: keyboardPage }, '/vocab': { nav: 'vocab', title: ['Words', 'Palabras'], f: vocab },
    '/practice': { nav: 'practice', title: ['Practice', 'Práctica'], f: (host) => MS.session.hub(host) }, '/practice/run': { nav: 'practice', title: ['Practice session', 'Sesión de práctica'], f: (host) => MS.session.renderRun(host) },
    '/progress': { nav: 'progress', title: ['Progress', 'Progreso'], f: progress }, '/plan': { nav: 'plan', title: ['Study plan', 'Plan de estudio'], f: plan }, '/resources': { nav: 'resources', title: ['Resources', 'Recursos'], f: resourcesJp },
    '/shared': { nav: 'shared', title: ['Shared words', 'Palabras compartidas'], f: (host) => MS.shared.page(host) },
    '/worksheet': { nav: 'practice', title: ['Printable worksheet', 'Hoja imprimible'], f: worksheet },
    '/en': { nav: 'en', title: ['English: level and goals', 'Inglés: nivel y metas'], f: (host) => MS.english.assess(host) }, '/en/plan': { nav: 'enplan', title: ['English: weekly plan', 'Inglés: plan semanal'], f: (host) => MS.english.plan(host) },
    '/en/tools': { nav: 'entools', title: ['English tools', 'Herramientas de inglés'], f: (host, q) => MS.english.tools(host, q.tab) }, '/en/resources': { nav: 'enres', title: ['English resources', 'Recursos de inglés'], f: (host) => MS.english.resources(host) },
    '/data': { nav: 'data', title: ['Data and help', 'Datos y ayuda'], f: dataPage },
  };
  function parseHash() {
    const raw = location.hash.replace(/^#/, '') || '/home';
    const [pathPart, qs] = raw.split('?'); const path = pathPart.split('#')[0];
    const query = {}; (qs || '').split('&').forEach((p) => { if (!p) return; const [k, v] = p.split('='); query[k] = v; });
    return { path: path.startsWith('/') ? path : '/home', query };
  }
  let lastKey = '';
  function route() {
    MS.session.cleanup(); MS.english.cleanup(); MS.shared.cleanup();
    const { path, query } = parseHash();
    const r = (!englishOn() && /^\/en(\/|$)/.test(path) ? null : ROUTES[path]) || ROUTES['/home'];
    currentNav = r.nav;
    U.$$('#nav a').forEach((a) => (a.getAttribute('data-nav') === currentNav ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    document.title = T(r.title[0], r.title[1]) + ' · Masume';
    const host = U.$('#view');
    try { r.f(host, query); }
    catch (err) { console.error(err); clear(host).appendChild(h('div', { class: 'page' }, h('h1', null, T('Something went wrong', 'Algo salió mal')), h('p', null, String(err && err.message)))); }
    document.body.classList.remove('rail-open');
    const key = path + JSON.stringify(query);
    if (key !== lastKey) { window.scrollTo(0, 0); host.focus({ preventScroll: true }); }
    lastKey = key;
  }

  /* demo seed (for screenshots/tests): ?seed=demo */
  function seedDemo() {
    const d = D();
    if (!d.words.length) MS.session.addSampleWords();
    const now = Date.now();
    ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'し', 'つ', 'そ', 'ん'].forEach((c, i) => { d.known[c] = i < 8 ? true : undefined; if (!d.known[c]) delete d.known[c]; const st = MS.srs.review(undefined, 2, now - 5 * 86400000); const bad = i % 4 === 3; d.srs['k:' + c] = Object.assign(st, { seen: 6, ok: bad ? 3 : 6, bad: bad ? 3 : 0, recent: bad ? '1010100110' : '1111111111', due: now - 1000 }); });
    for (let i = 0; i < 30; i++) { const day = new Date(); day.setDate(day.getDate() - i * 2 - 1); d.activity[MS.store.dayKey(day)] = { sec: 200 + ((i * 97) % 900), q: 10 + i, ok: 8 + i }; }
    d.activity[MS.store.dayKey()] = { sec: 400, q: 20, ok: 17 };
    d.quizDate = MS.store.dayKey(new Date(Date.now() + 9 * 86400000));
    d.en.ratings.push({ id: 'r1', date: now - 40 * 86400000, r: { listening: 3, speaking: 2, reading: 4, writing: 2, vocabulary: 3, grammar: 3 } }, { id: 'r2', date: now, r: { listening: 4, speaking: 3, reading: 4, writing: 3, vocabulary: 4, grammar: 3 } });
    d.en.journal.push({ id: 'j1', added: now, phrase: 'come across', def: 'to find or meet by chance', coll: 'come across a problem, come across as friendly', ex: 'I came across an old photo of my grandmother yesterday.', tag: 'phrasal verb' });
    save();
  }

  function init() {
    MS.store.onFail = () => toast(T('Browser storage is blocked: export your data from Data and help.', 'El almacenamiento del navegador está bloqueado: exporta tus datos desde Datos y ayuda.'));
    if (/[?&]seed=demo/.test(location.search)) seedDemo();
    applyTheme(); renderShell(); setupSearch();
    U.$('#menu-btn').addEventListener('click', () => { const open = document.body.classList.toggle('rail-open'); U.$('#menu-btn').setAttribute('aria-expanded', open); });
    U.$('#scrim').addEventListener('click', () => document.body.classList.remove('rail-open'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.body.classList.remove('rail-open'); });
    window.addEventListener('hashchange', route);
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (D().settings.theme === 'auto') renderShell(); }); } catch (e) { /* old browsers */ }
    route();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  MS.app = { init, route, seedDemo };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
