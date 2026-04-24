import type { OfferSnapshot } from "@/types";

// ═══ Types ═══

export type ScalingPattern =
  | "lateral"
  | "vertical"
  | "budget"
  | "creative_flood"
  | "mixed"
  | "unknown";

export interface MarketStrengthResult {
  market_strength: number;    // 0-100 score final
  volume_score: number;       // 0-100 componente
  growth_score: number;       // 0-100 componente
  consistency_score: number;  // 0-100 componente
  recency_score: number;      // 0-100 componente
  scaling_pattern: ScalingPattern;
}

// ═══ Pesos (somam 100) ═══

const WEIGHTS = {
  volume:      30,
  growth:      25,
  consistency: 25,
  recency:     20,
};

// ═══ Helpers matemáticos ═══

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ═══ Regressão linear simples ═══

function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  const xMean = (n - 1) / 2;
  const yMean = mean(values);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    numerator += dx * (values[i] - yMean);
    denominator += dx * dx;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

// ═══ Componentes de Score ═══

/**
 * Volume (30%) — proxy de investimento em ads.
 * Log scale: satura em ~100 ads.
 * 0→0 | 5→0.35 | 10→0.50 | 20→0.65 | 50→0.85 | 100+→1.0
 */
function calcVolume(lastCount: number): number {
  if (lastCount <= 0) return 0;
  return Math.min(1, Math.log10(lastCount + 1) / 2);
}

/**
 * Growth (25%) — tendência via regressão linear + sigmoid.
 * Precisa de >= 3 snapshots. Com menos, retorna 0.5 (neutro).
 * 0 = queda forte, 0.5 = estável, 1.0 = crescimento forte.
 */
function calcGrowth(counts: number[]): number {
  if (counts.length < 3) return 0.5;

  const avg = mean(counts);
  if (avg === 0) return 0.5;

  const slope = linearSlope(counts);
  // Normaliza slope relativo à média (% de variação por dia)
  const slopeNorm = (slope / avg) * 100;

  // Sigmoid com fator 15: ±30% de variação diária → ~0.88 / 0.12
  return sigmoid(slopeNorm / 15);
}

/**
 * Consistency (25%) — inverso do coeficiente de variação.
 * Mede estabilidade: ads consistentes = oferta sustentada.
 * Bonus se todos os dias têm ads > 0.
 */
function calcConsistency(counts: number[]): number {
  if (counts.length < 2) return 0;

  const avg = mean(counts);
  if (avg === 0) return 0;

  const cv = stdDev(counts) / avg;
  let consistency = 1 - Math.min(1, cv);

  // Bonus: todos os dias ativos
  const allActive = counts.every((c) => c > 0);
  if (allActive) consistency = Math.min(1, consistency + 0.1);

  return consistency;
}

/**
 * Recency (20%) — decaimento exponencial.
 * Mede quão recente foi a última atividade.
 * 0 dias → 1.0 | 7 → 0.79 | 15 → 0.61 | 30 → 0.37 | 60 → 0.14
 */
function calcRecency(snapshots: SnapshotInput[], today: Date): number {
  // Encontra o snapshot mais recente com count > 0
  let lastActiveDate: Date | null = null;

  for (let i = snapshots.length - 1; i >= 0; i--) {
    if (snapshots[i].active_ads_count > 0) {
      lastActiveDate = new Date(snapshots[i].date);
      break;
    }
  }

  if (!lastActiveDate) return 0;

  const daysSince = (today.getTime() - lastActiveDate.getTime()) / 86_400_000;
  return Math.exp(-Math.max(0, daysSince) / 30);
}

// ═══ Detecção de Padrão de Escala ═══

interface PatternInput {
  counts: number[];
  latestCount: number;
  creativeCount?: number | null;
  duplicateCount?: number | null;
}

export function detectScalingPattern(input: PatternInput): ScalingPattern {
  const { counts, latestCount, creativeCount, duplicateCount } = input;

  // Com dados de criativos (futuro — quando collector estiver integrado)
  if (duplicateCount && duplicateCount >= 5) return "creative_flood";
  if (creativeCount && creativeCount <= 3 && latestCount >= 15) return "budget";

  // Com dados atuais (ad count diário)
  if (counts.length < 3 || latestCount <= 0) return "unknown";

  const first = counts[0];
  const avg = mean(counts);
  const cv = avg > 0 ? stdDev(counts) / avg : 0;
  const growth = first > 0 ? (latestCount - first) / first : 0;

  // Lateral: muitos ads + crescimento alto → várias contas/criativos
  if (latestCount >= 20 && growth > 0.3) return "lateral";

  // Vertical: poucos ads, consistente, crescendo
  if (latestCount >= 5 && latestCount < 15 && cv < 0.3 && growth > 0) return "vertical";

  // Budget: poucos ads, muito estável → investe em orçamento, não em volume
  if (latestCount >= 3 && latestCount <= 10 && cv < 0.2) return "budget";

  // Mixed: crescendo com volume relevante mas sem padrão claro
  if (growth > 0 && latestCount >= 10) return "mixed";

  return "unknown";
}

// ═══ Entrada principal ═══

type SnapshotInput = Pick<OfferSnapshot, "active_ads_count" | "date">;

/**
 * Calcula o Market Strength Score de uma oferta.
 *
 * Recebe snapshots ordenados por date ASC (mais antigo primeiro).
 * Retorna score 0-100 com componentes e padrão de escala.
 */
export function calculateMarketStrength(
  snapshots: SnapshotInput[],
  today: Date = new Date()
): MarketStrengthResult {
  if (snapshots.length === 0) {
    return {
      market_strength: 0,
      volume_score: 0,
      growth_score: 0,
      consistency_score: 0,
      recency_score: 0,
      scaling_pattern: "unknown",
    };
  }

  const counts = snapshots.map((s) => s.active_ads_count);
  const lastCount = counts[counts.length - 1];
  const lastSnapshot = snapshots[snapshots.length - 1];

  // Componentes (0-1 internamente)
  const volume = calcVolume(lastCount);
  const growth = calcGrowth(counts);
  const consistency = calcConsistency(counts);
  const recency = calcRecency(snapshots, today);

  // Score final ponderado (0-100)
  const market_strength = round2(
    volume * WEIGHTS.volume +
    growth * WEIGHTS.growth +
    consistency * WEIGHTS.consistency +
    recency * WEIGHTS.recency
  );

  // Padrão de escala
  const scaling_pattern = detectScalingPattern({
    counts,
    latestCount: lastCount,
    creativeCount: null,
    duplicateCount: null,
  });

  return {
    market_strength,
    volume_score: round2(volume * 100),
    growth_score: round2(growth * 100),
    consistency_score: round2(consistency * 100),
    recency_score: round2(recency * 100),
    scaling_pattern,
  };
}
