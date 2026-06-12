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
          scan_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
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
