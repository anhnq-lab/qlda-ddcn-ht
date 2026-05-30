-- ═══════════════════════════════════════════════════════════════
-- GĐ3: Version Sets + Sensitivity level defaults
-- ═══════════════════════════════════════════════════════════════

-- Version Sets: snapshot các revision mới nhất tại một thời điểm (kiểu "issue set" Autodesk)
CREATE TABLE IF NOT EXISTS cde_version_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    folder_id UUID REFERENCES cde_folders(id),
    snapshot JSONB NOT NULL DEFAULT '[]',
    created_by TEXT,
    created_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cde_version_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "version_sets_project_member" ON cde_version_sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = cde_version_sets.project_id
            AND pm.user_id = auth.uid()::text
        )
        OR is_global_role()
    );

CREATE INDEX IF NOT EXISTS idx_version_sets_project ON cde_version_sets(project_id);

-- Ensure sensitivity_level has a usable default on documents table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'sensitivity_level'
    ) THEN
        ALTER TABLE documents ALTER COLUMN sensitivity_level SET DEFAULT 1;
    ELSE
        ALTER TABLE documents ADD COLUMN sensitivity_level INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;
