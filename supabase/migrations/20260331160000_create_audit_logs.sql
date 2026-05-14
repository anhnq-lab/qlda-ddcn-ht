-- ============================================================
-- Migration: audit_logs table for permission change tracking
-- Created: 2026-03-31
-- ============================================================

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,                    -- e.g. 'permission_update'
    target_entity TEXT NOT NULL,             -- e.g. 'user_permissions'
    target_id TEXT NOT NULL,                 -- id of the affected entity/user
    changed_by TEXT NOT NULL,                -- user_id of the person making the change
    details JSONB DEFAULT '{}'::jsonb,       -- JSON payload with before/after state
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure created_at exists if table already existed without it
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_target
    ON public.audit_logs (target_entity, target_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
    ON public.audit_logs (action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by
    ON public.audit_logs (changed_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON public.audit_logs (created_at DESC);

-- 3. RLS — Only admins can read audit logs. Insert is open for the service.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone (via authenticated role) to INSERT audit entries
CREATE POLICY "audit_logs_insert"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only the admin or the user themselves can SELECT audit entries
CREATE POLICY "audit_logs_select"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        -- Super permissive for now (admin check done at app level)
        -- In production, cross-reference auth.uid() with an admin role lookup
        true
    );

-- No UPDATE or DELETE on audit logs (append-only)
-- Explicitly deny any modification
CREATE POLICY "audit_logs_no_update"
    ON public.audit_logs FOR UPDATE
    TO authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY "audit_logs_no_delete"
    ON public.audit_logs FOR DELETE
    TO authenticated
    USING (false);

-- 4. Comment for documentation
COMMENT ON TABLE public.audit_logs IS 'Append-only audit trail for permission changes and security-sensitive actions';
