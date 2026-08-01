import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { token } = await req.json().catch(() => ({}))
  const { email: adminEmail, isAdmin } = await getAdmin()

  // Authorize via an admin session OR the per-request token from the email link.
  if (!isAdmin) {
    const { data: row } = await supabaseAdmin.from('partner_requests').select('token').eq('id', id).single()
    const tokenOk = !!token && !!row?.token && token === row.token
    if (!tokenOk) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('partner_requests')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: adminEmail ?? 'email-link' })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
