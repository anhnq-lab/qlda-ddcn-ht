-- Thêm cột system_role vào bảng employees
-- Cho phép Admin gán thủ công vai trò hệ thống, bypass tính toán tự động từ position
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS system_role TEXT DEFAULT NULL;

-- Index để tăng tốc query lọc theo system_role
CREATE INDEX IF NOT EXISTS idx_employees_system_role
  ON public.employees(system_role) WHERE system_role IS NOT NULL;

COMMENT ON COLUMN public.employees.system_role IS
  'Manual override cho system role (super_admin|director|deputy_director|chief_accountant|dept_head|deputy_head|specialist|staff|contractor). NULL = tính tự động từ position/department.';
