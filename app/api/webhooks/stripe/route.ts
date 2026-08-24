import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { fulfilOrder } from '@/lib/fulfil-order'

// Legacy Stripe webhook (AUD, card-only). Kept working during the cutover to
// Paddle — see app/api/webhooks/paddle/route.ts and lib/paddle.ts. Fulfilment
// itself is shared, so the two providers can never drift apart.

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  let event: ReturnType<typeof stripe.webhooks.constructEvent>

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object
  const { photoKey, videoKey, targetKey, customerEmail, customerName, mobile, deliveryAddress, kind } =
    session.metadata ?? {}

  if (!photoKey || !videoKey || !targetKey || !customerEmail) {
    console.error('Missing metadata on checkout session', session.id)
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  try {
    const { frameId, duplicate } = await fulfilOrder({
      provider: 'stripe',
      paymentRef: session.id,
      photoKey,
      videoKey,
      targetKey,
      customerEmail,
      customerName: customerName ?? '',
      mobile: mobile ?? '',
      deliveryAddress: deliveryAddress ?? '',
      isDigital: kind === 'digital',
      amountMinorUnits: session.amount_total ?? 0,
      currency: (session.currency ?? 'aud').toUpperCase(),
    })

    return NextResponse.json({ received: true, frameId, ...(duplicate ? { duplicate } : {}) })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      { status: 500 },
    )
  }
}
