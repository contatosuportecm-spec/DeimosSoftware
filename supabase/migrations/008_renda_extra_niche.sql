-- Migration 008 — Renomeia nicho "financas" → "renda-extra" e ajusta emoji do low_ticket.
-- Idempotente: pode rodar mesmo se 007 ainda não tiver sido executado.

-- ══════════════════════════════════════════
-- 1. Atualiza emoji do low_ticket (caso já tenha sido criado com 🪙)
-- ══════════════════════════════════════════
UPDATE niches SET emoji = '🎫' WHERE id = 'low_ticket' AND emoji = '🪙';

-- ══════════════════════════════════════════
-- 2. Cria nicho "renda-extra"
-- ══════════════════════════════════════════
INSERT INTO niches (id, name, description, emoji, color, is_active) VALUES
  ('renda-extra', 'Renda Extra', 'Renda extra, investimentos, liberdade financeira', '💰', '#10B981', true)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════
-- 3. Migra dados que apontavam para 'financas' → 'renda-extra'
-- ══════════════════════════════════════════
UPDATE offers           SET niche    = 'renda-extra' WHERE niche    = 'financas';
UPDATE spy_keywords     SET niche_id = 'renda-extra' WHERE niche_id = 'financas';
-- Tabelas com FK + ON DELETE CASCADE precisam ser migradas antes do DELETE
UPDATE niche_knowledge  SET niche_id = 'renda-extra' WHERE niche_id = 'financas';
UPDATE chat_sessions    SET niche_id = 'renda-extra' WHERE niche_id = 'financas';

-- ══════════════════════════════════════════
-- 4. Remove o registro antigo
-- ══════════════════════════════════════════
DELETE FROM niches WHERE id = 'financas';
