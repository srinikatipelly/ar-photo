import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'

// Admin = an email in ADMIN_EMAILS (comma-separated) or the existing ADMIN_EMAIL.
// Used to gate the partner-approvals area. No new env needed if ADMIN_EMAIL is set.
function adminEmails(): string[] {
  const list = [process.env.ADMIN_EMAILS ?? '', process.env.ADMIN_EMAIL ?? '']
    .join(',')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return Array.from(new Set(list))
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().includes(email.toLowerCase())
}

/** Current session's admin status (server components / route handlers). */
export async function getAdmin(): Promise<{ email: string | null; isAdmin: boolean }> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? null
  return { email, isAdmin: isAdminEmail(email) }
}
