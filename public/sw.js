// Readler service worker: keeps the app shell available offline.
// Pages are network-first (fresh after each deploy), hashed assets cache-first.
// API calls (Supabase) go to another origin and are never cached.
const CACHE = 'readler-v1'
const SHELL = ['./', './manifest.webmanifest', './favicon.svg', './icons/icon-192.png', './icons/icon-512.png']
const MAX_ENTRIES = 80

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

const SHELL_URLS = new Set(SHELL.map((path) => new URL(path, self.location.href).href))

// Keeps the asset cache bounded (old hashed files pile up across deploys); the shell stays.
async function trim(cache) {
  const keys = (await cache.keys()).filter((request) => !SHELL_URLS.has(request.url))
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES)).map((key) => cache.delete(key)))
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    const shell = new URL('./', self.registration.scope).href
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(shell, copy))
          }
          return response
        })
        .catch(async () => (await caches.match(shell)) ?? Response.error()),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone()
            caches.open(CACHE).then(async (cache) => {
              await cache.put(request, copy)
              await trim(cache)
            })
          }
          return response
        }),
    ),
  )
})
