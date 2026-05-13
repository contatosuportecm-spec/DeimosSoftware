import { NextRequest, NextResponse } from "next/server";
import { generateVsl } from "@/lib/vsl/generate";
import { createServerClient } from "@/lib/supabase";
import { OfferBriefing } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface GenerateApiInput {
  briefingId?: string;
  briefing?: OfferBriefing;
  style_blend?: Record<string, number>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateApiInput;
    let briefing = body.briefing;

    if (!briefing && body.briefingId) {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("offer_briefings")
        .select("*")
        .eq("id", body.briefingId)
        .single();
      if (error || !data) {
        return NextResponse.json({ error: "Briefing não encontrado" }, { status: 404 });
      }
      briefing = data as unknown as OfferBriefing;
    }

    if (!briefing) {
      return NextResponse.json({ error: "briefing ou briefingId obrigatório" }, { status: 400 });
    }

    const blend = body.style_blend && Object.keys(body.style_blend).length > 0
      ? body.style_blend
      : { "voice--gary-halbert": 0.6, "voice--joe-sugarman": 0.4 };

    const draft = await generateVsl({
      briefingId: body.briefingId,
      briefing,
      style_blend: blend,
    });
    return NextResponse.json(draft, { status: 201 });
  } catch (err) {
    console.error("[api/vsl/generate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
