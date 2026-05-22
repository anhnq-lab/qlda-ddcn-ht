-- Per-project BIM viewer settings. Currently used to share the coordination
-- offset (computed from the first loaded model with absolute survey coords)
-- so that all clients align discipline models to the same local origin.
-- Previously this lived in browser LocalStorage, which meant each device had
-- to recompute the offset from scratch — and could pick a different one when
-- the loading order differed.

CREATE TABLE IF NOT EXISTS bim_project_settings (
    project_id TEXT PRIMARY KEY REFERENCES projects(project_id) ON DELETE CASCADE,
    coord_offset JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION bim_project_settings_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bim_project_settings_touch_updated_at ON bim_project_settings;
CREATE TRIGGER bim_project_settings_touch_updated_at
BEFORE UPDATE ON bim_project_settings
FOR EACH ROW EXECUTE FUNCTION bim_project_settings_touch_updated_at();

ALTER TABLE bim_project_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to read bim_project_settings" ON bim_project_settings;
CREATE POLICY "Allow authenticated to read bim_project_settings"
ON bim_project_settings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated to upsert bim_project_settings" ON bim_project_settings;
CREATE POLICY "Allow authenticated to upsert bim_project_settings"
ON bim_project_settings FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to update bim_project_settings" ON bim_project_settings;
CREATE POLICY "Allow authenticated to update bim_project_settings"
ON bim_project_settings FOR UPDATE
TO authenticated
USING (true);
