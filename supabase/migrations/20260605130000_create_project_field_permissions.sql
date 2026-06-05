-- ============================================================
-- Phân quyền cấp TRƯỜNG dự án theo vai trò thành viên dự án
-- Bảng project_field_permissions + RLS + audit.
-- Mặc định: field KHÔNG có dòng can_edit=false → ĐƯỢC sửa (default allow).
-- Date: 2026-06-05
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_field_permissions (
  member_role TEXT NOT NULL,        -- project_members.role
  field_key   TEXT NOT NULL,        -- tên cột bảng projects
  can_edit    BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_role, field_key)
);

ALTER TABLE public.project_field_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pfp_select ON public.project_field_permissions;
CREATE POLICY pfp_select ON public.project_field_permissions
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS pfp_insert ON public.project_field_permissions;
CREATE POLICY pfp_insert ON public.project_field_permissions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS pfp_update ON public.project_field_permissions;
CREATE POLICY pfp_update ON public.project_field_permissions
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS pfp_delete ON public.project_field_permissions;
CREATE POLICY pfp_delete ON public.project_field_permissions
  FOR DELETE TO authenticated USING (public.is_admin());

-- Mở rộng audit cho 2 bảng cấu hình mới (department_permission_rules + project_field_permissions)
CREATE OR REPLACE FUNCTION public.audit_permission_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_target TEXT;
  v_row JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN v_row := to_jsonb(OLD); ELSE v_row := to_jsonb(NEW); END IF;

  v_target := CASE TG_TABLE_NAME
    WHEN 'user_permissions'            THEN COALESCE(v_row->>'user_id', '?')
    WHEN 'role_permission_defaults'    THEN COALESCE(v_row->>'role', '?')
    WHEN 'leadership_assignments'      THEN COALESCE(v_row->>'deputy_employee_id', '?')
    WHEN 'department_permission_rules' THEN COALESCE(v_row->>'resource', '?') || '.' || COALESCE(v_row->>'action', '?')
    WHEN 'project_field_permissions'   THEN COALESCE(v_row->>'member_role', '?') || '.' || COALESCE(v_row->>'field_key', '?')
    ELSE '?'
  END;

  INSERT INTO public.audit_logs(log_id, action, target_entity, target_id, changed_by, details, "timestamp")
  VALUES (
    gen_random_uuid()::text,
    'permission_' || lower(TG_OP),
    TG_TABLE_NAME,
    v_target,
    COALESCE(NULLIF(auth.uid()::text, ''), 'system'),
    jsonb_build_object(
      'op', TG_OP,
      'old', CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    )::text,
    now()
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

DROP TRIGGER IF EXISTS trg_audit_project_field_perms ON public.project_field_permissions;
CREATE TRIGGER trg_audit_project_field_perms
  AFTER INSERT OR UPDATE OR DELETE ON public.project_field_permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_change();
