import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

const FRAME_PRICE_CENTS    = parseInt(process.env.FRAME_PRICE_CENTS    ?? '2900', 10)
const DELIVERY_PRICE_CENTS = parseInt(process.env.DELIVERY_PRICE_CENTS ?? '995',  10)

export async function POST(req: NextRequest) {
  try {
    const {
      photoKey, videoKey, targetKey,
      customerEmail, customerName,
      deliveryAddress, postalAddress,
    } = await req.json()

    if (!photoKey || !videoKey || !targetKey || !customerEmail) {
      return NextResponse.json(
        { error: 'photoKey, videoKey, targetKey and customerEmail are required.' },
        { status: 400 },
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'

    // Format delivery address as a readable string for Stripe metadata (500-char limit)
    const formatAddress = (a: Record<string, string> | undefined) => {
      if (!a) return ''
      const parts = [a.line1, a.line2, a.suburb, a.state, a.postcode, a.country]
        .filter(Boolean)
      return parts.join(', ')
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'aud',
            unit_amount: FRAME_PRICE_CENTS,
            product_data: {
              name: 'Personalised AR Photo Frame (8×10)',
              description: 'Your photo inside a frame with a hidden QR code — scan it to watch your video in AR.',
            },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'aud',
            unit_amount: DELIVERY_PRICE_CENTS,
            product_data: {
              name: 'Standard Delivery (Australia)',
              description: 'Carefully packaged and dispatched within 2–3 business days.',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        photoKey,
        videoKey,
        targetKey,
        customerEmail,
        customerName: customerName ?? '',
        deliveryAddress: formatAddress(deliveryAddress),
        postalAddress:   formatAddress(postalAddress),
      },
      allow_promotion_codes: true,
      success_url: `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/upload?cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create checkout session.' },
      { status: 500 },
    )
  }
}
