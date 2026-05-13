import { NextRequest, NextResponse } from "next/server";
import { getPageBySlug } from "@/lib/wiki/query";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const page = await getPageBySlug(params.slug);
    if (!page) return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
    return NextResponse.json(page);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("wiki_pages").delete().eq("slug", params.slug);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}

// Campos editáveis (whitelist — bloqueia tentativas de alterar id/slug/created_at)
const EDITABLE_FIELDS = [
  "title", "summary", "body_md", "structured",
  "niches", "tags", "links_to", "confidence",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createServerClient();
    const body = await req.json();
    const reason = typeof body.reason === "string" ? body.reason : "manual edit";

    // pega página atual pra criar revisão
    const { data: current } = await supabase
      .from("wiki_pages")
      .select("*")
      .eq("slug", params.slug)
      .maybeSingle();
    if (!current) return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });

    // filtra só campos válidos
    const updates: Record<string, unknown> = { freshness: new Date().toISOString() };
    for (const field of EDITABLE_FIELDS) {
      if (field in body) updates[field] = body[field];
    }

    if (Object.keys(updates).length <= 1) {
      // só freshness — nada útil pra atualizar
      return NextResponse.json(current);
    }

    await supabase.from("wiki_revisions").insert({
      page_id: current.id,
      body_md: (current as { body_md: string }).body_md,
      reason,
      author: "human",
    });

    const { data, error } = await supabase
      .from("wiki_pages")
      .update(updates)
      .eq("slug", params.slug)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/wiki/pages PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
