# Phase 2 — The Golden Frame: Premium Marketing Site

> Status: **In progress** · Scope: marketing site only (this build)
> New domain: `thegoldenframe.com.au/landing` · MVP `thegoldenframe.co` stays untouched

## Context

The Golden Frame currently runs as a single Next.js app on `thegoldenframe.co`: one
light/amber landing page (`app/page.tsx`), a manual-payment upload flow
(`app/upload/page.tsx`), and an AR viewer (`public/ar-viewer.html`). The business bought a
new domain `thegoldenframe.com.au` and wants a **premium, luxury-feel marketing site**
(reference: luxemagics.com) that reflects the real brand — **deep green `#0F3535` + gold +
cream `#F9E6C2`**, Montserrat/serif typography — visually distinct from the current MVP.

### Decisions locked with the user
- Build **in this existing repo** (no Shopify — it's paid; no separate repo). Reuse the
  existing backend / upload / AR.
- Stripe Checkout is the eventual payment path, but **this build is the marketing site ONLY**.
- **Out of scope this build:** Stripe checkout wiring, AR viewer UX fixes, customer auth,
  partner portal. Tracked for later phases.

### Outcome
A premium marketing site under `/landing` + sub-routes, deployed to `thegoldenframe.com.au`,
leaving `thegoldenframe.co` (the MVP `/` home) untouched. All order CTAs point to `/upload`.

## Brand inputs (from `brand/business-info.md` & `brand/content_db.md`)
- Palette: deep green `#0F3535`, gold, cream `#F9E6C2`. Luxury, elegant, premium.
- Tagline (**photo frames only**): "Where Memories Come Alive". Do **not** use it for
  real-estate / business sections.
- Logo assets in `brand/logo/` (and existing `public/logo.png`).
- Contact: phone `0427 649 892`, email `hello@thegoldenframe.com.au`,
  FB `thegoldenframecreations`, IG `thegoldenframe.creations`.
- Ready-made copy in `content_db.md` (content1 = emotional hero, content2 = business/creators,
  content3 = how it works).

## Routing (non-destructive — never edit `app/page.tsx`)

New site lives under `app/landing/`:
- `app/landing/layout.tsx` — premium shell: green/gold theme wrapper, sticky nav, footer,
  loads display + body fonts.
- `app/landing/page.tsx` — **Home**: hero video loop + "What if your memories could speak?",
  How it works (Scan → Watch → Relive), services overview, demo teaser, pricing teaser,
  testimonials, Contact/WhatsApp CTA.
- `app/landing/services/[slug]/page.tsx` — one template, 4 slugs from a data file
  (`weddings`, `birthdays`, `real-estate`, `business`) via `generateStaticParams`.
- `app/landing/services/page.tsx` — services overview/index.
- `app/landing/demo/page.tsx` — Demo (placeholder video + "scan this QR" demo block).
- `app/landing/pricing/page.tsx` — Pricing tiers.
- Testimonials + Contact render as Home sections (`#testimonials`, `#contact`).

> Both domains serve one deployment. **Optional:** add `middleware.ts` to rewrite
> `thegoldenframe.com.au/` → `/landing` so the apex domain lands on the new site while
> `.co/` stays the MVP. (Confirm desired apex behaviour before adding.)

## Components & data (reuse-first)

New folder `components/site/` (mirrors existing `components/QRDisplay.tsx` convention):
- `Nav.tsx` — logo + links (Home, Services, Demo, Pricing, Testimonials, Contact) +
  "Order Now" → `/upload`.
- `Footer.tsx` — brand, links, contact, socials, WhatsApp.
- `HeroVideo.tsx` — native `<video>` muted autoplay loop + gradient/poster fallback (no new
  deps). Placeholder file `public/hero.mp4` (real video supplied later).
- `Section.tsx`, `Steps.tsx`, `ServiceCard.tsx`, `PricingCard.tsx`, `TestimonialCard.tsx`,
  `WhatsAppButton.tsx` (deep link `https://wa.me/61427649892`).

Single content source `lib/site-content.ts` — `services[]`, `pricingTiers[]`,
`testimonials[]`, `navItems[]`. Lets copy be edited without touching JSX. Seeded from
`content_db.md`.

## Theming & fonts
- Brand tokens added **additively** to `app/globals.css` (`--green-deep`, `--cream`,
  `--gold-brand`, font vars) — existing `--gold-*` MVP vars untouched. ✅ done
- Green/dark theme **scoped** to `.site-shell` class on the landing layout so MVP pages
  are unaffected. ✅ done
- Fonts via `next/font/google` (same `variable` pattern as `app/layout.tsx`): **Montserrat**
  (body) + display serif (**Cormorant**) for luxe headings.

## Out of scope (later phases)
- Stripe Checkout on the order flow (replaces manual PayID in `app/upload/page.tsx`).
- AR viewer UX: faster camera prompt, friendly messages, invisible-border/anchor padding fix
  in `public/ar-viewer.html`.
- Customer Google sign-in + order history; partner bulk-processing portal.

## Build checklist
- [x] Add brand tokens + font vars + `.site-shell` theme to `app/globals.css`
- [x] `lib/site-content.ts` — services / pricing / testimonials / nav data
- [x] `components/site/` — Nav, Footer, HeroVideo, Section, Steps, ServiceCard, PricingCard,
      TestimonialCard, WhatsAppButton
- [x] `app/landing/layout.tsx` — premium shell + fonts (Montserrat + Cormorant)
- [x] `app/landing/page.tsx` — Home
- [x] `app/landing/services/page.tsx` + `services/[slug]/page.tsx` (4 SSG pages)
- [x] `app/landing/demo/page.tsx`, `app/landing/pricing/page.tsx`
- [x] `npm run build` passes — all `/landing/*` routes generated

## Notes / follow-ups
- **Hero video:** `components/site/HeroVideo.tsx` points to `/public/hero.mp4` (not yet
  supplied) and falls back to a luxe gradient if missing. Drop a looping clip there to enable it.
- **Demo video + sample QR:** placeholders on `/landing/demo` — swap in real assets when ready.
- **Pre-existing fix:** `app/api/frames/[id]/route.ts` had a `.then().catch()` that failed
  `next build` type-check (broken on main, unrelated to this work). Changed to the two-arg
  `.then(onOk, onErr)` form so the build is green.
- **Pre-existing (not fixed):** `/dashboard` logs `column frames.payment_status does not exist`
  during prerender — the Phase 2 Supabase migration hasn't been run on the DB yet.
- **Apex domain:** decide whether `thegoldenframe.com.au/` should redirect to `/landing`
  (via `middleware.ts`) before launch.

## Iteration 2 — refinements ✅ done (build green)

Feedback from the user after first preview. Implemented; `npm run build` passes, all routes 200.
Placeholder videos expected at `public/videos/{hero,weddings,birthdays,real-estate,business}.mp4`
(graceful gradient fallback until supplied). Trimmed logo at `public/logo-trimmed.png`
(regenerate with `node scripts/trim-logo.mjs`).

### 1. Logo renders too small
- **Cause:** `public/logo.png` is 4583×2833 with large empty green margins around a centred
  lockup on a solid `#0F3535` plate. At `h-9` the actual artwork is tiny and the green
  padding is invisible against the matching site background.
- **Fix (now):** auto-trim the uniform green border with `sharp` → `public/logo-trimmed.png`,
  then display larger (nav `h-12 sm:h-14`, footer `h-16`). The trimmed plate still blends into
  the green shell. Script: `scripts/trim-logo.mjs`.
- **Best long-term (guidance to user):** supply a **transparent-background PNG (or SVG)**,
  tightly cropped to the artwork — ideally two files: (a) horizontal/stacked lockup for the
  nav, (b) icon-only mark for favicon/compact. Transparent assets let the logo sit on any
  background crisply.

### 2. Consistent luxury type system
- Reviewed luxury wedding/photography conventions (high-contrast serif display + clean
  geometric sans). Chosen pairing matching the gold-on-green art-deco logo:
  - **Display / headings:** Cormorant Garamond (elegant high-contrast serif).
  - **Body / UI / eyebrows:** Montserrat (matches the logo wordmark — thin, wide-tracked).
- Define a single type scale in `globals.css` under `.site-shell` (sizes, weights, line-height,
  letter-spacing) and apply uniformly so headings/eyebrows/body are consistent everywhere.
  Eyebrows: Montserrat, uppercase, `0.3em` tracking, gold. Headings: serif, tight tracking,
  tight leading. Tagline: serif italic accent.

### 3. Hero videos — 16:9, per category
- Landing hero: present the showcase video in a **16:9 frame** (not just a full-bleed wash).
- Each service category gets its **own 16:9 hero video**: Weddings, Birthdays/Kids & Events,
  Real Estate (Business optional).
- New reusable `components/site/VideoFrame.tsx` (16:9, muted autoplay loop, graceful gradient
  fallback if the file is missing). Add `heroVideo` / `heroPoster` fields to `services[]` in
  `lib/site-content.ts`.
- **Placeholder asset paths** (drop real clips later): `public/videos/hero.mp4`,
  `weddings.mp4`, `birthdays.mp4`, `real-estate.mp4`.

### 4. Real Estate wording — we do NOT print
- Correct the copy: The Golden Frame provides the **AR experience + QR code** that links a
  matching image and video (WebAR). We do **not** print flyers/brochures/boards. Customers can
  print via their own or partner printers — "talk to us and we'll explain / connect you".
- Primary CTA for Real Estate (and Business): **"Talk to us & book a demo"** (WhatsApp/contact),
  not "Order". Update `services[].cta` and feature bullets accordingly.

### 5. Broader Contact section
- Contact/CTA copy should speak to **small businesses and real estate** as well as **event &
  wedding photo frames** — not just frames. Update the home `#contact` block and footer blurb
  to reflect all three audiences and invite a demo/conversation.

## Iteration 3 — logo, nav spacing, hero fit ✅ done

1. **Logo:** use `brand/logo/1 logo-16.png` (icon + wordmark, no tagline). `trim-logo.mjs`
   rewritten to crop by scanning the artwork bounding box (sharp `trim()` failed on the
   gradient plate) → `public/logo-mark.png` (1042×491). Used in nav (`h-11/h-12`) and footer.
2. **Nav:** desktop links now `flex-1 justify-center` with `gap-9 xl:gap-12`, `whitespace-nowrap`,
   logo/CTA `shrink-0` — balanced, evenly distributed, no wrap/overflow. Mobile hamburger
   unchanged (collapses cleanly).
3. **Hero:** two-column on `lg` (copy left, 16:9 video right), vertically centred in
   `min-h-[calc(100svh-5rem)]` so the full hero (text + video) fits the first screen on laptops
   without scrolling. Headline reduced to `lg:text-6xl`, tighter leading, reduced gaps.

## Iteration 4 — marketing-site polish / launch-readiness ✅ done

1. **Brand assets** (`scripts/generate-brand-assets.mjs`): favicon `app/icon.png` (icon-only
   glyph on green, auto-detected by Next), `public/apple-icon.png`, and OG share image
   `public/og.png` (1200×630 lockup on green).
2. **SEO metadata** in `app/landing/layout.tsx`: `metadataBase` = `https://www.thegoldenframe.com.au`,
   title template `%s — The Golden Frame`, Open Graph + Twitter `summary_large_image`,
   `en_AU` locale, canonical per page. Per-page titles simplified to bare names.
3. **`app/sitemap.ts`** (landing + services routes) and **`app/robots.ts`** (allow all,
   disallow `/dashboard`, `/api/`, `/order/`; points to sitemap).
4. **VideoFrame**: optional `poster` (still fallback) + respects `prefers-reduced-motion`
   (shows poster/gradient instead of autoplaying).
5. **A11y/perf:** reduced-motion disables smooth-scroll; decorative icons `aria-hidden`.

Verified live: `/sitemap.xml`, `/robots.txt`, `/icon.png`, `/og.png` all 200; og/twitter/
canonical tags render; title template correct.

## Iteration 5 — AR viewer UX fixes ✅ done (`public/ar-viewer.html`)

From website_req.md MVP improvements:
1. **Seamless / faster camera:** `prewarmCamera()` requests the camera permission at page
   load, in parallel with asset downloads (target/video/photo), then releases the stream.
   MindAR's later `start()` reuses the granted permission → opens instantly, no second prompt,
   no stall at the end. (Replaced the post-load `permReminder` flow.)
2. **Friendlier messaging:** camera step copy → "Opening your camera…"; warm rotating quotes
   retained.
3. **Shaky / out-of-frame fix:**
   - **Invisible safe-border:** video plane inset to `INSET = 0.94` so tracking jitter never
     spills the video past the printed photo edge (thin margin reads as a subtle border).
   - **Tracking smoothing:** MindARThree `filterMinCF: 0.0001`, `filterBeta: 0.001` (less
     jitter at rest), `missTolerance: 8` / `warmupTolerance: 3` (no flicker/pop-out on brief
     tracking dropouts).

> Tunable: `INSET` and the filter values are best fine-tuned on a real device with a printed
> frame. Verified served at `/ar` with all changes present; behaviour needs a physical scan to
> confirm feel.

## Iteration 6 — sign-in & customer accounts ✅ done (build green)

Supabase Auth (cookie sessions via `@supabase/ssr`). Files:
- `lib/supabase/client.ts` (browser) + `lib/supabase/server.ts` (server, async cookies).
- `app/account/login/page.tsx` — magic-link email (works with zero external setup) + Google
  button (lights up once the Google provider is enabled in Supabase).
- `app/api/auth/callback/route.ts` (code→session) + `app/api/auth/signout/route.ts`.
- `app/account/layout.tsx` (branded, auth-aware header, `noindex`) + `app/account/page.tsx`
  (auth-gated order history; redirects to login if signed out; matches `frames.customer_email`
  to the user's email — no schema change).
- `components/account/OrderCard.tsx` — status, scans, View-AR/QR links, "Request deletion".
- `app/api/account/frames/[id]/delete/route.ts` — verifies the signed-in user owns the frame,
  deletes R2 files (`lib/r2.ts` new `deleteObject` + `keyFromPublicUrl`), marks row `deleted`
  (AR viewer already rejects non-active → link stops working).
- Nav: "Sign in" link (desktop + mobile); `robots.ts` disallows `/account`.

Verified: `/account` 307→login when signed out; `/account/login` 200 with both methods.

### Config the user must do in Supabase (not code)
- **Auth → URL Configuration:** add redirect URLs incl. `…/api/auth/callback` for
  thegoldenframe.com.au, thegoldenframe.co, and `https://localhost:3000` (dev).
- **Email/magic-link** works out of the box; for production deliverability configure custom SMTP
  (Supabase's built-in email has low rate limits).
- **Google:** enable the Google provider in the Supabase dashboard (Google Cloud OAuth client +
  Supabase callback URL). Until then the Google button errors; magic link works regardless.
- No new app env vars (reuses `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Order history matches by **email** — orders placed under a different email won't appear.

## Iteration 7 — Stripe checkout wired into the order flow ✅ done (build green)

The Stripe backend already existed; the upload page just never used it. Changes:
- **`app/upload/page.tsx`:** final submit now POSTs to `/api/checkout` and redirects to Stripe
  (`window.location.href = url`) instead of creating the frame + showing manual PayID. No frame
  is created before payment. Added a "payment cancelled — not charged" notice (`?cancelled=1`).
  (The old manual-PayID success screen remains as unreachable dead code — safe to delete later.)
- **`app/api/checkout/route.ts`:** now forwards `mobile`, `deliveryAddress`, `postalAddress` in
  session metadata and adds a **delivery line item** (`DELIVERY_PRICE_CENTS`, default 995) so the
  Stripe total matches the displayed $29 + $9.95.
- **`app/api/webhooks/stripe/route.ts`:** passes mobile + delivery address into the admin email,
  and **idempotency guard** — skips if a frame already exists for that `stripe_session_id`
  (Stripe can deliver the event more than once).

Verified live: `/api/checkout` returns 400 on missing fields, and a real `checkout.stripe.com`
session URL on a full order (STRIPE_SECRET_KEY is configured).

### Config needed for full end-to-end (user / dashboard)
- **`STRIPE_WEBHOOK_SECRET`** + register the webhook endpoint in the Stripe dashboard →
  `…/api/webhooks/stripe`, event `checkout.session.completed`. Local testing:
  `stripe listen --forward-to https://localhost:3000/api/webhooks/stripe`.
- Optional price overrides: `FRAME_PRICE_CENTS` (2999), `DELIVERY_PRICE_CENTS` (995).
- `NEXT_PUBLIC_APP_URL` must point at the deployed domain for correct success/cancel redirects.
- `/order/success` still uses the white/amber MVP styling (functional; could be re-themed green).

## Iteration 8 — branded order page (premium upload) ✅ done (build green)

Goal: a premium-styled order/upload experience for the new site that matches the brand
(green/gold, Cormorant/Montserrat), **without touching the MVP `/upload`** used by
thegoldenframe.co ("keep separate to .co").

- **New route `app/landing/order/page.tsx`** — inherits the premium layout (Nav/Footer/theme).
  Reuses `compileImageTarget` (`@/app/upload/compile`), the `/api/upload-url` presigned R2
  upload, and `/api/checkout` → Stripe redirect. Same file validation (photo + ≤60s/≤200MB
  video), delivery/postal address, consent. Branded dark-theme inputs.
- **Prefill from session:** read the signed-in user (browser Supabase client) and pre-fill
  first/last name + email from Google/Supabase metadata, with a "signed in as…" note (still
  collect shipping address — Google doesn't provide it). Not signed in → normal fields + a
  subtle "sign in to autofill" link; sign-in is not forced (don't block orders).
- **Repoint premium CTAs** to `/landing/order`: `brand.orderUrl`, `pricingTiers[].href`,
  account-page CTA. MVP `/` and `/upload` keep their hardcoded `/upload` links → unchanged.

## Iteration 9 — branded order-success + Stripe page guidance ✅ done

- **`/order/success` re-themed** to the premium brand (`app/order/layout.tsx` adds site-shell +
  fonts; `app/order/success/page.tsx` rewritten green/gold with logo, branded timeline, links to
  `/account` and `/landing/order`). Verified 200 + branded.
- **Stripe-hosted checkout page** can't be styled from code — it's configured in the Stripe
  Dashboard (per mode). To show "Pay The Golden Frame" (no domain) + brand logo/colours:
  - Settings → Business → **Public business name** = `The Golden Frame`.
  - Settings → Branding → **Icon** = `public/app-icon` (gold glyph on green, `app/icon.png`),
    **brand colour** `#0F3535`, accent gold `#C9A24B`.
  - Settings → Payments → **Statement descriptor** = `THE GOLDEN FRAME` (≤22 chars, no domain).
  - Set in both **test** and **live** modes. Product line items already say "Personalised AR
    Photo Frame" / "Standard delivery" (no domain).

## Production launch
Full step-by-step runbook in **`LAUNCH.md`** (Supabase migrations + auth, R2 custom domain,
Resend domain, Stripe live keys/webhook/branding, Trigger.dev deploy, Vercel env + domains, DNS,
smoke test). Repo side is ready: production build green (31 pages), apex proxy + all routes.
Payment split by page: `.co/upload` = manual PayID (MVP, reverted to original); `.com.au`
`/landing/order` = Stripe. No hostname branching needed.

## Verification
1. `npm run dev` (`next dev --experimental-https`). Visit `/landing` + each sub-route;
   confirm MVP `/` and `/upload` unchanged.
2. Visual QA mobile + desktop: hero video autoplays muted/looping, green/gold theme renders,
   nav/footer/WhatsApp links work, all CTAs reach `/upload`.
3. `npm run lint` and `npm run build` pass.
4. Click every nav item + 4 service pages; confirm `generateStaticParams` yields all four and
   404s on unknown slugs.
