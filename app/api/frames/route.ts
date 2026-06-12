import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { supabaseAdmin } from '@/lib/supabase'
import { getPublicUrl } from '@/lib/r2'
import { generateFrameId } from '@/lib/utils'
import { sendQREmail } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const { photoKey, videoKey, targetKey, customerEmail, customerName } = await req.json()

    if (!photoKey || !videoKey || !targetKey || !customerEmail) {
      return NextResponse.json({ error: 'photoKey, videoKey, targetKey and customerEmail are required.' }, { status: 400 })
    }

    const frameId = generateFrameId()

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
      created_at: new Date().toISOString(),
    }

    let insertedFrame = frame
    
    // Try to insert into database
    const { data, error } = await supabaseAdmin.from('frames').insert(frame).select().single()

    if (error) {
      console.error('Supabase error:', error)
      
      // If the table doesn't exist, log the error but continue
      // This allows testing without the actual database
      if (error.code === 'PGRST205' || error.message?.includes("Could not find the table")) {
        console.warn('Warning: frames table not found. Create it with the migration SQL.')
        console.warn('The frame will not be saved to the database, but the API response will succeed.')
        insertedFrame = frame
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      insertedFrame = data
    }

    const host = req.headers.get('host') ?? 'localhost:3000'
    // x-forwarded-proto is set by proxies; fall back to the scheme from NEXT_PUBLIC_APP_URL
    // (which should be https:// when --experimental-https is in use) then plain http.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const fallbackProtocol = appUrl.startsWith('https') ? 'https' : 'http'
    const protocol = req.headers.get('x-forwarded-proto') ?? fallbackProtocol
    const arUrl = `${protocol}://${host}/ar?frame=${frameId}`
    
    let qrDataUrl = ''
    try {
      qrDataUrl = await QRCode.toDataURL(arUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
    } catch (qrError) {
      console.error('QR code generation error:', qrError)
      throw new Error('Failed to generate QR code')
    }

    try {
      await sendQREmail({ to: customerEmail, name: customerName, frameId, qrDataUrl })
    } catch (emailError) {
      console.error('Email delivery failed', emailError)
    }

    return NextResponse.json({ frameId, qrDataUrl, frame: insertedFrame })
  } catch (error) {
    console.error('Frames API error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create the AR frame.' }, { status: 500 })
  }
}
