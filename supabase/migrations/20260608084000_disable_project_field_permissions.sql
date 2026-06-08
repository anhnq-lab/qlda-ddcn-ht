-- ============================================================
-- Migration: Disable project field-level permissions trigger
-- Target: Remove enforcement of field-level permissions on projects
-- Date: 2026-06-08
-- ============================================================

DROP TRIGGER IF EXISTS trg_enforce_project_field_perms ON public.projects;
DROP FUNCTION IF EXISTS public.enforce_project_field_permissions();
