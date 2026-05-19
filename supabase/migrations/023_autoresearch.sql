-- ============================================================
-- 023: AutoResearch — Headline Optimizer
-- ============================================================

-- Enums
CREATE TYPE autoresearch_element AS ENUM (
  'headline', 'cta', 'hook', 'mechanism', 'quiz_hook'
);

CREATE TYPE autoresearch_campaign_status AS ENUM (
  'active', 'paused', 'completed', 'error'
);

CREATE TYPE autoresearch_iteration_status AS ENUM (
  'generating', 'pending_approval', 'deploying', 'measuring', 'decided', 'error'
);

CREATE TYPE autoresearch_decision AS ENUM (
  'keep', 'revert', 'skipped', 'error'
);

-- ── Campaigns ──
CREATE TABLE autoresearch_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id     UUID REFERENCES offer_briefings(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  element_type    autoresearch_element NOT NULL DEFAULT 'headline',
  status          autoresearch_campaign_status NOT NULL DEFAULT 'paused',

  -- VTurb config
  vturb_video_id  TEXT NOT NULL,
  vturb_api_key   TEXT,

  -- Deploy config
  deploy_repo     TEXT NOT NULL,
  deploy_branch   TEXT NOT NULL DEFAULT 'main',
  deploy_file_path TEXT NOT NULL,

  -- Thresholds
  min_sessions        INT NOT NULL DEFAULT 200,
  min_improvement_pct NUMERIC(5,2) NOT NULL DEFAULT 2.0,
  max_iterations      INT NOT NULL DEFAULT 50,
  iteration_hours     INT NOT NULL DEFAULT 48,

  -- Human gate
  require_approval BOOLEAN NOT NULL DEFAULT false,

  -- Simulation mode (skips VTurb + GitHub, uses fake metrics)
  simulate_mode    BOOLEAN NOT NULL DEFAULT false,

  -- Copywriter
  copywriter_id   TEXT NOT NULL DEFAULT 'gary-halbert',

  -- State
  current_value       TEXT,
  baseline_play_rate  NUMERIC(7,4),
  best_play_rate      NUMERIC(7,4),
  iteration_count     INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Iterations ──
CREATE TABLE autoresearch_iterations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       UUID NOT NULL REFERENCES autoresearch_campaigns(id) ON DELETE CASCADE,
  iteration_number  INT NOT NULL,

  variant_value     TEXT,
  hypothesis        TEXT,
  previous_value    TEXT,
  previous_play_rate NUMERIC(7,4),

  -- Measurement
  play_rate         NUMERIC(7,4),
  sessions_collected INT DEFAULT 0,
  unique_views      INT DEFAULT 0,
  measured_at       TIMESTAMPTZ,

  status            autoresearch_iteration_status NOT NULL DEFAULT 'generating',
  decision          autoresearch_decision,
  decision_reason   TEXT,

  -- Metadata
  copywriter_used   TEXT,
  wiki_pages_used   TEXT[],

  deploy_started_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Measurements (granular poll history) ──
CREATE TABLE autoresearch_measurements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iteration_id  UUID NOT NULL REFERENCES autoresearch_iterations(id) ON DELETE CASCADE,
  sessions      INT NOT NULL DEFAULT 0,
  play_rate     NUMERIC(7,4),
  unique_views  INT NOT NULL DEFAULT 0,
  raw_response  JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ar_iterations_campaign ON autoresearch_iterations(campaign_id);
CREATE INDEX idx_ar_measurements_iteration ON autoresearch_measurements(iteration_id);
CREATE INDEX idx_ar_campaigns_status ON autoresearch_campaigns(status);
CREATE INDEX idx_ar_campaigns_briefing ON autoresearch_campaigns(briefing_id);
