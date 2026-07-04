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

Bugs: ✅ all fixed (2026-07-02)
Bug #1: ✅ Order page now shows a visible red error banner for submission/validation
  failures and scrolls it into view — `app/landing/order/page.tsx`.
Bug #2: ✅ Submitting the order form now scrolls to top when moving to the
  loading/error screen — `app/landing/order/page.tsx` (`handleSubmit`).
Bug #3: ✅ Nav is now auth-aware — shows "My Account" instead of "Sign in" when a
  session exists — `components/site/Nav.tsx`.

Quick Fixes: ✅ done (2026-07-02)
1. ✅ Header logo enlarged (`h-14 sm:h-16` → `h-16 sm:h-20`) — `components/site/Nav.tsx`.

Few enhancements: 05/07/2026 — ✅ all applied (2026-07-05, dev-verified on localhost)

Implementation notes:
- Services are now data-driven from `lib/site-content.ts` (4 categories): Weddings,
  Special Events, Real Estate & Corporates, Custom. Cards/footer/sitemap auto-update.
- Order-type (physical frame vs Digital AR Only) flows via `?kind=digital` →
  checkout metadata.kind → webhook → confirmation email + success page copy.
- Contact now has its own page at `/landing/contact` (nav + all B2B/bespoke CTAs repoint there).

1. ✅ "Birthdays, Kids & Events" → "Special Events" — `lib/site-content.ts`, `ServiceCard.tsx`.

2. ✅ Slug `birthdays` → `special-events`; added "Occasions we cover" chip grid (full
   event list below) with luxury general-terms intro + a 9:16 vertical Mother's Day demo
   video (`/videos/Mothers Day Mobile Video.mp4`) — `[slug]/page.tsx`, `site-content.ts`.
Christmas
Mother's Day
Father's Day
Weddings
Milestone birthdays (18th, 21st, 30th, 40th, 50th, 60th)
Kids' birthdays
Anniversaries
New baby / christening / naming day
Valentine's Day
Graduations
Memorial / in-memoriam keepsakes
Grandparents Day
Retirement
ANZAC Day
Easter
Australia Day
New Year
Engagements / proposals
Baby showers / gender reveals
Housewarming / new home
Make a place holder for 9:16 vertical add the hero video mothers day as demo <video controls src="Mothers Day Mobile Video.mp4" title="Title"></video>

3. ✅ Merged Real Estate + Business → one "Real Estate & Corporates" page (slug
   `real-estate-corporates`). Lists flyers/brochures/business cards ideas, "we supply the
   digital QR — print it your way", + "Contact us & talk to us" CTA. Hero video set to
   `/videos/RealEstate_websiteAssets.mp4` (also covers item 11) — `site-content.ts`.

4. ✅ Added "Custom" category (replaces Business slot). Bespoke "any event, any frame for
   your special moments" copy + contact-us CTA — `site-content.ts`, `ServiceCard.tsx`.

5. ✅ Success page: physical-frame order no longer says "QR emailed" — states the QR comes
   printed on the frame; confirmation email unchanged (already QR-free) — `order/success/page.tsx`.

6. ✅ Audited: all delivery timelines say "2–3 business days" (order page, pricing FAQ,
   checkout, confirmation email, success page). Digital orders say "QR by email".
7. ✅ Contact now a dedicated page `/landing/contact`; nav "Contact" + all B2B/bespoke CTAs
   point there instead of the footer `#contact` anchor — `site-content.ts`, `landing/contact/page.tsx`.
8. ✅ Digital AR Only flow (`?kind=digital`): success page shows "no physical frame will be
   sent — you'll receive your photo with attached QR to print & frame yourself". Detected
   via Stripe session metadata.kind — `order/success/page.tsx`, `checkout/route.ts`, `resend.ts`.

9.The https://www.thegoldenframe.com.au/landing/order should have following details <modify workdings as per market requirements and other luxury websites>
===
AR Personalized Frames
Your photo. Your video. Alive on the wall.
Scan the QR code on your frame and watch your still photo transform into a moving video memory — relived, every single time.

How it works

1
Choose your frame

Pick the occasion — baby, couple, family, or celebration.

2
Send us your photo + video

We embed your video memory behind the QR code.

3
Scan & relive it

Point your phone at the QR — your memory plays instantly.
make this page more user friendly and more attractive 
Show errors on the page more visibly and make sure the user can see the errors and correct them before submitting the form.use contrast colors so the user can see the errors and correct them before submitting the form. Use contrast colors so the user can easily identify the errors and take necessary actions to fix them.
===
9. ✅ Order page restyled: "AR Personalised Frames / Your photo. Your video. Alive on the
   wall." hero + 3-step "How it works" cards. Errors now show a high-contrast (border-2
   red-500, red-500/20 bg) summary panel that lists each invalid field by name and scrolls
   into view — `landing/order/page.tsx`.
10. ✅ My Orders: removed "View AR" button. QR is now the primary action ("View QR code")
    with a "Download QR" secondary + a helper line explaining scanning the frame needs no
    app. Shows "QR code preparing…" while pending — `components/account/OrderCard.tsx`.
11. ✅ Real Estate hero video set to `/videos/RealEstate_websiteAssets.mp4` (folded into the
    merged Real Estate & Corporates page, item 3) — `site-content.ts`.
Bugs: ✅ fixed (2026-07-05) — Digital AR Only (AR-only) order messaging
1. ✅ Customer confirmation email (digital branch) now states no physical frame is sent, that
   we email the photo with the QR code attached **within 1–2 business days**, and includes
   print-and-frame instructions ("keep the QR visible so it can be scanned") — `lib/resend.ts`.
2. ✅ Success page (digital) mirrors the same: intro + timeline now say the photo + attached QR
   arrive **within 1–2 business days**, ready to print & frame yourself — `app/order/success/page.tsx`.
   Also aligned the digital order page copy/badge (Digital delivery note + "Photo + QR emailed
   in 1–2 business days") — `app/landing/order/page.tsx`.


