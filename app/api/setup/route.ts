import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// This is a setup endpoint - should be deleted after running once
export async function GET(req: NextRequest) {
  // Add basic security check
  const setupToken = req.nextUrl.searchParams.get('token')
  if (setupToken !== process.env.SETUP_TOKEN && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Create frames table
    const { error: createTableError } = await supabaseAdmin.rpc('exec', {
      sql: `
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
          items JSONB,
          scan_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );

        -- Album mode: multiple photo+video pairs behind one QR (plan='album').
        ALTER TABLE public.frames ADD COLUMN IF NOT EXISTS items JSONB;

        -- Partner (B2B) module: album ownership + provenance (all nullable; B2C rows unaffected).
        CREATE TABLE IF NOT EXISTS public.partners (
          id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email      TEXT NOT NULL,
          company    TEXT,
          status     TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        ALTER TABLE public.frames ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id);
        ALTER TABLE public.frames ADD COLUMN IF NOT EXISTS source TEXT;
        CREATE INDEX IF NOT EXISTS frames_partner_id_idx ON public.frames(partner_id);

        ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "partner reads self" ON public.partners FOR SELECT USING (id = auth.uid());

        -- Phase 2: Drive/ZIP import jobs (mirror progress; polled by the partner UI).
        CREATE TABLE IF NOT EXISTS public.import_jobs (
          id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          partner_id UUID NOT NULL REFERENCES public.partners(id),
          source     TEXT NOT NULL,
          folder_ref TEXT,
          album_name TEXT,
          status     TEXT NOT NULL DEFAULT 'pending',
          items      JSONB,
          error      TEXT,
          frame_id   TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "partner reads own jobs" ON public.import_jobs;
        CREATE POLICY "partner reads own jobs" ON public.import_jobs FOR SELECT USING (partner_id = auth.uid());

        -- Phase 3: partner applications (self-serve apply → admin approve → activate).
        CREATE TABLE IF NOT EXISTS public.partner_requests (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name        TEXT NOT NULL,
          email       TEXT NOT NULL,
          mobile      TEXT,
          city        TEXT,
          company     TEXT,
          message     TEXT,
          status      TEXT NOT NULL DEFAULT 'pending',
          reviewed_at TIMESTAMP WITH TIME ZONE,
          reviewed_by TEXT,
          created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        -- Per-request secret so the admin can approve/reject from the email link
        -- without signing in (see /partner-review/[id]?token=...).
        ALTER TABLE public.partner_requests ADD COLUMN IF NOT EXISTS token UUID DEFAULT gen_random_uuid();
        -- No policies: all access is server-side via the service role. RLS on + no
        -- policy = locked to service role, so applicant PII is never client-readable.
        ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

        ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS name   TEXT;
        ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS mobile TEXT;
        ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS city   TEXT;

        CREATE INDEX IF NOT EXISTS frames_frame_id_idx ON public.frames(frame_id);
        CREATE INDEX IF NOT EXISTS frames_customer_email_idx ON public.frames(customer_email);
        CREATE INDEX IF NOT EXISTS frames_created_at_idx ON public.frames(created_at);
        
        ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow public read access to frames" ON public.frames
          FOR SELECT USING (true);
        
        CREATE POLICY "Allow service role to insert frames" ON public.frames
          FOR INSERT WITH CHECK (true);
        
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.frames TO authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.frames TO service_role;
      `,
    })

    if (createTableError) {
      // If rpc doesn't work, try direct query
      const { error: directError } = await supabaseAdmin.from('frames').select('count')
      
      if (directError && directError.code === 'PGRST202') {
        // Table doesn't exist, we need to create it via Supabase dashboard or another method
        return NextResponse.json({
          status: 'table_missing',
          message: 'The frames table needs to be created in Supabase. Please run the migration SQL manually.',
          migrationSql: `
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
            
            CREATE INDEX IF NOT EXISTS frames_frame_id_idx ON public.frames(frame_id);
            CREATE INDEX IF NOT EXISTS frames_customer_email_idx ON public.frames(customer_email);
            CREATE INDEX IF NOT EXISTS frames_created_at_idx ON public.frames(created_at);
          `,
        })
      }
    }

    return NextResponse.json({ status: 'success', message: 'Database setup complete' })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup failed' },
      { status: 500 }
    )
  }
}
