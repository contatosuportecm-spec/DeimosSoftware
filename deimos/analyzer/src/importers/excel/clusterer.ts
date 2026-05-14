// =============================================================================
// CLUSTERER — Agrupa observações em Ofertas Simplificadas
//
// Cada observação é PRESERVADA.
// O clustering não descarta linhas — apenas cria associações entre elas.
//
// Algoritmo (multi-etapa):
//   1. Processa observações em ordem cronológica (oldest-first)
//   2. Para cada observação, tokeniza o nome normalizado
//   3. Computa match score híbrido contra cada cluster existente:
//      a. Jaccard vs token_set expandido (comportamento original)
//      b. Jaccard vs seed_tokens (imuniza contra diluição do cluster crescente)
//      c. Containment: obs é subconjunto do seed → captura nomes abreviados
//   4. Match score >= clusterThreshold → associa ao melhor cluster
//   5. Nenhum match → cria novo cluster com esta observação como seed
//   6. Expande token_set (union) — permite matching mais amplo no futuro
//   7. Calcula agregados e scores ao final
//   8. Seleciona canonical_name por scoring semântico (não mais o primeiro seed)
//   9. Detecta candidatos a merge entre clusters separados
// =============================================================================

import { computeClusterId } from '../../utils/hash';
import { tokenize, normalizeText, jaccardSimilarity } from '../../utils/text';
import { logger } from '../../utils/logger';
import type {
  NormalizedObservation,
  OfferCluster,
  ClusterAssignment,
  ImportOptions,
  MergeCandidate,
} from '../../types/index';

// ---------------------------------------------------------------------------
// Pesos do score de força de mercado (somam 1.0)
// ---------------------------------------------------------------------------

const WEIGHTS = {
  diversity:    0.20,  // players distintos — principal sinal de clonagem de mercado
  constancy:    0.25,  // quão sustentado ao longo do tempo
  recency:      0.25,  // quão recente foi a última observação
  volume:       0.30,  // anúncios ativos acumulados (proxy de investimento)
};

// ---------------------------------------------------------------------------
// Termos genéricos — penalizados na seleção do canonical_name
// ---------------------------------------------------------------------------

const GENERIC_SINGLE_TERMS = new Set([
  // Temas espirituais/relacionamentos
  'alma', 'visao', 'mao', 'oracao', 'amor', 'fe', 'deus', 'jesus', 'luz', 'paz', 'cura',
  // Saúde/corpo
  'saude', 'corpo', 'emagrecer', 'emagrecimento', 'dieta',
  // Finanças/negócios
  'dinheiro', 'riqueza', 'sucesso', 'poder', 'forca',
  // Produto/formato
  'metodo', 'tecnica', 'sistema', 'programa', 'curso', 'treinamento', 'formula',
  // Outros genéricos de 1 palavra
  'vida', 'bem', 'homem', 'mulher', 'filho', 'familia',
]);

// Threshold para detectar clusters candidatos a merge (pós-clustering)
const MERGE_CANDIDATE_THRESHOLD = 0.55;

// ---------------------------------------------------------------------------
// Entrada principal
// ---------------------------------------------------------------------------

export function clusterObservations(
  observations: NormalizedObservation[],
  options: ImportOptions,
): { assignments: ClusterAssignment[]; clusters: OfferCluster[]; mergeCandidates: MergeCandidate[] } {
  logger.section('Clustering de Ofertas Simplificadas');
  logger.info(`Processando ${observations.length} observação(ões) com threshold ${options.clusterThreshold}...`);

  // Ordena por data para que clusters se formem cronologicamente
  const sorted = [...observations].sort((a, b) => {
    if (!a.observed_at && !b.observed_at) return a.rowIndex - b.rowIndex;
    if (!a.observed_at) return 1;
    if (!b.observed_at) return -1;
    return a.observed_at.getTime() - b.observed_at.getTime();
  });

  const clusters = new Map<string, OfferCluster>();
  const assignmentByRow = new Map<number, ClusterAssignment>();

  let newClusterCount = 0;
  let mergedCount = 0;

  for (const obs of sorted) {
    const obsTokens = tokenize(obs.normalized_name);

    // Busca o melhor cluster existente por score híbrido
    let bestCluster: OfferCluster | null = null;
    let bestScore = 0;

    for (const cluster of clusters.values()) {
      const score = computeClusterMatchScore(obsTokens, cluster);
      if (score >= options.clusterThreshold && score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    }

    let targetCluster: OfferCluster;
    let isNewCluster = false;

    if (bestCluster) {
      targetCluster = bestCluster;
      mergedCount++;
    } else {
      // Cria novo cluster com esta observação como seed
      isNewCluster = true;
      newClusterCount++;
      const clusterId = computeClusterId(obs.normalized_name);

      targetCluster = {
        clusterId,
        canonical_name: obs.raw_name,       // placeholder — será recomputado após coleta
        canonical_name_score: 0,
        canonical_name_reason: '',
        is_generic_name: false,
        name_variants: [],
        seed_tokens: new Set(obsTokens),     // imutável — snapshot do seed
        token_set: new Set<string>(),
        observations: [],
        total_observations: 0,
        distinct_players: 0,
        total_active_ads: 0,
        active_days_span: 0,
        recency_score: 0,
        volume_score: 0,
        diversity_score: 0,
        constancy_score: 0,
        observations_score: 0,
        market_strength_score: 0,
      };
      clusters.set(clusterId, targetCluster);
    }

    // Vincula observação ao cluster
    targetCluster.observations.push(obs);

    // Expande o token_set (union) — permite matching mais amplo no futuro
    for (const token of obsTokens) {
      targetCluster.token_set.add(token);
    }

    // Registra variante do nome se for nova
    if (!targetCluster.name_variants.includes(obs.raw_name)) {
      targetCluster.name_variants.push(obs.raw_name);
    }

    assignmentByRow.set(obs.rowIndex, {
      observation: obs,
      cluster: targetCluster,
      similarityScore: isNewCluster ? 1.0 : bestScore,
      isNewCluster,
    });
  }

  // Computa agregados e scores para todos os clusters
  const clusterList = [...clusters.values()];
  const referenceDate = new Date();

  for (const cluster of clusterList) {
    computeAggregates(cluster);
    computeScores(cluster, referenceDate);
    applyCanonicalName(cluster);
  }

  // Detecta candidatos a merge entre clusters distintos
  const mergeCandidates = detectMergeCandidates(clusterList);

  // Reordena assignments para a ordem original do Excel
  const orderedAssignments = observations.map(obs => assignmentByRow.get(obs.rowIndex)!);

  logger.info(
    `Clusters identificados: ${clusterList.length} | ` +
    `${newClusterCount} seeds únicos | ` +
    `${mergedCount} observações agrupadas | ` +
    `${mergeCandidates.length} par(es) candidatos a merge`,
  );

  return { assignments: orderedAssignments, clusters: clusterList, mergeCandidates };
}

// ---------------------------------------------------------------------------
// Score de matching híbrido: Jaccard expandido + Jaccard seed + containment
// ---------------------------------------------------------------------------

/**
 * Computa o score de similaridade entre os tokens de uma observação e um cluster.
 *
 * Combina três métricas:
 *   1. Jaccard vs token_set expandido — comportamento original
 *   2. Jaccard vs seed_tokens — estável, não dilui com crescimento do cluster
 *   3. Containment: se todos os tokens da obs estão no seed → nome abreviado
 *
 * Casos tratados:
 *   - "Alma" vs cluster {alma,gemea} seed → containment = 1.0 × 0.85 = 0.85 ✓
 *   - "Alma" vs cluster crescido {alma,gemea,reconquista,amor} → Jaccard seed = 0.5 ✓
 *   - "Alma" vs cluster {reconquista,amor,volta} → todas métricas = 0 ✗
 */
function computeClusterMatchScore(obsTokens: Set<string>, cluster: OfferCluster): number {
  if (obsTokens.size === 0) return 0;

  const seedTokens = cluster.seed_tokens;
  const expandedTokens = cluster.token_set;

  // 1. Jaccard vs token_set expandido
  const jaccardExpanded = jaccardSimilarity(obsTokens, expandedTokens);

  // 2. Jaccard vs seed tokens (imune à diluição por crescimento)
  const jaccardSeed = seedTokens.size > 0
    ? jaccardSimilarity(obsTokens, seedTokens)
    : 0;

  // 3. Containment: quanto dos tokens da obs está coberto pelo seed
  //    Aplicado apenas quando obs tem <= tokens que o seed (relação de subconjunto)
  let containmentScore = 0;
  if (seedTokens.size > 0 && obsTokens.size <= seedTokens.size) {
    let overlap = 0;
    for (const t of obsTokens) {
      if (seedTokens.has(t)) overlap++;
    }
    const obsContainment = overlap / obsTokens.size;
    // Peso 0.85: containment pleno tem peso menor que Jaccard perfeito (1.0)
    containmentScore = obsContainment * 0.85;
  }

  return Math.max(jaccardExpanded, jaccardSeed, containmentScore);
}

// ---------------------------------------------------------------------------
// Seleção de nome canônico por scoring semântico
// ---------------------------------------------------------------------------

/**
 * Pontua um nome candidato a canonical_name.
 * Favorece nomes descritivos, com múltiplos tokens não-genéricos.
 * Penaliza nomes curtos ou compostos apenas de termos genéricos.
 */
function scoreCanonicalName(name: string): number {
  const tokens = [...tokenize(normalizeText(name))];
  const nonGeneric = tokens.filter(t => !GENERIC_SINGLE_TERMS.has(t));

  let score = 0;

  // Completude semântica: mais tokens = mais específico
  score += tokens.length * 3;

  // Bonus por tokens não-genéricos
  score += nonGeneric.length * 2;

  // Bonus por comprimento do nome (capped em 5 pts para ~40 chars)
  score += Math.min(name.length / 8, 5);

  // Penaliza nomes de token único
  if (tokens.length <= 1) score -= 8;

  // Penalidade forte se o único token é genérico
  if (tokens.length === 1 && GENERIC_SINGLE_TERMS.has(tokens[0] ?? '')) score -= 15;

  // Bonus para nomes semanticamente ricos (3+ tokens não-genéricos)
  if (nonGeneric.length >= 3) score += 4;

  return score;
}

/**
 * Seleciona o melhor canonical_name dentre todas as variantes do cluster.
 * Retorna o nome, seu score e o motivo da escolha.
 */
function selectCanonicalName(variants: string[]): {
  name: string;
  score: number;
  reason: string;
} {
  if (variants.length === 0) return { name: '', score: 0, reason: 'sem variantes' };

  let bestName = variants[0];
  let bestScore = -Infinity;

  for (const name of variants) {
    const s = scoreCanonicalName(name);
    if (s > bestScore) {
      bestScore = s;
      bestName = name;
    }
  }

  // Constrói explicação do motivo
  const tokens = [...tokenize(normalizeText(bestName))];
  const nonGeneric = tokens.filter(t => !GENERIC_SINGLE_TERMS.has(t));
  let reason: string;

  if (variants.length === 1) {
    reason = 'único nome disponível';
  } else if (tokens.length >= 3 && nonGeneric.length >= 2) {
    reason = `mais descritivo: ${tokens.length} tokens, ${nonGeneric.length} não-genéricos`;
  } else if (tokens.length >= 2) {
    reason = `maior completude semântica: ${tokens.length} tokens`;
  } else if (nonGeneric.length > 0) {
    reason = `único token não-genérico disponível`;
  } else {
    reason = `melhor score disponível (${bestScore.toFixed(1)})`;
  }

  return { name: bestName, score: bestScore, reason };
}

/**
 * Retorna true se o nome canônico é considerado genérico/vago demais.
 */
function isGenericName(name: string): boolean {
  const tokens = [...tokenize(normalizeText(name))];
  if (tokens.length === 0) return true;
  if (tokens.length === 1 && GENERIC_SINGLE_TERMS.has(tokens[0])) return true;
  // Nome com apenas 1 token (mesmo não-genérico) ainda é borderline
  if (tokens.length <= 1) return true;
  return false;
}

/**
 * Aplica o melhor canonical_name ao cluster após coleta completa de variantes.
 */
function applyCanonicalName(cluster: OfferCluster): void {
  const { name, score, reason } = selectCanonicalName(cluster.name_variants);
  cluster.canonical_name = name;
  cluster.canonical_name_score = score;
  cluster.canonical_name_reason = reason;
  cluster.is_generic_name = isGenericName(name);
}

// ---------------------------------------------------------------------------
// Detecção de candidatos a merge (subagrupamento)
// ---------------------------------------------------------------------------

/**
 * Compara todos os pares de clusters e identifica aqueles que provavelmente
 * deveriam ter sido agrupados.
 *
 * Exemplos esperados:
 *   - "Alma" (cluster A) ↔ "Alma gêmea" (cluster B) → similarity alta
 *   - Nome completo ↔ versão abreviada do mesmo nome
 *
 * Usa o mesmo computeClusterMatchScore para consistência.
 * Threshold propositalmente acima do clusterThreshold padrão.
 */
function detectMergeCandidates(clusters: OfferCluster[]): MergeCandidate[] {
  const candidates: MergeCandidate[] = [];

  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const a = clusters[i];
      const b = clusters[j];

      // Compara seed de A contra cluster B, e vice-versa
      const scoreAB = computeClusterMatchScore(a.seed_tokens, b);
      const scoreBA = computeClusterMatchScore(b.seed_tokens, a);
      const maxScore = Math.max(scoreAB, scoreBA);

      if (maxScore >= MERGE_CANDIDATE_THRESHOLD) {
        const nameA = normalizeText(a.canonical_name);
        const nameB = normalizeText(b.canonical_name);
        let reason: string;

        if (nameA.includes(nameB) || nameB.includes(nameA)) {
          reason = 'name_containment — um nome contém o outro';
        } else if (maxScore >= 0.75) {
          reason = 'alta_similaridade_tokens';
        } else {
          reason = 'tokens_compartilhados_significativos';
        }

        candidates.push({
          clusterA_id:   a.clusterId,
          clusterA_name: a.canonical_name,
          clusterB_id:   b.clusterId,
          clusterB_name: b.canonical_name,
          similarity:    Math.round(maxScore * 100) / 100,
          reason,
        });
      }
    }
  }

  return candidates.sort((a, b) => b.similarity - a.similarity);
}

// ---------------------------------------------------------------------------
// Cálculo de agregados por cluster
// ---------------------------------------------------------------------------

function computeAggregates(cluster: OfferCluster): void {
  const obs = cluster.observations;

  cluster.total_observations = obs.length;

  // Players distintos = domínios únicos não-nulos
  const domains = new Set(
    obs.map(o => o.domain).filter((d): d is string => !!d),
  );
  cluster.distinct_players = domains.size;

  // Total de ads: soma dos picos semanais de cada observação
  cluster.total_active_ads = obs.reduce((sum, o) => sum + o.total_active_ads, 0);

  // Span temporal
  const dates = obs
    .map(o => o.observed_at)
    .filter((d): d is Date => d != null);

  if (dates.length > 0) {
    dates.sort((a, b) => a.getTime() - b.getTime());
    cluster.first_seen_at = dates[0];
    cluster.last_seen_at  = dates[dates.length - 1];
    cluster.active_days_span = Math.round(
      (cluster.last_seen_at.getTime() - cluster.first_seen_at.getTime()) / 86_400_000,
    );
  } else {
    cluster.active_days_span = 0;
  }
}

// ---------------------------------------------------------------------------
// Fórmulas de score (5 componentes)
// ---------------------------------------------------------------------------

function computeScores(cluster: OfferCluster, today: Date): void {
  // --- Diversidade (20%) — principal sinal de clonagem ---
  // distinct_players / 5 → 1 = 0.20 | 3 = 0.60 | 5+ = 1.0
  const diversity = Math.min(1, cluster.distinct_players / 5);

  // --- Constância (25%) ---
  // span_score (0.6) + density_score (0.4)
  const spanScore = Math.min(1, cluster.active_days_span / 90);
  const weeksSpan = Math.max(1, cluster.active_days_span / 7);
  const obsPerWeek = cluster.total_observations / weeksSpan;
  const densityScore = Math.min(1, obsPerWeek / 3);
  const constancy = spanScore * 0.6 + densityScore * 0.4;

  // --- Recência (25%) ---
  // Decaimento exponencial: exp(-dias/60)
  // 0 dias → 1.0 | 30 dias → 0.61 | 60 dias → 0.37 | 90 dias → 0.22 | 180 dias → 0.05
  let recency = 0;
  if (cluster.last_seen_at) {
    const daysSince = (today.getTime() - cluster.last_seen_at.getTime()) / 86_400_000;
    recency = Math.exp(-Math.max(0, daysSince) / 60);
  }

  // --- Volume (30%) — proxy de investimento em ads ---
  // log10(total_ads + 1) / 2 → 0 = 0 | 10 = 0.52 | 50 = 0.85 | 100+ = 1.0
  const volume = Math.min(1, Math.log10(cluster.total_active_ads + 1) / 2);

  cluster.recency_score       = recency;
  cluster.diversity_score     = diversity;
  cluster.observations_score  = 0;  // removido da fórmula (campo mantido por retrocompatibilidade)
  cluster.constancy_score     = constancy;
  cluster.volume_score        = volume;

  cluster.market_strength_score =
    (diversity * WEIGHTS.diversity +
     constancy * WEIGHTS.constancy +
     recency   * WEIGHTS.recency   +
     volume    * WEIGHTS.volume) * 100;
}
