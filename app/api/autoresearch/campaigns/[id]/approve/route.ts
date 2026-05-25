import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST /api/autoresearch/campaigns/[id]/approve
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    // Find pending_approval iteration for this campaign
    const { data: iter, error: iterErr } = await supabase
      .from("autoresearch_iterations")
      .select("*")
      .eq("campaign_id", params.id)
      .eq("status", "pending_approval")
      .order("iteration_number", { ascending: false })
      .limit(1)
      .single();

    if (iterErr || !iter) {
      return NextResponse.json({ error: "Nenhuma iteracao pendente de aprovacao" }, { status: 404 });
    }

    const { error } = await supabase
      .from("autoresearch_iterations")
      .update({ status: "deploying", updated_at: new Date().toISOString() })
      .eq("id", iter.id);

    if (error) throw error;

    return NextResponse.json({ ok: true, iteration_id: iter.id });
  } catch (err) {
    console.error("[api/autoresearch/campaigns/[id]/approve]", err);
    return NextResponse.json({ error: "Erro ao aprovar iteracao" }, { status: 500 });
  }
}
