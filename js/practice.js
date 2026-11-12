/* practice.js — the practice engine (no DOM): activity builders + the generator that mixes them.
   session.js draws the questions this file produces. */
(function () {
  const MS = (window.MS = window.MS || {});
  const K = () => MS.kana;

  /* ---------- seeded RNG (tests) ---------- */
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const shuf = (arr, rng) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
  const uniq = (arr) => Array.from(new Set(arr));

  /* ---------- items ---------- */
  const wordItem = (w) => ({ t: 'word', key: 'w:' + w.id, w });
  const kanaItem = (e, script) => ({ t: 'kana', key: 'k:' + (script === 'kata' ? e.k : e.h), ch: script === 'kata' ? e.k : e.h, e, script });
  const kanaOnlyWord = (w) => { const s = K().scriptCheck(w.w); return !s.other.length && (s.script === 'hira' || s.script === 'kata' || s.script === 'mixed'); };
  const soundOk = (e) => !e.dup && !e.small && !e.rare;
  const normMeaning = (m) => String(m || '').trim().toLowerCase();

  function kanaItemsFor(scope, srs, known, mistakes) {
    scope = scope || {};
    const scripts = scope.scripts && scope.scripts.length ? scope.scripts : ['hira'];
    const groups = scope.groups && scope.groups.length ? scope.groups : ['basic'];
    let items = [];
    K().KANA.forEach((e) => { if (groups.includes(e.g)) scripts.forEach((s) => items.push(kanaItem(e, s))); });
    if (scope.only === 'known') items = items.filter((i) => known && known[i.ch]);
    else if (scope.only === 'unknown') items = items.filter((i) => !(known && known[i.ch]));
    else if (scope.only === 'weak') {
      const weak = items.filter((i) => {
        const st = srs && srs[i.key];
        return (mistakes && mistakes[i.key]) || (st && st.seen >= 1 && MS.srs.recentAccuracy(st) < 0.8);
      });
      if (weak.length) items = weak;
    }
    return items;
  }

  /* Distractor kana (as chars) in the same script as the item, lookalikes first. */
  function kanaOptions(item, n, cx, sound) {
    const rng = cx.rng;
    const sameScript = cx.kanaAll.filter((i) => i.script === item.script && i.ch !== item.ch && (!sound || soundOk(i.e)));
    const grp = K().LOOKALIKES.find((g) => g.includes(item.ch)) || [];
    let cand = shuf(grp.filter((c) => c !== item.ch), rng).slice(0, 2);
    const sameGroup = shuf(sameScript.filter((i) => i.e.g === item.e.g).map((i) => i.ch), rng);
    const rest = shuf(sameScript.map((i) => i.ch), rng);
    cand = uniq(cand.concat(sameGroup, rest));
    const out = [];
    const seenR = new Set([item.e.r]);
    for (const c of cand) {
      const e = K().entryOf(c);
      if (sound && seenR.has(e.r)) continue;
      seenR.add(e.r); out.push(c);
      if (out.length >= n) break;
    }
    return out;
  }

  function meaningOptions(item, n, cx) {
    const mine = normMeaning(item.w.m);
    const seen = new Set([mine]);
    const out = [];
    shuf(cx.words, cx.rng).forEach((w) => {
      const m = normMeaning(w.m);
      if (!m || seen.has(m) || w.id === item.w.id) return;
      if (out.length < n) { seen.add(m); out.push(w); }
    });
    return out;
  }

  /* ---------- activity builders ---------- */
  const ACTS = {};
  const def = (id, cat, needs, en, es, build, extra) => { ACTS[id] = Object.assign({ id, cat, needs, en, es, build }, extra || {}); };

  // --- writing words ---
  def('w_meaning', 'write', 'wordK', 'Meaning → type the word', 'Significado → escribe la palabra', (it, cx) => {
    const w = it.w, same = cx.words.filter((x) => normMeaning(x.m) === normMeaning(w.m) && kanaOnlyWord(x)).map((x) => x.w);
    return { kind: 'typed', itemKeys: [it.key], prompt: { meaning: w.m, script: K().scriptCheck(w.w).script }, answer: w.w, alts: same, attribute: 'diff', promptText: w.m, expected: w.w, speak: w.w };
  });
  def('w_audio', 'write', 'wordK', 'Audio → type the word (dictation)', 'Audio → escribe la palabra (dictado)', (it) => ({
    kind: 'typed', itemKeys: [it.key], prompt: { audio: it.w.w, script: K().scriptCheck(it.w.w).script }, answer: it.w.w, attribute: 'diff', promptText: '🔊', expected: it.w.w, speak: it.w.w, needsAudio: true,
  }), { audio: true });
  def('w_blank', 'write', 'wordK', 'Missing kana → fill the blank', 'Kana faltante → completa el espacio', (it, cx) => {
    const u = K().units(it.w.w);
    if (u.length < 2) return null;
    const nb = u.length >= 5 ? 2 : 1;
    const idx = shuf(u.map((_, i) => i), cx.rng).slice(0, nb).sort((a, b) => a - b);
    const pattern = u.map((x, i) => (idx.includes(i) ? '＿' : x)).join('');
    const ans = idx.map((i) => u[i]).join('');
    return { kind: 'typed', itemKeys: [it.key], prompt: { meaning: it.w.m, pattern, blanks: nb, script: K().scriptCheck(it.w.w).script }, answer: ans, attribute: 'blank', promptText: pattern + ' (' + it.w.m + ')', expected: ans + ' → ' + it.w.w, speak: it.w.w, full: it.w.w };
  });
  def('w_scramble', 'write', 'wordK', 'Scrambled kana → put them in order', 'Kana desordenados → ponlos en orden', (it, cx) => {
    const u = K().units(it.w.w);
    if (u.length < 2 || new Set(u).size < 2) return null;
    let t = u.slice(), tries = 0;
    do { t = shuf(u, cx.rng); tries++; } while (t.join('') === u.join('') && tries < 12);
    if (t.join('') === u.join('')) return null;
    return { kind: 'scramble', itemKeys: [it.key], prompt: { meaning: it.w.m }, tiles: t, answer: it.w.w, promptText: it.w.m, expected: it.w.w, speak: it.w.w };
  });
  def('w_hand', 'write', 'wordK', 'Handwriting → write it, then check', 'Escritura a mano → escribe y verifica', (it) => ({
    kind: 'hand', itemKeys: [it.key], prompt: { meaning: it.w.m, audio: it.w.w }, answer: it.w.w, promptText: it.w.m, expected: it.w.w, speak: it.w.w,
  }));

  // --- kana ---
  def('k_stroke', 'kana', 'kana', 'Stroke order trainer', 'Entrenador de orden de trazos', (it) => ({
    kind: 'stroke', itemKeys: [it.key], kanaChars: [it.ch], prompt: { ch: it.ch }, answer: it.ch, promptText: it.ch, expected: it.ch, speak: it.ch,
  }));
  def('k_sound2kana', 'kana', 'kana', 'Sound → choose the kana', 'Sonido → elige el kana', (it, cx) => {
    if (!soundOk(it.e)) return null;
    const d = kanaOptions(it, 3, cx, true);
    if (d.length < 2) return null;
    const opts = shuf([it.ch].concat(d), cx.rng);
    return { kind: 'choice', itemKeys: [it.key], kanaChars: [it.ch], prompt: { romaji: it.e.r, audio: it.ch, big: false }, options: opts.map((o) => ({ text: o, ja: true })), answerIndex: opts.indexOf(it.ch), promptText: it.e.r, expected: it.ch, speak: it.ch, needsAudio: true };
  }, { audio: true });
  def('k_kana2sound', 'kana', 'kana', 'Kana → choose the sound', 'Kana → elige el sonido', (it, cx) => {
    if (!soundOk(it.e)) return null;
    const d = kanaOptions(it, 3, cx, true).map((c) => K().entryOf(c).r);
    if (d.length < 2) return null;
    const opts = shuf([it.e.r].concat(d), cx.rng);
    return { kind: 'choice', itemKeys: [it.key], kanaChars: [it.ch], prompt: { big: it.ch }, options: opts.map((o) => ({ text: o })), answerIndex: opts.indexOf(it.e.r), promptText: it.ch, expected: it.e.r, speak: it.ch };
  });
  def('k_convert', 'kana', 'any', 'Hiragana ↔ katakana conversion', 'Conversión hiragana ↔ katakana', (it, cx) => {
    if (it.t === 'word') {
      const sc = K().scriptCheck(it.w.w);
      if ((sc.script !== 'hira' && sc.script !== 'kata') || it.w.w.includes('ー') || sc.other.length) return null;
      const shown = sc.script === 'hira' ? K().toKata(it.w.w) : K().toHira(it.w.w);
      return { kind: 'typed', itemKeys: [it.key], prompt: { big: shown, task: sc.script, script: sc.script }, answer: it.w.w, attribute: 'diff', promptText: shown, expected: it.w.w, speak: it.w.w, forceScript: sc.script };
    }
    const other = it.script === 'hira' ? 'kata' : 'hira';
    const correct = other === 'kata' ? it.e.k : it.e.h;
    const fake = { ch: correct, e: it.e, script: other };
    const d = kanaOptions(fake, 3, cx, false);
    if (d.length < 2) return null;
    const opts = shuf([correct].concat(d), cx.rng);
    return { kind: 'choice', itemKeys: [it.key], kanaChars: [it.ch], prompt: { big: it.ch, task: other }, options: opts.map((o) => ({ text: o, ja: true })), answerIndex: opts.indexOf(correct), promptText: it.ch + ' → ' + (other === 'kata' ? 'カタカナ' : 'ひらがな'), expected: correct, speak: it.ch };
  });
  def('k_lookalike', 'kana', 'kana', 'Look-alike drill', 'Ejercicio de kana parecidos', (it, cx) => {
    const g = K().LOOKALIKES.find((x) => x.includes(it.ch));
    if (!g || !soundOk(it.e)) return null;
    let opts = g.slice();
    const extra = kanaOptions(it, 3, cx, true).filter((c) => !opts.includes(c));
    while (opts.length < 3 && extra.length) opts.push(extra.shift());
    opts = shuf(opts.slice(0, 4).includes(it.ch) ? opts.slice(0, 4) : opts.slice(0, 3).concat(it.ch), cx.rng);
    return { kind: 'choice', itemKeys: [it.key], kanaChars: [it.ch], prompt: { romaji: it.e.r, audio: it.ch, ask: true }, options: opts.map((o) => ({ text: o, ja: true })), answerIndex: opts.indexOf(it.ch), promptText: it.e.r, expected: it.ch, speak: it.ch, needsAudio: true };
  }, { audio: true });
  def('k_voicing', 'kana', 'kana', 'Voicing and length drill (audio)', 'Sonorización y duración (audio)', (it, cx) => {
    const hira = K().toHira(it.ch);
    const g = K().VOICING.find((x) => x.includes(hira));
    const useWords = !g || cx.rng() < 0.35;
    if (!useWords) {
      const members = g.map((c) => (it.script === 'kata' ? K().toKata(c) : c));
      const target = members.includes(it.ch) && cx.rng() < 0.6 ? it.ch : pick(members, cx.rng);
      const opts = shuf(members, cx.rng);
      return { kind: 'choice', itemKeys: ['k:' + target], kanaChars: [target], prompt: { audio: target, listen: true }, options: opts.map((o) => ({ text: o, ja: true })), answerIndex: opts.indexOf(target), promptText: '🔊', expected: target, speak: target, needsAudio: true };
    }
    const pair = pick(K().MINIMAL_PAIRS, cx.rng);
    const lang = cx.lang === 'es' ? 2 : 1;
    const which = cx.rng() < 0.5 ? 0 : 1;
    const opts = shuf([0, 1], cx.rng).map((i) => ({ text: pair[i][0], sub: pair[i][lang], ja: true }));
    return { kind: 'choice', itemKeys: [], prompt: { audio: pair[which][0], listen: true }, options: opts, answerIndex: opts.findIndex((o) => o.text === pair[which][0]), promptText: '🔊', expected: pair[which][0], speak: pair[which][0], needsAudio: true };
  }, { audio: true });
  def('k_speed', 'kana', 'kana', 'Speed round (60 s)', 'Ronda rápida (60 s)', (it, cx) => {
    const pool = cx.kanaPool.filter((i) => soundOk(i.e));
    if (pool.length < 4) return null;
    return { kind: 'speed', itemKeys: [], prompt: {}, seconds: 60, pool: pool.map((i) => ({ ch: i.ch, r: i.e.r })), answer: '', promptText: T2('Speed round', 'Ronda rápida'), expected: '' };
  }, { special: true });

  // --- recognition ---
  def('r_word2meaning', 'recog', 'word', 'Word → choose the meaning', 'Palabra → elige el significado', (it, cx) => {
    const d = meaningOptions(it, 3, cx);
    if (d.length < 1) return null;
    const opts = shuf([{ text: it.w.m, key: it.key }].concat(d.map((w) => ({ text: w.m }))), cx.rng);
    return { kind: 'choice', itemKeys: [it.key], prompt: { word: it.w.w, audio: it.w.w, speakable: true }, options: opts, answerIndex: opts.findIndex((o) => o.key === it.key), promptText: it.w.w, expected: it.w.m, speak: it.w.w };
  });
  def('r_meaning2word', 'recog', 'word', 'Meaning → choose the word', 'Significado → elige la palabra', (it, cx) => {
    const d = meaningOptions(it, 3, cx);
    if (d.length < 1) return null;
    const opts = shuf([{ text: it.w.w, key: it.key, ja: true }].concat(d.map((w) => ({ text: w.w, ja: true }))), cx.rng);
    return { kind: 'choice', itemKeys: [it.key], prompt: { meaning: it.w.m }, options: opts, answerIndex: opts.findIndex((o) => o.key === it.key), promptText: it.w.m, expected: it.w.w, speak: it.w.w };
  });
  def('r_audio2meaning', 'recog', 'word', 'Audio → choose the meaning', 'Audio → elige el significado', (it, cx) => {
    const d = meaningOptions(it, 3, cx);
    if (d.length < 1) return null;
    const opts = shuf([{ text: it.w.m, key: it.key }].concat(d.map((w) => ({ text: w.m }))), cx.rng);
    return { kind: 'choice', itemKeys: [it.key], prompt: { audio: it.w.w, listen: true }, options: opts, answerIndex: opts.findIndex((o) => o.key === it.key), promptText: '🔊', expected: it.w.m + ' (' + it.w.w + ')', speak: it.w.w, needsAudio: true };
  }, { audio: true });
  def('r_flash', 'recog', 'word', 'Flashcards (flip and grade)', 'Tarjetas (voltea y califica)', (it) => ({
    kind: 'flash', itemKeys: [it.key], prompt: { word: it.w.w }, card: { w: it.w.w, m: it.w.m, ex: it.w.ex, note: it.w.note }, answer: it.w.w, promptText: it.w.w, expected: it.w.m, speak: it.w.w, selfGraded: true,
  }), { selfGraded: true });
  def('r_match', 'recog', 'word', 'Matching game', 'Juego de emparejar', (it, cx) => {
    const group = [it.w];
    const seen = new Set([normMeaning(it.w.m)]);
    shuf(cx.selWords.length >= 3 ? cx.selWords : cx.words, cx.rng).forEach((w) => {
      const m = normMeaning(w.m);
      if (group.length < 4 && w.id !== it.w.id && m && !seen.has(m)) { seen.add(m); group.push(w); }
    });
    if (group.length < 3) {
      shuf(cx.words, cx.rng).forEach((w) => { const m = normMeaning(w.m); if (group.length < 4 && w.id !== it.w.id && m && !seen.has(m)) { seen.add(m); group.push(w); } });
    }
    if (group.length < 3) return null;
    return { kind: 'match', itemKeys: group.map((w) => 'w:' + w.id), pairs: group.map((w) => ({ key: 'w:' + w.id, w: w.w, m: w.m })), prompt: {}, answer: '', promptText: group.map((w) => w.w).join(' · '), expected: group.map((w) => w.w + ' = ' + w.m).join('; ') };
  });

  function T2(en, es) { return (MS.ui && MS.ui.T) ? MS.ui.T(en, es) : en; }

  const ACT_ORDER = ['w_meaning', 'w_audio', 'w_blank', 'w_scramble', 'w_hand', 'k_stroke', 'k_sound2kana', 'k_kana2sound', 'k_convert', 'k_lookalike', 'k_voicing', 'k_speed', 'r_word2meaning', 'r_meaning2word', 'r_audio2meaning', 'r_flash', 'r_match'];
  const PRESETS = {
    write: ['w_meaning', 'w_audio', 'w_blank', 'w_scramble', 'w_hand'],
    kana: ['k_stroke', 'k_sound2kana', 'k_kana2sound', 'k_convert', 'k_lookalike', 'k_voicing'],
    recog: ['r_word2meaning', 'r_meaning2word', 'r_audio2meaning', 'r_flash', 'r_match'],
    all: ACT_ORDER.filter((a) => a !== 'k_speed'),
    daily: ['k_sound2kana', 'k_kana2sound', 'k_convert', 'k_lookalike', 'w_meaning', 'w_audio', 'r_word2meaning', 'r_meaning2word', 'r_flash'],
  };

  function allowedInMode(id, mode) {
    const a = ACTS[id];
    if (!a) return false;
    if (mode === 'exam') return !a.selfGraded && id !== 'w_hand' && id !== 'k_stroke' && id !== 'k_speed';
    if (mode === 'quiz') return !a.selfGraded;
    return true;
  }

  /* ---------- generator ---------- */
  /* cfg: { acts[], length: 5|10|20|'all', mode, prioritize }
     data: { allWords[], selWords[], kanaItems[], kanaAll[], srs{}, lang }
     returns { questions[], warnings[] } */
  function generate(cfg, data, rng) {
    rng = rng || Math.random;
    const warnings = [];
    const mode = cfg.mode || 'practice';
    let acts = uniq((cfg.acts || []).filter((a) => allowedInMode(a, mode)));
    if (!acts.length) return { questions: [], warnings: ['no-activities'] };

    const wordItems = (data.selWords || []).map(wordItem);
    const kanaItems = data.kanaItems || [];
    const cx = { rng, words: data.allWords || [], selWords: data.selWords || [], kanaPool: kanaItems, kanaAll: data.kanaAll && data.kanaAll.length ? data.kanaAll : kanaItems, mode, lang: data.lang || 'en' };

    const pools = {
      wordK: wordItems.filter((i) => kanaOnlyWord(i.w)),
      word: wordItems,
      kana: kanaItems,
      any: wordItems.concat(kanaItems),
    };
    const feasible = (a) => {
      const need = ACTS[a].needs;
      if (!pools[need] || !pools[need].length) return false;
      if ((a.startsWith('r_') && a !== 'r_flash') && cx.words.length < 2) return false;
      if (a === 'r_match' && cx.words.length < 3) return false;
      return true;
    };
    const dropped = acts.filter((a) => !feasible(a));
    acts = acts.filter(feasible);
    if (dropped.length) warnings.push('dropped:' + dropped.join(','));
    if (!acts.length) return { questions: [], warnings: warnings.concat('nothing-feasible') };

    const usesWord = acts.some((a) => ['wordK', 'word'].includes(ACTS[a].needs));
    const usesKana = acts.some((a) => ['kana'].includes(ACTS[a].needs));
    let total = cfg.length;
    if (total === 'all') total = Math.max(1, Math.min(80, (usesWord ? wordItems.length : 0) + (usesKana ? Math.min(kanaItems.length, 30) : 0) || pools.any.length));
    total = Math.max(1, Math.min(total, 100));

    const prio = (it) => {
      if (!cfg.prioritize) return 0;
      const st = (data.srs || {})[it.key];
      if (!st) return 0.5;
      const acc = MS.srs.recentAccuracy(st);
      return (MS.srs.isDue(st) ? 1 : 0) + (acc == null ? 0.3 : (1 - acc) * 0.8);
    };
    const usage = {}, usedPairs = new Set(), questions = [];
    let bag = [], last = null, lastItem = null;
    const refill = () => {
      bag = shuf(acts, rng);
      if (last && bag.length > 1 && bag[0] === last) bag.push(bag.shift());
    };
    let guard = total * 40;
    while (questions.length < total && guard-- > 0 && acts.length) {
      if (!bag.length) refill();
      const act = bag.shift();
      if (!acts.includes(act)) continue;
      const def_ = ACTS[act];
      let cands = pools[def_.needs].filter((it) => !usedPairs.has(act + '|' + it.key));
      if (!cands.length) cands = pools[def_.needs];   // everything used once: allow repeats
      const ordered = cands.map((it) => ({ it, s: (usage[it.key] || 0) * 10 + rng() * 3 - prio(it) * 2 + (lastItem === it.key ? 15 : 0) })).sort((a, b) => a.s - b.s);
      let built = null, chosen = null;
      for (let n = 0; n < Math.min(ordered.length, 30) && !built; n++) {
        const b = def_.build(ordered[n].it, cx);
        if (b) { built = b; chosen = ordered[n].it; }
      }
      if (!built) { acts = acts.filter((a) => a !== act); bag = bag.filter((a) => a !== act); warnings.push('skipped:' + act); continue; }
      usage[chosen.key] = (usage[chosen.key] || 0) + 1;
      usedPairs.add(act + '|' + chosen.key);
      last = act; lastItem = chosen.key;
      questions.push(Object.assign({ id: questions.length, act, item: chosen, title: { en: def_.en, es: def_.es } }, built));
    }
    return { questions, warnings };
  }

  /* ---------- gather data from the store ---------- */
  function wordsInSet(sid, D) {
    const words = D.words;
    if (sid === 'all') return words;
    if (sid === 'hard') return words.filter((w) => w.hard);
    if (sid === 'mistakes') return words.filter((w) => D.mistakes['w:' + w.id]);
    if (sid === 'due') return words.filter((w) => { const st = D.srs['w:' + w.id]; return !st || MS.srs.isDue(st); });
    if (sid.startsWith('lesson:')) { const n = sid.slice(7); return words.filter((w) => (w.lesson || '') === n); }
    return [];
  }
  function gather(cfg) {
    const D = MS.store.data;
    const sel = new Map();
    (cfg.sets || []).forEach((sid) => wordsInSet(sid, D).forEach((w) => sel.set(w.id, w)));
    (cfg.wordIds || []).forEach((id) => { const w = D.words.find((x) => x.id === id); if (w) sel.set(id, w); });
    let kanaItems;
    if (cfg.kanaKeys) kanaItems = cfg.kanaKeys.map((k) => { const ch = k.slice(2), e = K().entryOf(ch); return e ? kanaItem(e, K().isKata(ch[0]) ? 'kata' : 'hira') : null; }).filter(Boolean);
    else kanaItems = kanaItemsFor(cfg.kana, D.srs, D.known, D.mistakes);
    const kanaAll = kanaItemsFor({ scripts: ['hira', 'kata'], groups: ['basic', 'dakuten', 'handakuten', 'yoon'] }, D.srs, D.known, D.mistakes);
    return { allWords: D.words, selWords: [...sel.values()], kanaItems, kanaAll, srs: D.srs, lang: D.settings.lang };
  }

  /* The daily 10 minutes: due items first, a few new kana, then top up from weak spots */
  function dailyPlan() {
    const D = MS.store.data;
    const keys = [];
    const dueK = MS.srs.dueKeys('k:').slice(0, 12);
    const dueW = MS.srs.dueKeys('w:').filter((k) => D.words.some((w) => 'w:' + w.id === k)).slice(0, 12);
    keys.push(...dueK);
    // new hiragana (basic order) not yet seen, then katakana
    const fresh = [];
    ['hira', 'kata'].forEach((s) => K().KANA.filter((e) => e.g === 'basic').forEach((e) => {
      const ch = s === 'kata' ? e.k : e.h;
      if (!D.srs['k:' + ch] && !D.known[ch] && fresh.length < 5 && (s === 'hira' || !fresh.length)) fresh.push('k:' + ch);
    }));
    if (dueK.length < 8) keys.push(...fresh);
    if (!keys.length && !dueW.length) {
      K().KANA.filter((e) => e.g === 'basic').slice(0, 10).forEach((e) => keys.push('k:' + e.h));
    }
    const cfgWordIds = dueW.map((k) => k.slice(2));
    const count = keys.length + cfgWordIds.length;
    return { cfg: { kanaKeys: uniq(keys), wordIds: cfgWordIds, acts: PRESETS.daily, length: Math.max(8, Math.min(20, Math.round(count * 1.3))), mode: 'practice', prioritize: true, daily: true }, dueKana: dueK.length, dueWords: dueW.length, fresh: fresh.length };
  }

  MS.practice = { makeRng, ACTS, ACT_ORDER, PRESETS, generate, gather, dailyPlan, kanaOnlyWord, kanaItemsFor, wordsInSet, allowedInMode, wordItem, kanaItem, soundOk };
})();
