-- ============================================================
-- Migration: Enable RLS and define Policies for view_comments
-- Description: Secures the briefing, monthly report, and evaluation comments
--              so that only project members can view project comments,
--              department members can view department reports,
--              and individuals can view evaluation comments.
-- Created: 2026-05-28
-- ============================================================

-- Enable Row Level Security (RLS) on view_comments
ALTER TABLE public.view_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "view_comments_select" ON public.view_comments;
DROP POLICY IF EXISTS "view_comments_insert" ON public.view_comments;
DROP POLICY IF EXISTS "view_comments_update" ON public.view_comments;
DROP POLICY IF EXISTS "view_comments_delete" ON public.view_comments;

-- 1. SELECT Policy: Controls who can read rows
CREATE POLICY "view_comments_select" ON public.view_comments FOR SELECT
  TO authenticated USING (
    public.is_global_role()
    OR (view_type = 'briefing' AND public.is_project_member(reference_id))
    OR (view_type = 'monthly_report' AND reference_id = public.get_current_employee_department())
    OR (view_type = 'evaluation' AND (
         reference_id = public.get_current_employee_id()
         OR public.is_admin()
    ))
  );

-- 2. INSERT Policy: Controls who can insert new rows
CREATE POLICY "view_comments_insert" ON public.view_comments FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role()
    OR (view_type = 'briefing' AND public.is_project_member(reference_id))
    OR (view_type = 'monthly_report' AND reference_id = public.get_current_employee_department())
    OR (view_type = 'evaluation' AND (
         reference_id = public.get_current_employee_id()
         OR public.is_admin()
    ))
  );

-- 3. UPDATE Policy: Controls who can update existing rows
CREATE POLICY "view_comments_update" ON public.view_comments FOR UPDATE
  TO authenticated USING (
    public.is_global_role()
    OR (view_type = 'briefing' AND public.is_project_member(reference_id))
    OR (view_type = 'monthly_report' AND reference_id = public.get_current_employee_department())
    OR (view_type = 'evaluation' AND (
         reference_id = public.get_current_employee_id()
         OR public.is_admin()
    ))
  ) WITH CHECK (
    public.is_global_role()
    OR (view_type = 'briefing' AND public.is_project_member(reference_id))
    OR (view_type = 'monthly_report' AND reference_id = public.get_current_employee_department())
    OR (view_type = 'evaluation' AND (
         reference_id = public.get_current_employee_id()
         OR public.is_admin()
    ))
  );

-- 4. DELETE Policy: Controls who can delete rows (Only global managers/admins)
CREATE POLICY "view_comments_delete" ON public.view_comments FOR DELETE
  TO authenticated USING (public.is_global_role());
