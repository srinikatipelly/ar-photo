-- Create frames table for AR photo frames
CREATE TABLE IF NOT EXISTS public.frames (
  id BIGSERIAL PRIMARY KEY,
  frame_id TEXT NOT NULL UNIQUE,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  plan TEXT NOT NULL DEFAULT 'single',
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS frames_frame_id_idx ON public.frames(frame_id);
CREATE INDEX IF NOT EXISTS frames_customer_email_idx ON public.frames(customer_email);
CREATE INDEX IF NOT EXISTS frames_created_at_idx ON public.frames(created_at);

-- Enable Row Level Security
ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading public frames (optional, can be adjusted)
CREATE POLICY "Allow public read access to frames" ON public.frames
  FOR SELECT USING (true);

-- Create policy to allow inserts from service role
CREATE POLICY "Allow service role to insert frames" ON public.frames
  FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.frames TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.frames TO service_role;
