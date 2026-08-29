const CACHE = 'archive-audit-v3'
const SHELL = [
  '/', '/index.html', '/demo', '/privacy/', '/terms/', '/offline.html',
  '/manifest.webmanifest', '/hero-notebook.webp', '/social-card.webp', '/legal.css', '/route-focus.js', '/theme.js',
  '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png',
]

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await cache.addAll(SHELL)
    const response = await fetch('/index.html', { cache: 'reload' })
    const html = await response.text()
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1])
    await cache.addAll([...new Set(builtAssets)])
  })())
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter(name => name.startsWith('archive-audit-') && name !== CACHE).map(name => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', event => {
  if (event.data === 'skip-waiting') self.skipWaiting()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request)
        const cache = await caches.open(CACHE)
        cache.put(event.request, response.clone())
        return response
      } catch {
        return (await caches.match(event.request)) || (await caches.match('/index.html')) || (await caches.match('/offline.html'))
      }
    })())
    return
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request)
    if (cached) return cached
    try {
      const response = await fetch(event.request)
      if (response.ok) {
        const cache = await caches.open(CACHE)
        cache.put(event.request, response.clone())
      }
      return response
    } catch {
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
    }
  })())
})
