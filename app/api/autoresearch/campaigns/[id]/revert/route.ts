import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { deploySplitterConfig } from "@/lib/autoresearch/deploy";
import type { RoundVariant } from "@/types/autoresearch";

export const dynamic = "force-dynamic";

// POST /api/autoresearch/campaigns/[id]/revert — emergency revert to previous headline
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

    const { data: rounds } = await supabase
      .from("autoresearch_iterations")
      .select("previous_value")
      .eq("campaign_id", params.id)
      .not("previous_value", "is", null)
      .order("iteration_number", { ascending: false })
      .limit(1);

    const previousValue = rounds?.[0]?.previous_value;

    if (!previousValue) {
      return NextResponse.json({ error: "Nenhum valor anterior para reverter" }, { status: 400 });
    }

    // Deploy single-slot config with previous value as control
    if (campaign.deploy_repo !== "simulate") {
      const slots = campaign.slots ?? [];
      const revertVariants: RoundVariant[] = slots.map((s: { video_id: string }, i: number) => ({
        slot_index: i,
        video_id: s.video_id,
        headline: previousValue,
        hypothesis: "Emergency revert",
        role: i === 0 ? "control" as const : "challenger" as const,
      }));

      await deploySplitterConfig(
        campaign.deploy_repo,
        campaign.deploy_branch,
        campaign.deploy_file_path,
        revertVariants,
        0
      );
    }

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
