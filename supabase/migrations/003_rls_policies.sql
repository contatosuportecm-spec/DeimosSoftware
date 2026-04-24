-- ============================================================================
-- Migration 003: RLS Policies para tabelas do Spy Discovery
-- Permite acesso via anon key (mesmo padrão do resto do sistema)
-- ============================================================================

-- ── discovery_runs ──────────────────────────────────────────────────────────
ALTER TABLE discovery_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discovery_runs_select" ON discovery_runs FOR SELECT USING (true);
CREATE POLICY "discovery_runs_insert" ON discovery_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "discovery_runs_update" ON discovery_runs FOR UPDATE USING (true);

-- ── spy_keywords ────────────────────────────────────────────────────────────
ALTER TABLE spy_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spy_keywords_select" ON spy_keywords FOR SELECT USING (true);
CREATE POLICY "spy_keywords_insert" ON spy_keywords FOR INSERT WITH CHECK (true);
CREATE POLICY "spy_keywords_update" ON spy_keywords FOR UPDATE USING (true);
CREATE POLICY "spy_keywords_delete" ON spy_keywords FOR DELETE USING (true);

-- ── page_blacklist ──────────────────────────────────────────────────────────
ALTER TABLE page_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_blacklist_select" ON page_blacklist FOR SELECT USING (true);
CREATE POLICY "page_blacklist_insert" ON page_blacklist FOR INSERT WITH CHECK (true);

-- ── offers (caso RLS esteja habilitado e faltem policies) ───────────────────
-- Garante que insert/update do collector funcione
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'offers' AND policyname = 'offers_all'
  ) THEN
    EXECUTE 'CREATE POLICY "offers_all" ON offers USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ── offer_snapshots (mesmo caso) ────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'offer_snapshots' AND policyname = 'offer_snapshots_all'
  ) THEN
    EXECUTE 'CREATE POLICY "offer_snapshots_all" ON offer_snapshots USING (true) WITH CHECK (true)';
  END IF;
END $$;
