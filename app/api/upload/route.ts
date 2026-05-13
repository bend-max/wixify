import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const blob = await put(`references/${Date.now()}-${file.name}`, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  return NextResponse.json({ url: blob.url })
}
