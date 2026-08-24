'use client'

/**
 * The single card the checkout page renders in every state (opening / closed /
 * error). Shared by the server page and the Paddle.js client component so both
 * halves of the route look identical.
 */
export function CheckoutCard({
  title,
  body,
  spinner = false,
  children,
}: {
  title: string
  body: string
  spinner?: boolean
  children?: React.ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-3xl items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-cream/15 bg-green-mid/40 p-8 text-center">
        {spinner && (
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gold-brand border-t-transparent" />
        )}
        <p className="font-display text-2xl text-cream">{title}</p>
        <p className="mt-2 text-sm text-cream/70">{body}</p>
        {children && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">{children}</div>
        )}
      </div>
    </main>
  )
}

export function BackToOrderLink() {
  return (
    <a
      href="/landing/order"
      className="rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
    >
      Back to my order
    </a>
  )
}
