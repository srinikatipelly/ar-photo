# Album mode — one QR, many photos (WebAR)

Status: **implemented on branch `album-mode` — not pushed; test before merge** (2026-07-31).

## Goal

A customer orders an album (e.g. 10 photos). They scan **one** QR code, then simply move the
camera from photo to photo and the matching video plays for each — no per-photo QR. The
existing single-photo product must keep working **exactly as-is**.

## Why it works with the current stack

MindAR (already in use) can compile **many images into one `.mind` target file** and track
them together, firing `onTargetFound` / `onTargetLost` per image. So one scan loads all N
targets + N videos, and the right video plays as each photo comes into view.

## Design (backward compatible)

An album is **one `frames` row**, reusing the existing table + one new column:

- New nullable column **`items JSONB`** = `[{ "photoUrl": "...", "videoUrl": "..." }, …]`, in the
  **same order** as the images compiled into the `.mind`. Anchor `i` ↔ `items[i]`.
- `plan = 'album'` (single frames stay `plan = 'single'`, `items = NULL`).
- `target_url` = the **combined** `.mind` (all photos). `photo_url` / `video_url` = the first
  item (kept for thumbnails / fallback).
- Single frames are untouched: `items` is `NULL` → the viewer + API take the current path.

### Data flow (unchanged backbone)

`one QR → /ar?frame=<id> → GET /api/frames/:id → { album:true, targetUrl, items[] } →
combined .mind + N videos → N anchors, maxTrack 1 → pan-and-play`

## Files touched

- **`app/upload/compile.ts`** — add `compileImageTargets(files: File[])` (N photos → one
  `.mind`). Existing single `compileImageTarget` kept.
- **`app/api/albums/route.ts`** (new) — create an album row from `{ items:[{photoKey,videoKey}],
  targetKey, customerName?, customerEmail? }`; generate the one QR; return `{ frameId, qrDataUrl }`.
- **`app/api/frames/[id]/route.ts`** — if `plan==='album'` return `{ album:true, targetUrl,
  items:[{videoUrl,photoUrl}], name }`; otherwise the current single shape (unchanged).
- **`public/ar-viewer.html`** — detect album → build N anchors, lazy-load each video
  (`preload='none'`, play on found), `maxTrack:1`. **The single-frame path is left byte-for-byte
  as-is** to avoid regressing the live product; album is a separate branch.
- **`app/album/page.tsx`** (new) — internal builder: add up to 10 photo+video pairs → compile
  one `.mind` → upload all assets → create album → show the one QR + link.

## Database migration (run once in Supabase SQL editor)

The `frames` table already exists in your project, so just add the column:

```sql
ALTER TABLE public.frames ADD COLUMN IF NOT EXISTS items JSONB;
```

(`plan` already exists. No other change needed. `app/api/setup/route.ts` is also updated so a
fresh install creates the column.)

## How to test

1. Run the migration SQL above.
2. `npm run dev`, open **`/album`**.
3. Add 2–3 photo+video pairs first (fast), print the photos (matte, textured — same tracking
   rules as the single product). Click **Create album**.
4. Scan the single QR (or open the link) on your phone → point at photo 1 (its video plays) →
   move to photo 2 (it switches) → etc.
5. Confirm an existing **single** frame still works unchanged.
6. Scale up to 10 and re-test recognition + switching.

## Known limits / notes

- **Keep it to ~10.** More targets in one `.mind` = bigger file, slower first load, higher
  false-match risk between visually similar photos.
- **`maxTrack: 1`** — one video plays at a time; it switches as you pan. Right for the album UX
  and lighter on the phone.
- **Lazy video load** — each video downloads only when its photo is first seen (avoids pulling
  10 videos at once).
- **Trackability still rules** — a weak (low-texture / plain-background) photo tracks poorly in
  an album just as it does solo; see the printing guidelines.
- **Creation tool only** — `/album` is an internal builder for testing the experience. Wiring
  albums into the paid order flow (pricing, checkout, emails) is a later step.
- **Carries to native** — ARKit/ARCore also track multiple images at once, so this isn't a
  web-only dead end.
