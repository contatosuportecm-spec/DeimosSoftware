-- 027: RLS policies for AutoResearch tables (same pattern as other modules)
ALTER TABLE autoresearch_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON autoresearch_campaigns FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE autoresearch_iterations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON autoresearch_iterations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE autoresearch_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON autoresearch_measurements FOR ALL USING (true) WITH CHECK (true);
