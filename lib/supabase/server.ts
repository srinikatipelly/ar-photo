import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server Supabase client bound to the request cookies. Use in server components
// and route handlers to read the signed-in user's session.
export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // In Server Components cookie writes throw — that's fine, the session
          // is refreshed via route handlers / the browser client instead.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            /* ignore: called from a Server Component */
          }
        },
      },
    },
  )
}
