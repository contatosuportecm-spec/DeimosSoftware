-- ============================================================================
-- Migration 009: Forge — AI Studio Module
-- Providers, API keys, models catalog, generation history
-- ============================================================================

-- ── forge_providers ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forge_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  auth_header TEXT NOT NULL DEFAULT 'Authorization',
  auth_prefix TEXT NOT NULL DEFAULT 'Bearer ',
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- ── forge_api_keys ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forge_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES forge_providers(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id)
);

-- ── forge_generations ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forge_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id TEXT NOT NULL,
  provider_id TEXT NOT NULL REFERENCES forge_providers(id),
  category TEXT NOT NULL,
  prompt TEXT,
  params JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  result_url TEXT,
  thumbnail_url TEXT,
  error TEXT,
  request_id TEXT,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_forge_gen_status ON forge_generations(status);
CREATE INDEX IF NOT EXISTS idx_forge_gen_category ON forge_generations(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forge_gen_offer ON forge_generations(offer_id) WHERE offer_id IS NOT NULL;

-- ── Seed providers ──────────────────────────────────────────────────────────
INSERT INTO forge_providers (id, name, base_url, auth_header, auth_prefix) VALUES
  ('muapi', 'Muapi', 'https://api.muapi.ai', 'x-api-key', '')
ON CONFLICT (id) DO NOTHING;
