import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerClient();

  // Fetch from both persona_offers and offer_briefings
  const [personaRes, briefingRes] = await Promise.all([
    supabase.from("persona_offers").select("*").order("created_at", { ascending: false }),
    supabase.from("offer_briefings").select("id, offer_name, niche, promise, main_headline, target_audience, main_pains, main_desires, new_mechanism, product_name, price, guarantee, main_cta, created_at, updated_at").order("created_at", { ascending: false }),
  ]);

  const personaOffers = (personaRes.data || []).map((o) => ({
    ...o,
    source: "test" as const,
  }));

  const briefingOffers = (briefingRes.data || []).map((b) => ({
    id: b.id,
    persona_id: null,
    title: b.offer_name,
    content: [
      b.main_headline && `Headline: ${b.main_headline}`,
      b.promise && `Promessa: ${b.promise}`,
      b.new_mechanism && `Mecanismo: ${b.new_mechanism}`,
      b.target_audience && `Publico: ${b.target_audience}`,
      b.main_pains?.length && `Dores: ${b.main_pains.join(", ")}`,
      b.main_desires?.length && `Desejos: ${b.main_desires.join(", ")}`,
      b.product_name && `Produto: ${b.product_name}`,
      b.price && `Preco: R$${b.price}`,
      b.guarantee && `Garantia: ${b.guarantee}`,
      b.main_cta && `CTA: ${b.main_cta}`,
    ].filter(Boolean).join("\n"),
    last_report: null,
    niche: b.niche,
    created_at: b.created_at,
    updated_at: b.updated_at,
    source: "briefing" as const,
  }));

  return NextResponse.json([...briefingOffers, ...personaOffers], { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const { title, content, last_report, persona_id } = (await req.json()) as {
    title: string;
    content: string;
    last_report?: Record<string, unknown>;
    persona_id?: string;
  };
  if (!title?.trim() || !content?.trim())
    return NextResponse.json({ error: "Titulo e conteudo obrigatorios" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("persona_offers")
    .insert({
      persona_id: persona_id || null,
      title: title.trim(),
      content: content.trim(),
      last_report: last_report || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
