import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'

// Built-in admins — always admin, even with no env set. Add/remove here or via
// ADMIN_EMAILS / ADMIN_EMAIL (comma-separated) env vars; all are merged.
const DEFAULT_ADMIN_EMAILS = ['srini.k2608@gmail.com', 'thegoldenframecreations@gmail.com']

export function adminEmails(): string[] {
  const list = [process.env.ADMIN_EMAILS ?? '', process.env.ADMIN_EMAIL ?? '']
    .flatMap((s) => s.split(','))
    .concat(DEFAULT_ADMIN_EMAILS)
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
