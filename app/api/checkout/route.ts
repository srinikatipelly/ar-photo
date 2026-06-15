import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { photoKey, videoKey, targetKey, customerEmail, customerName } = await req.json()

    if (!photoKey || !videoKey || !targetKey || !customerEmail) {
      return NextResponse.json(
        { error: 'photoKey, videoKey, targetKey and customerEmail are required.' },
        { status: 400 },
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
    const priceAmount = parseInt(process.env.FRAME_PRICE_CENTS ?? '2999', 10)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'aud',
            unit_amount: priceAmount,
            product_data: {
              name: 'Personalised AR Photo Frame',
              description: 'Your photo frame with an embedded AR video experience. Delivered in 2–3 business days.',
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
      },
      allow_promotion_codes: true,
      success_url: `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/upload?cancelled=1`,
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
