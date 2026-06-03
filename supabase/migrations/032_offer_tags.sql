-- 032_offer_tags.sql
-- Tag manual opcional por oferta no módulo Spy.
-- Valores usados pela app: 'atencao' | 'interessante' | 'acompanhar' (NULL = sem tag).
-- Sem constraint de enum de propósito — validação fica na aplicação.

ALTER TABLE offers ADD COLUMN IF NOT EXISTS tag TEXT;
