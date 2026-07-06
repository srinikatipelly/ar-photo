import { NextRequest, NextResponse } from 'next/server'
import { sendContactEnquiry } from '@/lib/resend'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json()

    const cleanName = (name ?? '').trim()
    const cleanEmail = (email ?? '').trim()
    const cleanPhone = (phone ?? '').trim()
    const cleanMessage = (message ?? '').trim()

    if (!cleanName || !cleanEmail || !cleanMessage) {
      return NextResponse.json(
        { error: 'Please add your name, email and a message.' },
        { status: 400 },
      )
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address so we can reply.' },
        { status: 400 },
      )
    }

    await sendContactEnquiry({
      name: cleanName.slice(0, 200),
      email: cleanEmail.slice(0, 200),
      phone: cleanPhone.slice(0, 40),
      message: cleanMessage.slice(0, 4000),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Contact enquiry error:', error)
    return NextResponse.json(
      { error: 'Something went wrong sending your message. Please email us directly and we will get right back to you.' },
      { status: 500 },
    )
  }
}
