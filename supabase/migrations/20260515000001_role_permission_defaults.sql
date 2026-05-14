-- MIGRATION: Tạo bảng role_permission_defaults và cấu hình RLS

CREATE TABLE IF NOT EXISTS public.role_permission_defaults (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL,
    resource text NOT NULL,
    actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(role, resource)
);

-- Bật RLS
ALTER TABLE public.role_permission_defaults ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người dùng đã đăng nhập (authenticated) đều được phép XEM (SELECT)
CREATE POLICY "Cho phép tất cả user authenticated đọc role_permission_defaults"
    ON public.role_permission_defaults
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Chỉ user có role = 'super_admin' trong bảng employees mới được phép INSERT/UPDATE/DELETE
-- Lưu ý: Bạn cần thay đổi điều kiện này nếu logic xác định super_admin của bạn khác.
CREATE POLICY "Chỉ super_admin được phép sửa role_permission_defaults"
    ON public.role_permission_defaults
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.employees e 
            WHERE e.employee_id = auth.uid() 
            AND e.role = 'Admin' 
            AND e.status = 1
        )
    );

-- Tạo trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_updated_at ON public.role_permission_defaults;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.role_permission_defaults
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- SEED DATA (Dữ liệu mẫu cơ bản)
-- Super Admin
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
('super_admin', 'dashboard', '["view", "export"]'::jsonb),
('super_admin', 'projects', '["view", "create", "update", "delete"]'::jsonb),
('super_admin', 'admin_roles', '["view", "create", "update", "delete"]'::jsonb)
ON CONFLICT (role, resource) DO NOTHING;

-- Chuyên viên
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
('specialist', 'dashboard', '["view"]'::jsonb),
('specialist', 'projects', '["view", "create", "update"]'::jsonb)
ON CONFLICT (role, resource) DO NOTHING;

-- Các dữ liệu role khác sẽ được upsert qua giao diện UI RoleDefaultsManager
