import { createServerClient } from "@/lib/supabase";
import { callClaude } from "@/lib/claude";
import { WikiPage, WikiPageKind, WikiQueryInput, WikiQueryResult } from "@/types";
import { truncate } from "./util";

/**
 * Hybrid search no L2:
 *  - filtra por kinds + niches
 *  - ranking por Postgres full-text (websearch_to_tsquery)
 *  - opcionalmente sintetiza resposta com Claude
 */
export async function queryWiki(input: WikiQueryInput): Promise<WikiQueryResult> {
  const supabase = createServerClient();
  const limit = input.limit ?? 8;

  // Constrói query: usa websearch_to_tsquery (mais tolerante a frases)
  let q = supabase
    .from("wiki_pages")
    .select("*")
    .limit(limit);

  if (input.kinds && input.kinds.length > 0) {
    q = q.in("kind", input.kinds);
  }
  if (input.niches && input.niches.length > 0) {
    q = q.overlaps("niches", input.niches);
  }

  // Filtro full-text via textSearch (tsvector "search_tsv")
  if (input.q && input.q.trim()) {
    q = q.textSearch("search_tsv", input.q.trim(), {
      type: "websearch",
      config: "portuguese",
    });
  } else {
    q = q.order("usage_count", { ascending: false });
  }

  const { data, error } = await q;
  if (error) {
    console.error("[wiki/query]", error);
    throw new Error(`Wiki query failed: ${error.message}`);
  }

  const pages = (data ?? []) as unknown as WikiPage[];

  // increment usage_count (best-effort)
  if (pages.length > 0) {
    void supabase.rpc("noop"); // placeholder — usage update opcional
  }

  // Log do run
  const { data: run } = await supabase
    .from("wiki_runs")
    .insert({
      kind: "query",
      input: input as unknown as Record<string, unknown>,
      output: { count: pages.length, page_ids: pages.map((p) => p.id) },
      page_ids_touched: pages.map((p) => p.id),
    })
    .select("id")
    .single();

  let synthesis: string | undefined;
  if (input.synthesize && pages.length > 0) {
    synthesis = await synthesizePages(input.q, pages);
  }

  return {
    pages,
    synthesis,
    query_run_id: (run?.id as string) ?? "",
  };
}

async function synthesizePages(question: string, pages: WikiPage[]): Promise<string> {
  const context = pages
    .map((p, i) => `[${i + 1}] ${p.kind}/${p.slug} — ${p.title}\n${truncate(p.body_md, 1500)}`)
    .join("\n\n---\n\n");

  const response = await callClaude({
    systemPrompt:
      "Você é um sintetizador de uma wiki interna sobre copywriting de direct response. Responda em português BR, conciso, sempre citando [1], [2] etc para indicar de qual página tirou a informação. Se as páginas não cobrem o assunto, diga 'não há dados suficientes na base'.",
    messages: [
      {
        role: "user",
        content: `Pergunta: ${question}\n\nPáginas relevantes:\n${context}\n\nSíntese:`,
      },
    ],
    maxTokens: 800,
  });

  return response;
}

/** Versão simples de busca para módulos internos (sem síntese, retorna só pages) */
export async function findPages(opts: {
  kinds?: WikiPageKind[];
  niches?: string[];
  slugs?: string[];
  limit?: number;
}): Promise<WikiPage[]> {
  const supabase = createServerClient();
  let q = supabase.from("wiki_pages").select("*").limit(opts.limit ?? 20);

  if (opts.kinds?.length) q = q.in("kind", opts.kinds);
  if (opts.niches?.length) q = q.overlaps("niches", opts.niches);
  if (opts.slugs?.length) q = q.in("slug", opts.slugs);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as WikiPage[];
}

export async function getPageBySlug(slug: string): Promise<WikiPage | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("wiki_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as WikiPage) ?? null;
}
