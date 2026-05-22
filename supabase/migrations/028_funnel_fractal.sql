-- ═══ Funnel Canvas — Fractal Rewrite ═══
-- Replaces the old single-table JSONB approach with proper relational tables
-- for recursive (fractal) funnel nodes and edges.

-- 1. Rename old table to preserve data
ALTER TABLE IF EXISTS funnels RENAME TO funnels_legacy;

-- 2. New funnels table (clean)
CREATE TABLE IF NOT EXISTS funnels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. Funnel nodes (recursive via parent_node_id)
CREATE TABLE IF NOT EXISTS funnel_nodes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id       uuid NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  parent_node_id  uuid REFERENCES funnel_nodes(id) ON DELETE CASCADE,
  type            text NOT NULL DEFAULT 'custom',
  label           text NOT NULL DEFAULT 'Novo no',
  position_x      float NOT NULL DEFAULT 0,
  position_y      float NOT NULL DEFAULT 0,
  content         jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics         jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_index     int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 4. Funnel edges (connections between nodes at the same level)
CREATE TABLE IF NOT EXISTS funnel_edges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id       uuid NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  source_node_id  uuid NOT NULL REFERENCES funnel_nodes(id) ON DELETE CASCADE,
  target_node_id  uuid NOT NULL REFERENCES funnel_nodes(id) ON DELETE CASCADE,
  label           text,
  condition       jsonb
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_funnel_nodes_funnel ON funnel_nodes(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_nodes_parent ON funnel_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_funnel_edges_funnel ON funnel_edges(funnel_id);

-- 6. Updated_at triggers
CREATE OR REPLACE FUNCTION update_funnel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_funnels_updated ON funnels;
CREATE TRIGGER trg_funnels_updated
  BEFORE UPDATE ON funnels
  FOR EACH ROW EXECUTE FUNCTION update_funnel_updated_at();

DROP TRIGGER IF EXISTS trg_funnel_nodes_updated ON funnel_nodes;
CREATE TRIGGER trg_funnel_nodes_updated
  BEFORE UPDATE ON funnel_nodes
  FOR EACH ROW EXECUTE FUNCTION update_funnel_updated_at();

-- 7. RLS
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funnels_allow_all" ON funnels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "funnel_nodes_allow_all" ON funnel_nodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "funnel_edges_allow_all" ON funnel_edges FOR ALL USING (true) WITH CHECK (true);
