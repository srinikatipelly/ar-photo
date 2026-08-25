import 'server-only'
import { nanoid } from 'nanoid'
import { supabaseAdmin } from '@/lib/supabase'
import { ALBUM_MAX_ITEMS } from '@/lib/album-config'

// ─────────────────────────────────────────────────────────────────────────────
// Collection links (Phase 4 · W4).
//
// A collection is a one-shot intake form behind an unguessable URL. We hand the
// link out as a QR (or paste it into WhatsApp); the recipient uploads up to
// max_items photo+video pairs and their contact details, and we take it from
// there. Submitting does NOT create the AR experience — see the migration.
//
// The token in the URL is the only credential, so everything here is written on
// the assumption that the client is hostile: keys are namespaced per token and
// re-validated on submit, links expire, and a submitted link is closed.
// ─────────────────────────────────────────────────────────────────────────────

export type CollectionKind = 'customer' | 'partner'
export type CollectionStatus = 'pending' | 'submitted' | 'cancelled'

export type CollectionItem = { photoKey: string; videoKey: string }

export type Collection = {
  id: string
  token: string
  label: string
  kind: CollectionKind
  status: CollectionStatus
  maxItems: number
  expiresAt: string | null
  frameId: string | null
  submittedAt: string | null
  createdAt: string
}

/** Why a token can't be used right now — drives the message the visitor sees. */
export type CollectionRejection = 'not-found' | 'submitted' | 'cancelled' | 'expired'

/**
 * 24 nanoid chars ≈ 143 bits. The link is the credential and it travels through
 * WhatsApp and printed QR codes, so it has to survive being guessed at without
 * any rate limit in front of it.
 */
const TOKEN_LENGTH = 24

/** Everything a collection's uploads live under. Also the security boundary. */
export function uploadPrefix(token: string): string {
  return `collect/${token}/`
}

/**
 * Reject anything that isn't one of our own tokens before it reaches the
 * database or an R2 key. nanoid's default alphabet is [A-Za-z0-9_-].
 */
export function isValidTokenFormat(token: string): boolean {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(token)
}

type CollectionRow = {
  id: string
  token: string
  label: string
  kind: CollectionKind
  status: CollectionStatus
  max_items: number
  expires_at: string | null
  frame_id: string | null
  submitted_at: string | null
  created_at: string
}

function toCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    token: row.token,
    label: row.label,
    kind: row.kind,
    status: row.status,
    maxItems: row.max_items,
    expiresAt: row.expires_at,
    frameId: row.frame_id,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
  }
}

const SELECT =
  'id, token, label, kind, status, max_items, expires_at, frame_id, submitted_at, created_at'

export type CreateCollectionInput = {
  label?: string
  kind?: CollectionKind
  maxItems?: number
  /** Days until the link stops working. Omit for no expiry. */
  expiresInDays?: number
  createdBy?: string
}

export async function createCollection(input: CreateCollectionInput = {}): Promise<Collection> {
  const token = nanoid(TOKEN_LENGTH)

  // Clamp rather than reject: this is called by admin tooling, and a silly value
  // shouldn't be able to issue a link promising 500 uploads.
  const maxItems = Math.min(Math.max(Math.trunc(input.maxItems ?? ALBUM_MAX_ITEMS), 1), 50)

  const expiresAt =
    input.expiresInDays && input.expiresInDays > 0
      ? new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString()
      : null

  const { data, error } = await supabaseAdmin
    .from('collections')
    .insert({
      token,
      label: (input.label ?? '').slice(0, 200),
      kind: input.kind === 'partner' ? 'partner' : 'customer',
      max_items: maxItems,
      expires_at: expiresAt,
      created_by: (input.createdBy ?? '').slice(0, 200),
    })
    .select(SELECT)
    .single()

  if (error) throw new Error(`Could not create the collection link: ${error.message}`)
  return toCollection(data as CollectionRow)
}

/**
 * Resolve a token to a collection that is currently usable.
 *
 * Returns a reason rather than throwing so callers can show the visitor
 * something specific ("this link has already been used") instead of a 404 —
 * except for a bad token, which stays deliberately vague.
 */
export async function getUsableCollection(
  token: string,
): Promise<{ collection: Collection } | { rejection: CollectionRejection }> {
  if (!isValidTokenFormat(token)) return { rejection: 'not-found' }

  const { data, error } = await supabaseAdmin
    .from('collections')
    .select(SELECT)
    .eq('token', token)
    .maybeSingle()

  if (error || !data) return { rejection: 'not-found' }

  const collection = toCollection(data as CollectionRow)

  if (collection.status === 'submitted') return { rejection: 'submitted' }
  if (collection.status === 'cancelled') return { rejection: 'cancelled' }
  if (collection.expiresAt && Date.parse(collection.expiresAt) < Date.now()) {
    return { rejection: 'expired' }
  }

  return { collection }
}

export class CollectionSubmitError extends Error {}

export type SubmitCollectionInput = {
  items: CollectionItem[]
  contactName: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  note?: string
}

/**
 * Validate and store a submission, closing the link.
 *
 * The `status = 'pending'` filter on the update is what makes this single-use:
 * two submissions racing each other both pass validation, but only the first
 * update matches a pending row, so the second gets no rows back and is rejected.
 * Checking status in JS first would leave a window between check and write.
 */
export async function submitCollection(
  collection: Collection,
  input: SubmitCollectionInput,
): Promise<void> {
  const items = Array.isArray(input.items) ? input.items : []

  if (items.length === 0) {
    throw new CollectionSubmitError('Add at least one photo and video before submitting.')
  }
  if (items.length > collection.maxItems) {
    throw new CollectionSubmitError(`This link accepts at most ${collection.maxItems} pairs.`)
  }
  if (!input.contactName.trim() || !input.contactEmail.trim()) {
    throw new CollectionSubmitError('Your name and email are required.')
  }

  // The security check. The client tells us which R2 keys it uploaded, so without
  // this it could name any key in the bucket — including another collection's
  // uploads — and attach them to its own submission.
  const prefix = uploadPrefix(collection.token)
  for (const item of items) {
    if (!item?.photoKey || !item?.videoKey) {
      throw new CollectionSubmitError('Every entry needs both a photo and a video.')
    }
    if (!item.photoKey.startsWith(prefix) || !item.videoKey.startsWith(prefix)) {
      throw new CollectionSubmitError('Upload keys do not belong to this link.')
    }
  }

  const { data, error } = await supabaseAdmin
    .from('collections')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      items: items.map((it) => ({ photoKey: it.photoKey, videoKey: it.videoKey })),
      contact_name: input.contactName.trim().slice(0, 200),
      contact_email: input.contactEmail.trim().slice(0, 200),
      contact_phone: (input.contactPhone ?? '').trim().slice(0, 40),
      contact_address: (input.contactAddress ?? '').trim().slice(0, 500),
      note: (input.note ?? '').trim().slice(0, 1000),
    })
    .eq('id', collection.id)
    .eq('status', 'pending')
    .select('id')

  if (error) throw new CollectionSubmitError(`Could not save your upload: ${error.message}`)
  if (!data || data.length === 0) {
    throw new CollectionSubmitError('This link has already been used.')
  }
}
