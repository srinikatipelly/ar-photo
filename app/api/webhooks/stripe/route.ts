import { NextRequest, NextResponse } from 'next/server'
import { generateQRWithLogo } from '@/lib/qr'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { getPublicUrl, uploadBuffer } from '@/lib/r2'
import { generateFrameId } from '@/lib/utils'
import { sendCustomerConfirmationEmail, sendAdminOrderNotification } from '@/lib/resend'

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
  const isDigital = kind === 'digital'

  if (!photoKey || !videoKey || !targetKey || !customerEmail) {
    console.error('Missing metadata on checkout session', session.id)
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  try {
    // Idempotency: Stripe may deliver this event more than once. If we've already
    // processed this session, don't create a duplicate frame / re-send emails.
    const { data: existing } = await supabaseAdmin
      .from('frames')
      .select('frame_id')
      .eq('stripe_session_id', session.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ received: true, frameId: existing.frame_id, duplicate: true })
    }

    const frameId = generateFrameId()

    const host = new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000').host
    const protocol = (process.env.NEXT_PUBLIC_APP_URL ?? '').startsWith('https') ? 'https' : 'http'
    const arUrl = `${protocol}://${host}/ar?frame=${frameId}`

    const { dataUrl: qrDataUrl, buffer: qrBuffer } = await generateQRWithLogo(arUrl)

    // Upload QR PNG to R2
    const qrKey = `qr/${frameId}.png`
    await uploadBuffer(qrKey, qrBuffer, 'image/png')
    const qrUrl = getPublicUrl(qrKey)

    const frame = {
      frame_id: frameId,
      customer_email: customerEmail,
      customer_name: customerName ?? '',
      photo_url: getPublicUrl(photoKey),
      video_url: getPublicUrl(videoKey),
      target_url: getPublicUrl(targetKey),
      status: 'active',
      plan: 'single',
      scan_count: 0,
      payment_status: 'paid',
      stripe_session_id: session.id,
      price_paid: session.amount_total ?? 0,
      qr_url: qrUrl,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabaseAdmin.from('frames').insert(frame)
    if (error) {
      console.error('Supabase insert error:', error)
      // Don't return an error — still send the email so the customer isn't left hanging
    }

    await Promise.all([
      sendCustomerConfirmationEmail({ to: customerEmail, name: customerName ?? '', frameId, isDigital }),
      sendAdminOrderNotification({
        frameId,
        customerName: customerName ?? '',
        customerEmail,
        mobile: mobile ?? '',
        deliveryAddress: deliveryAddress ?? '',
        photoUrl: getPublicUrl(photoKey),
        videoUrl: getPublicUrl(videoKey),
        qrDataUrl,
        isDigital,
      }),
    ])

    return NextResponse.json({ received: true, frameId })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      { status: 500 },
    )
  }
}
