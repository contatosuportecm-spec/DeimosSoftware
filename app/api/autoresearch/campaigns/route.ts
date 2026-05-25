import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { AutoresearchCampaign, AutoresearchRound, CreateCampaignInput } from "@/types/autoresearch";

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

    const ids = campaigns.map((c: AutoresearchCampaign) => c.id);
    const { data: allRounds } = await supabase
      .from("autoresearch_iterations")
      .select("*")
      .in("campaign_id", ids)
      .order("iteration_number", { ascending: false });

    const latestBycamp: Record<string, AutoresearchRound> = {};
    const roundsBycamp: Record<string, AutoresearchRound[]> = {};
    for (const round of (allRounds ?? []) as AutoresearchRound[]) {
      if (!latestBycamp[round.campaign_id]) {
        latestBycamp[round.campaign_id] = round;
      }
      if (!roundsBycamp[round.campaign_id]) {
        roundsBycamp[round.campaign_id] = [];
      }
      roundsBycamp[round.campaign_id].push(round);
    }

    const result = campaigns.map((c: AutoresearchCampaign) => ({
      ...c,
      latest_round: latestBycamp[c.id] ?? null,
      rounds: (roundsBycamp[c.id] ?? []).reverse(),
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
    if (!body.name) {
      return NextResponse.json({ error: "name obrigatorio" }, { status: 400 });
    }

    // Build slots
    let slots = body.slots ?? [];
    if (slots.length === 0 && isSimulate) {
      // Auto-generate 5 simulated slots
      slots = Array.from({ length: 5 }, (_, i) => ({
        video_id: `sim-${i + 1}`,
        label: `Slot ${String.fromCharCode(65 + i)}`,
      }));
    }

    if (!isSimulate && slots.length < 2) {
      return NextResponse.json(
        { error: "Minimo 2 slots de video necessarios para A/B test" },
        { status: 400 }
      );
    }

    if (!isSimulate && (!body.deploy_repo || !body.deploy_file_path)) {
      return NextResponse.json(
        { error: "deploy_repo e deploy_file_path obrigatorios sem simulate_mode" },
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
        slots,
        slot_count: slots.length,
        vturb_video_id: slots[0]?.video_id ?? null,
        vturb_api_key: body.vturb_api_key ?? null,
        deploy_repo: isSimulate ? "simulate" : (body.deploy_repo ?? "simulate"),
        deploy_branch: body.deploy_branch ?? "main",
        deploy_file_path: body.deploy_file_path ?? "autoresearch-config.json",
        min_sessions: body.min_sessions ?? null,
        max_rounds: body.max_rounds ?? null,
        iteration_minutes: body.iteration_minutes ?? 2880,
        simulate_mode: isSimulate,
        require_approval: body.require_approval ?? false,
        copywriter_id: body.copywriter_id ?? "gary-halbert",
        current_value: body.current_value ?? null,
        baseline_play_rate: body.baseline_play_rate ?? null,
        best_play_rate: body.baseline_play_rate ?? null,
        status: "paused",
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[api/autoresearch/campaigns POST] Supabase error:", error);
      throw new Error(error?.message ?? "Insert failed");
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[api/autoresearch/campaigns POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar campanha" },
      { status: 500 }
    );
  }
}
