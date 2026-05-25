-- ═══ Funnel v2 — Clean container content ═══
-- Containers no longer store content fields (hook, duration, framework, etc.)
-- Content is now built inside via drill-down blocks.

UPDATE funnel_nodes
SET content = '{}'::jsonb
WHERE type IN ('vsl', 'quiz', 'sales_page', 'email', 'whatsapp', 'upsell', 'downsell');
