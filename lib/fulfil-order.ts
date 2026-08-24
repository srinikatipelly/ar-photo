import 'server-only'
import { generateQRWithLogo } from '@/lib/qr'
import { supabaseAdmin } from '@/lib/supabase'
import { getPublicUrl, uploadBuffer } from '@/lib/r2'
import { generateFrameId } from '@/lib/utils'
import { sendCustomerConfirmationEmail, sendAdminOrderNotification } from '@/lib/resend'

// ─────────────────────────────────────────────────────────────────────────────
// Post-payment fulfilment, shared by the Paddle and Stripe webhooks.
//
// Both providers deliver "this order is paid" with the same payload shape once
// you strip the provider wrapper, so the work — mint a frame ID, render the QR,
// store the frame, email customer + admin — lives here rather than being copied
// per provider.
// ─────────────────────────────────────────────────────────────────────────────

export type FulfilOrderInput = {
  provider: 'paddle' | 'stripe'
  /** Paddle transaction ID or Stripe checkout session ID — the idempotency key. */
  paymentRef: string
  photoKey: string
  videoKey: string
  targetKey: string
  customerEmail: string
  customerName: string
  mobile: string
  deliveryAddress: string
  isDigital: boolean
  /** Amount paid in the currency's minor units (cents / paise). */
  amountMinorUnits: number
  /** ISO-4217 code, e.g. 'AUD' | 'INR' | 'USD'. */
  currency: string
}

export type FulfilOrderResult = { frameId: string; duplicate: boolean }

export async function fulfilOrder(input: FulfilOrderInput): Promise<FulfilOrderResult> {
  const refColumn = input.provider === 'paddle' ? 'paddle_transaction_id' : 'stripe_session_id'

  // Idempotency: both providers may deliver the same event more than once. If
  // we've already processed this payment, don't create a duplicate frame or
  // re-send emails.
  const { data: existing } = await supabaseAdmin
    .from('frames')
    .select('frame_id')
    .eq(refColumn, input.paymentRef)
    .maybeSingle()

  if (existing) {
    return { frameId: existing.frame_id, duplicate: true }
  }

  const frameId = generateFrameId()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
  const host = new URL(appUrl).host
  const protocol = appUrl.startsWith('https') ? 'https' : 'http'
  const arUrl = `${protocol}://${host}/ar?frame=${frameId}`

  const { dataUrl: qrDataUrl, buffer: qrBuffer } = await generateQRWithLogo(arUrl)

  // Upload QR PNG to R2
  const qrKey = `qr/${frameId}.png`
  await uploadBuffer(qrKey, qrBuffer, 'image/png')
  const qrUrl = getPublicUrl(qrKey)

  const frame = {
    frame_id: frameId,
    customer_email: input.customerEmail,
    customer_name: input.customerName,
    photo_url: getPublicUrl(input.photoKey),
    video_url: getPublicUrl(input.videoKey),
    target_url: getPublicUrl(input.targetKey),
    status: 'active',
    plan: 'single',
    scan_count: 0,
    payment_status: 'paid',
    [refColumn]: input.paymentRef,
    price_paid: input.amountMinorUnits,
    currency: input.currency,
    qr_url: qrUrl,
    created_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin.from('frames').insert(frame)
  if (error) {
    console.error('Supabase insert error:', error)
    // Don't throw — still send the email so the customer isn't left hanging.
  }

  await Promise.all([
    sendCustomerConfirmationEmail({
      to: input.customerEmail,
      name: input.customerName,
      frameId,
      isDigital: input.isDigital,
    }),
    sendAdminOrderNotification({
      frameId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      mobile: input.mobile,
      deliveryAddress: input.deliveryAddress,
      photoUrl: getPublicUrl(input.photoKey),
      videoUrl: getPublicUrl(input.videoKey),
      qrDataUrl,
      isDigital: input.isDigital,
    }),
  ])

  return { frameId, duplicate: false }
}
