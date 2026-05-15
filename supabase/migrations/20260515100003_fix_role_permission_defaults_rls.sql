-- Fix RLS policy sai trên bảng role_permission_defaults
-- Lỗi cũ: check e.employee_id = auth.uid() — sai vì auth.uid() là UUID của auth.users, không phải text employee_id
-- Fix: JOIN qua user_accounts để lấy đúng nhân viên

DROP POLICY IF EXISTS "Chỉ super_admin được phép sửa role_permission_defaults"
  ON public.role_permission_defaults;

CREATE POLICY "super_admin_manage_role_defaults"
  ON public.role_permission_defaults
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.user_accounts ua ON ua.employee_id = e.employee_id
      WHERE ua.auth_user_id = auth.uid()
        AND e.role = 'Admin'
        AND e.status = 1
    )
  );
