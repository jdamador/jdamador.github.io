/* shared.js: a word list shared with a study partner, stored in Firebase Firestore.
   Everyone who types the same room code sees and edits the same list, live.
   The room code is hashed before it is used, so the database never stores it in plain text.
   Turned off until js/firebase-config.js has a config. */
(function () {
  const MS = (window.MS = window.MS || {});
  const U = MS.ui, K = MS.kana;
  const { h, T, clear, toast, speakBtn, icon } = U;
  const D = () => MS.store.data;
  const save = () => MS.store.save();
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

  let unsub = null;
  const cleanup = () => { if (unsub) { try { unsub(); } catch (e) { /* ignore */ } unsub = null; } };

  /* Firestore wrapper. Tests can set MS.sharedBackend to a fake with the same three methods. */
  let loading = null;
  function backend() {
    if (MS.sharedBackend) return Promise.resolve(MS.sharedBackend);
    if (!MS.firebaseConfig) return Promise.resolve(null);
    if (!loading) {
      loading = Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-firestore.js')]).then(([appMod, fs]) => {
        const db = fs.getFirestore(appMod.initializeApp(MS.firebaseConfig));
        const col = (room) => fs.collection(db, 'rooms', room, 'words');
        MS.sharedBackend = {
          watch: (room, onData, onErr) => fs.onSnapshot(col(room), (snap) => onData(snap.docs.map((d) => Object.assign({ id: d.id }, d.data()))), onErr),
          add: (room, rec) => fs.addDoc(col(room), rec),
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

  const toKana = (w) => (/^[a-zA-Z' -]+$/.test(w) ? K.romajiToKana(w.replace(/ /g, '').toLowerCase(), 'hira', true).kana : w);
  const clean = (s, n) => String(s || '').trim().slice(0, n);

  function addLocal(sw) {
    const d = D();
    if (d.words.some((x) => x.w === sw.w)) return false;
    d.words.unshift({ id: MS.store.uid(), w: sw.w, m: sw.m, lesson: sw.lesson || '', ex: '', note: sw.by ? T('Shared by ', 'Compartida por ') + sw.by : '', hard: false, added: Date.now() });
    return true;
  }

  const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{room}/words/{id} {
      allow read, delete: if true;
      allow create: if request.resource.data.keys().hasOnly(['w', 'm', 'lesson', 'by', 'added'])
        && request.resource.data.w is string && request.resource.data.w.size() > 0 && request.resource.data.w.size() <= 40
        && request.resource.data.m is string && request.resource.data.m.size() > 0 && request.resource.data.m.size() <= 120
        && request.resource.data.lesson is string && request.resource.data.lesson.size() <= 40
        && request.resource.data.by is string && request.resource.data.by.size() <= 30
        && request.resource.data.added is int;
    }
  }
}`;

  function setupHelp() {
    return h('section', null,
      h('p', { class: 'note' }, T('Shared words are not set up on this site yet.', 'Las palabras compartidas aún no están configuradas en este sitio.')),
      h('details', { class: 'paste' }, h('summary', null, T('Set it up (site owner)', 'Configurarlo (dueño del sitio)')),
        h('ol', null,
          h('li', null, T('Go to console.firebase.google.com, sign in with Google, and create a project (Google Analytics is not needed).', 'Ve a console.firebase.google.com, entra con Google y crea un proyecto (no hace falta Google Analytics).')),
          h('li', null, T('Build › Firestore Database › Create database. Pick a location near you and start in production mode.', 'Build › Firestore Database › Crear base de datos. Elige una ubicación cercana e inicia en modo producción.')),
          h('li', null, T('In Firestore › Rules, replace everything with the rules below and click Publish.', 'En Firestore › Reglas, reemplaza todo con las reglas de abajo y haz clic en Publicar.')),
          h('li', null, T('Project settings (gear icon) › Your apps › Web (</>). Register the app, then copy the firebaseConfig values.', 'Configuración del proyecto (engranaje) › Tus apps › Web (</>). Registra la app y copia los valores de firebaseConfig.')),
          h('li', null, T('Paste them into js/firebase-config.js, then commit and push.', 'Pégalos en js/firebase-config.js, luego haz commit y push.'))),
        h('pre', { class: 'code' }, RULES)));
  }

  function page(host) {
    cleanup();
    const d = D();
    const st = d.shared || (d.shared = { code: '', name: '' });
    let words = [], room = null;
    const status = h('p', { class: 'muted' });
    const listBox = h('div');
    const bulk = h('div', { class: 'row actions wrap' });
    const view = h('div', { class: 'page' },
      h('header', { class: 'page-head' }, h('h1', null, T('Shared words', 'Palabras compartidas')),
        h('p', { class: 'lead' }, T('One word list for you and your study partner. Everyone who enters the same room code sees the same words and can add or delete them. Copy any of them to your own Words to practise.', 'Una lista de palabras para ti y tu compañero de estudio. Quien escriba el mismo código de sala ve las mismas palabras y puede agregarlas o borrarlas. Copia las que quieras a tus Palabras para practicar.'))));
    clear(host).appendChild(view);

    backend().then((be) => {
      if (!be) { view.appendChild(setupHelp()); return; }
      start(be);
    }).catch((e) => {
      view.appendChild(h('p', { class: 'note bad' }, T('Could not load the shared word service. Check your connection and reload. ', 'No se pudo cargar el servicio de palabras compartidas. Revisa tu conexión y recarga. ') + (e && e.message ? '(' + e.message + ')' : '')));
    });

    function start(be) {
      const codeIn = h('input', { type: 'text', value: st.code, autocomplete: 'off', placeholder: T('e.g. daniel-ana-2026', 'ej. daniel-ana-2026'), 'aria-label': T('Room code', 'Código de sala') });
      const nameIn = h('input', { type: 'text', value: st.name, maxLength: 30, placeholder: T('Your name', 'Tu nombre'), 'aria-label': T('Your name', 'Tu nombre'), oninput: (e) => { st.name = e.target.value; save(); } });
      const joinBox = h('form', { class: 'row wrap', onsubmit: (ev) => { ev.preventDefault(); const c = codeIn.value.trim(); if (c.length < 6) { toast(T('Use a code with at least 6 characters.', 'Usa un código de al menos 6 caracteres.')); return; } st.code = c; save(); join(); } },
        codeIn, nameIn, h('button', { class: 'btn primary', type: 'submit' }, T('Open room', 'Abrir sala')));
      const roomLine = h('p', { class: 'row wrap' });
      view.appendChild(h('section', null, h('h2', null, T('Room', 'Sala')),
        h('p', { class: 'muted' }, T('Agree on a code with your partner. Make it hard to guess: anyone with the code can change the list.', 'Acuerden un código con tu compañero. Que sea difícil de adivinar: quien tenga el código puede cambiar la lista.')),
        joinBox, roomLine, status));

      // add form
      const wIn = h('input', { type: 'text', lang: 'ja', maxLength: 40, placeholder: T('Word in kana (or romaji)', 'Palabra en kana (o romaji)'), 'aria-label': T('Word', 'Palabra'), oninput: () => { prev.textContent = wIn.value.trim() ? toKana(wIn.value.trim()) : ''; } });
      const prev = h('span', { class: 'badge', lang: 'ja' });
      const mIn = h('input', { type: 'text', maxLength: 120, placeholder: T('Meaning', 'Significado'), 'aria-label': T('Meaning', 'Significado') });
      const lIn = h('input', { type: 'text', maxLength: 40, list: 'shared-lessons', placeholder: T('Lesson or tag (optional)', 'Lección o etiqueta (opcional)'), 'aria-label': T('Lesson', 'Lección') });
      const dl = h('datalist', { id: 'shared-lessons' });
      const addForm = h('form', { class: 'wform', hidden: true, onsubmit: async (ev) => {
        ev.preventDefault();
        const w = clean(toKana(wIn.value.trim()), 40), m = clean(mIn.value, 120);
        if (!w || !m) { toast(T('Add the word and its meaning.', 'Agrega la palabra y su significado.')); return; }
        if (words.some((x) => x.w === w)) { toast(T('“' + w + '” is already in the shared list.', '“' + w + '” ya está en la lista compartida.')); return; }
        try {
          await be.add(room, { w, m, lesson: clean(lIn.value, 40), by: clean(st.name, 30), added: Date.now() });
          wIn.value = ''; mIn.value = ''; prev.textContent = ''; wIn.focus(); toast(T('Shared.', 'Compartida.'));
        } catch (e) { fail(e); }
      } },
        h('div', { class: 'wf-inputs' }, wIn, mIn, lIn), dl, h('div', { class: 'row actions' }, prev, h('button', { class: 'btn primary', type: 'submit' }, T('Add to shared list', 'Agregar a la lista compartida'))));
      view.appendChild(h('section', null, h('h2', null, T('Add a word', 'Agregar una palabra')), addForm,
        h('p', { class: 'muted', id: 'shared-need-room' }, T('Open a room first.', 'Primero abre una sala.'))));
      view.appendChild(h('section', null, h('h2', null, T('Shared list', 'Lista compartida')), bulk, listBox));

      function fail(e) {
        const msg = e && /permission/i.test(e.code || e.message || '') ? T('The database refused the change. Check the Firestore rules.', 'La base de datos rechazó el cambio. Revisa las reglas de Firestore.') : T('Could not reach the shared list. Check your connection.', 'No se pudo conectar con la lista compartida. Revisa tu conexión.');
        status.textContent = msg; status.className = 'note bad'; toast(msg);
      }

      async function join() {
        cleanup();
        room = await roomId(st.code);
        clear(roomLine).append(T('In room ', 'En la sala '), h('strong', null, st.code), ' ',
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { cleanup(); st.code = ''; save(); room = null; words = []; codeIn.value = ''; joinBox.hidden = false; roomLine.hidden = true; addForm.hidden = true; U.$('#shared-need-room').hidden = false; status.textContent = ''; draw(); } }, T('Leave', 'Salir')));
        joinBox.hidden = true; roomLine.hidden = false; addForm.hidden = false; U.$('#shared-need-room').hidden = true;
        status.className = 'muted'; status.textContent = T('Connecting…', 'Conectando…');
        unsub = be.watch(room, (list) => {
          words = list.sort((a, b) => (b.added || 0) - (a.added || 0));
          status.className = 'muted'; status.textContent = T('Live: changes from your partner appear here automatically.', 'En vivo: los cambios de tu compañero aparecen aquí automáticamente.');
          draw();
        }, fail);
      }

      function draw() {
        clear(listBox); clear(bulk); clear(dl);
        Array.from(new Set(words.map((w) => w.lesson).filter(Boolean))).forEach((l) => dl.appendChild(h('option', { value: l })));
        if (!room) return;
        const mine = new Set(D().words.map((x) => x.w));
        const notMine = words.filter((x) => !mine.has(x.w));
        const shared = new Set(words.map((x) => x.w));
        const notShared = D().words.filter((x) => !shared.has(x.w));
        bulk.append(
          h('button', { class: 'btn', type: 'button', disabled: !notMine.length, onclick: () => { let n = 0; notMine.forEach((x) => { if (addLocal(x)) n++; }); save(); toast(T(n + ' words added to your Words.', n + ' palabras agregadas a tus Palabras.')); draw(); } },
            T('Copy all to my words (' + notMine.length + ')', 'Copiar todas a mis palabras (' + notMine.length + ')')),
          h('button', { class: 'btn ghost', type: 'button', disabled: !notShared.length, onclick: async () => {
            try { for (const x of notShared) await be.add(room, { w: clean(x.w, 40), m: clean(x.m, 120), lesson: clean(x.lesson, 40), by: clean(st.name, 30), added: Date.now() }); toast(T(notShared.length + ' words shared.', notShared.length + ' palabras compartidas.')); } catch (e) { fail(e); }
          } }, T('Share my words (' + notShared.length + ')', 'Compartir mis palabras (' + notShared.length + ')')));
        if (!words.length) { listBox.appendChild(h('p', { class: 'muted' }, T('No shared words yet. Add the first one above.', 'Aún no hay palabras compartidas. Agrega la primera arriba.'))); return; }
        listBox.appendChild(h('ul', { class: 'wlist' }, words.map((x) => h('li', null,
          speakBtn(x.w), h('span', { class: 'w-ja', lang: 'ja' }, x.w),
          h('span', { class: 'w-m' }, x.m, x.by ? h('small', null, T('Added by ', 'Agregada por ') + x.by) : null),
          h('span', { class: 'w-tags' }, x.lesson ? h('span', { class: 'tag' }, x.lesson) : null),
          h('span', { class: 'w-act' },
            mine.has(x.w) ? h('span', { class: 'badge' }, T('In my words', 'En mis palabras'))
              : h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { addLocal(x); save(); toast(T('Added to your Words.', 'Agregada a tus Palabras.')); draw(); } }, T('+ My words', '+ Mis palabras')),
            h('button', { class: 'btn ghost sm', type: 'button', 'aria-label': T('Delete ', 'Borrar ') + x.w, onclick: () => U.confirmDlg(T('Delete for everyone?', '¿Borrar para todos?'), x.w + ' — ' + x.m, T('Delete', 'Borrar'), () => be.remove(room, x.id).catch(fail)) }, icon('trash')))))));
      }

      if (st.code) join(); else draw();
    }
  }

  MS.shared = { page, cleanup };
})();
