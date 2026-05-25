import { NextResponse } from 'next/server'
import { lintWiki } from '@/lib/wiki/lint'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const report = await lintWiki()
    return NextResponse.json(report)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
