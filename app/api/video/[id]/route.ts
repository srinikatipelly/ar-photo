import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Stream the video through Next.js so the AR viewer gets it from the same origin,
// avoiding the CORS restriction on the R2 public bucket.
// Forwards Range headers so mobile browsers can seek/stream the video normally.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('frames')
    .select('video_url')
    .eq('frame_id', id)
    .single()

  if (error || !data?.video_url) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  const upstream: HeadersInit = {}
  const range = req.headers.get('range')
  if (range) upstream['Range'] = range

  const r2Res = await fetch(data.video_url, { headers: upstream })

  const resHeaders: Record<string, string> = {
    'Content-Type': r2Res.headers.get('content-type') ?? 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
  }
  const contentLength = r2Res.headers.get('content-length')
  if (contentLength) resHeaders['Content-Length'] = contentLength
  const contentRange = r2Res.headers.get('content-range')
  if (contentRange) resHeaders['Content-Range'] = contentRange

  return new NextResponse(r2Res.body, { status: r2Res.status, headers: resHeaders })
}
