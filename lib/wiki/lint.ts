import { createServerClient } from '@/lib/supabase'
import type { LintReport, LintIssue } from '@/types/knowledge'

export async function lintWiki(): Promise<LintReport> {
  const sb = createServerClient()
  const { data: pages } = await sb
    .from('wiki_pages')
    .select('slug, title, kind, links_to, confidence, freshness, usage_count')

  if (!pages || pages.length === 0) {
    return { broken_links: [], stale: [], orphans: [], low_confidence: [], total_pages: 0, health_score: 100 }
  }

  const slugSet = new Set(pages.map(p => p.slug))
  const linkedTo = new Set<string>()

  const broken_links: LintIssue[] = []
  const stale: LintIssue[] = []
  const orphans: LintIssue[] = []
  const low_confidence: LintIssue[] = []

  const now = Date.now()
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

  for (const page of pages) {
    // Broken links
    for (const link of (page.links_to ?? [])) {
      if (!slugSet.has(link)) {
        broken_links.push({ slug: page.slug, title: page.title, issue: `Link quebrado: ${link}` })
      } else {
        linkedTo.add(link)
      }
    }

    // Stale pages (>30 days without update)
    if (page.freshness && (now - new Date(page.freshness).getTime()) > THIRTY_DAYS) {
      stale.push({ slug: page.slug, title: page.title, issue: 'Sem atualizacao ha mais de 30 dias' })
    }

    // Low confidence
    if ((page.confidence ?? 0) < 0.3) {
      low_confidence.push({ slug: page.slug, title: page.title, issue: `Confidence: ${page.confidence}` })
    }
  }

  // Orphans (not linked by anyone and has no outgoing links)
  for (const page of pages) {
    if (!linkedTo.has(page.slug) && (page.links_to ?? []).length === 0) {
      orphans.push({ slug: page.slug, title: page.title, issue: 'Pagina isolada (sem links de/para)' })
    }
  }

  const issues = broken_links.length + stale.length + orphans.length + low_confidence.length
  const health_score = Math.max(0, Math.round(100 - (issues / pages.length) * 100))

  return {
    broken_links,
    stale,
    orphans,
    low_confidence,
    total_pages: pages.length,
    health_score,
  }
}
