import { createServerClient } from '@/lib/supabase'
import { callClaude } from '@/lib/claude'
import { hashContent, makeSlug, extractJSON } from './util'
import type { RawSourceKind, IngestResult, WikiPageKind } from '@/types/knowledge'

interface IngestInput {
  kind: RawSourceKind
  title: string
  author?: string
  niche?: string
  content: string
  source_url?: string
  file_url?: string
}

interface DestiledPage {
  kind: WikiPageKind
  title: string
  summary: string
  body_md: string
  niches: string[]
  tags: string[]
  links_to: string[]
  confidence: number
}

const DISTILL_PROMPT = `Voce e um assistente de gestao de conhecimento empresarial. Recebera um documento bruto e deve destila-lo em PAGINAS DE CONHECIMENTO estruturadas.

Cada pagina deve ter:
- kind: um dos tipos (voice, framework, concept, avatar, mechanism, pattern, claims, lesson, finance, legal, operations, strategy, process, sop, template, meeting, metric, resource)
- title: titulo claro e descritivo
- summary: 1 linha resumindo
- body_md: conteudo completo em markdown (minimo 200 chars)
- niches: array de nichos relevantes (ex: ["emagrecimento", "saude"]) ou [] se geral
- tags: array de tags uteis para busca
- links_to: array de slugs de paginas relacionadas que voce SUGERE (formato: "kind--titulo-slugificado")
- confidence: 0.0 a 1.0 baseado na qualidade/completude da informacao

REGRAS:
- Extraia TODAS as paginas relevantes do documento (pode ser 1 ou 20+)
- Use kind adequado: financeiro→finance, contrato/juridico→legal, processo/SOP→process ou sop, estrategia→strategy, metrica/KPI→metric, copy/headline→pattern, etc.
- body_md deve ser autocontido e util sem o documento original
- Se o documento menciona conceitos que mereceriam paginas proprias, sugira em links_to
- Nao invente informacao — extraia fielmente do documento

Responda APENAS com JSON array:
\`\`\`json
[{ "kind": "...", "title": "...", "summary": "...", "body_md": "...", "niches": [...], "tags": [...], "links_to": [...], "confidence": 0.X }]
\`\`\``

export async function ingestSource(input: IngestInput): Promise<IngestResult> {
  const sb = createServerClient()
  const hash = await hashContent(input.content)

  // Check duplicate
  const { data: existing } = await sb
    .from('raw_sources')
    .select('id')
    .eq('hash', hash)
    .single()

  if (existing) {
    return { source_id: existing.id, pages_created: 0, pages_updated: 0, slugs: [] }
  }

  // Save raw source
  const { data: source, error: srcErr } = await sb
    .from('raw_sources')
    .insert({
      kind: input.kind,
      title: input.title,
      author: input.author ?? null,
      niche: input.niche ?? null,
      content: input.content.slice(0, 500_000), // cap at 500k chars
      file_url: input.file_url ?? null,
      source_url: input.source_url ?? null,
      hash,
    })
    .select('id')
    .single()

  if (srcErr || !source) throw new Error(srcErr?.message ?? 'Failed to save source')

  // Get existing pages for context (to avoid duplicates and enable linking)
  const { data: existingPages } = await sb
    .from('wiki_pages')
    .select('slug, title, kind')
    .limit(200)

  const existingSlugs = (existingPages ?? []).map(p => `${p.kind}--${p.slug}: ${p.title}`).join('\n')

  // Distill via LLM
  const contextSnippet = input.content.slice(0, 80_000) // ~20k tokens
  const userMsg = `DOCUMENTO PARA DESTILAR:
Titulo: ${input.title}
${input.author ? `Autor: ${input.author}` : ''}
${input.niche ? `Nicho: ${input.niche}` : ''}

--- CONTEUDO ---
${contextSnippet}

--- PAGINAS EXISTENTES NO SISTEMA (para referencia de links_to) ---
${existingSlugs || '(nenhuma ainda)'}

Destile este documento em paginas de conhecimento.`

  const result = await callClaude({
    messages: [{ role: 'user', content: userMsg }],
    systemPrompt: DISTILL_PROMPT,
    maxTokens: 8000,
    temperature: 0.3,
  })

  const pages = extractJSON<DestiledPage[]>(result)
  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    throw new Error('LLM failed to produce valid pages')
  }

  // Upsert pages
  let created = 0
  let updated = 0
  const slugs: string[] = []

  for (const page of pages) {
    const slug = makeSlug(page.kind, page.title)
    slugs.push(slug)

    const { data: existingPage } = await sb
      .from('wiki_pages')
      .select('id, body_md')
      .eq('slug', slug)
      .single()

    if (existingPage) {
      // Save revision before updating
      await sb.from('wiki_revisions').insert({
        page_id: existingPage.id,
        body_md: existingPage.body_md,
        reason: `Atualizado via ingest: ${input.title}`,
        author: 'llm',
      })

      await sb.from('wiki_pages').update({
        body_md: page.body_md,
        summary: page.summary,
        tags: page.tags,
        links_to: page.links_to,
        confidence: Math.min(1, (page.confidence + 0.1)),
      }).eq('slug', slug)

      updated++
    } else {
      await sb.from('wiki_pages').insert({
        slug,
        kind: page.kind,
        title: page.title,
        summary: page.summary,
        body_md: page.body_md,
        niches: page.niches ?? [],
        tags: page.tags ?? [],
        links_to: page.links_to ?? [],
        source_refs: [source.id],
        confidence: page.confidence ?? 0.5,
      })
      created++
    }
  }

  // Log the run
  await sb.from('wiki_runs').insert({
    kind: 'ingest',
    input: { source_id: source.id, title: input.title },
    output: { pages_created: created, pages_updated: updated, slugs },
    page_ids_touched: [],
    tokens_used: null,
  })

  return { source_id: source.id, pages_created: created, pages_updated: updated, slugs }
}
