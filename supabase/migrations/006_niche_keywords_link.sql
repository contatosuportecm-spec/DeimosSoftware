-- Migration 006 — Vincular keywords PT existentes a nichos + seed Low Ticket (PT)
-- NOTA: Keywords EN de nicho (emagrecimento/ed/diabetes) da migration 004
--       são removidas aqui — apenas PT é mantido nesses nichos.

-- ══════════════════════════════════════════
-- 1. Novo nicho: Diabetes
-- ══════════════════════════════════════════
INSERT INTO niches (id, name, emoji, color, is_active) VALUES
  ('diabetes', 'diabetes', '🩺', '#06B6D4', true)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════
-- 2. Remover keywords EN de nicho-específico (004 seedou EN — usuário quer só PT)
-- ══════════════════════════════════════════
DELETE FROM spy_keywords
WHERE language = 'en' AND category IN ('emagrecimento', 'ed', 'diabetes');

-- ══════════════════════════════════════════
-- 3. Vincular keywords PT existentes aos nichos
-- ══════════════════════════════════════════
UPDATE spy_keywords
  SET niche_id = 'emagrecimento'
WHERE category = 'emagrecimento' AND language = 'pt' AND niche_id IS NULL;

UPDATE spy_keywords
  SET niche_id = 'saude-masculina'
WHERE category = 'ed' AND language = 'pt' AND niche_id IS NULL;

UPDATE spy_keywords
  SET niche_id = 'diabetes'
WHERE category = 'diabetes' AND language = 'pt' AND niche_id IS NULL;

-- ══════════════════════════════════════════
-- 4. Seed Low Ticket (PT, niche_id = NULL = grupo Gerais)
-- ══════════════════════════════════════════
INSERT INTO spy_keywords (keyword, category, language, niche_id) VALUES
  ('responda',         'low_ticket', 'pt', NULL),
  ('diagnóstico',      'low_ticket', 'pt', NULL),
  ('fórmula',          'low_ticket', 'pt', NULL),
  ('análise',          'low_ticket', 'pt', NULL),
  ('desafio',          'low_ticket', 'pt', NULL),
  ('funciona',         'low_ticket', 'pt', NULL),
  ('definitivo',       'low_ticket', 'pt', NULL),
  ('teste gratuito',   'low_ticket', 'pt', NULL),
  ('guia prático',     'low_ticket', 'pt', NULL),
  ('guia completo',    'low_ticket', 'pt', NULL),
  ('nova forma',       'low_ticket', 'pt', NULL),
  ('nova técnica',     'low_ticket', 'pt', NULL),
  ('7 dias',           'low_ticket', 'pt', NULL),
  ('15 dias',          'low_ticket', 'pt', NULL),
  ('21 dias',          'low_ticket', 'pt', NULL),
  ('30 dias',          'low_ticket', 'pt', NULL),
  ('60 dias',          'low_ticket', 'pt', NULL),
  ('ebook',            'low_ticket', 'pt', NULL),
  ('curso online',     'low_ticket', 'pt', NULL),
  ('treinamento',      'low_ticket', 'pt', NULL),
  ('mentor',           'low_ticket', 'pt', NULL),
  ('fórmula milagrosa','low_ticket', 'pt', NULL),
  ('passo a passo',    'low_ticket', 'pt', NULL),
  ('passo simples',    'low_ticket', 'pt', NULL),
  ('acesso imediato',  'low_ticket', 'pt', NULL),
  ('19,90',            'low_ticket', 'pt', NULL),
  ('29,90',            'low_ticket', 'pt', NULL),
  ('9,90',             'low_ticket', 'pt', NULL),
  ('47,90',            'low_ticket', 'pt', NULL),
  ('49,90',            'low_ticket', 'pt', NULL),
  ('59,90',            'low_ticket', 'pt', NULL),
  ('97,00',            'low_ticket', 'pt', NULL),
  ('99,90',            'low_ticket', 'pt', NULL)
ON CONFLICT DO NOTHING;
