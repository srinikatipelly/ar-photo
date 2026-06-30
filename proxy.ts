import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Apex routing for the two domains served by this one deployment:
 *   • thegoldenframe.com.au  → premium marketing site (rewrite "/" to "/landing")
 *   • thegoldenframe.co      → existing MVP (untouched)
 *
 * A rewrite (not a redirect) keeps the clean apex URL while serving the new site.
 * Only the root path is matched, so /upload, /ar, /api, etc. are never affected.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase() ?? ''
  const isComAu = host.includes('thegoldenframe.com.au')

  if (isComAu && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/landing', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Only run on the apex root — everything else passes straight through.
  matcher: '/',
}
