-- ============================================================
-- Migration: 20260514_fix_audit_logs_rls.sql
-- Fix:
--   1. audit_logs SELECT — còn policy cũ USING(true) từ 20260331
--   2. task_comments / task_activities SELECT — tighten từ USING(true)
--      sang chỉ xem task mà mình có quyền
-- ============================================================

-- ── 1. FIX audit_logs ────────────────────────────────────────
-- Đảm bảo bảng audit_logs và cột created_at tồn tại (để sửa lỗi missing column)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE IF EXISTS public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Xóa cả hai policy cũ (an toàn nếu một trong hai không tồn tại)
DROP POLICY IF EXISTS "audit_logs_select"             ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_admin"       ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_admin_only"  ON public.audit_logs;

-- Chỉ Admin đọc được audit logs
CREATE POLICY "audit_logs_select_admin_only"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- INSERT vẫn mở cho authenticated (để app ghi log)
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Append-only — không cho UPDATE/DELETE
DROP POLICY IF EXISTS "audit_logs_no_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.audit_logs;
CREATE POLICY "audit_logs_no_update"
    ON public.audit_logs FOR UPDATE
    TO authenticated
    USING (false) WITH CHECK (false);

CREATE POLICY "audit_logs_no_delete"
    ON public.audit_logs FOR DELETE
    TO authenticated
    USING (false);

-- ── 2. TIGHTEN task_comments ─────────────────────────────────
-- Hiện tại USING(true) → mọi user đọc được mọi comment
-- Fix: chỉ đọc comment của task mà mình có quyền xem
DROP POLICY IF EXISTS "task_comments_select" ON public.task_comments;

CREATE POLICY "task_comments_select"
    ON public.task_comments FOR SELECT
    TO authenticated
    USING (
        -- Global roles (Ban điều hành) xem được tất cả
        public.is_global_role()
        OR
        -- Project member xem được comment của task trong project của mình
        EXISTS (
            SELECT 1
            FROM public.tasks t
            WHERE t.id = task_comments.task_id
              AND public.is_project_member(t.project_id)
        )
        OR
        -- Chủ sở hữu comment tự xem được
        auth.uid() = user_id
    );

-- ── 3. TIGHTEN task_activities ───────────────────────────────
-- Tương tự task_comments — activity log cũng cần scope
DROP POLICY IF EXISTS "task_activities_select" ON public.task_activities;

CREATE POLICY "task_activities_select"
    ON public.task_activities FOR SELECT
    TO authenticated
    USING (
        public.is_global_role()
        OR
        EXISTS (
            SELECT 1
            FROM public.tasks t
            WHERE t.id = task_activities.task_id
              AND public.is_project_member(t.project_id)
        )
    );

-- task_activities INSERT: tighten từ USING(true) sang chỉ project member
DROP POLICY IF EXISTS "task_activities_insert" ON public.task_activities;

CREATE POLICY "task_activities_insert"
    ON public.task_activities FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_global_role()
        OR
        EXISTS (
            SELECT 1
            FROM public.tasks t
            WHERE t.id = task_activities.task_id
              AND public.is_project_member(t.project_id)
        )
    );

-- ── 4. COMMENT ───────────────────────────────────────────────
COMMENT ON POLICY "audit_logs_select_admin_only" ON public.audit_logs
    IS 'Only admin employees can read audit logs. Applied: 2026-05-14';

COMMENT ON POLICY "task_comments_select" ON public.task_comments
    IS 'Project-scoped: global roles or project members can read comments. Applied: 2026-05-14';
