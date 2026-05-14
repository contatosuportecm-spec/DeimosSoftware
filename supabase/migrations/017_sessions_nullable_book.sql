-- Make book_id nullable on book_sessions so sessions can exist without a specific book
ALTER TABLE book_sessions ALTER COLUMN book_id DROP NOT NULL;
