/* config.js: site switches.

   english: show the English sections (Level and goals, Weekly plan, Tools, Resources).
     false = hidden for everyone who opens the site. Set it to true only if you want them public.

   To see the English sections on YOUR browser only, open the site once with ?english=on
   at the end of the address, for example:
     https://jdamador.github.io/masume/?english=on
   That browser remembers it. ?english=off hides them again. Works the same when you open
   index.html from your computer. */
window.MS = window.MS || {};
MS.config = { english: false };

(function () {
  try {
    const m = location.search.match(/[?&]english=(on|off)\b/);
    if (m) localStorage.setItem('masume.english', m[1]);
    if (localStorage.getItem('masume.english') === 'on') MS.config.english = true;
  } catch (e) { /* storage blocked: keep the default */ }
})();
