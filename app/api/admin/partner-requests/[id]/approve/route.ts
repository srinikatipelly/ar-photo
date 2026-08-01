import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { sendPartnerApprovedEmail } from '@/lib/resend'

// Find or create the auth user for this email (no password — they use magic-link).
async function getOrCreateUserId(email: string): Promise<string> {
  const created = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true })
  if (created.data?.user) return created.data.user.id

  // Likely "already registered" — page through users to find them.
  for (let page = 1; page <= 25; page++) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
    const users = data?.users ?? []
    const match = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (match) return match.id
    if (users.length < 200) break
  }
  throw new Error(created.error?.message || 'Could not create or find the user account.')
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { email: adminEmail, isAdmin } = await getAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Admins only.' }, { status: 403 })

  try {
    const { data: reqRow, error } = await supabaseAdmin
      .from('partner_requests')
      .select('id, name, email, mobile, city, company, status')
      .eq('id', id)
      .single()
    if (error || !reqRow) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    if (reqRow.status !== 'pending') return NextResponse.json({ error: `Already ${reqRow.status}.` }, { status: 409 })

    const userId = await getOrCreateUserId(reqRow.email)

    // Activate the partner (idempotent on the auth user id).
    const { error: upErr } = await supabaseAdmin.from('partners').upsert(
      {
        id: userId,
        email: reqRow.email,
        name: reqRow.name,
        mobile: reqRow.mobile,
        city: reqRow.city,
        company: reqRow.company,
        status: 'active',
      },
      { onConflict: 'id' },
    )
    if (upErr) {
      console.error('partners upsert error:', upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    await supabaseAdmin
      .from('partner_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: adminEmail })
      .eq('id', id)

    // Welcome email — best-effort.
    try {
      await sendPartnerApprovedEmail({ to: reqRow.email, name: reqRow.name })
    } catch (mailErr) {
      console.error('Partner approved email failed:', mailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Approve error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Approve failed.' }, { status: 500 })
  }
}
