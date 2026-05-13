import { createServerClient } from "@/lib/supabase";

interface LintIssue {
  page_id: string;
  slug: string;
  kind: "broken_link" | "stale" | "low_confidence" | "orphan";
  detail: string;
}

const STALE_DAYS = 90;

export async function lintWiki(): Promise<{ issues: LintIssue[]; run_id: string }> {
  const supabase = createServerClient();
  const startedAt = Date.now();
  const issues: LintIssue[] = [];

  const { data: pages } = await supabase.from("wiki_pages").select("*");
  if (!pages) return { issues: [], run_id: "" };

  const slugSet = new Set(pages.map((p) => p.slug as string));

  for (const p of pages) {
    const page = p as unknown as { id: string; slug: string; links_to: string[]; freshness: string; confidence: number; usage_count: number };

    // 1. links quebrados
    for (const target of page.links_to ?? []) {
      if (!slugSet.has(target)) {
        issues.push({
          page_id: page.id,
          slug: page.slug,
          kind: "broken_link",
          detail: `link para slug inexistente: ${target}`,
        });
      }
    }

    // 2. stale
    const ageDays = (Date.now() - new Date(page.freshness).getTime()) / 86400000;
    if (ageDays > STALE_DAYS) {
      issues.push({
        page_id: page.id,
        slug: page.slug,
        kind: "stale",
        detail: `não atualizada há ${Math.round(ageDays)} dias`,
      });
    }

    // 3. confiança baixa
    if (page.confidence < 0.4) {
      issues.push({
        page_id: page.id,
        slug: page.slug,
        kind: "low_confidence",
        detail: `confidence=${page.confidence}`,
      });
    }

    // 4. órfã (sem usos e sem ser referenciada)
    if (page.usage_count === 0) {
      const referenced = pages.some((other) => {
        const otherLinks = (other as unknown as { links_to: string[] }).links_to ?? [];
        return otherLinks.includes(page.slug);
      });
      if (!referenced) {
        issues.push({
          page_id: page.id,
          slug: page.slug,
          kind: "orphan",
          detail: `nunca usada e não referenciada por nenhuma outra página`,
        });
      }
    }
  }

  const { data: run } = await supabase
    .from("wiki_runs")
    .insert({
      kind: "lint",
      input: {},
      output: { total_issues: issues.length, by_kind: countByKind(issues) },
      duration_ms: Date.now() - startedAt,
    })
    .select("id")
    .single();

  return { issues, run_id: (run?.id as string) ?? "" };
}

function countByKind(issues: LintIssue[]): Record<string, number> {
  return issues.reduce((acc, i) => {
    acc[i.kind] = (acc[i.kind] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
