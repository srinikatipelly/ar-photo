// Client-side R2 uploader: asks the app for a presigned PUT URL, then uploads the
// file straight to R2 (bypasses Vercel body limits). Shared by the album builder
// and the ZIP import so there's one implementation.

export async function uploadFileToR2(
  file: File | Blob,
  type: 'photo' | 'video' | 'target',
  filename: string,
): Promise<string> {
  const res = await fetch('/api/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType: file.type || 'application/octet-stream', type }),
  })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.error || 'Unable to get an upload URL.')
  }
  const { uploadUrl, key } = await res.json()

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed. Please try again.')))
    xhr.onerror = () => reject(new Error('Upload failed. Please try again.'))
    xhr.send(file)
  })

  return key
}
