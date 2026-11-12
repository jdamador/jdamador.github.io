/* images.js: pictures for words.
   - search(q): free pictures from Wikimedia Commons (no key needed). Returns thumbnail URLs.
   - fromFile(file): your own picture, shrunk to a small JPEG so it can be shared through the study room.
   - picker(): the little "Picture" control used on the Words page. */
(function () {
  const MS = (window.MS = window.MS || {});
  const U = MS.ui;
  const { h, T, clear, toast } = U;
  const API = 'https://commons.wikimedia.org/w/api.php';
  const SIZE = 240;

  /* "cat (animal)" → "cat"; "1 (one)" → "one"; keeps the search simple. */
  function query(meaning) {
    const m = String(meaning || '').trim();
    const inner = m.match(/^\s*\d+\s*\(([^)]+)\)/);
    if (inner) return inner[1];
    return m.replace(/\([^)]*\)/g, '').split(/[\/,;]/)[0].trim();
  }

  async function search(q, limit) {
    q = query(q);
    if (!q) return [];
    const url = API + '?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=' + (limit || 12) +
      '&gsrsearch=' + encodeURIComponent('filetype:bitmap ' + q) + '&prop=imageinfo&iiprop=url&iiurlwidth=' + SIZE;
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const pages = Object.values((data.query && data.query.pages) || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    return pages.map((p) => p.imageinfo && p.imageinfo[0] && p.imageinfo[0].thumburl).filter(Boolean);
  }

  function fromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('not an image')); return; }
      const r = new FileReader();
      r.onerror = () => reject(r.error);
      r.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('could not read the image'));
        img.onload = () => {
          const s = Math.min(1, SIZE / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
          const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.8));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  /* opts: { getQuery: () => string, onChange(url) } → { el, set(url), get() } */
  function picker(opts) {
    let value = '';
    const thumb = h('span', { class: 'pic-thumb' });
    const results = h('div', { class: 'pic-results', hidden: true });
    const file = h('input', { type: 'file', accept: 'image/*', class: 'sr-only', onchange: async (e) => {
      const f = e.target.files[0]; e.target.value = '';
      if (!f) return;
      try { set(await fromFile(f)); results.hidden = true; } catch (err) { toast(T('Could not use that file. Try a JPG or PNG.', 'No se pudo usar ese archivo. Prueba un JPG o PNG.')); }
    } });
    const findBtn = h('button', { class: 'btn ghost sm', type: 'button', onclick: find }, T('Find picture', 'Buscar imagen'));
    const upBtn = h('button', { class: 'btn ghost sm', type: 'button', onclick: () => file.click() }, T('Upload', 'Subir'));
    const rmBtn = h('button', { class: 'btn ghost sm', type: 'button', hidden: true, onclick: () => set('') }, T('Remove', 'Quitar'));
    function draw() {
      clear(thumb);
      if (value) thumb.appendChild(h('img', { src: value, alt: '' })); else thumb.appendChild(h('span', { class: 'muted' }, T('No picture', 'Sin imagen')));
      rmBtn.hidden = !value;
    }
    function set(v, quiet) { value = v || ''; draw(); if (!quiet && opts.onChange) opts.onChange(value); }
    async function find() {
      const q = opts.getQuery();
      if (!query(q)) { toast(T('Type the meaning first: it is used to search.', 'Primero escribe el significado: se usa para buscar.')); return; }
      clear(results); results.hidden = false;
      results.appendChild(h('p', { class: 'muted' }, T('Searching…', 'Buscando…')));
      try {
        const urls = await search(q, 12);
        clear(results);
        if (!urls.length) { results.appendChild(h('p', { class: 'muted' }, T('No pictures found. Try another meaning or upload one.', 'No se encontraron imágenes. Prueba otro significado o sube una.'))); return; }
        urls.forEach((u) => results.appendChild(h('button', { class: 'pic-opt', type: 'button', 'aria-label': T('Use this picture', 'Usar esta imagen'), onclick: () => { set(u); results.hidden = true; } }, h('img', { src: u, alt: '', loading: 'lazy' }))));
        results.appendChild(h('p', { class: 'muted small' }, T('Pictures from Wikimedia Commons.', 'Imágenes de Wikimedia Commons.')));
      } catch (e) {
        clear(results).appendChild(h('p', { class: 'note bad' }, T('Could not search for pictures. Check your connection.', 'No se pudo buscar imágenes. Revisa tu conexión.')));
      }
    }
    draw();
    const el = h('div', { class: 'pic' }, h('div', { class: 'row wrap' }, thumb, findBtn, upBtn, rmBtn, file), results);
    return { el, set: (v) => set(v, true), get: () => value, close: () => { results.hidden = true; } };
  }

  MS.images = { search, fromFile, picker, query };
})();
