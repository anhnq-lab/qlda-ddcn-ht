-- ============================================================
-- Migration A1: Lớp 2 — Giới hạn quyền theo phòng ban
-- Bảng department_permission_rules + RLS + audit + seed.
-- Khi có rule cho (resource, action): chỉ user thuộc allowed_departments
-- mới được thực hiện — trừ vai trò lãnh đạo (toàn cục) bypass (xử lý ở dept_rule_allows).
-- Date: 2026-06-05
-- ============================================================

CREATE TABLE IF NOT EXISTS public.department_permission_rules (
  resource            TEXT NOT NULL,
  action              TEXT NOT NULL,
  allowed_departments TEXT[] NOT NULL DEFAULT '{}',
  note                TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (resource, action)
);

ALTER TABLE public.department_permission_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dpr_select ON public.department_permission_rules;
CREATE POLICY dpr_select ON public.department_permission_rules
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS dpr_insert ON public.department_permission_rules;
CREATE POLICY dpr_insert ON public.department_permission_rules
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS dpr_update ON public.department_permission_rules;
CREATE POLICY dpr_update ON public.department_permission_rules
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS dpr_delete ON public.department_permission_rules;
CREATE POLICY dpr_delete ON public.department_permission_rules
  FOR DELETE TO authenticated USING (public.is_admin());

-- Mở rộng hàm audit để ghi nhận bảng mới (target = resource.action)
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

DROP TRIGGER IF EXISTS trg_audit_dept_rules ON public.department_permission_rules;
CREATE TRIGGER trg_audit_dept_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.department_permission_rules
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_change();

-- Seed rule theo tài liệu phan_quyen_theo_module.md (Mục 3.2/3.3/3.5/3.6)
INSERT INTO public.department_permission_rules(resource, action, allowed_departments, note) VALUES
  ('projects',    'create', ARRAY['Phòng Kế hoạch – Đấu thầu'],   'Chỉ Chuyên viên phòng KH-ĐT được tạo dự án (Mục 3.3)'),
  ('employees',   'create', ARRAY['Phòng Hành chính – Tổng hợp'], 'Chỉ Trưởng phòng HC-TH (Mục 3.5)'),
  ('employees',   'update', ARRAY['Phòng Hành chính – Tổng hợp'], 'Chỉ Trưởng phòng HC-TH (Mục 3.5)'),
  ('employees',   'delete', ARRAY['Phòng Hành chính – Tổng hợp'], 'Chỉ Trưởng phòng HC-TH (Mục 3.5)'),
  ('calendar',    'create', ARRAY['Phòng Hành chính – Tổng hợp'], 'HC-TH chủ trì lịch cơ quan (Mục 3.2)'),
  ('calendar',    'update', ARRAY['Phòng Hành chính – Tổng hợp'], 'HC-TH chủ trì lịch cơ quan (Mục 3.2)'),
  ('regulations', 'create', ARRAY['Phòng Hành chính – Tổng hợp'], 'HC-TH soạn quy chế (Mục 3.6)'),
  ('regulations', 'update', ARRAY['Phòng Hành chính – Tổng hợp'], 'HC-TH soạn quy chế (Mục 3.6)')
ON CONFLICT (resource, action) DO UPDATE
  SET allowed_departments = EXCLUDED.allowed_departments, note = EXCLUDED.note, updated_at = now();
