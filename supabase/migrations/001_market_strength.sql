-- ============================================================================
-- Migration 001: Market Strength Score
-- Adiciona scoring de força de mercado e detecção de padrão de escala
-- ============================================================================

-- ── offers: campos de inteligência ──────────────────────────────────────────

-- Score de força de mercado (0-100) — substitui `score` como métrica principal
ALTER TABLE offers ADD COLUMN IF NOT EXISTS market_strength NUMERIC(5,2) DEFAULT 0;

-- Componentes do score (transparência para debug e UI)
ALTER TABLE offers ADD COLUMN IF NOT EXISTS volume_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS growth_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS consistency_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS recency_score NUMERIC(5,2) DEFAULT 0;

-- Padrão de escala detectado
-- valores: 'lateral' | 'vertical' | 'budget' | 'creative_flood' | 'mixed' | 'unknown'
ALTER TABLE offers ADD COLUMN IF NOT EXISTS scaling_pattern TEXT DEFAULT 'unknown';

-- Decisão pós-observação
-- valores: 'test' | 'keep_watching' | 'archive' | null
ALTER TABLE offers ADD COLUMN IF NOT EXISTS decision TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS decision_at TIMESTAMPTZ;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS observation_days INTEGER DEFAULT 0;

-- ── offer_snapshots: preparar para dados de criativos ───────────────────────

-- Criativos únicos visíveis (futuro: quando collector entrar)
ALTER TABLE offer_snapshots ADD COLUMN IF NOT EXISTS creative_count INTEGER;
-- Criativos com 2+ cópias (sinal de scaling intencional)
ALTER TABLE offer_snapshots ADD COLUMN IF NOT EXISTS duplicate_count INTEGER;

-- ── Índices ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_offers_market_strength
  ON offers (market_strength DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_offers_scaling_pattern
  ON offers (scaling_pattern)
  WHERE scaling_pattern != 'unknown';
