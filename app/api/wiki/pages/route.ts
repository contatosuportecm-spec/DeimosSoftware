import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { queryPages } from '@/lib/wiki/query'
import type { WikiPageKind } from '@/types/knowledge'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams
    const q = url.get('q') ?? undefined
    const kind = url.get('kind') as WikiPageKind | null
    const niche = url.get('niche') ?? undefined
    const tag = url.get('tag') ?? undefined
    const limit = url.get('limit') ? Number(url.get('limit')) : undefined

    const kinds = kind ? kind.split(',') as WikiPageKind[] : undefined

    const result = await queryPages({ q, kind: kinds, niche, tag, limit })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sb = createServerClient()

    const { data, error } = await sb
      .from('wiki_pages')
      .insert({
        slug: body.slug,
        kind: body.kind,
        title: body.title,
        summary: body.summary ?? null,
        body_md: body.body_md,
        niches: body.niches ?? [],
        tags: body.tags ?? [],
        links_to: body.links_to ?? [],
        confidence: body.confidence ?? 0.5,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
