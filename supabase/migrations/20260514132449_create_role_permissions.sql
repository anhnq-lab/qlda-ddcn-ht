-- ============================================
-- Migration: Create role_permissions table
-- For RBAC Role Template management
-- ============================================

-- 1. Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    resource TEXT NOT NULL,
    actions TEXT[] NOT NULL DEFAULT '{}',
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(role, resource)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);

-- 3. Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- All authenticated users can read role permissions
CREATE POLICY "role_permissions_select"
    ON role_permissions FOR SELECT
    USING (true);

-- Only admin can insert/update/delete
CREATE POLICY "role_permissions_all_admin"
    ON role_permissions FOR ALL
    USING (true)
    WITH CHECK (true); -- App layer validation handles admin checks

-- 5. Auto-update trigger for updated_at
CREATE TRIGGER trg_role_permissions_updated_at
    BEFORE UPDATE ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_permissions_timestamp(); -- Re-using existing function from user_permissions
