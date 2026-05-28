-- ============================================================
-- Migration: 20260528100003_server_side_rate_limit.sql
-- T4: Server-side auth rate limiting — defense-in-depth layer
--     on top of the client-side useLoginRateLimit hook.
--
-- Table:  auth_rate_limits   (write via SECURITY DEFINER only)
-- RPCs:   check_auth_rate_limit(identifier)  → JSONB
--         record_auth_attempt(identifier, success) → VOID
-- Both callable by anon role (invoked pre-auth).
--
-- Identifiers are SHA-256-hashed before storage — no plaintext.
-- Tiered lockout mirrors client-side hook:
--   ≥5 failures in 5 min  → 60s  block
--   ≥10 failures in 15 min → 300s block
--   ≥15 failures in 30 min → 900s block
-- ============================================================

-- Table ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
    id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier_hash  TEXT        NOT NULL,
    attempt_time     TIMESTAMPTZ NOT NULL DEFAULT now(),
    success          BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_auth_rl_hash_time
    ON public.auth_rate_limits (identifier_hash, attempt_time DESC);

-- Lock the table down: only SECURITY DEFINER functions may touch it
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies → zero direct access for any role

-- check_auth_rate_limit -----------------------------------------
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(p_identifier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hash         TEXT;
    v_fails_5min   INTEGER := 0;
    v_fails_15min  INTEGER := 0;
    v_fails_30min  INTEGER := 0;
    v_blocked      BOOLEAN := FALSE;
    v_retry_after  INTEGER := 0;
BEGIN
    IF p_identifier IS NULL OR trim(p_identifier) = '' THEN
        RETURN jsonb_build_object('blocked', FALSE, 'retry_after_seconds', 0);
    END IF;

    v_hash := encode(sha256(lower(trim(p_identifier))::bytea), 'hex');

    SELECT COUNT(*) INTO v_fails_5min
    FROM public.auth_rate_limits
    WHERE identifier_hash = v_hash
      AND success = FALSE
      AND attempt_time > now() - INTERVAL '5 minutes';

    SELECT COUNT(*) INTO v_fails_15min
    FROM public.auth_rate_limits
    WHERE identifier_hash = v_hash
      AND success = FALSE
      AND attempt_time > now() - INTERVAL '15 minutes';

    SELECT COUNT(*) INTO v_fails_30min
    FROM public.auth_rate_limits
    WHERE identifier_hash = v_hash
      AND success = FALSE
      AND attempt_time > now() - INTERVAL '30 minutes';

    -- Highest tier wins
    IF v_fails_5min >= 5 THEN
        v_blocked := TRUE;
        v_retry_after := 60;
    END IF;
    IF v_fails_15min >= 10 THEN
        v_blocked := TRUE;
        v_retry_after := 300;
    END IF;
    IF v_fails_30min >= 15 THEN
        v_blocked := TRUE;
        v_retry_after := 900;
    END IF;

    RETURN jsonb_build_object(
        'blocked',              v_blocked,
        'retry_after_seconds',  v_retry_after,
        'failed_attempts_5min', v_fails_5min
    );
END;
$$;

-- record_auth_attempt -------------------------------------------
CREATE OR REPLACE FUNCTION public.record_auth_attempt(
    p_identifier TEXT,
    p_success    BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hash TEXT;
BEGIN
    IF p_identifier IS NULL OR trim(p_identifier) = '' THEN
        RETURN;
    END IF;

    v_hash := encode(sha256(lower(trim(p_identifier))::bytea), 'hex');

    INSERT INTO public.auth_rate_limits (identifier_hash, success)
    VALUES (v_hash, p_success);

    -- Prune records older than 1 hour on every call (cheap: indexed on attempt_time)
    DELETE FROM public.auth_rate_limits
    WHERE attempt_time < now() - INTERVAL '1 hour';
END;
$$;

-- Grant execute to anon (called before a session exists) --------
GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.record_auth_attempt(TEXT, BOOLEAN) TO anon;

-- Also grant to authenticated (for completeness) ----------------
GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_auth_attempt(TEXT, BOOLEAN) TO authenticated;
