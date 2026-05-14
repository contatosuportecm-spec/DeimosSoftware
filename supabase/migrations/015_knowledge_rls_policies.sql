-- ═══════════════════════════════════════════════════════════════════
-- RLS policies para o Knowledge System
-- Padrão do projeto: anon key pode tudo (segurança no app, não no banco)
-- Safe pra rodar múltiplas vezes (DO $$ + IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'raw_sources',
    'wiki_pages',
    'wiki_revisions',
    'wiki_runs',
    'avatar_interactions',
    'competitor_offers',
    'vsl_drafts'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- Habilita RLS (idempotente)
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    -- SELECT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = format('%s_select', t)
    ) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (true)', format('%s_select', t), t);
    END IF;

    -- INSERT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = format('%s_insert', t)
    ) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (true)', format('%s_insert', t), t);
    END IF;

    -- UPDATE
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = format('%s_update', t)
    ) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (true) WITH CHECK (true)', format('%s_update', t), t);
    END IF;

    -- DELETE
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = format('%s_delete', t)
    ) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (true)', format('%s_delete', t), t);
    END IF;
  END LOOP;
END $$;
