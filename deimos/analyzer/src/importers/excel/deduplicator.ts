import type { Pool } from 'pg';
import { computeOfferHash } from '../../utils/hash';
import { tokenize, jaccardSimilarity, truncate } from '../../utils/text';
import { logger } from '../../utils/logger';
import type {
  NormalizedOffer,
  DedupResult,
  DedupDecision,
  ImportOptions,
} from '../../types/index';

// ---------------------------------------------------------------------------
// Tipagem interna — candidatos vindos do DB para comparação Jaccard
// ---------------------------------------------------------------------------

interface DbCandidate {
  id: number;
  canonical_name: string;
  canonical_offer_hash: string | null;
  niche: string | null;
  offer_type: string | null;
}

// ---------------------------------------------------------------------------
// Entrada principal
// ---------------------------------------------------------------------------

/**
 * Executa o pipeline de deduplicação em 3 passos:
 * 1. Computa canonical_offer_hash para cada oferta
 * 2. Deduplicação intra-batch (hashes + Jaccard entre as próprias linhas do Excel)
 * 3. Deduplicação contra o banco (hashes exatos + Jaccard por nicho/tipo)
 */
export async function deduplicateBatch(
  offers: NormalizedOffer[],
  pool: Pool,
  options: ImportOptions,
): Promise<DedupResult[]> {
  logger.section('Deduplicação');
  logger.info(`Processando ${offers.length} oferta(s)...`);

  // --- Passo 1: Computar hashes ---
  for (const offer of offers) {
    offer.canonical_offer_hash = computeOfferHash(offer);
  }

  // --- Passo 2: Dedup intra-batch ---
  const intraBatchResults = deduplicateIntraBatch(offers, options);

  // Separar as que passaram para checar no DB
  const toCheckInDb = intraBatchResults
    .filter(r => r.decision === 'insert')
    .map(r => r.offer);

  logger.info(
    `Intra-batch: ${intraBatchResults.filter(r => r.decision !== 'insert').length} duplicata(s) encontrada(s). ` +
    `${toCheckInDb.length} oferta(s) encaminhadas para verificação no DB.`,
  );

  // --- Passo 3: Dedup contra o DB ---
  const dbResults = await deduplicateAgainstDb(toCheckInDb, pool, options);

  // Mescla resultados: intra-batch + DB
  const dbResultMap = new Map(dbResults.map(r => [r.offer.rowIndex, r]));

  return intraBatchResults.map(r =>
    r.decision === 'insert' && dbResultMap.has(r.offer.rowIndex)
      ? dbResultMap.get(r.offer.rowIndex)!
      : r,
  );
}

// ---------------------------------------------------------------------------
// Passo 2: Dedup intra-batch
// ---------------------------------------------------------------------------

function deduplicateIntraBatch(
  offers: NormalizedOffer[],
  options: ImportOptions,
): DedupResult[] {
  const results: DedupResult[] = [];
  const seenHashes = new Map<string, { rowIndex: number; name: string }>();
  const seenTokens: Array<{ tokens: Set<string>; rowIndex: number; name: string }> = [];

  for (const offer of offers) {
    const hash = offer.canonical_offer_hash!;

    // --- Hash exato intra-batch ---
    const existing = seenHashes.get(hash);
    if (existing) {
      logger.debug(
        `Linha ${offer.rowIndex}: duplicata exata intra-batch de linha ${existing.rowIndex} ` +
        `("${truncate(existing.name, 40)}")`,
      );
      results.push({
        offer,
        decision: 'exact_duplicate',
        match: {
          offerName: existing.name,
          canonicalHash: hash,
          similarityScore: 1,
          reason: 'intra_batch_hash',
        },
      });
      continue;
    }

    // --- Jaccard intra-batch ---
    const offerTokens = buildOfferTokens(offer);
    let bestMatch: { score: number; rowIndex: number; name: string } | null = null;

    for (const candidate of seenTokens) {
      const score = jaccardSimilarity(offerTokens, candidate.tokens);
      if (score >= options.jaccardFlagThreshold) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { score, rowIndex: candidate.rowIndex, name: candidate.name };
        }
      }
    }

    if (bestMatch) {
      const decision: DedupDecision =
        bestMatch.score >= options.jaccardThreshold
          ? 'fuzzy_duplicate'
          : 'fuzzy_candidate';

      if (decision === 'fuzzy_candidate') {
        // Candidato: insere com flag de revisão
        offer.manual_review_status = 'pending';
      }

      logger.debug(
        `Linha ${offer.rowIndex}: Jaccard intra-batch ${(bestMatch.score * 100).toFixed(0)}% ` +
        `com linha ${bestMatch.rowIndex} → ${decision}`,
      );

      results.push({
        offer,
        decision,
        match: {
          offerName: bestMatch.name,
          similarityScore: bestMatch.score,
          reason: 'jaccard_batch',
        },
      });

      if (decision === 'fuzzy_candidate') {
        // Ainda será inserida; registra no índice para futuras comparações
        seenHashes.set(hash, { rowIndex: offer.rowIndex, name: offer.canonical_name });
        seenTokens.push({ tokens: offerTokens, rowIndex: offer.rowIndex, name: offer.canonical_name });
      }
      continue;
    }

    // Nenhuma duplicata encontrada no batch
    seenHashes.set(hash, { rowIndex: offer.rowIndex, name: offer.canonical_name });
    seenTokens.push({ tokens: offerTokens, rowIndex: offer.rowIndex, name: offer.canonical_name });
    results.push({ offer, decision: 'insert' });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Passo 3: Dedup contra o DB
// ---------------------------------------------------------------------------

async function deduplicateAgainstDb(
  offers: NormalizedOffer[],
  pool: Pool,
  options: ImportOptions,
): Promise<DedupResult[]> {
  if (offers.length === 0) return [];

  // --- 3a: Verifica hashes exatos em um único round-trip ---
  const hashes = offers.map(o => o.canonical_offer_hash!);
  const { rows: existingHashes } = await pool.query<{
    canonical_offer_hash: string;
    id: number;
    canonical_name: string;
  }>(
    `SELECT id, canonical_offer_hash, canonical_name
     FROM offers
     WHERE canonical_offer_hash = ANY($1::text[])`,
    [hashes],
  );

  const existingHashMap = new Map(
    existingHashes.map(row => [row.canonical_offer_hash, row]),
  );

  // --- 3b: Busca candidatos Jaccard por (niche, offer_type) ---
  // Uma query por combinação distinta — minimiza round-trips
  const nicheTypeKeys = [
    ...new Set(offers.map(o => `${o.niche ?? ''}|${o.offer_type}`)),
  ];

  const dbCandidateMap = new Map<string, DbCandidate[]>();

  for (const key of nicheTypeKeys) {
    const [niche, offerType] = key.split('|');
    const { rows: candidates } = await pool.query<DbCandidate>(
      `SELECT id, canonical_name, canonical_offer_hash, niche, offer_type
       FROM offers
       WHERE (niche = $1 OR ($1 = '' AND niche IS NULL))
         AND offer_type = $2::offer_type`,
      [niche || null, offerType],
    );
    dbCandidateMap.set(key, candidates);
  }

  // --- 3c: Classifica cada oferta ---
  const results: DedupResult[] = [];
  let exactMatches = 0;
  let fuzzyMatches = 0;

  for (const offer of offers) {
    // Verifica hash exato
    const exactMatch = existingHashMap.get(offer.canonical_offer_hash!);
    if (exactMatch) {
      exactMatches++;
      results.push({
        offer,
        decision: 'exact_duplicate',
        match: {
          offerId: exactMatch.id,
          offerName: exactMatch.canonical_name,
          canonicalHash: exactMatch.canonical_offer_hash,
          similarityScore: 1,
          reason: 'exact_hash',
        },
      });
      continue;
    }

    // Verifica Jaccard contra candidatos do DB
    const key = `${offer.niche ?? ''}|${offer.offer_type}`;
    const candidates = dbCandidateMap.get(key) ?? [];

    const offerTokens = buildOfferTokens(offer);
    let bestCandidate: { score: number; candidate: DbCandidate } | null = null;

    for (const candidate of candidates) {
      const candidateTokens = buildCandidateTokens(candidate);
      const score = jaccardSimilarity(offerTokens, candidateTokens);
      if (score >= options.jaccardFlagThreshold) {
        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = { score, candidate };
        }
      }
    }

    if (bestCandidate) {
      fuzzyMatches++;
      const { score, candidate } = bestCandidate;
      const decision: DedupDecision =
        score >= options.jaccardThreshold ? 'fuzzy_duplicate' : 'fuzzy_candidate';

      if (decision === 'fuzzy_candidate') {
        offer.manual_review_status = 'pending';
      }

      results.push({
        offer,
        decision,
        match: {
          offerId: candidate.id,
          offerName: candidate.canonical_name,
          canonicalHash: candidate.canonical_offer_hash ?? undefined,
          similarityScore: score,
          reason: 'jaccard_db',
        },
      });
      continue;
    }

    results.push({ offer, decision: 'insert' });
  }

  logger.info(
    `DB: ${exactMatches} hash(es) exato(s), ${fuzzyMatches} match(es) fuzzy encontrados.`,
  );

  return results;
}

// ---------------------------------------------------------------------------
// Helpers de tokenização
// ---------------------------------------------------------------------------

/** Tokens de uma oferta normalizada: canonical_name + niche + subniche */
function buildOfferTokens(offer: NormalizedOffer): Set<string> {
  const parts = [
    offer.canonical_name,
    offer.niche ?? '',
    offer.subniche ?? '',
  ].join(' ');
  return tokenize(parts);
}

/** Tokens de um candidato do banco: canonical_name + niche */
function buildCandidateTokens(candidate: DbCandidate): Set<string> {
  const parts = [
    candidate.canonical_name,
    candidate.niche ?? '',
  ].join(' ');
  return tokenize(parts);
}
