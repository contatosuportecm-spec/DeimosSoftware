import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST /api/spy/offers/[id]/snapshot — adiciona snapshot manual (upsert por data)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { active_ads_count } = (await req.json()) as {
      active_ads_count: number;
    };

    if (typeof active_ads_count !== "number" || active_ads_count < 0) {
      return NextResponse.json(
        { error: "active_ads_count deve ser um numero >= 0" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const today = new Date().toISOString().slice(0, 10);

    // Verifica se ja existe snapshot pra hoje
    const { data: existing } = await supabase
      .from("offer_snapshots")
      .select("id")
      .eq("offer_id", params.id)
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from("offer_snapshots")
        .update({ active_ads_count })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // Insert
      const { data, error } = await supabase
        .from("offer_snapshots")
        .insert({
          offer_id: params.id,
          date: today,
          active_ads_count,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data, { status: 201 });
    }
  } catch (err) {
    console.error("[api/spy/offers/[id]/snapshot POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar snapshot" },
      { status: 500 }
    );
  }
}
