import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function GET() {
  const { blobs } = await list({
    prefix: 'references/',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  const images = blobs.map(b => ({ url: b.url, pathname: b.pathname }))
  return NextResponse.json({ images })
}
