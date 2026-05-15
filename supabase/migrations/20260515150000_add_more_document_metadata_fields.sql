-- Migration: Add additional document metadata fields
-- Description: Adds document_book, book_number, summary, signer, drafting_department, document_symbol, and drafter to the documents table.

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS document_book text,
ADD COLUMN IF NOT EXISTS book_number text,
ADD COLUMN IF NOT EXISTS summary text,
ADD COLUMN IF NOT EXISTS signer text,
ADD COLUMN IF NOT EXISTS drafting_department text,
ADD COLUMN IF NOT EXISTS document_symbol text,
ADD COLUMN IF NOT EXISTS drafter text;
