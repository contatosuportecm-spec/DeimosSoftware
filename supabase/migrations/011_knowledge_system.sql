-- ═══════════════════════════════════════════════════════════════════
-- KNOWLEDGE SYSTEM — Karpathy-style LLM Wiki para Direct Response
-- L1: raw_sources  (livros, transcrições, criativos concorrentes)
-- L2: wiki_pages   (síntese gerada+curada por LLM)
-- Auxiliares: revisões, runs, interações de avatar, copy drafts
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE wiki_page_kind AS ENUM (
  'voice',       -- copywriter (Halbert, Caples, Sugarman…)
  'framework',   -- estrutura (16-palavras, Halbert lead…)
  'concept',     -- princípio (PAS, AIDA…)
  'avatar',      -- persona de nicho
  'mechanism',   -- mecanismo único (enzima café, microbiota…)
  'pattern',     -- gancho/headline/lead/close
  'claims',      -- compliance por plataforma/nicho
  'lesson'       -- destilado pós-lançamento
);

CREATE TYPE raw_source_kind AS ENUM (
  'book', 'transcript', 'swipe', 'competitor_asset', 'review_corpus', 'manual'
);

CREATE TYPE wiki_run_kind AS ENUM (
  'ingest', 'query', 'lint', 'distill', 'consult', 'evaluate'
);

-- ═══ L1 · Raw Sources ═══════════════════════════════════════════════
CREATE TABLE raw_sources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind         raw_source_kind NOT NULL,
  title        TEXT NOT NULL,
  author       TEXT,
  niche        TEXT,
  content      TEXT,           -- texto completo (livros pequenos, transcrições)
  file_url     TEXT,           -- supabase storage url se for PDF/asset
  source_url   TEXT,           -- URL original (concorrente, post, etc.)
  hash         TEXT UNIQUE,    -- sha256 do conteúdo (evita duplicação)
  metadata     JSONB DEFAULT '{}'::jsonb,
  ingested_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_raw_sources_kind  ON raw_sources(kind);
CREATE INDEX idx_raw_sources_niche ON raw_sources(niche) WHERE niche IS NOT NULL;

-- ═══ L2 · Wiki Pages ════════════════════════════════════════════════
CREATE TABLE wiki_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  kind          wiki_page_kind NOT NULL,
  title         TEXT NOT NULL,
  summary       TEXT,                                    -- 1-line, aparece no index
  body_md       TEXT NOT NULL,                           -- markdown completo
  structured    JSONB DEFAULT '{}'::jsonb,               -- campos tipados por kind
  niches        TEXT[] DEFAULT '{}',                     -- emagrecimento, saúde, etc.
  tags          TEXT[] DEFAULT '{}',
  source_refs   UUID[] DEFAULT '{}',                     -- FK -> raw_sources
  links_to      TEXT[] DEFAULT '{}',                     -- slugs de outras pages
  confidence    NUMERIC(3,2) DEFAULT 0.50,               -- 0..1
  freshness     TIMESTAMPTZ DEFAULT now(),               -- última revisão
  usage_count   INTEGER DEFAULT 0,                       -- quantas vezes referenciada
  search_tsv    TSVECTOR,                                -- full-text search
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wiki_pages_kind      ON wiki_pages(kind);
CREATE INDEX idx_wiki_pages_niches    ON wiki_pages USING GIN(niches);
CREATE INDEX idx_wiki_pages_tags      ON wiki_pages USING GIN(tags);
CREATE INDEX idx_wiki_pages_links     ON wiki_pages USING GIN(links_to);
CREATE INDEX idx_wiki_pages_search    ON wiki_pages USING GIN(search_tsv);

-- trigger pra atualizar search_tsv e updated_at
CREATE OR REPLACE FUNCTION wiki_pages_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('portuguese', coalesce(NEW.title,'')),   'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.summary,'')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.body_md,'')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_wiki_pages_search
BEFORE INSERT OR UPDATE ON wiki_pages
FOR EACH ROW EXECUTE FUNCTION wiki_pages_search_trigger();

-- ═══ L2 · Revisões (histórico append-only) ══════════════════════════
CREATE TABLE wiki_revisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  body_md     TEXT NOT NULL,
  reason      TEXT,                          -- "destilado de concorrente X", "manual"
  author      TEXT DEFAULT 'llm',            -- llm | human | system
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wiki_revisions_page ON wiki_revisions(page_id, created_at DESC);

-- ═══ Logs de operações (memória episódica) ══════════════════════════
CREATE TABLE wiki_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            wiki_run_kind NOT NULL,
  input           JSONB,
  output          JSONB,
  page_ids_touched UUID[] DEFAULT '{}',
  tokens_used     INTEGER,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wiki_runs_kind ON wiki_runs(kind, created_at DESC);

-- ═══ Avatar interactions (Módulo 3) ════════════════════════════════
CREATE TYPE avatar_mode AS ENUM ('interview', 'test_copy');

CREATE TABLE avatar_interactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_page_id    UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  mode              avatar_mode NOT NULL,
  input             TEXT NOT NULL,
  output            JSONB NOT NULL,
  reaction_score    INTEGER,                 -- 0..10 (test_copy)
  used_evidence     UUID[] DEFAULT '{}',     -- FK raw_sources usadas
  human_validated   BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_avatar_int_page ON avatar_interactions(avatar_page_id, created_at DESC);

-- ═══ Competitor offers (Módulo 2) ══════════════════════════════════
CREATE TABLE competitor_offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  niche           TEXT,
  source_url      TEXT,
  raw_source_id   UUID REFERENCES raw_sources(id) ON DELETE SET NULL,
  extracted       JSONB NOT NULL DEFAULT '{}'::jsonb,
  l2_page_ids     UUID[] DEFAULT '{}',
  spy_offer_id    UUID REFERENCES offers(id) ON DELETE SET NULL,
  captured_at     TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_competitor_offers_niche ON competitor_offers(niche);

-- ═══ VSL drafts (Módulo 1) ═════════════════════════════════════════
CREATE TYPE vsl_draft_mode    AS ENUM ('generate', 'evaluate');
CREATE TYPE vsl_draft_verdict AS ENUM ('approved', 'needs_polish', 'needs_rewrite');

CREATE TABLE vsl_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id   UUID REFERENCES offer_briefings(id) ON DELETE CASCADE,
  mode          vsl_draft_mode NOT NULL,
  style_blend   JSONB DEFAULT '{}'::jsonb,   -- {Halbert: 0.7, Sugarman: 0.3}
  source_copy   TEXT,                        -- modo evaluate: copy original
  generated_copy TEXT,                       -- modo generate: copy produzida
  sections      JSONB DEFAULT '{}'::jsonb,   -- {hook, lead, mechanism, offer, guarantee, cta}
  scores        JSONB DEFAULT '{}'::jsonb,   -- {clareza, gancho, prova, urgencia, compliance}
  verdict       vsl_draft_verdict,
  improvements  JSONB DEFAULT '[]'::jsonb,   -- [{section, suggestion, expected_delta}]
  used_pages    UUID[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_vsl_drafts_briefing ON vsl_drafts(briefing_id, created_at DESC);

-- ═══ Auto-update updated_at ════════════════════════════════════════
-- wiki_pages já tem via trigger search_trigger
