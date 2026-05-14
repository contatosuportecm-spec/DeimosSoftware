-- Add source type to books (pdf or youtube)
ALTER TABLE books ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'pdf' CHECK (source_type IN ('pdf', 'youtube'));
ALTER TABLE books ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE books ALTER COLUMN file_url DROP NOT NULL;
ALTER TABLE books ALTER COLUMN file_name DROP NOT NULL;
-- Also make book_id nullable on sessions
ALTER TABLE book_sessions ALTER COLUMN book_id DROP NOT NULL;
