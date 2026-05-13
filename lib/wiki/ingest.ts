import { createServerClient } from "@/lib/supabase";
import { callClaude } from "@/lib/claude";
import {
  RawSource,
  WikiIngestInput,
  WikiIngestResult,
  WikiPage,
  WikiPageKind,
} from "@/types";
import { extractJson, hashContent, truncate, wikiSlug } from "./util";

interface DistilledPage {
  slug?: string;
  kind: WikiPageKind;
  title: string;
  summary: string;
  body_md: string;
  niches?: string[];
  tags?: string[];
  links_to?: string[];
  confidence?: number;
  structured?: Record<string, unknown>;
}

interface DistillResponse {
  pages: DistilledPage[];
}

const DISTILL_SYSTEM = `Você é um destilador de conhecimento para uma wiki de copywriting de direct response.

Sua tarefa: ler a fonte fornecida e produzir 5 a 15 páginas wiki em formato JSON.

Tipos válidos de página (kind):
- voice      → estilo/voz de um copywriter (Halbert, Sugarman…)
- framework  → estrutura formal (16-palavras, Halbert lead, slippery slide…)
- concept    → princípio (PAS, AIDA, níveis de consciência, USP…)
- avatar     → persona de nicho com dores/desejos/objeções/vocabulário
- mechanism  → mecanismo único (enzima café, microbiota…)
- pattern    → padrão concreto (gancho "descoberta acidental", headline "How to X")
- claims     → compliance / claims permitidos por nicho
- lesson     → lição destilada de campanha real

Regras:
1. Cada página tem foco único e título específico (não genérico).
2. body_md em markdown, 200-800 palavras, em PORTUGUÊS BR.
3. summary = 1 frase de até 140 caracteres.
4. links_to = slugs de outras páginas que esta referencia (use kebab-case).
5. confidence 0..1 — quão sólida a evidência. Página de citação direta = 0.9, inferência = 0.5.
6. Se for livro de copywriter, gere 1 página kind=voice + várias kind=framework/concept/pattern dele.
7. NÃO invente dados que não estão na fonte. Se não há evidência, omita.

Responda APENAS um JSON válido no formato:
\`\`\`json
{ "pages": [ { "kind": "...", "title": "...", "summary": "...", "body_md": "...", ... } ] }
\`\`\``;

export async function ingestSource(input: WikiIngestInput): Promise<WikiIngestResult> {
  const supabase = createServerClient();
  const startedAt = Date.now();

  const contentForHash = input.source.content ?? input.source.source_url ?? input.source.title;
  const hash = hashContent(contentForHash);

  // 1. Verifica duplicação por hash
  const { data: existing } = await supabase
    .from("raw_sources")
    .select("*")
    .eq("hash", hash)
    .maybeSingle();

  let rawSource: RawSource;
  if (existing) {
    rawSource = existing as unknown as RawSource;
  } else {
    const { data, error } = await supabase
      .from("raw_sources")
      .insert({
        kind: input.source.kind,
        title: input.source.title,
        author: input.source.author ?? null,
        niche: input.source.niche ?? null,
        content: input.source.content ?? null,
        source_url: input.source.source_url ?? null,
        hash,
        metadata: {},
      })
      .select()
      .single();
    if (error || !data) throw new Error(`raw_sources insert: ${error?.message}`);
    rawSource = data as unknown as RawSource;
  }

  // 2. Se não pediu geração de páginas, retorna só o registro
  if (input.generate_pages === false) {
    const { data: runRow } = await supabase
      .from("wiki_runs")
      .insert({
        kind: "ingest",
        input: { source_id: rawSource.id, generate_pages: false },
        output: { source_id: rawSource.id, pages_created: 0 },
        duration_ms: Date.now() - startedAt,
      })
      .select("id")
      .single();
    return {
      source: rawSource,
      pages_created: [],
      pages_updated: [],
      run_id: (runRow?.id as string) ?? "",
    };
  }

  // 3. Destila com Claude
  const sourceBlob = [
    `Título: ${rawSource.title}`,
    rawSource.author ? `Autor: ${rawSource.author}` : null,
    rawSource.niche ? `Nicho: ${rawSource.niche}` : null,
    rawSource.kind ? `Tipo: ${rawSource.kind}` : null,
    "---",
    rawSource.content ? truncate(rawSource.content, 30000) : "(sem conteúdo textual — use título e contexto)",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callClaude({
    systemPrompt: DISTILL_SYSTEM,
    messages: [{ role: "user", content: sourceBlob }],
    maxTokens: 8000,
  });

  const parsed = extractJson<DistillResponse>(raw);
  if (!parsed?.pages) {
    throw new Error("LLM não retornou JSON válido com pages[]");
  }

  // 4. Upsert das páginas
  const created: WikiPage[] = [];
  const updated: WikiPage[] = [];

  for (const p of parsed.pages) {
    const slug = p.slug ?? wikiSlug(p.kind, p.title);

    // checa se já existe
    const { data: existingPage } = await supabase
      .from("wiki_pages")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    const niches = Array.from(new Set([...(p.niches ?? []), ...(rawSource.niche ? [rawSource.niche] : [])]));

    if (existingPage) {
      // cria revisão e atualiza
      await supabase.from("wiki_revisions").insert({
        page_id: existingPage.id,
        body_md: (existingPage as { body_md: string }).body_md,
        reason: `pre-update by ingest of "${rawSource.title}"`,
        author: "system",
      });

      const newSourceRefs = Array.from(
        new Set([...(existingPage as { source_refs: string[] }).source_refs ?? [], rawSource.id]),
      );

      const { data: upd, error: upErr } = await supabase
        .from("wiki_pages")
        .update({
          title: p.title,
          summary: p.summary,
          body_md: p.body_md,
          structured: p.structured ?? {},
          niches,
          tags: p.tags ?? [],
          links_to: p.links_to ?? [],
          source_refs: newSourceRefs,
          confidence: p.confidence ?? 0.6,
          freshness: new Date().toISOString(),
        })
        .eq("id", existingPage.id)
        .select()
        .single();
      if (!upErr && upd) updated.push(upd as unknown as WikiPage);
    } else {
      const { data: ins, error: insErr } = await supabase
        .from("wiki_pages")
        .insert({
          slug,
          kind: p.kind,
          title: p.title,
          summary: p.summary,
          body_md: p.body_md,
          structured: p.structured ?? {},
          niches,
          tags: p.tags ?? [],
          links_to: p.links_to ?? [],
          source_refs: [rawSource.id],
          confidence: p.confidence ?? 0.6,
        })
        .select()
        .single();
      if (!insErr && ins) created.push(ins as unknown as WikiPage);
    }
  }

  // 5. Log
  const { data: runRow } = await supabase
    .from("wiki_runs")
    .insert({
      kind: "ingest",
      input: { source_id: rawSource.id, title: rawSource.title },
      output: {
        source_id: rawSource.id,
        pages_created: created.length,
        pages_updated: updated.length,
      },
      page_ids_touched: [...created, ...updated].map((p) => p.id),
      duration_ms: Date.now() - startedAt,
    })
    .select("id")
    .single();

  return {
    source: rawSource,
    pages_created: created,
    pages_updated: updated,
    run_id: (runRow?.id as string) ?? "",
  };
}
