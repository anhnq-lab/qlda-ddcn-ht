-- Migration: Add FTS generated columns for legal_documents and legal_articles
-- Date: 2026-05-10
-- Description: Supports Supabase JS .textSearch() by exposing a physical tsvector column

-- 1. Add fts column to legal_documents
ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(code,''))) STORED;

-- 2. Drop the old expression index and create one on the new column
DROP INDEX IF EXISTS idx_legal_docs_fts;
CREATE INDEX IF NOT EXISTS idx_legal_docs_fts ON legal_documents USING GIN(fts);

-- 3. Add fts column to legal_articles
ALTER TABLE legal_articles ADD COLUMN IF NOT EXISTS fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(content,''))) STORED;

-- 4. Drop the old expression index and create one on the new column
DROP INDEX IF EXISTS idx_legal_articles_fts;
CREATE INDEX IF NOT EXISTS idx_legal_articles_fts ON legal_articles USING GIN(fts);
