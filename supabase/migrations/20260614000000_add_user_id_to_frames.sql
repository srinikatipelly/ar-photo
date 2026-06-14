-- Link frames to B2B user accounts.
-- NULL = created by a customer directly (B2C / legacy).
-- Non-null = created by a logged-in B2B user on behalf of their client.
ALTER TABLE public.frames
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS frames_user_id_idx ON public.frames (user_id);
