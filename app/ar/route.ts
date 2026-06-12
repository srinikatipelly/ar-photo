import { readFileSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  const html = readFileSync(join(process.cwd(), 'public', 'ar-viewer.html'), 'utf-8')

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
