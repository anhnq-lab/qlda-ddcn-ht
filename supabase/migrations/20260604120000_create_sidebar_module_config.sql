-- MIGRATION: Tạo bảng sidebar_module_config
-- Cho phép Admin ẩn/hiện các module trên thanh điều hướng (sidebar) ở phạm vi toàn hệ thống.
-- Khác với dashboard_widget_config (theo từng role), cấu hình này áp dụng chung cho mọi người dùng.

CREATE TABLE IF NOT EXISTS public.sidebar_module_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    module_key text NOT NULL UNIQUE,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Bật RLS
ALTER TABLE public.sidebar_module_config ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi user authenticated đều được đọc (để dựng sidebar)
DROP POLICY IF EXISTS "Cho phép tất cả user authenticated đọc sidebar_module_config" ON public.sidebar_module_config;
CREATE POLICY "Cho phép tất cả user authenticated đọc sidebar_module_config"
    ON public.sidebar_module_config
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Chỉ Admin mới được INSERT/UPDATE/DELETE (dùng helper public.is_admin())
DROP POLICY IF EXISTS "Chỉ admin được phép sửa sidebar_module_config" ON public.sidebar_module_config;
CREATE POLICY "Chỉ admin được phép sửa sidebar_module_config"
    ON public.sidebar_module_config
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Trigger tự động cập nhật updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.sidebar_module_config;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.sidebar_module_config
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- SEED: tất cả module mặc định hiển thị (is_visible = true)
INSERT INTO public.sidebar_module_config (module_key, is_visible) VALUES
('/', true),
('/my-dashboard', true),
('/calendar', true),
('/projects', true),
('/work-plan', true),
('/employees', true),
('/tai-san-cong', true),
('/contractors', true),
('/bidding', true),
('/capital-planning', true),
('/cde', true),
('/bim', true),
('/legal-documents', true),
('/reports', true),
('/regulations', true),
('/quy-trinh', true)
ON CONFLICT (module_key) DO NOTHING;
