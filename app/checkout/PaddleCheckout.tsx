'use client'

import { useEffect, useState } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import { BackToOrderLink, CheckoutCard } from './CheckoutCard'

type Status = 'loading' | 'open' | 'closed' | 'error'

/**
 * Opens Paddle's overlay checkout for an already-created transaction.
 *
 * Paddle renders the payment form in its own iframe, so no card details ever
 * touch this app — and Paddle picks the currency and local payment methods
 * (cards, wallets, UPI in India, …) from the buyer's location.
 */
export function PaddleCheckout({
  transactionId,
  token,
  environment,
}: {
  transactionId: string
  token: string
  environment: 'production' | 'sandbox'
}) {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    let cancelled = false

    initializePaddle({
      token,
      environment,
      eventCallback: (event) => {
        if (cancelled) return
        if (event.name === 'checkout.loaded') setStatus('open')
        // The overlay is dismissable — surface a way back in rather than
        // stranding the buyer on an empty page.
        if (event.name === 'checkout.closed') setStatus('closed')
      },
    })
      .then((paddle: Paddle | undefined) => {
        if (cancelled || !paddle) return
        paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: 'overlay',
            theme: 'dark',
            successUrl: `${window.location.origin}/order/success?_ptxn=${transactionId}`,
          },
        })
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [transactionId, token, environment])

  if (status === 'error') {
    return (
      <CheckoutCard
        title="Something went wrong"
        body="We could not open secure checkout. Please check your connection and try again."
      >
        <BackToOrderLink />
      </CheckoutCard>
    )
  }

  if (status === 'closed') {
    return (
      <CheckoutCard
        title="Checkout closed"
        body="You have not been charged. You can reopen the payment window or go back to your order."
      >
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-gold-brand px-6 py-3 text-sm font-semibold text-green-deep transition hover:bg-cream"
        >
          Reopen payment
        </button>
        <BackToOrderLink />
      </CheckoutCard>
    )
  }

  return (
    <CheckoutCard
      spinner
      title="Opening secure checkout"
      body="Payment is processed securely by Paddle. Please keep this tab open."
    />
  )
}
