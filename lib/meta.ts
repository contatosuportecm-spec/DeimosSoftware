import { Country, COUNTRY_CODES, OfferStatus, OfferSnapshot } from "@/types";
import { createServerClient } from "@/lib/supabase";
import { calculateMarketStrength } from "@/lib/scoring";

// ═══ URL parsing ═══

/**
 * Extrai view_all_page_id de qualquer URL da Meta Ads Library.
 * Retorna null se não encontrar.
 */
export function extractPageId(libraryUrl: string): string | null {
  try {
    const url = new URL(libraryUrl);
    const fromSearch = url.searchParams.get("view_all_page_id");
    if (fromSearch) return fromSearch;
    // Fallback: alguns links usam hash-based routing
    const fromHash = new URLSearchParams(url.hash.slice(1)).get("view_all_page_id");
    return fromHash ?? null;
  } catch {
    return null;
  }
}

// ═══ Meta API ═══

interface MetaAdsPage {
  data: Array<{ id: string }>;
  paging?: {
    cursors: { after: string };
    next?: string;
  };
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Conta o total de anúncios ativos para um page_id.
 * Pagina automaticamente até esgotar os resultados.
 */
export async function countActiveAds(
  pageId: string,
  countryCodes: string[]
): Promise<number> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN não configurado");

  const BASE = "https://graph.facebook.com/v19.0/ads_archive";
  let total = 0;
  let after: string | undefined = undefined;

  do {
    const params = new URLSearchParams({
      access_token: token,
      search_page_ids: pageId,
      ad_active_status: "ACTIVE",
      ad_reached_countries: JSON.stringify(countryCodes),
      fields: "id",
      limit: "500",
    });
    if (after) params.set("after", after);

    const res = await fetch(`${BASE}?${params.toString()}`);
    const page = await res.json() as MetaAdsPage;

    if (page.error) {
      throw new Error(`Meta API: ${page.error.message} (code ${page.error.code})`);
    }

    total += page.data.length;

    // paging.next é o indicador confiável de próxima página
    after = page.paging?.next ? page.paging.cursors.after : undefined;
  } while (after !== undefined);

  return total;
}

// ═══ Helpers matemáticos ═══

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// ═══ Status calculation ═══

interface StatusResult {
  status: OfferStatus;
  score: number; // 0–100 confiança na classificação
}

/**
 * Calcula status + score de uma oferta com base nos snapshots.
 *
 * Lógica:
 *  1. Detecção de zeros (padrão errático / morte)
 *  2. Volatilidade via coeficiente de variação (CV)
 *  3. Tendência percentual (primeiro → último)
 *  4. Score de confiança 0–100
 */
export function calculateStatus(
  snapshots: Pick<OfferSnapshot, "active_ads_count">[],
  currentStatus: OfferStatus
): StatusResult {
  if (currentStatus === "archived") return { status: "archived", score: 0 };
  if (snapshots.length < 2) return { status: "new", score: 0 };

  const counts = snapshots.map((s) => s.active_ads_count);
  const n      = counts.length;
  const first  = counts[0];
  const last   = counts[n - 1];
  const max    = Math.max(...counts);
  const avg    = mean(counts);

  // ── 1. Todos zeros → nada acontecendo ──
  if (max === 0) return { status: "monitoring", score: 10 };

  // ── 2. Último dia zerou mas já teve ads → morrendo ──
  if (last === 0 && max >= 5) return { status: "dying", score: 85 };

  // ── 3. Padrão errático: zeros misturados com valores altos ──
  const zeroDays = counts.filter((c) => c === 0).length;
  if (zeroDays >= 2 && max >= 10) return { status: "dying", score: 90 };
  if (zeroDays >= 1 && max >= 20) return { status: "dying", score: 80 };

  // ── 4. Volatilidade alta (CV) → instável demais ──
  if (avg > 0 && n >= 3) {
    const cv = stdDev(counts) / avg;
    if (cv > 0.6) return { status: "dying", score: 75 };
  }

  // ── 5. Tendência percentual ──
  if (first === 0) {
    // Saiu do zero → escalando
    return last > 0
      ? { status: "scaling", score: Math.min(60 + last, 95) }
      : { status: "monitoring", score: 10 };
  }

  const pct = ((last - first) / first) * 100;

  // Crescimento forte
  if (pct > 20) {
    const volumeBonus = Math.min(last / 5, 20);
    return { status: "scaling", score: Math.round(Math.min(70 + volumeBonus, 100)) };
  }

  // Crescimento moderado com volume relevante
  if (pct > 10 && last >= 10) {
    return { status: "scaling", score: 65 };
  }

  // Queda forte
  if (pct < -15) {
    return { status: "dying", score: Math.round(Math.min(60 + Math.abs(pct) / 2, 95)) };
  }

  // Dados insuficientes para julgar lateral
  if (n < 3) return { status: "monitoring", score: 25 };

  // ── 6. Estável / lateral ──
  const consistency = avg > 0 ? 1 - stdDev(counts) / avg : 1;
  const stableScore = Math.round(40 + consistency * 30 + Math.min(avg / 10, 20));
  return { status: "stable", score: Math.min(stableScore, 90) };
}

// ═══ Scrape + Save (função compartilhada para evitar HTTP interno) ═══

/**
 * Scrapa uma oferta via Meta API e salva o snapshot.
 * Recalcula status, market strength score e padrão de escala.
 * Usada tanto em POST /api/spy/offers quanto no cron diário.
 */
export async function scrapeAndSaveSnapshot(
  offerId: string,
  pageId: string,
  country: string,
  currentStatus: OfferStatus,
  supabase: ReturnType<typeof createServerClient>
): Promise<{ count: number; status: OfferStatus }> {
  const countryCodes = COUNTRY_CODES[country as Country] ?? ["BR"];

  // 1. Conta ads via Meta API
  const count = await countActiveAds(pageId, countryCodes);

  // 2. Upsert snapshot (idempotente — pode rodar várias vezes no mesmo dia)
  const today = new Date().toISOString().split("T")[0];
  const { error: snapErr } = await supabase
    .from("offer_snapshots")
    .upsert(
      { offer_id: offerId, date: today, active_ads_count: count },
      { onConflict: "offer_id,date" }
    );

  if (snapErr) throw snapErr;

  // 3. Busca os últimos 5 snapshots para calcular status e scoring
  const { data: recentSnaps } = await supabase
    .from("offer_snapshots")
    .select("active_ads_count, date")
    .eq("offer_id", offerId)
    .order("date", { ascending: true })
    .limit(5);

  const snaps = (recentSnaps ?? []) as Pick<OfferSnapshot, "active_ads_count" | "date">[];

  // 4. Calcula status categórico (lógica existente)
  const { status: newStatus } = calculateStatus(
    snaps as Pick<OfferSnapshot, "active_ads_count">[],
    currentStatus
  );

  // 5. Calcula market strength score + padrão de escala
  const strength = calculateMarketStrength(snaps);

  // 6. Calcula dias de observação
  const { data: offerData } = await supabase
    .from("offers")
    .select("created_at")
    .eq("id", offerId)
    .single();

  const createdAt = offerData?.created_at ? new Date(offerData.created_at) : new Date();
  const observationDays = Math.floor(
    (new Date().getTime() - createdAt.getTime()) / 86_400_000
  );

  // 7. Atualiza offer com tudo
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
    .eq("id", offerId);

  return { count, status: newStatus };
}

// ═══ Delta calculation (UI helper) ═══

export function calcDeltaPct(snapshots: Pick<OfferSnapshot, "active_ads_count">[]): string {
  if (snapshots.length < 2) return "—";
  const first = snapshots[0].active_ads_count;
  const last  = snapshots[snapshots.length - 1].active_ads_count;
  if (first === 0) return last > 0 ? "+∞%" : "—";
  const pct = ((last - first) / first) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}
