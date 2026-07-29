import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { geolocation } from '@vercel/functions'
import {
  countryToRegion,
  isActiveRegion,
  REGION_COOKIE,
  REGION_HEADER,
  type Region,
} from '@/lib/regions'

/**
 * Next 16 renamed the `middleware` file convention to `proxy` (Node.js runtime).
 * This proxy does two jobs for the marketing site:
 *
 * 1. Apex routing for the two domains on this one deployment:
 *      • thegoldenframe.com.au → premium marketing site (rewrite "/" to "/landing")
 *      • thegoldenframe.co     → existing MVP (untouched)
 *    A rewrite (not a redirect) keeps the clean apex URL. Only the root path is
 *    rewritten, so /upload, /ar, /api, etc. are never affected.
 *
 * 2. Region localization (Phase 3 · Workstream A): resolve the visitor's region
 *    and hand it to the app two ways — an `x-region` request header the Server
 *    Components read on THIS request, plus a `region` cookie so the choice sticks
 *    and the country switcher can override geo.
 *
 * `request.geo` was removed in Next 15+; on Vercel we read country via
 * @vercel/functions `geolocation()`. Off Vercel (e.g. local dev) it's undefined →
 * default region ('au').
 */
export function proxy(request: NextRequest): NextResponse {
  const host = request.headers.get('host')?.toLowerCase() ?? ''
  const isComAu = host.includes('thegoldenframe.com.au')

  // Resolve region: a manual switch (cookie) wins over geo, but only if still live.
  const override = request.cookies.get(REGION_COOKIE)?.value
  const region: Region = isActiveRegion(override)
    ? override
    : countryToRegion(geolocation(request).country)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(REGION_HEADER, region)

  const isApexRoot = isComAu && request.nextUrl.pathname === '/'
  const response = isApexRoot
    ? NextResponse.rewrite(new URL('/landing', request.url), {
        request: { headers: requestHeaders },
      })
    : NextResponse.next({ request: { headers: requestHeaders } })

  // Persist so later requests and the client-side switcher agree with the server.
  response.cookies.set(REGION_COOKIE, region, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })

  return response
}

export const config = {
  // Apex root (for the rewrite) + the whole marketing site (for region detection).
  // The .co MVP paths (/upload, /ar, /api, …) are intentionally not matched.
  matcher: ['/', '/landing/:path*'],
}
