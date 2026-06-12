-- Phase 2: add payment tracking columns to frames table
ALTER TABLE public.frames
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS price_paid INTEGER,
  ADD COLUMN IF NOT EXISTS last_scanned TIMESTAMP WITH TIME ZONE;

-- Index for admin queue ordering / filtering
CREATE INDEX IF NOT EXISTS frames_payment_status_idx ON public.frames(payment_status);
CREATE INDEX IF NOT EXISTS frames_stripe_session_id_idx ON public.frames(stripe_session_id);
