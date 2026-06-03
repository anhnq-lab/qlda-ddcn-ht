-- Migration: Update task permissions for staff role (allow create and update)
-- Date: 2026-06-02

UPDATE public.role_permission_defaults
SET actions = '["view", "create", "update"]'::jsonb
WHERE role = 'staff' AND resource = 'tasks';
