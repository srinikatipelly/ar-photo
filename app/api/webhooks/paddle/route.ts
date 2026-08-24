import { NextRequest, NextResponse } from 'next/server'
import { EventName } from '@paddle/paddle-node-sdk'
import { getPaddle, readCustomData } from '@/lib/paddle'
import { fulfilOrder } from '@/lib/fulfil-order'

// ─────────────────────────────────────────────────────────────────────────────
// Paddle webhook — the source of truth that an order is paid.
//
// The buyer is redirected to /order/success straight after paying, but Paddle
// may still be settling (UPI and other local methods are not always instant),
// so fulfilment happens here and nowhere else.
//
// Point this at https://<your-domain>/api/webhooks/paddle in Paddle →
// Developer tools → Notifications, subscribed to `transaction.completed`.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('paddle-signature') ?? ''
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET ?? ''

  if (!webhookSecret) {
    console.error('PADDLE_WEBHOOK_SECRET is not set — refusing to trust the webhook.')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event
  try {
    event = await getPaddle().webhooks.unmarshal(body, webhookSecret, signature)
  } catch (err) {
    console.error('Paddle webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // `transaction.completed` fires once the payment has actually settled.
  // Everything else (created/ready/updated/…) is noise for fulfilment.
  if (event.eventType !== EventName.TransactionCompleted) {
    return NextResponse.json({ received: true })
  }

  const transaction = event.data
  const custom = readCustomData(transaction.customData)
  const { photoKey, videoKey, targetKey, customerEmail } = custom

  if (!photoKey || !videoKey || !targetKey || !customerEmail) {
    // Acknowledge with 400 so Paddle surfaces it: retrying can't fix missing
    // custom_data, but we do want to see it in the notification log.
    console.error('Missing custom_data on Paddle transaction', transaction.id)
    return NextResponse.json({ error: 'Missing custom_data' }, { status: 400 })
  }

  try {
    // Paddle reports money as a minor-unit string ('3900'), matching the integer
    // cents the frames table already stores.
    const totals = transaction.details?.totals
    const amountMinorUnits = parseInt(totals?.grandTotal ?? '0', 10)

    const { frameId, duplicate } = await fulfilOrder({
      provider: 'paddle',
      paymentRef: transaction.id,
      photoKey,
      videoKey,
      targetKey,
      customerEmail,
      customerName: custom.customerName ?? '',
      mobile: custom.mobile ?? '',
      deliveryAddress: custom.deliveryAddress ?? '',
      isDigital: custom.kind === 'digital',
      amountMinorUnits: Number.isFinite(amountMinorUnits) ? amountMinorUnits : 0,
      currency: totals?.currencyCode ?? transaction.currencyCode,
    })

    return NextResponse.json({ received: true, frameId, ...(duplicate ? { duplicate } : {}) })
  } catch (error) {
    console.error('Paddle webhook processing error:', error)
    // A 500 tells Paddle to retry, which is what we want for transient failures
    // (R2 upload, email send) — fulfilOrder is idempotent on the transaction ID.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      { status: 500 },
    )
  }
}
