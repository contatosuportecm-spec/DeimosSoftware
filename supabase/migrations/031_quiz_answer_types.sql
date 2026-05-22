-- ═══ Quiz v5 — Replace answer_option with button_answer + text_answer ═══

-- 1. Delete old answer_option nodes
DELETE FROM funnel_nodes WHERE type = 'answer_option';

-- 2. Clean orphan edges
DELETE FROM funnel_edges
WHERE source_node_id NOT IN (SELECT id FROM funnel_nodes)
   OR target_node_id NOT IN (SELECT id FROM funnel_nodes);
