const CACHE_NAME = 'workout-tracker-v1'

self.addEventListener('install', (event) => {
  const scopeUrl = new URL(self.registration.scope)
  const appShell = [scopeUrl.pathname, `${scopeUrl.pathname}manifest.webmanifest`, `${scopeUrl.pathname}icon.svg`]
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(appShell)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
})

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url)

  if (event.request.method !== 'GET') return
  if (!['http:', 'https:'].includes(requestUrl.protocol)) return
  if (requestUrl.origin !== self.location.origin) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (!response.ok || response.type === 'opaque') {
          return response
        }

        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
        return response
      })
    }),
  )
})
