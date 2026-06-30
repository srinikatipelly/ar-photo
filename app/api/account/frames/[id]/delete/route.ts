import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteObject, keyFromPublicUrl } from '@/lib/r2'

// Permanently deletes a customer's frame: verifies the signed-in user owns it
// (email match), removes the R2 files (photo/video/target) so the AR experience
// stops working, and marks the row deleted.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 1. Require an authenticated user.
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  // 2. Load the frame and confirm it belongs to this user.
  const { data: frame, error } = await supabaseAdmin
    .from('frames')
    .select('frame_id, customer_email, photo_url, video_url, target_url, status')
    .eq('frame_id', id)
    .single()

  if (error || !frame) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }
  if (frame.customer_email?.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: 'You do not have access to this order.' }, { status: 403 })
  }
  if (frame.status === 'deleted') {
    return NextResponse.json({ ok: true, alreadyDeleted: true })
  }

  // 3. Delete the stored assets from R2 (best-effort per file).
  const keys = [frame.photo_url, frame.video_url, frame.target_url]
    .map((u) => (u ? keyFromPublicUrl(u) : null))
    .filter((k): k is string => Boolean(k))

  await Promise.all(
    keys.map((key) =>
      deleteObject(key).catch((e) => console.warn('[delete] R2 delete failed for', key, e)),
    ),
  )

  // 4. Mark the row deleted and clear the asset URLs (AR viewer rejects non-active).
  const { error: updateError } = await supabaseAdmin
    .from('frames')
    .update({
      status: 'deleted',
      photo_url: '',
      video_url: '',
      target_url: '',
      updated_at: new Date().toISOString(),
    })
    .eq('frame_id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Could not complete deletion.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
