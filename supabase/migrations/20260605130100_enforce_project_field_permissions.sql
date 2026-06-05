-- ============================================================
-- Trigger BEFORE UPDATE projects: chặn sửa TRƯỜNG mà vai trò thành viên
-- dự án không được phép (project_field_permissions.can_edit = false).
-- super_admin bỏ qua. Người không phải thành viên đã bị RLS chặn ở chỗ khác.
-- Date: 2026-06-05
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_project_field_permissions()
RETURNS trigger AS $$
DECLARE
  v_role TEXT;
  old_j JSONB;
  new_j JSONB;
  r RECORD;
BEGIN
  -- Admin toàn quyền
  IF public.is_admin() THEN RETURN NEW; END IF;

  -- Vai trò của người gọi trong CHÍNH dự án này
  SELECT pm.role INTO v_role
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id
    AND pm.employee_id = public.get_current_employee_id()
  LIMIT 1;

  -- Không phải thành viên → không xử ở đây (RLS membership đã kiểm soát)
  IF v_role IS NULL THEN RETURN NEW; END IF;

  -- Chuẩn hoá alias tên vai trò cũ (dữ liệu seed) → tên chuẩn của form
  IF v_role = 'Kế toán phụ trách' THEN v_role := 'Kế toán dự án'; END IF;

  old_j := to_jsonb(OLD);
  new_j := to_jsonb(NEW);

  FOR r IN
    SELECT field_key FROM public.project_field_permissions
    WHERE member_role = v_role AND can_edit = false
  LOOP
    IF (old_j ->> r.field_key) IS DISTINCT FROM (new_j ->> r.field_key) THEN
      RAISE EXCEPTION 'Vai trò "%" không có quyền sửa trường "%" của dự án', v_role, r.field_key
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_project_field_perms ON public.projects;
CREATE TRIGGER trg_enforce_project_field_perms
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_field_permissions();
