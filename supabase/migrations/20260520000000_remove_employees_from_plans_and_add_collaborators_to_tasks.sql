-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Remove employees from plans, add collaborators to tasks
-- ═══════════════════════════════════════════════════════════════

-- 1. Cập nhật bảng annual_plan_items (Kế hoạch năm)
-- Chỉ giữ lại phòng chủ trì (department_code) và phòng phối hợp.
ALTER TABLE public.annual_plan_items
  DROP COLUMN IF EXISTS responsible_ids,
  DROP COLUMN IF EXISTS collaborating_ids;

-- Thêm cột lưu trữ danh sách các phòng phối hợp (mã phòng ban)
ALTER TABLE public.annual_plan_items
  ADD COLUMN IF NOT EXISTS collaborating_dept_codes VARCHAR(20)[] DEFAULT '{}'::VARCHAR(20)[];

COMMENT ON COLUMN public.annual_plan_items.collaborating_dept_codes IS 'Mảng mã các phòng ban phối hợp thực hiện';

-- 2. Cập nhật bảng monthly_plan_items (Kế hoạch tháng)
-- Chỉ giữ lại phòng phối hợp và phòng chủ trì (phòng chủ trì kế thừa từ monthly_plans)
ALTER TABLE public.monthly_plan_items
  DROP COLUMN IF EXISTS staff_id,
  DROP COLUMN IF EXISTS staff_name,
  DROP COLUMN IF EXISTS staff_ids,
  DROP COLUMN IF EXISTS staff_names,
  DROP COLUMN IF EXISTS executor_ids,
  DROP COLUMN IF EXISTS executor_names,
  DROP COLUMN IF EXISTS dept_head_id,
  DROP COLUMN IF EXISTS dept_head_name,
  DROP COLUMN IF EXISTS ban_head_id,
  DROP COLUMN IF EXISTS ban_head_name;

-- Thêm cột lưu danh sách phòng phối hợp cho kế hoạch tháng
ALTER TABLE public.monthly_plan_items
  ADD COLUMN IF NOT EXISTS collaborating_dept_codes VARCHAR(20)[] DEFAULT '{}'::VARCHAR(20)[],
  ADD COLUMN IF NOT EXISTS collaborating_text TEXT;

COMMENT ON COLUMN public.monthly_plan_items.collaborating_dept_codes IS 'Mảng mã các phòng ban phối hợp thực hiện trong tháng';
COMMENT ON COLUMN public.monthly_plan_items.collaborating_text IS 'Tên hiển thị các phòng ban phối hợp dạng text';

-- 3. Cập nhật bảng tasks (Công việc tác nghiệp thực tế)
-- Thêm danh sách người phối hợp (collaborator_ids) bên cạnh người phụ trách chính (assignee_id)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS collaborator_ids TEXT[] DEFAULT '{}'::TEXT[];

COMMENT ON COLUMN public.tasks.assignee_id IS 'Định danh nhân viên phụ trách chính (assignee/lead)';
COMMENT ON COLUMN public.tasks.collaborator_ids IS 'Mảng định danh các nhân viên phối hợp thực hiện';
