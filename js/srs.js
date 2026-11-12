/* srs.js — SM-2 style scheduler shared by words, kana and the English journal.
   Grades: 0 Again, 1 Hard, 2 Good, 3 Easy.
   Pure functions + thin helpers that read/write MS.store.data.srs (store may be absent in tests). */
(function () {
  const MS = (window.MS = window.MS || {});
  const DAY = 86400000;

  function fresh(now) {
    return { ease: 2.5, interval: 0, reps: 0, due: now || Date.now(), lapses: 0, seen: 0, ok: 0, bad: 0, recent: '', last: 0 };
  }

  /* Returns a NEW state. interval is in days; Again comes back in 10 minutes. */
  function review(st, grade, now) {
    now = now || Date.now();
    const s = Object.assign(fresh(now), st);
    s.seen++; s.last = now;
    const good = grade >= 1;
    if (good) s.ok++; else s.bad++;
    s.recent = (s.recent + (good ? '1' : '0')).slice(-10);
    if (grade === 0) {
      s.reps = 0; s.lapses++;
      s.ease = Math.max(1.3, s.ease - 0.2);
      s.interval = 0;
      s.due = now + 10 * 60 * 1000;
      return s;
    }
    if (grade === 1) {
      s.ease = Math.max(1.3, s.ease - 0.15);
      s.interval = Math.max(1, Math.round((s.interval || 1) * 1.2));
    } else if (grade === 2) {
      s.interval = s.reps === 0 ? 1 : s.reps === 1 ? 3 : Math.round(s.interval * s.ease);
    } else {
      s.ease = s.ease + 0.15;
      s.interval = s.reps === 0 ? 3 : s.reps === 1 ? 6 : Math.round(s.interval * s.ease * 1.3);
    }
    s.reps++;
    s.interval = Math.min(s.interval, 365);
    s.due = now + s.interval * DAY;
    return s;
  }

  const isDue = (st, now) => !!st && st.due <= (now || Date.now());
  const accuracy = (st) => (st && st.seen ? st.ok / st.seen : null);
  /* Recent accuracy over the last 10 answers (what the heat map shows) */
  const recentAccuracy = (st) => {
    if (!st || !st.recent) return null;
    let n = 0; for (const c of st.recent) n += c === '1' ? 1 : 0;
    return n / st.recent.length;
  };
  const isLearned = (st) => !!st && st.interval >= 7; // "learned" = scheduled a week or more ahead

  /* ---------- store-backed helpers ---------- */
  function table() { return MS.store.data.srs; }
  function get(key) { return table()[key] || null; }
  function grade(key, g, now) {
    table()[key] = review(table()[key], g, now);
    // mistake bank: wrong adds, two correct in a row clears
    const mb = MS.store.data.mistakes;
    if (g === 0) { const m = mb[key] || { n: 0, ok: 0 }; m.n++; m.ok = 0; m.last = Date.now(); mb[key] = m; }
    else if (mb[key]) { mb[key].ok++; if (mb[key].ok >= 2) delete mb[key]; }
    MS.store.save();
  }
  function dueKeys(prefix, now) {
    const t = table(); now = now || Date.now();
    return Object.keys(t).filter((k) => k.startsWith(prefix) && t[k].due <= now);
  }

  MS.srs = { DAY, fresh, review, isDue, accuracy, recentAccuracy, isLearned, get, grade, dueKeys };
})();
