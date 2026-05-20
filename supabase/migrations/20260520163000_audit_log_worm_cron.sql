-- Migration: WORM Audit Logs Backup Configuration
-- Require pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add export tracking to audit_logs
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS is_exported BOOLEAN DEFAULT false;

-- Create an immutable archive table (WORM simulation within DB)
-- In production, this data would be sent to an S3 Object Lock bucket
CREATE TABLE IF NOT EXISTS audit_logs_archive (
    log_id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deny updates/deletes on the archive table to enforce WORM policy
ALTER TABLE audit_logs_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_insert_archive" ON audit_logs_archive FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_select_archive" ON audit_logs_archive FOR SELECT USING (true);
-- Notice: No UPDATE or DELETE policies.

-- Create a function to move old logs to the archive
CREATE OR REPLACE FUNCTION archive_audit_logs()
RETURNS void AS $$
BEGIN
    -- Move logs older than 30 days to archive
    INSERT INTO audit_logs_archive (log_id, action, target_entity, target_id, changed_by, details, timestamp)
    SELECT log_id, action, target_entity, target_id, changed_by, details, timestamp
    FROM audit_logs
    WHERE is_exported = false AND timestamp < now() - interval '30 days';

    -- Mark as exported (we don't delete to maintain operational history, but mark as backed up)
    UPDATE audit_logs
    SET is_exported = true
    WHERE is_exported = false AND timestamp < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cron job to run daily at midnight
-- Note: pg_cron requires appropriate permissions which are available in Supabase
SELECT cron.schedule(
    'archive-audit-logs-daily',
    '0 0 * * *',
    $$SELECT archive_audit_logs()$$
);
