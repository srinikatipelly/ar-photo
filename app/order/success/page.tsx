import { brand } from '@/lib/site-content'
import { stripe } from '@/lib/stripe'

// Look up the Stripe Checkout session to tell a physical-frame order apart from
// a Digital AR Only order, so the confirmation copy matches what the customer
// actually bought (no "QR emailed" wording for physical frames).
async function getOrderKind(sessionId?: string): Promise<'digital' | 'frame'> {
  if (!sessionId) return 'frame'
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return session.metadata?.kind === 'digital' ? 'digital' : 'frame'
  } catch {
    return 'frame'
  }
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  const kind = await getOrderKind(session_id)
  const isDigital = kind === 'digital'

  const intro = isDigital
    ? 'Thank you for your order. This is a Digital AR Only order - no physical frame will be sent. Within 1-2 business days we’ll email your photo with the QR code attached, ready for you to print and frame yourself.'
    : 'Thank you for your order. We’ll handcraft your personalised AR photo frame and send it on its way - the QR code comes printed on the frame, ready to scan.'

  const steps = isDigital
    ? [
        {
          label: 'Within 1-2 business days',
          body: 'We’ll email your photo with the QR code attached - ready for you to print and frame yourself.',
          icon: '✉️',
        },
        {
          label: 'Print & frame it',
          body: 'Print the photo at home or a print shop, then frame it however you like - just keep the QR code visible so it can be scanned.',
          icon: '🖨️',
        },
        {
          label: 'Scan & relive',
          body: 'Point any phone camera at the QR code and watch your video come alive - as often as you like!',
          icon: '✨',
        },
      ]
    : [
        {
          label: 'Right now',
          body: 'Your order confirmation has been sent to your email. Keep it for your records.',
          icon: '✉️',
        },
        {
          label: '1-2 business days',
          body: 'Our team handcrafts your personalised AR photo frame using your uploaded photo.',
          icon: '🖼️',
        },
        {
          label: '2-3 business days',
          body: "Your frame is carefully packaged and dispatched. You'll receive a shipping confirmation email.",
          icon: '📦',
        },
        {
          label: 'When it arrives',
          body: 'Hang your frame, scan the QR code on it with any phone camera, and watch your video come alive!',
          icon: '✨',
        },
      ]

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
      {isDigital && (
        <span className="mt-4 inline-flex rounded-full bg-gold-brand/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gold-brand">
          Digital AR Only - no physical frame
        </span>
      )}
      <p className="mt-4 text-base leading-relaxed text-cream/75">{intro}</p>

      {/* Timeline */}
      <div className="mt-10 w-full rounded-3xl border border-cream/15 bg-green-mid/40 p-7 text-left">
        <h2 className="font-display text-xl text-cream">What happens next</h2>
        <ol className="mt-5 space-y-5">
          {steps.map(({ label, body, icon }, i) => (
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
          Order another
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
