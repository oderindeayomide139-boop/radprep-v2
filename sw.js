// RadPrep Service Worker v4 — network-first for HTML
const CACHE_NAME = 'radprep-v4';
const ASSETS = ['./', './index.html', './style.css', './script.js', './manifest.json'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // For HTML navigation, ALWAYS try network first so updates appear
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
        return;
    }
    // For other assets, cache-first is fine
    e.respondWith(caches.match(e.request).then((c) => c || fetch(e.request)));
});