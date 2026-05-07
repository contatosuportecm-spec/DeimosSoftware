/**
 * Script de scrape diário — roda localmente via:
 *   npm run scrape
 *
 * Agende no Windows Task Scheduler para rodar todo dia (ex: 08:00).
 *
 * O que faz:
 *  1. Busca todas as ofertas ativas no Supabase
 *  2. Para cada oferta, scrapa a Ad Library via Playwright
 *  3. Salva snapshot + recalcula status e scores
 *
 * Autossuficiente — não depende de módulos Next.js.
 */

import { createClient } from "@supabase/supabase-js";
import { scrapeActiveAdsCount } from "../lib/automation/adLibraryScraper";

// ── Config ──
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Country codes ──
const COUNTRY_MAP: Record<string, string> = {
  BR: "BR",
  US: "US",
  UK: "GB",
  EU: "DE",
  LATAM: "BR",
};

// ── Helpers matemáticos ──

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length);
}

type OfferStatus = "new" | "monitoring" | "scaling" | "stable" | "dying" | "archived";

function calculateStatus(
  counts: number[],
  currentStatus: OfferStatus
): { status: OfferStatus; score: number } {
  if (currentStatus === "archived") return { status: "archived", score: 0 };
  if (counts.length < 2) return { status: "new", score: 0 };

  const n = counts.length;
  const first = counts[0];
  const last = counts[n - 1];
  const max = Math.max(...counts);
  const avg = mean(counts);

  if (max === 0) return { status: "monitoring", score: 10 };
  if (last === 0 && max >= 5) return { status: "dying", score: 85 };

  const zeroDays = counts.filter((c) => c === 0).length;
  if (zeroDays >= 2 && max >= 10) return { status: "dying", score: 90 };
  if (zeroDays >= 1 && max >= 20) return { status: "dying", score: 80 };

  if (avg > 0 && n >= 3) {
    const cv = stdDev(counts) / avg;
    if (cv > 0.6) return { status: "dying", score: 75 };
  }

  if (first === 0) {
    return last > 0
      ? { status: "scaling", score: Math.min(60 + last, 95) }
      : { status: "monitoring", score: 10 };
  }

  const pct = ((last - first) / first) * 100;
  if (pct > 20) return { status: "scaling", score: Math.round(Math.min(70 + Math.min(last / 5, 20), 100)) };
  if (pct > 10 && last >= 10) return { status: "scaling", score: 65 };
  if (pct < -15) return { status: "dying", score: Math.round(Math.min(60 + Math.abs(pct) / 2, 95)) };
  if (n < 3) return { status: "monitoring", score: 25 };

  const consistency = avg > 0 ? 1 - stdDev(counts) / avg : 1;
  const stableScore = Math.round(40 + consistency * 30 + Math.min(avg / 10, 20));
  return { status: "stable", score: Math.min(stableScore, 90) };
}

// ── Market Strength simplificado ──

function calculateMarketStrength(snapCounts: number[]) {
  if (snapCounts.length === 0) {
    return { market_strength: 0, volume_score: 0, growth_score: 0, consistency_score: 0, recency_score: 0, scaling_pattern: "unknown" };
  }

  const last = snapCounts[snapCounts.length - 1];

  // Volume (30%) — log scale
  const volumeRaw = last > 0 ? Math.log10(last + 1) / Math.log10(101) : 0;
  const volume_score = Math.min(volumeRaw, 1) * 100;

  // Growth (25%)
  let growth_score = 50;
  if (snapCounts.length >= 2) {
    const first = snapCounts[0];
    if (first > 0) {
      const pct = ((last - first) / first) * 100;
      growth_score = 50 + Math.max(-50, Math.min(50, pct));
    } else if (last > 0) {
      growth_score = 90;
    }
  }

  // Consistency (25%)
  let consistency_score = 50;
  if (snapCounts.length >= 2) {
    const avg = mean(snapCounts);
    if (avg > 0) {
      const cv = stdDev(snapCounts) / avg;
      consistency_score = Math.max(0, (1 - cv) * 100);
    }
  }

  // Recency (20%) — sempre 100 pois acabamos de scrape
  const recency_score = 100;

  const market_strength =
    volume_score * 0.3 +
    growth_score * 0.25 +
    consistency_score * 0.25 +
    recency_score * 0.2;

  // Scaling pattern
  let scaling_pattern = "unknown";
  if (snapCounts.length >= 3) {
    const avg = mean(snapCounts);
    const cv = stdDev(snapCounts) / (avg || 1);
    const growing = last > snapCounts[0] * 1.1;

    if (last >= 20 && growing) scaling_pattern = "lateral";
    else if (last >= 5 && last <= 15 && cv < 0.3 && growing) scaling_pattern = "vertical";
    else if (last >= 3 && last <= 10 && cv < 0.2) scaling_pattern = "budget";
    else if (last >= 10 && growing) scaling_pattern = "mixed";
  }

  return { market_strength, volume_score, growth_score, consistency_score, recency_score, scaling_pattern };
}

// ── Main ──

async function main() {
  console.log(`\n--- Daily Scrape | ${new Date().toLocaleString("pt-BR")} ---\n`);

  const { data: offers, error } = await supabase
    .from("offers")
    .select("id, name, page_id, country, status, created_at")
    .neq("status", "archived")
    .not("page_id", "is", null);

  if (error) {
    console.error("Erro ao buscar ofertas:", error.message);
    process.exit(1);
  }

  if (!offers?.length) {
    console.log("Nenhuma oferta ativa para scrape.");
    return;
  }

  console.log(`${offers.length} ofertas para atualizar\n`);

  let scraped = 0;
  let errors = 0;

  for (const offer of offers) {
    const countryCode = COUNTRY_MAP[offer.country] ?? "BR";

    try {
      process.stdout.write(`  ${offer.name}...`);

      // 1. Scrape
      const count = await scrapeActiveAdsCount(offer.page_id!, countryCode);

      // 2. Salva snapshot
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("offer_snapshots")
        .upsert(
          { offer_id: offer.id, date: today, active_ads_count: count },
          { onConflict: "offer_id,date" }
        );

      // 3. Busca últimos 5 snapshots
      const { data: recentSnaps } = await supabase
        .from("offer_snapshots")
        .select("active_ads_count")
        .eq("offer_id", offer.id)
        .order("date", { ascending: true })
        .limit(5);

      const counts = (recentSnaps ?? []).map((s: { active_ads_count: number }) => s.active_ads_count);

      // 4. Calcula status + scores
      const { status: newStatus } = calculateStatus(counts, offer.status as OfferStatus);
      const strength = calculateMarketStrength(counts);

      const createdAt = offer.created_at ? new Date(offer.created_at) : new Date();
      const observationDays = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);

      // 5. Atualiza oferta
      await supabase
        .from("offers")
        .update({
          status: newStatus,
          score: Math.round(strength.market_strength),
          market_strength: strength.market_strength,
          volume_score: strength.volume_score,
          growth_score: strength.growth_score,
          consistency_score: strength.consistency_score,
          recency_score: strength.recency_score,
          scaling_pattern: strength.scaling_pattern,
          observation_days: observationDays,
          updated_at: new Date().toISOString(),
        })
        .eq("id", offer.id);

      console.log(` ${count} ads | ${newStatus} | score ${Math.round(strength.market_strength)}`);
      scraped++;

      // Delay entre ofertas
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      errors++;
      console.log(` ERRO: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\n--- Resultado: ${scraped} OK | ${errors} erros ---\n`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
