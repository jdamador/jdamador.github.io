/* store.js — all user data lives in one JSON blob in localStorage (every call wrapped in try/catch).
   If localStorage is blocked, the app keeps working in memory and tells the user to export. */
(function () {
  const MS = (window.MS = window.MS || {});
  const KEY = 'masume.v1';

  const defaults = () => ({
    app: 'masume',
    v: 1,
    settings: {
      lang: (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en',
      theme: 'auto',
      script: 'hira',
      romaji: false,
      rate: 0.85,
    },
    known: {},          // { 'あ': true }
    words: [],          // { id, w, m, lesson, ex, note, hard, added }
    srs: {},            // 'k:あ' | 'w:<id>' | 'e:<id>'  → scheduler state
    mistakes: {},       // key → { n, ok, last }
    activity: {},       // 'YYYY-MM-DD' → { sec, q, ok }
    sessions: [],       // recent practice results
    checks: {},         // checklist ticks, any module
    quizDate: '',
    quizDone: {},
    notes: { teacher: '' },
    practicePrefs: {},
    en: {
      goal: '', goalCustom: '', goalDate: '', minutes: 30, start: '',
      ratings: [],      // { id, date, r: {listening: 4, ...} }
      can: {},
      journal: [],      // vocabulary journal
      shadow: [], listen: [], reviews: [], speak: [],
      draft: '', writeChecks: {},
    },
  });

  function mergeDeep(base, incoming) {
    if (Array.isArray(base) || Array.isArray(incoming)) return incoming === undefined ? base : incoming;
    if (base && typeof base === 'object' && incoming && typeof incoming === 'object') {
      const out = Object.assign({}, base);
      Object.keys(incoming).forEach((k) => { out[k] = k in base ? mergeDeep(base[k], incoming[k]) : incoming[k]; });
      return out;
    }
    return incoming === undefined ? base : incoming;
  }

  let memoryOnly = false;
  function readRaw() {
    try { return localStorage.getItem(KEY); } catch (e) { memoryOnly = true; return null; }
  }
  function load() {
    const raw = readRaw();
    if (!raw) return defaults();
    try { return mergeDeep(defaults(), JSON.parse(raw)); } catch (e) { return defaults(); }
  }

  let data = load();
  let timer = null, warned = false;
  const listeners = [];

  function flush() {
    clearTimeout(timer); timer = null;
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) {
      memoryOnly = true;
      if (!warned) { warned = true; MS.store.onFail && MS.store.onFail(e); }
    }
  }
  function save() {
    listeners.forEach((f) => { try { f(data); } catch (e) { /* ignore */ } });
    if (timer) return;
    timer = setTimeout(flush, 200);
  }
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);

  /* ---------- Export / import ---------- */
  function exportJSON() {
    return JSON.stringify(Object.assign({}, data, { exportedAt: new Date().toISOString() }), null, 2);
  }

  /* Merge: union records that have an id, keep the larger practice history, otherwise incoming wins. */
  function mergeData(local, inc) {
    const out = Object.assign({}, local);
    Object.keys(inc).forEach((k) => {
      const a = local[k], b = inc[k];
      if (Array.isArray(a) && Array.isArray(b)) {
        if (b.every((x) => x && typeof x === 'object' && 'id' in x) && a.every((x) => x && typeof x === 'object' && 'id' in x)) {
          const m = new Map(a.map((x) => [x.id, x]));
          b.forEach((x) => m.set(x.id, x));
          out[k] = [...m.values()];
        } else out[k] = a.length >= b.length ? a : b;
      } else if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
        if (k === 'srs') {
          const m = Object.assign({}, a);
          Object.keys(b).forEach((key) => { if (!m[key] || (b[key].seen || 0) > (m[key].seen || 0)) m[key] = b[key]; });
          out[k] = m;
        } else if (k === 'activity') {
          const m = Object.assign({}, a);
          Object.keys(b).forEach((d) => { m[d] = m[d] ? { sec: Math.max(m[d].sec, b[d].sec), q: Math.max(m[d].q, b[d].q), ok: Math.max(m[d].ok, b[d].ok) } : b[d]; });
          out[k] = m;
        } else out[k] = mergeData(a, b);
      } else if (b !== undefined && b !== '') out[k] = b;
    });
    return out;
  }

  function importJSON(text, mode) {
    let inc;
    try { inc = JSON.parse(text); } catch (e) { throw new Error('This file is not valid JSON.'); }
    if (!inc || typeof inc !== 'object' || inc.app !== 'masume') throw new Error('This file is not a Masume backup.');
    delete inc.exportedAt;
    data = mode === 'merge' ? mergeDeep(defaults(), mergeData(data, inc)) : mergeDeep(defaults(), inc);
    flush();
    listeners.forEach((f) => f(data));
  }

  function reset() { data = defaults(); flush(); listeners.forEach((f) => f(data)); }

  /* ---------- Helpers ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (d) => { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function logActivity(sec, q, ok) {
    const k = dayKey();
    const a = data.activity[k] || { sec: 0, q: 0, ok: 0 };
    a.sec += Math.round(sec); a.q += q; a.ok += ok;
    data.activity[k] = a;
    save();
  }
  function streak() {
    let n = 0;
    const d = new Date();
    if (!(data.activity[dayKey(d)] || {}).q) d.setDate(d.getDate() - 1); // today not done yet: count up to yesterday
    while ((data.activity[dayKey(d)] || {}).q) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  MS.store = {
    get data() { return data; },
    save, flush, exportJSON, importJSON, reset, dayKey, uid, logActivity, streak,
    get memoryOnly() { return memoryOnly; },
    onChange(f) { listeners.push(f); },
    onFail: null,
    defaults,
  };
})();
