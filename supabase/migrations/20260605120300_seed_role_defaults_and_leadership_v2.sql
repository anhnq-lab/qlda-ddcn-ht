-- ============================================================
-- Migration A4: Seed ma trận vai trò (Lớp 1, resource giai đoạn 1)
-- khớp DEFAULT_ROLE_PERMISSIONS (types/permission.types.ts) + phân công lãnh đạo.
-- Chỉ đụng resource giai đoạn 1; resource hoãn (contracts, payments, cde...) giữ nguyên.
-- Date: 2026-06-05
-- ============================================================

INSERT INTO public.role_permission_defaults(role, resource, actions, updated_at) VALUES
  -- director (Giám đốc) — chỉ đạo/duyệt, dự án & công việc chỉ Xem
  ('director','dashboard','["view","export"]'::jsonb, now()),
  ('director','calendar','["view","create","update","delete"]'::jsonb, now()),
  ('director','projects','["view"]'::jsonb, now()),
  ('director','tasks','["view"]'::jsonb, now()),
  ('director','employees','["view"]'::jsonb, now()),
  ('director','legal_docs','["view"]'::jsonb, now()),
  ('director','regulations','["view"]'::jsonb, now()),
  ('director','reports','["view","export"]'::jsonb, now()),
  ('director','workflows','["view"]'::jsonb, now()),
  -- deputy_director (Phó GĐ)
  ('deputy_director','dashboard','["view","export"]'::jsonb, now()),
  ('deputy_director','calendar','["view","create","update","delete"]'::jsonb, now()),
  ('deputy_director','projects','["view"]'::jsonb, now()),
  ('deputy_director','tasks','["view"]'::jsonb, now()),
  ('deputy_director','employees','["view"]'::jsonb, now()),
  ('deputy_director','legal_docs','["view"]'::jsonb, now()),
  ('deputy_director','regulations','["view"]'::jsonb, now()),
  ('deputy_director','reports','["view","export"]'::jsonb, now()),
  ('deputy_director','workflows','["view"]'::jsonb, now()),
  -- chief_accountant (Kế toán trưởng)
  ('chief_accountant','dashboard','["view","export"]'::jsonb, now()),
  ('chief_accountant','calendar','["view"]'::jsonb, now()),
  ('chief_accountant','projects','["view"]'::jsonb, now()),
  ('chief_accountant','tasks','["view"]'::jsonb, now()),
  ('chief_accountant','employees','["view"]'::jsonb, now()),
  ('chief_accountant','legal_docs','["view"]'::jsonb, now()),
  ('chief_accountant','regulations','["view"]'::jsonb, now()),
  ('chief_accountant','reports','["view","export"]'::jsonb, now()),
  ('chief_accountant','workflows','["view"]'::jsonb, now()),
  -- dept_head (Trưởng phòng) — employees/calendar/regulations bị Lớp 2 siết HC-TH
  ('dept_head','dashboard','["view"]'::jsonb, now()),
  ('dept_head','calendar','["view","create","update"]'::jsonb, now()),
  ('dept_head','projects','["view"]'::jsonb, now()),
  ('dept_head','tasks','["view","create","update","delete"]'::jsonb, now()),
  ('dept_head','employees','["view","create","update","delete"]'::jsonb, now()),
  ('dept_head','legal_docs','["view"]'::jsonb, now()),
  ('dept_head','regulations','["view","create","update"]'::jsonb, now()),
  ('dept_head','reports','["view","export"]'::jsonb, now()),
  ('dept_head','workflows','["view","create","update"]'::jsonb, now()),
  -- deputy_head (Phó phòng)
  ('deputy_head','dashboard','["view"]'::jsonb, now()),
  ('deputy_head','calendar','["view","create","update"]'::jsonb, now()),
  ('deputy_head','projects','["view"]'::jsonb, now()),
  ('deputy_head','tasks','["view","create","update"]'::jsonb, now()),
  ('deputy_head','employees','["view"]'::jsonb, now()),
  ('deputy_head','legal_docs','["view"]'::jsonb, now()),
  ('deputy_head','regulations','["view","create","update"]'::jsonb, now()),
  ('deputy_head','reports','["view","export"]'::jsonb, now()),
  ('deputy_head','workflows','["view"]'::jsonb, now()),
  -- specialist (Chuyên viên) — projects.create siết KH-ĐT, update siết thành viên
  ('specialist','dashboard','["view"]'::jsonb, now()),
  ('specialist','calendar','["view"]'::jsonb, now()),
  ('specialist','projects','["view","create","update"]'::jsonb, now()),
  ('specialist','tasks','["view","create","update"]'::jsonb, now()),
  ('specialist','employees','["view"]'::jsonb, now()),
  ('specialist','legal_docs','["view"]'::jsonb, now()),
  ('specialist','regulations','["view","create","update"]'::jsonb, now()),
  ('specialist','reports','["view"]'::jsonb, now()),
  ('specialist','workflows','["view"]'::jsonb, now()),
  -- staff (Hành chính) — projects.update siết thành viên
  ('staff','dashboard','["view"]'::jsonb, now()),
  ('staff','calendar','["view"]'::jsonb, now()),
  ('staff','projects','["view","update"]'::jsonb, now()),
  ('staff','tasks','["view","create","update"]'::jsonb, now()),
  ('staff','employees','["view"]'::jsonb, now()),
  ('staff','legal_docs','["view"]'::jsonb, now()),
  ('staff','regulations','["view","create","update"]'::jsonb, now()),
  ('staff','reports','["view"]'::jsonb, now()),
  ('staff','workflows','["view"]'::jsonb, now())
ON CONFLICT (role, resource) DO UPDATE
  SET actions = EXCLUDED.actions, updated_at = now();

-- Phân công Phó Giám đốc phụ trách Ban (QĐ 07/11/2025 — Mục 4.3 tài liệu)
INSERT INTO public.leadership_assignments(deputy_employee_id, board_number) VALUES
  ('NV003', 1),          -- Trần Ngọc Bảo  → Phòng QLDA 1
  ('NV004', 2),          -- Nguyễn Văn Nhân → Phòng QLDA 2
  ('EMP-0016092', 3)     -- Ngô Đức Quy    → Phòng QLDA 3
ON CONFLICT (deputy_employee_id, board_number) DO NOTHING;
