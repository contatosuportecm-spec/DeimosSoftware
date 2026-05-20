-- ═══════════════════════════════════════════════════════════════════
-- BRAIN — Expandir wiki_page_kind para cobrir toda a empresa
-- Adiciona kinds: finance, legal, operations, strategy, process,
--                 sop, template, meeting, metric, resource
-- ═══════════════════════════════════════════════════════════════════

ALTER TYPE wiki_page_kind ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE wiki_page_kind ADD VALUE IF NOT EXISTS 'legal';
ALTER TYPE wiki_page_kind ADD VALUE IF NOT EXISTS 'operations';
ALTER TYPE wiki_page_kind ADD VALUE IF NOT EXISTS 'strategy';
ALTER TYPE wiki_page_kind ADD VALUE IF NOT EXISTS 'process';
ALTER TYPE wiki_page_kind ADD VALUE IF NOT EXISTS 'sop';
ALTER TYPE wiki_page_kind ADD VALUE IF NOT EXISTS 'template';
ALTER TYPE wiki_page_kind ADD VALUE IF NOT EXISTS 'meeting';
ALTER TYPE wiki_page_kind ADD VALUE IF NOT EXISTS 'metric';
ALTER TYPE wiki_page_kind ADD VALUE IF NOT EXISTS 'resource';
