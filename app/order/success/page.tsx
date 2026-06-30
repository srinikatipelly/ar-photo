import { brand } from '@/lib/site-content'

export default function OrderSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      {/* Logo */}
      <a href="/landing" className="mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt={brand.name} className="h-14 w-auto" />
      </a>

      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-brand/15 text-4xl" aria-hidden="true">
        🎉
      </div>

      <h1 className="mt-6 font-display text-4xl text-cream sm:text-5xl">Order confirmed!</h1>
      <p className="mt-4 text-base leading-relaxed text-cream/75">
        Thank you for your order. Your QR code has been emailed to you — check your inbox.
      </p>

      {/* Timeline */}
      <div className="mt-10 w-full rounded-3xl border border-cream/15 bg-green-mid/40 p-7 text-left">
        <h2 className="font-display text-xl text-cream">What happens next</h2>
        <ol className="mt-5 space-y-5">
          {[
            {
              label: 'Right now',
              body: 'Your QR code has been sent to your email. You can use it immediately to test the AR experience.',
              icon: '✉️',
            },
            {
              label: '1–2 business days',
              body: 'Our team handcrafts your personalised AR photo frame using your uploaded photo.',
              icon: '🖼️',
            },
            {
              label: '2–3 business days',
              body: "Your frame is carefully packaged and dispatched. You'll receive a shipping confirmation email.",
              icon: '📦',
            },
            {
              label: 'When it arrives',
              body: 'Hang your frame, scan the QR code with any phone camera, and watch your video come alive!',
              icon: '✨',
            },
          ].map(({ label, body, icon }, i) => (
            <li key={i} className="flex gap-4">
              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold-brand text-sm" aria-hidden="true">
                {icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-cream">{label}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-cream/70">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href="/account"
          className="rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
        >
          View my orders
        </a>
        <a
          href="/landing/order"
          className="rounded-full bg-gold-brand px-6 py-3 text-sm font-semibold text-green-deep transition hover:bg-cream"
        >
          Order another frame
        </a>
      </div>

      <p className="mt-8 text-xs text-cream/50">
        Didn&apos;t receive an email? Check your spam folder or{' '}
        <a href={`mailto:${brand.email}`} className="underline underline-offset-2 hover:text-gold-brand">
          contact us
        </a>
        .
      </p>
    </main>
  )
}
