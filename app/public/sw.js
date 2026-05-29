const CACHE = 'cwim-v2'
const STATIC_EXT = /\.(js|css|svg|png|jpg|woff2?)$/

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      ),
      self.clients.claim(),
    ])
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  // Navigation — always network
  if (request.mode === 'navigate') {
    return
  }
  // Static assets — cache-first
  if (STATIC_EXT.test(request.url)) {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(request).then((r) => r || fetch(request).then((res) => { c.put(request, res.clone()); return res }))
      )
    )
  }
})
