import { NextRequest, NextResponse } from 'next/server'
import {
  CollectionSubmitError,
  getUsableCollection,
  submitCollection,
  type CollectionItem,
} from '@/lib/collections'
import { sendCollectionReceivedEmail, sendCollectionSubmittedAdminEmail } from '@/lib/resend'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params

  const result = await getUsableCollection(token)
  if ('rejection' in result) {
    return NextResponse.json({ error: 'This upload link is no longer active.' }, { status: 404 })
  }
  const collection = result.collection

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const str = (key: string) => (typeof body[key] === 'string' ? (body[key] as string) : '')

  try {
    // submitCollection re-validates the keys against this token's prefix and
    // closes the link atomically — see lib/collections.ts.
    await submitCollection(collection, {
      items: (Array.isArray(body.items) ? body.items : []) as CollectionItem[],
      contactName: str('contactName'),
      contactEmail: str('contactEmail'),
      contactPhone: str('contactPhone'),
      contactAddress: str('contactAddress'),
      note: str('note'),
    })
  } catch (error) {
    if (error instanceof CollectionSubmitError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Collection submit failed:', error)
    return NextResponse.json({ error: 'Could not save your upload.' }, { status: 500 })
  }

  // The upload is safely stored, so the submitter is done regardless of what
  // happens next. A failed notification must not show them an error and invite a
  // retry — the link is already closed, so retrying would only confuse them.
  try {
    const { data } = await supabaseAdmin
      .from('collections')
      .select('items, contact_name, contact_email, contact_phone, contact_address, note')
      .eq('id', collection.id)
      .single()

    const count = Array.isArray(data?.items) ? data.items.length : 0

    // Two different emails on purpose:
    //   admin     — the work queue item, with the contact details
    //   submitter — a receipt only: no QR, no AR link. Nothing is built yet, and
    //               for partners the deliverable is withheld until payment.
    // allSettled so one failing send can't stop the other.
    const results = await Promise.allSettled([
      sendCollectionSubmittedAdminEmail({
        token: collection.token,
        kind: collection.kind,
        label: collection.label,
        count,
        contactName: data?.contact_name ?? '',
        contactEmail: data?.contact_email ?? '',
        contactPhone: data?.contact_phone ?? '',
        contactAddress: data?.contact_address ?? '',
        note: data?.note ?? '',
      }),
      sendCollectionReceivedEmail({
        to: data?.contact_email ?? '',
        name: data?.contact_name ?? '',
        kind: collection.kind,
        count,
      }),
    ])

    for (const r of results) {
      if (r.status === 'rejected') {
        console.error('Collection email failed:', collection.token, r.reason)
      }
    }
  } catch (error) {
    console.error('Collection submitted but notification failed:', collection.token, error)
  }

  return NextResponse.json({ ok: true, kind: collection.kind })
}
