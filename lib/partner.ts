import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'

export type Partner = {
  id: string
  email: string
  company: string | null
  status: string
  created_at: string
}

/**
 * Resolve the current session's partner (server components / route handlers).
 * A user is a partner iff a row exists for them in `partners` (added by an admin).
 * Returns the auth user (if signed in) and the partner row (if they are one).
 */
export async function getPartner(): Promise<{ userId: string | null; email: string | null; partner: Partner | null }> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { userId: null, email: null, partner: null }

  // RLS "partner reads self" allows this; maybeSingle avoids throwing on 0 rows
  // (a signed-in non-partner) and on a missing table before the migration is run.
  const { data, error } = await supabase
    .from('partners')
    .select('id, email, company, status, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    // Missing table / not-yet-migrated → treat as "not a partner" rather than 500.
    console.warn('getPartner lookup failed (is the migration run?):', error.message)
    return { userId: user.id, email: user.email ?? null, partner: null }
  }

  const partner = data && data.status === 'active' ? (data as Partner) : null
  return { userId: user.id, email: user.email ?? null, partner }
}
