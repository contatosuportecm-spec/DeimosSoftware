-- =============================================================================
-- MÓDULO DE INTELIGÊNCIA DE OFERTAS — Schema Canônico v2
-- Banco: PostgreSQL 15+
-- Última atualização: 2026-03-24
-- Histórico de migrações: ver db/migration_001_decision_system.sql
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE keyword_status    AS ENUM ('active', 'paused', 'archived');
CREATE TYPE keyword_priority  AS ENUM ('high', 'medium', 'low');

CREATE TYPE ad_source         AS ENUM (
  'meta_ad_library',
  'google_ads',
  'tiktok_ads',
  'excel_import',
  'manual',
  'other'
);

-- Status granular do anúncio no pipeline de processamento
CREATE TYPE ad_processing_status AS ENUM (
  'pending',        -- aguardando processamento
  'processing',     -- em processamento ativo
  'linked',         -- vinculado a uma oferta
  'deduplicated',   -- marcado como duplicata de outro raw_ad
  'skipped',        -- ignorado por regra (ex: domínio bloqueado)
  'error'           -- falhou durante processamento
);

CREATE TYPE creative_type     AS ENUM ('image', 'video', 'carousel', 'text', 'dynamic');
CREATE TYPE ad_format         AS ENUM ('feed', 'story', 'reel', 'banner', 'interstitial', 'search', 'other');

-- Estágios de decisão operacional (não apenas ciclo de vida descritivo)
CREATE TYPE offer_status      AS ENUM (
  'new',              -- recém identificada, dados insuficientes
  'observing',        -- em monitoramento, acumulando sinais
  'promising',        -- sinais objetivos positivos, aguarda análise IA
  'strong_candidate', -- score alto, candidata a teste/replicação
  'saturated',        -- mercado saturado, ângulo esgotado
  'discarded',        -- descartada por análise ou ausência de sinais
  'validated'         -- validada internamente ou externamente como boa oferta
);

CREATE TYPE offer_type        AS ENUM (
  'lead_gen',
  'ecommerce',
  'info_product',
  'saas',
  'affiliate',
  'service',
  'other'
);

CREATE TYPE funnel_type       AS ENUM (
  'vsl',
  'webinar',
  'quiz',
  'landing_page',
  'direct_sales',
  'free_trial',
  'book_funnel',
  'bridge_page',
  'other'
);

CREATE TYPE variant_type      AS ENUM (
  'headline',    -- variação apenas no título
  'copy',        -- variação no corpo do texto
  'cta',         -- variação na chamada para ação
  'landing',     -- variação na landing page
  'creative',    -- variação no criativo (imagem/vídeo)
  'angle',       -- ângulo narrativo diferente
  'hook',        -- gancho de abertura diferente
  'full'         -- variação completa (copy + criativo)
);

CREATE TYPE offer_event_type  AS ENUM (
  'created',
  'status_changed',
  'score_updated',
  'variant_added',
  'analysis_added',
  'field_updated',
  'merged',
  'split',
  'flagged'
);

-- Origem da análise: distingue regras determinísticas de IA
CREATE TYPE analysis_source   AS ENUM (
  'rules',    -- análise por regras determinísticas (sem IA)
  'ai',       -- análise por modelo de linguagem
  'hybrid',   -- combinação de regras + IA
  'manual'    -- análise humana manual
);

CREATE TYPE recommended_action AS ENUM (
  'monitor',
  'test',
  'scale',
  'replicate',
  'investigate',
  'archive',
  'discard'
);

-- Pipeline de automação
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
-- TABELA: keywords
-- =============================================================================

CREATE TABLE keywords (
  id          BIGSERIAL        PRIMARY KEY,
  keyword     TEXT             NOT NULL,
  category    TEXT,
  priority    keyword_priority NOT NULL DEFAULT 'medium',
  status      keyword_status   NOT NULL DEFAULT 'active',
  notes       TEXT,
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT keywords_keyword_unique UNIQUE (keyword)
);

COMMENT ON TABLE  keywords           IS 'Termos usados para busca de anúncios nas bibliotecas externas';
COMMENT ON COLUMN keywords.category  IS 'Classificação semântica: nicho, mecanismo, dor, promessa, audiência, etc.';
COMMENT ON COLUMN keywords.priority  IS 'Prioridade de monitoramento desta keyword';


-- =============================================================================
-- TABELA: raw_ads
-- Anúncios brutos coletados — imutáveis após captura
-- =============================================================================

CREATE TABLE raw_ads (
  id                    BIGSERIAL            PRIMARY KEY,

  -- Origem
  source                ad_source            NOT NULL,
  source_reference_id   TEXT,
  keyword_id            BIGINT               REFERENCES keywords(id) ON DELETE SET NULL,

  -- Anunciante
  advertiser_name       TEXT,
  advertiser_id         TEXT,

  -- Conteúdo
  ad_text               TEXT,
  headline              TEXT,
  description           TEXT,
  cta                   TEXT,

  -- URLs
  landing_page_url      TEXT,
  final_url             TEXT,
  domain                TEXT,

  -- Criativo
  creative_type         creative_type,
  creative_url          TEXT,
  creative_hash         TEXT,
  format                ad_format,

  -- Segmentação
  language              CHAR(5),
  country               CHAR(2),

  -- Timestamps
  first_seen_at         TIMESTAMPTZ,
  captured_at           TIMESTAMPTZ          NOT NULL DEFAULT NOW(),

  -- Payload e normalização
  raw_payload           JSONB,
  normalized_text       TEXT,
  text_hash             TEXT,
  landing_hash          TEXT,
  dedupe_group_key      TEXT,

  -- Rastreabilidade de ingestão
  platform              TEXT,
  batch_id              TEXT,
  collected_by          TEXT,
  processing_status     ad_processing_status NOT NULL DEFAULT 'pending',

  created_at            TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ          NOT NULL DEFAULT NOW(),

  CONSTRAINT raw_ads_source_ref_unique UNIQUE (source, source_reference_id)
);

COMMENT ON TABLE  raw_ads                    IS 'Anúncios brutos coletados. Imutáveis após inserção — fonte da verdade';
COMMENT ON COLUMN raw_ads.text_hash          IS 'SHA-256 do normalized_text — deduplicação de copies';
COMMENT ON COLUMN raw_ads.landing_hash       IS 'SHA-256 da URL final normalizada — agrupa anúncios da mesma landing';
COMMENT ON COLUMN raw_ads.dedupe_group_key   IS 'Chave composta (domain + text_hash parcial) para pré-clustering';
COMMENT ON COLUMN raw_ads.raw_payload        IS 'Payload JSON original da plataforma — preservado para reprocessamento';
COMMENT ON COLUMN raw_ads.platform           IS 'Nome livre da plataforma de origem. Complementa o enum source';
COMMENT ON COLUMN raw_ads.batch_id           IS 'ID do lote de ingestão. Permite rastrear e reprocessar uma importação específica';
COMMENT ON COLUMN raw_ads.collected_by       IS 'Identificador do agente coletor: scraper-v2, api-meta, manual-upload, etc.';
COMMENT ON COLUMN raw_ads.processing_status  IS 'Estado no pipeline: pending → processing → linked|deduplicated|skipped|error';


-- =============================================================================
-- TABELA: offers
-- Ofertas consolidadas — resultado do agrupamento e análise de raw_ads
-- =============================================================================

CREATE TABLE offers (
  id                    BIGSERIAL     PRIMARY KEY,

  -- Identidade
  canonical_name        TEXT          NOT NULL,
  niche                 TEXT,
  subniche              TEXT,
  mechanism             TEXT,
  promise               TEXT,
  pain_point            TEXT,
  audience              TEXT,

  -- Classificação
  offer_type            offer_type,
  funnel_type           funnel_type,

  -- Técnico
  primary_domain        TEXT,
  language              CHAR(5),
  country               CHAR(2),

  -- Status e ciclo de vida
  current_status        offer_status  NOT NULL DEFAULT 'new',
  first_seen_at         TIMESTAMPTZ,
  last_seen_at          TIMESTAMPTZ,
  recurrence_days       INTEGER       NOT NULL DEFAULT 0,
  variant_count         INTEGER       NOT NULL DEFAULT 0,
  raw_ads_count         INTEGER       NOT NULL DEFAULT 0,

  -- Scoring desagregado
  confidence_score      NUMERIC(5,2),  -- 0-100: confiança no clustering automático
  rules_score           NUMERIC(5,2),  -- 0-100: sinais objetivos (sem IA)
  ai_score              NUMERIC(5,2),  -- 0-100: análise IA
  final_score           NUMERIC(5,2),  -- 0-100: (rules × 0.6) + (ai × 0.4)

  -- Identidade canônica
  canonical_offer_hash  TEXT,          -- SHA-256(primary_domain + mechanism + promise)

  -- Controle de análise (motor do loop de decisão)
  last_analysis_at      TIMESTAMPTZ,
  needs_reanalysis      BOOLEAN       NOT NULL DEFAULT TRUE,
  manual_review_status  TEXT,          -- pending, in_review, approved, rejected, needs_more_data

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT offers_confidence_range  CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 100),
  CONSTRAINT offers_rules_score_range CHECK (rules_score      IS NULL OR rules_score      BETWEEN 0 AND 100),
  CONSTRAINT offers_ai_score_range    CHECK (ai_score         IS NULL OR ai_score         BETWEEN 0 AND 100),
  CONSTRAINT offers_final_score_range CHECK (final_score      IS NULL OR final_score      BETWEEN 0 AND 100)
);

COMMENT ON TABLE  offers                       IS 'Ofertas consolidadas — resultado do agrupamento e análise de raw_ads';
COMMENT ON COLUMN offers.mechanism             IS 'O mecanismo único de venda: o "porquê funciona" da oferta';
COMMENT ON COLUMN offers.recurrence_days       IS 'Dias distintos em que a oferta foi observada';
COMMENT ON COLUMN offers.confidence_score      IS 'Confiança no clustering automático. Baixo = revisar manualmente';
COMMENT ON COLUMN offers.rules_score           IS 'Score 0-100 por sinais objetivos: recorrência, variantes, domínio, etc.';
COMMENT ON COLUMN offers.ai_score              IS 'Score 0-100 gerado por análise IA: clareza, apelo, mecanismo, etc.';
COMMENT ON COLUMN offers.final_score           IS 'Score consolidado: (rules_score × 0.6) + (ai_score × 0.4)';
COMMENT ON COLUMN offers.canonical_offer_hash  IS 'Hash SHA-256 de (primary_domain + mechanism + promise): detecta duplicatas entre importações';
COMMENT ON COLUMN offers.last_analysis_at      IS 'Timestamp da última análise IA executada';
COMMENT ON COLUMN offers.needs_reanalysis      IS 'TRUE = oferta alterada desde a última análise. Alimenta a fila de reprocessamento';
COMMENT ON COLUMN offers.manual_review_status  IS 'Estado da revisão humana: pending, in_review, approved, rejected, needs_more_data';


-- =============================================================================
-- TABELA: offer_variants
-- =============================================================================

CREATE TABLE offer_variants (
  id                  BIGSERIAL     PRIMARY KEY,
  offer_id            BIGINT        NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  raw_ad_id           BIGINT        NOT NULL REFERENCES raw_ads(id) ON DELETE CASCADE,

  variant_type        variant_type  NOT NULL,
  variant_label       TEXT,

  -- Assinaturas para comparação
  text_signature      TEXT,
  landing_signature   TEXT,
  creative_signature  TEXT,
  angle               TEXT,

  -- Controle de variante
  is_primary          BOOLEAN       NOT NULL DEFAULT FALSE,
  detected_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  version_number      INTEGER,

  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT offer_variants_unique UNIQUE (offer_id, raw_ad_id, variant_type)
);

COMMENT ON TABLE  offer_variants                  IS 'Variações detectadas dentro de uma mesma oferta consolidada';
COMMENT ON COLUMN offer_variants.text_signature   IS 'Simhash/minhash do texto normalizado — detecta variações similares';
COMMENT ON COLUMN offer_variants.angle            IS 'Ângulo narrativo: emoção, mecanismo, prova social, urgência, etc.';
COMMENT ON COLUMN offer_variants.is_primary       IS 'TRUE = variante canônica da oferta. Máximo uma por oferta (partial unique index)';
COMMENT ON COLUMN offer_variants.detected_at      IS 'Momento de detecção pelo pipeline (pode diferir do created_at)';
COMMENT ON COLUMN offer_variants.version_number   IS 'Número sequencial da versão dentro da oferta. NULL = não versionado';


-- =============================================================================
-- TABELA: offer_analysis
-- Múltiplas análises por oferta são permitidas (histórico de evolução)
-- =============================================================================

CREATE TABLE offer_analysis (
  id                      BIGSERIAL          PRIMARY KEY,
  offer_id                BIGINT             NOT NULL REFERENCES offers(id) ON DELETE CASCADE,

  -- Proveniência
  analysis_source         analysis_source    NOT NULL DEFAULT 'manual',
  model_name              TEXT,
  model_version           TEXT,

  -- Scores subjetivos (0-10)
  clarity_score           NUMERIC(4,2),
  scalability_score       NUMERIC(4,2),
  originality_score       NUMERIC(4,2),
  saturation_score        NUMERIC(4,2),
  maturity_score          NUMERIC(4,2),
  emotional_appeal_score  NUMERIC(4,2),
  cold_traffic_fit_score  NUMERIC(4,2),

  -- Outputs qualitativos
  reasoning_summary       TEXT,
  strengths               TEXT[],
  weaknesses              TEXT[],
  recommended_action      recommended_action,

  -- Output estruturado completo
  structured_output_json  JSONB,

  analyzed_at             TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT analysis_scores_range CHECK (
    (clarity_score          IS NULL OR clarity_score          BETWEEN 0 AND 10) AND
    (scalability_score      IS NULL OR scalability_score      BETWEEN 0 AND 10) AND
    (originality_score      IS NULL OR originality_score      BETWEEN 0 AND 10) AND
    (saturation_score       IS NULL OR saturation_score       BETWEEN 0 AND 10) AND
    (maturity_score         IS NULL OR maturity_score         BETWEEN 0 AND 10) AND
    (emotional_appeal_score IS NULL OR emotional_appeal_score BETWEEN 0 AND 10) AND
    (cold_traffic_fit_score IS NULL OR cold_traffic_fit_score BETWEEN 0 AND 10)
  )
);

COMMENT ON TABLE  offer_analysis                        IS 'Análises IA ou manuais por oferta. Permite múltiplas análises no tempo';
COMMENT ON COLUMN offer_analysis.analysis_source        IS 'rules=determinística, ai=modelo de linguagem, hybrid=ambos, manual=humano';
COMMENT ON COLUMN offer_analysis.structured_output_json IS 'Payload JSON completo da IA — preservado para auditoria e reprocessamento';
COMMENT ON COLUMN offer_analysis.strengths              IS 'Array de pontos fortes identificados';
COMMENT ON COLUMN offer_analysis.weaknesses             IS 'Array de pontos fracos identificados';


-- =============================================================================
-- TABELA: offer_history
-- Audit log imutável — apenas INSERT, nunca UPDATE ou DELETE
-- =============================================================================

CREATE TABLE offer_history (
  id              BIGSERIAL           PRIMARY KEY,
  offer_id        BIGINT              NOT NULL REFERENCES offers(id) ON DELETE CASCADE,

  event_type      offer_event_type    NOT NULL,
  field_name      TEXT,
  old_value       TEXT,
  new_value       TEXT,
  event_metadata  JSONB,

  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  offer_history                IS 'Audit log imutável de eventos em uma oferta. Nunca atualizar, apenas inserir';
COMMENT ON COLUMN offer_history.event_metadata IS 'Contexto livre: triggered_by, parâmetros do pipeline, versão, etc.';


-- =============================================================================
-- TABELA: offer_keyword_links
-- =============================================================================

CREATE TABLE offer_keyword_links (
  id              BIGSERIAL   PRIMARY KEY,
  offer_id        BIGINT      NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  keyword_id      BIGINT      NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,

  first_linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_linked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_found     INTEGER     NOT NULL DEFAULT 1,

  CONSTRAINT offer_keyword_links_unique UNIQUE (offer_id, keyword_id)
);

COMMENT ON TABLE  offer_keyword_links             IS 'Vínculo M:N entre ofertas e keywords com rastreamento de frequência';
COMMENT ON COLUMN offer_keyword_links.times_found IS 'Quantas vezes a oferta foi encontrada via esta keyword';


-- =============================================================================
-- TABELA: processing_jobs
-- Controle de execução de pipelines automatizados
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

COMMENT ON TABLE  processing_jobs              IS 'Execução dos pipelines automatizados. Um job = uma execução atômica de um tipo de processo';
COMMENT ON COLUMN processing_jobs.job_type     IS 'Tipo de pipeline: ingestion, deduplication, clustering, scoring, ai_analysis, etc.';
COMMENT ON COLUMN processing_jobs.status       IS 'Estado: pending → running → completed|failed|partial|cancelled';
COMMENT ON COLUMN processing_jobs.offer_id     IS 'Oferta alvo quando o job é scoped para uma oferta específica. NULL = batch/global';
COMMENT ON COLUMN processing_jobs.batch_id     IS 'Referência ao batch_id de raw_ads processado neste job';
COMMENT ON COLUMN processing_jobs.triggered_by IS 'Origem do disparo: scheduler, webhook, manual, pipeline:scoring, etc.';
COMMENT ON COLUMN processing_jobs.metadata     IS 'Parâmetros de entrada, thresholds, versão do pipeline, contexto livre para debug';


-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- keywords
CREATE INDEX idx_keywords_status    ON keywords (status);
CREATE INDEX idx_keywords_priority  ON keywords (priority);
CREATE INDEX idx_keywords_category  ON keywords (category);

-- raw_ads
CREATE INDEX idx_raw_ads_keyword_id        ON raw_ads (keyword_id);
CREATE INDEX idx_raw_ads_source            ON raw_ads (source);
CREATE INDEX idx_raw_ads_advertiser_id     ON raw_ads (advertiser_id);
CREATE INDEX idx_raw_ads_domain            ON raw_ads (domain);
CREATE INDEX idx_raw_ads_text_hash         ON raw_ads (text_hash);
CREATE INDEX idx_raw_ads_landing_hash      ON raw_ads (landing_hash);
CREATE INDEX idx_raw_ads_dedupe_group_key  ON raw_ads (dedupe_group_key);
CREATE INDEX idx_raw_ads_captured_at       ON raw_ads (captured_at DESC);
CREATE INDEX idx_raw_ads_first_seen_at     ON raw_ads (first_seen_at DESC);
CREATE INDEX idx_raw_ads_raw_payload       ON raw_ads USING GIN (raw_payload);
CREATE INDEX idx_raw_ads_processing_status ON raw_ads (processing_status);
CREATE INDEX idx_raw_ads_batch_id          ON raw_ads (batch_id)   WHERE batch_id  IS NOT NULL;
CREATE INDEX idx_raw_ads_platform          ON raw_ads (platform)   WHERE platform  IS NOT NULL;
-- fila do pipeline: somente registros pendentes, ordenados por captura
CREATE INDEX idx_raw_ads_pipeline_queue    ON raw_ads (processing_status, captured_at ASC)
  WHERE processing_status = 'pending';

-- offers
CREATE INDEX idx_offers_status          ON offers (current_status);
CREATE INDEX idx_offers_niche           ON offers (niche);
CREATE INDEX idx_offers_primary_domain  ON offers (primary_domain);
CREATE INDEX idx_offers_final_score     ON offers (final_score DESC NULLS LAST);
CREATE INDEX idx_offers_rules_score     ON offers (rules_score  DESC NULLS LAST);
CREATE INDEX idx_offers_last_seen_at    ON offers (last_seen_at DESC);
CREATE INDEX idx_offers_first_seen_at   ON offers (first_seen_at DESC);
CREATE INDEX idx_offers_language        ON offers (language);
CREATE INDEX idx_offers_country         ON offers (country);
-- ranking principal
CREATE INDEX idx_offers_ranking         ON offers (current_status, final_score DESC NULLS LAST);
-- hash único: garante integridade entre importações
CREATE UNIQUE INDEX idx_offers_canonical_hash
  ON offers (canonical_offer_hash)
  WHERE canonical_offer_hash IS NOT NULL;
-- fila de reprocessamento IA (partial index: só ofertas que precisam de análise)
CREATE INDEX idx_offers_needs_reanalysis
  ON offers (needs_reanalysis, final_score DESC NULLS LAST)
  WHERE needs_reanalysis = TRUE;
-- revisão manual pendente
CREATE INDEX idx_offers_manual_review
  ON offers (manual_review_status)
  WHERE manual_review_status IS NOT NULL;

-- offer_variants
CREATE INDEX idx_offer_variants_offer_id   ON offer_variants (offer_id);
CREATE INDEX idx_offer_variants_raw_ad_id  ON offer_variants (raw_ad_id);
CREATE INDEX idx_offer_variants_type       ON offer_variants (variant_type);
CREATE INDEX idx_offer_variants_primary    ON offer_variants (offer_id, is_primary);
CREATE INDEX idx_offer_variants_version    ON offer_variants (offer_id, version_number DESC NULLS LAST);
-- garante máximo uma variante primária por oferta
CREATE UNIQUE INDEX idx_offer_variants_one_primary
  ON offer_variants (offer_id)
  WHERE is_primary = TRUE;

-- offer_analysis
CREATE INDEX idx_offer_analysis_offer_id    ON offer_analysis (offer_id);
CREATE INDEX idx_offer_analysis_analyzed_at ON offer_analysis (analyzed_at DESC);
CREATE INDEX idx_offer_analysis_source      ON offer_analysis (analysis_source);
CREATE INDEX idx_offer_analysis_action      ON offer_analysis (recommended_action);
CREATE INDEX idx_offer_analysis_json        ON offer_analysis USING GIN (structured_output_json);

-- offer_history
CREATE INDEX idx_offer_history_offer_id    ON offer_history (offer_id);
CREATE INDEX idx_offer_history_event_type  ON offer_history (event_type);
CREATE INDEX idx_offer_history_created_at  ON offer_history (created_at DESC);

-- offer_keyword_links
CREATE INDEX idx_offer_kw_links_keyword_id ON offer_keyword_links (keyword_id);
CREATE INDEX idx_offer_kw_links_offer_id   ON offer_keyword_links (offer_id);

-- processing_jobs
CREATE INDEX idx_jobs_status          ON processing_jobs (status);
CREATE INDEX idx_jobs_type_status     ON processing_jobs (job_type, status);
CREATE INDEX idx_jobs_offer_id        ON processing_jobs (offer_id)  WHERE offer_id IS NOT NULL;
CREATE INDEX idx_jobs_batch_id        ON processing_jobs (batch_id)  WHERE batch_id IS NOT NULL;
CREATE INDEX idx_jobs_created_at      ON processing_jobs (created_at DESC);
CREATE INDEX idx_jobs_started_at      ON processing_jobs (started_at DESC) WHERE started_at IS NOT NULL;
CREATE INDEX idx_jobs_metadata        ON processing_jobs USING GIN (metadata);
CREATE INDEX idx_jobs_pending_queue   ON processing_jobs (created_at ASC) WHERE status = 'pending';


-- =============================================================================
-- FUNÇÃO E TRIGGERS: updated_at automático
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_keywords_updated_at
  BEFORE UPDATE ON keywords
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_raw_ads_updated_at
  BEFORE UPDATE ON raw_ads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- offer_history e processing_jobs são append-only: sem trigger de updated_at


-- =============================================================================
-- VIEWS
-- =============================================================================

-- Ranking principal com scores desagregados, última análise e último job
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


-- Fila de reprocessamento IA: ofertas que precisam de análise e superaram threshold objetivo
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


-- Keywords por oferta agregadas
CREATE VIEW v_offer_keywords AS
SELECT
  okl.offer_id,
  COUNT(*)                                              AS keyword_count,
  SUM(okl.times_found)                                 AS total_times_found,
  MAX(okl.last_linked_at)                              AS last_keyword_seen_at,
  ARRAY_AGG(k.keyword ORDER BY okl.times_found DESC)   AS keywords
FROM offer_keyword_links okl
JOIN keywords k ON k.id = okl.keyword_id
GROUP BY okl.offer_id;

COMMENT ON VIEW v_offer_keywords IS 'Agregação de keywords por oferta com contagem de frequência';


-- Dashboard operacional de jobs
CREATE VIEW v_jobs_dashboard AS
SELECT
  job_type,
  status,
  COUNT(*)                                                                    AS total,
  AVG(EXTRACT(EPOCH FROM (finished_at - started_at)))
    FILTER (WHERE finished_at IS NOT NULL)                                    AS avg_duration_seconds,
  MAX(created_at)                                                             AS last_run_at,
  SUM(items_processed)                                                        AS total_items_processed,
  SUM(items_failed)                                                           AS total_items_failed
FROM processing_jobs
GROUP BY job_type, status
ORDER BY job_type, status;

COMMENT ON VIEW v_jobs_dashboard IS 'Resumo operacional dos jobs por tipo e status com métricas de duração e volume';
