import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const {
      photoKey,
      videoKey,
      targetKey,
      customerEmail,
      customerName,
      mobile,
      deliveryAddress,
      postalAddress,
      kind,
    } = await req.json()

    if (!photoKey || !videoKey || !targetKey || !customerEmail) {
      return NextResponse.json(
        { error: 'photoKey, videoKey, targetKey and customerEmail are required.' },
        { status: 400 },
      )
    }

    // 'digital' = Digital AR Only (QR by email, no physical frame / delivery).
    const isDigital = kind === 'digital'

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
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
      customer_email: customerEmail,
      line_items: lineItems,
      // Carry everything the webhook needs to create the frame + notify admin.
      // Stripe metadata: max 50 keys, 500 chars per value — addresses fit fine.
      metadata: {
        photoKey,
        videoKey,
        targetKey,
        customerEmail,
        customerName: (customerName ?? '').slice(0, 200),
        mobile: (mobile ?? '').slice(0, 40),
        deliveryAddress: (deliveryAddress ?? '').slice(0, 500),
        postalAddress: (postalAddress ?? '').slice(0, 500),
        kind: isDigital ? 'digital' : 'frame',
      },
      allow_promotion_codes: true,
      success_url: `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/landing/order${isDigital ? '?kind=digital&cancelled=1' : '?cancelled=1'}`,
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
