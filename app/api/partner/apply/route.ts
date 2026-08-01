import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendPartnerRequestAdminEmail } from '@/lib/resend'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+[1-9]\d{6,14}$/ // country code required (E.164-ish after stripping formatting)

// Public partner application. Anyone can submit; nothing is granted here — it just
// records a pending request and notifies the admin, who approves in /admin/partners.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name    = (body.name ?? '').trim().slice(0, 200)
    const email   = (body.email ?? '').trim().slice(0, 200)
    const mobile  = (body.mobile ?? '').trim().slice(0, 40)
    const city    = (body.city ?? '').trim().slice(0, 120)
    const company = (body.company ?? '').trim().slice(0, 200)
    const message = (body.message ?? '').trim().slice(0, 4000)

    if (!name || !email || !mobile) {
      return NextResponse.json({ error: 'Please add your name, email and phone number.' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (!PHONE_RE.test(mobile.replace(/[\s()\-.]/g, ''))) {
      return NextResponse.json(
        { error: 'Please enter your phone number with country code, e.g. +61 4XX XXX XXX.' },
        { status: 400 },
      )
    }

    const { error } = await supabaseAdmin.from('partner_requests').insert({
      name, email, mobile, city, company, message, status: 'pending',
    })
    if (error) {
      console.error('partner_requests insert error:', error)
      return NextResponse.json({ error: 'Could not submit your application right now.' }, { status: 500 })
    }

    // Notify the admin — best-effort, don't fail the submission if email hiccups.
    try {
      await sendPartnerRequestAdminEmail({ name, email, mobile, city, company, message })
    } catch (mailErr) {
      console.error('Partner request admin email failed:', mailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Partner apply error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
