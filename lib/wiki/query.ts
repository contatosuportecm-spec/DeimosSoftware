import { createServerClient } from '@/lib/supabase'
import type { WikiPage, WikiPageKind } from '@/types/knowledge'

export interface QueryFilters {
  q?: string
  kind?: WikiPageKind | WikiPageKind[]
  niche?: string
  tag?: string
  minConfidence?: number
  limit?: number
  offset?: number
}

export async function queryPages(filters: QueryFilters): Promise<{ pages: WikiPage[]; total: number }> {
  const sb = createServerClient()
  let query = sb.from('wiki_pages').select('*', { count: 'exact' })

  if (filters.q) {
    query = query.textSearch('search_tsv', filters.q, { type: 'websearch', config: 'portuguese' })
  }

  if (filters.kind) {
    const kinds = Array.isArray(filters.kind) ? filters.kind : [filters.kind]
    query = query.in('kind', kinds)
  }

  if (filters.niche) {
    query = query.contains('niches', [filters.niche])
  }

  if (filters.tag) {
    query = query.contains('tags', [filters.tag])
  }

  if (filters.minConfidence) {
    query = query.gte('confidence', filters.minConfidence)
  }

  const limit = filters.limit ?? 200
  const offset = filters.offset ?? 0

  const { data, count, error } = await query
    .order('usage_count', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)

  return { pages: (data ?? []) as WikiPage[], total: count ?? 0 }
}

export async function getPageBySlug(slug: string): Promise<WikiPage | null> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('wiki_pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as WikiPage
}

export async function getPageRevisions(pageId: string) {
  const sb = createServerClient()
  const { data } = await sb
    .from('wiki_revisions')
    .select('*')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false })
    .limit(20)

  return data ?? []
}

export async function getLinkedPages(slugs: string[]): Promise<Pick<WikiPage, 'slug' | 'title' | 'kind'>[]> {
  if (slugs.length === 0) return []
  const sb = createServerClient()
  const { data } = await sb
    .from('wiki_pages')
    .select('slug, title, kind')
    .in('slug', slugs)

  return (data ?? []) as Pick<WikiPage, 'slug' | 'title' | 'kind'>[]
}

export async function getGraphData() {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('wiki_pages')
    .select('id, slug, title, kind, niches, tags, confidence, usage_count, links_to')

  if (error) throw new Error(error.message)

  const pages = (data ?? []) as (WikiPage & { links_to: string[] })[]
  const slugSet = new Set(pages.map(p => p.slug))

  const nodes = pages.map(p => ({
    id: p.slug,
    slug: p.slug,
    title: p.title,
    kind: p.kind,
    niches: p.niches ?? [],
    tags: p.tags ?? [],
    confidence: p.confidence ?? 0.5,
    usage_count: p.usage_count ?? 0,
  }))

  const edges: { source: string; target: string }[] = []
  for (const p of pages) {
    for (const link of (p.links_to ?? [])) {
      if (slugSet.has(link)) {
        edges.push({ source: p.slug, target: link })
      }
    }
  }

  return { nodes, edges }
}

export async function incrementUsage(slug: string) {
  const sb = createServerClient()
  const { data } = await sb
    .from('wiki_pages')
    .select('usage_count')
    .eq('slug', slug)
    .single()

  if (data) {
    await sb
      .from('wiki_pages')
      .update({ usage_count: (data.usage_count ?? 0) + 1 })
      .eq('slug', slug)
  }
}
