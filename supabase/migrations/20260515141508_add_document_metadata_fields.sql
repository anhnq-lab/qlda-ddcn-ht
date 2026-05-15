-- Migration: Add metadata fields to documents table for project legal documents
-- Date: 2026-05-15

-- Add columns for legal document metadata
ALTER TABLE IF EXISTS documents
ADD COLUMN IF NOT EXISTS doc_type TEXT,
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS issue_date TEXT,
ADD COLUMN IF NOT EXISTS issuing_authority TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update comments
COMMENT ON COLUMN documents.doc_type IS 'Loại tài liệu (Luật, Nghị định, Thông tư...)';
COMMENT ON COLUMN documents.document_number IS 'Số hiệu văn bản (VD: 123/QĐ-TTg)';
COMMENT ON COLUMN documents.issue_date IS 'Ngày ban hành';
COMMENT ON COLUMN documents.issuing_authority IS 'Cơ quan ban hành';
COMMENT ON COLUMN documents.notes IS 'Ghi chú tóm tắt';
