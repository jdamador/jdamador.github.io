# Masume (升目)

A personal study desk for introductory Japanese (kana first) and for English at B2/C1 → C1/C2.
The name is the word for the squares on genkouyoushi manuscript paper, which is the look of the site.

Plain HTML, CSS and JavaScript. No framework, no build step, no backend, no npm.

## Run it

```
cd japanese-study
python3 -m http.server 8000
```

Open <http://localhost:8000>. (If port 8000 is busy, use another number.)

`index.html` also works when opened directly (double-click). Two things need the web-server route:
the offline cache (a service worker) and the test page.
After the first load over http, the site keeps working offline. Only the web fonts are optional;
without them your Mac's own Hiragino/Klee fonts are used.

## Your data and backups

Everything you enter is saved in your browser (localStorage, key `masume.v1`), on this computer only.

- **Data and help → Export backup** downloads one JSON file.
- **Import backup** can *merge* it with what is there or *replace* everything.
- Clearing site data, using a private window or switching browsers means an empty site: export regularly.
- If the browser blocks storage the site still works, warns you, and keeps data in memory until you export.

## Tests

Open <http://localhost:8000/test.html>. It runs unit checks (kana conversion, romaji, answer checker,
SRS, generator) and then drives the real app in a frame: it taps the on-screen keyboard to answer every
practice type, runs a quiz and an exam, imports and exports data, and checks for console errors.
Everything should be green and the heading should read `PASS 71 / 71`.

## Files

| File | What it holds |
|---|---|
| `index.html`, `styles.css` | page shell and all styling (design tokens at the top) |
| `js/kana-data.js` | kana tables, hiragana↔katakana conversion, romaji, answer checker (pure logic) |
| `js/srs.js` | SM-2 style scheduler used for kana, words and the English journal |
| `js/store.js` | localStorage, export/import |
| `js/ui.js` | DOM helper, EN/ES, speech, handwriting pad, stroke-order viewer |
| `js/keyboard.js` | the on-screen kana keyboard (one component, used everywhere) |
| `js/practice.js` | practice engine: activity builders and the generator (no DOM) |
| `js/session.js` | practice runner, summary and the Practice page |
| `js/english.js` | English module |
| `js/app.js` | shell, router, all Japanese pages |
| `data/content.js` | rules, study plan, countdown steps, Japanese resources (edit freely) |
| `data/english-data.js` | CEFR statements, task library, 12-week roadmap, prompts, English resources |
| `data/strokes.js` | stroke paths for hiragana and katakana, from KanjiVG |
| `test.html`, `js/tests.js` | the test page |
| `sw.js` | offline cache |

## Notes

- Interface: EN / ES toggle. Meanings you type can be in either language. English-module practice content is English on purpose.
- Pronunciation uses the browser's Japanese voice. If none is installed the site shows the macOS steps:
  System Settings › Accessibility › Spoken Content › System Voice › Manage Voices › Japanese.
- The site is kana-only for now. Words with kanji can be stored (they are flagged), but typing activities skip them.
- Speaking recordings stay in memory in the open tab. They are never uploaded or saved.

## Credits

- Stroke data: [KanjiVG](http://kanjivg.tagaini.net) © Ulrich Apel, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
  `data/strokes.js` is derived from it and shared under the same licence.
- Fonts (SIL Open Font License, from Google Fonts): Bricolage Grotesque, Zen Kaku Gothic New, Klee One.
