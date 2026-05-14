-- =============================================================================
-- MIGRATION 001 — Decision System Evolution  [v1.1 — corrigida]
-- Módulo de Inteligência de Ofertas
-- Aplicar sobre: schema.sql (v1)
-- PostgreSQL 15+
-- Data: 2026-03-24
-- Revisão de segurança: 2026-03-24
-- =============================================================================
-- REGISTRO DE CORREÇÕES (v1.1):
--   FIX-1 [CRÍTICO]   ETAPA 3A — DROP DEFAULT antes de ALTER COLUMN TYPE em
--                     offer_analysis.analysis_source. Sem isso, PostgreSQL falha
--                     com "cannot be cast automatically" pois não existe cast
--                     implícito entre dois enum types distintos.
--   FIX-2 [INTEGRIDADE] ETAPA 5 — detected_at: UPDATE após ADD COLUMN para
--                     preservar created_at de rows existentes em vez de fixar
--                     todas no timestamp da migration.
--   FIX-3 [SEMÂNTICO]  ETAPA 6 — Bloco de remediação para raw_ads.processing_status:
--                     rows já vinculadas a ofertas não devem volcar para 'pending'.
--   FIX-4 [COSMÉTICO]  ETAPAs 3A/3B — SET DEFAULT movido para depois do RENAME
--                     para que pg_attrdef exiba o nome canônico do tipo.
-- =============================================================================

BEGIN;

-- =============================================================================
-- ETAPA 1: Drop de views dependentes
-- Necessário antes de alterar tipos de colunas referenciadas
-- =============================================================================

DROP VIEW IF EXISTS v_offer_ranking;
-- v_offer_keywords não referencia tipos que mudarão: mantida sem drop


-- =============================================================================
-- ETAPA 2: Novos enums
-- Criados antes de qualquer ALTER TABLE que os referencie
-- =============================================================================

CREATE TYPE ad_processing_status AS ENUM (
  'pending',        -- aguardando processamento
  'processing',     -- em processamento ativo
  'linked',         -- vinculado a uma oferta
  'deduplicated',   -- marcado como duplicata de outro raw_ad
  'skipped',        -- ignorado por regra (ex: domínio bloqueado)
  'error'           -- falhou durante processamento
);

CREATE TYPE job_type AS ENUM (
  'ingestion',
  'deduplication',
  'clustering',
  'scoring',
  'ai_analysis',
  'excel_import',
  'reprocessing',
  'status_update'
);

CREATE TYPE job_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'partial'
);


-- =============================================================================
-- ETAPA 3A: Substituição do enum analysis_source
--
-- Mapeamento:
--   manual  → manual
--   claude  → ai
--   gpt4    → ai
--   gemini  → ai
--   llama   → ai
--   other   → ai
--
-- [FIX-1] O schema v1 define analysis_source com DEFAULT 'manual'. PostgreSQL
-- não aplica a cláusula USING ao DEFAULT — tenta um cast implícito entre os
-- dois tipos. Como não existe cast implícito entre enums distintos, a ALTER
-- falha com:
--   "default for column cannot be cast automatically to type analysis_source_v2"
-- Solução: DROP DEFAULT antes, SET DEFAULT depois do RENAME.
-- =============================================================================

-- [FIX-1] DROP DEFAULT obrigatório antes de ALTER COLUMN TYPE
ALTER TABLE offer_analysis ALTER COLUMN analysis_source DROP DEFAULT;

CREATE TYPE analysis_source_v2 AS ENUM (
  'rules',    -- análise por regras determinísticas (sem IA)
  'ai',       -- análise por modelo de linguagem
  'hybrid',   -- combinação de regras + IA
  'manual'    -- análise humana manual
);

-- Reescreve a tabela com USING explícito para converter valores existentes.
-- O ELSE cobre apenas valores inesperados; todos os valores v1 estão mapeados.
ALTER TABLE offer_analysis
  ALTER COLUMN analysis_source TYPE analysis_source_v2
  USING (
    CASE analysis_source::TEXT
      WHEN 'manual'  THEN 'manual'::analysis_source_v2
      WHEN 'claude'  THEN 'ai'::analysis_source_v2
      WHEN 'gpt4'    THEN 'ai'::analysis_source_v2
      WHEN 'gemini'  THEN 'ai'::analysis_source_v2
      WHEN 'llama'   THEN 'ai'::analysis_source_v2
      WHEN 'other'   THEN 'ai'::analysis_source_v2
      ELSE                'ai'::analysis_source_v2  -- fallback defensivo
    END
  );

DROP TYPE analysis_source;
ALTER TYPE analysis_source_v2 RENAME TO analysis_source;

-- [FIX-4] SET DEFAULT após o RENAME para que pg_attrdef exiba 'manual'::analysis_source
-- (nome canônico), não 'manual'::analysis_source_v2 (nome temporário)
ALTER TABLE offer_analysis
  ALTER COLUMN analysis_source SET DEFAULT 'manual'::analysis_source;

COMMENT ON TYPE analysis_source IS
  'Origem da análise: rules=determinística, ai=modelo de linguagem, hybrid=ambos, manual=humano';


-- =============================================================================
-- ETAPA 3B: Substituição do enum offer_status
--
-- Mapeamento (melhor aproximação semântica):
--   emerging  → new
--   active    → observing
--   scaling   → strong_candidate
--   declining → saturated
--   inactive  → discarded
--   archived  → discarded
--
-- O DROP DEFAULT antes do ALTER COLUMN TYPE já estava correto na v1.0.
-- O SET DEFAULT é movido para depois do RENAME (FIX-4).
-- =============================================================================

-- DROP DEFAULT obrigatório (já estava correto na v1.0, mantido)
ALTER TABLE offers ALTER COLUMN current_status DROP DEFAULT;

CREATE TYPE offer_status_v2 AS ENUM (
  'new',
  'observing',
  'promising',
  'strong_candidate',
  'saturated',
  'discarded',
  'validated'
);

ALTER TABLE offers
  ALTER COLUMN current_status TYPE offer_status_v2
  USING (
    CASE current_status::TEXT
      WHEN 'emerging'  THEN 'new'::offer_status_v2
      WHEN 'active'    THEN 'observing'::offer_status_v2
      WHEN 'scaling'   THEN 'strong_candidate'::offer_status_v2
      WHEN 'declining' THEN 'saturated'::offer_status_v2
      WHEN 'inactive'  THEN 'discarded'::offer_status_v2
      WHEN 'archived'  THEN 'discarded'::offer_status_v2
      ELSE                  'new'::offer_status_v2  -- fallback defensivo
    END
  );

DROP TYPE offer_status;
ALTER TYPE offer_status_v2 RENAME TO offer_status;

-- [FIX-4] SET DEFAULT após RENAME
ALTER TABLE offers ALTER COLUMN current_status SET DEFAULT 'new'::offer_status;

COMMENT ON TYPE offer_status IS
  'Estágio de decisão operacional: reflete maturidade + ação recomendada sobre a oferta';


-- =============================================================================
-- ETAPA 4: ALTER TABLE offers — adição de colunas
--
-- ADD COLUMN com NOT NULL DEFAULT é operação de metadados em PG 11+
-- (sem rewrite de tabela para BOOLEAN e NUMERIC nullable).
-- A rewrite já ocorreu na ETAPA 3B; estas adições são custo mínimo.
-- =============================================================================

ALTER TABLE offers
  ADD COLUMN rules_score            NUMERIC(5,2),
  ADD COLUMN ai_score               NUMERIC(5,2),
  ADD COLUMN canonical_offer_hash   TEXT,
  ADD COLUMN last_analysis_at       TIMESTAMPTZ,
  ADD COLUMN needs_reanalysis       BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN manual_review_status   TEXT;

-- Constraints para os novos scores (consistente com padrão das constraints v1)
ALTER TABLE offers
  ADD CONSTRAINT offers_rules_score_range
    CHECK (rules_score IS NULL OR rules_score BETWEEN 0 AND 100),
  ADD CONSTRAINT offers_ai_score_range
    CHECK (ai_score IS NULL OR ai_score BETWEEN 0 AND 100);

-- Índice único para hash canônico: WHERE parcial exclui NULLs do índice
CREATE UNIQUE INDEX idx_offers_canonical_hash
  ON offers (canonical_offer_hash)
  WHERE canonical_offer_hash IS NOT NULL;

-- Índice parcial para fila de reprocessamento IA
CREATE INDEX idx_offers_needs_reanalysis
  ON offers (needs_reanalysis, final_score DESC NULLS LAST)
  WHERE needs_reanalysis = TRUE;

-- Índice parcial para revisão manual pendente
CREATE INDEX idx_offers_manual_review
  ON offers (manual_review_status)
  WHERE manual_review_status IS NOT NULL;

COMMENT ON COLUMN offers.rules_score          IS 'Score 0-100 por sinais objetivos (sem IA): recorrência, variantes, domínio, etc.';
COMMENT ON COLUMN offers.ai_score             IS 'Score 0-100 gerado por análise IA: clareza, apelo, mecanismo, etc.';
COMMENT ON COLUMN offers.final_score          IS 'Score consolidado: (rules_score × 0.6) + (ai_score × 0.4). Atualizado pelo pipeline';
COMMENT ON COLUMN offers.canonical_offer_hash IS 'Hash SHA-256 de (primary_domain + mechanism + promise): detecta duplicatas entre importações';
COMMENT ON COLUMN offers.last_analysis_at     IS 'Timestamp da última análise IA executada';
COMMENT ON COLUMN offers.needs_reanalysis     IS 'TRUE = oferta alterada desde última análise. Alimenta a fila de reprocessamento';
COMMENT ON COLUMN offers.manual_review_status IS 'Estado da revisão humana: pending, in_review, approved, rejected, needs_more_data';


-- =============================================================================
-- ETAPA 5: ALTER TABLE offer_variants
--
-- [FIX-2] detected_at: ADD COLUMN com DEFAULT NOW() atribui o mesmo timestamp
-- (momento da migration) a TODAS as rows existentes — comportamento correto do
-- PG 11+ fast path, mas semanticamente errado. O UPDATE seguinte substitui
-- esse valor pelo created_at original, preservando a história.
-- =============================================================================

ALTER TABLE offer_variants
  ADD COLUMN is_primary       BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN detected_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN version_number   INTEGER;

-- [FIX-2] Preserva dado histórico: rows existentes usam created_at como proxy
-- de detected_at (melhor aproximação disponível sem dado original)
UPDATE offer_variants
  SET detected_at = created_at
  WHERE detected_at <> created_at;

-- Garante no máximo uma variante primária por oferta (partial unique index)
CREATE UNIQUE INDEX idx_offer_variants_one_primary
  ON offer_variants (offer_id)
  WHERE is_primary = TRUE;

CREATE INDEX idx_offer_variants_primary
  ON offer_variants (offer_id, is_primary);

CREATE INDEX idx_offer_variants_version
  ON offer_variants (offer_id, version_number DESC NULLS LAST);

COMMENT ON COLUMN offer_variants.is_primary     IS 'TRUE = variante canônica da oferta. Máximo uma por oferta (partial unique index)';
COMMENT ON COLUMN offer_variants.detected_at    IS 'Momento de detecção pelo pipeline. Rows pre-migration recebem created_at como proxy';
COMMENT ON COLUMN offer_variants.version_number IS 'Número sequencial da versão dentro da oferta. NULL = não versionado';


-- =============================================================================
-- ETAPA 6: ALTER TABLE raw_ads
--
-- [FIX-3] processing_status: DEFAULT 'pending' é correto para rows novas, mas
-- rows existentes já podem ter sido processadas e vinculadas a offers via
-- offer_variants. Sem remediação, o pipeline trataria como não processadas.
-- O UPDATE seguinte corrige o status com base em vínculos existentes.
-- =============================================================================

ALTER TABLE raw_ads
  ADD COLUMN platform           TEXT,
  ADD COLUMN batch_id           TEXT,
  ADD COLUMN collected_by       TEXT,
  ADD COLUMN processing_status  ad_processing_status NOT NULL DEFAULT 'pending';

-- [FIX-3] Remediação de status para rows existentes:
-- Rows já vinculadas a pelo menos uma offer_variant passam para 'linked'
UPDATE raw_ads ra
  SET processing_status = 'linked'
  WHERE EXISTS (
    SELECT 1 FROM offer_variants ov WHERE ov.raw_ad_id = ra.id
  );
-- Rows sem vínculo ficam em 'pending' (default já aplicado): sem ação adicional

-- Índice geral de status
CREATE INDEX idx_raw_ads_processing_status
  ON raw_ads (processing_status);

-- Fila de pipeline: somente rows pendentes ordenadas por captura (partial index)
CREATE INDEX idx_raw_ads_pipeline_queue
  ON raw_ads (processing_status, captured_at ASC)
  WHERE processing_status = 'pending';

CREATE INDEX idx_raw_ads_batch_id
  ON raw_ads (batch_id)
  WHERE batch_id IS NOT NULL;

CREATE INDEX idx_raw_ads_platform
  ON raw_ads (platform)
  WHERE platform IS NOT NULL;

COMMENT ON COLUMN raw_ads.platform          IS 'Nome livre da plataforma de origem. Complementa o enum source para filtros';
COMMENT ON COLUMN raw_ads.batch_id          IS 'ID do lote de ingestão. Permite rastrear e reprocessar uma importação específica';
COMMENT ON COLUMN raw_ads.collected_by      IS 'Identificador do agente coletor: scraper-v2, api-meta, manual-upload, etc.';
COMMENT ON COLUMN raw_ads.processing_status IS 'Estado no pipeline: pending → processing → linked|deduplicated|skipped|error';


-- =============================================================================
-- ETAPA 7: CREATE TABLE processing_jobs
-- =============================================================================

CREATE TABLE processing_jobs (
  id              BIGSERIAL   PRIMARY KEY,

  job_type        job_type    NOT NULL,
  status          job_status  NOT NULL DEFAULT 'pending',

  offer_id        BIGINT      REFERENCES offers(id) ON DELETE SET NULL,
  batch_id        TEXT,

  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,

  items_total     INTEGER,
  items_processed INTEGER,
  items_failed    INTEGER,

  triggered_by    TEXT,
  error_message   TEXT,
  metadata        JSONB,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT jobs_finished_after_started
    CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at),

  CONSTRAINT jobs_items_non_negative
    CHECK (
      (items_total     IS NULL OR items_total     >= 0) AND
      (items_processed IS NULL OR items_processed >= 0) AND
      (items_failed    IS NULL OR items_failed    >= 0)
    )
);

CREATE INDEX idx_jobs_status          ON processing_jobs (status);
CREATE INDEX idx_jobs_type_status     ON processing_jobs (job_type, status);
CREATE INDEX idx_jobs_offer_id        ON processing_jobs (offer_id)      WHERE offer_id   IS NOT NULL;
CREATE INDEX idx_jobs_batch_id        ON processing_jobs (batch_id)      WHERE batch_id   IS NOT NULL;
CREATE INDEX idx_jobs_created_at      ON processing_jobs (created_at DESC);
CREATE INDEX idx_jobs_started_at      ON processing_jobs (started_at DESC) WHERE started_at IS NOT NULL;
CREATE INDEX idx_jobs_metadata        ON processing_jobs USING GIN (metadata);
CREATE INDEX idx_jobs_pending_queue   ON processing_jobs (created_at ASC) WHERE status = 'pending';

COMMENT ON TABLE  processing_jobs              IS 'Execução dos pipelines. Um job = uma execução atômica de um tipo de processo';
COMMENT ON COLUMN processing_jobs.job_type     IS 'Tipo: ingestion, deduplication, clustering, scoring, ai_analysis, etc.';
COMMENT ON COLUMN processing_jobs.status       IS 'Estado: pending → running → completed|failed|partial|cancelled';
COMMENT ON COLUMN processing_jobs.offer_id     IS 'Oferta alvo quando scoped para uma oferta específica. NULL = batch/global';
COMMENT ON COLUMN processing_jobs.triggered_by IS 'Origem: scheduler, webhook, manual, pipeline:scoring, etc.';
COMMENT ON COLUMN processing_jobs.metadata     IS 'Parâmetros de entrada, thresholds, versão do pipeline — contexto livre para debug';


-- =============================================================================
-- ETAPA 8: Recriação das views atualizadas
-- =============================================================================

CREATE VIEW v_offer_ranking AS
SELECT
  o.id,
  o.canonical_name,
  o.niche,
  o.subniche,
  o.mechanism,
  o.promise,
  o.current_status,
  o.offer_type,
  o.funnel_type,
  o.primary_domain,
  o.language,
  o.country,
  o.first_seen_at,
  o.last_seen_at,
  o.recurrence_days,
  o.variant_count,
  o.raw_ads_count,
  o.confidence_score,
  o.rules_score,
  o.ai_score,
  o.final_score,
  o.last_analysis_at,
  o.needs_reanalysis,
  o.manual_review_status,
  a.analysis_source       AS last_analysis_source,
  a.model_name            AS last_model,
  a.clarity_score,
  a.scalability_score,
  a.saturation_score,
  a.emotional_appeal_score,
  a.cold_traffic_fit_score,
  a.recommended_action,
  a.analyzed_at           AS last_analyzed_at,
  j.status                AS last_scoring_job_status,
  j.finished_at           AS last_scoring_job_at
FROM offers o
LEFT JOIN LATERAL (
  SELECT * FROM offer_analysis oa
  WHERE oa.offer_id = o.id
  ORDER BY oa.analyzed_at DESC LIMIT 1
) a ON TRUE
LEFT JOIN LATERAL (
  SELECT status, finished_at FROM processing_jobs pj
  WHERE pj.offer_id = o.id AND pj.job_type = 'scoring'
  ORDER BY pj.created_at DESC LIMIT 1
) j ON TRUE
ORDER BY o.final_score DESC NULLS LAST;

COMMENT ON VIEW v_offer_ranking IS 'Ranking completo com scores desagregados (rules+ai), última análise e último job de scoring';


CREATE VIEW v_reanalysis_queue AS
SELECT
  o.id,
  o.canonical_name,
  o.niche,
  o.current_status,
  o.rules_score,
  o.ai_score,
  o.final_score,
  o.last_analysis_at,
  o.recurrence_days,
  o.variant_count,
  o.raw_ads_count,
  o.manual_review_status
FROM offers o
WHERE o.needs_reanalysis = TRUE
  AND (o.rules_score IS NULL OR o.rules_score >= 40)
  AND o.current_status NOT IN ('discarded', 'saturated')
ORDER BY o.rules_score DESC NULLS LAST, o.recurrence_days DESC;

COMMENT ON VIEW v_reanalysis_queue IS 'Fila de ofertas pendentes de análise IA: filtradas por threshold objetivo (>=40) e status ativo';


CREATE VIEW v_jobs_dashboard AS
SELECT
  job_type,
  status,
  COUNT(*)                                                            AS total,
  AVG(EXTRACT(EPOCH FROM (finished_at - started_at)))
    FILTER (WHERE finished_at IS NOT NULL)                           AS avg_duration_seconds,
  MAX(created_at)                                                     AS last_run_at,
  SUM(items_processed)                                                AS total_items_processed,
  SUM(items_failed)                                                   AS total_items_failed
FROM processing_jobs
GROUP BY job_type, status
ORDER BY job_type, status;

COMMENT ON VIEW v_jobs_dashboard IS 'Resumo operacional dos jobs por tipo e status com métricas de duração e volume';

COMMIT;

-- =============================================================================
-- RESUMO DAS MUDANÇAS
-- =============================================================================
-- Enums adicionados    : ad_processing_status, job_type, job_status
-- Enums substituídos   : analysis_source (6→4 valores), offer_status (6→7 valores)
-- Colunas em offers    : +rules_score, +ai_score, +canonical_offer_hash,
--                        +last_analysis_at, +needs_reanalysis, +manual_review_status
-- Colunas em variants  : +is_primary, +detected_at (remediado), +version_number
-- Colunas em raw_ads   : +platform, +batch_id, +collected_by,
--                        +processing_status (remediado)
-- Tabelas criadas      : processing_jobs
-- Índices adicionados  : 13 novos (4 parciais para filas de pipeline)
-- Views recriadas      : v_offer_ranking (expandida)
-- Views adicionadas    : v_reanalysis_queue, v_jobs_dashboard
-- =============================================================================
