import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Serve the .mind target file through Next.js so the AR viewer can fetch it
// from the same origin, avoiding CORS restrictions on the R2 public bucket.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('frames')
    .select('target_url')
    .eq('frame_id', id)
    .single()

  if (error || !data?.target_url) {
    return NextResponse.json({ error: 'Target not found' }, { status: 404 })
  }

  const r2Res = await fetch(data.target_url)
  if (!r2Res.ok) {
    return NextResponse.json({ error: 'Target file unavailable' }, { status: 502 })
  }

  const buffer = await r2Res.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
