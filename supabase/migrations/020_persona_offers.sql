-- Offers tested with personas (copy, headlines, offers saved for reference)
CREATE TABLE IF NOT EXISTS persona_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES client_personas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  last_report JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_persona_offers_persona ON persona_offers(persona_id);

CREATE TRIGGER tr_persona_offers_updated
  BEFORE UPDATE ON persona_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
