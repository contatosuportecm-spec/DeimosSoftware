-- ═══ Funnel v4 — Persist edge handle IDs ═══
ALTER TABLE funnel_edges
  ADD COLUMN IF NOT EXISTS source_handle text,
  ADD COLUMN IF NOT EXISTS target_handle text;
