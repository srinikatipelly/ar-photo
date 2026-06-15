export default function OrderSuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <div className="w-full max-w-lg">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-4xl">
          🎉
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Order confirmed!
        </h1>
        <p className="mt-4 text-lg text-zinc-500">
          Thank you for your order. Your QR code has been emailed to you — check your inbox.
        </p>

        {/* Timeline card */}
        <div className="mt-10 rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-7 text-left">
          <h2 className="text-base font-semibold text-zinc-900">What happens next</h2>
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
                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm">
                  {icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">{label}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/"
            className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Back to home
          </a>
          <a
            href="/upload"
            className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
          >
            Order another frame
          </a>
        </div>

        <p className="mt-8 text-xs text-zinc-400">
          Didn&apos;t receive an email? Check your spam folder or{' '}
          <a href="mailto:hello@arframes.com.au" className="underline underline-offset-2">
            contact us
          </a>
          .
        </p>
      </div>
    </main>
  )
}
