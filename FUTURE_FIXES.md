# Parked / future fixes

## (a) Self-host the AR viewer's CDN dependencies
**Status:** parked (not yet done).

**Why:** Same root cause as the upload/compile bug we fixed — `public/ar-viewer.html`
loads `mindar-image-three.prod.js` (which pulls the same ~2.16 MB `controller-*.js` chunk)
and `three.js` from **jsDelivr**. On a fresh device during a jsDelivr blip, a customer
**scanning a frame** could hit the same silent hang (no error, infinite loading).

**Fix when picked up:** self-host the viewer's deps the same way we did for the compiler:
- Download `three@0.132.2/build/three.module.js` (+ any `examples/jsm` addons actually used)
  and `mind-ar@1.2.2/dist/mindar-image-three.prod.js` into `public/vendor/`.
- Reuse the already-vendored `public/vendor/mind-ar/controller-495b585f.js` + `ui-85e81035.js`.
- Update the importmap + the `import` in `ar-viewer.html` to point at the local `/vendor/...`
  paths (keep the static importmap — no dynamic-injection, to preserve iOS Safari support).
- Verify on a real phone scan.

**Impact:** removes the last third-party-CDN dependency from the customer-facing scan flow.
