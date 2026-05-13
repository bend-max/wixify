import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { pathname } = await req.json()
  await del(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN })
  return NextResponse.json({ ok: true })
}
