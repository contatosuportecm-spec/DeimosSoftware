import { NextRequest, NextResponse } from "next/server";
import { evaluateVsl } from "@/lib/vsl/evaluate";
import { createServerClient } from "@/lib/supabase";
import { OfferBriefing } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface EvalApiInput {
  briefingId?: string;
  briefing?: OfferBriefing | null;
  source_copy: string;
  style_blend?: Record<string, number>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EvalApiInput;
    if (!body.source_copy || body.source_copy.trim().length < 50) {
      return NextResponse.json(
        { error: "source_copy precisa ter pelo menos 50 caracteres" },
        { status: 400 },
      );
    }

    let briefing: OfferBriefing | null = body.briefing ?? null;
    if (!briefing && body.briefingId) {
      const supabase = createServerClient();
      const { data } = await supabase
        .from("offer_briefings")
        .select("*")
        .eq("id", body.briefingId)
        .maybeSingle();
      briefing = (data as unknown as OfferBriefing) ?? null;
    }

    const draft = await evaluateVsl({
      briefingId: body.briefingId,
      briefing,
      source_copy: body.source_copy,
      style_blend: body.style_blend,
    });
    return NextResponse.json(draft, { status: 201 });
  } catch (err) {
    console.error("[api/vsl/evaluate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
