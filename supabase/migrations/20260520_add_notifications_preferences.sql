-- ============================================================
-- Migration: Create notifications & user_preferences tables
-- Date: 2026-05-20
-- Description:
--   - notifications: in-app notification system
--   - user_preferences: per-user UI settings (theme, density, etc.)
-- Follows project conventions: UUID PK, TIMESTAMPTZ, proper RLS
-- ============================================================

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TABLE 1: notifications                                     ║
-- ╚══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    message     TEXT,
    type        TEXT NOT NULL DEFAULT 'info'
                CHECK (type IN ('info', 'warning', 'error', 'success', 'task', 'approval')),
    read_at     TIMESTAMPTZ,        -- NULL = unread
    action_url  TEXT,                -- Deep link to relevant page
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'In-app notifications — each row = 1 notification for 1 user';
COMMENT ON COLUMN public.notifications.type IS 'info | warning | error | success | task | approval';
COMMENT ON COLUMN public.notifications.read_at IS 'NULL = unread; set to NOW() when user reads';
COMMENT ON COLUMN public.notifications.action_url IS 'Deep link, e.g. /contracts/HD-001 or /tasks/abc';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, read_at);

CREATE INDEX IF NOT EXISTS idx_notifications_created
  ON public.notifications(created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only see their own notifications
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    user_id = public.get_current_employee_id()
    OR public.is_admin()
  );

-- INSERT: system/admin can create notifications for any user,
-- or user can create for themselves (e.g., test)
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = public.get_current_employee_id()
    OR public.is_admin()
    OR public.is_global_role()
  );

-- UPDATE: users can mark their own notifications as read
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (
    user_id = public.get_current_employee_id()
    OR public.is_admin()
  )
  WITH CHECK (
    user_id = public.get_current_employee_id()
    OR public.is_admin()
  );

-- DELETE: admin only (users should mark as read, not delete)
CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TABLE 2: user_preferences                                  ║
-- ╚══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id               TEXT PRIMARY KEY REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    theme                 TEXT NOT NULL DEFAULT 'nature'
                          CHECK (theme IN ('nature', 'ocean', 'sunset', 'midnight', 'sakura', 'system')),
    density               TEXT NOT NULL DEFAULT 'comfortable'
                          CHECK (density IN ('compact', 'comfortable', 'spacious')),
    dashboard_layout      JSONB NOT NULL DEFAULT '{}'::jsonb,
    notification_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_preferences IS 'Per-user UI preferences — 1 row per user';
COMMENT ON COLUMN public.user_preferences.theme IS 'UI theme: nature | ocean | sunset | midnight | sakura | system';
COMMENT ON COLUMN public.user_preferences.density IS 'Layout density: compact | comfortable | spacious';
COMMENT ON COLUMN public.user_preferences.dashboard_layout IS 'JSON: widget positions, visibility, etc.';
COMMENT ON COLUMN public.user_preferences.notification_settings IS 'JSON: email_enabled, push_enabled, muted_types, etc.';

-- Trigger: auto-update updated_at
CREATE OR REPLACE TRIGGER set_timestamp_user_preferences
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only see their own preferences
CREATE POLICY "user_preferences_select" ON public.user_preferences
  FOR SELECT TO authenticated
  USING (
    user_id = public.get_current_employee_id()
    OR public.is_admin()
  );

-- INSERT: users can only create their own preferences
CREATE POLICY "user_preferences_insert" ON public.user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = public.get_current_employee_id()
  );

-- UPDATE: users can only update their own preferences
CREATE POLICY "user_preferences_update" ON public.user_preferences
  FOR UPDATE TO authenticated
  USING (user_id = public.get_current_employee_id())
  WITH CHECK (user_id = public.get_current_employee_id());

-- DELETE: admin only
CREATE POLICY "user_preferences_delete" ON public.user_preferences
  FOR DELETE TO authenticated
  USING (public.is_admin());
