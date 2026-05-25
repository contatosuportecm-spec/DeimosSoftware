/* ═══ Knowledge System Types ═══ */

export type WikiPageKind =
  | 'voice'
  | 'framework'
  | 'concept'
  | 'avatar'
  | 'mechanism'
  | 'pattern'
  | 'claims'
  | 'lesson'
  | 'finance'
  | 'legal'
  | 'operations'
  | 'strategy'
  | 'process'
  | 'sop'
  | 'template'
  | 'meeting'
  | 'metric'
  | 'resource'

export type RawSourceKind =
  | 'book'
  | 'transcript'
  | 'swipe'
  | 'competitor_asset'
  | 'review_corpus'
  | 'manual'

export type WikiRunKind =
  | 'ingest'
  | 'query'
  | 'lint'
  | 'distill'
  | 'consult'
  | 'evaluate'

/* ── Wiki Page ── */
export interface WikiPage {
  id: string
  slug: string
  kind: WikiPageKind
  title: string
  summary: string | null
  body_md: string
  structured: Record<string, unknown>
  niches: string[]
  tags: string[]
  source_refs: string[]
  links_to: string[]
  confidence: number
  freshness: string
  usage_count: number
  created_at: string
  updated_at: string
}

/* ── Graph structures ── */
export interface WikiNode {
  id: string
  slug: string
  title: string
  kind: WikiPageKind
  niches: string[]
  tags: string[]
  confidence: number
  usage_count: number
}

export interface WikiEdge {
  source: string
  target: string
}

export interface GraphData {
  nodes: WikiNode[]
  edges: WikiEdge[]
}

/* ── Raw Source ── */
export interface RawSource {
  id: string
  kind: RawSourceKind
  title: string
  author: string | null
  niche: string | null
  content: string | null
  file_url: string | null
  source_url: string | null
  hash: string
  metadata: Record<string, unknown>
  ingested_at: string
}

/* ── Revision ── */
export interface WikiRevision {
  id: string
  page_id: string
  body_md: string
  reason: string | null
  author: string
  created_at: string
}

/* ── Ingest result ── */
export interface IngestResult {
  source_id: string
  pages_created: number
  pages_updated: number
  slugs: string[]
}

/* ── Lint report ── */
export interface LintIssue {
  slug: string
  title: string
  issue: string
}

export interface LintReport {
  broken_links: LintIssue[]
  stale: LintIssue[]
  orphans: LintIssue[]
  low_confidence: LintIssue[]
  total_pages: number
  health_score: number
}

/* ── Kind metadata ── */
export const KIND_META: Record<WikiPageKind, { label: string; color: string; emoji: string }> = {
  voice:      { label: 'Copywriter',  color: '#F4C430', emoji: 'pen-tool' },
  mechanism:  { label: 'Mecanismo',   color: '#FF8A1F', emoji: 'cog' },
  framework:  { label: 'Framework',   color: '#5B8CFF', emoji: 'layout' },
  pattern:    { label: 'Padrao',      color: '#34D399', emoji: 'repeat' },
  concept:    { label: 'Conceito',    color: '#A78BFA', emoji: 'lightbulb' },
  avatar:     { label: 'Avatar',      color: '#F472B6', emoji: 'user' },
  claims:     { label: 'Compliance',  color: '#EF4444', emoji: 'shield' },
  lesson:     { label: 'Licao',       color: '#2DD4BF', emoji: 'graduation-cap' },
  finance:    { label: 'Financeiro',  color: '#FBBF24', emoji: 'dollar-sign' },
  legal:      { label: 'Juridico',    color: '#F87171', emoji: 'scale' },
  operations: { label: 'Operacoes',   color: '#60A5FA', emoji: 'settings' },
  strategy:   { label: 'Estrategia',  color: '#C084FC', emoji: 'target' },
  process:    { label: 'Processo',    color: '#4ADE80', emoji: 'git-branch' },
  sop:        { label: 'SOP',         color: '#FB923C', emoji: 'clipboard-list' },
  template:   { label: 'Template',    color: '#94A3B8', emoji: 'file-text' },
  meeting:    { label: 'Reuniao',     color: '#38BDF8', emoji: 'calendar' },
  metric:     { label: 'Metrica',     color: '#E879F9', emoji: 'bar-chart-2' },
  resource:   { label: 'Recurso',     color: '#A3E635', emoji: 'bookmark' },
}

export const ALL_KINDS = Object.keys(KIND_META) as WikiPageKind[]
