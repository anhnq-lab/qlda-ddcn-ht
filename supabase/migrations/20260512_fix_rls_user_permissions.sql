-- ============================================================
-- Migration: Fix RLS policies on user_permissions table
-- Issue: USING (true) allows ANY authenticated user to read
--        all permission rows. Must restrict to own data + admin.
-- ============================================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "user_permissions_select_own" ON user_permissions;
DROP POLICY IF EXISTS "user_permissions_insert_admin" ON user_permissions;
DROP POLICY IF EXISTS "user_permissions_update_admin" ON user_permissions;
DROP POLICY IF EXISTS "user_permissions_delete_admin" ON user_permissions;

-- ── SELECT: own row OR admin ──────────────────────────────
-- Users can only read their own permission rows.
-- Admins (role = 'Admin' in employees) can read all rows.
CREATE POLICY "user_permissions_select_own_or_admin"
    ON user_permissions FOR SELECT
    USING (
        -- Own permissions
        user_id = (
            SELECT e.employee_id
            FROM employees e
            JOIN user_accounts ua ON e.employee_id = ua.employee_id
            WHERE ua.auth_user_id = auth.uid()
            LIMIT 1
        )
        OR
        -- Admin employees can read all
        EXISTS (
            SELECT 1
            FROM employees e
            JOIN user_accounts ua ON e.employee_id = ua.employee_id
            WHERE ua.auth_user_id = auth.uid()
              AND e.role = 'Admin'
        )
    );

-- ── INSERT: only admin ────────────────────────────────────
CREATE POLICY "user_permissions_insert_admin_only"
    ON user_permissions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM employees e
            JOIN user_accounts ua ON e.employee_id = ua.employee_id
            WHERE ua.auth_user_id = auth.uid()
              AND e.role = 'Admin'
        )
    );

-- ── UPDATE: only admin ────────────────────────────────────
CREATE POLICY "user_permissions_update_admin_only"
    ON user_permissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM employees e
            JOIN user_accounts ua ON e.employee_id = ua.employee_id
            WHERE ua.auth_user_id = auth.uid()
              AND e.role = 'Admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM employees e
            JOIN user_accounts ua ON e.employee_id = ua.employee_id
            WHERE ua.auth_user_id = auth.uid()
              AND e.role = 'Admin'
        )
    );

-- ── DELETE: only admin ────────────────────────────────────
CREATE POLICY "user_permissions_delete_admin_only"
    ON user_permissions FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM employees e
            JOIN user_accounts ua ON e.employee_id = ua.employee_id
            WHERE ua.auth_user_id = auth.uid()
              AND e.role = 'Admin'
        )
    );

-- ── Performance: index for RLS subquery ──────────────────
-- Ensure fast lookup for the RLS check
CREATE INDEX IF NOT EXISTS idx_user_accounts_auth_user_id
    ON user_accounts(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_employees_role
    ON employees(role);
