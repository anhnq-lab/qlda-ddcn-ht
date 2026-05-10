-- Migration: CDE Storage Optimization & Stats View

-- Add versioning and deduplication columns
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS version_group_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS file_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_version_group ON documents(version_group_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);

-- Create a view for high-performance CDE stats
CREATE OR REPLACE VIEW cde_project_stats_view AS
SELECT 
    project_id,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE iso_status = 'WIP' OR iso_status IS NULL) as wip,
    COUNT(*) FILTER (WHERE iso_status = 'SHARED') as shared,
    COUNT(*) FILTER (WHERE iso_status = 'PUBLISHED') as published,
    COUNT(*) FILTER (WHERE iso_status = 'ARCHIVED') as archived
FROM documents
WHERE folder_id IS NOT NULL
GROUP BY project_id;
