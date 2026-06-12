import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gylvqvwyboempyjnpwgy.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function setupDatabase() {
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    console.log('Creating frames table...')

    // Use the admin API to execute raw SQL
    const { data, error } = await supabase.rpc('exec', {
      query: `
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

    if (error) {
      console.error('Error creating table:', error)
      // Try a simpler approach - just test if the table exists
      const { error: testError } = await supabase.from('frames').select('count')
      if (testError && testError.code === 'PGRST205') {
        console.error('Table does not exist. Please create it manually in Supabase.')
        console.log('You can run the SQL from: supabase/migrations/20260611000000_create_frames_table.sql')
        process.exit(1)
      }
    } else {
      console.log('Database setup successful!')
    }
  } catch (err) {
    console.error('Setup error:', err)
    process.exit(1)
  }
}

setupDatabase()
