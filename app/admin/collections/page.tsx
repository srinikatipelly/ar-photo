import { supabaseAdmin } from '@/lib/supabase'
import CollectionsClient, { type CollectionRow } from './CollectionsClient'

// Admin view for collection links (Phase 4 · W4/W5).
//
// Without this the links are invisible: /api/admin/collections could mint one,
// but there was no way to see which links were outstanding, who had submitted,
// or what they sent — only the notification email, which is easy to lose.

export const dynamic = 'force-dynamic'

export default async function AdminCollectionsPage() {
  const { data, error } = await supabaseAdmin
    .from('collections')
    // One string literal, not concatenation: supabase-js infers the row type from
    // the literal, and a built-up string degrades to GenericStringError.
    .select('id, token, label, kind, status, max_items, expires_at, frame_id, submitted_at, created_at, contact_name, contact_email, contact_phone, contact_address, note, items')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="font-display text-3xl text-cream">Collection links</h1>
        <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Could not load collections: {error.message}
          {/* The usual cause is the migration not having been run yet. */}
        </p>
      </div>
    )
  }

  return <CollectionsClient rows={(data ?? []) as CollectionRow[]} />
}
