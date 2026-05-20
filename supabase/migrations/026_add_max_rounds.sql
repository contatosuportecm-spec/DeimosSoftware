-- 026: Add max_rounds column (optional limit on rounds per campaign)
ALTER TABLE autoresearch_campaigns ADD COLUMN IF NOT EXISTS max_rounds INT;
