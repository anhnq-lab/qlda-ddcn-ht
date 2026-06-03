-- ============================================================
-- Migration: Audit trigger phía DB cho thay đổi phân quyền (C-4.1)
-- Date: 2026-06-03
--
-- Ghi audit_logs khi INSERT/UPDATE/DELETE trên user_permissions,
-- role_permission_defaults, leadership_assignments.
-- changed_by lấy từ auth.uid() (server-side, KHÔNG tin client) → không giả mạo được.
-- ============================================================

CREATE OR REPLACE FUNCTION public.audit_permission_change()
RETURNS TRIGGER AS $$
DECLARE
  v_target TEXT;
  v_row JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN v_row := to_jsonb(OLD); ELSE v_row := to_jsonb(NEW); END IF;

  v_target := CASE TG_TABLE_NAME
    WHEN 'user_permissions'         THEN COALESCE(v_row->>'user_id', '?')
    WHEN 'role_permission_defaults' THEN COALESCE(v_row->>'role', '?')
    WHEN 'leadership_assignments'   THEN COALESCE(v_row->>'deputy_employee_id', '?')
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.audit_permission_change()
IS 'Ghi audit_logs khi thay đổi phân quyền; changed_by = auth.uid() (không tin client).';

DROP TRIGGER IF EXISTS trg_audit_user_permissions ON public.user_permissions;
CREATE TRIGGER trg_audit_user_permissions
  AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_change();

DROP TRIGGER IF EXISTS trg_audit_role_permission_defaults ON public.role_permission_defaults;
CREATE TRIGGER trg_audit_role_permission_defaults
  AFTER INSERT OR UPDATE OR DELETE ON public.role_permission_defaults
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_change();

DROP TRIGGER IF EXISTS trg_audit_leadership_assignments ON public.leadership_assignments;
CREATE TRIGGER trg_audit_leadership_assignments
  AFTER INSERT OR UPDATE OR DELETE ON public.leadership_assignments
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_change();
