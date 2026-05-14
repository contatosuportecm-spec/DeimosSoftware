-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 016 — Biblioteca, Clientes Artificiais, VSL Studio
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, author TEXT, file_url TEXT NOT NULL, file_name TEXT NOT NULL,
  file_size INTEGER, full_text TEXT, chunk_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing','ready','error')),
  error_msg TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE book_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL, content TEXT NOT NULL, UNIQUE(book_id, chunk_index)
);
CREATE TABLE book_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT, created_at TIMESTAMPTZ DEFAULT now(), last_message_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE book_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id UUID NOT NULL REFERENCES book_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')), content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE FUNCTION update_book_session_last_msg() RETURNS TRIGGER AS $$
BEGIN UPDATE book_sessions SET last_message_at = NEW.created_at WHERE id = NEW.session_id; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER tr_book_msg_inserted AFTER INSERT ON book_messages FOR EACH ROW EXECUTE FUNCTION update_book_session_last_msg();

CREATE TABLE client_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, age_range TEXT, gender TEXT, niche TEXT,
  pains TEXT[] DEFAULT '{}', desires TEXT[] DEFAULT '{}', objections TEXT[] DEFAULT '{}', vocabulary TEXT[] DEFAULT '{}',
  behavior TEXT, emotional_state TEXT, awareness_level TEXT, study_text TEXT, study_file_url TEXT,
  avatar_color TEXT DEFAULT '#FF8A1F', status TEXT DEFAULT 'ready' CHECK (status IN ('processing','ready','error')),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE client_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), persona_id UUID NOT NULL REFERENCES client_personas(id) ON DELETE CASCADE,
  title TEXT, created_at TIMESTAMPTZ DEFAULT now(), last_message_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id UUID NOT NULL REFERENCES client_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')), content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE FUNCTION update_client_session_last_msg() RETURNS TRIGGER AS $$
BEGIN UPDATE client_sessions SET last_message_at = NEW.created_at WHERE id = NEW.session_id; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER tr_client_msg_inserted AFTER INSERT ON client_messages FOR EACH ROW EXECUTE FUNCTION update_client_session_last_msg();

DO $$ BEGIN CREATE TYPE vsl_context_kind AS ENUM ('copywriter','book'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE vsl_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT, context_kind vsl_context_kind NOT NULL,
  context_id TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), last_message_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE vsl_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id UUID NOT NULL REFERENCES vsl_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')), content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE FUNCTION update_vsl_session_last_msg() RETURNS TRIGGER AS $$
BEGIN UPDATE vsl_sessions SET last_message_at = NEW.created_at WHERE id = NEW.session_id; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER tr_vsl_msg_inserted AFTER INSERT ON vsl_messages FOR EACH ROW EXECUTE FUNCTION update_vsl_session_last_msg();

-- RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY; CREATE POLICY "allow_all" ON books FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE book_chunks ENABLE ROW LEVEL SECURITY; CREATE POLICY "allow_all" ON book_chunks FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE book_sessions ENABLE ROW LEVEL SECURITY; CREATE POLICY "allow_all" ON book_sessions FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE book_messages ENABLE ROW LEVEL SECURITY; CREATE POLICY "allow_all" ON book_messages FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE client_personas ENABLE ROW LEVEL SECURITY; CREATE POLICY "allow_all" ON client_personas FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY; CREATE POLICY "allow_all" ON client_sessions FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY; CREATE POLICY "allow_all" ON client_messages FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE vsl_sessions ENABLE ROW LEVEL SECURITY; CREATE POLICY "allow_all" ON vsl_sessions FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE vsl_messages ENABLE ROW LEVEL SECURITY; CREATE POLICY "allow_all" ON vsl_messages FOR ALL USING (true) WITH CHECK (true);
