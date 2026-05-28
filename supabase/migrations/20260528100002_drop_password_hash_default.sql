-- ============================================================
-- Migration: 20260528100002_drop_password_hash_default.sql
-- P0-2: Remove the insecure DEFAULT '123456' from user_accounts.password_hash.
--       All active accounts MUST have auth_user_id set (Supabase Auth).
--       The password_hash column is kept for backward compat during transition
--       but the default value is a security hazard if any code path inserts
--       without providing one explicitly.
--
-- NOTE: password_hash column itself will be dropped in a future migration once
--       we confirm 100% of user_accounts rows have auth_user_id populated.
--       See: T5 in auth-security-plan (Sprint 1).
-- ============================================================

-- Remove the hardcoded '123456' default — require explicit value on insert
ALTER TABLE public.user_accounts
  ALTER COLUMN password_hash DROP DEFAULT;

-- Ensure no account has the old default hash value still set.
-- SHA-256('123456') = 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
-- If any rows still have it, they MUST be updated via admin password reset.
DO $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM public.user_accounts
  WHERE password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
     OR password_hash = '123456';
  IF cnt > 0 THEN
    RAISE WARNING 'Found % account(s) with default/insecure password_hash. These accounts must have their passwords reset immediately.', cnt;
  END IF;
END $$;

COMMENT ON COLUMN public.user_accounts.password_hash
IS 'DEPRECATED: Legacy SHA-256 password hash (no salt). '
   'All new auth flows use Supabase Auth (auth_user_id). '
   'This column will be dropped after confirming all accounts have auth_user_id. '
   'Updated: 2026-05-28.';
