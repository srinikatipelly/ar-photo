import { brand } from '@/lib/site-content'

/**
 * Shown to partners in place of the album QR. The QR is the deliverable, so it's
 * held back until payment is confirmed — an admin sends it on manually. Used by
 * both the manual builder and the bulk importer so the message stays identical.
 */
export function AlbumQrPending({ frameId, count }: { frameId: string; count: number }) {
  return (
    <div className="rounded-3xl border border-gold-brand/30 bg-green-mid/40 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-gold-brand">QR code pending payment</p>
      <p className="mt-3 text-sm leading-relaxed text-cream/75">
        Your album is built and all {count} photo{count === 1 ? ' is' : 's are'} live. We&apos;ve emailed our team
        the finished QR code — they&apos;ll send it over as soon as payment for this album is confirmed.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-cream/75">
        To settle up, message us with the reference below and we&apos;ll share payment details:
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={brand.whatsapp} target="_blank" rel="noopener noreferrer"
          className="rounded-full bg-gold-brand px-5 py-2.5 text-sm font-bold text-green-deep transition hover:bg-cream">
          WhatsApp {brand.phone}
        </a>
        <a href={`mailto:${brand.email}?subject=${encodeURIComponent(`Album payment - ${frameId}`)}`}
          className="rounded-full border border-cream/25 px-5 py-2.5 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand">
          Email {brand.email}
        </a>
      </div>
      <p className="mt-4 font-mono text-xs text-cream/45">Album reference: {frameId}</p>
    </div>
  )
}
