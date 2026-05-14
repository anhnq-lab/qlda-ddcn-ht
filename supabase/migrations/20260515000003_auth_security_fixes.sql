-- B1: Thêm cột auth_user_id
ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_user_accounts_auth_user_id
  ON public.user_accounts(auth_user_id);

-- B2: Tạo RPC resolve_user_identity
CREATE OR REPLACE FUNCTION public.resolve_user_identity(p_identifier TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Match username
  SELECT e.email INTO v_email
  FROM public.user_accounts ua
  JOIN public.employees e ON ua.employee_id = e.employee_id
  WHERE ua.username = p_identifier AND ua.is_active = true
  LIMIT 1;
  IF v_email IS NOT NULL THEN RETURN v_email; END IF;

  -- Match email trực tiếp
  IF p_identifier LIKE '%@%' THEN RETURN p_identifier; END IF;

  -- Match phone
  SELECT e.email INTO v_email
  FROM public.employees e
  WHERE e.phone = p_identifier
  LIMIT 1;

  RETURN v_email;
END;
$$;

-- B3: Tạo RPC get_user_profile_by_auth_id
CREATE OR REPLACE FUNCTION public.get_user_profile_by_auth_id(p_auth_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Employee
  SELECT json_build_object(
    'user_type',    'employee',
    'account_id',   ua.account_id,
    'employee_id',  ua.employee_id,
    'username',     ua.username,
    'is_active',    ua.is_active,
    'full_name',    e.full_name,
    'email',        e.email,
    'phone',        e.phone,
    'department',   e.department,
    'role',         e.role,
    'position',     e.position,
    'avatar_url',   e.avatar_url
  ) INTO v_result
  FROM public.user_accounts ua
  JOIN public.employees e ON ua.employee_id = e.employee_id
  WHERE ua.auth_user_id = p_auth_user_id AND ua.is_active = true;

  IF v_result IS NOT NULL THEN RETURN v_result; END IF;

  -- Contractor
  SELECT json_build_object(
    'user_type',            'contractor',
    'account_id',           ca.account_id,
    'contractor_id',        ca.contractor_id,
    'username',             ca.username,
    'display_name',         ca.display_name,
    'is_active',            ca.is_active,
    'allowed_project_ids',  ca.allowed_project_ids
  ) INTO v_result
  FROM public.contractor_accounts ca
  WHERE ca.auth_user_id = p_auth_user_id AND ca.is_active = true;

  RETURN v_result;
END;
$$;
