'use client'

import { useState } from 'react'
import { ACTIVE_REGIONS, REGIONS, REGION_COOKIE, type Region } from '@/lib/regions'

/**
 * Manual region override. Writes the `region` cookie (which the proxy treats as a
 * geo override) and reloads so the server re-renders every price/contact for the
 * chosen country.
 */
export function CountrySwitcher({ region }: { region: Region }) {
  const [pending, setPending] = useState(false)

  function choose(next: Region) {
    if (next === region) return
    document.cookie = `${REGION_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    setPending(true)
    window.location.reload()
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Choose your country</span>
      <select
        value={region}
        disabled={pending}
        onChange={(e) => choose(e.target.value as Region)}
        className="cursor-pointer appearance-none rounded-full border border-cream/20 bg-transparent py-1.5 pl-3 pr-7 text-sm text-cream/80 transition hover:border-gold-brand/60 focus:border-gold-brand focus:outline-none disabled:opacity-50"
        aria-label="Choose your country"
      >
        {ACTIVE_REGIONS.map((r) => (
          <option key={r} value={r} className="bg-green-deep text-cream">
            {REGIONS[r].flag} {REGIONS[r].label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 text-xs text-cream/50"
      >
        ▾
      </span>
    </label>
  )
}
