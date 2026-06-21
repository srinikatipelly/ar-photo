ALTER TABLE public.frames
  ADD COLUMN IF NOT EXISTS video_status TEXT NOT NULL DEFAULT 'processing';

-- Grant UPDATE permission so the transcode job can mark frames ready
GRANT UPDATE ON public.frames TO service_role;
