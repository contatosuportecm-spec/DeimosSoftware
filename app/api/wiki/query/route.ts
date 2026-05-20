import { NextRequest, NextResponse } from 'next/server'
import { queryPages } from '@/lib/wiki/query'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await queryPages(body)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
