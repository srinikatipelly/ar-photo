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


More improvement: 05/07/2026:

1. ✅ Fixed: Weddings ("Create your wedding frame") & Special Events ("Create your event
   frame") service CTAs (`ctaHref`) pointed to the legacy `/upload` page (unbranded, no
   Stripe). Both now route to the premium `/landing/order` flow (brand fonts/colours +
   Stripe checkout) — `lib/site-content.ts`.
More improvement: 06/07/2026 — ✅ all applied (2026-07-06, build-verified)
2. ✅ Demo page "Ready to create your own?" CTA now routes to `/landing/services`
   (was `/landing/order`) — `app/landing/demo/page.tsx`.
3. ✅ Weddings & Special Events service-page CTAs now route to `/landing/pricing`
   (was `/landing/order`) — `lib/site-content.ts` (`ctaHref` for both services).
4. ✅ Browser tab icon is now the golden-frame logo on every page: regenerated
   `app/favicon.ico` (16/32/48 px) from `app/icon.png`, replacing the default Next.js
   triangle. Head now references `/favicon.ico` + `/icon.png` site-wide (root layout).
5. ✅ Replaced 136 em/en dashes ("—" "–") with a normal "-" across all user-facing copy
   — landing pages, shared UI (`components/site`, `components/account`), `lib/site-content.ts`,
   customer emails (`lib/resend.ts`) and the Stripe checkout descriptions. Box-drawing
   section dividers ("──") left intact.
6. ✅ Contact page: removed the duplicated "Prefer to message us right now?" WhatsApp+Email
   panel (already covered by the channel cards) and replaced it with a proper enquiry form
   (name / email / phone / message + high-contrast validation) that emails the business via
   Resend, reply-to the customer — `components/site/ContactForm.tsx`, `app/api/contact/route.ts`,
   `lib/resend.ts` (`sendContactEnquiry`), `app/landing/contact/page.tsx`.


Enhancements: 16/07/2026 — ✅ all applied (2026-07-17, dev-verified on localhost)
Demo page reworked to be more engaging and instructional — `app/landing/demo/page.tsx`.
1. ✅ Hero now leads with the action ("Open your camera. Watch it come alive.") + numbered
   instruction chips (1 Open camera · 2 Scan QR · 3 Point at photo) above the composite still.
2. ✅ Added a standalone wedding-frame-with-QR image as the live AR target —
   `public/weddingFrame1.png` (`demoFrame` export in `lib/site-content.ts`).
3. ✅ "Try it yourself" is now a stacked live sample: Step 01 Scan (QR with a pulsing gold glow)
   on top, then Step 02 Point below it showing the frame large at its native 2:3, with a tip
   noting the printed frame does both in one scan.

Bug: ✅ fixed (2026-07-17) — AR video stopped playing on "Back to camera"
`closePlayer()` detached the <video> from the document and then called play() synchronously.
The browser pauses a media element that leaves the document, and does it *asynchronously*, so
that play() was undone a moment later and playback stopped. The video is created detached and
used straight as a WebGL texture, so opening the player was the first time it ever entered the
document — which is why only the return trip broke. Fixed by adding an off-screen `#video-dock`
that keeps the video in the document: `closePlayer()` now moves it back there instead of
detaching, so the spec's pause step sees it is still in a document and returns without pausing.
The dock is deliberately not display:none — that can stop frame decoding and freeze the texture.
Reproduced and verified in Chromium via Playwright (headless DOM/playback only — the real camera,
MindAR tracking and iOS Safari still want a check on a real phone) — `public/ar-viewer.html`.

Still open (not blocking):
- `public/weddingFrame1.png` (3.6 MB) is heavy for a page that is opened on phones, often on
  mobile data. WebP at the rendered size would be ~150-250 KB.

Original request (for reference):
I feel the Demo page is not very attractive and user friendly. We need to make it more attractive and user friendly. 
The demo page should be more interactive and engaging for the users.
1. first hero image should tell the users to open your camera and scan the QR code to see the demo. The hero image should be more interactive and engaging for the users.
2. second image should be only the photo of wedding photo with the QR code on the frame.
3. try yourself -> scan the QR and point the photo on 2nd image to see the demo. The users should be able to see the demo by scanning the QR code on the frame.


DONT implement the below yet:
   ==================================================   
   copied from similar website, we need to modify as per australian market and our business requirements:

   Shipping

Shipping Policy
Effective Date: March 8, 2026
At Luxe Magics (www.luxemagics.com), we're a small team working from Hyderabad, committed to getting your memories to you safely and on time. Here's exactly what to expect.

---

Shipping Methods and Delivery Times
Standard Products (Fridge Magnets, Magnetic Bookmarks, Stickers, Photo Prints)
Processing: 2-3 business days
Delivery: 5-7 business days

AR Frame (Require approval before printing)
Preview ready: Within 1-2 days of order
Approval needed before printing 
Processing: 1-2 business days after approval
Delivery: 5-7 business days
Delivery times are estimates and begin after order processing. Business days exclude weekends and holidays.

---

Order Processing
Orders are processed within 2-3 business days (Monday-Saturday)
Orders placed after 2:00 PM IST will be processed the next business day
Orders placed on Sundays or holidays will be processed on the next business day
AR frame orders require your approval of the preview before we proceed to printing
You will receive a confirmation email once your order ships, including tracking information

---

Shipping Costs
Free Shipping on all orders ₹499 and above
₹49 flat rate for orders under ₹499
No hidden charges. What you see at checkout is what you pay.
---

Shipping Locations
We currently ship to all locations within India, including:

All major cities (Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune, etc.)
Most towns and smaller cities
Remote locations (may take 3-5 additional days)
Areas we cannot service
Certain remote locations not covered by our shipping partners
International Shipping: Not available at this time. If you're outside India and interested in ordering, please contact us at hello@luxemagics.com
Please ensure your shipping address is complete and accurate to avoid delays.

---

Order Tracking
Once your order ships, you will receive:
Shipping confirmation email
Tracking number
Link to track your package in real-time
You can also track your order by logging into your account on www.luxemagics.com

Lost the tracking email?

Contact us via WhatsApp at +91 7207219977 
Email orders@luxemagics.com
---

Delivery Attempts
Our courier partner will attempt delivery 2-3 times to your address.

What happens if you miss all delivery attempts?
The courier will return the package to us
We will contact you to reschedule delivery
Re-delivery may incur additional charges (as per courier partner's policy)
Pro tip: Keep your phone handy on the expected delivery date. The courier will call before attempting delivery.

---

Delivery Issues
Lost or Stolen Packages
If your tracking shows the package was delivered but you haven't received it, please contact us within 48 hours at support@luxemagics.com or WhatsApp +91 7207219977. We will investigate with our shipping partner and arrange for a replacement or refund.

Damaged Packages
If your package arrives damaged, please:

Take a short video (10-15 seconds) showing the damage to both packaging and product
Contact us immediately at support@luxemagics.com
Do not discard the packaging until the issue is resolved
Report within 7 days of delivery
We will arrange for a replacement or full refund at no additional cost to you.

Incorrect Address
If you provide an incorrect shipping address, we cannot guarantee delivery or accept responsibility for lost packages. Please contact us immediately at hello@luxemagics.com if you realize an error, and we will attempt to intercept the shipment (additional fees may apply).

---

Shipping Restrictions
We cannot ship to:

P.O. boxes for certain products
International addresses (India only at this time)
Areas not serviced by our shipping partners
If you're unsure whether we deliver to your location, email us your pincode at hello@luxemagics.com and we'll confirm within a few hours.

---

Delays and Special Circumstances
Festival Seasons (Diwali, Holi, Eid, etc.)
During major festivals, courier partners experience higher volumes. Please add 2-3 additional days to the standard delivery time.

Weather and Natural Events
Heavy rains, floods, or strikes may cause delays beyond our control. We will keep you updated if such situations affect your order.

Customization Changes
If you request changes to your AR frame preview after initial submission, the processing timeline will restart from the date of final approval.

Peak Shopping Seasons
During holidays and peak seasons, processing and delivery times may be extended. We recommend placing orders early to ensure timely delivery. Any delays will be communicated via email.

---

Questions About Shipping?
If you have questions about shipping or need to modify your order, please contact us as soon as possible:

Email: hello@luxemagics.com or support@luxemagics.com
WhatsApp: +91 7207219977
Hours: Monday - Saturday, 10 AM - 6 PM IST
We're real people running a small business. We'll actually respond to you.

---

A Note From Us
We're a tiny team. Every order is packed with care by us (literally). If something goes wrong with shipping, we take it personally and we'll fix it.

Thanks for supporting our small business. Your order means the world to us.

— Shiva & Sankeerthana 
Luxe Magics
   ==================================================