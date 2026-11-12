/* Service worker de Control del Conductor.
   - La app (index.html, manifest, íconos): primero internet, si no hay, la copia guardada.
   - El motor (Python en el navegador, Streamlit, fuentes): se guarda la primera vez y luego se usa la copia,
     así la app abre rápido y funciona sin señal después de la primera carga. */
const VERSION = "conductor-v1";
const APP = ["./", "./index.html", "./manifest.webmanifest", "./icono-192.png",
             "./icono-512.png", "./apple-touch-icon.png", "./favicon-32.png"];
const MOTOR = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (MOTOR.includes(url.hostname)) {
    // Primero la copia guardada (los archivos del motor tienen versión fija y no cambian)
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const guardado = await c.match(req);
      if (guardado) return guardado;
      const resp = await fetch(req);
      if (resp.ok || resp.type === "opaque") c.put(req, resp.clone());
      return resp;
    }));
  } else if (url.origin === self.location.origin) {
    // Primero internet, para recibir las actualizaciones de la app
    e.respondWith(fetch(req).then((resp) => {
      if (resp.ok) caches.open(VERSION).then((c) => c.put(req, resp.clone()));
      return resp;
    }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html"))));
  }
});
