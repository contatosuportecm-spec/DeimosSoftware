import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { revertVariant } from "@/lib/autoresearch/deploy";

export const dynamic = "force-dynamic";

// POST /api/autoresearch/campaigns/[id]/revert — emergency revert
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    const { data: campaign, error: campErr } = await supabase
      .from("autoresearch_campaigns")
      .select("*")
      .eq("id", params.id)
      .single();

    if (campErr || !campaign) {
      return NextResponse.json({ error: "Campanha nao encontrada" }, { status: 404 });
    }

    // Find the last iteration with variant + previous values
    const { data: iters } = await supabase
      .from("autoresearch_iterations")
      .select("variant_value, previous_value")
      .eq("campaign_id", params.id)
      .not("previous_value", "is", null)
      .order("iteration_number", { ascending: false })
      .limit(1);

    const currentValue = campaign.current_value ?? iters?.[0]?.variant_value;
    const previousValue = iters?.[0]?.previous_value;

    if (!previousValue || !currentValue) {
      return NextResponse.json({ error: "Nenhum valor anterior para reverter" }, { status: 400 });
    }

    await revertVariant(
      campaign.deploy_repo,
      campaign.deploy_branch,
      campaign.deploy_file_path,
      currentValue,
      previousValue
    );

    // Pause campaign and update current value
    await supabase
      .from("autoresearch_campaigns")
      .update({
        status: "paused",
        current_value: previousValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    return NextResponse.json({ ok: true, reverted_to: previousValue });
  } catch (err) {
    console.error("[api/autoresearch/campaigns/[id]/revert]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao reverter" },
      { status: 500 }
    );
  }
}
