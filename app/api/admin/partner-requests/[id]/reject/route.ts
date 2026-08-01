import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { email: adminEmail, isAdmin } = await getAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Admins only.' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('partner_requests')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: adminEmail })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
