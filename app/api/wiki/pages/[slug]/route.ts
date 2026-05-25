import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getPageBySlug, getPageRevisions, getLinkedPages } from '@/lib/wiki/query'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const page = await getPageBySlug(params.slug)
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [revisions, linkedPages] = await Promise.all([
      getPageRevisions(page.id),
      getLinkedPages(page.links_to ?? []),
    ])

    // Increment usage
    const sb = createServerClient()
    await sb.from('wiki_pages')
      .update({ usage_count: (page.usage_count ?? 0) + 1 })
      .eq('slug', params.slug)

    return NextResponse.json({ ...page, revisions, linked_pages: linkedPages })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const sb = createServerClient()
    const body = await req.json()

    // Get current page to save revision
    const { data: current } = await sb
      .from('wiki_pages')
      .select('id, body_md')
      .eq('slug', params.slug)
      .single()

    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Save revision if body changed
    if (body.body_md && body.body_md !== current.body_md) {
      await sb.from('wiki_revisions').insert({
        page_id: current.id,
        body_md: current.body_md,
        reason: body.revision_reason ?? 'Edicao manual',
        author: 'human',
      })
    }

    const updateData: Record<string, unknown> = {}
    const allowed = ['title', 'summary', 'body_md', 'kind', 'niches', 'tags', 'links_to', 'confidence', 'structured']
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key]
    }
    updateData.freshness = new Date().toISOString()

    const { data, error } = await sb
      .from('wiki_pages')
      .update(updateData)
      .eq('slug', params.slug)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const sb = createServerClient()
    const { error } = await sb
      .from('wiki_pages')
      .delete()
      .eq('slug', params.slug)

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
