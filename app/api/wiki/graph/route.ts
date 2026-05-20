import { NextResponse } from 'next/server'
import { getGraphData } from '@/lib/wiki/query'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getGraphData()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
