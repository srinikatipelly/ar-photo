# Production Launch Runbook — The Golden Frame

One Next.js app serves **both** domains from a single Vercel deployment:

| Domain | Serves | Notes |
|---|---|---|
| `thegoldenframe.com.au` (+ `www`) | New premium site — apex `/` is rewritten to `/landing` by `proxy.ts` | Primary marketing + order flow |
| `thegoldenframe.co` | MVP home `/` + `/upload` + `/ar` viewer + all APIs | Unchanged — `/upload` stays on **manual PayID** |

> **Legend:** 🧑‍💻 = you (dashboard / DNS / deploy) · ✅ = already done in the repo.

---

## 0. Heads-up before you start
- **One deploy updates both domains** from this repo. Payment is split by **page**, not host:
  - `.co/upload` → **manual PayID** (MVP, unchanged) → POSTs `/api/frames`, shows bank details.
  - `.com.au` `/landing/order` → **Stripe Checkout** → webhook creates the frame.
  (So you can deploy freely — `.co` keeps PayID.)
- Keep all real secrets in Vercel env vars / `.env.local` only. `.env*` is gitignored ✅.

---

## 1. Supabase (database + auth) 🧑‍💻
1. **Run the migrations** on the production project (SQL editor or CLI), in order:
   - `supabase/migrations/20260611000000_create_frames_table.sql`
   - `supabase/migrations/20260612000000_phase2_payment_columns.sql`  ← adds `payment_status` etc.
   - `supabase/migrations/20260613000000_add_qr_url.sql`
   - `supabase/migrations/20260620000000_add_video_status.sql`
   (The `/dashboard` "column payment_status does not exist" error disappears once these run.)
2. **Auth → URL Configuration:**
   - Site URL: `https://www.thegoldenframe.com.au`
   - Redirect URLs (add all): `https://www.thegoldenframe.com.au/api/auth/callback`,
     `https://thegoldenframe.co/api/auth/callback`, `https://localhost:3000/api/auth/callback`
3. **Email/magic-link:** works out of the box, but configure **custom SMTP** (Auth → Settings)
   for deliverability — the built-in email is rate-limited.
4. **Google sign-in (optional):** Auth → Providers → Google → add a Google Cloud OAuth client
   (client id/secret) and the Supabase callback URL. Until then the Google button errors; magic
   link still works.
5. Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   into Vercel env (section 6).

## 2. Cloudflare R2 (media) 🧑‍💻
1. **Bind a custom domain** to the `ar-frames` bucket (e.g. `cdn.thegoldenframe.com.au` or
   `cdn.thegoldenframe.co`) — the public `pub-…r2.dev` URL is rate-limited and **not for prod**.
2. Set `R2_PUBLIC_URL` to that custom domain (e.g. `https://cdn.thegoldenframe.com.au`).
3. Update the AR viewer preconnect to the new CDN host (tell me the domain and I'll change
   `public/ar-viewer.html` line ~33).
4. Confirm the bucket has public read + CORS (it already serves the viewer).

## 3. Resend (email) 🧑‍💻
1. **Verify the sending domain** `thegoldenframe.com.au` in Resend (DNS records).
2. Set `EMAIL_FROM_ADDRESS=hello@thegoldenframe.com.au`, `EMAIL_FROM_NAME=The Golden Frame`,
   `ADMIN_EMAIL=` (where admin order notifications go).

## 4. Stripe (payments) 🧑‍💻
1. Switch to **live keys**: `STRIPE_SECRET_KEY=sk_live_…` (+ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   if you ever add Elements — not needed for hosted Checkout).
2. **Webhook:** Dashboard → Developers → Webhooks → add endpoint
   `https://www.thegoldenframe.com.au/api/webhooks/stripe`, event `checkout.session.completed`.
   Copy the signing secret → `STRIPE_WEBHOOK_SECRET=whsec_…`.
3. **Branding** (so checkout reads "Pay The Golden Frame"): Settings → Business → Public business
   name = `The Golden Frame`; Settings → Branding → icon = `app/icon.png`, colour `#0F3535`;
   Settings → Payments → Statement descriptor = `THE GOLDEN FRAME`. **Set in live mode.**
4. Prices: `FRAME_PRICE_CENTS=2999`, `DELIVERY_PRICE_CENTS=995` (override if different).
5. (Optional) Live test bypass: run `npm run create-test-coupon` with the **live** key to create
   a 100%-off `TESTORDER` code — then **deactivate it** after testing (it's real money-off live).

## 5. Trigger.dev (background video transcoding) 🧑‍💻
1. `npm run trigger:deploy` to deploy the transcode task to your Trigger.dev project.
2. Set `TRIGGER_SECRET_KEY` in Vercel env.

## 6. Vercel (deploy) 🧑‍💻
1. Connect this repo to a Vercel project (or use the existing `.co` project).
2. **Set ALL env vars** (Production scope) — see the table below.
3. **Add domains:** `thegoldenframe.com.au`, `www.thegoldenframe.com.au`, and keep
   `thegoldenframe.co` (+ `www`). Set the DNS records Vercel shows (apex A/ALIAS + `www` CNAME).
4. Deploy `main`. Build command `next build` (default). ✅ build is green.

### Environment variables (Vercel → Production)
| Variable | Secret? | Value / where to get |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | public | `https://www.thegoldenframe.com.au` |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret** | Supabase service-role key |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` | secret | Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | **secret** | Cloudflare R2 |
| `R2_BUCKET_NAME` | — | `ar-frames` |
| `R2_PUBLIC_URL` | public | custom CDN domain (section 2) |
| `STRIPE_SECRET_KEY` | **secret** | `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | **secret** | from the live webhook endpoint |
| `FRAME_PRICE_CENTS` | — | `2999` |
| `DELIVERY_PRICE_CENTS` | — | `995` |
| `RESEND_API_KEY` | **secret** | Resend |
| `EMAIL_FROM_ADDRESS` | — | `hello@thegoldenframe.com.au` |
| `EMAIL_FROM_NAME` | — | `The Golden Frame` |
| `ADMIN_EMAIL` | — | admin notification inbox |
| `TRIGGER_SECRET_KEY` | **secret** | Trigger.dev |
| `SETUP_TOKEN` | **secret** | only if using `/api/setup`; otherwise omit |

> The `NEXT_PUBLIC_PAYID` / `BSB` / `ACCOUNT_*` vars are only used by the old manual-PayID
> screen (now unreachable) — safe to omit.

## 7. DNS 🧑‍💻
- `thegoldenframe.com.au` → Vercel (apex A/ALIAS per Vercel) ; `www` → CNAME to Vercel.
- `cdn.thegoldenframe.com.au` → Cloudflare R2 custom domain (section 2).
- Email DNS (Resend SPF/DKIM) for `thegoldenframe.com.au`.

## 8. Post-deploy smoke test 🧑‍💻
1. `https://www.thegoldenframe.com.au/` → loads the premium landing (apex rewrite to `/landing`).
2. Order flow: `/landing/order` → upload photo+video → Stripe → pay with **test card
   `4242 4242 4242 4242`** (or `TESTORDER`) → lands on branded `/order/success`.
3. Webhook fired → a `frames` row created, **QR email received**, admin email received.
4. Scan the QR / open `/ar?frame=…` → video plays.
5. `/account` → magic-link sign-in → see the order → test "Request deletion".
6. `thegoldenframe.co/` still shows the MVP.

## 9. Go-live 🧑‍💻
- Confirm Stripe is in **live** mode (keys + webhook + branding).
- Deactivate any live `TESTORDER` coupon.
- Drop real hero/category videos into `public/videos/` and redeploy (optional but recommended).
- Announce 🎉

---

### Repo-side status (done for you ✅)
- Production build green; all routes (`/landing`, `/landing/order`, `/account`, APIs, `/ar`,
  sitemap/robots/icon) generate.
- `proxy.ts` rewrites the `.com.au` apex to `/landing`; `.co` unaffected.
- Branded order + success pages; Stripe checkout wired; accounts + deletion; AR UX fixes; SEO.
