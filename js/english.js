/* english.js — Module 2: English B2/C1 → C1/C2. Views: assessment & goals, weekly plan + roadmap, tools, resources. */
(function () {
  const MS = (window.MS = window.MS || {});
  const U = MS.ui, { h, T, L, clear, icon, toast } = U;
  const E = () => MS.store.data.en;
  const save = () => MS.store.save();
  let timers = [];
  const addTimer = (id) => timers.push(id);
  function cleanup() { timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); timers = []; }

  const extLink = (r) => {
    const href = r.url || 'https://duckduckgo.com/?q=' + encodeURIComponent(r.q || (typeof r.name === 'string' ? r.name : ''));
    return h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, typeof r.name === 'string' ? r.name : L(r.name), r.url ? null : h('span', { class: 'muted' }, ' ' + T('(search)', '(búsqueda)')));
  };
  const costLabel = (c) => ({ free: T('Free', 'Gratis'), paid: T('Paid', 'De pago'), freemium: T('Free + paid', 'Gratis + pago') }[c] || '');
  const field = (label, input, cls) => h('label', { class: 'field ' + (cls || '') }, h('span', { class: 'field-l' }, label), input);
  const text = (v, ph, on) => h('input', { type: 'text', value: v || '', placeholder: ph || '', oninput: (e) => on && on(e.target.value) });

  /* ================= Assessment & goals ================= */
  function radarSvg(latest, prev) {
    const S = MS.en.skills, n = S.length, cx = 160, cy = 150, R = 105;
    const pt = (i, v) => { const a = (-90 + (360 / n) * i) * Math.PI / 180; return [cx + R * (v / 6) * Math.cos(a), cy + R * (v / 6) * Math.sin(a)]; };
    const poly = (vals) => vals.map((v, i) => pt(i, v).map((x) => x.toFixed(1)).join(',')).join(' ');
    const ns = 'http://www.w3.org/2000/svg';
    const el = (t, a, kids) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); (kids || []).forEach((c) => e.appendChild(c)); return e; };
    const svg = el('svg', { viewBox: '0 0 320 300', class: 'radar', role: 'img', 'aria-label': T('Radar chart of your self-ratings', 'Gráfico radar de tus autoevaluaciones') });
    for (let lv = 1; lv <= 6; lv++) svg.appendChild(el('polygon', { points: poly(S.map(() => lv)), class: 'rd-ring' }));
    S.forEach((s, i) => {
      const [x, y] = pt(i, 6), [lx, ly] = pt(i, 7.2);
      svg.appendChild(el('line', { x1: cx, y1: cy, x2: x, y2: y, class: 'rd-axis' }));
      const t = el('text', { x: lx, y: ly + 4, 'text-anchor': Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end', class: 'rd-label' }); t.textContent = L(s); svg.appendChild(t);
    });
    if (prev) svg.appendChild(el('polygon', { points: poly(S.map((s) => prev.r[s.id] || 0)), class: 'rd-prev' }));
    if (latest) {
      svg.appendChild(el('polygon', { points: poly(S.map((s) => latest.r[s.id] || 0)), class: 'rd-now' }));
      S.forEach((s, i) => { const [x, y] = pt(i, latest.r[s.id] || 0); svg.appendChild(el('circle', { cx: x, cy: y, r: 3.5, class: 'rd-dot' })); });
    }
    return svg;
  }

  function assess(host) {
    cleanup();
    const e = E();
    const view = h('div', { class: 'page' });
    view.appendChild(h('header', { class: 'page-head' }, h('h1', null, T('English: level and goals', 'Inglés: nivel y metas')),
      h('p', { class: 'lead' }, T('Everything on this page is a rough self-estimate. Use it to see change over time, not as a certificate.', 'Todo en esta página es una autoevaluación aproximada. Úsala para ver el cambio con el tiempo, no como un certificado.'))));

    // goal
    const goalSel = h('select', { onchange: (ev) => { e.goal = ev.target.value; save(); customWrap.hidden = e.goal !== 'custom'; note.textContent = goalNote(); } },
      h('option', { value: '' }, T('Choose a goal…', 'Elige una meta…')), MS.en.goals.map((g) => h('option', { value: g.id, selected: e.goal === g.id }, L(g))));
    const goalNote = () => { const g = MS.en.goals.find((x) => x.id === e.goal); return g ? g.note : T('Pick a goal and the weekly plan will adapt to it.', 'Elige una meta y el plan semanal se adaptará.'); };
    const note = h('p', { class: 'muted' }, goalNote());
    const customWrap = h('div', { hidden: e.goal !== 'custom' }, field(T('My goal, in my words', 'Mi meta, en mis palabras'), text(e.goalCustom, '', (v) => { e.goalCustom = v; save(); })));
    view.appendChild(h('section', null, h('h2', null, T('Goal', 'Meta')),
      h('div', { class: 'row wrap' }, field(T('What are you aiming for?', '¿Qué quieres lograr?'), goalSel), field(T('Target date (optional)', 'Fecha objetivo (opcional)'), h('input', { type: 'date', value: e.goalDate || '', onchange: (ev) => { e.goalDate = ev.target.value; save(); } }))),
      customWrap, note,
      h('p', null, h('a', { class: 'btn', href: '#/en/plan' }, T('Open my weekly plan', 'Abrir mi plan semanal')))));

    // tests
    view.appendChild(h('section', null, h('h2', null, T('Check your level (rough estimate)', 'Comprueba tu nivel (estimación aproximada)')),
      h('p', null, T('Free online tests give a rough idea only. Results vary between tests and from day to day. Take one at the start and one at the end of the 12 weeks.', 'Las pruebas gratuitas en línea dan solo una idea aproximada. Los resultados varían entre pruebas y de un día a otro. Haz una al empezar y otra al terminar las 12 semanas.')),
      h('ul', { class: 'plain' }, MS.en.tests.map((t) => h('li', null, extLink(t))))));

    // self rating
    const sel = {};
    const last = e.ratings[e.ratings.length - 1];
    const ratingRow = h('div', { class: 'rate-grid' }, MS.en.skills.map((s) => {
      sel[s.id] = last ? last.r[s.id] : 2;
      return field(L(s), h('select', { onchange: (ev) => (sel[s.id] = +ev.target.value) }, MS.en.scale.map((lv, i) => h('option', { value: i + 1, selected: sel[s.id] === i + 1 }, lv))));
    }));
    const chartBox = h('div', { class: 'chart-box' });
    const hist = h('ul', { class: 'plain hist' });
    const drawRatings = () => {
      clear(chartBox); clear(hist);
      const rs = e.ratings;
      if (rs.length) {
        chartBox.appendChild(radarSvg(rs[rs.length - 1], rs[rs.length - 2]));
        chartBox.appendChild(h('p', { class: 'legend-line' }, h('span', { class: 'sw now' }), T('Latest', 'Última'), rs.length > 1 ? [h('span', { class: 'sw prev' }), T('Previous', 'Anterior')] : null));
      } else chartBox.appendChild(h('p', { class: 'muted' }, T('Save your first rating to see the chart.', 'Guarda tu primera evaluación para ver el gráfico.')));
      rs.slice().reverse().forEach((r) => hist.appendChild(h('li', null, h('strong', null, U.fmtDate(r.date)), ' ', MS.en.skills.map((s) => L(s).slice(0, 4) + ' ' + MS.en.scale[(r.r[s.id] || 1) - 1]).join(' · '),
        h('button', { class: 'btn ghost sm', type: 'button', 'aria-label': T('Delete rating', 'Borrar evaluación'), onclick: () => { e.ratings = e.ratings.filter((x) => x.id !== r.id); save(); drawRatings(); } }, icon('trash')))));
    };
    view.appendChild(h('section', null, h('h2', null, T('Self-rating by skill', 'Autoevaluación por habilidad')),
      h('p', { class: 'muted' }, T('B1 → C2. Be honest; the chart is only useful if you are.', 'B1 → C2. Sé honesto; el gráfico solo sirve si lo eres.')),
      ratingRow, h('p', null, h('button', { class: 'btn primary', type: 'button', onclick: () => { e.ratings.push({ id: MS.store.uid(), date: Date.now(), r: Object.assign({}, sel) }); save(); drawRatings(); toast(T('Rating saved.', 'Evaluación guardada.')); } }, T('Save this rating', 'Guardar esta evaluación'))),
      chartBox, hist));
    drawRatings();

    // can-do
    const cando = h('section', null, h('h2', null, T('CEFR can-do checklist', 'Lista de “puedo hacer” del MCER')),
      h('p', { class: 'muted' }, T('Tick what you can do comfortably, in real life, without preparation. These statements are my own paraphrases of the CEFR descriptors, not the official text.', 'Marca lo que puedes hacer con comodidad, en la vida real y sin preparación. Estas frases son mis propias paráfrasis de los descriptores del MCER, no el texto oficial.')));
    ['B2', 'C1'].forEach((lv) => {
      const list = MS.en.cando[lv];
      const prog = h('span', { class: 'prog' });
      const upd = () => { prog.textContent = list.filter((c) => e.can[c.id]).length + ' / ' + list.length; };
      const box = h('details', { open: lv === 'B2' || null }, h('summary', null, h('strong', null, lv), ' ', prog));
      MS.en.skills.forEach((s) => {
        const items = list.filter((c) => c.skill === s.id);
        if (!items.length) return;
        box.appendChild(h('fieldset', { class: 'fs' }, h('legend', null, L(s)), items.map((c) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!e.can[c.id], onchange: (ev) => { e.can[c.id] = ev.target.checked; save(); upd(); } }), c.t))));
      });
      upd(); cando.appendChild(box);
    });
    view.appendChild(cando);
    clear(host).appendChild(view);
  }

  /* ================= Weekly plan & roadmap ================= */
  const mondayOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const label = (key) => ({ listen: T('Listening', 'Escuchar'), shadow: T('Shadowing', 'Shadowing'), read: T('Reading', 'Lectura'), vocab: T('Vocabulary', 'Vocabulario'), write: T('Writing', 'Escritura'), 'write-work': T('Work writing', 'Escritura laboral'), speak: T('Speaking', 'Hablar'), 'speak-work': T('Work speaking', 'Hablar en el trabajo'), grammar: T('Grammar', 'Gramática'), exam: T('Exam practice', 'Práctica de examen'), review: T('Weekly review', 'Revisión semanal') }[key] || key);

  /* Pure: returns [{ day, items: [{ skill, min, text }] }] for week number `wk` (0-based) */
  function buildWeek(minutes, goalId, wk) {
    const goal = MS.en.goals.find((g) => g.id === goalId);
    return MS.en.rotation.map((base, di) => {
      let skills = (goal && goal.over[di]) || base;
      let plan;
      if (di === 6) plan = minutes >= 30 ? [['review', minutes >= 60 ? 20 : 15], ['vocab', minutes - (minutes >= 60 ? 20 : 15)]] : [['review', minutes]];
      else if (minutes <= 15) plan = [[skills[0], minutes]];
      else if (minutes <= 30) plan = [[skills[0], 15], [skills[1], minutes - 15]];
      else plan = [[skills[0], 25], [skills[1], 25], [skills.includes('vocab') ? 'listen' : 'vocab', minutes - 50]];
      return { day: di, items: plan.map(([sk, min]) => { const lib = MS.en.tasks[sk]; return { skill: sk, min, text: lib[(wk + di) % lib.length] }; }) };
    });
  }

  function plan(host) {
    cleanup();
    const e = E();
    let offset = 0;
    const view = h('div', { class: 'page' });
    const weekBox = h('div');
    const draw = () => {
      clear(weekBox);
      const monday = mondayOf(new Date()); monday.setDate(monday.getDate() + offset * 7);
      const wkKey = MS.store.dayKey(monday);
      const wkIndex = Math.round((monday - new Date(2024, 0, 1)) / (7 * 86400000));
      const days = buildWeek(e.minutes, e.goal, wkIndex);
      const goal = MS.en.goals.find((g) => g.id === e.goal);
      weekBox.appendChild(h('div', { class: 'row between wrap' }, h('h2', null, T('Week of ', 'Semana del ') + U.fmtDate(monday)),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { offset--; draw(); } }, T('Previous', 'Anterior')), h('button', { class: 'btn ghost sm', type: 'button', disabled: offset === 0, onclick: () => { offset = 0; draw(); } }, T('This week', 'Esta semana')), h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { offset++; draw(); } }, T('Next', 'Siguiente')))));
      weekBox.appendChild(h('p', { class: 'muted' }, goal ? T('Goal: ', 'Meta: ') + L(goal) + (e.goal === 'custom' && e.goalCustom ? ' (' + e.goalCustom + ')' : '') + '. ' + goal.note : T('No goal chosen yet, so this is the balanced mix. Choose a goal on the level page.', 'Aún no elegiste una meta, así que es la mezcla equilibrada. Elige una meta en la página de nivel.')));
      let done = 0, total = 0;
      const progress = h('p', { class: 'plan-progress' });
      days.forEach((d) => {
        const dayDate = new Date(monday); dayDate.setDate(dayDate.getDate() + d.day);
        const isToday = MS.store.dayKey(dayDate) === MS.store.dayKey();
        weekBox.appendChild(h('div', { class: 'day' + (isToday ? ' today' : '') }, h('h3', null, L(MS.en.dayLabels[d.day]), isToday ? h('span', { class: 'tag hi' }, T('today', 'hoy')) : null),
          d.items.map((it, i) => {
            const k = 'enplan:' + wkKey + ':' + d.day + ':' + i;
            total++; if (MS.store.data.checks[k]) done++;
            return h('label', { class: 'check task' }, h('input', { type: 'checkbox', checked: !!MS.store.data.checks[k], onchange: (ev) => { MS.store.data.checks[k] = ev.target.checked || undefined; if (!ev.target.checked) delete MS.store.data.checks[k]; save(); draw(); } }),
              h('span', null, h('strong', null, label(it.skill) + ' · ' + it.min + ' min'), h('br'), it.text));
          })));
      });
      progress.textContent = T(done + ' of ' + total + ' tasks done this week', done + ' de ' + total + ' tareas hechas esta semana');
      weekBox.insertBefore(progress, weekBox.children[2]);
    };
    view.appendChild(h('header', { class: 'page-head' }, h('h1', null, T('English: weekly plan', 'Inglés: plan semanal')),
      h('p', { class: 'lead' }, T('Tell me how many minutes you have each day. The plan mixes listening, shadowing, reading, vocabulary, writing, speaking and grammar.', 'Dime cuántos minutos tienes cada día. El plan mezcla escucha, shadowing, lectura, vocabulario, escritura, conversación y gramática.'))));
    view.appendChild(h('fieldset', { class: 'fs' }, h('legend', null, T('Minutes per day', 'Minutos por día')),
      h('div', { class: 'chips' }, [15, 30, 60].map((m) => h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'mins', checked: e.minutes === m, onchange: () => { e.minutes = m; save(); draw(); } }), h('span', null, m + ' min'))))));
    view.appendChild(weekBox);
    draw();

    // roadmap
    const road = h('section', null);
    const drawRoad = () => {
      clear(road);
      road.appendChild(h('h2', null, T('12-week roadmap', 'Hoja de ruta de 12 semanas')));
      const startedAt = e.start ? new Date(e.start + 'T00:00:00') : null;
      const cur = startedAt ? Math.floor((new Date() - startedAt) / (7 * 86400000)) + 1 : 0;
      road.appendChild(h('div', { class: 'row wrap' },
        startedAt ? h('p', { class: 'muted' }, T('Started ', 'Empezó ') + U.fmtDate(startedAt) + (cur > 12 ? T(' — finished. Time to re-assess.', ' — terminada. Hora de reevaluar.') : T(' — you are in week ' + cur + '.', ' — estás en la semana ' + cur + '.'))) : h('p', { class: 'muted' }, T('Start the roadmap to see which week you are in.', 'Inicia la hoja de ruta para ver en qué semana estás.')),
        h('button', { class: 'btn ' + (startedAt ? 'ghost' : 'primary') + ' sm', type: 'button', onclick: () => { e.start = MS.store.dayKey(); save(); drawRoad(); } }, startedAt ? T('Restart today', 'Reiniciar hoy') : T('Start today', 'Empezar hoy'))));
      road.appendChild(h('ol', { class: 'roadmap' }, MS.en.roadmap.map((w, i) => {
        const k = 'enrw:' + i;
        return h('li', { class: i + 1 === cur ? 'now' : '' }, h('div', null, h('strong', null, 'Week ' + (i + 1) + ': ' + w.theme), i + 1 === cur ? h('span', { class: 'tag hi' }, T('this week', 'esta semana')) : null),
          h('p', null, w.focus), h('p', { class: 'muted' }, T('By the end: ', 'Al final: ') + w.out),
          h('label', { class: 'check sm' }, h('input', { type: 'checkbox', checked: !!MS.store.data.checks[k], onchange: (ev) => { if (ev.target.checked) MS.store.data.checks[k] = true; else delete MS.store.data.checks[k]; save(); } }), T('Week done', 'Semana hecha')));
      })));
    };
    view.appendChild(road); drawRoad();
    clear(host).appendChild(view);
  }

  /* ================= Tools ================= */
  const TABS = [['journal', 'Vocabulary journal', 'Diario de vocabulario'], ['review', 'Review cards', 'Repasar tarjetas'], ['cloze', 'Phrase trainer', 'Entrenador de frases'], ['writing', 'Writing checker', 'Revisor de escritura'], ['shadow', 'Shadowing timer', 'Temporizador de shadowing'], ['speak', 'Speaking prompts', 'Temas para hablar'], ['listen', 'Listening log', 'Registro de escucha'], ['weekly', 'Weekly review', 'Revisión semanal']];
  function tools(host, tab) {
    cleanup();
    tab = TABS.some((t) => t[0] === tab) ? tab : 'journal';
    const body = h('div', { class: 'tool-body' });
    const nav = h('div', { class: 'tabs', role: 'tablist' }, TABS.map((t) => h('a', { class: 'tab', role: 'tab', 'aria-selected': t[0] === tab, href: '#/en/tools?tab=' + t[0] }, T(t[1], t[2]))));
    clear(host).appendChild(h('div', { class: 'page' }, h('header', { class: 'page-head' }, h('h1', null, T('English tools', 'Herramientas de inglés'))), nav, body));
    ({ journal, review, cloze, writing, shadow, speak, listen, weekly }[tab])(body);
  }

  function journal(box) {
    const e = E();
    let editId = null, q = '';
    const f = { phrase: '', def: '', coll: '', ex: '', tag: '' };
    const inputs = {};
    const form = h('form', { class: 'jform', onsubmit: (ev) => { ev.preventDefault(); submit(); } },
      field(T('Word or phrase', 'Palabra o frase'), (inputs.phrase = text('', 'e.g. come across', (v) => (f.phrase = v)))),
      field(T('Definition', 'Definición'), (inputs.def = text('', T('in simple English', 'en inglés sencillo'), (v) => (f.def = v)))),
      field(T('Collocations', 'Colocaciones'), (inputs.coll = text('', T('words that go with it', 'palabras que van con ella'), (v) => (f.coll = v)))),
      field(T('Example in my own words', 'Ejemplo en mis propias palabras'), (inputs.ex = text('', '', (v) => (f.ex = v))), 'wide'),
      field(T('Tag', 'Etiqueta'), (inputs.tag = text('', T('e.g. phrasal verb, work', 'ej. phrasal verb, trabajo'), (v) => (f.tag = v)))),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'submit' }, T('Save entry', 'Guardar entrada')), h('button', { class: 'btn ghost', type: 'button', onclick: () => reset() }, T('Clear form', 'Limpiar formulario'))));
    const list = h('ul', { class: 'jlist' });
    const search = h('input', { type: 'search', placeholder: T('Search journal', 'Buscar en el diario'), oninput: (ev) => { q = ev.target.value.toLowerCase(); draw(); } });
    function reset() { editId = null; Object.keys(f).forEach((k) => { f[k] = ''; inputs[k].value = ''; }); }
    function submit() {
      if (!f.phrase.trim()) { inputs.phrase.focus(); toast(T('Write the word or phrase first.', 'Escribe primero la palabra o frase.')); return; }
      if (editId) { Object.assign(e.journal.find((x) => x.id === editId), f); }
      else e.journal.unshift({ id: MS.store.uid(), added: Date.now(), phrase: f.phrase.trim(), def: f.def.trim(), coll: f.coll.trim(), ex: f.ex.trim(), tag: f.tag.trim() });
      save(); reset(); draw(); toast(T('Saved.', 'Guardado.'));
    }
    function draw() {
      clear(list);
      const items = e.journal.filter((x) => !q || (x.phrase + ' ' + x.def + ' ' + x.tag + ' ' + x.coll).toLowerCase().includes(q));
      if (!items.length) list.appendChild(h('li', { class: 'muted' }, e.journal.length ? T('No entries match.', 'Ninguna entrada coincide.') : T('Your journal is empty. Add the first phrase you met today.', 'Tu diario está vacío. Agrega la primera frase que viste hoy.')));
      items.forEach((x) => list.appendChild(h('li', null, h('div', null, h('strong', null, x.phrase), x.tag ? h('span', { class: 'tag' }, x.tag) : null),
        x.def ? h('div', null, x.def) : null, x.coll ? h('div', { class: 'muted' }, T('Collocations: ', 'Colocaciones: ') + x.coll) : null, x.ex ? h('div', { class: 'muted' }, '“' + x.ex + '”') : null,
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { editId = x.id; Object.keys(f).forEach((k) => { const src = { phrase: x.phrase, def: x.def, coll: x.coll, ex: x.ex, tag: x.tag }; f[k] = src[k]; inputs[k].value = src[k]; }); inputs.phrase.focus(); window.scrollTo({ top: 0 }); } }, icon('edit'), T('Edit', 'Editar')),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => MS.ui.confirmDlg(T('Delete entry?', '¿Borrar entrada?'), x.phrase, T('Delete', 'Borrar'), () => { e.journal = e.journal.filter((y) => y.id !== x.id); delete MS.store.data.srs['e:' + x.id]; save(); draw(); }) }, icon('trash'), T('Delete', 'Borrar'))))));
    }
    box.append(h('h2', null, T('Vocabulary journal', 'Diario de vocabulario')), h('p', { class: 'muted' }, T('Write the example sentence yourself. A sentence from your own life is remembered far better than a copied one.', 'Escribe tú mismo la oración de ejemplo. Una frase de tu propia vida se recuerda mucho mejor que una copiada.')), form, h('div', { class: 'row between wrap' }, h('h3', null, T('Entries', 'Entradas') + ' (' + e.journal.length + ')'), search), list);
    draw();
  }

  function review(box) {
    const e = E();
    const due = e.journal.filter((x) => { const st = MS.srs.get('e:' + x.id); return !st || MS.srs.isDue(st); });
    box.appendChild(h('h2', null, T('Review cards', 'Repasar tarjetas')));
    if (!e.journal.length) { box.appendChild(h('p', { class: 'muted' }, T('Add entries to the journal first.', 'Primero agrega entradas al diario.'))); return; }
    if (!due.length) { box.appendChild(h('p', null, T('Nothing is due. Come back tomorrow, or add new entries.', 'No hay nada pendiente. Vuelve mañana o agrega entradas nuevas.'))); return; }
    const queue = U.shuffle(due).slice(0, 20);
    let i = 0, ok = 0;
    const card = h('div', { class: 'stage' });
    box.appendChild(card);
    const next = () => {
      clear(card);
      if (i >= queue.length) { card.appendChild(h('div', { class: 'summary' }, h('p', { class: 'score-num' }, ok + ' / ' + queue.length), h('p', null, T('Review done. Cards you marked Again will return in 10 minutes.', 'Repaso terminado. Las tarjetas marcadas “Otra vez” volverán en 10 minutos.')), h('a', { class: 'btn', href: '#/en/tools?tab=cloze' }, T('Try the phrase trainer', 'Probar el entrenador de frases')))); MS.store.logActivity(0, queue.length, ok); return; }
      const x = queue[i];
      const back = h('div', { hidden: true }, h('p', { class: 'q-big en' }, x.phrase), x.coll ? h('p', { class: 'muted' }, x.coll) : null, x.ex ? h('p', null, '“' + x.ex + '”') : null);
      const grades = h('div', { class: 'row actions', hidden: true }, [[0, T('Again', 'Otra vez')], [1, T('Hard', 'Difícil')], [2, T('Good', 'Bien')], [3, T('Easy', 'Fácil')]].map(([g, l]) => h('button', { class: 'btn grade g' + g, type: 'button', onclick: () => { MS.srs.grade('e:' + x.id, g); if (g > 0) ok++; i++; next(); } }, l)));
      const show = h('button', { class: 'btn primary', type: 'button', onclick: () => { back.hidden = false; grades.hidden = false; show.hidden = true; } }, T('Show answer', 'Mostrar respuesta'));
      card.append(h('p', { class: 'act-label' }, (i + 1) + ' / ' + queue.length), h('p', { class: 'q-meaning' }, x.def || T('(no definition: recall the phrase)', '(sin definición: recuerda la frase)')), x.tag ? h('p', null, h('span', { class: 'tag' }, x.tag)) : null, back, show, grades);
      show.focus();
    };
    next();
  }

  function cloze(box) {
    const e = E();
    box.appendChild(h('h2', null, T('Phrasal verb and collocation trainer', 'Entrenador de phrasal verbs y colocaciones')));
    const entries = e.journal.filter((x) => x.phrase);
    if (!entries.length) { box.appendChild(h('p', { class: 'muted' }, T('Cards are made from your journal. Add some entries with example sentences first.', 'Las tarjetas se crean a partir de tu diario. Primero agrega entradas con oraciones de ejemplo.'))); return; }
    const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();
    const queue = U.shuffle(entries).slice(0, 10);
    let i = 0, score = 0;
    const stage = h('div', { class: 'stage' });
    box.appendChild(stage);
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const next = () => {
      clear(stage);
      if (i >= queue.length) { stage.appendChild(h('div', { class: 'summary' }, h('p', { class: 'score-num' }, score + ' / ' + queue.length), h('button', { class: 'btn primary', type: 'button', onclick: () => cloze(clear(box)) }, T('New round', 'Nueva ronda')))); return; }
      const x = queue[i];
      const re = new RegExp(esc(x.phrase.trim()), 'i');
      const gap = x.ex && re.test(x.ex);
      const prompt = gap ? x.ex.replace(re, '_____') : x.def;
      const input = h('input', { type: 'text', class: 'big-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': T('Your answer', 'Tu respuesta'), onkeydown: (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); check(); } } });
      const fb = h('div', { 'aria-live': 'polite' });
      const hint = x.coll ? h('button', { class: 'btn ghost sm', type: 'button', onclick: (ev) => { ev.currentTarget.replaceWith(h('span', { class: 'muted' }, T('Collocations: ', 'Colocaciones: ') + x.coll)); } }, T('Show collocations', 'Mostrar colocaciones')) : null;
      const btn = h('button', { class: 'btn primary', type: 'button', onclick: () => check() }, T('Check', 'Comprobar'));
      function check() {
        if (!input.value.trim()) return;
        const ok = norm(input.value) === norm(x.phrase);
        if (ok) score++;
        input.disabled = true; btn.disabled = true;
        fb.appendChild(h('div', { class: 'fb ' + (ok ? 'ok' : 'bad') }, h('p', { class: 'fb-head' }, ok ? T('Correct', 'Correcto') : T('Not quite', 'Casi')), ok ? null : h('p', null, T('Answer: ', 'Respuesta: '), h('strong', null, x.phrase)), h('button', { class: 'btn primary', type: 'button', id: 'cl-next', onclick: () => { i++; next(); } }, i + 1 >= queue.length ? T('See results', 'Ver resultados') : T('Next', 'Siguiente'))));
        MS.srs.grade('e:' + x.id, ok ? 2 : 0);
        setTimeout(() => { const b = document.getElementById('cl-next'); b && b.focus(); }, 30);
      }
      stage.append(h('p', { class: 'act-label' }, (i + 1) + ' / ' + queue.length), h('p', { class: 'task' }, gap ? T('Fill the gap:', 'Completa el espacio:') : T('Type the phrase that means:', 'Escribe la frase que significa:')), h('p', { class: 'q-meaning' }, prompt || '…'), input, h('div', { class: 'row actions' }, btn, hint), fb);
      input.focus();
    };
    next();
  }

  function writing(box) {
    const e = E();
    const ta = h('textarea', { rows: 10, placeholder: T('Paste or write your text here. It stays in this browser.', 'Pega o escribe tu texto aquí. Se queda en este navegador.'), 'aria-label': T('Your text', 'Tu texto'), oninput: (ev) => { e.draft = ev.target.value; save(); stats(); } }, e.draft || '');
    const out = h('div', { class: 'wstats' });
    const stats = () => {
      const t = ta.value;
      clear(out);
      const words = (t.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []);
      const sentences = t.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => /[a-z]/i.test(s));
      const lens = sentences.map((s) => (s.match(/[a-z]+(?:'[a-z]+)?/gi) || []).length);
      const avg = lens.length ? (lens.reduce((a, b) => a + b, 0) / lens.length) : 0;
      const counts = {};
      words.forEach((w) => { if (w.length > 3 && !MS.en.stopwords.has(w)) counts[w] = (counts[w] || 0) + 1; });
      const rep = Object.keys(counts).filter((w) => counts[w] >= 3).sort((a, b) => counts[b] - counts[a]).slice(0, 10);
      const lower = ' ' + t.toLowerCase().replace(/[^a-z' ]/g, ' ') + ' ';
      const conns = MS.en.connectors.filter((c) => lower.includes(' ' + c + ' '));
      const long = lens.filter((n) => n > 30).length;
      const cell = (k, v, sub) => h('div', { class: 'stat' }, h('span', { class: 'stat-v' }, v), h('span', { class: 'stat-k' }, k), sub ? h('span', { class: 'muted' }, sub) : null);
      out.append(cell(T('Words', 'Palabras'), words.length), cell(T('Sentences', 'Oraciones'), sentences.length), cell(T('Average sentence length', 'Longitud media de oración'), avg ? avg.toFixed(1) : '–', T('words (15–25 is typical for formal writing)', 'palabras (15–25 es típico en escritura formal)')),
        cell(T('Longest sentence', 'Oración más larga'), lens.length ? Math.max.apply(null, lens) : '–', long ? T(long + ' sentence(s) over 30 words', long + ' oración(es) de más de 30 palabras') : ''));
      out.append(h('div', { class: 'stat wide' }, h('span', { class: 'stat-k' }, T('Repeated words (3 or more times, common words skipped)', 'Palabras repetidas (3 o más veces, sin palabras comunes)')),
        rep.length ? h('span', null, rep.map((w) => h('span', { class: 'tag' }, w + ' ×' + counts[w]))) : h('span', { class: 'muted' }, words.length ? T('None found.', 'Ninguna encontrada.') : '–')));
      out.append(h('div', { class: 'stat wide' }, h('span', { class: 'stat-k' }, T('Linking words found', 'Conectores encontrados')),
        conns.length ? h('span', null, conns.map((w) => h('span', { class: 'tag' }, w))) : h('span', { class: 'muted' }, words.length ? T('None from my list.', 'Ninguno de mi lista.') : '–')));
    };
    const checks = h('div', null, MS.en.writeChecklist.map((g) => h('fieldset', { class: 'fs' }, h('legend', null, g.title), g.items.map((it, i) => {
      const k = g.id + i;
      return h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!e.writeChecks[k], onchange: (ev) => { if (ev.target.checked) e.writeChecks[k] = true; else delete e.writeChecks[k]; save(); } }), it);
    }))));
    box.append(h('h2', null, T('Writing checker', 'Revisor de escritura')), h('p', { class: 'muted' }, T('The counts are simple and local. They point at things to look at; they do not judge quality.', 'Los conteos son simples y locales. Señalan cosas que revisar; no juzgan la calidad.')), ta, out,
      h('h3', null, T('Before you submit', 'Antes de enviar')), checks,
      h('div', { class: 'row' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => { e.writeChecks = {}; save(); writing(clear(box)); } }, T('Clear checklist', 'Limpiar lista')), h('button', { class: 'btn ghost', type: 'button', onclick: () => { ta.value = ''; e.draft = ''; save(); stats(); } }, T('Clear text', 'Limpiar texto'))));
    stats();
  }

  function beep() {
    try { const ac = new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.connect(g); g.connect(ac.destination); o.frequency.value = 660; g.gain.value = 0.08; o.start(); o.stop(ac.currentTime + 0.25); } catch (x) { /* no audio */ }
  }

  function shadow(box) {
    const e = E();
    let mins = 10, left = 0, running = false, started = 0, tid = null;
    const url = h('input', { type: 'url', placeholder: 'https://…', 'aria-label': T('Clip link', 'Enlace del clip') });
    const note = h('input', { type: 'text', placeholder: T('What did you shadow? (optional)', '¿Qué hiciste con shadowing? (opcional)') });
    const clock = h('p', { class: 'big-clock', role: 'timer' }, U.fmtTime(mins * 60));
    const go = h('button', { class: 'btn primary', type: 'button', onclick: () => toggle() }, T('Start', 'Empezar'));
    const finishBtn = h('button', { class: 'btn', type: 'button', onclick: () => finish(true) }, T('Stop and log', 'Detener y registrar'));
    finishBtn.hidden = true;
    const log = h('ul', { class: 'plain hist' });
    const lens = h('div', { class: 'chips' }, [5, 10, 15].map((m) => h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'shm', checked: m === mins, onchange: () => { mins = m; if (!running) clock.textContent = U.fmtTime(m * 60); } }), h('span', null, m + ' min'))));
    function toggle() {
      if (!running) { running = true; started = Date.now(); left = mins * 60; go.textContent = T('Running…', 'En curso…'); go.disabled = true; finishBtn.hidden = false; tid = setInterval(() => { left--; clock.textContent = U.fmtTime(left); if (left <= 0) finish(false); }, 1000); addTimer(tid); }
    }
    function finish(early) {
      clearInterval(tid); const secs = Math.round((Date.now() - started) / 1000); running = false; go.disabled = false; go.textContent = T('Start', 'Empezar'); finishBtn.hidden = true; clock.textContent = U.fmtTime(mins * 60);
      if (!early) beep();
      if (secs >= 20) { e.shadow.unshift({ id: MS.store.uid(), date: Date.now(), url: url.value.trim(), note: note.value.trim(), sec: secs }); save(); MS.store.logActivity(secs, 0, 0); drawLog(); toast(T('Logged ' + Math.round(secs / 60) + ' min.', 'Registrados ' + Math.round(secs / 60) + ' min.')); }
    }
    function drawLog() {
      clear(log);
      const total = e.shadow.reduce((a, b) => a + b.sec, 0);
      if (!e.shadow.length) log.appendChild(h('li', { class: 'muted' }, T('No sessions yet.', 'Aún no hay sesiones.')));
      else log.appendChild(h('li', { class: 'muted' }, T('Total shadowing: ', 'Total de shadowing: ') + Math.round(total / 60) + ' min'));
      e.shadow.slice(0, 12).forEach((s) => log.appendChild(h('li', null, U.fmtDate(s.date) + ' · ' + Math.round(s.sec / 60) + ' min', s.note ? ' · ' + s.note : '', s.url ? [' · ', h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, T('clip', 'clip'))] : null,
        h('button', { class: 'btn ghost sm', type: 'button', 'aria-label': T('Delete', 'Borrar'), onclick: () => { e.shadow = e.shadow.filter((x) => x.id !== s.id); save(); drawLog(); } }, icon('trash')))));
    }
    box.append(h('h2', null, T('Shadowing timer', 'Temporizador de shadowing')), h('p', { class: 'muted' }, T('Paste a link to a clip you like, open it in another tab, press Start and speak along a moment behind the speaker.', 'Pega el enlace de un clip que te guste, ábrelo en otra pestaña, pulsa Empezar y habla junto al hablante, un instante detrás.')),
      field(T('Clip link', 'Enlace del clip'), url), field(T('Note', 'Nota'), note), lens, clock,
      h('div', { class: 'row actions' }, go, finishBtn, h('button', { class: 'btn ghost', type: 'button', onclick: () => { const u = url.value.trim(); if (/^https?:\/\//i.test(u)) window.open(u, '_blank', 'noopener'); else toast(T('Paste a link that starts with https://', 'Pega un enlace que empiece con https://')); } }, T('Open clip', 'Abrir clip'))),
      h('h3', null, T('Log', 'Registro')), log);
    drawLog();
  }

  function speak(box) {
    const e = E();
    let prompt = null, rec = null, chunks = [], stream = null, left = 60, tid = null, url = null;
    const pText = h('p', { class: 'q-meaning' }, T('Press “New topic”.', 'Pulsa “Nuevo tema”.'));
    const clock = h('p', { class: 'big-clock', role: 'timer' }, '1:00');
    const recCb = h('input', { type: 'checkbox', checked: typeof MediaRecorder !== 'undefined' });
    const playback = h('div');
    const noteBox = h('div');
    const msg = h('p', { class: 'muted', 'aria-live': 'polite' });
    const go = h('button', { class: 'btn primary', type: 'button', onclick: () => start() }, icon('mic'), T('Start 1 minute', 'Empezar 1 minuto'));
    const stop = h('button', { class: 'btn', type: 'button', onclick: () => end() }, icon('stop'), T('Stop', 'Detener'));
    stop.hidden = true;
    const history = h('ul', { class: 'plain hist' });
    function newTopic() { prompt = MS.en.prompts[Math.floor(Math.random() * MS.en.prompts.length)]; pText.textContent = prompt; }
    async function start() {
      if (!prompt) newTopic();
      clear(playback); clear(noteBox); msg.textContent = '';
      if (recCb.checked) {
        if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices) { msg.textContent = T('This browser cannot record audio. The timer still works.', 'Este navegador no puede grabar audio. El temporizador sí funciona.'); }
        else {
          try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); chunks = []; rec = new MediaRecorder(stream); rec.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data); rec.onstop = onStop; rec.start(); }
          catch (err) { rec = null; msg.textContent = T('Microphone access was blocked, so I will only run the timer. Allow the microphone in the browser address bar to record.', 'Se bloqueó el micrófono, así que solo usaré el temporizador. Permite el micrófono en la barra de direcciones para grabar.'); }
        }
      }
      left = 60; clock.textContent = '1:00'; go.hidden = true; stop.hidden = false;
      tid = setInterval(() => { left--; clock.textContent = U.fmtTime(left); if (left <= 0) end(); }, 1000); addTimer(tid);
    }
    function onStop() {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: (rec && rec.mimeType) || 'audio/webm' });
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(blob);
      clear(playback).append(h('p', null, T('Listen to yourself. This recording lives only in this tab and disappears when you close or reload the page.', 'Escúchate. Esta grabación solo vive en esta pestaña y desaparece al cerrar o recargar la página.')), h('audio', { controls: true, src: url }));
    }
    function end() {
      clearInterval(tid); const used = 60 - left; go.hidden = false; stop.hidden = true;
      if (rec && rec.state !== 'inactive') rec.stop();
      beep(); clock.textContent = '1:00';
      clear(noteBox).appendChild(h('div', { class: 'fieldline' }, field(T('One thing to improve (saved to your log)', 'Algo para mejorar (se guarda en tu registro)'), (function () { const i = text('', ''); i.id = 'sp-note'; return i; })()), h('button', { class: 'btn', type: 'button', onclick: () => { const n = document.getElementById('sp-note'); e.speak.unshift({ id: MS.store.uid(), date: Date.now(), prompt, sec: used, note: n ? n.value.trim() : '' }); save(); MS.store.logActivity(used, 0, 0); drawHist(); toast(T('Saved.', 'Guardado.')); } }, T('Save note', 'Guardar nota'))));
    }
    function drawHist() {
      clear(history);
      if (!e.speak.length) history.appendChild(h('li', { class: 'muted' }, T('No speaking sessions logged yet.', 'Aún no hay sesiones registradas.')));
      e.speak.slice(0, 8).forEach((s) => history.appendChild(h('li', null, h('strong', null, U.fmtDate(s.date)), ' ' + s.prompt, s.note ? h('div', { class: 'muted' }, T('To improve: ', 'Mejorar: ') + s.note) : null)));
    }
    box.append(h('h2', null, T('Speaking prompts', 'Temas para hablar')), h('p', { class: 'muted' }, T('Speak for a full minute without stopping. If you get stuck, say it differently instead of going silent. Audio stays in your browser.', 'Habla un minuto completo sin parar. Si te trabas, dilo de otra forma en vez de callarte. El audio se queda en tu navegador.')),
      h('div', { class: 'stage' }, pText, h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: newTopic }, T('New topic', 'Nuevo tema')), h('label', { class: 'check sm' }, recCb, T('Record myself', 'Grabarme'))), clock, h('div', { class: 'row actions' }, go, stop), msg, playback, noteBox),
      h('h3', null, T('Log', 'Registro')), history);
    drawHist();
    box.__cleanup = () => { if (stream) stream.getTracks().forEach((t) => t.stop()); if (url) URL.revokeObjectURL(url); };
    cleanupExtra = box.__cleanup;
  }
  let cleanupExtra = null;
  const baseCleanup = cleanup;

  function listen(box) {
    const e = E();
    const f = { src: '', min: 10, pct: 70, words: '' };
    const pctOut = h('output', null, '70%');
    const list = h('ul', { class: 'plain hist' });
    const form = h('form', { class: 'jform', onsubmit: (ev) => { ev.preventDefault(); if (!f.src.trim()) { toast(T('Write what you listened to.', 'Escribe qué escuchaste.')); return; } e.listen.unshift({ id: MS.store.uid(), date: Date.now(), src: f.src.trim(), min: f.min, pct: f.pct, words: f.words.trim() }); save(); listen(clear(box)); toast(T('Logged.', 'Registrado.')); } },
      field(T('What did you listen to?', '¿Qué escuchaste?'), text('', T('podcast, talk, film…', 'podcast, charla, película…'), (v) => (f.src = v)), 'wide'),
      field(T('Minutes', 'Minutos'), h('input', { type: 'number', min: 1, max: 240, value: 10, oninput: (ev) => (f.min = +ev.target.value || 1) })),
      field(T('How much did I understand?', '¿Cuánto entendí?'), h('span', { class: 'row' }, h('input', { type: 'range', min: 0, max: 100, step: 5, value: 70, oninput: (ev) => { f.pct = +ev.target.value; pctOut.textContent = f.pct + '%'; } }), pctOut)),
      field(T('New words or phrases', 'Palabras o frases nuevas'), text('', T('separate with commas', 'separa con comas'), (v) => (f.words = v)), 'wide'),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'submit' }, T('Add to log', 'Agregar al registro'))));
    const avg = e.listen.length ? Math.round(e.listen.slice(0, 10).reduce((a, b) => a + b.pct, 0) / Math.min(10, e.listen.length)) : null;
    if (!e.listen.length) list.appendChild(h('li', { class: 'muted' }, T('Nothing logged yet.', 'Nada registrado todavía.')));
    e.listen.slice(0, 15).forEach((s) => list.appendChild(h('li', null, h('strong', null, U.fmtDate(s.date)), ' ' + s.src + ' · ' + s.min + ' min · ' + s.pct + '%', s.words ? h('div', { class: 'muted' }, T('New: ', 'Nuevo: ') + s.words) : null,
      h('button', { class: 'btn ghost sm', type: 'button', 'aria-label': T('Delete', 'Borrar'), onclick: () => { e.listen = e.listen.filter((x) => x.id !== s.id); save(); listen(clear(box)); } }, icon('trash')))));
    box.append(h('h2', null, T('Listening log', 'Registro de escucha')), h('p', { class: 'muted' }, T('Around 90% understanding is a good level for learning; below 60% the material is probably too hard.', 'Alrededor de 90% de comprensión es buen nivel para aprender; por debajo de 60% el material probablemente es demasiado difícil.')), form,
      avg !== null ? h('p', null, T('Average understanding, last 10 entries: ', 'Comprensión media, últimas 10 entradas: '), h('strong', null, avg + '%')) : null, list);
  }

  function weekly(box) {
    const e = E();
    const answers = MS.en.reviewPrompts.map(() => '');
    const list = h('ul', { class: 'plain hist' });
    const tas = MS.en.reviewPrompts.map((p, i) => field(p, h('textarea', { rows: 3, oninput: (ev) => (answers[i] = ev.target.value) }), 'wide'));
    if (!e.reviews.length) list.appendChild(h('li', { class: 'muted' }, T('No reviews saved yet.', 'Aún no hay revisiones guardadas.')));
    e.reviews.slice(0, 8).forEach((r) => list.appendChild(h('li', null, h('strong', null, U.fmtDate(r.date)), r.a.map((a, i) => a ? h('div', null, h('span', { class: 'muted' }, MS.en.reviewPrompts[i] + ' '), a) : null))));
    box.append(h('h2', null, T('Weekly review', 'Revisión semanal')), h('p', { class: 'muted' }, T('Five minutes once a week. Short, honest answers are enough.', 'Cinco minutos una vez por semana. Con respuestas cortas y honestas basta.')),
      h('form', { class: 'jform', onsubmit: (ev) => { ev.preventDefault(); if (!answers.some((a) => a.trim())) { toast(T('Write at least one answer.', 'Escribe al menos una respuesta.')); return; } e.reviews.unshift({ id: MS.store.uid(), date: Date.now(), a: answers.slice() }); save(); weekly(clear(box)); toast(T('Saved.', 'Guardado.')); } }, tas, h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'submit' }, T('Save review', 'Guardar revisión')))),
      h('h3', null, T('Past reviews', 'Revisiones anteriores')), list);
  }

  /* ================= Resources ================= */
  function resources(host) {
    cleanup();
    const view = h('div', { class: 'page' }, h('header', { class: 'page-head' }, h('h1', null, T('English resources', 'Recursos de inglés')),
      h('p', { class: 'lead' }, T('Short list, one reason each. Links marked “search” open a web search, so they cannot go stale. Prices and free tiers change: check them yourself.', 'Lista corta, una razón cada uno. Los enlaces marcados “búsqueda” abren una búsqueda web, así no se rompen. Los precios y niveles gratuitos cambian: compruébalos tú mismo.'))));
    MS.en.resources.forEach((g) => view.appendChild(h('section', null, h('h2', null, L(g.group)),
      h('ul', { class: 'res' }, g.items.map((r) => h('li', null, h('div', null, extLink(r), h('span', { class: 'tag cost-' + r.cost }, costLabel(r.cost))), h('p', null, r.why)))))));
    view.appendChild(h('section', null, h('h2', null, T('How to learn: the short version', 'Cómo aprender: la versión corta')),
      h('dl', { class: 'howto' }, MS.en.howto.map((x) => [h('dt', null, x.t), h('dd', null, x.d)]))));
    clear(host).appendChild(view);
  }

  MS.english = {
    assess, plan, tools, resources, buildWeek,
    cleanup() { baseCleanup(); if (cleanupExtra) { try { cleanupExtra(); } catch (x) { /* ignore */ } cleanupExtra = null; } },
  };
})();
