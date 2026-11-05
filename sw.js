// TK_APP · para instalarla y abrirla sin internet. Primero la red (así cada cambio publicado llega de una vez) y, si no hay,
// lo último guardado. Los datos de usuarios nunca pasan por aquí: viven en el equipo.
const CACHE = 'tkapp-1.0';
const ARCHIVOS = ['./', 'index.html', 'estilos.css', 'catalogo.js', 'imagenes.js', 'formatos.js', 'equipo.js', 'app.js', 'manifest.webmanifest', 'icono-192.png', 'icono-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ARCHIVOS.map(a => c.add(a)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
