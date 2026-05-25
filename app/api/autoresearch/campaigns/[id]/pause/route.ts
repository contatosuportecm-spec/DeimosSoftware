import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST /api/autoresearch/campaigns/[id]/pause
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("autoresearch_campaigns")
      .update({ status: "paused", updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/autoresearch/campaigns/[id]/pause]", err);
    return NextResponse.json({ error: "Erro ao pausar campanha" }, { status: 500 });
  }
}
