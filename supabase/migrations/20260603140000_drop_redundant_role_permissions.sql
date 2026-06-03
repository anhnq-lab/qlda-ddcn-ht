-- ============================================================
-- Migration: Drop bảng role_permissions trùng lặp (C-3.1)
-- Date: 2026-06-03
--
-- Lý do: Bảng role_permissions (tạo tại 20260514132449) trùng mục đích
-- với role_permission_defaults — bảng đang được code sử dụng thực tế
-- (PermissionContext, PermissionService, RoleDefaultsManager).
-- role_permissions KHÔNG được bất kỳ đoạn code nào đọc/ghi → loại bỏ
-- để tránh nhầm lẫn nguồn sự thật.
-- ============================================================

DROP TRIGGER IF EXISTS trg_role_permissions_updated_at ON public.role_permissions;
DROP TABLE IF EXISTS public.role_permissions;
