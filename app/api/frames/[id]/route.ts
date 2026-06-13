import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('frames')
      .select('video_url, target_url, photo_url, customer_name, status, scan_count')
      .eq('frame_id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      
      // Check if table doesn't exist
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return NextResponse.json({
          error: 'Database not initialized. Please create the frames table in Supabase.',
          code: 'DB_NOT_INITIALIZED',
        }, { status: 503 })
      }
      
      // Frame not found
      return NextResponse.json({ error: 'Frame not found' }, { status: 404 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Frame not found' }, { status: 404 })
    }

    if (data.status !== 'active') {
      return NextResponse.json({ error: 'Frame not active' }, { status: 403 })
    }

    await supabaseAdmin
      .from('frames')
      .update({
        scan_count: (data.scan_count ?? 0) + 1,
        last_scanned: new Date().toISOString(),
      })
      .eq('frame_id', id)

    return NextResponse.json({
      // Video proxied through Next.js — WebGL VideoTexture requires same-origin
      // or explicit crossOrigin, and we need the proxy's range-request support.
      videoUrl:  `/api/video/${id}`,
      // Target served directly from R2 — fetched as a blob (CORS configured),
      // avoids re-streaming the large .mind file through Vercel.
      targetUrl: data.target_url,
      photoUrl:  data.photo_url,
      name: data.customer_name,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load this frame.' }, { status: 500 })
  }
}
