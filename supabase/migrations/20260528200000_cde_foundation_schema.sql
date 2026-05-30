-- ═══════════════════════════════════════════════════════════════
-- CDE Foundation Schema — ISO 19650 + VN Construction QLDA
-- Creates all core CDE tables and fixes the broken stats view.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. cde_folders
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cde_folders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      TEXT NOT NULL,
    parent_id       UUID REFERENCES cde_folders(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    container_type  TEXT NOT NULL CHECK (container_type IN ('WIP','SHARED','PUBLISHED','ARCHIVED')),
    path            TEXT,
    phase           TEXT,
    sort_order      INT DEFAULT 0,
    icon            TEXT,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cde_folders_project ON cde_folders(project_id);
CREATE INDEX IF NOT EXISTS idx_cde_folders_parent  ON cde_folders(parent_id);

-- ─────────────────────────────────────────────────────────────────
-- 2. Add CDE columns to documents
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS cde_folder_id      UUID REFERENCES cde_folders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS cde_status         TEXT DEFAULT 'S0',
    ADD COLUMN IF NOT EXISTS discipline         TEXT,
    ADD COLUMN IF NOT EXISTS submitted_by       TEXT,
    ADD COLUMN IF NOT EXISTS submitted_by_org   TEXT,
    ADD COLUMN IF NOT EXISTS contractor_id      TEXT,
    ADD COLUMN IF NOT EXISTS deadline           TEXT,
    ADD COLUMN IF NOT EXISTS priority           TEXT,
    ADD COLUMN IF NOT EXISTS is_encrypted       BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS encryption_key_id  TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_cde_folder ON documents(cde_folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_cde_status ON documents(cde_status);

-- ─────────────────────────────────────────────────────────────────
-- 3. cde_workflow_history
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cde_workflow_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id      INT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    step_name   TEXT NOT NULL,
    step_code   TEXT NOT NULL,
    actor_id    TEXT NOT NULL,
    actor_name  TEXT,
    actor_role  TEXT,
    status      TEXT NOT NULL CHECK (status IN ('Pending','Approved','Rejected','Returned')),
    comment     TEXT DEFAULT '',
    attachments JSONB DEFAULT '[]',
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cde_workflow_doc ON cde_workflow_history(doc_id);

ALTER TABLE cde_workflow_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read cde_workflow_history"
    ON cde_workflow_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert cde_workflow_history"
    ON cde_workflow_history FOR INSERT TO authenticated WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
-- 4. cde_audit_log
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cde_audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   TEXT NOT NULL,
    action      TEXT NOT NULL,
    actor_id    TEXT NOT NULL,
    actor_name  TEXT,
    details     JSONB DEFAULT '{}',
    ip_address  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cde_audit_project ON cde_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_cde_audit_created ON cde_audit_log(created_at DESC);

ALTER TABLE cde_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read cde_audit_log"
    ON cde_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert cde_audit_log"
    ON cde_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
-- 5. cde_transmittals
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cde_transmittals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      TEXT NOT NULL,
    transmittal_no  TEXT NOT NULL,
    subject         TEXT NOT NULL,
    from_org        TEXT,
    from_person     TEXT,
    to_org          TEXT,
    to_person       TEXT,
    cc_list         JSONB DEFAULT '[]',
    doc_ids         JSONB DEFAULT '[]',
    purpose         TEXT,
    notes           TEXT,
    status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','acknowledged','closed')),
    sent_at         TIMESTAMPTZ,
    created_by      TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cde_transmittals_project ON cde_transmittals(project_id);

ALTER TABLE cde_transmittals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read cde_transmittals"
    ON cde_transmittals FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert cde_transmittals"
    ON cde_transmittals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update cde_transmittals"
    ON cde_transmittals FOR UPDATE TO authenticated USING (true);

-- ─────────────────────────────────────────────────────────────────
-- 6. cde_comments
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cde_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id      INT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES cde_comments(id) ON DELETE CASCADE,
    author_id   TEXT NOT NULL,
    author_name TEXT,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cde_comments_doc ON cde_comments(doc_id);

ALTER TABLE cde_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read cde_comments"
    ON cde_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert cde_comments"
    ON cde_comments FOR INSERT TO authenticated WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
-- 7. RLS for cde_folders
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE cde_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read cde_folders"
    ON cde_folders FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert cde_folders"
    ON cde_folders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update cde_folders"
    ON cde_folders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated delete cde_folders"
    ON cde_folders FOR DELETE TO authenticated USING (true);

-- ─────────────────────────────────────────────────────────────────
-- 8. Fix cde_project_stats_view
--    Previous version used folder_id (wrong) and had no rejected count.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW cde_project_stats_view AS
SELECT
    d.project_id,
    COUNT(*)                                                                    AS total,
    COUNT(*) FILTER (WHERE d.iso_status = 'WIP' OR d.iso_status IS NULL)       AS wip,
    COUNT(*) FILTER (WHERE d.iso_status = 'SHARED')                            AS shared,
    COUNT(*) FILTER (WHERE d.iso_status = 'PUBLISHED')                         AS published,
    COUNT(*) FILTER (WHERE d.iso_status = 'ARCHIVED')                          AS archived,
    COUNT(DISTINCT wh.doc_id) FILTER (WHERE wh.status = 'Rejected')            AS rejected
FROM documents d
LEFT JOIN cde_workflow_history wh ON wh.doc_id = d.doc_id
WHERE d.cde_folder_id IS NOT NULL
GROUP BY d.project_id;
