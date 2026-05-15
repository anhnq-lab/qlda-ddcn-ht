-- Tạo bảng contractor_accounts — tài khoản đăng nhập của nhà thầu
-- Bảng này được tham chiếu bởi RPC get_user_profile_by_auth_id và các RLS policy

CREATE TABLE IF NOT EXISTS public.contractor_accounts (
  account_id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id       TEXT REFERENCES public.contractors(contractor_id) ON DELETE SET NULL,
  username            TEXT NOT NULL UNIQUE,
  display_name        TEXT,
  is_active           BOOLEAN DEFAULT true NOT NULL,
  allowed_project_ids TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.contractor_accounts ENABLE ROW LEVEL SECURITY;

-- Contractor chỉ đọc được record của chính mình
CREATE POLICY "contractor_self_read"
  ON public.contractor_accounts
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Admin (role = 'Admin') có toàn quyền quản lý
CREATE POLICY "admin_full_access"
  ON public.contractor_accounts
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

-- Index tìm kiếm nhanh theo auth_user_id
CREATE INDEX IF NOT EXISTS idx_contractor_accounts_auth_user_id
  ON public.contractor_accounts(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_contractor_accounts_contractor_id
  ON public.contractor_accounts(contractor_id);

-- Trigger auto-update updated_at
DROP TRIGGER IF EXISTS set_contractor_accounts_updated_at ON public.contractor_accounts;
CREATE TRIGGER set_contractor_accounts_updated_at
  BEFORE UPDATE ON public.contractor_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
