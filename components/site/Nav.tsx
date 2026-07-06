'use client'

import { useEffect, useState } from 'react'
import { brand, navItems } from '@/lib/site-content'
import { createBrowserSupabase } from '@/lib/supabase/client'

export function Nav() {
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  // Detect an existing account session so we can swap "Sign in" for "My Account".
  useEffect(() => {
    const supabase = createBrowserSupabase()
    supabase.auth
      .getUser()
      .then(({ data }) => setSignedIn(!!data.user))
      .catch(() => {
        /* not signed in / network issue - leave as signed out */
      })
  }, [])

  const accountLabel = signedIn ? 'My Account' : 'Sign in'

  return (
    <header className="sticky top-0 z-50 border-b border-cream/10 bg-green-deep/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3.5 sm:px-10">
        <a href="/landing" className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt={brand.name} className="h-16 w-auto sm:h-20" />
        </a>

        {/* Desktop links - centred and evenly spaced between logo and CTA */}
        <div className="hidden flex-1 items-center justify-center gap-9 lg:flex xl:gap-12">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm font-medium tracking-wide text-cream/80 transition hover:text-gold-brand"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <a
            href="/account"
            className="hidden text-sm font-medium text-cream/80 transition hover:text-gold-brand sm:inline"
          >
            {accountLabel}
          </a>
          <a
            href={brand.orderUrl}
            className="hidden rounded-full bg-gold-brand px-5 py-2.5 text-sm font-semibold text-green-deep transition hover:bg-cream sm:inline-block"
          >
            Order Now
          </a>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream lg:hidden"
          >
            <span className="text-xl leading-none">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-cream/10 bg-green-deep px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-cream/80 transition hover:bg-green-mid hover:text-gold-brand"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/account"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-cream/80 transition hover:bg-green-mid hover:text-gold-brand"
            >
              {accountLabel}
            </a>
            <a
              href={brand.orderUrl}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-gold-brand px-5 py-2.5 text-center text-sm font-semibold text-green-deep"
            >
              Order Now
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
