import { google, type drive_v3 } from 'googleapis'

// Google Drive access via a SERVICE ACCOUNT (not per-partner OAuth). Customers
// share their event folder with the service-account email; we read it here. No
// Google restricted-scope verification needed. Plain module (no Next imports) so
// both the API routes and the Trigger.dev task can use it.
//
// Env: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
// (paste the key with real newlines, or with literal \n — both handled).

export type DriveFile = { id: string; name: string; mimeType: string; size?: number }

export type AlbumItemPreview = {
  name: string          // subfolder name
  folderId: string
  photo: DriveFile | null
  video: DriveFile | null
  ok: boolean
  issue?: string
}

export type AlbumEnumeration = {
  folderId: string
  items: AlbumItemPreview[]
  validCount: number
}

const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

/** Accept a raw folder id OR a Drive folder URL and return the id. */
export function extractFolderId(input: string): string {
  const s = (input || '').trim()
  if (!s) throw new Error('A Google Drive folder link or id is required.')
  // .../folders/<id>  or  ?id=<id>  or  /drive/folders/<id>
  const m = s.match(/\/folders\/([a-zA-Z0-9_-]+)/) || s.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (m) return m[1]
  // Looks like a bare id already.
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s)) return s
  throw new Error('Could not read a folder id from that link. Paste the Drive folder URL or id.')
}

export function getDrive(): drive_v3.Drive {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!email || !rawKey) {
    throw new Error('Google Drive is not configured (GOOGLE_SERVICE_ACCOUNT_EMAIL / _PRIVATE_KEY).')
  }
  const privateKey = normalizePem(rawKey)
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  return google.drive({ version: 'v3', auth })
}

/**
 * Rebuild a PEM from however a dashboard mangled it. Env-var editors take the
 * value literally, so a pasted key can arrive wrapped in quotes, with CRLFs,
 * with literal \n instead of newlines, or — Trigger.dev's field does this —
 * with every newline flattened to a space. Any of those makes Node throw the
 * opaque "error:1E08010C:DECODER routines::unsupported", which names neither
 * the variable nor the problem.
 *
 * We keep only the header, the base64 body, and the footer, then re-wrap the
 * body at the canonical 64 chars.
 */
export function normalizePem(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^['"]|['"]$/g, '') // stray wrapping quotes
    .replace(/\\n/g, '\n') // literal backslash-n
    .replace(/\r/g, '')

  const m = cleaned.match(/-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/)
  if (!m) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is malformed — it must contain "-----BEGIN PRIVATE KEY-----" … "-----END PRIVATE KEY-----". Re-paste it from the service-account JSON without the wrapping quotes.',
    )
  }

  const [, label, rawBody] = m
  const body = rawBody.replace(/\s+/g, '') // drop spaces/newlines the editor left behind
  if (!body || /[^A-Za-z0-9+/=]/.test(body)) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is malformed — the key body is not valid base64. Copy the "private_key" value straight from the service-account JSON.',
    )
  }

  const wrapped = body.match(/.{1,64}/g)!.join('\n')
  return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----\n`
}

const SHARED = { supportsAllDrives: true, includeItemsFromAllDrives: true } as const

async function listChildren(drive: drive_v3.Drive, folderId: string, extraQ = ''): Promise<DriveFile[]> {
  const files: DriveFile[] = []
  let pageToken: string | undefined
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false${extraQ}`,
      fields: 'nextPageToken, files(id, name, mimeType, size)',
      pageSize: 200,
      pageToken,
      ...SHARED,
    })
    for (const f of res.data.files ?? []) {
      files.push({ id: f.id!, name: f.name ?? '', mimeType: f.mimeType ?? '', size: f.size ? Number(f.size) : undefined })
    }
    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)
  return files
}

const FOLDER_MIME = 'application/vnd.google-apps.folder'

/**
 * Read an event folder: each immediate subfolder = one album item (one image +
 * one video). Returns items in natural-sorted subfolder order, with per-item
 * validation. No downloads — safe/quick for the preview step.
 */
export async function enumerateAlbum(folderId: string): Promise<AlbumEnumeration> {
  const drive = getDrive()

  const children = await listChildren(drive, folderId)
  const subfolders = children
    .filter((f) => f.mimeType === FOLDER_MIME)
    .sort((a, b) => naturalCompare(a.name, b.name))

  if (subfolders.length === 0) {
    throw new Error(
      'No subfolders found. Expected one subfolder per photo (each containing one photo + one video). ' +
        'Also check the folder is shared with the service-account email.',
    )
  }

  const items: AlbumItemPreview[] = []
  for (const sf of subfolders) {
    const inner = await listChildren(drive, sf.id)
    const images = inner.filter((f) => f.mimeType.startsWith('image/'))
    const videos = inner.filter((f) => f.mimeType.startsWith('video/'))

    let ok = true
    let issue: string | undefined
    if (images.length === 0) { ok = false; issue = 'No photo found' }
    else if (videos.length === 0) { ok = false; issue = 'No video found' }
    else if (images.length > 1) { ok = false; issue = 'More than one photo' }
    else if (videos.length > 1) { ok = false; issue = 'More than one video' }

    items.push({
      name: sf.name,
      folderId: sf.id,
      photo: images[0] ?? null,
      video: videos[0] ?? null,
      ok,
      issue,
    })
  }

  return { folderId, items, validCount: items.filter((i) => i.ok).length }
}

/** Stream a Drive file to a Node writable (used by the Trigger mirror task). */
export async function downloadFile(fileId: string): Promise<NodeJS.ReadableStream> {
  const drive = getDrive()
  const res = await drive.files.get(
    { fileId, alt: 'media', ...SHARED },
    { responseType: 'stream' },
  )
  return res.data as unknown as NodeJS.ReadableStream
}
