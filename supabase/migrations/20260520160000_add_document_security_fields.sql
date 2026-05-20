-- Migration: Add security fields to documents and bim_models for BCA compliance

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS encryption_key_id TEXT,
ADD COLUMN IF NOT EXISTS virus_scan_status TEXT DEFAULT 'pending';

ALTER TABLE bim_models
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

COMMENT ON COLUMN documents.file_hash IS 'SHA-256 hash of the file content for integrity checking (QCVN 12:2026/BCA 2.2.5.4)';
COMMENT ON COLUMN documents.is_encrypted IS 'Flag indicating if the file content is client-side encrypted (QCVN 12:2026/BCA 2.2.5.5)';
COMMENT ON COLUMN documents.virus_scan_status IS 'Status of the automated virus scan (pending, clean, infected)';
COMMENT ON COLUMN bim_models.file_hash IS 'SHA-256 hash of the file content for integrity checking (QCVN 12:2026/BCA 2.2.5.4)';
