-- ============================================================
-- Migration: leadership_assignments (phân công phụ trách cho Phó GĐ)
-- Date: 2026-06-03
--
-- Mục tiêu (C-1.4 trong authorization_specification.md):
--   Phó Giám đốc KHÔNG còn Global Scope. Mỗi PGĐ chỉ phụ trách một số
--   Ban QLDA (management_board) nhất định và chỉ thấy dự án thuộc các
--   Ban đó. Bảng này là NGUỒN SỰ THẬT cho phân công — thay cho cách suy
--   theo vị trí mảng (pgds[0..2]) trong OrgChartPage.tsx.
--
--   Granularity = board_number (1..5) vì dự án được scope qua
--   projects.management_board. Sơ đồ tổ chức và phân quyền cùng đọc bảng này.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leadership_assignments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deputy_employee_id TEXT NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    board_number       INTEGER NOT NULL,          -- Ban QLDA mà PGĐ phụ trách (1..5)
    created_by         TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (deputy_employee_id, board_number)
);

COMMENT ON TABLE  public.leadership_assignments IS 'Phân công Ban QLDA mà mỗi Phó Giám đốc phụ trách. Nguồn sự thật cho scope dữ liệu của deputy_director.';
COMMENT ON COLUMN public.leadership_assignments.board_number IS 'Số Ban QLDA (projects.management_board) mà PGĐ này phụ trách.';

CREATE INDEX IF NOT EXISTS idx_leadership_assignments_deputy
  ON public.leadership_assignments(deputy_employee_id);

-- ── RLS: mọi authenticated đọc (UI dropdown + helper), chỉ admin ghi ──
ALTER TABLE public.leadership_assignments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pname TEXT;
BEGIN
  FOR pname IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'public' AND tablename = 'leadership_assignments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.leadership_assignments', pname);
  END LOOP;
END $$;

CREATE POLICY "leadership_assignments_select" ON public.leadership_assignments
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "leadership_assignments_insert" ON public.leadership_assignments
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "leadership_assignments_update" ON public.leadership_assignments
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "leadership_assignments_delete" ON public.leadership_assignments
  FOR DELETE TO authenticated USING (public.is_admin());

-- Trigger updated_at (tái dùng hàm có sẵn từ role_permission_defaults)
DROP TRIGGER IF EXISTS set_updated_at_leadership ON public.leadership_assignments;
CREATE TRIGGER set_updated_at_leadership
  BEFORE UPDATE ON public.leadership_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Helper functions — SẴN cho việc gắn vào RLS ở Giai đoạn 1 (DB enforce).
-- Hiện chưa gắn vào policy bảng nghiệp vụ để tránh thay đổi đột ngột.
-- ============================================================

-- Trả về mảng board_number mà người dùng hiện tại (nếu là PGĐ) phụ trách.
CREATE OR REPLACE FUNCTION public.get_current_deputy_managed_boards()
RETURNS INTEGER[] AS $$
  SELECT COALESCE(ARRAY_AGG(la.board_number), ARRAY[]::INTEGER[])
  FROM public.leadership_assignments la
  JOIN public.employees e      ON e.employee_id = la.deputy_employee_id
  JOIN public.user_accounts ua ON ua.employee_id = e.employee_id
  WHERE ua.auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_current_deputy_managed_boards()
IS 'Mảng Ban QLDA mà PGĐ hiện tại phụ trách (rỗng nếu không phải PGĐ hoặc chưa được phân công).';

-- Kiểm tra một dự án có thuộc Ban QLDA mà PGĐ hiện tại phụ trách không.
CREATE OR REPLACE FUNCTION public.is_project_managed_by_current_deputy(p_project_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.project_id = p_project_id
      AND p.management_board::TEXT = ANY (
        SELECT b::TEXT FROM unnest(public.get_current_deputy_managed_boards()) AS b
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_project_managed_by_current_deputy(TEXT)
IS 'TRUE nếu dự án thuộc một Ban QLDA mà PGĐ hiện tại phụ trách. Dùng cho RLS scope của deputy_director.';
