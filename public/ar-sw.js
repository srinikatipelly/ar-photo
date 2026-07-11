// AR Service Worker — caches the (self-hosted) AR engine, .mind target files,
// frame metadata, and transcoded videos so repeat scans are near-instant.

// Bumped to v2 when the AR engine moved from the jsDelivr CDN to self-hosted
// /vendor files. The renamed cache also purges the old 'ar-cdn-v1' entry.
const LIB_CACHE    = 'ar-lib-v2'
const ASSET_CACHE  = 'ar-assets-v1'
const FRAME_CACHE  = 'ar-frames-v1'
const VIDEO_CACHE  = 'ar-video-v1'

// Self-hosted AR engine (three@0.132.2 + mind-ar@1.2.2). Same-origin, so this
// also makes the viewer work fully offline after the first successful load.
const LIB_SCRIPTS = [
  '/vendor/three/three.module.js',
  '/vendor/three/addons/renderers/CSS3DRenderer.js',
  '/vendor/mind-ar/mindar-image-three.prod.js',
  '/vendor/mind-ar/controller-495b585f.js',
  '/vendor/mind-ar/ui-85e81035.js',
]

// Pre-cache the engine immediately on install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(LIB_CACHE).then((cache) =>
      Promise.all(
        LIB_SCRIPTS.map((url) =>
          cache.match(url).then((hit) => {
            if (hit) return
            return fetch(url)
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
          .filter((k) => ![LIB_CACHE, ASSET_CACHE, FRAME_CACHE, VIDEO_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { url } = e.request

  // ── AR engine (self-hosted Three.js + MindAR): cache-first ──────────────
  if (url.includes('/vendor/')) {
    e.respondWith(
      caches.open(LIB_CACHE).then((cache) =>
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
