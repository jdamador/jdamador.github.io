/* shared.js: study room. Keeps your Words in sync with a partner through Firebase Firestore.
   Everyone who joins the same room code gets the same word list in their own Words page, so the
   words feed everyone's practice. Adds, edits, pictures and deletes travel both ways, live.
   Practice progress (SRS, mistakes, "difficult" stars) stays personal and never leaves the browser.
   The room code is hashed before use, so the database never stores it in plain text.
   Turned off until js/firebase-config.js has a config. */
(function () {
  const MS = (window.MS = window.MS || {});
  const U = MS.ui;
  const { h, T, clear, toast } = U;
  const D = () => MS.store.data;
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const FIELDS = ['w', 'm', 'lesson', 'ex', 'note', 'img', 'by', 'added', 'edited'];

  /* ---------- backend (tests can set MS.sharedBackend to a fake with the same methods) ---------- */
  let loading = null;
  function backend() {
    if (MS.sharedBackend) return Promise.resolve(MS.sharedBackend);
    if (!MS.firebaseConfig) return Promise.resolve(null);
    if (!loading) {
      loading = Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-firestore.js')]).then(([appMod, fs]) => {
        const db = fs.getFirestore(appMod.initializeApp(MS.firebaseConfig));
        const col = (room) => fs.collection(db, 'rooms', room, 'words');
        MS.sharedBackend = {
          watch: (room, onData, onErr) => fs.onSnapshot(col(room), { includeMetadataChanges: false },
            (snap) => onData(snap.docs.map((d) => Object.assign({ id: d.id }, d.data())), snap.metadata.fromCache), onErr),
          put: (room, id, rec) => fs.setDoc(fs.doc(db, 'rooms', room, 'words', id), rec),
          remove: (room, id) => fs.deleteDoc(fs.doc(db, 'rooms', room, 'words', id)),
        };
        return MS.sharedBackend;
      });
      loading.catch(() => { loading = null; });
    }
    return loading;
  }

  async function roomId(code) {
    const bytes = new TextEncoder().encode('masume:' + code.trim().toLowerCase());
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  }

  const settings = () => D().shared || (D().shared = { code: '', name: '' });
  const str = (s, n) => String(s || '').slice(0, n);
  function toRemote(w) {
    return {
      w: str(w.w, 40), m: str(w.m, 120), lesson: str(w.lesson, 40), ex: str(w.ex, 200), note: str(w.note, 200),
      img: str(w.img, 300000), by: str(w.by || settings().name, 30), added: Math.round(w.added || Date.now()), edited: Math.round(w.edited || w.added || Date.now()),
    };
  }

  /* ---------- sync engine ---------- */
  const S = { be: null, room: null, unsub: null, state: 'off', error: '', remote: null, pushing: new Set(), timer: null };
  const listeners = new Set();
  const notify = () => listeners.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
  function listen(f) { listeners.add(f); return () => listeners.delete(f); }

  function fail(e) {
    S.state = 'error';
    S.error = e && /permission/i.test(e.code || e.message || '')
      ? T('The database refused the change. Publish the Firestore rules shown below.', 'La base de datos rechazó el cambio. Publica las reglas de Firestore que aparecen abajo.')
      : T('Could not reach the study room. Check your connection.', 'No se pudo conectar con la sala de estudio. Revisa tu conexión.') + (e && e.message ? ' (' + e.message + ')' : '');
    notify();
  }

  function renameWord(w, newId) {
    const d = D(), oldKey = 'w:' + w.id, newKey = 'w:' + newId;
    if (d.srs[oldKey]) { d.srs[newKey] = d.srs[oldKey]; delete d.srs[oldKey]; }
    if (d.mistakes[oldKey]) { d.mistakes[newKey] = d.mistakes[oldKey]; delete d.mistakes[oldKey]; }
    w.id = newId;
  }

  /* Apply the room's list to the local Words. */
  function applyRemote(docs, fromCache) {
    const d = D();
    const del = new Set(d.sharedDel || []);
    S.remote = new Map(docs.map((r) => [r.id, r]));
    let added = 0, changed = false;
    const byId = new Map(d.words.map((w) => [w.id, w]));
    docs.forEach((r) => {
      if (del.has(r.id)) return;                       // we deleted it, the delete is on its way
      let w = byId.get(r.id);
      if (!w) {
        // Same word typed on both sides before joining: keep one copy, adopt the room's id.
        w = d.words.find((x) => !x.sh && x.w === r.w);
        if (w) { byId.delete(w.id); renameWord(w, r.id); byId.set(r.id, w); }
      }
      if (!w) {
        d.words.unshift({ id: r.id, w: r.w, m: r.m, lesson: r.lesson || '', ex: r.ex || '', note: r.note || '', img: r.img || '', by: r.by || '', hard: false, added: r.added || Date.now(), edited: r.edited || 0, pushed: r.edited || 0, sh: true });
        added++; changed = true; return;
      }
      if (!w.sh) { w.sh = true; changed = true; }
      if ((r.edited || 0) > (w.edited || 0)) {
        ['w', 'm', 'lesson', 'ex', 'note', 'img', 'by'].forEach((k) => { w[k] = r[k] || ''; });
        w.edited = w.pushed = r.edited; changed = true;
      }
    });
    // Words that were in the room but are gone now were deleted by someone else.
    if (!fromCache) {
      const before = d.words.length;
      d.words = d.words.filter((w) => {
        if (!w.sh || S.remote.has(w.id) || S.pushing.has(w.id)) return true;
        delete d.srs['w:' + w.id]; delete d.mistakes['w:' + w.id];
        return false;
      });
      if (d.words.length !== before) changed = true;
    }
    if (changed) MS.store.save();
    if (added && S.state === 'live') toast(T(added + ' new shared word' + (added > 1 ? 's' : '') + ' from your room.', added + ' palabra' + (added > 1 ? 's' : '') + ' nueva' + (added > 1 ? 's' : '') + ' de tu sala.'));
    if (!fromCache) { S.state = 'live'; S.error = ''; }
    notify();
    schedule();
  }

  /* Send local adds, edits and deletes to the room. */
  async function pushUp() {
    if (!S.be || !S.room || !S.remote) return;
    const d = D(), room = S.room;
    const todo = d.words.filter((w) => !S.pushing.has(w.id) && (!w.sh || (w.edited || 0) > (w.pushed || 0)));
    const dels = (d.sharedDel || []).slice();
    if (!todo.length && !dels.length) return;
    try {
      for (const w of todo) {
        if (room !== S.room) return;
        S.pushing.add(w.id);
        if (!w.by) w.by = settings().name || '';
        if (!w.edited) w.edited = w.added || Date.now();
        await S.be.put(room, w.id, toRemote(w));
        w.sh = true; w.pushed = w.edited; S.pushing.delete(w.id);
      }
      for (const id of dels) {
        await S.be.remove(room, id);
        d.sharedDel = (d.sharedDel || []).filter((x) => x !== id);
      }
      MS.store.save();
    } catch (e) { S.pushing.clear(); fail(e); }
  }
  function schedule() { clearTimeout(S.timer); S.timer = setTimeout(pushUp, 600); }

  /* Every save on this device may contain a local change: push it soon after. */
  const origSave = MS.store.save;
  MS.store.save = function () { const r = origSave.apply(this, arguments); if (S.room) schedule(); return r; };

  function disconnect() {
    if (S.unsub) { try { S.unsub(); } catch (e) { /* ignore */ } }
    Object.assign(S, { unsub: null, room: null, remote: null, state: 'off', error: '' });
    S.pushing.clear();
    notify();
  }

  async function connect() {
    disconnect();
    const st = settings();
    if (!st.code) return;
    S.state = 'connecting'; notify();
    try {
      S.be = await backend();
      if (!S.be) { S.state = 'off'; notify(); return; }
      S.room = await roomId(st.code);
      S.unsub = S.be.watch(S.room, applyRemote, fail);
    } catch (e) { fail(e); }
  }

  /* Called by the Words page when a word is deleted on this device. */
  function deleted(w) {
    if (!w || !w.sh) return;
    const d = D();
    d.sharedDel = (d.sharedDel || []).concat(w.id);
  }
  function leave() {
    disconnect();
    const d = D();
    d.words.forEach((w) => { delete w.sh; delete w.pushed; });
    d.sharedDel = [];
    settings().code = '';
    MS.store.save();
  }

  /* ---------- page ---------- */
  const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{room}/words/{id} {
      allow read, delete: if true;
      allow create, update: if request.resource.data.keys().hasOnly(['w', 'm', 'lesson', 'ex', 'note', 'img', 'by', 'added', 'edited'])
        && request.resource.data.w is string && request.resource.data.w.size() > 0 && request.resource.data.w.size() <= 40
        && request.resource.data.m is string && request.resource.data.m.size() > 0 && request.resource.data.m.size() <= 120
        && request.resource.data.lesson is string && request.resource.data.lesson.size() <= 40
        && request.resource.data.ex is string && request.resource.data.ex.size() <= 200
        && request.resource.data.note is string && request.resource.data.note.size() <= 200
        && request.resource.data.img is string && request.resource.data.img.size() <= 300000
        && request.resource.data.by is string && request.resource.data.by.size() <= 30
        && request.resource.data.added is int && request.resource.data.edited is int;
    }
  }
}`;

  let pageUnsub = null;
  const cleanup = () => { if (pageUnsub) { pageUnsub(); pageUnsub = null; } };

  function page(host) {
    cleanup();
    const st = settings();
    const view = h('div', { class: 'page' },
      h('header', { class: 'page-head' }, h('h1', null, T('Study room', 'Sala de estudio')),
        h('p', { class: 'lead' }, T('Study with a partner. Everyone who joins the same room has the same word list in Words, so the words you add show up in your partner’s practice, and theirs in yours. Pictures and edits are shared too. Your progress stays your own.', 'Estudia con un compañero. Quienes entran a la misma sala tienen la misma lista en Palabras: las palabras que agregas aparecen en la práctica de tu compañero, y las suyas en la tuya. También se comparten imágenes y cambios. Tu progreso sigue siendo tuyo.'))));
    const body = h('div');
    view.appendChild(body);
    const rulesBox = h('details', { class: 'paste' }, h('summary', null, T('Firestore rules (site owner)', 'Reglas de Firestore (dueño del sitio)')),
      h('p', { class: 'muted' }, T('In the Firebase console: Firestore Database › Rules. Replace everything with this and click Publish.', 'En la consola de Firebase: Firestore Database › Reglas. Reemplaza todo con esto y haz clic en Publicar.')),
      h('pre', { class: 'code' }, RULES));
    clear(host).appendChild(view);

    if (!MS.firebaseConfig && !MS.sharedBackend) {
      body.append(h('p', { class: 'note' }, T('The study room is not set up on this site yet: js/firebase-config.js is empty.', 'La sala de estudio aún no está configurada en este sitio: js/firebase-config.js está vacío.')), rulesBox);
      return;
    }

    function draw() {
      clear(body);
      if (!st.code) {
        const codeIn = h('input', { type: 'text', autocomplete: 'off', placeholder: T('Room code, e.g. daniel-ana-2026', 'Código de sala, ej. daniel-ana-2026'), 'aria-label': T('Room code', 'Código de sala') });
        const nameIn = h('input', { type: 'text', value: st.name, maxLength: 30, placeholder: T('Your name', 'Tu nombre'), 'aria-label': T('Your name', 'Tu nombre') });
        const n = D().words.length;
        body.append(h('section', null, h('h2', null, T('Join a room', 'Entrar a una sala')),
          h('p', { class: 'muted' }, T('Agree on a code with your partner and both type it here. Make it hard to guess: anyone with the code can change the list.', 'Acuerden un código con tu compañero y escríbanlo los dos aquí. Que sea difícil de adivinar: quien tenga el código puede cambiar la lista.')),
          h('form', { class: 'row wrap', onsubmit: (ev) => {
            ev.preventDefault();
            const c = codeIn.value.trim();
            if (c.length < 6) { toast(T('Use a code with at least 6 characters.', 'Usa un código de al menos 6 caracteres.')); return; }
            if (!nameIn.value.trim()) { toast(T('Add your name so your partner knows who added each word.', 'Agrega tu nombre para que tu compañero sepa quién agregó cada palabra.')); nameIn.focus(); return; }
            st.code = c; st.name = nameIn.value.trim().slice(0, 30); MS.store.save(); connect(); draw();
          } }, codeIn, nameIn, h('button', { class: 'btn primary', type: 'submit' }, T('Join room', 'Entrar a la sala'))),
          n ? h('p', { class: 'note' }, T('Your ' + n + ' words will be added to the room, and the room’s words will be added to your Words.', 'Tus ' + n + ' palabras se agregarán a la sala, y las palabras de la sala se agregarán a tus Palabras.')) : null),
          rulesBox);
        return;
      }
      const words = D().words, shared = words.filter((w) => w.sh).length;
      const byWho = {};
      words.filter((w) => w.sh).forEach((w) => { const k = w.by || '?'; byWho[k] = (byWho[k] || 0) + 1; });
      const stateLine = S.state === 'live' ? h('p', { class: 'note' }, T('Live. Changes from your partner appear in Words automatically.', 'En vivo. Los cambios de tu compañero aparecen en Palabras automáticamente.'))
        : S.state === 'error' ? h('p', { class: 'note bad' }, S.error)
        : h('p', { class: 'muted' }, T('Connecting…', 'Conectando…'));
      body.append(h('section', null, h('h2', null, T('Room', 'Sala')),
        h('p', { class: 'row wrap' }, T('You are in ', 'Estás en '), h('strong', null, st.code), T(' as ', ' como '), h('strong', null, st.name || '?'),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => U.confirmDlg(T('Leave the room?', '¿Salir de la sala?'), T('You keep a copy of every word. New changes stop syncing.', 'Conservas una copia de cada palabra. Los cambios nuevos dejan de sincronizarse.'), T('Leave', 'Salir'), () => { leave(); draw(); }) }, T('Leave', 'Salir'))),
        stateLine,
        h('p', null, T(shared + ' shared words', shared + ' palabras compartidas'), Object.keys(byWho).length ? ' · ' + Object.entries(byWho).map(([k, v]) => k + ': ' + v).join(', ') : ''),
        h('div', { class: 'row actions wrap' }, h('a', { class: 'btn primary', href: '#/vocab' }, T('Open Words', 'Abrir Palabras')), h('a', { class: 'btn', href: '#/practice' }, T('Practise', 'Practicar')))),
        rulesBox);
    }
    pageUnsub = listen(draw);
    draw();
  }

  window.addEventListener('load', () => { if (settings().code) connect(); });

  MS.shared = { page, cleanup, listen, deleted, connect, leave, status: () => S.state };
})();
