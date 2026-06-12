import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const uploadUrl = formData.get('uploadUrl') as string
    const key = formData.get('key') as string

    if (!file || !uploadUrl || !key) {
      return NextResponse.json(
        { error: 'file, uploadUrl, and key are required.' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()

    // Upload to R2 via server (avoids CORS issues)
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Length': file.size.toString(),
      },
    })

    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => '')
      throw new Error(`R2 upload failed (${uploadRes.status}). ${text || 'Please check the file and try again.'}`)
    }

    return NextResponse.json({ success: true, key })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 500 }
    )
  }
}
