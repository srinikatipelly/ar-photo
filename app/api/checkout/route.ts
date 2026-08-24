import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import {
  findOrCreateCustomerId,
  getPaddle,
  getPaymentProvider,
  resolveLineItems,
  type CheckoutCustomData,
  type OrderKind,
} from '@/lib/paddle'
import { getRegion } from '@/lib/region-server'
import type { Region } from '@/lib/regions'

type OrderDetails = {
  photoKey: string
  videoKey: string
  targetKey: string
  customerEmail: string
  customerName: string
  mobile: string
  deliveryAddress: string
  postalAddress: string
  kind: OrderKind
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { photoKey, videoKey, targetKey, customerEmail } = body
    if (!photoKey || !videoKey || !targetKey || !customerEmail) {
      return NextResponse.json(
        { error: 'photoKey, videoKey, targetKey and customerEmail are required.' },
        { status: 400 },
      )
    }

    const order: OrderDetails = {
      photoKey,
      videoKey,
      targetKey,
      customerEmail,
      customerName: (body.customerName ?? '').slice(0, 200),
      mobile: (body.mobile ?? '').slice(0, 40),
      deliveryAddress: (body.deliveryAddress ?? '').slice(0, 500),
      postalAddress: (body.postalAddress ?? '').slice(0, 500),
      // 'digital' = Digital AR Only (QR by email, no physical frame / delivery).
      kind: body.kind === 'digital' ? 'digital' : 'frame',
    }

    // Region drives which prices (and therefore which currency + local payment
    // methods) the buyer sees. Resolved server-side from the cookie/header the
    // proxy sets, so the client can't shop for a cheaper market.
    const region = await getRegion()

    const url =
      getPaymentProvider() === 'paddle'
        ? await createPaddleCheckout(order, region)
        : await createStripeCheckout(order)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create checkout session.' },
      { status: 500 },
    )
  }
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
}

// ── Paddle (Merchant of Record — domestic + international) ───────────────────

/**
 * Create a Paddle transaction and hand back the URL that opens its checkout.
 *
 * We don't set a currency or payment methods: Paddle picks both from the
 * buyer's location (cards, wallets, UPI in India, …) and remits the local sales
 * tax as the merchant of record.
 */
async function createPaddleCheckout(order: OrderDetails, region: Region): Promise<string> {
  const paddle = getPaddle()
  const items = resolveLineItems(order.kind, region)
  const customerId = await findOrCreateCustomerId(order.customerEmail, order.customerName)

  const customData: CheckoutCustomData = { ...order, region }

  const transaction = await paddle.transactions.create({
    items,
    ...(customerId ? { customerId } : {}),
    customData,
  })

  // Paddle returns a checkout URL when a default payment link is configured in
  // the dashboard. Fall back to building it ourselves so a missing dashboard
  // setting can't break checkout — `/checkout` opens Paddle.js for `_ptxn`.
  return transaction.checkout?.url ?? `${appUrl()}/checkout?_ptxn=${transaction.id}`
}

// ── Stripe (legacy — AUD/card only; used until Paddle onboarding completes) ──

async function createStripeCheckout(order: OrderDetails): Promise<string | null> {
  const isDigital = order.kind === 'digital'
  const framePrice = parseInt(process.env.FRAME_PRICE_CENTS ?? '3900', 10)
  const deliveryPrice = parseInt(process.env.DELIVERY_PRICE_CENTS ?? '995', 10)
  const digitalPrice = parseInt(process.env.DIGITAL_PRICE_CENTS ?? '1900', 10)

  const lineItems = isDigital
    ? [
        {
          price_data: {
            currency: 'aud' as const,
            unit_amount: digitalPrice,
            product_data: {
              name: 'Digital AR Experience (QR by email)',
              description:
                'Your photo + video brought to life in AR. QR code delivered by email - no physical frame.',
            },
          },
          quantity: 1,
        },
      ]
    : [
        {
          price_data: {
            currency: 'aud' as const,
            unit_amount: framePrice,
            product_data: {
              name: 'Personalised AR Photo Frame',
              description:
                'Your photo frame with an embedded AR video experience. Dispatched in 2-3 business days.',
            },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'aud' as const,
            unit_amount: deliveryPrice,
            product_data: { name: 'Standard delivery (Australia)' },
          },
          quantity: 1,
        },
      ]

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: order.customerEmail,
    line_items: lineItems,
    // Carry everything the webhook needs to create the frame + notify admin.
    // Stripe metadata: max 50 keys, 500 chars per value — addresses fit fine.
    metadata: {
      photoKey: order.photoKey,
      videoKey: order.videoKey,
      targetKey: order.targetKey,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      mobile: order.mobile,
      deliveryAddress: order.deliveryAddress,
      postalAddress: order.postalAddress,
      kind: order.kind,
    },
    allow_promotion_codes: true,
    success_url: `${appUrl()}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/landing/order${isDigital ? '?kind=digital&cancelled=1' : '?cancelled=1'}`,
  })

  return session.url
}
