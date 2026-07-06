import { brand, navItems, services } from '@/lib/site-content'

export function Footer() {
  return (
    <footer className="border-t border-cream/10 bg-green-deep px-6 py-16 text-cream sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt={brand.name} className="h-20 w-auto" />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
              {brand.name} brings memories and brands to life through augmented reality - living
              keepsakes for weddings & events, and scannable AR experiences for real estate and
              small business. Proudly Australian.
            </p>
            <p className="tagline mt-4 text-xl text-gold-brand">{brand.tagline}</p>
          </div>

          {/* Explore */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-brand">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-cream/70 transition hover:text-gold-brand">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-brand">Contact</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href={`tel:${brand.phoneIntl}`} className="text-cream/70 transition hover:text-gold-brand">
                  📞 {brand.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${brand.email}`} className="break-all text-cream/70 transition hover:text-gold-brand">
                  ✉️ {brand.email}
                </a>
              </li>
              <li>
                <a href={brand.whatsapp} target="_blank" rel="noopener noreferrer" className="text-cream/70 transition hover:text-gold-brand">
                  💬 WhatsApp
                </a>
              </li>
              <li className="flex gap-4 pt-1">
                <a href={brand.instagram} target="_blank" rel="noopener noreferrer" className="text-cream/70 transition hover:text-gold-brand">
                  Instagram
                </a>
                <a href={brand.facebook} target="_blank" rel="noopener noreferrer" className="text-cream/70 transition hover:text-gold-brand">
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Services row */}
        <div className="mt-10 border-t border-cream/10 pt-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-cream/60">
            {services.map((s) => (
              <a key={s.slug} href={`/landing/services/${s.slug}`} className="transition hover:text-gold-brand">
                {s.name}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-cream/10 pt-6 text-xs text-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <p>Handcrafted in Australia 🇦🇺</p>
        </div>
      </div>
    </footer>
  )
}
