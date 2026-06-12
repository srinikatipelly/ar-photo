-- Add qr_url column to store the R2 path of the generated QR code PNG
ALTER TABLE public.frames
  ADD COLUMN IF NOT EXISTS qr_url TEXT;
