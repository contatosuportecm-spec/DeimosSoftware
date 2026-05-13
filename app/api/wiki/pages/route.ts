import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { WikiPageKind } from "@/types";
import { wikiSlug } from "@/lib/wiki/util";

export const dynamic = "force-dynamic";

// GET /api/wiki/pages?kind=voice&niche=emagrecimento
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind");
    const niche = searchParams.get("niche");
    const limit = Number(searchParams.get("limit") ?? 100);

    let q = supabase
      .from("wiki_pages")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (kind) q = q.eq("kind", kind);
    if (niche) q = q.overlaps("niches", [niche]);

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[api/wiki/pages GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}

interface CreatePageBody {
  slug?: string;
  kind: WikiPageKind;
  title: string;
  summary?: string;
  body_md: string;
  niches?: string[];
  tags?: string[];
  links_to?: string[];
  confidence?: number;
  structured?: Record<string, unknown>;
}

// POST /api/wiki/pages — cria nova página manualmente
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreatePageBody;
    if (!body.kind || !body.title?.trim() || !body.body_md?.trim()) {
      return NextResponse.json(
        { error: "kind, title e body_md são obrigatórios" },
        { status: 400 },
      );
    }

    const slug = body.slug?.trim() || wikiSlug(body.kind, body.title);
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("wiki_pages")
      .insert({
        slug,
        kind: body.kind,
        title: body.title.trim(),
        summary: body.summary?.trim() ?? null,
        body_md: body.body_md,
        niches: body.niches ?? [],
        tags: body.tags ?? [],
        links_to: body.links_to ?? [],
        confidence: body.confidence ?? 0.5,
        structured: body.structured ?? {},
        source_refs: [],
      })
      .select()
      .single();

    if (error) {
      const msg = error.message.includes("duplicate")
        ? `Slug já existe: ${slug}`
        : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[api/wiki/pages POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
