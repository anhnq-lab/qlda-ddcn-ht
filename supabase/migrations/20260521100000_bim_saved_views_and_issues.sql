-- ───────────────────────────────────────────────────────────────────
-- BIM viewer collaboration surface: saved views + BCF-lite issues.
-- - bim_saved_views: named camera/section/isolation snapshots ("bookmarks")
-- - bim_issues: BCF-style markups attached to a viewpoint and screenshot
-- - bim_issue_comments: threaded comments on an issue
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bim_saved_views (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id    TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    description   TEXT,
    -- Camera state (position, target, up, fov) + section planes + isolated expressIds
    state         JSONB NOT NULL,
    thumbnail_url TEXT,
    created_by    TEXT,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bim_saved_views_project_idx ON bim_saved_views(project_id);

CREATE TABLE IF NOT EXISTS bim_issues (
    id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id     TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    title          TEXT NOT NULL,
    description    TEXT,
    status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
    priority       TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
    -- Same shape as bim_saved_views.state — camera + section + isolation
    viewpoint      JSONB,
    -- Public URL (or storage path) of the screenshot at issue creation
    screenshot_url TEXT,
    -- Optional pointer to a specific element
    target_express_id  INTEGER,
    target_model_id    TEXT,
    assigned_to    TEXT,
    due_date       DATE,
    created_by     TEXT,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now(),
    resolved_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS bim_issues_project_idx ON bim_issues(project_id);
CREATE INDEX IF NOT EXISTS bim_issues_status_idx  ON bim_issues(status);

CREATE TABLE IF NOT EXISTS bim_issue_comments (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id   TEXT NOT NULL REFERENCES bim_issues(id) ON DELETE CASCADE,
    body       TEXT NOT NULL,
    author     TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bim_issue_comments_issue_idx ON bim_issue_comments(issue_id);

-- ── Touch updated_at on update ─────────────────────────────────────
CREATE OR REPLACE FUNCTION bim_collab_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bim_saved_views_touch ON bim_saved_views;
CREATE TRIGGER bim_saved_views_touch
BEFORE UPDATE ON bim_saved_views
FOR EACH ROW EXECUTE FUNCTION bim_collab_touch_updated_at();

DROP TRIGGER IF EXISTS bim_issues_touch ON bim_issues;
CREATE TRIGGER bim_issues_touch
BEFORE UPDATE ON bim_issues
FOR EACH ROW EXECUTE FUNCTION bim_collab_touch_updated_at();

-- ── RLS — authenticated users can read/write everything for now.
--    Tighten per-project once project membership table is wired in.
ALTER TABLE bim_saved_views      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_issues           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_issue_comments   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read bim_saved_views" ON bim_saved_views;
CREATE POLICY "auth read bim_saved_views" ON bim_saved_views FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth write bim_saved_views" ON bim_saved_views;
CREATE POLICY "auth write bim_saved_views" ON bim_saved_views FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth read bim_issues" ON bim_issues;
CREATE POLICY "auth read bim_issues" ON bim_issues FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth write bim_issues" ON bim_issues;
CREATE POLICY "auth write bim_issues" ON bim_issues FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth read bim_issue_comments" ON bim_issue_comments;
CREATE POLICY "auth read bim_issue_comments" ON bim_issue_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth write bim_issue_comments" ON bim_issue_comments;
CREATE POLICY "auth write bim_issue_comments" ON bim_issue_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
