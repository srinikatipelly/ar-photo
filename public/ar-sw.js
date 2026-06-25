// AR Service Worker — caches CDN scripts, .mind target files, frame metadata,
// and transcoded videos so repeat scans are near-instant.

const CDN_CACHE    = 'ar-cdn-v1'
const ASSET_CACHE  = 'ar-assets-v1'
const FRAME_CACHE  = 'ar-frames-v1'
const VIDEO_CACHE  = 'ar-video-v1'

const CDN_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-three.prod.js',
]

// Pre-cache CDN scripts immediately on install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CDN_CACHE).then((cache) =>
      Promise.all(
        CDN_SCRIPTS.map((url) =>
          cache.match(url).then((hit) => {
            if (hit) return
            return fetch(url, { mode: 'cors' })
              .then((res) => { if (res.ok) cache.put(url, res) })
              .catch(() => {})
          })
        )
      )
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![CDN_CACHE, ASSET_CACHE, FRAME_CACHE, VIDEO_CACHE].includes(k))
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

  // ── .mind target files from R2: cache-first (content-stable) ────────────
  if (url.includes('.r2.dev') && (url.includes('.mind'))) {
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

  // ── Transcoded videos from R2: cache-first (content-stable) ─────────────
  // Transcoded MP4 key always contains "-transcoded.mp4"
  if (url.includes('.r2.dev') && url.includes('-transcoded.mp4')) {
    e.respondWith(
      caches.open(VIDEO_CACHE).then((cache) =>
        cache.match(e.request).then((cached) => {
          if (cached) return cached
          return fetch(e.request).then((res) => {
            // Only cache full 200 responses — not partial 206 range responses
            if (res.ok && res.status === 200) cache.put(e.request, res.clone())
            return res
          })
        })
      )
    )
    return
  }

  // ── Frame metadata (/api/frames/<id>): stale-while-revalidate ───────────
  // Serve cached copy instantly, refresh in background so next scan is fresh.
  if (url.includes('/api/frames/') && e.request.method === 'GET') {
    e.respondWith(
      caches.open(FRAME_CACHE).then((cache) =>
        cache.match(e.request).then((cached) => {
          const fetchAndCache = fetch(e.request).then((res) => {
            if (res.ok) cache.put(e.request, res.clone())
            return res
          })
          return cached ?? fetchAndCache
        })
      )
    )
    return
  }
})
