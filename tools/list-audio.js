/* tools/list-audio.js — lists every Japanese string the app can play, for tools/make_audio.py.
   Loads the data files the same way the browser does, then walks them for Japanese-only strings.
   Run: node tools/list-audio.js > tools/audio-list.json */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['js/kana-data.js', 'data/content.js', 'data/vocab-sets.js', 'js/topics.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });

// Must match SPEAK_FIX in js/ui.js: the app speaks the mapped text, so we record that.
const ui = fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8');
const SPEAK_FIX = vm.runInNewContext('(' + ui.match(/const SPEAK_FIX = (\{[^}]*\})/)[1] + ')');

const JA = /^[぀-ヿ㐀-鿿ｦ-ﾟ ー・、。？！〜]+$/;
const HAS_JA = /[぀-ヿ㐀-鿿]/;
const out = new Set(), seen = new WeakSet();
const add = (s) => { s = s.replace(/ /g, ''); if (!s) return; out.add(SPEAK_FIX[s] || s); };
(function walk(v) {
  if (typeof v === 'string') { const t = v.trim(); if (JA.test(t) && HAS_JA.test(t)) add(t); return; }
  if (!v || typeof v !== 'object' || seen.has(v)) return; seen.add(v);
  for (const k of Object.keys(v)) { if (/^(en|es|title|body|note|q|url)$/.test(k) && typeof v[k] === 'string') continue; walk(v[k]); }
})({ kana: ctx.MS.kana, content: ctx.MS.content, sets: ctx.MS.vocabSets });
ctx.MS.numbers.audioList().forEach(add);
// The sample words in js/session.js.
const ses = fs.readFileSync(path.join(root, 'js/session.js'), 'utf8').match(/const SAMPLE_WORDS = (\[[\s\S]*?\]);/);
if (ses) vm.runInNewContext(ses[1]).forEach((w) => add(w[0]));
// Every single hiragana/katakana, including ones only reachable through drills.
for (let c = 0x3041; c <= 0x3094; c++) add(String.fromCodePoint(c));
for (let c = 0x30a1; c <= 0x30f4; c++) add(String.fromCodePoint(c));
add('こんにちは');
process.stdout.write(JSON.stringify([...out].sort(), null, 0) + '\n');
