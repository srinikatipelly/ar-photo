'use client'

import { useState } from 'react'
import Link from 'next/link'
import { compileImageTargets } from '@/app/upload/compile'
import { uploadFileToR2 } from '@/lib/client-upload'
import { AlbumQrPending } from '@/components/album/AlbumQrPending'

// Bulk album import for partners, two sources sharing the same finish line
// (compile .mind in the browser → create the album):
//   • Google Drive — a shared folder is mirrored to R2 by a Trigger.dev task,
//     then we compile + create here.
//   • ZIP — the same folder tree, unzipped in the browser (JSZip), uploaded, then
//     compile + create. No Google/Trigger needed; best for smaller albums.

// Minimal shape we use from a JSZip entry (avoids depending on jszip's namespace types).
type ZEntry = { name: string; dir: boolean; async(type: 'blob'): Promise<Blob> }

type Mode = 'drive' | 'zip'
type PreviewItem = { name: string; photo: string | null; video: string | null; ok: boolean; issue: string | null }
type ZipItem = { name: string; photo: File; video: File }
type Result = { frameId: string; arUrl: string; qrDataUrl: string; count: number }

const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']
const VID_EXT = ['mp4', 'mov', 'm4v', 'qt']

const naturalCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
const extOf = (n: string) => (n.includes('.') ? n.split('.').pop()!.toLowerCase() : '')
const dirOf = (p: string) => { const i = p.lastIndexOf('/'); return i === -1 ? '' : p.slice(0, i) }

const label = 'block text-sm font-medium text-cream/80'
const field = 'mt-1.5 block w-full rounded-xl border border-cream/20 bg-green-deep/60 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-gold-brand'
const primaryBtn = 'rounded-full bg-gold-brand px-6 py-3 text-sm font-bold text-green-deep transition hover:bg-cream disabled:opacity-50'
const ghostBtn = 'rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand'

export default function ImportClient({
  serviceAccountEmail,
  initialMode = 'drive',
  showQr = false,
}: {
  /** Read from the server env so partners can copy it straight into Drive's share dialog. */
  serviceAccountEmail: string | null
  initialMode?: Mode
  /** Partners don't see the QR — an admin releases it after payment. */
  showQr?: boolean
}) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [copied, setCopied] = useState(false)
  const [albumName, setAlbumName] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  // Drive
  const [folder, setFolder] = useState('')
  const [preview, setPreview] = useState<{ items: PreviewItem[]; validCount: number; maxItems: number; overCap: boolean } | null>(null)

  // ZIP
  const [zipItems, setZipItems] = useState<ZipItem[] | null>(null)

  function reset() {
    setError(''); setResult(null); setPreview(null); setZipItems(null); setProgress('')
  }

  // ── Create an album from mirrored/collected item keys + files ────────────────
  async function createFromFiles(items: { photo: File; video: File; name: string }[]) {
    setProgress('Analysing photos for AR tracking…')
    const targetBuffer = await compileImageTargets(items.map((i) => i.photo), (p) =>
      setProgress(`Analysing photos for AR tracking… ${Math.round(p * 100)}%`),
    )
    const targetFile = new File([targetBuffer], 'album.mind', { type: 'application/octet-stream' })

    const keys: { photoKey: string; videoKey: string }[] = []
    for (let i = 0; i < items.length; i++) {
      setProgress(`Uploading photo ${i + 1} of ${items.length}…`)
      const photoKey = await uploadFileToR2(items[i].photo, 'photo', items[i].photo.name || `photo${i}.jpg`)
      setProgress(`Uploading video ${i + 1} of ${items.length}…`)
      const videoKey = await uploadFileToR2(items[i].video, 'video', items[i].video.name || `video${i}.mp4`)
      keys.push({ photoKey, videoKey })
    }
    setProgress('Uploading AR target…')
    const targetKey = await uploadFileToR2(targetFile, 'target', 'album.mind')

    setProgress('Creating your album…')
    const res = await fetch('/api/partner/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: keys, targetKey, customerName: albumName.trim(), source: 'zip' }),
    })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to create the album.')
    return (await res.json()) as Result
  }

  // ── Drive: preview ───────────────────────────────────────────────────────────
  async function handlePreview() {
    reset(); setBusy(true)
    try {
      const res = await fetch('/api/partner/drive/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to read that folder.')
      setPreview(data)
    } catch (e) { setError(e instanceof Error ? e.message : 'Preview failed.') }
    finally { setBusy(false) }
  }

  // ── Drive: import → poll → compile → create ─────────────────────────────────
  async function handleDriveImport() {
    setError(''); setBusy(true)
    try {
      setProgress('Starting import…')
      const res = await fetch('/api/partner/drive/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder, albumName: albumName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to start the import.')
      const jobId = data.jobId as string

      // Poll the mirror job.
      let job: { status: string; items: { photoUrl: string; photoKey: string; videoKey: string; name: string }[]; error?: string; mirrored: number }
      for (;;) {
        await new Promise((r) => setTimeout(r, 2500))
        const jr = await fetch(`/api/partner/import-jobs/${jobId}`)
        job = await jr.json()
        if (job.status === 'error') throw new Error(job.error || 'Import failed while copying from Drive.')
        setProgress(`Copying from Google Drive… ${job.mirrored} item${job.mirrored === 1 ? '' : 's'} done`)
        if (job.status === 'ready') break
      }

      // Pull the mirrored R2 photos back to compile the .mind here (videos stay in R2).
      setProgress('Fetching photos…')
      const items = await Promise.all(
        job.items.map(async (it) => {
          const blob = await fetch(it.photoUrl).then((r) => r.blob())
          const photo = new File([blob], `${it.name}.${extOf(it.photoUrl) || 'jpg'}`, { type: blob.type || 'image/jpeg' })
          return { photo, videoKey: it.videoKey, photoKey: it.photoKey, name: it.name }
        }),
      )

      // Compile + create (photos are already in R2, so we skip re-uploading them).
      setProgress('Analysing photos for AR tracking…')
      const targetBuffer = await compileImageTargets(items.map((i) => i.photo), (p) =>
        setProgress(`Analysing photos for AR tracking… ${Math.round(p * 100)}%`),
      )
      const targetFile = new File([targetBuffer], 'album.mind', { type: 'application/octet-stream' })
      setProgress('Uploading AR target…')
      const targetKey = await uploadFileToR2(targetFile, 'target', 'album.mind')

      setProgress('Creating your album…')
      const cr = await fetch('/api/partner/albums', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((i) => ({ photoKey: i.photoKey, videoKey: i.videoKey })), targetKey, customerName: albumName.trim(), source: 'drive' }),
      })
      if (!cr.ok) throw new Error((await cr.json().catch(() => ({}))).error || 'Unable to create the album.')
      const created = (await cr.json()) as Result
      fetch(`/api/partner/import-jobs/${jobId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ frameId: created.frameId }) }).catch(() => {})
      setResult(created)
    } catch (e) { setError(e instanceof Error ? e.message : 'Import failed.') }
    finally { setBusy(false); setProgress('') }
  }

  // ── ZIP: parse in the browser ────────────────────────────────────────────────
  async function handleZipSelect(file: File | null) {
    reset()
    if (!file) return
    setBusy(true); setProgress('Reading ZIP…')
    try {
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(file)

      // Group files by their parent folder; each folder = one item (1 photo + 1 video).
      const groups = new Map<string, { photo?: ZEntry; video?: ZEntry }>()
      zip.forEach((path: string, entry: ZEntry) => {
        if (entry.dir) return
        const base = path.split('/').pop() || ''
        if (base.startsWith('.') || base.startsWith('__MACOSX')) return
        const dir = dirOf(path)
        if (!dir) return // ignore loose root files — we need one subfolder per item
        const ext = extOf(base)
        const g = groups.get(dir) ?? {}
        if (IMG_EXT.includes(ext)) g.photo = entry
        else if (VID_EXT.includes(ext)) g.video = entry
        groups.set(dir, g)
      })

      const dirs = [...groups.keys()].sort(naturalCompare)
      const items: ZipItem[] = []
      for (const dir of dirs) {
        const g = groups.get(dir)!
        if (!g.photo || !g.video) continue
        const photoBlob = await g.photo.async('blob')
        const videoBlob = await g.video.async('blob')
        const pName = g.photo.name.split('/').pop()!
        const vName = g.video.name.split('/').pop()!
        const pType = IMG_EXT.includes(extOf(pName)) ? `image/${extOf(pName) === 'jpg' ? 'jpeg' : extOf(pName)}` : 'image/jpeg'
        const vType = extOf(vName) === 'mov' || extOf(vName) === 'qt' ? 'video/quicktime' : 'video/mp4'
        items.push({
          name: dir.split('/').pop() || dir,
          photo: new File([photoBlob], pName, { type: pType }),
          video: new File([videoBlob], vName, { type: vType }),
        })
      }

      if (items.length === 0) throw new Error('No photo+video subfolders found in the ZIP. Expected one subfolder per photo, each with a photo and a video.')
      setZipItems(items)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not read the ZIP.') }
    finally { setBusy(false); setProgress('') }
  }

  async function handleZipCreate() {
    if (!zipItems) return
    setError(''); setBusy(true)
    try {
      setResult(await createFromFiles(zipItems))
    } catch (e) { setError(e instanceof Error ? e.message : 'Create failed.') }
    finally { setBusy(false); setProgress('') }
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold-brand/15 text-3xl">🎉</div>
        <h1 className="font-display text-3xl text-cream">Album created</h1>
        <p className="mt-2 text-cream/70">
          {showQr ? `One QR for all ${result.count} photos.` : `All ${result.count} photos are linked to one album.`}
        </p>
        {showQr ? (
          <div className="mt-8 rounded-3xl border border-cream/15 bg-green-mid/40 p-6 text-center">
            {result.qrDataUrl && (
              <div className="mx-auto w-fit rounded-2xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.qrDataUrl} alt="Album QR code" className="h-52 w-52" />
              </div>
            )}
            <p className="mt-4 break-all font-mono text-sm text-cream/60">{result.arUrl}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a href={result.arUrl} target="_blank" rel="noopener noreferrer" className={primaryBtn}>Open AR viewer</a>
              <Link href="/partners" className={ghostBtn}>Back to dashboard</Link>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <AlbumQrPending frameId={result.frameId} count={result.count} />
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={result.arUrl} target="_blank" rel="noopener noreferrer" className={ghostBtn}>Preview the AR album</a>
              <Link href="/partners" className={ghostBtn}>Back to dashboard</Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/partners" className="mb-8 inline-flex items-center gap-1.5 text-sm text-cream/60 hover:text-gold-brand">← Dashboard</Link>
      <span className="eyebrow text-sm font-semibold uppercase tracking-[0.3em] text-gold-brand">Import</span>
      <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Bulk import an album</h1>
      <p className="mt-3 text-cream/70">
        One QR for up to 10 photos. Both sources expect one subfolder per photo, each containing one photo + one video.
      </p>

      {/* Mode tabs */}
      <div className="mt-6 inline-flex rounded-full border border-cream/15 bg-green-mid/30 p-1">
        {(['drive', 'zip'] as Mode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); reset() }}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${mode === m ? 'bg-gold-brand text-green-deep' : 'text-cream/70 hover:text-cream'}`}>
            {m === 'drive' ? 'Google Drive' : 'ZIP file'}
          </button>
        ))}
      </div>

      {error && <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

      {busy && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-cream/15 bg-green-mid/40 p-4 text-sm text-cream/80">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-brand border-t-transparent" />
          {progress || 'Working…'}
        </div>
      )}

      <section className="mt-6 rounded-3xl border border-cream/15 bg-green-mid/40 p-6">
        <label className={label}>Album name <span className="text-cream/40">(optional)</span></label>
        <input value={albumName} onChange={(e) => setAlbumName(e.target.value)} placeholder="e.g. Sharma wedding" className={field} />

        {mode === 'drive' ? (
          <div className="mt-5">
            <label className={label}>Google Drive folder link</label>
            <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="https://drive.google.com/drive/folders/…" className={field} />

            {/* Sharing instructions. Without this step every import fails with a
                "not found" from Drive, so spell out the exact address to share with. */}
            <div className="mt-3 rounded-2xl border border-cream/15 bg-green-deep/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold-brand">Before you import</p>
              {serviceAccountEmail ? (
                <>
                  <p className="mt-2 text-xs leading-relaxed text-cream/70">
                    In Google Drive, open the folder → <span className="text-cream">Share</span> → paste the address
                    below → give it <span className="text-cream">Viewer</span> access → Send.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <code className="min-w-0 flex-1 break-all rounded-xl border border-cream/15 bg-green-deep/70 px-3 py-2 font-mono text-xs text-cream">
                      {serviceAccountEmail}
                    </code>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(serviceAccountEmail)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        } catch {
                          setCopied(false)
                        }
                      }}
                      className="rounded-full border border-cream/25 px-4 py-2 text-xs font-semibold text-cream transition hover:border-gold-brand hover:text-gold-brand"
                    >
                      {copied ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-cream/45">
                    Nothing is shared publicly — only this address can read the folder, and only to copy your files across.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-amber-200">
                  Google Drive import isn&apos;t configured yet (no service account email set). Use the ZIP tab, or
                  contact us and we&apos;ll set it up.
                </p>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={handlePreview} disabled={busy || !folder.trim()} className={ghostBtn}>Preview</button>
              {preview && preview.validCount > 0 && (
                <button onClick={handleDriveImport} disabled={busy} className={primaryBtn}>
                  Import {Math.min(preview.validCount, preview.maxItems)} photo{preview.validCount === 1 ? '' : 's'} →
                </button>
              )}
            </div>

            {preview && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-cream/15">
                {preview.overCap && (
                  <p className="bg-amber-500/15 px-4 py-2 text-xs text-amber-200">
                    {preview.validCount} valid photos found — only the first {preview.maxItems} will be imported.
                  </p>
                )}
                {preview.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 border-t border-cream/10 px-4 py-2.5 text-sm first:border-t-0">
                    <span className="text-cream/80">{it.name}</span>
                    <span className={it.ok ? 'text-cream/50' : 'text-red-300'}>
                      {it.ok ? `${it.photo} · ${it.video}` : (it.issue ?? 'Invalid')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5">
            <label className={label}>ZIP file</label>
            <label className="mt-1.5 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-cream/20 px-4 py-6 text-center transition hover:border-gold-brand/60">
              <span className="text-2xl">🗂️</span>
              <span className="text-sm text-cream/70">{zipItems ? `${zipItems.length} photos detected` : 'Choose a .zip of the folder structure'}</span>
              <input type="file" accept=".zip,application/zip" className="sr-only" onChange={(e) => handleZipSelect(e.target.files?.[0] ?? null)} />
            </label>
            <p className="mt-2 text-xs text-cream/50">Best for smaller albums — the ZIP is unpacked in your browser.</p>

            {zipItems && (
              <>
                <div className="mt-5 overflow-hidden rounded-2xl border border-cream/15">
                  {zipItems.map((it, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 border-t border-cream/10 px-4 py-2.5 text-sm first:border-t-0">
                      <span className="text-cream/80">{it.name}</span>
                      <span className="text-cream/50">{it.photo.name} · {it.video.name}</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleZipCreate} disabled={busy} className={`${primaryBtn} mt-5`}>
                  Create album from {zipItems.length} photo{zipItems.length === 1 ? '' : 's'} →
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
