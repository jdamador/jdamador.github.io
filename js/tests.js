/* tests.js — unit-style checks (kana conversion, romaji, answer checker, SRS, generator)
   and integration checks that drive the real app in an iframe, typing with the on-screen keyboard. */
(function () {
  const K = MS.kana, P = MS.practice;
  const results = [];
  const list = document.getElementById('results');
  const jobs = [];
  function test(name, fn) { jobs.push({ name, fn }); }
  const eq = (a, b, msg) => { if (a !== b) throw new Error((msg ? msg + ': ' : '') + 'expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); };
  const ok = (v, msg) => { if (!v) throw new Error(msg || 'expected truthy'); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function waitFor(fn, ms, label) {
    const t0 = Date.now();
    while (Date.now() - t0 < (ms || 3000)) { const v = fn(); if (v) return v; await sleep(40); }
    throw new Error('timeout waiting for ' + (label || fn.toString().slice(0, 70)));
  }

  /* ================= Kana conversion ================= */
  test('hiragana ↔ katakana uses the 0x60 offset', () => {
    eq(K.toKata('ひらがな'), 'ヒラガナ'); eq(K.toHira('ヒラガナ'), 'ひらがな');
    K.KANA.filter((e) => e.g === 'basic').forEach((e) => eq(e.k.codePointAt(0) - e.h.codePointAt(0), e.h.length === 1 ? 0x60 : 0x60, e.h));
  });
  test('round trip for every kana in the tables', () => { K.KANA.forEach((e) => eq(K.toHira(K.toKata(e.h)), e.h, e.h)); });
  test('exceptions: ゔ/ヴ, ゝ/ヽ, ゞ/ヾ', () => {
    eq(K.toKata('ゔ'), 'ヴ'); eq(K.toHira('ヴ'), 'ゔ');
    eq(K.toKata('ゝゞ'), 'ヽヾ'); eq(K.toHira('ヽヾ'), 'ゝゞ');
  });
  test('ー and ・ never change; ヷ-ヺ have no hiragana', () => {
    eq(K.toKata('こーひー'), 'コーヒー'); eq(K.toHira('コーヒー'), 'こーひー'); eq(K.toKata('・'), '・'); eq(K.toHira('ヷヺ'), 'ヷヺ');
  });
  test('toHira with expandLong turns ー into the vowel kana', () => {
    eq(K.toHira('コーヒー', { expandLong: true }), 'こうひい'); eq(K.toHira('ラーメン', { expandLong: true }), 'らあめん');
    eq(K.toHira('ケーキ', { expandLong: true }), 'けえき'); eq(K.toHira('ノート', { expandLong: true }), 'のうと');
  });
  test('script check', () => {
    eq(K.scriptCheck('ねこ').script, 'hira'); eq(K.scriptCheck('コーヒー').script, 'kata'); eq(K.scriptCheck('ラーメンです').script, 'mixed');
    const k = K.scriptCheck('猫'); ok(k.kanji && k.other[0] === '猫'); eq(K.scriptCheck('').script, 'empty'); eq(K.scriptCheck('ー').script, 'none');
  });
  test('tables: 46 basic, 4+1 voiced series, small kana, yoon', () => {
    eq(K.KANA.filter((e) => e.g === 'basic').length, 46); eq(K.KANA.filter((e) => e.g === 'handakuten').length, 5);
    eq(K.KANA.filter((e) => e.g === 'dakuten' && !e.rare).length, 20); eq(K.KANA.filter((e) => e.g === 'small').length, 10);
    eq(K.KANA.filter((e) => e.g === 'yoon').length, 36);
    ['きゃ', 'しゅ', 'ちょ', 'じゃ', 'ぴょ'].forEach((c) => ok(K.BY_H[c], c));
  });

  /* ================= Romaji ================= */
  const r2k = (s, sc) => K.romajiToKana(s, sc || 'hira', true).kana;
  test('romaji → kana (Hepburn)', () => {
    eq(r2k('neko'), 'ねこ'); eq(r2k('kitte'), 'きって'); eq(r2k('kite'), 'きて'); eq(r2k('kyou'), 'きょう'); eq(r2k('shashin'), 'しゃしん');
    eq(r2k('chotto'), 'ちょっと'); eq(r2k('matchi'), 'まっち'); eq(r2k('arigatou'), 'ありがとう'); eq(r2k('sensei'), 'せんせい');
    eq(r2k('tsukue'), 'つくえ'); eq(r2k('fuji'), 'ふじ'); eq(r2k('ji'), 'じ'); eq(r2k('wo'), 'を'); eq(r2k('nya'), 'にゃ'); eq(r2k('xtu'), 'っ');
    eq(r2k('byouin'), 'びょういん'); eq(r2k('ryokou'), 'りょこう'); eq(r2k('gakkou'), 'がっこう'); eq(r2k('zasshi'), 'ざっし');
  });
  test('romaji: ん rules', () => {
    eq(r2k('kan'), 'かん'); eq(r2k('konnichiwa'), 'こんにちわ'); eq(r2k("kon'ya"), 'こんや'); eq(r2k('hon'), 'ほん'); eq(r2k('nn'), 'ん'); eq(r2k('kanji'), 'かんじ'); eq(r2k('ramen'), 'らめん');
  });
  test('romaji → katakana, with ー from "-"', () => { eq(r2k('ra-men', 'kata'), 'ラーメン'); eq(r2k('ko-hi-', 'kata'), 'コーヒー'); eq(r2k('kapuchi-no', 'kata'), 'カプチーノ'); });
  test('romaji partial input keeps an incomplete tail', () => {
    const a = K.romajiToKana('sh', 'hira', false); eq(a.kana, ''); eq(a.rest, 'sh');
    const b = K.romajiToKana('kan', 'hira', false); eq(b.kana, 'か'); eq(b.rest, 'n');
    const c = K.romajiToKana('ky', 'hira', false); eq(c.rest, 'ky');
    const d = K.romajiToKana('ka', 'hira', false); eq(d.kana, 'か'); eq(d.rest, '');
  });
  test('kana → romaji', () => {
    const f = K.kanaToRomaji;
    eq(f('ねこ'), 'neko'); eq(f('きって'), 'kitte'); eq(f('ちょっと'), 'chotto'); eq(f('しゃしん'), 'shashin'); eq(f('まっちゃ'), 'matcha');
    eq(f('コーヒー'), 'kōhī'); eq(f('ラーメン'), 'rāmen'); eq(f('ありがとう'), 'arigatou'); eq(f('ほんや'), "hon'ya"); eq(f('ほん'), 'hon'); eq(f('を'), 'o');
  });

  /* ================= Keyboard marks ================= */
  test('dakuten / handakuten / small toggles', () => {
    const m = K.applyMark;
    eq(m('は', 'daku'), 'ば'); eq(m('ば', 'daku'), 'は'); eq(m('は', 'handaku'), 'ぱ'); eq(m('ぱ', 'daku'), 'ば'); eq(m('ぱ', 'handaku'), 'は'); eq(m('ば', 'handaku'), 'ぱ');
    eq(m('か', 'daku'), 'が'); eq(m('し', 'daku'), 'じ'); eq(m('う', 'daku'), 'ゔ'); eq(m('ゔ', 'daku'), 'う'); eq(m('あ', 'handaku'), null); eq(m('か', 'handaku'), null);
    eq(m('つ', 'small'), 'っ'); eq(m('っ', 'small'), 'つ'); eq(m('や', 'small'), 'ゃ'); eq(m('か', 'small'), null);
    eq(m('ハ', 'handaku'), 'パ'); eq(m('ツ', 'small'), 'ッ'); eq(m('ウ', 'daku'), 'ヴ'); eq(m('ねこ', 'daku'), 'ねご'); eq(m('', 'daku'), null);
  });
  test('writing units (yoon stays together; っ and ー stand alone)', () => {
    eq(JSON.stringify(K.units('きゃく')), JSON.stringify(['きゃ', 'く'])); eq(JSON.stringify(K.units('がっこう')), JSON.stringify(['が', 'っ', 'こ', 'う']));
    eq(JSON.stringify(K.units('コーヒー')), JSON.stringify(['コ', 'ー', 'ヒ', 'ー']));
  });

  /* ================= Answer checker ================= */
  test('answer checker: exact, script, wrong', () => {
    const c = K.checkAnswer;
    ok(c('ねこ', 'ねこ').ok); ok(c(' ね こ ', 'ねこ').ok, 'spaces ignored');
    eq(c('ねこ', 'ネコ').kind, 'script'); ok(!c('ねこ', 'ネコ').ok);
    ok(c('が', 'が').ok, 'combining dakuten is normalised');
    ok(!c('きて', 'きって').ok); ok(!c('きって', 'きて').ok); ok(!c('おう', 'おお').ok); ok(!c('とうきょう', 'ときょう').ok);
    ok(c('ラーメン', 'ラーメン').ok); ok(!c('ラメン', 'ラーメン').ok); eq(c('らーめん', 'ラーメン').kind, 'script');
    ok(!c('はん', 'ばん').ok); ok(!c('ぱん', 'ばん').ok); ok(c('ぱん', 'ぱん').ok);
    eq(c('', 'ねこ').kind, 'empty'); ok(!c('ちゃ', 'ちや').ok, 'small ゃ matters');
  });
  test('answer checker diff marks missing and wrong characters', () => {
    const d = K.checkAnswer('ありがと', 'ありがとう').diff; ok(!d.expected[d.expected.length - 1].ok); eq(d.expected.filter((x) => !x.ok).length, 1);
    const e = K.checkAnswer('ありかとう', 'ありがとう').diff; eq(e.expected.filter((x) => !x.ok).map((x) => x.c).join(''), 'が'); eq(e.given.filter((x) => !x.ok).map((x) => x.c).join(''), 'か');
  });

  /* ================= SRS ================= */
  test('SRS: Again returns in 10 minutes and counts a lapse', () => {
    const t = 1e12; const s = MS.srs.review(undefined, 0, t); eq(s.interval, 0); eq(s.due - t, 600000); eq(s.lapses, 1);
  });
  test('SRS: Good grows 1, 3, then by ease', () => {
    let s = undefined, t = 1e12; const iv = [];
    for (let i = 0; i < 4; i++) { s = MS.srs.review(s, 2, t); iv.push(s.interval); t += s.interval * 86400000; }
    eq(iv.join(','), '1,3,8,20');
  });
  test('SRS: ease never drops below 1.3; Easy raises it; due logic', () => {
    let s; for (let i = 0; i < 12; i++) s = MS.srs.review(s, 0, 1e12); ok(s.ease >= 1.3 && s.ease < 1.31);
    ok(MS.srs.review(undefined, 3, 1e12).ease > 2.5); const g = MS.srs.review(undefined, 2, 1e12);
    ok(!MS.srs.isDue(g, 1e12)); ok(MS.srs.isDue(g, 1e12 + 2 * 86400000)); eq(MS.srs.recentAccuracy(MS.srs.review(MS.srs.review(undefined, 2, 1), 0, 2)), 0.5);
  });

  /* ================= Generator ================= */
  const SAMPLE = [['ねこ', 'cat'], ['いぬ', 'dog'], ['さかな', 'fish'], ['ありがとう', 'thank you'], ['コーヒー', 'coffee'], ['ラーメン', 'ramen']].map((x, i) => ({ id: 'w' + i, w: x[0], m: x[1], lesson: 'Sample', ex: '', note: '', hard: false, img: 'pic' + i + '.png' }));
  const KA = P.kanaItemsFor({ scripts: ['hira', 'kata'], groups: ['basic', 'dakuten', 'handakuten', 'yoon'] }, {}, {}, {});
  const DATA = { allWords: SAMPLE, selWords: SAMPLE, kanaItems: KA, kanaAll: KA, srs: {}, lang: 'en' };
  test('chosen kana: unticked kana never appear in kana questions or their options', () => {
    const off = [...'さしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'];
    eq(P.kanaItemsFor({ scripts: ['hira', 'kata'], groups: ['basic'], off: ['か'] }, {}, {}, {}).length, 90, 'か off in both scripts');
    const pool = P.kanaItemsFor({ scripts: ['hira'], groups: ['basic'], off }, {}, {}, {});
    const allowed = P.kanaItemsFor({ scripts: ['hira', 'kata'], groups: ['basic'], off }, {}, {}, {});
    const okH = new Set(allowed.map((i) => i.e.h));
    const acts = P.PRESETS.kana;
    for (let seed = 1; seed <= 10; seed++) {
      const { questions } = P.generate({ acts, length: 30, mode: 'practice' }, { allWords: [], selWords: [], kanaItems: pool, kanaAll: allowed, kanaFull: KA, srs: {}, lang: 'en' }, P.makeRng(seed));
      ok(questions.length > 0, 'no questions');
      questions.forEach((q) => (JSON.stringify(q.options || []) + q.expected).replace(/[^ぁ-ゖ]/g, '').split('').forEach((c) => ok(okH.has(c), q.act + ' used ' + c)));
    }
  });
  const NON_SPECIAL = P.ACT_ORDER;
  NON_SPECIAL.forEach((act) => {
    test('generator: ' + act + ' builds valid questions from the sample words', () => {
      const { questions } = P.generate({ acts: [act], length: 10, mode: 'practice' }, DATA, P.makeRng(7));
      ok(questions.length > 0, 'no questions'); questions.forEach((q) => {
        eq(q.act, act);
        if (q.kind === 'typed') { ok(q.answer, 'answer'); ok(K.checkAnswer(q.answer, q.answer).ok); ok(!K.checkAnswer(q.answer.slice(0, -1), q.answer).ok || q.answer.length === 1);
          if (act === 'w_blank') { ok(q.prompt.pattern.includes('＿')); let rebuilt = q.prompt.pattern; K.units(q.answer).forEach((u) => (rebuilt = rebuilt.replace('＿', u))); eq(rebuilt, q.full, 'blank rebuild'); }
          if (act === 'k_convert') ok(K.scriptCheck(q.prompt.big).script !== K.scriptCheck(q.answer).script, 'convert must change script'); }
        if (q.kind === 'choice') { ok(q.options.length >= 2); ok(q.answerIndex >= 0 && q.answerIndex < q.options.length); eq(new Set(q.options.map((o) => o.text)).size, q.options.length, 'unique options');
          if (act === 'k_sound2kana') eq(q.options[q.answerIndex].text, q.expected); if (act === 'k_kana2sound') eq(q.options[q.answerIndex].text, q.expected);
          if (act === 'r_word2meaning') eq(q.options[q.answerIndex].text, SAMPLE.find((w) => w.w === q.prompt.word).m); }
        if (q.kind === 'scramble') { eq([...q.tiles].sort().join(''), K.units(q.answer).sort().join('')); ok(q.tiles.join('') !== q.answer, 'tiles are shuffled'); }
        if (q.kind === 'match') { ok(q.pairs.length >= 3); eq(new Set(q.pairs.map((p) => p.m)).size, q.pairs.length); }
        if (q.kind === 'speed') ok(q.pool.length >= 4 && q.seconds === 60);
      });
    });
  });
  test('generator: mixes activities, honours length, no immediate or pair repeats', () => {
    [5, 10, 20].forEach((n) => {
      const { questions } = P.generate({ acts: P.PRESETS.all, length: n, mode: 'practice', prioritize: false }, DATA, P.makeRng(n));
      eq(questions.length, n);
      for (let i = 1; i < questions.length; i++) ok(questions[i].act !== questions[i - 1].act, 'same activity twice in a row at ' + i);
      const pairs = questions.map((q) => q.act + '|' + q.item.key); eq(new Set(pairs).size, pairs.length, 'repeated activity+item pair');
      ok(new Set(questions.map((q) => q.act)).size >= Math.min(n, 4), 'not enough variety');
    });
  });
  test('generator: "all" covers every selected word at least once', () => {
    const { questions } = P.generate({ acts: P.PRESETS.recog.filter((a) => a !== 'r_match'), length: 'all', mode: 'practice' }, DATA, P.makeRng(3));
    const seen = new Set(questions.map((q) => q.item.key)); SAMPLE.forEach((w) => ok(seen.has('w:' + w.id), w.w));
  });
  test('generator: quiz drops flashcards; exam drops self-graded and speed', () => {
    const quiz = P.generate({ acts: P.PRESETS.all, length: 20, mode: 'quiz' }, DATA, P.makeRng(1)).questions; ok(!quiz.some((q) => q.act === 'r_flash'));
    const exam = P.generate({ acts: P.ACT_ORDER, length: 20, mode: 'exam' }, DATA, P.makeRng(2)).questions;
    ok(exam.length === 20); ok(!exam.some((q) => ['r_flash', 'w_hand', 'k_stroke', 'k_speed'].includes(q.act)));
  });
  test('generator: reports problems instead of crashing', () => {
    eq(P.generate({ acts: [], length: 5 }, DATA).warnings[0], 'no-activities');
    const none = P.generate({ acts: ['w_meaning'], length: 5 }, { allWords: [], selWords: [], kanaItems: KA, kanaAll: KA, srs: {} });
    eq(none.questions.length, 0);
    const kanjiOnly = P.generate({ acts: ['w_meaning'], length: 5 }, { allWords: [{ id: 'k', w: '猫', m: 'cat' }], selWords: [{ id: 'k', w: '猫', m: 'cat' }], kanaItems: KA, kanaAll: KA, srs: {} });
    eq(kanjiOnly.questions.length, 0, 'kanji words are not typeable');
  });
  test('generator: duplicate meanings accept either word', () => {
    const words = [{ id: 'a', w: 'ありがとう', m: 'thanks' }, { id: 'b', w: 'どうも', m: 'thanks' }, { id: 'c', w: 'ねこ', m: 'cat' }];
    const q = P.generate({ acts: ['w_meaning'], length: 6 }, { allWords: words, selWords: words, kanaItems: KA, kanaAll: KA, srs: {} }, P.makeRng(5)).questions.find((x) => x.prompt.meaning === 'thanks');
    ok(q && q.alts.length >= 1, 'alts');
  });

  /* ================= Integration: drive the real app ================= */
  let frame, fw, fd;
  const $q = (s) => fd.querySelector(s);
  const $$q = (s) => Array.from(fd.querySelectorAll(s));
  const btn = (re) => $$q('button, a.btn').find((b) => re.test(b.textContent.trim()) && !b.disabled);
  const click = (el) => { if (!el) throw new Error('missing element to click'); el.click(); };
  async function go(hash) { fw.location.hash = hash; await sleep(180); }
  const fbText = () => ($q('.fb') || {}).className || '';

  /* Press on-screen keys to type a kana string (uses ゛ ゜ for voiced kana). */
  function typeKana(str) {
    const setScript = (s) => { const b = $$q('.kbd .seg-btn')[s === 'kata' ? 1 : 0]; if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); };
    const press = (ch) => { const k = $$q('.kbd .key').find((x) => x.textContent === ch); if (!k) throw new Error('no key ' + ch); k.click(); };
    for (const ch of str) {
      setScript(K.isKata(ch) ? 'kata' : 'hira');
      if ($$q('.kbd .key').some((x) => x.textContent === ch)) { press(ch); continue; }
      const h = K.toHira(ch);
      const dk = Object.keys(K.BY_H).find(() => false);
      let base = null, mark = null;
      for (const b of 'かきくけこさしすせそたちつてとはひふへほう') { const v = K.applyMark(b, 'daku'); if (v === h) { base = b; mark = '゛'; } const p = K.applyMark(b, 'handaku'); if (p === h) { base = b; mark = '゜'; } }
      if (!base) throw new Error('cannot type ' + ch);
      press(K.isKata(ch) ? K.toKata(base) : base); press(mark);
    }
  }
  async function nextQ() { const n = btn(/^(Next|See results)$/); if (n) n.click(); await sleep(120); }

  async function runSession(cfg, mode, driver) {
    const n = cfg.length;
    fw.MS.session.reset();
    const okLaunch = fw.MS.session.launch(Object.assign({ prioritize: false, mode: mode || 'practice' }, cfg));
    ok(okLaunch, 'launch failed');
    return fw.MS.session.current;
  }

  function integration() {
    test('integration: app loads with no errors and every page renders', async () => {
      frame = document.createElement('iframe'); frame.src = 'index.html?seed=demo#/home'; document.getElementById('frame-host').appendChild(frame);
      await new Promise((r) => (frame.onload = r)); fw = frame.contentWindow; fd = frame.contentDocument; await sleep(400);
      fw.MS.config.english = true;   // English pages are hidden by default; the tests still cover them
      ok(fw.MS && fw.MS.app, 'app global');
      const routes = ['/home', '/charts', '/charts?k=%E3%81%97', '/rules', '/keyboard', '/vocab', '/practice', '/progress', '/plan', '/resources', '/worksheet', '/sets', '/numbers', '/room', '/en', '/en/plan', '/en/tools?tab=journal', '/en/tools?tab=review', '/en/tools?tab=cloze', '/en/tools?tab=writing', '/en/tools?tab=shadow', '/en/tools?tab=speak', '/en/tools?tab=listen', '/en/tools?tab=weekly', '/en/resources', '/data'];
      for (const r of routes) { await go('#' + r); ok($q('#view').children.length > 0, r + ' is empty'); ok(!$q('#view h1') || $q('#view h1').textContent !== 'Something went wrong', r + ' threw: ' + ($q('#view p') || {}).textContent); }
      eq(fw.__errs.join(' | '), '', 'console/page errors');
    });
    test('integration: language toggle switches the interface to Spanish and back', async () => {
      await go('#/home'); click($$q('#controls .seg-btn')[1]); await sleep(100); ok(/Estudiar hoy/.test($q('#view h1').textContent)); ok(/Hoy/.test($q('#nav').textContent));
      click($$q('#controls .seg-btn')[0]); await sleep(100); ok(/Study today/.test($q('#view h1').textContent));
    });
    test('integration: theme toggle changes the theme attribute', async () => {
      const before = fd.documentElement.getAttribute('data-theme'); click($q('#controls .btn.round')); await sleep(50); ok(fd.documentElement.getAttribute('data-theme') !== before);
      click($q('#controls .btn.round')); await sleep(50);
    });
    test('integration: physical-keyboard romaji becomes kana in the keyboard', async () => {
      await go('#/keyboard'); const kb = $q('.kbd'); const screen = $q('.kbd-screen'); screen.focus();
      const press = (key) => kb.dispatchEvent(new fw.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      'kitte'.split('').forEach(press); eq($q('.kbd-text').textContent, 'きって');
      press('Backspace'); eq($q('.kbd-text').textContent, 'きっ');
      'kyou'.split('').forEach(press); eq($q('.kbd-text').textContent, 'きっきょう');
      click(btn(/^Clear$/)); eq($q('.kbd-text').textContent, '');
      'nn'.split('').forEach(press); eq($q('.kbd-pend').textContent, 'nn', 'nn waits so that konnichiwa still works'); press('Enter'); eq($q('.kbd-text').textContent, 'ん');
    });
    test('integration: tapping kana, dakuten, small and long-vowel keys builds words; romaji toggle works', async () => {
      await go('#/keyboard'); click(btn(/^Clear$/)); typeKana('ばんぱ'); eq($q('.kbd-text').textContent, 'ばんぱ');
      click(btn(/^Clear$/)); typeKana('がっこう'); eq($q('.kbd-text').textContent, 'がっこう');
      click(btn(/^Clear$/)); typeKana('コーヒー'); eq($q('.kbd-text').textContent, 'コーヒー');
      click(btn(/^Clear$/)); typeKana('ちょっと'); eq($q('.kbd-text').textContent, 'ちょっと');
      ok($q('.kbd-romaji').hidden, 'romaji hidden by default'); const cb = $q('.kbd .check input'); cb.click(); await sleep(30); ok(!$q('.kbd-romaji').hidden); eq($q('.kbd-romaji').textContent, 'chotto'); cb.click();
      click(btn(/^Clear$/)); typeKana('つ'); click($$q('.kbd .key').find((k) => k.textContent === '小')); eq($q('.kbd-text').textContent, 'っ');
    });

    /* every practice type, answered correctly through the real UI */
    const WORDS_CFG = { sets: ['all'], kana: { scripts: ['hira', 'kata'], groups: ['basic', 'dakuten', 'handakuten', 'yoon'] }, length: 4 };
    test('integration: sample words are present (seed)', async () => { await go('#/vocab'); ok(fw.MS.store.data.words.length >= 6); });
    ['w_meaning', 'w_audio', 'w_blank', 'k_convert'].forEach((act) => {
      test('integration: ' + act + ' accepts the right answer typed on the on-screen keyboard (and rejects a wrong one)', async () => {
        const S = await runSession(Object.assign({}, WORDS_CFG, { acts: [act], length: 4, sets: ['all'], kanaKeys: act === 'k_convert' ? [] : undefined }));
        await sleep(300); let rightCount = 0;
        for (let i = 0; i < S.questions.length; i++) {
          const q = S.questions[i]; await waitFor(() => $q('.kbd'), 2000, 'keyboard for ' + act + ' #' + i);
          if (i === 1) { typeKana('ん'); click(btn(/^Check$/)); await waitFor(() => /bad/.test(fbText()), 1500, 'wrong answer feedback'); await nextQ(); continue; }
          typeKana(q.answer); click(btn(/^Check$/)); await waitFor(() => $q('.fb'), 1500, 'feedback');
          ok(/ok/.test(fbText()), act + ' rejected the correct answer "' + q.answer + '" (' + fbText() + ')'); rightCount++; await nextQ();
        }
        await waitFor(() => $q('.summary'), 2000, 'summary'); eq(rightCount, 3);
      });
    });
    ['k_sound2kana', 'k_kana2sound', 'k_lookalike', 'k_voicing', 'r_word2meaning', 'r_meaning2word', 'r_audio2meaning'].forEach((act) => {
      test('integration: ' + act + ' marks the correct option right and a wrong one wrong', async () => {
        const S = await runSession(Object.assign({}, WORDS_CFG, { acts: [act], length: 3 })); await sleep(300);
        for (let i = 0; i < S.questions.length; i++) {
          const q = S.questions[i]; await waitFor(() => $q('.opts .opt'), 2000, 'options');
          const opts = $$q('.opts .opt'); const idx = i === 1 ? (q.answerIndex + 1) % opts.length : q.answerIndex; opts[idx].click(); await waitFor(() => $q('.fb'), 1500, 'feedback');
          ok(i === 1 ? /bad/.test(fbText()) : /ok/.test(fbText()), act + ' q' + i + ' feedback was ' + fbText()); await nextQ();
        }
        await waitFor(() => $q('.summary'), 2000); ok(/67%/.test($q('.score-num').textContent), 'score ' + $q('.score-num').textContent);
      });
    });
    test('integration: scramble accepts the correct order and rejects a wrong one', async () => {
      const S = await runSession(Object.assign({}, WORDS_CFG, { acts: ['w_scramble'], length: 2 })); await sleep(300);
      for (let i = 0; i < 2; i++) {
        const q = S.questions[i]; await waitFor(() => $q('.bank .tile'), 2000);
        const order = i === 0 ? K.units(q.answer) : K.units(q.answer).reverse();
        for (const u of order) { const t = $$q('.bank .tile').find((x) => x.textContent === u && !x.disabled); ok(t, 'tile ' + u); t.click(); }
        click(btn(/^Check$/)); await waitFor(() => $q('.fb'), 1500); const sameOrder = order.join('') === q.answer; ok(sameOrder ? /ok/.test(fbText()) : /bad/.test(fbText()), 'scramble result ' + fbText()); await nextQ();
      }
      await waitFor(() => $q('.summary'), 2000);
    });
    test('integration: handwriting canvas accepts strokes, reveals the answer and self-marking works', async () => {
      const S = await runSession(Object.assign({}, WORDS_CFG, { acts: ['w_hand'], length: 2 })); await sleep(300);
      await waitFor(() => $q('.pad-canvas'), 2000); const cv = $q('.pad-canvas'); const r = cv.getBoundingClientRect();
      const ev = (t, x, y) => cv.dispatchEvent(new fw.PointerEvent(t, { clientX: r.left + x, clientY: r.top + y, pointerId: 1, pointerType: 'pen', pressure: .5, bubbles: true, cancelable: true, button: 0 }));
      ev('pointerdown', 20, 20); ev('pointermove', 60, 60); ev('pointermove', 80, 40); ev('pointerup', 80, 40);
      const data = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let ink = 0; for (let i = 3; i < data.length; i += 4) if (data[i]) ink++; ok(ink > 50, 'canvas has ink');
      click(btn(/^Undo$/)); const d2 = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let ink2 = 0; for (let i = 3; i < d2.length; i += 4) if (d2[i]) ink2++; eq(ink2, 0, 'undo clears the stroke');
      click(btn(/^Reveal answer$/)); ok($q('.masu-row') && !$q('.masu-row').hidden, 'model shown'); click(btn(/^I wrote it correctly$/)); await sleep(250);
      await waitFor(() => $q('.pad-canvas'), 2000); click(btn(/^Reveal answer$/)); click(btn(/^Needs more practice$/)); await waitFor(() => $q('.summary'), 2000); ok(/50%/.test($q('.score-num').textContent));
    });
    test('integration: stroke order trainer plays, traces and finishes (KanjiVG data)', async () => {
      const S = await runSession({ kana: { scripts: ['hira'], groups: ['basic'] }, acts: ['k_stroke'], length: 2 }); await sleep(300);
      for (let i = 0; i < 2; i++) {
        await waitFor(() => $q('.sv'), 2000, 'stroke svg'); ok($$q('.sv .sv-p').length >= 1, 'stroke paths'); click(btn(/^Play$/)); click(btn(/^Next stroke$/));
        click(btn(/^Now trace it$/)); await waitFor(() => $q('.pad-canvas')); ok($q('.pad-guide span'), 'faint guide'); click(btn(/^Write from memory$/)); await sleep(50);
        click(btn(/^Show model$/)); click(btn(/^Looked right$/)); await sleep(250);
      }
      await waitFor(() => $q('.summary'), 2000); ok(/100%/.test($q('.score-num').textContent));
    });
    test('integration: flashcards flip and grade; the SRS schedule changes', async () => {
      const S = await runSession({ sets: ['all'], acts: ['r_flash'], length: 3 }); await sleep(300);
      const key = S.questions[0].itemKeys[0]; for (let i = 0; i < 3; i++) { await waitFor(() => btn(/^Show answer$/), 2000); click(btn(/^Show answer$/)); ok(!$q('.fc-back').hidden); click($q('.grade.g2')); await sleep(200); }
      await waitFor(() => $q('.summary'), 2000); ok(fw.MS.srs.get(key) && fw.MS.srs.get(key).interval >= 1, 'word got scheduled');
    });
    test('integration: matching game pairs words with meanings', async () => {
      await runSession({ sets: ['all'], acts: ['r_match'], length: 1 }); await sleep(300); await waitFor(() => $q('.match'), 2000);
      const left = $$q('.mt.l'); for (const l of left) { const key = l.dataset.key; const r = $$q('.mt.r').find((x) => x.dataset.key === key); l.click(); r.click(); }
      await waitFor(() => $q('.fb.ok'), 1500, 'all matched feedback');
    });
    test('integration: speed round runs and scores', async () => {
      const S = await runSession({ kana: { scripts: ['hira'], groups: ['basic'] }, acts: ['k_speed'], length: 1 }); S.questions[0].seconds = 2; fw.MS.session.renderRun(fd.querySelector('#view')); await sleep(300);
      await waitFor(() => btn(/^Start/), 2000); click(btn(/^Start/)); await waitFor(() => $q('.speed-area .opt'), 1000);
      for (let i = 0; i < 3; i++) { const o = $$q('.speed-area .opt'); if (o.length) o[0].click(); await sleep(60); }
      await waitFor(() => $q('.fb') || $q('.summary'), 4000, 'speed finish');
    });
    test('integration: quiz mode gives no feedback until the end, then a review of mistakes', async () => {
      const S = await runSession({ sets: ['all'], kana: { scripts: ['hira'], groups: ['basic'] }, acts: ['r_word2meaning', 'k_sound2kana'], length: 4 }, 'quiz'); await sleep(300);
      for (let i = 0; i < 4; i++) { await waitFor(() => $q('.opts .opt'), 2000); ok(!$q('.fb'), 'no feedback in quiz'); ok(!btn(/^Hint$/), 'no hints'); const q = S.questions[i]; $$q('.opts .opt')[i === 0 ? (q.answerIndex + 1) % $$q('.opts .opt').length : q.answerIndex].click(); await sleep(420); }
      await waitFor(() => $q('.summary'), 2000); ok(/75%/.test($q('.score-num').textContent), 'quiz score ' + $q('.score-num').textContent); ok($q('.review li'), 'mistakes are listed');
    });
    test('integration: exam simulator is timed, mixes activities and reports accuracy per kana', async () => {
      const S = await runSession(Object.assign({}, WORDS_CFG, { acts: P.PRESETS.all, length: 6, minutes: 5 }), 'exam'); await sleep(300);
      await waitFor(() => $q('.run-clock') && !$q('.run-clock').hidden && /⏱/.test($q('.run-clock').textContent), 2000, 'exam clock');
      for (let i = 0; i < S.questions.length; i++) {
        await waitFor(() => $q('.opts .opt') || $q('.kbd') || $q('.bank .tile') || $q('.match'), 2000, 'exam question ' + i); const q = S.questions[i];
        if (q.kind === 'choice') $$q('.opts .opt')[q.answerIndex].click();
        else if (q.kind === 'typed') { typeKana(q.answer); click(btn(/^Check$/)); }
        else if (q.kind === 'scramble') { for (const u of K.units(q.answer)) $$q('.bank .tile').find((x) => x.textContent === u && !x.disabled).click(); click(btn(/^Check$/)); }
        else if (q.kind === 'match') { $$q('.mt.l').forEach((l) => { l.click(); $$q('.mt.r').find((x) => x.dataset.key === l.dataset.key).click(); }); }
        await sleep(420);
      }
      await waitFor(() => $q('.summary'), 2500, 'exam summary'); ok(/100%/.test($q('.score-num').textContent), 'exam score ' + $q('.score-num').textContent); ok($q('.acc-chip'), 'per-kana accuracy report');
    });
    test('integration: practising updates kana SRS, the mistake bank and activity log', async () => {
      fw.MS.store.data.mistakes = {}; const before = (fw.MS.store.data.activity[fw.MS.store.dayKey()] || { q: 0 }).q;
      await runSession({ kana: { scripts: ['hira'], groups: ['basic'] }, acts: ['k_kana2sound'], length: 2 }); await sleep(300);
      const S = fw.MS.session.current; await waitFor(() => $q('.opts .opt'));
      const q = S.questions[0]; $$q('.opts .opt')[(q.answerIndex + 1) % 4].click(); await waitFor(() => $q('.fb.bad'));
      ok(fw.MS.store.data.mistakes['k:' + q.kanaChars[0]], 'wrong answer entered the mistake bank'); ok(fw.MS.srs.get('k:' + q.kanaChars[0]).lapses >= 1);
      ok((fw.MS.store.data.activity[fw.MS.store.dayKey()] || { q: 0 }).q > before, 'activity logged'); fw.MS.session.reset();
    });
    test('integration: vocabulary — add with the keyboard, duplicate warning, paste import, difficult flag, delete', async () => {
      fw.MS.store.data.words = []; await go('#/vocab'); typeKana('ねこ'); $q('.wf-inputs input').value = 'cat'; $q('.wf-inputs input').dispatchEvent(new fw.Event('input'));
      $q('.wform').dispatchEvent(new fw.Event('submit', { cancelable: true })); await sleep(100); eq(fw.MS.store.data.words.length, 1); eq(fw.MS.store.data.words[0].w, 'ねこ');
      typeKana('ねこ'); ok(!$q('.wform .note').hidden, 'duplicate warning shown');
      click(btn(/^Cancel edit$/) || btn(/^Clear$/)); $q('details.paste').open = true;
      $q('details.paste textarea').value = 'いぬ, dog\nねこ, cat\n猫, cat kanji\nbad line\nkoohii, coffee'; click(btn(/^Preview$/)); await sleep(50);
      const rows = $$q('.paste .tbl tbody tr'); eq(rows.length, 5); ok(/Duplicate/.test(rows[1].textContent), 'duplicate flagged'); ok(/Not kana/.test(rows[2].textContent), 'kanji flagged'); ok(/word, meaning/.test(rows[3].textContent), 'bad line flagged');
      click(btn(/^Import \d+ words$/)); await sleep(100); eq(fw.MS.store.data.words.length, 4); ok(fw.MS.store.data.words.some((w) => w.w === 'こおひい'), 'romaji converted');
      click($q('.wlist .btn[aria-label="Difficult"]')); ok(fw.MS.store.data.words.some((w) => w.hard)); fw.MS.session.addSampleWords(); fw.MS.store.save();
    });
    test('integration: export contains the data and import (merge) restores it', async () => {
      const json = fw.MS.store.exportJSON(); const o = JSON.parse(json); eq(o.app, 'masume'); ok(o.words.length >= 4);
      const n = fw.MS.store.data.words.length; fw.MS.store.data.words.pop(); fw.MS.store.importJSON(json, 'merge'); eq(fw.MS.store.data.words.length, n, 'merge restored the word');
      let threw = false; try { fw.MS.store.importJSON('{"hello":1}', 'replace'); } catch (e) { threw = true; } ok(threw, 'rejects other JSON');
      threw = false; try { fw.MS.store.importJSON('not json', 'replace'); } catch (e) { threw = true; } ok(threw, 'rejects invalid JSON');
    });
    test('integration: English module — weekly plan adapts to minutes and goal, tools render', async () => {
      const E = fw.MS.english; const w15 = E.buildWeek(15, '', 0), w60 = E.buildWeek(60, 'c1adv', 0);
      eq(w15[0].items.reduce((a, b) => a + b.min, 0), 15); w15.forEach((d) => ok(d.items.length >= 1));
      w60.forEach((d) => eq(d.items.reduce((a, b) => a + b.min, 0), 60, 'day ' + d.day)); ok(w60.some((d) => d.items.some((i) => i.skill === 'exam')), 'exam goal adds exam practice');
      await go('#/en/plan'); ok($$q('.day').length === 7); $$q('.day input[type=checkbox]')[0].click(); await sleep(50); ok(/1 of/.test($q('.plan-progress').textContent));
      await go('#/en/tools?tab=writing'); const ta = $q('textarea'); ta.value = 'This is a test. This is another test, however it is short. Another test test test.'; ta.dispatchEvent(new fw.Event('input')); await sleep(50); ok(/however/.test($q('.wstats').textContent), 'connectors found'); ok(/test/.test($q('.wstats').textContent));
    });
    test('integration: no console errors after the whole run', async () => { eq(fw.__errs.join(' | '), ''); });
  }
  integration();

  /* ================= run ================= */
  (async function run() {
    let pass = 0;
    for (const j of jobs) {
      const li = document.createElement('li');
      try { await j.fn(); li.className = 'pass'; li.textContent = j.name; pass++; }
      catch (e) { li.className = 'fail'; li.textContent = j.name + ' — ' + (e && e.message); }
      list.appendChild(li);
    }
    const s = document.getElementById('summary'); s.textContent = (pass === jobs.length ? 'PASS ' : 'FAIL ') + pass + ' / ' + jobs.length; s.className = pass === jobs.length ? 'ok' : 'bad';
    document.title = s.textContent; document.body.dataset.done = '1';
  })();
})();
