import { NextRequest, NextResponse } from 'next/server'
import { getPartner } from '@/lib/partner'
import { supabaseAdmin } from '@/lib/supabase'

// Poll an import job's status. Scoped to the owning partner.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { partner } = await getPartner()
  if (!partner) return NextResponse.json({ error: 'Partner access required.' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('import_jobs')
    .select('id, partner_id, status, items, error, album_name, frame_id')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Job not found.' }, { status: 404 })
  if (data.partner_id !== partner.id) return NextResponse.json({ error: 'Not your job.' }, { status: 403 })

  const items = (data.items as { photoKey: string; videoKey: string; photoUrl: string; name: string }[] | null) ?? []
  return NextResponse.json({
    status: data.status,
    albumName: data.album_name,
    error: data.error,
    frameId: data.frame_id,
    // Count mirrored so far (progress) + the payload the browser needs to finish.
    mirrored: items.length,
    items,
  })
}

// Mark a job done once the album has been created (best-effort bookkeeping).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { partner } = await getPartner()
  if (!partner) return NextResponse.json({ error: 'Partner access required.' }, { status: 403 })

  const { frameId } = await req.json().catch(() => ({}))
  await supabaseAdmin
    .from('import_jobs')
    .update({ status: 'done', frame_id: frameId ?? null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('partner_id', partner.id)

  return NextResponse.json({ ok: true })
}
