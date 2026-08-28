import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { getPublicUrl } from '@/lib/r2'
import { isValidTokenFormat, uploadPrefix } from '@/lib/collections'
import { supabaseAdmin } from '@/lib/supabase'

// Serve a collection's uploaded photo from OUR origin.
//
// The build page used to fetch these straight from R2. That works in principle —
// the bucket returns the right Access-Control-Allow-Origin for every production
// origin — but media is served from cdn.thegoldenframe.co while the site runs on
// thegoldenframe.com.au. Those are different registrable domains, so the browser
// treats it as a third-party request: privacy extensions, Brave Shields and
// Firefox's strict tracking protection all block it before it reaches the
// network, and the page only sees an unexplained "Failed to fetch".
//
// Going through our own origin removes that entire class of failure. It costs one
// server hop per photo, which is nothing next to the compile that follows.

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string; index: string }> },
) {
  const { isAdmin } = await getAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { token, index } = await ctx.params
  if (!isValidTokenFormat(token)) {
    return NextResponse.json({ error: 'Unknown collection.' }, { status: 404 })
  }

  const i = Number.parseInt(index, 10)
  if (!Number.isInteger(i) || i < 0) {
    return NextResponse.json({ error: 'Bad index.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('collections')
    .select('items')
    .eq('token', token)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: 'Unknown collection.' }, { status: 404 })

  const items = (Array.isArray(data.items) ? data.items : []) as { photoKey: string }[]
  const key = items[i]?.photoKey
  if (!key) return NextResponse.json({ error: 'No such photo.' }, { status: 404 })

  // The index comes from the URL, so confirm the key it resolved to really
  // belongs to this collection before streaming anything back.
  if (!key.startsWith(uploadPrefix(token))) {
    return NextResponse.json({ error: 'Photo failed validation.' }, { status: 400 })
  }

  // Server-side fetch: no CORS, no third-party blocking.
  const upstream = await fetch(getPublicUrl(key))
  if (!upstream.ok || !upstream.body) {
    console.error('Collection photo fetch failed:', key, upstream.status)
    return NextResponse.json({ error: `Media host returned ${upstream.status}.` }, { status: 502 })
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      // Private: this is a customer's photo behind an admin gate, so no shared
      // cache should keep a copy.
      'Cache-Control': 'private, max-age=300',
    },
  })
}
