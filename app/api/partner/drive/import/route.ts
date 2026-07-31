import { NextRequest, NextResponse } from 'next/server'
import { tasks } from '@trigger.dev/sdk/v3'
import { getPartner } from '@/lib/partner'
import { supabaseAdmin } from '@/lib/supabase'
import { extractFolderId } from '@/lib/google-drive'
import type { importDriveAlbum } from '@/trigger/import-drive-album'

// Kick off a Drive import: create an import_jobs row and trigger the mirror task.
// The heavy Drive→R2 transfer runs in Trigger.dev (not here) so we never hit
// Vercel function limits. The browser then polls the job and finishes the album.
export async function POST(req: NextRequest) {
  try {
    const { partner } = await getPartner()
    if (!partner) return NextResponse.json({ error: 'Partner access required.' }, { status: 403 })

    const { folder, albumName } = await req.json()
    const folderId = extractFolderId(folder)

    const { data: job, error } = await supabaseAdmin
      .from('import_jobs')
      .insert({
        partner_id: partner.id,
        source: 'drive',
        folder_ref: folderId,
        album_name: albumName ?? '',
        status: 'pending',
      })
      .select('id')
      .single()

    if (error || !job) {
      console.error('import_jobs insert error:', error)
      return NextResponse.json({ error: error?.message ?? 'Could not create the import job.' }, { status: 500 })
    }

    try {
      await tasks.trigger<typeof importDriveAlbum>('import-drive-album', {
        jobId: job.id,
        folderId,
        partnerId: partner.id,
        albumName: albumName ?? '',
      })
    } catch (triggerErr) {
      console.error('Failed to trigger import task:', triggerErr)
      await supabaseAdmin
        .from('import_jobs')
        .update({ status: 'error', error: 'Import worker not available. Is Trigger.dev running/deployed?' })
        .eq('id', job.id)
      return NextResponse.json(
        { error: 'Import worker not available. Ensure Trigger.dev is running (npm run trigger:dev) or deployed.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ jobId: job.id })
  } catch (error) {
    console.error('Drive import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to start the import.' },
      { status: 400 },
    )
  }
}
