-- Tạo bảng cde_permissions — phân quyền CDE cho nhà thầu theo dự án
-- Theo ISO 19650 §5.1: viewer | contributor | reviewer | approver | admin

CREATE TABLE IF NOT EXISTS public.cde_permissions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   TEXT NOT NULL,
  account_id   UUID NOT NULL REFERENCES public.contractor_accounts(account_id) ON DELETE CASCADE,
  cde_role     TEXT NOT NULL CHECK (cde_role IN ('viewer', 'contributor', 'reviewer', 'approver', 'admin')),
  granted_by   TEXT REFERENCES public.employees(employee_id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(project_id, account_id)
);

ALTER TABLE public.cde_permissions ENABLE ROW LEVEL SECURITY;

-- Contractor đọc quyền CDE của chính mình
CREATE POLICY "cde_perm_self_read"
  ON public.cde_permissions
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.contractor_accounts
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admin và Manager (dept_head) quản lý CDE permissions
CREATE POLICY "cde_perm_admin_manage"
  ON public.cde_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.user_accounts ua ON ua.employee_id = e.employee_id
      WHERE ua.auth_user_id = auth.uid()
        AND e.role IN ('Admin', 'Manager')
        AND e.status = 1
    )
  );

CREATE INDEX IF NOT EXISTS idx_cde_permissions_project_id
  ON public.cde_permissions(project_id);

CREATE INDEX IF NOT EXISTS idx_cde_permissions_account_id
  ON public.cde_permissions(account_id);

DROP TRIGGER IF EXISTS set_cde_permissions_updated_at ON public.cde_permissions;
CREATE TRIGGER set_cde_permissions_updated_at
  BEFORE UPDATE ON public.cde_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.cde_permissions IS
  'Quyền truy cập CDE của nhà thầu theo dự án. cde_role: viewer (chỉ xem) | contributor (upload WIP) | reviewer (WIP+SHARED) | approver (duyệt) | admin (toàn quyền CDE).';
