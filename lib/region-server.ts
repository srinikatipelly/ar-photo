import 'server-only'
import { cookies, headers } from 'next/headers'
import { DEFAULT_REGION, isActiveRegion, REGION_COOKIE, REGION_HEADER, type Region } from './regions'

/**
 * Resolve the active region for the current request (Server Components / Route
 * Handlers only). Precedence:
 *   1. The `x-region` header set by proxy.ts for THIS request (covers the first
 *      visit, before the cookie round-trips back to the browser).
 *   2. The `region` override cookie (written by the country switcher).
 *   3. DEFAULT_REGION ('au').
 *
 * Reading headers/cookies opts the route into dynamic rendering, which is fine
 * for the marketing pages.
 */
export async function getRegion(): Promise<Region> {
  const headerRegion = (await headers()).get(REGION_HEADER)
  if (isActiveRegion(headerRegion)) return headerRegion

  const cookieRegion = (await cookies()).get(REGION_COOKIE)?.value
  if (isActiveRegion(cookieRegion)) return cookieRegion

  return DEFAULT_REGION
}
