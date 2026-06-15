# The Golden Frame — Product Roadmap

## Vision

Two products, one backend:

| Product | Domain | Audience | Platform |
|---|---|---|---|
| **B2B SaaS** | `thegoldenframe.co` | Photographers, event managers, studios | Next.js (current repo) |
| **B2C Shop** | `thegoldenframe.com.au` | Australian direct consumers | Shopify |

Both share the same Supabase DB, Cloudflare R2 storage, Resend email, and API routes.

---

## Phase 1 — Core AR Platform ✅ DONE

- [x] Customer upload form (photo + video)
- [x] Client-side MindAR target compilation
- [x] Direct browser → R2 upload (presigned PUT, bypasses Vercel 4.5MB limit)
- [x] QR code generated server-side, stored in R2, saved to DB
- [x] Customer confirmation email (no QR, 2–3 day dispatch message)
- [x] Admin notification email with QR code attached for printing
- [x] AR viewer with MindAR + Three.js video overlay
- [x] AR video aspect ratio matched to photo dimensions
- [x] Audio enabled in AR video playback
- [x] Performance: target file served direct from R2, preconnect hints
- [x] Custom domain: thegoldenframe.co on Vercel + Cloudflare CDN
- [x] Resend domain verified (thegoldenframe.co), sending from hello@thegoldenframe.co

---

## Phase 2 — B2C Shopify Store

### Goal
Shopify handles catalogue, cart, checkout and payments for all physical products.
AR frame orders trigger the existing backend to collect the customer's photo + video.

### Products to add in Shopify
- AR Photo Frame (core product — links to backend)
- Custom Magnets
- Custom Keychain
- Custom Stickers
- Bundles (e.g. Frame + Magnets)

### Domain plan
- `thegoldenframe.com.au` → Shopify B2C storefront (Australian consumers)
- `thegoldenframe.co` → stays as Next.js app (B2B SaaS + upload flow + AR viewer + API)
- No subdomain shuffle needed — `.co` is B2B, `.com.au` is B2C

### Tasks

#### 2a. Shopify store setup (no code — Shopify admin)
- [ ] Create Shopify store
- [ ] Add all products with photos, descriptions, prices
- [ ] Register and point `thegoldenframe.com.au` domain to Shopify
- [ ] Set up Shopify Payments (supports AUD natively)
- [ ] thegoldenframe.co stays on Vercel — no domain changes needed

#### 2b. Shopify → backend integration (code in this repo)
- [ ] Add `POST /api/webhooks/shopify` route
  - Verify Shopify webhook HMAC signature
  - On `orders/create` for AR frame product: email customer an upload link
  - Upload link: `https://thegoldenframe.co/upload?order={shopifyOrderId}`
- [ ] Add `SHOPIFY_WEBHOOK_SECRET` env var to Vercel
- [ ] Register the webhook in Shopify admin → Notifications → Webhooks

#### 2c. Upload page tweak (minor)
- [ ] Accept `?order=xxx` query param on `/upload`
- [ ] Pass `shopifyOrderId` through to `POST /api/frames` and save to DB
- [ ] Add `shopify_order_id` column to frames table (Supabase migration)

#### 2d. Non-AR products
- [ ] No backend work needed — Shopify handles fulfilment entirely
- [ ] Admin manually fulfils magnets, keychains, stickers orders from Shopify dashboard

---

## Phase 3 — B2B SaaS Platform

### Goal
Business owners (photographers, event managers, hotels, studios) subscribe to create
AR frames for their own clients. Subscription-gated dashboard, usage limits, white-label.

### Subscription tiers (suggested)
| Plan | Frames/month | Price |
|---|---|---|
| Starter | 10 | $29/mo |
| Studio | 100 | $99/mo |
| Enterprise | Unlimited | $299/mo |

### Tasks

#### 3a. Auth
- [ ] Enable Supabase Auth (email + Google OAuth)
- [ ] Add login / signup pages (`/app/login`, `/app/signup`)
- [ ] Protect API routes with session check
- [ ] Add `users` and `organisations` tables to Supabase

#### 3b. Subscription billing
- [ ] Create Stripe subscription products (Starter, Studio, Enterprise)
- [ ] Add `POST /api/billing/checkout` — create Stripe billing portal session
- [ ] Add `POST /api/billing/portal` — manage existing subscription
- [ ] Extend Stripe webhook to handle `customer.subscription.*` events
- [ ] Add `plan` and `usage_count` to organisations table

#### 3c. Dashboard
- [ ] `/app/dashboard` — list all frames, scan counts, status
- [ ] `/app/frames/new` — create frame (current upload flow, auth-gated)
- [ ] `/app/frames/[id]` — frame detail: QR download, AR link, scan analytics
- [ ] `/app/settings` — account, billing, API keys

#### 3d. Usage enforcement
- [ ] Check frame count against plan limit on `POST /api/frames`
- [ ] Return 402 with upgrade prompt when limit reached

#### 3e. White-label (optional, Enterprise tier)
- [ ] Custom domain for AR viewer (e.g. ar.theirstudio.com)
- [ ] Custom branding on emails (logo, colours)

---

## Architecture Reference

```
thegoldenframe.co          Next.js app — B2B SaaS + API + upload + AR viewer
thegoldenframe.com.au      Shopify B2C store (Australian consumers)

Shared infrastructure:
  Supabase (PostgreSQL)    frames, users, orgs, plans
  Cloudflare R2            photos, videos, targets (.mind), QR PNGs
  Resend                   customer + admin emails
  Cloudflare CDN           cdn.thegoldenframe.co → R2
  Stripe                   one-off payments (now) + subscriptions (Phase 3)
```

## Key env vars (Vercel)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Base URL of the Next.js app |
| `RESEND_API_KEY` | Resend email sending |
| `EMAIL_FROM_ADDRESS` | hello@thegoldenframe.co |
| `ADMIN_EMAIL` | thegoldenframecreations@gmail.com |
| `R2_*` | Cloudflare R2 credentials |
| `SUPABASE_*` | Supabase credentials |
| `STRIPE_SECRET_KEY` | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `SHOPIFY_WEBHOOK_SECRET` | Added in Phase 2 |
