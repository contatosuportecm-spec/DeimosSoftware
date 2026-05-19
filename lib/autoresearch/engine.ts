import { createServerClient } from "@/lib/supabase";
import { callClaude } from "@/lib/claude";
import { getVideoStats } from "./vturb";
import { deployVariant, revertVariant } from "./deploy";
import { buildVariantPrompt, parseVariantResponse } from "./prompts";
import type { AutoresearchCampaign, AutoresearchIteration } from "@/types/autoresearch";

export async function advanceCampaign(campaignId: string): Promise<{ action: string; detail?: string }> {
  const supabase = createServerClient();

  // Fetch campaign
  const { data: campaign, error: campErr } = await supabase
    .from("autoresearch_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campErr || !campaign) throw new Error(`Campaign not found: ${campaignId}`);
  const c = campaign as AutoresearchCampaign;

  if (c.status !== "active") return { action: "skipped", detail: `Campaign status: ${c.status}` };

  // Fetch latest iteration
  const { data: iterations } = await supabase
    .from("autoresearch_iterations")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("iteration_number", { ascending: false })
    .limit(1);

  const latest = (iterations?.[0] as AutoresearchIteration | undefined) ?? null;

  // No iteration or last one decided → create new
  if (!latest || latest.status === "decided") {
    if (c.iteration_count >= c.max_iterations) {
      await supabase.from("autoresearch_campaigns").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", campaignId);
      return { action: "completed", detail: "Max iterations reached" };
    }
    return await createNewIteration(supabase, c, latest);
  }

  switch (latest.status) {
    case "generating":
      return await handleGenerating(supabase, c, latest);
    case "pending_approval":
      return { action: "waiting_approval", detail: `Iteration #${latest.iteration_number}` };
    case "deploying":
      return await handleDeploying(supabase, c, latest);
    case "measuring":
      return await handleMeasuring(supabase, c, latest);
    case "error":
      return { action: "error", detail: `Iteration #${latest.iteration_number} in error state` };
    default:
      return { action: "noop" };
  }
}

async function createNewIteration(
  supabase: ReturnType<typeof createServerClient>,
  campaign: AutoresearchCampaign,
  previous: AutoresearchIteration | null
) {
  const nextNum = (previous?.iteration_number ?? 0) + 1;

  const { data: iter, error } = await supabase
    .from("autoresearch_iterations")
    .insert({
      campaign_id: campaign.id,
      iteration_number: nextNum,
      previous_value: campaign.current_value,
      previous_play_rate: campaign.best_play_rate ?? campaign.baseline_play_rate,
      status: "generating",
      copywriter_used: campaign.copywriter_id,
    })
    .select()
    .single();

  if (error || !iter) throw new Error(`Failed to create iteration: ${error?.message}`);

  return await handleGenerating(supabase, campaign, iter as AutoresearchIteration);
}

async function handleGenerating(
  supabase: ReturnType<typeof createServerClient>,
  campaign: AutoresearchCampaign,
  iteration: AutoresearchIteration
) {
  // Fetch briefing context
  let briefing = { offer_name: campaign.name } as Record<string, string | undefined>;
  if (campaign.briefing_id) {
    const { data: b } = await supabase
      .from("offer_briefings")
      .select("offer_name, niche, target_audience, main_pains, main_desires, mechanism_name, main_promise")
      .eq("id", campaign.briefing_id)
      .single();
    if (b) {
      briefing = {
        offer_name: b.offer_name,
        niche: b.niche,
        audience: b.target_audience,
        pains: b.main_pains,
        desires: b.main_desires,
        mechanism_name: b.mechanism_name,
        promise: b.main_promise,
      };
    }
  }

  // Fetch iteration history
  const { data: allIters } = await supabase
    .from("autoresearch_iterations")
    .select("variant_value, play_rate, decision")
    .eq("campaign_id", campaign.id)
    .eq("status", "decided")
    .order("iteration_number", { ascending: true });

  // Fetch wiki context if available
  let wikiContext: string | undefined;
  try {
    const { data: wikiPages } = await supabase
      .from("wiki_pages")
      .select("title, body_md")
      .in("kind", ["pattern", "mechanism", "framework"])
      .limit(5);
    if (wikiPages?.length) {
      wikiContext = wikiPages.map((p: { title: string; body_md: string }) => `## ${p.title}\n${p.body_md?.slice(0, 500)}`).join("\n\n");
    }
  } catch {
    // Wiki not available, continue without
  }

  const { systemPrompt, userPrompt } = buildVariantPrompt({
    elementType: campaign.element_type,
    currentValue: campaign.current_value ?? "",
    briefing: {
      offer_name: briefing.offer_name ?? campaign.name,
      niche: briefing.niche,
      audience: briefing.audience,
      pains: briefing.pains,
      desires: briefing.desires,
      mechanism_name: briefing.mechanism_name,
      promise: briefing.promise,
    },
    copywriterId: campaign.copywriter_id,
    history: (allIters ?? []) as AutoresearchIteration[],
    wikiContext,
  });

  const response = await callClaude({
    messages: [{ role: "user", content: userPrompt }],
    systemPrompt,
    maxTokens: 500,
    temperature: 0.8,
  });

  const { variant, hypothesis } = parseVariantResponse(response);

  const wikiPagesUsed = wikiContext ? ["pattern", "mechanism", "framework"] : [];
  const nextStatus = campaign.require_approval ? "pending_approval" : "deploying";

  await supabase
    .from("autoresearch_iterations")
    .update({
      variant_value: variant,
      hypothesis,
      status: nextStatus,
      wiki_pages_used: wikiPagesUsed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", iteration.id);

  return { action: "generated", detail: `Variant: "${variant.slice(0, 80)}..."` };
}

async function handleDeploying(
  supabase: ReturnType<typeof createServerClient>,
  campaign: AutoresearchCampaign,
  iteration: AutoresearchIteration
) {
  if (!iteration.variant_value) {
    await supabase.from("autoresearch_iterations").update({ status: "error", decision_reason: "No variant value" }).eq("id", iteration.id);
    return { action: "error", detail: "No variant value to deploy" };
  }

  try {
    // Simulate mode: skip actual GitHub deploy
    if (!campaign.simulate_mode) {
      await deployVariant(
        campaign.deploy_repo,
        campaign.deploy_branch,
        campaign.deploy_file_path,
        iteration.variant_value,
        iteration.previous_value,
        `[AutoResearch] Iteration #${iteration.iteration_number}: ${iteration.variant_value.slice(0, 60)}`
      );
    }

    await supabase
      .from("autoresearch_iterations")
      .update({
        status: "measuring",
        deploy_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", iteration.id);

    const mode = campaign.simulate_mode ? " (simulated)" : "";
    return { action: "deployed", detail: `Iteration #${iteration.iteration_number}${mode}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase.from("autoresearch_iterations").update({ status: "error", decision_reason: msg }).eq("id", iteration.id);
    return { action: "deploy_error", detail: msg };
  }
}

function generateSimulatedStats(baseline: number): { play_rate: number; sessions: number; unique_views: number } {
  // Simulate realistic play rate: baseline +/- 15% with slight upward bias
  const variation = (Math.random() - 0.4) * 0.15; // -6% to +9% of baseline
  const play_rate = Math.max(0.5, baseline * (1 + variation));
  const sessions = 200 + Math.floor(Math.random() * 300);
  const unique_views = Math.floor(sessions * (0.6 + Math.random() * 0.3));
  return { play_rate: Math.round(play_rate * 100) / 100, sessions, unique_views };
}

async function handleMeasuring(
  supabase: ReturnType<typeof createServerClient>,
  campaign: AutoresearchCampaign,
  iteration: AutoresearchIteration
) {
  try {
    let stats: { play_rate: number; sessions: number; unique_views: number };
    let raw: Record<string, unknown>;

    if (campaign.simulate_mode) {
      // Simulated metrics — resolves instantly
      const baseline = Number(campaign.best_play_rate ?? campaign.baseline_play_rate ?? 10);
      stats = generateSimulatedStats(baseline);
      raw = { simulated: true, ...stats };
    } else {
      // Real VTurb API poll
      const hoursBack = campaign.iteration_hours;
      const result = await getVideoStats(campaign.vturb_video_id, campaign.vturb_api_key, hoursBack);
      stats = result.stats;
      raw = result.raw;
    }

    // Save measurement
    await supabase.from("autoresearch_measurements").insert({
      iteration_id: iteration.id,
      sessions: stats.sessions,
      play_rate: stats.play_rate,
      unique_views: stats.unique_views,
      raw_response: raw,
    });

    // Update iteration with latest stats
    await supabase
      .from("autoresearch_iterations")
      .update({
        play_rate: stats.play_rate,
        sessions_collected: stats.sessions,
        unique_views: stats.unique_views,
        measured_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", iteration.id);

    // In simulate mode, decide immediately. In real mode, check thresholds.
    if (campaign.simulate_mode) {
      return await makeDecision(supabase, campaign, iteration, stats.play_rate);
    }

    const deployTime = iteration.deploy_started_at ? new Date(iteration.deploy_started_at).getTime() : 0;
    const hoursSinceDeploy = (Date.now() - deployTime) / (1000 * 60 * 60);
    const enoughSessions = stats.sessions >= campaign.min_sessions;
    const enoughTime = hoursSinceDeploy >= campaign.iteration_hours;

    if (enoughSessions && enoughTime) {
      return await makeDecision(supabase, campaign, iteration, stats.play_rate);
    }

    return {
      action: "measuring",
      detail: `Sessions: ${stats.sessions}/${campaign.min_sessions}, Hours: ${Math.round(hoursSinceDeploy)}/${campaign.iteration_hours}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { action: "measure_error", detail: msg };
  }
}

async function makeDecision(
  supabase: ReturnType<typeof createServerClient>,
  campaign: AutoresearchCampaign,
  iteration: AutoresearchIteration,
  playRate: number
) {
  const baseline = Number(campaign.best_play_rate ?? campaign.baseline_play_rate ?? 0);
  const improvement = baseline > 0 ? ((playRate - baseline) / baseline) * 100 : 0;
  const isKeep = improvement >= campaign.min_improvement_pct;

  const decision = isKeep ? "keep" : "revert";
  const reason = isKeep
    ? `Play rate ${playRate.toFixed(2)}% vs baseline ${baseline.toFixed(2)}% (+${improvement.toFixed(1)}%)`
    : `Play rate ${playRate.toFixed(2)}% vs baseline ${baseline.toFixed(2)}% (${improvement.toFixed(1)}%) below threshold ${campaign.min_improvement_pct}%`;

  // Update iteration
  await supabase
    .from("autoresearch_iterations")
    .update({
      status: "decided",
      decision,
      decision_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", iteration.id);

  if (isKeep) {
    // Keep: update campaign with new best
    await supabase
      .from("autoresearch_campaigns")
      .update({
        current_value: iteration.variant_value,
        best_play_rate: playRate,
        iteration_count: campaign.iteration_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);
  } else {
    // Revert: restore previous value
    if (iteration.previous_value && !campaign.simulate_mode) {
      try {
        await revertVariant(
          campaign.deploy_repo,
          campaign.deploy_branch,
          campaign.deploy_file_path,
          iteration.variant_value!,
          iteration.previous_value
        );
      } catch (err) {
        console.error("[autoresearch] Revert deploy failed:", err);
      }
    }

    await supabase
      .from("autoresearch_campaigns")
      .update({
        iteration_count: campaign.iteration_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);
  }

  return { action: "decided", detail: `${decision}: ${reason}` };
}
