import { BackToOrderLink, CheckoutCard } from './CheckoutCard'
import { PaddleCheckout } from './PaddleCheckout'

// ─────────────────────────────────────────────────────────────────────────────
// Paddle checkout page.
//
// /api/checkout creates the transaction server-side and sends the buyer here
// with `?_ptxn=txn_...` — the same param Paddle appends to the checkout URL it
// returns, so this page works whether the link came from us or from Paddle's
// default payment link setting.
// ─────────────────────────────────────────────────────────────────────────────

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ _ptxn?: string }>
}) {
  const { _ptxn: transactionId } = await searchParams
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN

  if (!transactionId) {
    return (
      <CheckoutCard
        title="Checkout link incomplete"
        body="This link is missing its transaction, so there's nothing to pay for yet. Please start your order again."
      >
        <BackToOrderLink />
      </CheckoutCard>
    )
  }

  if (!token) {
    return (
      <CheckoutCard
        title="Payments unavailable"
        body="Secure checkout isn't configured right now. Please try again shortly — you have not been charged."
      >
        <BackToOrderLink />
      </CheckoutCard>
    )
  }

  return (
    <PaddleCheckout
      transactionId={transactionId}
      token={token}
      environment={process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox'}
    />
  )
}
