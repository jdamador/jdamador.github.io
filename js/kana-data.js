/* kana-data.js — kana tables, script conversion, romaji (Hepburn), answer checker.
   Pure logic: no DOM access, so test.html can load it on its own. */
(function () {
  const MS = (window.MS = window.MS || {});

  /* ---------- Script conversion (offset 0x60) ---------- */
  const HIRA_START = 0x3041, HIRA_END = 0x3096; // ぁ … ゖ  (includes ゔ U+3094)
  const KATA_START = 0x30a1, KATA_END = 0x30f6; // ァ … ヶ  (includes ヴ U+30F4)
  const OFFSET = 0x60;

  function toKata(s) {
    let out = '';
    for (const ch of String(s)) {
      const c = ch.codePointAt(0);
      if (c >= HIRA_START && c <= HIRA_END) out += String.fromCodePoint(c + OFFSET);
      else if (c === 0x309d) out += 'ヽ'; // ゝ → ヽ  (U+309D → U+30FD, also +0x60, kept explicit)
      else if (c === 0x309e) out += 'ヾ'; // ゞ → ヾ
      else out += ch; // ー ・ and everything else unchanged
    }
    return out;
  }

  const VOWEL_KANA = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' };

  /* opts.expandLong: turn ー into the vowel kana it lengthens (コーヒー → こうひい).
     Spelling of ー after え-row varies (ええ / えい) — we use え; after お-row we use う. */
  function toHira(s, opts) {
    opts = opts || {};
    let out = '';
    for (const ch of String(s)) {
      const c = ch.codePointAt(0);
      if (c >= KATA_START && c <= KATA_END) out += String.fromCodePoint(c - OFFSET);
      else if (c === 0x30fd) out += 'ゝ';
      else if (c === 0x30fe) out += 'ゞ';
      else if (ch === 'ー' && opts.expandLong && out) {
        const last = out[out.length - 1];
        const r = MS.kana && MS.kana.vowelOf(last);
        out += r === 'o' ? 'う' : r ? VOWEL_KANA[r] : 'ー';
      } else out += ch; // ヷヸヹヺ (no hiragana), ー, ・ unchanged
    }
    return out;
  }

  const isHira = (ch) => /^[ぁ-ゖゝゞ]$/.test(ch);
  const isKata = (ch) => /^[ァ-ヺヽヾ]$/.test(ch);
  const isNeutral = (ch) => ch === 'ー' || ch === '・';
  const isKana = (ch) => isHira(ch) || isKata(ch) || isNeutral(ch);
  const SMALL_JOIN = 'ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ';

  /* 'hira' | 'kata' | 'mixed' | 'none' (only ー・) | 'empty' ; plus list of non-kana chars */
  function scriptCheck(s) {
    s = String(s || '').trim();
    if (!s) return { script: 'empty', other: [], kanji: false };
    let h = 0, k = 0;
    const other = [];
    for (const ch of s) {
      if (isHira(ch)) h++;
      else if (isKata(ch)) k++;
      else if (isNeutral(ch)) { /* neutral */ }
      else if (!/\s/.test(ch)) other.push(ch);
    }
    const kanji = other.some((c) => /[㐀-鿿]/.test(c));
    const script = h && k ? 'mixed' : h ? 'hira' : k ? 'kata' : 'none';
    return { script, other, kanji };
  }

  /* ---------- Tables ---------- */
  // Textbook gojuuon (columns = series). null = gap in the chart.
  const SERIES = [
    ['a', 'あいうえお', ['a', 'i', 'u', 'e', 'o']],
    ['ka', 'かきくけこ', ['ka', 'ki', 'ku', 'ke', 'ko']],
    ['sa', 'さしすせそ', ['sa', 'shi', 'su', 'se', 'so']],
    ['ta', 'たちつてと', ['ta', 'chi', 'tsu', 'te', 'to']],
    ['na', 'なにぬねの', ['na', 'ni', 'nu', 'ne', 'no']],
    ['ha', 'はひふへほ', ['ha', 'hi', 'fu', 'he', 'ho']],
    ['ma', 'まみむめも', ['ma', 'mi', 'mu', 'me', 'mo']],
    ['ya', 'や.ゆ.よ', ['ya', '', 'yu', '', 'yo']],
    ['ra', 'らりるれろ', ['ra', 'ri', 'ru', 're', 'ro']],
    ['wa', 'わ...を', ['wa', '', '', '', 'wo']],
  ];
  const DAKU = [
    ['ga', 'がぎぐげご', ['ga', 'gi', 'gu', 'ge', 'go']],
    ['za', 'ざじずぜぞ', ['za', 'ji', 'zu', 'ze', 'zo']],
    ['da', 'だぢづでど', ['da', 'ji', 'zu', 'de', 'do']],
    ['ba', 'ばびぶべぼ', ['ba', 'bi', 'bu', 'be', 'bo']],
  ];
  const HANDAKU = [['pa', 'ぱぴぷぺぽ', ['pa', 'pi', 'pu', 'pe', 'po']]];
  const SMALL = [
    ['ぁ', 'a'], ['ぃ', 'i'], ['ぅ', 'u'], ['ぇ', 'e'], ['ぉ', 'o'],
    ['っ', 'tsu'], ['ゃ', 'ya'], ['ゅ', 'yu'], ['ょ', 'yo'], ['ゎ', 'wa'],
  ];
  const YOON = [
    ['ki', 'き', 'ky'], ['shi', 'し', 'sh'], ['chi', 'ち', 'ch'], ['ni', 'に', 'ny'], ['hi', 'ひ', 'hy'],
    ['mi', 'み', 'my'], ['ri', 'り', 'ry'], ['gi', 'ぎ', 'gy'], ['ji', 'じ', 'j'], ['bi', 'び', 'by'],
    ['pi', 'ぴ', 'py'], ['di', 'ぢ', 'j'],
  ];

  const KANA = []; // { h, k, r, g (group), s (series id), dup?, small?, rare? }
  function add(h, r, g, s, extra) { KANA.push(Object.assign({ h, k: toKata(h), r, g, s }, extra || {})); }
  SERIES.forEach(([s, chars, rs]) => [...chars].forEach((ch, i) => { if (ch !== '.') add(ch, rs[i], 'basic', s); }));
  add('ん', 'n', 'basic', 'n');
  const DUP_H = new Set(['ぢ', 'づ']);
  DAKU.forEach(([s, chars, rs]) => [...chars].forEach((ch, i) => add(ch, rs[i], 'dakuten', s, DUP_H.has(ch) ? { dup: true } : {})));
  add('ゔ', 'vu', 'dakuten', 'va', { rare: true });
  HANDAKU.forEach(([s, chars, rs]) => [...chars].forEach((ch, i) => add(ch, rs[i], 'handakuten', s)));
  SMALL.forEach(([ch, r]) => add(ch, r, 'small', 'small', { small: true }));
  YOON.forEach(([s, base, pre]) => {
    const vs = pre === 'j' ? ['a', 'u', 'o'] : ['a', 'u', 'o'];
    ['ゃ', 'ゅ', 'ょ'].forEach((sm, i) => {
      add(base + sm, pre + vs[i], 'yoon', s + 'y', s === 'di' ? { dup: true, rare: true } : {});
    });
  });

  const BY_H = {}, BY_K = {}, BY_CHAR = {};
  KANA.forEach((e) => { BY_H[e.h] = e; BY_K[e.k] = e; BY_CHAR[e.h] = e; BY_CHAR[e.k] = e; });
  const entryOf = (ch) => BY_CHAR[ch] || null;
  const chOf = (e, script) => (script === 'kata' ? e.k : e.h);

  /* Vowel of a kana (for ー expansion and long vowels) */
  function vowelOf(ch) {
    const e = BY_CHAR[toHira(ch)];
    if (!e) return null;
    const m = e.r.match(/[aiueo]$/);
    return m ? m[0] : null;
  }

  /* ---------- Dakuten / handakuten / small toggling (keyboard) ---------- */
  const DAKU_MAP = {}, HANDAKU_MAP = {};
  [...'かきくけこさしすせそたちつてとはひふへほ'].forEach((c, i) => {
    const v = 'がぎぐげござじずぜぞだぢづでどばびぶべぼ'[i];
    DAKU_MAP[c] = v;
  });
  DAKU_MAP['う'] = 'ゔ';
  [...'はひふへほ'].forEach((c, i) => (HANDAKU_MAP[c] = 'ぱぴぷぺぽ'[i]));
  const UNDAKU = {}; Object.keys(DAKU_MAP).forEach((b) => (UNDAKU[DAKU_MAP[b]] = b));
  const UNHANDAKU = {}; Object.keys(HANDAKU_MAP).forEach((b) => (UNHANDAKU[HANDAKU_MAP[b]] = b));
  const SMALL_MAP = { あ: 'ぁ', い: 'ぃ', う: 'ぅ', え: 'ぇ', お: 'ぉ', つ: 'っ', や: 'ゃ', ゆ: 'ゅ', よ: 'ょ', わ: 'ゎ' };
  const UNSMALL = {}; Object.keys(SMALL_MAP).forEach((b) => (UNSMALL[SMALL_MAP[b]] = b));

  function mapMark(ch, kind, script) {
    const h = toHira(ch);
    let out = null;
    if (kind === 'daku') {
      if (UNDAKU[h]) out = UNDAKU[h];            // が → か (toggle off)
      else if (UNHANDAKU[h]) out = DAKU_MAP[UNHANDAKU[h]]; // ぱ → ば
      else if (DAKU_MAP[h]) out = DAKU_MAP[h];
    } else if (kind === 'handaku') {
      if (UNHANDAKU[h]) out = UNHANDAKU[h];      // ぱ → は
      else if (UNDAKU[h] && HANDAKU_MAP[UNDAKU[h]]) out = HANDAKU_MAP[UNDAKU[h]]; // ば → ぱ
      else if (HANDAKU_MAP[h]) out = HANDAKU_MAP[h];
    } else if (kind === 'small') {
      out = SMALL_MAP[h] || UNSMALL[h] || null;
    }
    if (!out) return null;
    return script === 'kata' || isKata(ch) ? toKata(out) : out;
  }
  /* Apply a mark to the last character of `text`. Returns new text, or null if impossible. */
  function applyMark(text, kind) {
    if (!text) return null;
    const chars = [...text];
    const last = chars[chars.length - 1];
    const m = mapMark(last, kind, isKata(last) ? 'kata' : 'hira');
    if (!m) return null;
    chars[chars.length - 1] = m;
    return chars.join('');
  }

  /* ---------- Romaji → kana (Hepburn, with common IME alternates) ---------- */
  const R2K = {};
  KANA.forEach((e) => { if (!e.dup && !e.rare && !(e.small && e.h !== 'っ')) R2K[e.r] = e.h; });
  R2K.n = 'ん';
  R2K.tsu = 'つ';
  Object.assign(R2K, {
    si: 'し', ti: 'ち', tu: 'つ', hu: 'ふ', zi: 'じ', di: 'ぢ', du: 'づ',
    sya: 'しゃ', syu: 'しゅ', syo: 'しょ', tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',
    jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ', zya: 'じゃ', zyu: 'じゅ', zyo: 'じょ',
    dya: 'ぢゃ', dyu: 'ぢゅ', dyo: 'ぢょ', cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ',
    fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ', she: 'しぇ', che: 'ちぇ', je: 'じぇ',
    thi: 'てぃ', dhi: 'でぃ', twu: 'とぅ', dwu: 'どぅ', wi: 'うぃ', we: 'うぇ',
    va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ',
    xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ', la: 'ぁ', li: 'ぃ', lu: 'ぅ', le: 'ぇ', lo: 'ぉ',
    xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ', lya: 'ゃ', lyu: 'ゅ', lyo: 'ょ', xwa: 'ゎ',
    xtu: 'っ', xtsu: 'っ', ltu: 'っ', ltsu: 'っ',
    wo: 'を', '-': 'ー',
  });
  const R2K_KEYS = Object.keys(R2K);
  const isPrefix = (s) => R2K_KEYS.some((k) => k.startsWith(s));

  /* Converts as much romaji as is unambiguous. final=false keeps an incomplete tail in `rest`. */
  function romajiToKana(input, script, final) {
    const s = String(input).toLowerCase();
    let out = '', i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[^a-z'-]/.test(c)) { i++; continue; }                  // ignore junk
      if (c === '-') { out += 'ー'; i++; continue; }
      if (c === "'") { i++; continue; }
      if (c === 'n') {
        const nx = s[i + 1];
        if (nx === undefined) { if (final) { out += 'ん'; i++; continue; } break; }
        if (nx === "'") { out += 'ん'; i += 2; continue; }
        if (nx === 'n') {                                         // nn
          const after = s[i + 2];
          if (after !== undefined && /[aiueoy]/.test(after)) { out += 'ん'; i += 1; continue; } // konnichi: ん + ni
          if (after === undefined && !final) { break; }
          out += 'ん'; i += 2; continue;
        }
        if (!/[aiueoy]/.test(nx)) { out += 'ん'; i += 1; continue; } // n + consonant
      }
      if (i + 1 < s.length && c === s[i + 1] && /[bcdfghjklmpqrstvwxyz]/.test(c)) { out += 'っ'; i++; continue; } // double consonant
      if (c === 't' && s[i + 1] === 'c' && s[i + 2] === 'h') { out += 'っ'; i++; continue; } // tchi → っち
      let hit = null;
      for (let len = 4; len >= 1 && !hit; len--) {
        const key = s.substr(i, len);
        if (key.length === len && R2K[key] && !(len === 1 && key === 'n')) hit = key;
      }
      if (hit) { out += R2K[hit]; i += hit.length; continue; }
      // no match
      if (!final && isPrefix(s.slice(i))) break;                  // incomplete, wait for more letters
      i++;                                                         // drop unknown letter
    }
    const rest = s.slice(i);
    const kana = script === 'kata' ? toKata(out) : out;
    return { kana, rest };
  }

  /* ---------- Kana → romaji (display only) ---------- */
  const K2R = {};
  KANA.forEach((e) => { K2R[e.h] = e.r; });
  K2R['を'] = 'o'; K2R['ゃ'] = 'ya'; K2R['ゅ'] = 'yu'; K2R['ょ'] = 'yo';
  Object.assign(K2R, { ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo', てぃ: 'ti', でぃ: 'di', とぅ: 'tu', どぅ: 'du', うぃ: 'wi', うぇ: 'we', うぉ: 'wo', しぇ: 'she', ちぇ: 'che', じぇ: 'je', ゔぁ: 'va', ゔぃ: 'vi', ゔ: 'vu', ゔぇ: 've', ゔぉ: 'vo' });
  const MACRON = { a: 'ā', i: 'ī', u: 'ū', e: 'ē', o: 'ō' };

  function kanaToRomaji(str) {
    const chars = [...toHira(str)];
    const out = [];
    let sokuon = false;
    for (let i = 0; i < chars.length; i++) {
      let ch = chars[i];
      if (ch === 'っ') { sokuon = true; continue; }
      if (ch === 'ー') {
        const prev = out.length ? out[out.length - 1] : '';
        const m = prev.match(/[aiueo]$/);
        if (m) out[out.length - 1] = prev.slice(0, -1) + MACRON[m[0]];
        continue;
      }
      let r = null;
      if (i + 1 < chars.length && SMALL_JOIN.includes(chars[i + 1])) {
        const pair = ch + chars[i + 1];
        if (K2R[pair]) { r = K2R[pair]; i++; }
      }
      if (r === null) r = K2R[ch];
      if (r === undefined || r === null) { out.push(ch); sokuon = false; continue; }
      if (ch === 'ん') {
        r = 'n';
        const nx = chars[i + 1] && (K2R[chars[i + 1]] || '');
        if (nx && /^[aiueoy]/.test(nx)) r = "n'";
      }
      if (sokuon) { r = r.startsWith('ch') ? 't' + r : r[0] + r; sokuon = false; }
      out.push(r);
    }
    return out.join('');
  }

  /* ---------- Units: split a word into writing units (きゃ is one unit; っ and ー separate) ---------- */
  function units(str) {
    const out = [];
    for (const ch of String(str)) {
      if (SMALL_JOIN.includes(ch) && out.length) out[out.length - 1] += ch;
      else out.push(ch);
    }
    return out;
  }

  /* ---------- Answer checker ---------- */
  function norm(s) {
    return String(s == null ? '' : s).normalize('NFC').replace(/[\s　・、。,.!?！？]/g, '');
  }

  /* LCS-based diff so feedback can show which characters were missing / wrong */
  function diffChars(input, target) {
    const a = [...input], b = [...target];
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--)
      for (let j = b.length - 1; j >= 0; j--)
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const given = [], expected = [];
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) { given.push({ c: a[i], ok: true }); expected.push({ c: b[j], ok: true }); i++; j++; }
      else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) { expected.push({ c: b[j], ok: false }); j++; }
      else { given.push({ c: a[i], ok: false }); i++; }
    }
    return { given, expected };
  }

  /* kind: 'exact' | 'script' (same sounds, wrong script) | 'wrong' | 'empty' */
  function checkAnswer(input, target) {
    const a = norm(input), b = norm(target);
    if (!a) return { ok: false, kind: 'empty', diff: diffChars('', b) };
    if (a === b) return { ok: true, kind: 'exact', diff: diffChars(a, b) };
    if (toHira(a) === toHira(b)) return { ok: false, kind: 'script', diff: diffChars(a, b) };
    return { ok: false, kind: 'wrong', diff: diffChars(a, b) };
  }

  /* ---------- Drill data ---------- */
  const LOOKALIKES = [
    ['し', 'つ', 'そ', 'ん'], ['ぬ', 'め'], ['わ', 'れ', 'ね'], ['は', 'ほ'], ['さ', 'ち'], ['る', 'ろ'],
    ['あ', 'お'], ['い', 'り'], ['き', 'さ'],
    ['シ', 'ツ'], ['ソ', 'ン'], ['ク', 'ケ', 'タ'], ['ウ', 'ワ', 'フ'], ['コ', 'ユ'], ['ス', 'ヌ'], ['ナ', 'メ'],
  ];
  const VOICING = [
    ['か', 'が'], ['き', 'ぎ'], ['く', 'ぐ'], ['け', 'げ'], ['こ', 'ご'], ['さ', 'ざ'], ['す', 'ず'], ['せ', 'ぜ'], ['そ', 'ぞ'],
    ['た', 'だ'], ['て', 'で'], ['と', 'ど'], ['は', 'ば', 'ぱ'], ['ひ', 'び', 'ぴ'], ['ふ', 'ぶ', 'ぷ'], ['へ', 'べ', 'ぺ'], ['ほ', 'ぼ', 'ぽ'],
  ];
  // Real minimal pairs: [word, en, es]
  const MINIMAL_PAIRS = [
    [['きて', 'come (and…)', 'ven / viene'], ['きって', 'stamp', 'sello']],
    [['おじさん', 'uncle / middle-aged man', 'tío'], ['おじいさん', 'grandfather / old man', 'abuelo']],
    [['おばさん', 'aunt / middle-aged woman', 'tía'], ['おばあさん', 'grandmother / old woman', 'abuela']],
    [['ゆき', 'snow', 'nieve'], ['ゆうき', 'courage', 'valentía']],
    [['ビル', 'building', 'edificio'], ['ビール', 'beer', 'cerveza']],
  ];

  MS.kana = {
    KANA, SERIES, DAKU, HANDAKU, SMALL, YOON, LOOKALIKES, VOICING, MINIMAL_PAIRS,
    BY_H, BY_K, entryOf, chOf, vowelOf,
    toKata, toHira, isHira, isKata, isKana, scriptCheck, units, SMALL_JOIN,
    applyMark, romajiToKana, kanaToRomaji,
    norm, diffChars, checkAnswer,
  };
})();
