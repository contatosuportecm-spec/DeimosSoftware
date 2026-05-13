import { callClaude } from "@/lib/claude";
import { createServerClient } from "@/lib/supabase";
import { CompetitorExtracted, CompetitorOffer, RawSource, WikiPage } from "@/types";
import { extractJson, hashContent, wikiSlug } from "@/lib/wiki/util";

const DESTILL_SYSTEM = `Você é um analista de copy de direct response. Extrai ESTRUTURALMENTE uma oferta concorrente.

Sua saída é JSON estrito. Não acrescente teoria, não invente — só extraia o que está no texto.

Campos:
- name (nome do produto/oferta — se não claro, gere um label do tipo "[nicho] oferta-Y")
- niche (emagrecimento, saude-masculina, renda-extra, beleza, relacionamento, geral)
- hook (1-2 frases, a abertura que prende atenção)
- big_idea (1 frase — a ideia central da oferta)
- mechanism (mecanismo único usado — nome + breve descrição)
- proof (lista de proof points usados — estudos, depoimentos, números)
- offer (o que está sendo oferecido + preço se mencionado)
- guarantee (texto literal da garantia se houver)
- cta (chamada à ação principal)
- consciousness_level (1-5 segundo Schwartz — diagnostique pelo tom)
- objections_addressed (lista — quais objeções a copy antecipa)
- visual_angle (formato/ângulo visual se aplicável: antes-depois, demo, depoimento, etc)
- vocabulary_notable (5-10 palavras/expressões marcantes usadas)
- patterns_used (lista de padrões reconhecíveis: descoberta-acidental, inimigo-comum, especificidade-numerica, etc)

Responda APENAS JSON:
\`\`\`json
{ "name": "...", "niche": "...", "hook": "...", ... }
\`\`\``;

export interface DestillInput {
  source_url?: string;
  raw_text: string;            // copy/transcript do concorrente
  name_hint?: string;
  niche_hint?: string;
  spy_offer_id?: string;
}

export interface DestillResult {
  competitor_offer: CompetitorOffer;
  raw_source: RawSource;
  pages_touched: WikiPage[];
}

export async function destillCompetitor(input: DestillInput): Promise<DestillResult> {
  const supabase = createServerClient();
  const startedAt = Date.now();

  // 1. salvar raw_source
  const hash = hashContent(input.raw_text);
  let rawSource: RawSource;

  const { data: existing } = await supabase
    .from("raw_sources")
    .select("*")
    .eq("hash", hash)
    .maybeSingle();

  if (existing) {
    rawSource = existing as unknown as RawSource;
  } else {
    const { data, error } = await supabase
      .from("raw_sources")
      .insert({
        kind: "competitor_asset",
        title: input.name_hint ?? `Concorrente ${new Date().toISOString().slice(0, 10)}`,
        niche: input.niche_hint ?? null,
        content: input.raw_text,
        source_url: input.source_url ?? null,
        hash,
        metadata: { spy_offer_id: input.spy_offer_id },
      })
      .select()
      .single();
    if (error || !data) throw new Error(`raw_sources insert: ${error?.message}`);
    rawSource = data as unknown as RawSource;
  }

  // 2. destilar com LLM
  const raw = await callClaude({
    systemPrompt: DESTILL_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${input.name_hint ? `Hint nome: ${input.name_hint}\n` : ""}${input.niche_hint ? `Hint nicho: ${input.niche_hint}\n\n` : ""}TEXTO DA OFERTA:\n"""\n${input.raw_text.slice(0, 25000)}\n"""`,
      },
    ],
    maxTokens: 3000,
  });

  type ParsedShape = CompetitorExtracted & {
    name?: string;
    niche?: string;
    patterns_used?: string[];
  };
  const parsed = extractJson<ParsedShape>(raw) ?? ({} as ParsedShape);
  const name = parsed.name ?? input.name_hint ?? "Concorrente sem nome";
  const niche = parsed.niche ?? input.niche_hint ?? null;

  // 3. cria/atualiza páginas L2 relacionadas
  const pagesTouched: WikiPage[] = [];

  // 3a. mechanism: cria/incrementa se mencionou
  if (parsed.mechanism) {
    const slug = wikiSlug("mechanism", parsed.mechanism.split(/[—\(:]/)[0].trim());
    const page = await upsertOrIncrement(slug, "mechanism", {
      title: parsed.mechanism.split(/[—\(:]/)[0].trim(),
      summary: parsed.mechanism,
      body_md: `# Mecanismo: ${parsed.mechanism}\n\nObservado pela primeira vez em: ${name}\n\nContexto:\n> ${parsed.hook ?? ""}\n\n_Auto-destilado de concorrente. Validar manualmente._`,
      niches: niche ? [niche] : [],
      tags: ["auto-destilado"],
      source_refs: [rawSource.id],
      confidence: 0.5,
    });
    if (page) pagesTouched.push(page);
  }

  // 3b. patterns: cria/incrementa
  for (const patternName of parsed.patterns_used ?? []) {
    const slug = wikiSlug("pattern", patternName);
    const page = await upsertOrIncrement(slug, "pattern", {
      title: patternName,
      summary: `Padrão usado em "${name}"`,
      body_md: `# Pattern: ${patternName}\n\nObservado em: ${name}\nHook: ${parsed.hook ?? "—"}\n\n_Auto-destilado. Verificar e enriquecer._`,
      niches: niche ? [niche] : [],
      tags: ["auto-destilado"],
      source_refs: [rawSource.id],
      confidence: 0.5,
    });
    if (page) pagesTouched.push(page);
  }

  // 4. salvar competitor_offers
  const { data: competitor, error: cErr } = await supabase
    .from("competitor_offers")
    .insert({
      name,
      niche,
      source_url: input.source_url ?? null,
      raw_source_id: rawSource.id,
      extracted: parsed as unknown as Record<string, unknown>,
      l2_page_ids: pagesTouched.map((p) => p.id),
      spy_offer_id: input.spy_offer_id ?? null,
    })
    .select()
    .single();
  if (cErr) throw new Error(`competitor_offers: ${cErr.message}`);

  // 5. log
  await supabase.from("wiki_runs").insert({
    kind: "distill",
    input: { name, niche, source_url: input.source_url },
    output: {
      competitor_offer_id: (competitor as { id: string }).id,
      pages_touched: pagesTouched.length,
    },
    page_ids_touched: pagesTouched.map((p) => p.id),
    duration_ms: Date.now() - startedAt,
  });

  return {
    competitor_offer: competitor as unknown as CompetitorOffer,
    raw_source: rawSource,
    pages_touched: pagesTouched,
  };
}

async function upsertOrIncrement(
  slug: string,
  kind: WikiPage["kind"],
  payload: Pick<WikiPage, "title" | "summary" | "body_md" | "niches" | "tags" | "source_refs" | "confidence">,
): Promise<WikiPage | null> {
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("wiki_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    const oldNiches = (existing as { niches: string[] }).niches ?? [];
    const oldRefs = (existing as { source_refs: string[] }).source_refs ?? [];
    const oldUsage = (existing as { usage_count: number }).usage_count ?? 0;
    const { data, error } = await supabase
      .from("wiki_pages")
      .update({
        niches: Array.from(new Set([...oldNiches, ...payload.niches])),
        source_refs: Array.from(new Set([...oldRefs, ...payload.source_refs])),
        usage_count: oldUsage + 1,
        freshness: new Date().toISOString(),
      })
      .eq("slug", slug)
      .select()
      .single();
    if (error) return null;
    return data as unknown as WikiPage;
  }

  const { data, error } = await supabase
    .from("wiki_pages")
    .insert({
      slug,
      kind,
      ...payload,
    })
    .select()
    .single();
  if (error) return null;
  return data as unknown as WikiPage;
}
