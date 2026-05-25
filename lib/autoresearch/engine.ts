import { createServerClient } from "@/lib/supabase";
import { callClaude } from "@/lib/claude";
import { getVideoStats } from "./vturb";
import { deploySplitterConfig } from "./deploy";
import { buildMultiVariantPrompt, parseMultiVariantResponse } from "./prompts";
import type {
  AutoresearchCampaign,
  AutoresearchRound,
  RoundVariant,
  SlotResult,
} from "@/types/autoresearch";

type Supabase = ReturnType<typeof createServerClient>;

function isSimulation(campaign: AutoresearchCampaign): boolean {
  return campaign.deploy_repo === "simulate";
}

/**
 * Main entry point. Advances campaign by one step.
 * For simulation, loops through all steps in a single call.
 */
export async function advanceCampaign(
  campaignId: string
): Promise<{ action: string; detail?: string }> {
  const supabase = createServerClient();

  // Fresh campaign read
  const { data: campaign, error: campErr } = await supabase
    .from("autoresearch_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campErr || !campaign) throw new Error(`Campaign not found: ${campaignId}`);
  const c = campaign as AutoresearchCampaign;

  if (c.status !== "active")
    return { action: "skipped", detail: `Campaign status: ${c.status}` };

  const { data: rounds } = await supabase
    .from("autoresearch_iterations")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("iteration_number", { ascending: false })
    .limit(1);

  const latest = (rounds?.[0] as AutoresearchRound | undefined) ?? null;

  // No round or last round decided → create new round
  if (!latest || latest.status === "decided") {
    const createResult = await startNewRoundOrComplete(supabase, c, latest);
    if (createResult.action !== "created") return createResult; // completed, skipped, or error

    if (!isSimulation(c)) return createResult;

    // For simulation: fall through to loop with the fresh round
  }

  // Re-read latest round (may have just been created above)
  const { data: freshRounds } = await supabase
    .from("autoresearch_iterations")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("iteration_number", { ascending: false })
    .limit(1);

  const current = freshRounds?.[0] as AutoresearchRound | undefined;
  if (!current || current.status === "decided" || current.status === "error") {
    return { action: "noop" };
  }

  // For simulation: loop through ALL steps in one call
  if (isSimulation(c)) {
    let round = current;
    let lastResult: { action: string; detail?: string } = { action: "noop" };

    for (let step = 0; step < 6; step++) {
      if (round.status === "decided" || round.status === "error") break;

      console.log(`[autoresearch] Sim step ${step}: ${round.status}`);
      lastResult = await advanceRound(supabase, c, round);

      if (lastResult.action === "error" || lastResult.action === "measure_error") break;

      // Re-read from DB
      const { data: updated } = await supabase
        .from("autoresearch_iterations")
        .select("*")
        .eq("id", round.id)
        .single();

      if (!updated) break;
      round = updated as AutoresearchRound;
    }

    return lastResult;
  }

  // Real mode: one step per advance call
  return await advanceRound(supabase, c, current);
}

async function startNewRoundOrComplete(
  supabase: Supabase,
  campaign: AutoresearchCampaign,
  previous: AutoresearchRound | null
) {
  const { count: roundCount } = await supabase
    .from("autoresearch_iterations")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id);

  const actualCount = roundCount ?? 0;

  // Re-read fresh campaign
  const { data: freshCamp } = await supabase
    .from("autoresearch_campaigns")
    .select("*")
    .eq("id", campaign.id)
    .single();

  const c = (freshCamp as AutoresearchCampaign) ?? campaign;
  const maxRounds = c.max_rounds;

  if (maxRounds != null && actualCount >= maxRounds) {
    await supabase.from("autoresearch_campaigns").update({
      status: "completed",
      iteration_count: actualCount,
      updated_at: new Date().toISOString(),
    }).eq("id", campaign.id);
    return { action: "completed", detail: `Limite de ${maxRounds} rounds atingido` };
  }

  if (c.status !== "active") {
    return { action: "skipped", detail: "Campaign no longer active" };
  }

  const nextNum = (previous?.iteration_number ?? 0) + 1;
  console.log(`[autoresearch] Creating round #${nextNum}`);

  const { data: round, error } = await supabase
    .from("autoresearch_iterations")
    .insert({
      campaign_id: c.id,
      iteration_number: nextNum,
      previous_value: c.current_value,
      previous_play_rate: c.best_play_rate ?? c.baseline_play_rate,
      status: "generating",
      copywriter_used: c.copywriter_id,
    })
    .select()
    .single();

  if (error || !round) throw new Error(`Failed to create round: ${error?.message}`);

  return { action: "created", detail: `Round #${nextNum} created` };
}

/**
 * Advance a round by one step based on its current status.
 */
async function advanceRound(
  supabase: Supabase,
  campaign: AutoresearchCampaign,
  round: AutoresearchRound
): Promise<{ action: string; detail?: string }> {
  switch (round.status) {
    case "generating":
      return await handleGenerating(supabase, campaign, round);
    case "pending_approval":
      return { action: "waiting_approval", detail: `Round #${round.iteration_number}` };
    case "deploying":
      return await handleDeploying(supabase, campaign, round);
    case "measuring":
      return await handleMeasuring(supabase, campaign, round);
    case "error":
      return { action: "error", detail: `Round #${round.iteration_number} in error state` };
    default:
      return { action: "noop" };
  }
}

/* ── Generating: produce N-1 challenger headlines ── */

async function handleGenerating(
  supabase: Supabase,
  campaign: AutoresearchCampaign,
  round: AutoresearchRound
) {
  const slots = campaign.slots ?? [];
  const challengerCount = Math.max(1, slots.length - 1);

  // Fetch briefing context
  let briefing: Record<string, string | undefined> = { offer_name: campaign.name };
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

  // Fetch round history
  const { data: allRounds } = await supabase
    .from("autoresearch_iterations")
    .select("variants, slot_results, winner_slot, variant_value, play_rate, decision")
    .eq("campaign_id", campaign.id)
    .eq("status", "decided")
    .order("iteration_number", { ascending: true });

  // Fetch wiki context
  let wikiContext: string | undefined;
  try {
    const { data: wikiPages } = await supabase
      .from("wiki_pages")
      .select("title, body_md")
      .in("kind", ["pattern", "mechanism", "framework"])
      .limit(5);
    if (wikiPages?.length) {
      wikiContext = wikiPages
        .map((p: { title: string; body_md: string }) => `## ${p.title}\n${p.body_md?.slice(0, 500)}`)
        .join("\n\n");
    }
  } catch {
    // Wiki not available
  }

  const { systemPrompt, userPrompt } = buildMultiVariantPrompt({
    elementType: campaign.element_type,
    currentValue: campaign.current_value ?? "",
    challengerCount,
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
    history: (allRounds ?? []) as AutoresearchRound[],
    wikiContext,
  });

  const response = await callClaude({
    messages: [{ role: "user", content: userPrompt }],
    systemPrompt,
    model: "gemini-2.5-flash",
    maxTokens: 4000,
    temperature: 0.85,
  });

  console.log("[autoresearch] Generator raw response:", response.slice(0, 300));
  const challengers = parseMultiVariantResponse(response, challengerCount);

  // Build variants array: slot 0 = control, slots 1..N = challengers
  const variants: RoundVariant[] = [
    {
      slot_index: 0,
      video_id: slots[0]?.video_id ?? "control",
      headline: campaign.current_value ?? "",
      hypothesis: "Controle — headline atual com melhor performance",
      role: "control",
    },
    ...challengers.map((ch, i) => ({
      slot_index: i + 1,
      video_id: slots[i + 1]?.video_id ?? `challenger-${i + 1}`,
      headline: ch.variant,
      hypothesis: ch.hypothesis,
      role: "challenger" as const,
      strategy: ch.strategy,
    })),
  ];

  const nextStatus = campaign.require_approval ? "pending_approval" : "deploying";

  await supabase
    .from("autoresearch_iterations")
    .update({
      variants,
      variant_value: variants.map((v) => v.headline).join(" | "),
      hypothesis: challengers.map((c) => c.hypothesis).join(" | "),
      status: nextStatus,
      wiki_pages_used: wikiContext ? ["pattern", "mechanism", "framework"] : [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", round.id);

  console.log(`[autoresearch] Round #${round.iteration_number} generated → ${nextStatus}`);
  return { action: "generated", detail: `${challengers.length} challengers` };
}

/* ── Deploying: push splitter config to GitHub ── */

async function handleDeploying(
  supabase: Supabase,
  campaign: AutoresearchCampaign,
  round: AutoresearchRound
) {
  const variants = round.variants as RoundVariant[] | null;
  if (!variants?.length) {
    await supabase
      .from("autoresearch_iterations")
      .update({ status: "error", decision_reason: "No variants to deploy" })
      .eq("id", round.id);
    return { action: "error", detail: "No variants to deploy" };
  }

  try {
    if (!isSimulation(campaign)) {
      await deploySplitterConfig(
        campaign.deploy_repo,
        campaign.deploy_branch,
        campaign.deploy_file_path,
        variants,
        round.iteration_number
      );
    }

    await supabase
      .from("autoresearch_iterations")
      .update({
        status: "measuring",
        deploy_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", round.id);

    console.log(`[autoresearch] Round #${round.iteration_number} deployed → measuring`);
    return { action: "deployed", detail: `Round #${round.iteration_number}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("autoresearch_iterations")
      .update({ status: "error", decision_reason: msg })
      .eq("id", round.id);
    return { action: "deploy_error", detail: msg };
  }
}

/* ── Measuring ── */

async function evaluateHeadlinesWithAI(
  supabase: Supabase,
  campaign: AutoresearchCampaign,
  variants: RoundVariant[]
): Promise<SlotResult[]> {
  let audience = "consumidor brasileiro interessado no produto";
  let niche = "geral";
  if (campaign.briefing_id) {
    const { data: b } = await supabase
      .from("offer_briefings")
      .select("target_audience, niche, main_pains, main_desires")
      .eq("id", campaign.briefing_id)
      .single();
    if (b) {
      audience = b.target_audience || audience;
      niche = b.niche || niche;
    }
  }

  const headlineList = variants
    .map((v, i) => `[${String.fromCharCode(65 + i)}] "${v.headline}"`)
    .join("\n");

  const systemPrompt = `Voce e um analista de marketing digital especializado em testar headlines de paginas de vendas.
Sua tarefa: avaliar headlines e estimar a taxa de clique de cada uma.
Responda SOMENTE no formato solicitado, sem explicacoes extras.`;

  const expectedFormat = variants
    .map((_, i) => `${String.fromCharCode(65 + i)}=NUMERO`)
    .join("\n");

  const userPrompt = `Pagina de vendas no nicho "${niche}" para "${audience}".

Avalie CADA headline. Quantas de 100 pessoas clicariam no play?
Valores realistas: 5 a 30. Nunca empate. Sempre diferencie.

${headlineList}

Responda APENAS assim, sem mais nada:
${expectedFormat}`;

  try {
    const response = await callClaude({
      messages: [{ role: "user", content: userPrompt }],
      systemPrompt,
      model: "gemini-2.5-flash",
      maxTokens: 2000,
      temperature: 0.7,
    });

    console.log("[autoresearch] AI evaluator raw:", response.slice(0, 200));

    const evaluations: Array<{ slot: string; clicks: number }> = [];
    let m: RegExpExecArray | null;
    const re = /([A-H])\s*[=:]\s*(\d+)/gi;
    while ((m = re.exec(response)) !== null) {
      evaluations.push({ slot: m[1].toUpperCase(), clicks: parseInt(m[2]) });
    }

    if (evaluations.length === 0) {
      // JSON fallback
      try {
        const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        const s = cleaned.indexOf("[");
        const e = cleaned.lastIndexOf("]");
        if (s !== -1 && e > s) {
          const arr = JSON.parse(cleaned.slice(s, e + 1)) as Array<{ slot?: string; clicks?: number }>;
          arr.forEach((item) => {
            if (item.slot && item.clicks != null) {
              evaluations.push({ slot: String(item.slot), clicks: Number(item.clicks) });
            }
          });
        }
      } catch { /* ignore */ }
    }

    if (evaluations.length === 0) throw new Error("Could not parse AI evaluation");

    return variants.map((v, i) => {
      const letter = String.fromCharCode(65 + i);
      const ev = evaluations.find((e) => e.slot === letter);
      const clicks = Math.min(50, Math.max(1, ev?.clicks ?? 10));
      return {
        slot_index: v.slot_index,
        video_id: v.video_id,
        play_rate: Math.round(clicks * 100) / 100,
        sessions: 200 + Math.floor(Math.random() * 150),
        unique_views: Math.floor((200 + Math.random() * 150) * (clicks / 100)),
      };
    });
  } catch (err) {
    console.error("[autoresearch] AI evaluation failed, using fallback:", err);
    return variants.map((v) => {
      const base = 10 + Math.random() * 10;
      return {
        slot_index: v.slot_index,
        video_id: v.video_id,
        play_rate: Math.round(base * 100) / 100,
        sessions: 250,
        unique_views: Math.floor(250 * (base / 100)),
      };
    });
  }
}

async function handleMeasuring(
  supabase: Supabase,
  campaign: AutoresearchCampaign,
  round: AutoresearchRound
) {
  try {
    const variants = (round.variants ?? []) as RoundVariant[];
    const slots = campaign.slots ?? [];

    // Check for existing results (from a previous interrupted call)
    const existingResults = (round.slot_results ?? []) as SlotResult[];
    const hasResults = existingResults.length > 0 && existingResults.some((r) => r.play_rate > 0);

    let slotResults: SlotResult[];

    if (hasResults) {
      console.log("[autoresearch] Reusing existing slot_results");
      slotResults = existingResults;
    } else if (isSimulation(campaign)) {
      slotResults = await evaluateHeadlinesWithAI(supabase, campaign, variants);
      // Save results immediately
      const totalSessions = slotResults.reduce((s, r) => s + r.sessions, 0);
      const totalViews = slotResults.reduce((s, r) => s + r.unique_views, 0);
      const bestRate = Math.max(...slotResults.map((r) => r.play_rate));
      await supabase
        .from("autoresearch_iterations")
        .update({
          slot_results: slotResults,
          play_rate: bestRate,
          sessions_collected: totalSessions,
          unique_views: totalViews,
          measured_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", round.id);
    } else {
      const hoursBack = Math.max(1, Math.ceil(campaign.iteration_minutes / 60));
      slotResults = await Promise.all(
        variants.map(async (v) => {
          try {
            const result = await getVideoStats(v.video_id, campaign.vturb_api_key, hoursBack);
            return {
              slot_index: v.slot_index,
              video_id: v.video_id,
              play_rate: result.stats.play_rate,
              sessions: result.stats.sessions,
              unique_views: result.stats.unique_views,
            };
          } catch {
            return { slot_index: v.slot_index, video_id: v.video_id, play_rate: 0, sessions: 0, unique_views: 0 };
          }
        })
      );

      const totalSessions = slotResults.reduce((s, r) => s + r.sessions, 0);
      const totalViews = slotResults.reduce((s, r) => s + r.unique_views, 0);
      const bestRate = Math.max(...slotResults.map((r) => r.play_rate));
      await supabase
        .from("autoresearch_iterations")
        .update({
          slot_results: slotResults,
          play_rate: bestRate,
          sessions_collected: totalSessions,
          unique_views: totalViews,
          measured_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", round.id);
    }

    // Non-blocking measurement log
    const totalSessions = slotResults.reduce((s, r) => s + r.sessions, 0);
    const bestRate = Math.max(...slotResults.map((r) => r.play_rate));
    supabase.from("autoresearch_measurements").insert({
      iteration_id: round.id,
      sessions: totalSessions,
      play_rate: bestRate,
      unique_views: slotResults.reduce((s, r) => s + r.unique_views, 0),
      raw_response: { slot_results: slotResults },
    }).then(({ error: mErr }) => {
      if (mErr) console.warn("[autoresearch] measurements insert warning:", mErr.message);
    });

    // Decision logic
    if (isSimulation(campaign)) {
      // Simulation: always decide immediately
      console.log("[autoresearch] Simulation: making decision");
      return await makeDecision(supabase, campaign, round, slotResults, variants);
    }

    // Real: check time + sessions thresholds
    const deployTime = round.deploy_started_at ? new Date(round.deploy_started_at).getTime() : 0;
    const minutesSinceDeploy = (Date.now() - deployTime) / (1000 * 60);
    const enoughTime = minutesSinceDeploy >= campaign.iteration_minutes;
    const minSess = campaign.min_sessions;
    const enoughSessions =
      minSess == null ||
      slotResults.every((r) => r.sessions >= Math.floor(minSess / slots.length));

    if (enoughTime && enoughSessions) {
      return await makeDecision(supabase, campaign, round, slotResults, variants);
    }

    return { action: "measuring", detail: `Waiting for time/sessions threshold` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[autoresearch] handleMeasuring error:", msg);
    await supabase
      .from("autoresearch_iterations")
      .update({ status: "error", decision_reason: `Measurement error: ${msg}`, updated_at: new Date().toISOString() })
      .eq("id", round.id);
    return { action: "measure_error", detail: msg };
  }
}

/* ── Decision: pick the best slot ── */

async function makeDecision(
  supabase: Supabase,
  campaign: AutoresearchCampaign,
  round: AutoresearchRound,
  slotResults: SlotResult[],
  variants: RoundVariant[]
) {
  const sorted = [...slotResults].sort((a, b) => b.play_rate - a.play_rate);
  const winner = sorted[0];
  const winnerVariant = variants.find((v) => v.slot_index === winner.slot_index);
  const controlResult = slotResults.find((r) => r.slot_index === 0);

  const isNewWinner = winner.slot_index !== 0;
  const decision: "promoted" | "kept" = isNewWinner ? "promoted" : "kept";

  const baseline = controlResult?.play_rate ?? Number(campaign.baseline_play_rate ?? 0);
  const improvement = baseline > 0 ? ((winner.play_rate - baseline) / baseline) * 100 : 0;

  const resultsSummary = slotResults
    .map((r) => {
      const v = variants.find((vv) => vv.slot_index === r.slot_index);
      const tag = r.slot_index === winner.slot_index ? " ★" : "";
      return `Slot ${r.slot_index} (${v?.role ?? "?"}): ${r.play_rate.toFixed(2)}%${tag}`;
    })
    .join(" | ");

  const reason = isNewWinner
    ? `Challenger slot ${winner.slot_index} venceu: ${winner.play_rate.toFixed(2)}% vs controle ${baseline.toFixed(2)}% (+${improvement.toFixed(1)}%). ${resultsSummary}`
    : `Controle mantido: ${baseline.toFixed(2)}%. ${resultsSummary}`;

  // Update round to decided
  const { error: roundErr } = await supabase
    .from("autoresearch_iterations")
    .update({
      status: "decided",
      decision,
      decision_reason: reason,
      winner_slot: winner.slot_index,
      updated_at: new Date().toISOString(),
    })
    .eq("id", round.id);

  if (roundErr) {
    console.error("[autoresearch] Failed to update round to decided:", roundErr.message);
    return { action: "error", detail: roundErr.message };
  }

  console.log(`[autoresearch] Round #${round.iteration_number} decided: ${decision}`);

  // Update campaign stats
  const { count: decidedCount } = await supabase
    .from("autoresearch_iterations")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .eq("status", "decided");

  const campaignUpdate: Record<string, unknown> = {
    iteration_count: decidedCount ?? (campaign.iteration_count + 1),
    updated_at: new Date().toISOString(),
  };

  if (isNewWinner && winnerVariant) {
    campaignUpdate.current_value = winnerVariant.headline;
    campaignUpdate.best_play_rate = winner.play_rate;
  }

  if (campaign.baseline_play_rate == null && controlResult) {
    campaignUpdate.baseline_play_rate = controlResult.play_rate;
  }
  if (campaign.best_play_rate == null || winner.play_rate > Number(campaign.best_play_rate)) {
    campaignUpdate.best_play_rate = winner.play_rate;
  }

  await supabase
    .from("autoresearch_campaigns")
    .update(campaignUpdate)
    .eq("id", campaign.id);

  return { action: "decided", detail: `${decision}: ${reason.slice(0, 100)}` };
}
