import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getUploadUrl } from '@/lib/r2'

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType, type } = await req.json()

    const ext = filename.split('.').pop() ?? 'bin'
    const key = `${type}s/${nanoid()}.${ext}`

    const uploadUrl = await getUploadUrl(key, contentType)

    return NextResponse.json({ uploadUrl, key })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create the upload URL.' }, { status: 500 })
  }
}
