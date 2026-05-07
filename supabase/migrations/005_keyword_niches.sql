-- Migration 005 — keyword × nicho
-- Adiciona FK opcional de spy_keywords para niches.
-- niche_id NULL = keyword "geral" (mostrada em todos os nichos da Biblioteca de Anúncios).
-- NOTA: niches.id é TEXT (não UUID), portanto a coluna também é TEXT.

ALTER TABLE spy_keywords
  ADD COLUMN IF NOT EXISTS niche_id TEXT
  REFERENCES niches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_spy_keywords_niche
  ON spy_keywords(niche_id);

COMMENT ON COLUMN spy_keywords.niche_id IS
  'Nicho associado. NULL = keyword geral (aparece em todos os nichos).';
