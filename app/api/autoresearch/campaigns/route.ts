import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { AutoresearchCampaign, AutoresearchIteration, CreateCampaignInput } from "@/types/autoresearch";

export const dynamic = "force-dynamic";

// GET /api/autoresearch/campaigns
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: campaigns, error } = await supabase
      .from("autoresearch_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!campaigns?.length) return NextResponse.json([]);

    // Fetch latest iteration for each campaign
    const ids = campaigns.map((c: AutoresearchCampaign) => c.id);
    const { data: allIters } = await supabase
      .from("autoresearch_iterations")
      .select("*")
      .in("campaign_id", ids)
      .order("iteration_number", { ascending: false });

    const latestBycamp: Record<string, AutoresearchIteration> = {};
    for (const iter of (allIters ?? []) as AutoresearchIteration[]) {
      if (!latestBycamp[iter.campaign_id]) {
        latestBycamp[iter.campaign_id] = iter;
      }
    }

    const result = campaigns.map((c: AutoresearchCampaign) => ({
      ...c,
      latest_iteration: latestBycamp[c.id] ?? null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/autoresearch/campaigns GET]", err);
    return NextResponse.json({ error: "Erro ao buscar campanhas" }, { status: 500 });
  }
}

// POST /api/autoresearch/campaigns
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateCampaignInput;

    const isSimulate = body.simulate_mode ?? false;
    if (!body.name || (!isSimulate && (!body.vturb_video_id || !body.deploy_repo || !body.deploy_file_path))) {
      return NextResponse.json(
        { error: "name obrigatorio. Sem simulate_mode: vturb_video_id, deploy_repo e deploy_file_path tambem" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("autoresearch_campaigns")
      .insert({
        name: body.name,
        briefing_id: body.briefing_id ?? null,
        element_type: body.element_type ?? "headline",
        vturb_video_id: body.vturb_video_id,
        vturb_api_key: body.vturb_api_key ?? null,
        deploy_repo: body.deploy_repo,
        deploy_branch: body.deploy_branch ?? "main",
        deploy_file_path: body.deploy_file_path,
        min_sessions: body.min_sessions ?? 200,
        min_improvement_pct: body.min_improvement_pct ?? 2.0,
        max_iterations: body.max_iterations ?? 50,
        iteration_hours: body.iteration_hours ?? 48,
        require_approval: body.require_approval ?? false,
        simulate_mode: body.simulate_mode ?? false,
        copywriter_id: body.copywriter_id ?? "gary-halbert",
        current_value: body.current_value ?? null,
        baseline_play_rate: body.baseline_play_rate ?? null,
        best_play_rate: body.baseline_play_rate ?? null,
        status: "paused",
      })
      .select()
      .single();

    if (error || !data) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[api/autoresearch/campaigns POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar campanha" },
      { status: 500 }
    );
  }
}
