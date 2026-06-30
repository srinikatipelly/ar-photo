import { createBrowserClient } from '@supabase/ssr'

// Browser Supabase client (cookie-based session, used in client components).
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
