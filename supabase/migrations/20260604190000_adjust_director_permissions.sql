-- Migration: Điều chỉnh quyền mặc định của Ban Giám Đốc (Giám đốc & Phó Giám đốc) thành chỉ Xem (view)
-- Hạn chế quyền ghi (create, update, delete) trên projects, tasks, và site_clearance

-- 1. Cập nhật role_permission_defaults cho director
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('director', 'projects',        '["view"]'::jsonb),
  ('director', 'tasks',           '["view"]'::jsonb),
  ('director', 'site_clearance',  '["view","export"]'::jsonb)
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- 2. Cập nhật role_permission_defaults cho deputy_director
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('deputy_director', 'projects',        '["view"]'::jsonb),
  ('deputy_director', 'tasks',           '["view"]'::jsonb),
  ('deputy_director', 'site_clearance',  '["view","export"]'::jsonb)
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();
