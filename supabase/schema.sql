-- Enums
CREATE TYPE offer_status AS ENUM ('new', 'monitoring', 'scaling', 'stable', 'dying', 'archived');
CREATE TYPE knowledge_type AS ENUM ('hook', 'angle', 'mechanism', 'script', 'reference', 'pattern');
CREATE TYPE chat_role AS ENUM ('user', 'assistant', 'system');

-- Ofertas monitoradas
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  library_url TEXT,
  page_url TEXT,
  vsl_url TEXT,
  status offer_status DEFAULT 'new',
  score INTEGER DEFAULT 0,
  notes TEXT,
  -- Market Strength Score
  market_strength NUMERIC(5,2) DEFAULT 0,
  volume_score NUMERIC(5,2) DEFAULT 0,
  growth_score NUMERIC(5,2) DEFAULT 0,
  consistency_score NUMERIC(5,2) DEFAULT 0,
  recency_score NUMERIC(5,2) DEFAULT 0,
  scaling_pattern TEXT DEFAULT 'unknown',
  -- Decisão pós-observação
  decision TEXT,
  decision_at TIMESTAMPTZ,
  observation_days INTEGER DEFAULT 0,
  -- Discovery
  discovered_keyword TEXT,
  dr_score NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico diário de anúncios
CREATE TABLE offer_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  active_ads_count INTEGER NOT NULL DEFAULT 0,
  creative_count INTEGER,
  duplicate_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(offer_id, date)
);

-- Nichos configurados
CREATE TABLE niches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📦',
  color TEXT DEFAULT '#818CF8',
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge base por nicho
CREATE TABLE niche_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id TEXT NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  type knowledge_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessões de chat
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id TEXT NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Mensagens
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role chat_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Keywords para discovery automático
CREATE TABLE spy_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  language TEXT NOT NULL DEFAULT 'pt',
  is_active BOOLEAN DEFAULT true,
  total_found INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_spy_keywords_unique ON spy_keywords (LOWER(keyword));

-- Discovery runs (log de execuções)
CREATE TABLE discovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',
  keywords_scanned INTEGER DEFAULT 0,
  pages_found INTEGER DEFAULT 0,
  pages_passed_filter INTEGER DEFAULT 0,
  offers_created INTEGER DEFAULT 0,
  offers_skipped INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  log JSONB DEFAULT '[]'::jsonb
);

-- Blacklist de páginas (brands, restaurantes, etc.)
CREATE TABLE page_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL UNIQUE,
  page_name TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blacklist_page_id ON page_blacklist (page_id);

-- Indexes
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_market_strength ON offers(market_strength DESC NULLS LAST);
CREATE INDEX idx_offers_scaling_pattern ON offers(scaling_pattern) WHERE scaling_pattern != 'unknown';
CREATE INDEX idx_snapshots_offer ON offer_snapshots(offer_id, date);
CREATE INDEX idx_knowledge_niche ON niche_knowledge(niche_id, type);
CREATE INDEX idx_messages_session ON chat_messages(session_id, created_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_offers_updated BEFORE UPDATE ON offers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update last_message_at
CREATE OR REPLACE FUNCTION update_session_last_msg()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions SET last_message_at = NEW.created_at WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_msg_inserted AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION update_session_last_msg();

-- Seed nichos iniciais
INSERT INTO niches (id, name, description, emoji, color) VALUES
  ('emagrecimento', 'Emagrecimento', 'Perda de peso, GLP-1, receitas, suplementos', '🔥', '#E94560'),
  ('saude-masculina', 'Saúde Masculina', 'Libido, testosterona, performance', '💪', '#3B82F6'),
  ('financas', 'Finanças', 'Renda extra, investimentos, liberdade financeira', '💰', '#10B981'),
  ('beleza', 'Beleza & Estética', 'Skincare, anti-aging, procedimentos', '✨', '#8B5CF6'),
  ('relacionamento', 'Relacionamento', 'Reconquista, sedução, casamento', '❤️', '#EC4899');
