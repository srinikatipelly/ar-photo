-- Phase 4 (W4): collection links — a QR/URL we hand out so a customer or partner
-- can upload their own photo+video pairs instead of us chasing them for files.
--
-- Deliberately intake-only. Submitting does NOT build the AR experience: per the
-- Phase 4 notes the flow is "upload → we contact you → payment → we deliver", so
-- admin turns a submitted collection into an album later. That also keeps the
-- customer's phone from having to compile ten MindAR targets.
CREATE TABLE IF NOT EXISTS public.collections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The secret in the URL (/collect/<token>). Unguessable, so the link itself is
  -- the credential — there is no login on the upload page by design.
  token        TEXT NOT NULL UNIQUE,

  -- Internal label so admin can tell links apart before anyone has submitted.
  label        TEXT NOT NULL DEFAULT '',

  -- Drives the post-submit copy: partners are told we'll contact them about
  -- payment, customers are told we'll deliver.
  kind         TEXT NOT NULL DEFAULT 'customer'
                 CHECK (kind IN ('customer', 'partner')),

  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'submitted', 'cancelled')),

  -- Per-link cap, defaulting to the album limit. Stored rather than read from
  -- ALBUM_MAX_ITEMS so raising that constant can't retroactively change what an
  -- already-issued link promised.
  max_items    INTEGER NOT NULL DEFAULT 10 CHECK (max_items > 0 AND max_items <= 50),

  -- Links expire so an old QR photographed and shared around can't be used
  -- indefinitely. NULL means no expiry.
  expires_at   TIMESTAMPTZ,

  -- Contact details captured at submit time.
  contact_name    TEXT NOT NULL DEFAULT '',
  contact_email   TEXT NOT NULL DEFAULT '',
  contact_phone   TEXT NOT NULL DEFAULT '',
  contact_address TEXT NOT NULL DEFAULT '',
  note            TEXT NOT NULL DEFAULT '',

  -- [{ photoKey, videoKey }] in the order the uploader arranged them. Every key
  -- is validated server-side to sit under collect/<token>/ so a tampered client
  -- cannot attach someone else's uploads to its own collection.
  items        JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Set once admin turns the submitted pairs into an album (frames.frame_id).
  frame_id     TEXT,

  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL DEFAULT ''
);

-- The only hot lookup: resolving a token on every page load and upload request.
CREATE INDEX IF NOT EXISTS collections_token_idx ON public.collections(token);

-- Admin list view: newest pending/submitted first.
CREATE INDEX IF NOT EXISTS collections_status_created_idx
  ON public.collections(status, created_at DESC);

-- No RLS policies are added on purpose: every read and write goes through the
-- service-role client in server code, which bypasses RLS. The public upload page
-- never talks to Supabase directly — it only calls our route handlers, so the
-- token is validated server-side on every request.
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
