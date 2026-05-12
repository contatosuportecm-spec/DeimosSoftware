import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { CreateOfferBriefingInput, OfferBriefing } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/offer-briefings — lista todos os briefings
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("offer_briefings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[api/offer-briefings GET]", err);
    return NextResponse.json({ error: "Erro ao buscar briefings" }, { status: 500 });
  }
}

// POST /api/offer-briefings — cria briefing como draft
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CreateOfferBriefingInput;

    if (!body.offer_name?.trim()) {
      return NextResponse.json(
        { error: "offer_name e obrigatorio" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("offer_briefings")
      .insert({
        offer_name: body.offer_name.trim(),
        niche: body.niche || "geral",
        ticket: body.ticket || null,

        new_opportunity: body.new_opportunity || null,
        desire: body.desire || null,
        new_mechanism: body.new_mechanism || null,
        promise: body.promise || null,
        protocol: body.protocol || null,
        tangible_result: body.tangible_result || null,
        result_timeline: body.result_timeline || null,
        full_result_timeline: body.full_result_timeline || null,
        target_audience: body.target_audience || null,
        main_pains: body.main_pains ?? [],
        main_desires: body.main_desires ?? [],
        failed_attempts: body.failed_attempts ?? [],
        fears: body.fears ?? [],
        beliefs: body.beliefs ?? [],
        patterns: body.patterns ?? [],
        root_cause: body.root_cause || null,
        why_nothing_worked: body.why_nothing_worked || null,
        why_this_works: body.why_this_works || null,
        syndrome_name: body.syndrome_name || null,
        product_name: body.product_name || null,
        product_format: body.product_format || null,
        product_contents: body.product_contents || null,
        bonuses: body.bonuses ?? [],
        price: body.price || null,
        installment_info: body.installment_info || null,
        guarantee: body.guarantee || null,
        main_headline: body.main_headline || null,
        alt_headlines: body.alt_headlines ?? [],
        quiz_hook: body.quiz_hook || null,
        vsl_opening: body.vsl_opening || null,
        absolution_phrase: body.absolution_phrase || null,
        main_cta: body.main_cta || null,
        traffic_source: body.traffic_source || null,
        page_1: body.page_1 || null,
        page_2: body.page_2 || null,
        post_purchase: body.post_purchase || null,
        follow_up: body.follow_up || null,
        upsell_product: body.upsell_product || null,
        upsell_price: body.upsell_price || null,
        upsell_pitch: body.upsell_pitch || null,
        downsell_product: body.downsell_product || null,
        downsell_price: body.downsell_price || null,
        buckets: body.buckets ?? [],
        deep_dive_phrases: body.deep_dive_phrases ?? [],
        status: "draft",
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[api/offer-briefings POST] supabase error:", error);
      return NextResponse.json(
        { error: error?.message ?? "Erro desconhecido no insert" },
        { status: 500 }
      );
    }

    return NextResponse.json(data as OfferBriefing, { status: 201 });
  } catch (err) {
    console.error("[api/offer-briefings POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar briefing" },
      { status: 500 }
    );
  }
}
