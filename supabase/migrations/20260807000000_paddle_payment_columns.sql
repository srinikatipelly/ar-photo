-- Phase 3 (Workstream B): payments move to Paddle as Merchant of Record.
--
-- stripe_session_id stays (nullable) so historical AUD orders keep their
-- reference; new orders are keyed on the Paddle transaction ID instead.
ALTER TABLE public.frames
  ADD COLUMN IF NOT EXISTS paddle_transaction_id TEXT,
  -- price_paid is minor units (cents/paise) and used to be AUD by definition.
  -- Selling in AUD/INR/USD means the amount is meaningless without its currency.
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'AUD';

-- Idempotency lookup in the Paddle webhook: one frame per transaction.
CREATE UNIQUE INDEX IF NOT EXISTS frames_paddle_transaction_id_idx
  ON public.frames(paddle_transaction_id)
  WHERE paddle_transaction_id IS NOT NULL;
