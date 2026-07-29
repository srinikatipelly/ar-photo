# Phase 3 — Global launch plan (Paddle MoR + country localization)

Status: **Workstream A (localization) scaffolded 2026-07-27** — see "Progress" below.
Workstream B (Paddle) not started. Decisions behind this plan live in the memory note
"Global expansion direction".

## Progress (2026-07-27)

**Two plan assumptions resolved this session:**
- **Hosting = Vercel** (`@vercel/analytics` + the recent analytics commit). So geo comes
  from Vercel. `request.geo` was removed in Next 15+, so we read country via
  `geolocation()` from **`@vercel/functions`** (added as a dependency).
- **Next 16 renamed `middleware` → `proxy`.** There is no `middleware.ts`; the region
  logic lives in the **existing `proxy.ts`** (which already did apex `/`→`/landing`
  routing for `.com.au`). Both jobs now share that one file (Node.js runtime).

**Workstream A implemented (A1–A4):**
- `lib/regions.ts` — region config source of truth: `REGIONS` (au/in/us) with currency,
  locale, contact, per-tier price strings, + `getBrand(region)` / `getPricing(region)` /
  `countryToRegion()` / `isRegion()`. Framework-agnostic (safe for client + server).
- `lib/region-server.ts` — `getRegion()` reads `x-region` header (this request) → `region`
  cookie → default `au`. Server-only.
- `proxy.ts` — resolves region (cookie override wins over geo), sets `x-region` header +
  `region` cookie; matcher widened to `['/', '/landing/:path*']`.
- `components/site/CountrySwitcher.tsx` — new; writes the cookie + reloads. In Nav (desktop
  + mobile).
- Region-aware: `WhatsAppButton` (auto-resolves region), `Footer`, `Nav`, and pages
  `app/landing/{layout,page,pricing/page,contact/page}.tsx`. Phone line/card auto-hides for
  WhatsApp-only regions. Landing routes are now dynamic (`ƒ`) — expected tradeoff.
- `lib/site-content.ts` — added stable `key` (`frame`/`digital`/`realEstate`) to each tier.

**Confirmed 2026-07-27:**
- Live markets = **Australia + India only.** `ACTIVE_REGIONS = ['au', 'in']` in
  `lib/regions.ts` — the US region is fully scaffolded but OFF: hidden from the country
  switcher, US geo falls back to `au`, and a stale `region=us` cookie is ignored. **Add
  `'us'` to `ACTIVE_REGIONS` to switch the US on everywhere in one line** once decided.
- India WhatsApp = **917259453806** (+91 7259453806).
- India = **digital-only at ₹499** — `TIER_VISIBILITY.in = ['digital']` hides the physical
  frame + real-estate tiers for India. Pricing grids adapt to the tier count.

**⚠️ Deferred until US is switched on** (grep `TODO(region)` in `lib/regions.ts`):
- US prices (placeholder $29 / $15), US lineup (`TIER_VISIBILITY.us`), and US contact
  channel. None of these render while US is inactive.

**Not yet done from Workstream A:** A5 (hreflang/domains) — still low priority; layout
metadata `locale` is still hardcoded `en_AU`.

## Goal

Take The Golden Frame global as a **digital-first product**, starting with **Australia +
India + USA**, from **one global site localized by country**. Payments move from Stripe (AUD,
card-only) to **Paddle as a single Merchant of Record** for all markets ("Option B") so Paddle
collects/remits every country's sales tax (AU GST, India GST/OIDAR, US multi-state) and we never
register for tax abroad.

Two independent workstreams — they can be built and shipped separately:

- **Workstream A — Localization layer** (region → currency display, contact/WhatsApp, language).
  No dependency on Paddle; safe to build first.
- **Workstream B — Paddle migration** (replace Stripe checkout + webhook). Needs a Paddle account.

---

## Assumption to confirm before starting

- **Own site is the storefront for all markets** (not a reseller fronting India). The whole
  localization workstream assumes end customers hit our site. If a reseller fronts India instead,
  Workstream A shrinks to "AU + US only" and India becomes a separate white-label track.
- **Hosting / geo source is unknown and blocks Workstream A step 1** — how we detect a visitor's
  country depends on the host (Vercel gives `request.geo.country`; Cloudflare gives the
  `cf-ipcountry` header; a bare Node host needs a geo-IP lookup). Confirm where this deploys.

---

## Workstream A — Localization layer

Introduce a `region` concept: `au` | `in` | `us` (+ `au` as default fallback).

### A1. Region config (new: `lib/regions.ts`)
One source of truth per country:
```
region: 'au' | 'in' | 'us'
currency: 'AUD' | 'INR' | 'USD'
locale:   'en-AU' | 'en-IN' | 'en-US'
phone?:        e.g. '0427 649 892'  (AU only for now)
whatsapp:      wa.me link — AU: 61427649892, IN: <India WhatsApp number, 91XXXXXXXXXX>
email:         hello@thegoldenframe.com(.au)
priceDisplay:  per-tier display strings, e.g. AR Frame → '$39' / '₹1,999' / '$29'
paddlePriceIds: { frame, digital, delivery? } → Paddle price IDs per currency (Workstream B)
policyLinks / address / hours as needed
```
The **India WhatsApp number the user already has** goes in the `in` block. India can be
WhatsApp-only (no phone line needed — WhatsApp is the preferred B2B channel in India).

### A2. Detection + override (new: `middleware.ts`)
- Read the visitor's country from the host's geo signal (see hosting caveat above) → map to a
  region → set a `region` cookie + a request header the pages read.
- **Manual override:** a country switcher writes the `region` cookie and wins over geo.
- Default to `au` when unknown.

### A3. Make content region-aware (edit: `lib/site-content.ts`)
- Today `brand.phone` / `brand.whatsapp` / `brand.email` / `brand.siteUrl` are single AU values
  (lines ~11–19), and `pricingTiers[].price` are hardcoded strings (lines ~227–272).
- Refactor to resolve these **from the active region** — e.g. a `getBrand(region)` /
  `getPricing(region)` helper, or thread `region` into the components below.

### A4. Consume region in the UI
Swap hardcoded `brand.*` reads for region-aware values in:
- `components/site/Nav.tsx`, `components/site/Footer.tsx` (phone/WhatsApp/social)
- `app/landing/contact/*` and the contact CTA buttons
- `app/landing/pricing/*` (per-region price display strings)
- Add a small **country switcher** component in the nav/footer.

### A5. SEO / domains (follow-up, low priority)
- One global site: add `hreflang` tags per region and a canonical.
- Keep `.com.au`; register `.com` (+ `.in` defensively). Domain routing can come later — the
  cookie/geo approach works on a single domain today.

---

## Workstream B — Paddle migration (replaces Stripe)

### B0. Account setup (user, no code)
- Create Paddle account; complete **AU seller verification** + payout bank.
- **Confirm India UPI / UPI Autopay is enabled** on the account (was early-access).
- Complete tax details incl. **W-8BEN-E** (US treaty status).
- Create **Products + Prices** in Paddle: `frame`, `digital` (and `delivery` if still charged),
  each with explicit **AUD / INR / USD** prices (set deliberate local prices, not FX conversion).
  Record the Paddle **price IDs** into `lib/regions.ts` (A1).

### B1. Paddle client (new: `lib/paddle.ts`)
- Server: Paddle Node SDK configured with `PADDLE_API_KEY` + `PADDLE_ENV` (sandbox|production).
- Client: Paddle.js initialized with `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`.

### B2. Replace checkout (rewrite: `app/api/checkout/route.ts` + order page)
Current route builds a Stripe Checkout Session with AUD line items and `metadata`
(photoKey/videoKey/targetKey/customer/kind). Replace with Paddle:
- Resolve the buyer's **region → Paddle price IDs** (from A1).
- Create a **Paddle transaction** (server) carrying the same fields as `custom_data`
  (photoKey, videoKey, targetKey, customerEmail, customerName, mobile, addresses, kind), then
  open it via **Paddle.js overlay** on `app/landing/order/page.tsx`; or open Paddle.js directly
  with price IDs + `customData`. (R2 keys aren't secret, so client customData is acceptable — but
  server-created transaction keeps control.)
- Drop `payment_method_types: ['card']` and the hardcoded `'aud'` — Paddle picks methods
  (incl. UPI) and currency by buyer region automatically.

### B3. Replace webhook (new: `app/api/webhooks/paddle/route.ts`, remove Stripe one)
Mirror the existing fulfilment in `app/api/webhooks/stripe/route.ts`:
- Verify the **`Paddle-Signature`** header (HMAC) with `PADDLE_WEBHOOK_SECRET`.
- Handle **`transaction.completed`** (and/or `transaction.paid`): pull `custom_data`, then run the
  identical flow — generate QR (`lib/qr`), upload to R2, insert into Supabase `frames`, send
  customer + admin emails (`lib/resend`).
- Idempotency: today keyed on `stripe_session_id`; switch to **`paddle_transaction_id`**.
- `price_paid`: from the Paddle transaction totals instead of `session.amount_total`.

### B4. Database (Supabase `frames` table)
- Add column **`paddle_transaction_id`** (keep `stripe_session_id` nullable for history).
- Update the idempotency lookup + insert in the new webhook accordingly.

### B5. Success page (edit: `app/order/success/page.tsx`)
- Today it reads Stripe's `session_id`. Paddle's redirect params differ — adapt to Paddle's
  `successUrl` params, or make the page a generic "thank you" that relies on the webhook +
  confirmation email (simpler, recommended).

### B6. Env vars
Add: `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `PADDLE_ENV`.
Retire (after cutover): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the `*_PRICE_CENTS`
env prices (prices now live in Paddle + `lib/regions.ts`). Keep Stripe code in git history for
rollback; this is a clean cut to Paddle, not a dual-run.

---

## Suggested build order

1. **B0** — Paddle account + sandbox + products/prices (user; unblocks everything).
2. **A1–A4** — localization layer (independent, low-risk, immediately visible: INR/AUD/USD
   display + India WhatsApp). Ship this first.
3. **B1–B6** — Paddle checkout + webhook + DB migration, tested in **sandbox** (run a test
   transaction per region: AU card, India UPI, US card; verify GST-inclusive display and
   fulfilment).
4. **A5** — hreflang/domains polish.
5. Flip Paddle to **production**, retire Stripe env.

## Open questions to resolve tomorrow

- Where does this deploy? (decides the geo-detection mechanism in A2)
- US contact channel — AU phone + India WhatsApp are set; what does the US region show
  (WhatsApp / email / a US number)?
- Marketing price display: static per-region strings in config (simplest, recommended) vs live
  Paddle price-preview on the pages?
- Is `delivery` still a line item at all now that the core product is digital (no shipping)?
```
