import type { Pool, PoolClient } from 'pg';
import { logger } from '../../utils/logger';
import type {
  NormalizedObservation,
  OfferCluster,
  ClusterAssignment,
  PersistBatchResult,
  PersistedObservation,
  PersistedCluster,
} from '../../types/index';

// ---------------------------------------------------------------------------
// Entrada principal
// ---------------------------------------------------------------------------

/**
 * Persiste clusters (simplified_offers) e observações (offer_observations).
 *
 * Ordem obrigatória:
 *   1. Upsert de todos os clusters → obtém IDs do banco
 *   2. Insert de todas as observações → cada uma referencia seu cluster
 *
 * Observações são SEMPRE inseridas (nunca ignoradas por "duplicata").
 * Clusters são upsertados — mesmo cluster acumula agregados ao longo do tempo.
 */
export async function persistClustersAndObservations(
  assignments: ClusterAssignment[],
  clusters: OfferCluster[],
  pool: Pool,
  batchSize: number,
): Promise<PersistBatchResult> {
  const result: PersistBatchResult = {
    succeededObservations: [],
    succeededClusters: [],
    failed: [],
  };

  // --- Passo 1: Upsert de clusters ---
  logger.info(`Persistindo ${clusters.length} cluster(s) de oferta simplificada...`);
  const clusterDbIdMap = new Map<string, number>(); // clusterId → id no banco

  for (const cluster of clusters) {
    try {
      const persisted = await upsertCluster(cluster, pool);
      clusterDbIdMap.set(cluster.clusterId, persisted.id);
      result.succeededClusters.push(persisted);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Cluster "${cluster.canonical_name}": falha ao persistir — ${msg}`);
      // Marca todas as observações deste cluster como falhas
      for (const obs of cluster.observations) {
        result.failed.push({ observation: obs, error: `Cluster falhou: ${msg}` });
      }
    }
  }

  // --- Passo 2: Insert de observações em batches ---
  const toInsert = assignments.filter(a => clusterDbIdMap.has(a.cluster.clusterId));
  logger.info(`Persistindo ${toInsert.length} observação(ões)...`);

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const batchNum   = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(toInsert.length / batchSize);
    logger.debug(`Batch ${batchNum}/${totalBatches}: ${batch.length} observação(ões)`);

    try {
      const batchResult = await insertObservationBatch(batch, clusterDbIdMap, pool);
      result.succeededObservations.push(...batchResult);
    } catch {
      logger.warn(`Batch ${batchNum} falhou. Tentando inserção individual...`);
      for (const assignment of batch) {
        try {
          const persisted = await insertSingleObservation(assignment, clusterDbIdMap, pool);
          if (persisted) result.succeededObservations.push(persisted);
        } catch (rowErr: unknown) {
          const msg = rowErr instanceof Error ? rowErr.message : String(rowErr);
          logger.error(`Linha ${assignment.observation.rowIndex}: ${msg}`);
          result.failed.push({ observation: assignment.observation, error: msg });
        }
      }
    }
  }

  const insertedClusters = result.succeededClusters.filter(c => c.wasInserted).length;
  const updatedClusters  = result.succeededClusters.filter(c => !c.wasInserted).length;
  logger.info(
    `Persistência concluída: ${result.succeededObservations.length} observação(ões) | ` +
    `${insertedClusters} cluster(s) novo(s) | ${updatedClusters} cluster(s) atualizado(s) | ` +
    `${result.failed.length} falha(s)`,
  );

  return result;
}

// ---------------------------------------------------------------------------
// Upsert de cluster (simplified_offers)
// ---------------------------------------------------------------------------

async function upsertCluster(
  cluster: OfferCluster,
  pool: Pool,
): Promise<PersistedCluster> {
  const sql = `
    INSERT INTO simplified_offers (
      canonical_name,
      name_variants,
      total_observations,
      distinct_players,
      total_active_ads,
      first_seen_at,
      last_seen_at,
      active_days_span,
      recency_score,
      volume_score,
      diversity_score,
      constancy_score,
      market_strength_score,
      updated_at
    )
    VALUES ($1, $2::text[], $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
    ON CONFLICT (canonical_name) DO UPDATE SET
      name_variants         = EXCLUDED.name_variants,
      total_observations    = EXCLUDED.total_observations,
      distinct_players      = EXCLUDED.distinct_players,
      total_active_ads      = EXCLUDED.total_active_ads,
      first_seen_at         = LEAST(simplified_offers.first_seen_at, EXCLUDED.first_seen_at),
      last_seen_at          = GREATEST(simplified_offers.last_seen_at, EXCLUDED.last_seen_at),
      active_days_span      = EXCLUDED.active_days_span,
      recency_score         = EXCLUDED.recency_score,
      volume_score          = EXCLUDED.volume_score,
      diversity_score       = EXCLUDED.diversity_score,
      constancy_score       = EXCLUDED.constancy_score,
      market_strength_score = EXCLUDED.market_strength_score,
      updated_at            = NOW()
    RETURNING id, canonical_name, (xmax = 0) AS was_inserted
  `;

  const { rows } = await pool.query<{
    id: number;
    canonical_name: string;
    was_inserted: boolean;
  }>(sql, [
    cluster.canonical_name,
    cluster.name_variants,
    cluster.total_observations,
    cluster.distinct_players,
    cluster.total_active_ads,
    cluster.first_seen_at  ?? null,
    cluster.last_seen_at   ?? null,
    cluster.active_days_span,
    round2(cluster.recency_score),
    round2(cluster.volume_score),
    round2(cluster.diversity_score),
    round2(cluster.constancy_score),
    round2(cluster.market_strength_score),
  ]);

  return {
    id:           rows[0].id,
    canonicalName: rows[0].canonical_name,
    wasInserted:  rows[0].was_inserted,
  };
}

// ---------------------------------------------------------------------------
// Insert de observações (offer_observations)
// ---------------------------------------------------------------------------

async function insertObservationBatch(
  assignments: ClusterAssignment[],
  clusterDbIdMap: Map<string, number>,
  pool: Pool,
): Promise<PersistedObservation[]> {
  const client = await pool.connect();
  const results: PersistedObservation[] = [];

  try {
    await client.query('BEGIN');
    for (const assignment of assignments) {
      const persisted = await insertObservation(assignment, clusterDbIdMap, client);
      if (persisted) results.push(persisted);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return results;
}

async function insertSingleObservation(
  assignment: ClusterAssignment,
  clusterDbIdMap: Map<string, number>,
  pool: Pool,
): Promise<PersistedObservation | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await insertObservation(assignment, clusterDbIdMap, client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function insertObservation(
  assignment: ClusterAssignment,
  clusterDbIdMap: Map<string, number>,
  client: PoolClient,
): Promise<PersistedObservation | null> {
  const { observation: obs, cluster, similarityScore } = assignment;
  const simplifiedOfferId = clusterDbIdMap.get(cluster.clusterId);
  if (!simplifiedOfferId) return null;

  const sql = `
    INSERT INTO offer_observations (
      raw_name, normalized_name, domain, observed_at,
      active_ads_day1, active_ads_day2, active_ads_day3,
      active_ads_day4, active_ads_day5, active_ads_day6,
      total_active_ads,
      checkout_type, offer_tested, roi_result, insights, notes,
      simplified_offer_id, cluster_similarity,
      source_row, raw_data
    )
    VALUES (
      $1,  $2,  $3,  $4,
      $5,  $6,  $7,  $8,  $9,  $10,
      $11,
      $12, $13, $14, $15, $16,
      $17, $18,
      $19, $20::jsonb
    )
    RETURNING id, simplified_offer_id
  `;

  const { rows } = await client.query<{
    id: number;
    simplified_offer_id: number;
  }>(sql, [
    obs.raw_name,
    obs.normalized_name,
    obs.domain           ?? null,
    obs.observed_at      ?? null,
    obs.active_ads_day1  ?? null,
    obs.active_ads_day2  ?? null,
    obs.active_ads_day3  ?? null,
    obs.active_ads_day4  ?? null,
    obs.active_ads_day5  ?? null,
    obs.active_ads_day6  ?? null,
    obs.total_active_ads,
    obs.checkout_type    ?? null,
    obs.offer_tested     ?? null,
    obs.roi_result       ?? null,
    obs.insights         ?? null,
    obs.notes            ?? null,
    simplifiedOfferId,
    Math.round(similarityScore * 1000) / 1000,
    obs.rowIndex,
    JSON.stringify(obs._raw),
  ]);

  return {
    id:               rows[0].id,
    simplifiedOfferId: rows[0].simplified_offer_id,
  };
}

// ---------------------------------------------------------------------------
// Registro de jobs de importação
// ---------------------------------------------------------------------------

export async function createImportJob(
  filePath: string,
  pool: Pool,
): Promise<number> {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO processing_jobs
       (job_type, status, triggered_by, started_at, metadata)
     VALUES (
       'excel_import'::job_type, 'running'::job_status, 'cli', NOW(), $1::jsonb
     )
     RETURNING id`,
    [JSON.stringify({ source_file: filePath })],
  );
  return rows[0].id;
}

export async function finalizeImportJob(
  jobId: number,
  stats: {
    itemsTotal: number;
    itemsProcessed: number;
    itemsFailed: number;
    hasErrors: boolean;
    report: object;
  },
  pool: Pool,
): Promise<void> {
  const status = stats.hasErrors ? 'partial' : 'completed';
  await pool.query(
    `UPDATE processing_jobs
     SET status          = $1::job_status,
         finished_at     = NOW(),
         items_total     = $2,
         items_processed = $3,
         items_failed    = $4,
         metadata        = metadata || $5::jsonb
     WHERE id = $6`,
    [
      status,
      stats.itemsTotal,
      stats.itemsProcessed,
      stats.itemsFailed,
      JSON.stringify({ report: stats.report }),
      jobId,
    ],
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
