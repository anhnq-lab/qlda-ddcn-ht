-- Seed đầy đủ role_permission_defaults cho 9 system roles
-- Dựa theo DEFAULT_ROLE_PERMISSIONS trong types/permission.types.ts
-- Idempotent: ON CONFLICT DO UPDATE để có thể chạy lại an toàn

-- ── super_admin ──
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('super_admin', 'dashboard',       '["view","export"]'),
  ('super_admin', 'projects',        '["view","create","update","delete"]'),
  ('super_admin', 'tasks',           '["view","create","update","delete"]'),
  ('super_admin', 'employees',       '["view","create","update","delete"]'),
  ('super_admin', 'contractors',     '["view","create","update"]'),
  ('super_admin', 'bidding',         '["view","create","update","delete","approve","export"]'),
  ('super_admin', 'contracts',       '["view","create","update","delete","approve"]'),
  ('super_admin', 'payments',        '["view","create","update","delete","approve"]'),
  ('super_admin', 'capital',         '["view","create","update","delete","approve","export"]'),
  ('super_admin', 'documents',       '["view","create","update","delete"]'),
  ('super_admin', 'cde',             '["view","create","update","delete","approve"]'),
  ('super_admin', 'bim',             '["view","create","update","delete"]'),
  ('super_admin', 'legal_docs',      '["view"]'),
  ('super_admin', 'reports',         '["view","export"]'),
  ('super_admin', 'regulations',     '["view"]'),
  ('super_admin', 'workflows',       '["view","create","update","delete"]'),
  ('super_admin', 'admin_accounts',  '["view","create","update","delete"]'),
  ('super_admin', 'admin_roles',     '["view","create","update","delete"]'),
  ('super_admin', 'admin_audit',     '["view"]'),
  ('super_admin', 'calendar',        '["view","create","update","delete"]'),
  ('super_admin', 'site_clearance',  '["view","create","update","delete","export"]')
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- ── director ──
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('director', 'dashboard',       '["view","export"]'),
  ('director', 'projects',        '["view","create","update","delete"]'),
  ('director', 'tasks',           '["view","create","update"]'),
  ('director', 'employees',       '["view"]'),
  ('director', 'contractors',     '["view"]'),
  ('director', 'bidding',         '["view","approve"]'),
  ('director', 'contracts',       '["view","approve"]'),
  ('director', 'payments',        '["view","approve"]'),
  ('director', 'capital',         '["view","approve","export"]'),
  ('director', 'documents',       '["view"]'),
  ('director', 'cde',             '["view","approve"]'),
  ('director', 'bim',             '["view"]'),
  ('director', 'legal_docs',      '["view"]'),
  ('director', 'reports',         '["view","export"]'),
  ('director', 'regulations',     '["view"]'),
  ('director', 'workflows',       '["view"]'),
  ('director', 'admin_accounts',  '["view"]'),
  ('director', 'admin_audit',     '["view"]'),
  ('director', 'calendar',        '["view","create","update","delete"]'),
  ('director', 'site_clearance',  '["view","update","approve","export"]')
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- ── deputy_director ──
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('deputy_director', 'dashboard',       '["view","export"]'),
  ('deputy_director', 'projects',        '["view","create","update","delete"]'),
  ('deputy_director', 'tasks',           '["view","create","update"]'),
  ('deputy_director', 'employees',       '["view"]'),
  ('deputy_director', 'contractors',     '["view"]'),
  ('deputy_director', 'bidding',         '["view","approve"]'),
  ('deputy_director', 'contracts',       '["view","approve"]'),
  ('deputy_director', 'payments',        '["view","approve"]'),
  ('deputy_director', 'capital',         '["view","approve","export"]'),
  ('deputy_director', 'documents',       '["view"]'),
  ('deputy_director', 'cde',             '["view","approve"]'),
  ('deputy_director', 'bim',             '["view"]'),
  ('deputy_director', 'legal_docs',      '["view"]'),
  ('deputy_director', 'reports',         '["view","export"]'),
  ('deputy_director', 'regulations',     '["view"]'),
  ('deputy_director', 'workflows',       '["view"]'),
  ('deputy_director', 'admin_accounts',  '["view"]'),
  ('deputy_director', 'calendar',        '["view","create","update","delete"]'),
  ('deputy_director', 'site_clearance',  '["view","update","approve","export"]')
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- ── chief_accountant ──
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('chief_accountant', 'dashboard',      '["view","export"]'),
  ('chief_accountant', 'projects',       '["view"]'),
  ('chief_accountant', 'tasks',          '["view"]'),
  ('chief_accountant', 'employees',      '["view"]'),
  ('chief_accountant', 'contractors',    '["view"]'),
  ('chief_accountant', 'bidding',        '["view"]'),
  ('chief_accountant', 'contracts',      '["view"]'),
  ('chief_accountant', 'payments',       '["view","create","update","delete","approve"]'),
  ('chief_accountant', 'capital',        '["view","create","update","approve","export"]'),
  ('chief_accountant', 'documents',      '["view"]'),
  ('chief_accountant', 'cde',            '["view"]'),
  ('chief_accountant', 'bim',            '["view"]'),
  ('chief_accountant', 'legal_docs',     '["view"]'),
  ('chief_accountant', 'reports',        '["view","export"]'),
  ('chief_accountant', 'regulations',    '["view"]'),
  ('chief_accountant', 'workflows',      '["view"]'),
  ('chief_accountant', 'admin_accounts', '["view"]'),
  ('chief_accountant', 'calendar',       '["view"]'),
  ('chief_accountant', 'site_clearance', '["view"]')
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- ── dept_head ──
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('dept_head', 'dashboard',      '["view"]'),
  ('dept_head', 'projects',       '["view","create","update"]'),
  ('dept_head', 'tasks',          '["view","create","update","delete"]'),
  ('dept_head', 'employees',      '["view"]'),
  ('dept_head', 'contractors',    '["view","create","update"]'),
  ('dept_head', 'bidding',        '["view","create","update","export"]'),
  ('dept_head', 'contracts',      '["view","create","update"]'),
  ('dept_head', 'payments',       '["view","create","update"]'),
  ('dept_head', 'capital',        '["view","create","update"]'),
  ('dept_head', 'documents',      '["view","create","update","delete"]'),
  ('dept_head', 'cde',            '["view","create","update","approve"]'),
  ('dept_head', 'bim',            '["view","create","update"]'),
  ('dept_head', 'legal_docs',     '["view"]'),
  ('dept_head', 'reports',        '["view","export"]'),
  ('dept_head', 'regulations',    '["view"]'),
  ('dept_head', 'workflows',      '["view","create","update"]'),
  ('dept_head', 'calendar',       '["view","create"]'),
  ('dept_head', 'site_clearance', '["view","create","update"]')
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- ── deputy_head ──
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('deputy_head', 'dashboard',      '["view"]'),
  ('deputy_head', 'projects',       '["view","update"]'),
  ('deputy_head', 'tasks',          '["view","create","update"]'),
  ('deputy_head', 'employees',      '["view"]'),
  ('deputy_head', 'contractors',    '["view","create","update"]'),
  ('deputy_head', 'bidding',        '["view","create","update"]'),
  ('deputy_head', 'contracts',      '["view","create","update"]'),
  ('deputy_head', 'payments',       '["view","create","update"]'),
  ('deputy_head', 'capital',        '["view","create","update"]'),
  ('deputy_head', 'documents',      '["view","create","update"]'),
  ('deputy_head', 'cde',            '["view","create","update"]'),
  ('deputy_head', 'bim',            '["view","create","update"]'),
  ('deputy_head', 'legal_docs',     '["view"]'),
  ('deputy_head', 'reports',        '["view","export"]'),
  ('deputy_head', 'regulations',    '["view"]'),
  ('deputy_head', 'workflows',      '["view"]'),
  ('deputy_head', 'calendar',       '["view","create"]'),
  ('deputy_head', 'site_clearance', '["view","create","update"]')
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- ── specialist ──
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('specialist', 'dashboard',      '["view"]'),
  ('specialist', 'projects',       '["view","create","update"]'),
  ('specialist', 'tasks',          '["view","create","update"]'),
  ('specialist', 'employees',      '["view"]'),
  ('specialist', 'contractors',    '["view","create","update"]'),
  ('specialist', 'bidding',        '["view","create","update"]'),
  ('specialist', 'contracts',      '["view","create","update"]'),
  ('specialist', 'payments',       '["view","create"]'),
  ('specialist', 'capital',        '["view"]'),
  ('specialist', 'documents',      '["view","create","update"]'),
  ('specialist', 'cde',            '["view","create","update"]'),
  ('specialist', 'bim',            '["view","create","update"]'),
  ('specialist', 'legal_docs',     '["view"]'),
  ('specialist', 'reports',        '["view"]'),
  ('specialist', 'regulations',    '["view"]'),
  ('specialist', 'workflows',      '["view"]'),
  ('specialist', 'calendar',       '["view"]'),
  ('specialist', 'site_clearance', '["view","create","update"]')
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- ── staff (Nhân viên Hành chính) ──
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('staff', 'dashboard',      '["view"]'),
  ('staff', 'projects',       '["view"]'),
  ('staff', 'tasks',          '["view"]'),
  ('staff', 'employees',      '["view"]'),
  ('staff', 'contractors',    '["view"]'),
  ('staff', 'bidding',        '["view"]'),
  ('staff', 'contracts',      '["view"]'),
  ('staff', 'payments',       '["view"]'),
  ('staff', 'capital',        '["view"]'),
  ('staff', 'documents',      '["view","create"]'),
  ('staff', 'cde',            '["view"]'),
  ('staff', 'bim',            '["view"]'),
  ('staff', 'legal_docs',     '["view"]'),
  ('staff', 'reports',        '["view"]'),
  ('staff', 'regulations',    '["view"]'),
  ('staff', 'workflows',      '["view"]'),
  ('staff', 'calendar',       '["view"]'),
  ('staff', 'site_clearance', '["view"]')
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- ── contractor ──
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('contractor', 'projects',   '["view"]'),
  ('contractor', 'contracts',  '["view"]'),
  ('contractor', 'payments',   '["view"]'),
  ('contractor', 'cde',        '["view","create"]')
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();
