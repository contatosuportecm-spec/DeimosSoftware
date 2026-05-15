-- Make persona_id nullable so offers can be global
ALTER TABLE persona_offers ALTER COLUMN persona_id DROP NOT NULL;
