-- 024: Simplificar autoresearch_campaigns
-- - Adicionar iteration_minutes (substitui iteration_hours)
-- - Tornar min_sessions nullable
-- - Remover min_improvement_pct, max_iterations, iteration_hours

-- 1. Adicionar iteration_minutes com default 2880 (48h)
ALTER TABLE autoresearch_campaigns
  ADD COLUMN IF NOT EXISTS iteration_minutes INT NOT NULL DEFAULT 2880;

-- 2. Migrar dados existentes: iteration_hours -> iteration_minutes
UPDATE autoresearch_campaigns
  SET iteration_minutes = iteration_hours * 60
  WHERE iteration_hours IS NOT NULL;

-- 3. Tornar min_sessions nullable
ALTER TABLE autoresearch_campaigns
  ALTER COLUMN min_sessions DROP NOT NULL,
  ALTER COLUMN min_sessions DROP DEFAULT;

-- 4. Remover colunas obsoletas
ALTER TABLE autoresearch_campaigns
  DROP COLUMN IF EXISTS min_improvement_pct,
  DROP COLUMN IF EXISTS max_iterations,
  DROP COLUMN IF EXISTS iteration_hours;
