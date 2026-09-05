# Phase 4 — Product quality, self-serve media collection, partner workflow

Status: **planning**, written 2026-08-25 from the raw notes preserved at the bottom.
Nothing here is built yet.

## Where things stand going in

- **Payments: Stripe, live.** AUD / card / Australia only. Paddle was evaluated as a global
  merchant of record and rejected — it prohibits physical goods outright, so it can't sell
  the frame. Full implementation is parked on `feature/paddle-mor`. See `phase3-global-plan.md`.
- **India** is live at ₹499 but orders run through **WhatsApp concierge**
  (`app/landing/order/page.tsx` branches on region). US is off.
- **Albums already exist** and are further along than the notes assume — see W3.
- A recurring theme across W4 and W5: **manual payment (PayID / UPI) sits alongside Stripe.**
  Stripe is self-serve AU retail; partners and India are invoiced by hand.

---

## 🐛 B0. ✅ DONE (commit `1441fae`) — India/US contact email pointed at an unowned domain

Fixed: both regions now use `hello@thegoldenframe.com.au`, with `TODO(region)` markers for
when `.com` is registered. `siteUrl` was fixed too — it turned out **not** to be live
(`metadataBase`, `robots.ts` and `sitemap.ts` all read the static `.com.au` brand from
`lib/site-content.ts`, and nothing consumes `getBrand(region).siteUrl`), so it was a trap
rather than a live fault. US had the identical bug and would have shipped broken the moment
`'us'` joins `ACTIVE_REGIONS`.

<details><summary>Original finding</summary>

Found while writing this up. `lib/regions.ts` has:

```ts
in: { contact: { email: 'hello@thegoldenframe.com', siteUrl: 'https://www.thegoldenframe.com' } }
us: { contact: { email: 'hello@thegoldenframe.com', siteUrl: 'https://www.thegoldenframe.com' } }
```

But `phase3-global-plan.md` (A5) lists registering `.com` as a **future** task — we own
`.com.au` and `.co`. The India order page is now deployed and renders that address, so
**anything a customer sends there bounces**. Same for `getBrand('in').email` wherever it
appears (footer, contact page).

**Fix:** either register `thegoldenframe.com` and set up routing, or point the India region
at `hello@thegoldenframe.com.au` until it exists. The second is a one-line change and
should happen now — this is a live dead-end for Indian customers.

This is almost certainly what the note about *"Prefer email? Write to
hello@thegoldenframe.com.au"* on `/landing/order?kind=digital` is about — that line is on
the India concierge page. **To reproduce:** confirm which region the browser was in (the
`region` cookie / country switcher). **Still open:** the India page currently **ignores
`?kind=digital`** — India only sells the digital tier anyway, so it's arguably right, but
it should be a deliberate decision rather than an accident.

</details>

---

## W1. ⚠️ PARTLY DONE (commit `f6b76a3`) — video must fit the frame border

**Fixed: the video was being stretched.** The plane is sized from the photo's aspect ratio
(correct — that's what MindAR tracks) but the texture was mapped straight on with no fit,
so a portrait clip on a landscape 8×10 was distorted to the photo's shape.
`fitVideoTexture` now centre-crops via a UV transform. Verified numerically: the sampled
region always lands at the plane's aspect, `repeat` never exceeds 1, crop stays centred.
Matching aspects produce an exact no-op, so the 82 frames already in customers' hands are
unaffected unless they were being distorted.

Also: the fit runs on `loadedmetadata` (album videos are `preload='none'`, so
`videoWidth` is 0 at setup — applying it inline would silently no-op for every album), and
`INSET` is now shared by both paths with an `?inset=` override (clamped 0.5–1).

**⚠️ STILL OPEN — needs a real frame.** It is *not* established that the distortion was the
reported symptom. The other candidate is the 3% safe-border margin being too small for a
wide printed mat. **These need opposite fixes.** To settle it: scan a problem frame, then
retry with `?inset=0.88` and `?inset=0.82`. If a smaller inset fixes it, it's the margin.

<details><summary>Original analysis</summary>

**Symptom:** the AR video spills outside the printed photo frame's border instead of
sitting neatly inside it.

**Where:** `public/ar-viewer.html` ~line 781 (single frame) and ~line 641 (album,
per-anchor). Both size the plane the same way:

```js
const pw = photoImg.naturalWidth  || video.videoWidth  || 4
const ph = photoImg.naturalHeight || video.videoHeight || 3
const INSET  = 0.94                    // ~3% margin each side
const planeW = 1 * INSET
const planeH = 1 * (ph / pw) * INSET
```

**Likely root cause — confirm before coding.** The plane is sized from the **photo's**
aspect ratio, then the video is stretched onto it with a plain `map` — there is no
cover/contain fit. A portrait phone video on a landscape 8×10 gets distorted to fill a
photo-shaped plane. Candidates in order of likelihood:

1. **Aspect mismatch → stretch.** Fit the video into the plane with a UV transform
   (`videoTex.repeat` / `videoTex.offset`) so it letterboxes or centre-crops instead of
   stretching. Most probable, cleanest fix.
2. **`INSET` too small** for the physical mat width on the printed frame. Could become a
   per-frame value.
3. **Target image includes the printed border**, so MindAR's normalized anchor covers frame
   + photo and the video scales against the wrong reference.

**Do first:** get one real sample — source photo, source video, and a phone photo of the
printed frame mid-playback. Causes 1 and 2 pull in opposite directions; guessing wastes a
print run.

**Watch out:** the fix must land in **both** the single-frame and album paths, which
duplicate this logic. Worth extracting to one function while in there.

</details>

---

## W2. Video quality — ✅ DONE (2026-08-25, commit `d5f2b55`)

No AI. The wins were all in encoder settings, and the biggest was a bug.

**The bug:** `scale=-2:1080` pins *height*, which silently halved portrait video —
landscape came out 1920 long-side, a 1080x1920 phone clip came out 608x1080. Vertical
phone video is the most common upload, so most customers were getting the worst output.
The same filter also upscaled small sources (640x480 → 1440x1080), inventing no detail
while costing download time.

**Fixed:** one scale factor `min(1, MAX/iw, MAX/ih)` on both axes — caps the LONG side in
either orientation, never upscales, keeps dimensions even for yuv420p. Validated against
real ffmpeg for 4K landscape, portrait, square and sub-cap sources.

Also: CRF 23→20, preset fast→medium, `-maxrate 3M`/`-bufsize 6M` to bound worst-case
download, 30fps cap, `maxDuration` 600→900. Long side capped at **1440**, not 1920 —
the phone downloads the whole file before AR starts, so beyond that the pixels cost more
in load time than they return in visible quality.

**Verify in production:** the task now logs `resolution: <in> -> <out>` and
`sizeReductionPct`. Watch a real portrait upload and confirm the long side is 1440, not
608 wide.

**Not done (deliberately):** AI upscaling. It can't invent detail in blurry handheld
footage, adds per-order cost and minutes of latency inside fulfilment, and the texture
renders on a small plane where the ceiling on perceivable quality is low. Revisit only if
the encoder changes above prove insufficient on real footage.

<details><summary>Original analysis (pre-fix)</summary>

**Was:** `trigger/transcode.ts` normalized every upload with `-crf 23 -preset fast
-vf scale=-2:1080` — H.264, capped at 1080p.

**The question that gates everything:** *what specifically looks bad?*

| Complaint | Actual fix | Cost |
|---|---|---|
| Soft / blocky playback | CRF 23 → 19, `-preset slow` | ~free — **do this first** |
| Source is genuinely low-res | AI upscaling | expensive, slow |
| Dark / poorly lit source | Filters, or accept it | cheap |
| Stutter on cheap phones | *Lower* bitrate, not higher | ~free |

**Recommendation:** exhaust encoder settings before reaching for AI. CRF 23 → 19 with a
slower preset is a one-line change and usually resolves "looks soft" outright. AI upscaling
adds per-order cost, minutes of latency, and an external dependency inside fulfilment —
justified only if the complaint is truly *source resolution*, and even then it can't invent
detail in blurry handheld footage.

Remember the texture renders on a small plane on a phone. There's a hard ceiling on
perceivable quality — measure before investing.

</details>

---

## W3. Albums

**Already built** (more than the notes assume):

- `lib/create-album.ts` — `createAlbum()` takes `AlbumItemKeys[]` (photo/video pairs),
  returns `{ frameId, arUrl, qrDataUrl, count }`
- `lib/album-config.ts` — `ALBUM_MAX_ITEMS = 10` (MindAR degrades past ~10 targets)
- `components/album/AlbumBuilder.tsx`, `AlbumQrPending.tsx`
- `app/partners/albums/new`, `app/partners/albums/import` — partner creation + Drive import
- `trigger/import-drive-album.ts`, `import_jobs` table

### W3a. Album QR — audio on by default

**From the notes:** for an album, every photo the customer scans should play **with audio by
default**.

The single-frame path already attempts this — `onTargetFound` plays unmuted and falls back
to muted if the browser blocks it. The **album path (~line 657) needs the same treatment**,
per anchor.

**Constraint worth knowing:** browsers block un-muted autoplay without a user gesture. The
single-frame path handles this with a sound button. For albums the gesture may need to be
captured **once** on first interaction and then reused for every subsequent anchor —
otherwise photo 1 has sound and photos 2–10 are silent.

### W3b. Unclear

The bare note "Album" — what else is missing? Customer-facing (vs partner-facing) album
creation? Album pricing? Editing after creation? **Pin this down before starting.**

---

## W4. ✅ DONE (commit `6228b3f`) — collection links

Built: `collections` table (**with** a migration, unlike `partners`/`import_jobs`),
`lib/collections.ts`, the public `/collect/[token]` page, token-scoped upload URLs, the
submit handler, and `/api/admin/collections` to mint links + QR.

**Intake only**, as designed below — submitting stores the pairs and emails admin; admin
builds the album afterwards.

**⚠️ Requires the migration to be run** — every `/collect/*` request 404s until then.

**Security model** (the token is the only credential): uploads namespaced under
`collect/<token>/` and re-validated on submit, so a tampered client can't attach another
collection's files; separate upload route because `/api/upload-url` takes its key prefix
from the request body; content types allowlisted with the extension derived from the
validated type; single-use enforced by filtering the `UPDATE` on `status='pending'` rather
than a check-then-write; 30-day expiry; `noindex`; vague copy for unknown tokens.

**⚠️ Pre-existing issue found, NOT fixed:** `app/api/upload-url/route.ts` is
unauthenticated and takes its key prefix from the request body, so anyone can upload
arbitrary content into R2 under a prefix of their choosing, served from the CDN domain.
Needs its own fix.

<details><summary>Original design</summary>

### Collection links — QR → customer uploads their own media

**The idea:** stop chasing customers for files. Give them a QR. They scan, land on an upload
page, add up to ten photo+video pairs, get a success message. Shareable over WhatsApp. We
build and deliver the AR experience.

Highest-value item here — it removes the manual back-and-forth gating every order.

**The machinery mostly exists.** This is a new front door onto existing parts:

| Need | Already have |
|---|---|
| Browser → R2 upload | presigned PUT (`/api/upload-url`) |
| N pairs → AR experience | `createAlbum()` |
| Ten-pair cap | `ALBUM_MAX_ITEMS = 10` |
| QR generation | `lib/qr.ts` → `generateQRWithLogo()` |
| Admin notification | `lib/resend.ts` → `sendAdminOrderNotification()` |

**What's new: a tokenised collection link**, e.g. `/collect/<token>`, that:

1. is created per customer/partner and encoded into a QR — the QR and the WhatsApp-shared
   link are the **same URL**
2. opens an upload page needing **no login** (that's the point)
3. accepts up to `ALBUM_MAX_ITEMS` photo+video pairs
4. collects contact details (name, email, phone, address)
5. Register them automatially on the system
5. on submit shows: *"Thank you — we'll contact you if there are any issues, otherwise we'll
   deliver your AR experience."*
6. notifies admin and marks the collection complete

**Open questions to settle before building:**

- **Who creates the link, and when?** Auto after a Stripe order? Manually by admin? By a
  partner for their client? This decides where it hangs in the data model.
- **Attach to an existing order/frame, or create one on completion?**
- **Security.** An unauthenticated upload endpoint is abuse surface. Minimum: unguessable
  token, expiry, hard caps on pair count and file size, submit-once semantics. Decide
  whether an expired token 404s silently.
- **Can they return and edit** after submitting, or one-shot?
- **New table** (`collections`?) — and note `partners` / `partner_requests` / `import_jobs`
  were created **by hand in Supabase with no migration files**. Don't extend that habit;
  write a migration for this one.

---

</details>

---

## W5. ✅ DONE (commit `9ee8837`) — partners

**Most of this was already built.** W5c (QR withheld until payment) shipped in `a278da6`:
the partner album API mails the QR to admins only, sends the partner a payment-pending
note with no QR, and `AlbumQrPending` renders the held state. W5b's QR upload route is
W4's collection link with `kind='partner'`, whose success copy already promises contact
about payment.

Two genuine gaps closed:

- **W5a** — `/landing/partners` offered only "Apply now"; an existing partner had no route
  to their albums and could easily re-apply instead. Added an "Already a partner? Log in"
  CTA alongside it.
- **Admin visibility** — links could be minted but not listed, making them effectively
  invisible beyond an easily-lost email. Added `/admin/collections` (create with QR, copy,
  WhatsApp share, QR download; review submissions) plus nav in the admin layout, which had
  none at all.

**Still open** (unchanged from the notes): how payment confirmation gets recorded — it's a
manual admin judgement today, with no field for it — and whether partners need a dashboard
view of payment status.

<details><summary>Original design</summary>

### Partners — page updates + end-to-end workflow

### W5a. `/landing/partners` page

- Split the entry points clearly: **"Already have a partner account → Log in"** vs
  **"Apply now"**. Today the page leads with the application form.

### W5b. Partner upload — two routes

1. **Google Drive link** — already built (`app/partners/albums/import`, `trigger/import-drive-album.ts`)
2. **QR code → upload link** — new; same collection-link machinery as W4, up to 10 pairs

Then collect **name, email, phone, address**, and confirm:
*"Uploaded successfully — we'll contact you shortly for payment details."*

### W5c. Manual payment, then manual delivery

This flow is deliberately **not Stripe**:

1. We contact the partner for payment — **PayID** (Australia) or **UPI** (India)
2. On confirmed payment, we produce the AR experience
3. **Email the partner a success message only — never the QR code itself**
4. **The QR goes to admin.** Admin then forwards it to the partner by email, WhatsApp, or
   Google Drive, at their discretion

**Note the deliberate design:** the partner-facing email must **not** contain the QR. That's
a change from the customer flow, where `sendCustomerConfirmationEmail()` delivers the QR
directly — so this needs a **separate email template**, not a reused one. Getting this wrong
leaks the deliverable before payment is confirmed.

**Open questions:**

- How is payment confirmation recorded? Manual admin toggle, or something automated?
- Does the partner get a dashboard view of their orders and payment status?
- Does the existing `partners` / `partner_requests` schema cover payment state, or does it
  need new columns? (No migration files exist for those tables — see W4.)

</details>

---

## Remaining work

1. **Run the `collections` migration** — W4/W5 are inert until then.
2. **W1** — settle whether the reported spill was the distortion (fixed) or the safe-border
   margin, using `?inset=` on a real printed frame.
3. **W3b** — blocked: what's actually missing about albums?
4. **Fix `/api/upload-url`** — unauthenticated, caller-chosen key prefix (see W4).
5. Payment-confirmation recording for partners (see W5).

Nothing below this line has been retested since these items were built — none of W1, W2,
W3a, W4 or W5 has run on a real device or against the live database.

<details><summary>Original suggested order</summary>

### Suggested order

1. **B0** — live bug, one-line fix, Indian customers currently have a dead email address.
2. **W1** — visible defect on product already in customers' homes. Get the sample first.
3. **W2 encoder settings only** — one-line CRF/preset change, measure, stop unless the
   result genuinely demands AI.
4. **W4** — the collection link. Build it generically, because **W5b reuses it**.
5. **W5** — partner workflow on top of W4's machinery.
6. **W3a** (album audio), then **W3b** once "what's missing" is answered.

W4 before W5 matters: partners and customers want the same upload page with different
post-submit behaviour. Building W5's version standalone means writing it twice.

---

</details>

---

## Original notes (verbatim, preserved)

```
Improve the output of the video so it should play with the photo frame border not outside
enhance video quality use AI if required
Album
Generate QR code for for drive link
for ex:
customer scnas the QR
it will driectly linked to upload phot and vidoe up to tem pair ct you shortly w
it can be shareabl via whatspp
once uploaded he should get successs message
Thanks you we will contact if any issues
if not then we will deleiver the AR experiens
this other way getting easily from cusomters

For album QR code
for every photo customer scans then it should also play audio by default

few issues need fix .1. on https://www.thegoldenframe.com.au/landing/order?kind=digital -> Prefer email? Write to hello@thegoldenframe.com.au

updates to page https://www.thegoldenframe.com.au/landing/partners
Already hava a partner account with us then login
option to apply now
Parterns should able to upload via google drive link
other way thorugh QR code forexample they are provide with QR code then there will be link directly then can upload photos and video upto 10 pairs
then take their name and email phone number and address etc
then send message successfully uploaded and we will contact you shortly for the payment deatils
then we will request them to pay using payid or UPI in india
on successful payment we will send them the AR experience and they can share it via WhatsApp or email
we will send email only with success message and we will not send QR code directly to parteners email
but the QR will be sent to admin and later admin will send the QR code to partners email or whats app or google drive
```

improvements or bugs:
1. the collect page fro ex: didnt follow the brand colour and font and it should be same as the website
2. Once the albums collected from partners or customers,  I as admin didnt get the email with QR code?
2. on Album created page remove the "Preview the AR Album""
3. remove AR link in customer email 
4.Can I hide the browser header and footer on the AR page so that it looks like a native app?
5.The video on AR frame should be fit inside the frame border and not outside the frame border, I tested one video for ex: baby photo is small and video is big and it was outside the frame border, so it should be fit inside the frame border


6. <make the email more professional and customer friendly>when the customer uploaded via the link genearated via ex: https://www.thegoldenframe.com.au/collect/Vssb7EzHcuAKfJOQAvqSswnU
then the customer should get the success message but didn't get the success message, so it should be fixed, Dont send any QR code yet to customer, only send the success message and one of our thegoldenteam will contact if any issues and we will send the AR experience delivered to you with 24 hours after review successful, if any issue we will contact you, meanwhile you can reach out to us replying this email if questions, Our team will contact you for playment once payment cleared wiill deliver the digital copy.

7. I found an issue wth horizontal landscape video, it was not fit inside the frame border, so it should be fixed and fit inside the frame border and it  was playing outside the frame border, so it should be fixed and fit inside the frame border
Example: when the phone roated in landscape mode, the video was playing outside the frame border, so it should be fixed and fit inside the frame border, also when cusomter scans and goes to one photo and comes back to the same photo, the video was playing outside the frame border, so it should be fixed and fit inside the frame border , attcahed 
bug1-horizontalissue.png
8.