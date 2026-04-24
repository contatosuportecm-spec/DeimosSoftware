-- ============================================================================
-- Migration 002: Spy Discovery — Keywords + Discovery Runs
-- Automação de pesquisa de novas ofertas via Meta Ads Library
-- ============================================================================

-- ── spy_keywords: palavras-chave para pesquisa automática ───────────────────

CREATE TABLE IF NOT EXISTS spy_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  -- 'gatilho_metodo', 'causa_problema', 'prova_social', 'urgencia_censura', 'emocional'
  language TEXT NOT NULL DEFAULT 'pt',  -- 'pt' | 'en'
  is_active BOOLEAN DEFAULT true,
  total_found INTEGER DEFAULT 0,        -- total de ofertas encontradas com essa keyword
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_spy_keywords_unique
  ON spy_keywords (LOWER(keyword));

CREATE INDEX IF NOT EXISTS idx_spy_keywords_active
  ON spy_keywords (is_active) WHERE is_active = true;

-- ── discovery_runs: log de cada execução do discovery ───────────────────────

CREATE TABLE IF NOT EXISTS discovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',  -- 'running' | 'completed' | 'failed'
  keywords_scanned INTEGER DEFAULT 0,
  pages_found INTEGER DEFAULT 0,
  pages_passed_filter INTEGER DEFAULT 0,
  offers_created INTEGER DEFAULT 0,
  offers_skipped INTEGER DEFAULT 0,  -- já existiam
  errors INTEGER DEFAULT 0,
  log JSONB DEFAULT '[]'::jsonb
);

-- ── offers: campo source para distinguir manual vs auto ─────────────────────

-- Adiciona discovered_keyword para rastreabilidade
ALTER TABLE offers ADD COLUMN IF NOT EXISTS discovered_keyword TEXT;
-- Adiciona dr_score para transparência
ALTER TABLE offers ADD COLUMN IF NOT EXISTS dr_score NUMERIC(5,2) DEFAULT 0;

-- ── page_blacklist: páginas/brands a ignorar permanentemente ────────────────

CREATE TABLE IF NOT EXISTS page_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL UNIQUE,
  page_name TEXT,
  reason TEXT,  -- 'brand', 'restaurant', 'financial', 'celebrity', 'manual'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blacklist_page_id ON page_blacklist (page_id);

-- ── Seed: keywords iniciais (baseado no keywords.txt do collector) ──────────

INSERT INTO spy_keywords (keyword, category, language) VALUES
  -- Gatilho / Método (PT)
  ('truque caseiro', 'gatilho_metodo', 'pt'),
  ('truque simples', 'gatilho_metodo', 'pt'),
  ('truque natural', 'gatilho_metodo', 'pt'),
  ('truque secreto', 'gatilho_metodo', 'pt'),
  ('método natural', 'gatilho_metodo', 'pt'),
  ('método caseiro', 'gatilho_metodo', 'pt'),
  ('método simples', 'gatilho_metodo', 'pt'),
  ('método revolucionário', 'gatilho_metodo', 'pt'),
  ('método secreto', 'gatilho_metodo', 'pt'),
  ('ritual matinal', 'gatilho_metodo', 'pt'),
  ('ritual noturno', 'gatilho_metodo', 'pt'),
  ('ritual de 10 segundos', 'gatilho_metodo', 'pt'),
  ('protocolo natural', 'gatilho_metodo', 'pt'),
  ('protocolo caseiro', 'gatilho_metodo', 'pt'),
  ('segredo caseiro', 'gatilho_metodo', 'pt'),
  ('receita caseira', 'gatilho_metodo', 'pt'),
  ('receita simples', 'gatilho_metodo', 'pt'),
  ('misturinha', 'gatilho_metodo', 'pt'),
  ('mistura poderosa', 'gatilho_metodo', 'pt'),
  -- Causa / Problema oculto (PT)
  ('verdadeira causa', 'causa_problema', 'pt'),
  ('causa raiz', 'causa_problema', 'pt'),
  ('problema oculto', 'causa_problema', 'pt'),
  ('motivo real', 'causa_problema', 'pt'),
  ('trava hormonal', 'causa_problema', 'pt'),
  ('a raiz do problema', 'causa_problema', 'pt'),
  -- Prova social (PT)
  ('comprovado', 'prova_social', 'pt'),
  ('médicos revelam', 'prova_social', 'pt'),
  ('pesquisadores de Harvard', 'prova_social', 'pt'),
  -- Urgência / Censura (PT)
  ('antes que tirem do ar', 'urgencia_censura', 'pt'),
  ('vídeo proibido', 'urgencia_censura', 'pt'),
  ('escondido da população', 'urgencia_censura', 'pt'),
  ('o que ninguém conta', 'urgencia_censura', 'pt'),
  ('finalmente revelado', 'urgencia_censura', 'pt'),
  ('descoberta acidental', 'urgencia_censura', 'pt'),
  -- Emocional (PT)
  ('chocante', 'emocional', 'pt'),
  ('surpreendente', 'emocional', 'pt'),
  ('bizarro', 'emocional', 'pt'),
  -- Triggers (EN)
  ('secret method', 'gatilho_metodo', 'en'),
  ('simple trick', 'gatilho_metodo', 'en'),
  ('weird trick', 'gatilho_metodo', 'en'),
  ('bizarre trick', 'gatilho_metodo', 'en'),
  ('10-second ritual', 'gatilho_metodo', 'en'),
  ('ancient formula', 'gatilho_metodo', 'en'),
  ('natural remedy', 'gatilho_metodo', 'en'),
  ('home remedy', 'gatilho_metodo', 'en'),
  -- Urgência (EN)
  ('watch before removed', 'urgencia_censura', 'en'),
  ('they don''t want you to know', 'urgencia_censura', 'en'),
  ('big pharma hates', 'urgencia_censura', 'en'),
  ('shocking', 'emocional', 'en'),
  ('mind-blowing', 'emocional', 'en')
ON CONFLICT DO NOTHING;
