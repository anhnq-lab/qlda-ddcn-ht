-- C1.1: Xóa cột current_password
ALTER TABLE public.contractor_accounts DROP COLUMN IF EXISTS current_password;
