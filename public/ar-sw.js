// AR Service Worker — caches CDN scripts and .mind target files so repeat
// scans are near-instant (skips re-downloading ~2.5 MB of JS and the target).

const CDN_CACHE   = 'ar-cdn-v1'
const ASSET_CACHE = 'ar-assets-v1'

const CDN_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-three.prod.js',
]

// Pre-cache CDN scripts immediately on install so they're ready before
// the first AR viewer even opens.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CDN_CACHE).then((cache) =>
      Promise.all(
        CDN_SCRIPTS.map((url) =>
          cache.match(url).then((hit) => {
            if (hit) return // already cached
            return fetch(url, { mode: 'cors' })
              .then((res) => { if (res.ok) cache.put(url, res) })
              .catch(() => {}) // don't fail install if CDN is unreachable
          })
        )
      )
    )
  )
  // Take effect immediately without waiting for existing tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  // Delete caches from older SW versions
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CDN_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { url } = e.request

  // ── CDN scripts (Three.js, MindAR): cache-first ─────────────────────────
  if (url.includes('cdn.jsdelivr.net')) {
    e.respondWith(
      caches.open(CDN_CACHE).then((cache) =>
        cache.match(e.request).then((cached) => {
          if (cached) return cached
          return fetch(e.request).then((res) => {
            if (res.ok) cache.put(e.request, res.clone())
            return res
          })
        })
      )
    )
    return
  }

  // ── .mind target files from R2: cache-first by URL ───────────────────────
  // Each frame's target URL is content-stable (same frameId → same file),
  // so it's safe to serve from cache indefinitely.
  if (url.includes('.r2.dev') && (url.endsWith('.mind') || url.includes('.mind?'))) {
    e.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(e.request).then((cached) => {
          if (cached) return cached
          return fetch(e.request).then((res) => {
            if (res.ok) cache.put(e.request, res.clone())
            return res
          })
        })
      )
    )
    return
  }
})
