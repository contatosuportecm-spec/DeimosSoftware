-- =============================================================================
-- SCHEMA v2 — Inteligência de Ofertas
-- Modelo: Observações independentes + Clusters (Ofertas Simplificadas)
--
-- Princípio:
--   Cada linha do Excel = offer_observation (nunca descartada)
--   Observações similares → simplified_offer (cluster)
--   Score por cluster reflete força de mercado atual
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums auxiliares (mantidos para compatibilidade com jobs/histórico)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM (
    'new', 'observing', 'promising', 'strong_candidate',
    'saturated', 'discarded', 'validated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_type AS ENUM (
    'excel_import', 'ai_analysis', 'rescore', 'manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM (
    'queued', 'running', 'completed', 'partial', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- simplified_offers — Clusters / Ofertas Simplificadas
--
-- Criados e mantidos automaticamente pelo clusterer.
-- Representam um "conceito de oferta" que pode ter múltiplos anunciantes.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS simplified_offers (
  id                    SERIAL PRIMARY KEY,

  -- Identidade
  canonical_name        TEXT NOT NULL,
  name_variants         TEXT[] NOT NULL DEFAULT '{}',

  -- Agregados calculados a partir das observações vinculadas
  total_observations    INTEGER NOT NULL DEFAULT 0,
  distinct_players      INTEGER NOT NULL DEFAULT 0,  -- domínios/anunciantes distintos
  total_active_ads      INTEGER NOT NULL DEFAULT 0,  -- soma dos picos semanais

  -- Span temporal
  first_seen_at         DATE,
  last_seen_at          DATE,
  active_days_span      INTEGER NOT NULL DEFAULT 0,

  -- Score de força de mercado (0–100)
  -- Recência (35%) + Volume de ads (30%) + Diversidade de players (20%) + Constância (15%)
  market_strength_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  recency_score         NUMERIC(5,2) NOT NULL DEFAULT 0,
  volume_score          NUMERIC(5,2) NOT NULL DEFAULT 0,
  diversity_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  constancy_score       NUMERIC(5,2) NOT NULL DEFAULT 0,

  -- Status
  current_status        offer_status NOT NULL DEFAULT 'new',

  -- Meta
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT simplified_offers_canonical_name_key UNIQUE (canonical_name)
);

CREATE INDEX IF NOT EXISTS idx_simplified_offers_score
  ON simplified_offers (market_strength_score DESC);

CREATE INDEX IF NOT EXISTS idx_simplified_offers_last_seen
  ON simplified_offers (last_seen_at DESC);

-- ---------------------------------------------------------------------------
-- offer_observations — Observações individuais de mercado
--
-- Cada linha do Excel vira uma linha aqui.
-- NUNCA são descartadas — são o registro bruto de inteligência.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS offer_observations (
  id                    SERIAL PRIMARY KEY,

  -- Identidade
  raw_name              TEXT NOT NULL,         -- exatamente como estava no Excel
  normalized_name       TEXT NOT NULL,         -- lowercase, sem acentos

  -- Atribuição / anunciante
  domain                TEXT,                  -- extraído do "Link da oferta"

  -- Temporal
  observed_at           DATE,                  -- "Data" da planilha

  -- Criativos ativos por dia da semana observada
  active_ads_day1       SMALLINT,
  active_ads_day2       SMALLINT,
  active_ads_day3       SMALLINT,
  active_ads_day4       SMALLINT,
  active_ads_day5       SMALLINT,
  active_ads_day6       SMALLINT,
  total_active_ads      SMALLINT NOT NULL DEFAULT 0,  -- pico da semana (max dos dias)

  -- Conteúdo e contexto
  checkout_type         TEXT,
  offer_tested          BOOLEAN,
  roi_result            TEXT,
  insights              TEXT,
  notes                 TEXT,

  -- Vínculo com o cluster
  simplified_offer_id   INTEGER REFERENCES simplified_offers(id) ON DELETE SET NULL,
  cluster_similarity    NUMERIC(4,3),          -- Jaccard score com o cluster

  -- Meta de importação
  source_row            INTEGER,               -- linha original no Excel
  source_file           TEXT,
  import_job_id         INTEGER,
  raw_data              JSONB,                 -- snapshot completo da linha original

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offer_observations_simplified_offer
  ON offer_observations (simplified_offer_id);

CREATE INDEX IF NOT EXISTS idx_offer_observations_observed_at
  ON offer_observations (observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_offer_observations_normalized_name
  ON offer_observations (normalized_name);

-- ---------------------------------------------------------------------------
-- processing_jobs — Rastreamento de execuções do importador
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS processing_jobs (
  id              SERIAL PRIMARY KEY,
  job_type        job_type    NOT NULL,
  status          job_status  NOT NULL DEFAULT 'queued',
  triggered_by    TEXT,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  items_total     INTEGER,
  items_processed INTEGER,
  items_failed    INTEGER,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- VIEW: ranking de ofertas simplificadas
-- Consulta principal para análise de mercado
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_offer_ranking AS
SELECT
  so.id,
  so.canonical_name,
  so.total_observations,
  so.distinct_players,
  so.total_active_ads,
  so.first_seen_at,
  so.last_seen_at,
  so.active_days_span,
  so.market_strength_score,
  so.recency_score,
  so.volume_score,
  so.diversity_score,
  so.constancy_score,
  so.current_status,
  so.name_variants,
  -- Observações mais recentes (para contexto rápido)
  (
    SELECT json_agg(row_to_json(r) ORDER BY r.observed_at DESC)
    FROM (
      SELECT observed_at, domain, total_active_ads, roi_result, notes
      FROM offer_observations
      WHERE simplified_offer_id = so.id
      ORDER BY observed_at DESC
      LIMIT 5
    ) r
  ) AS recent_observations
FROM simplified_offers so
ORDER BY so.market_strength_score DESC;

-- ---------------------------------------------------------------------------
-- VIEW: resumo de observações por cluster (útil para análise rápida)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_cluster_observations AS
SELECT
  so.canonical_name       AS cluster,
  so.market_strength_score AS score,
  oo.observed_at,
  oo.raw_name,
  oo.domain,
  oo.total_active_ads,
  oo.checkout_type,
  oo.offer_tested,
  oo.roi_result,
  oo.notes
FROM offer_observations oo
JOIN simplified_offers so ON so.id = oo.simplified_offer_id
ORDER BY so.market_strength_score DESC, oo.observed_at DESC;
