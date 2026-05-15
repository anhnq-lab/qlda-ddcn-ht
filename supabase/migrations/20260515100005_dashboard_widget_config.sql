-- MIGRATION: Tạo bảng dashboard_widget_config

CREATE TABLE IF NOT EXISTS public.dashboard_widget_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL,
    widget_id text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(role, widget_id)
);

-- Bật RLS
ALTER TABLE public.dashboard_widget_config ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người dùng đã đăng nhập (authenticated) đều được phép XEM (SELECT)
CREATE POLICY "Cho phép tất cả user authenticated đọc dashboard_widget_config"
    ON public.dashboard_widget_config
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Chỉ user có role = 'super_admin' trong bảng employees mới được phép INSERT/UPDATE/DELETE
CREATE POLICY "Chỉ super_admin được phép sửa dashboard_widget_config"
    ON public.dashboard_widget_config
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
DROP TRIGGER IF EXISTS set_updated_at ON public.dashboard_widget_config;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.dashboard_widget_config
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- SEED DATA (Dữ liệu mẫu cơ bản)

-- Super Admin: Có thể thấy mọi widget
INSERT INTO public.dashboard_widget_config (role, widget_id, is_active) VALUES
('super_admin', 'project_progress', true),
('super_admin', 'bidding_pipeline', true),
('super_admin', 'contract_summary', true),
('super_admin', 'payment_pipeline', true),
('super_admin', 'review_queue', true),
('super_admin', 'hr_summary', true)
ON CONFLICT (role, widget_id) DO NOTHING;

-- Lãnh đạo Ban (director, deputy_director): Thường thấy dự án, kế hoạch, thanh toán, đấu thầu
INSERT INTO public.dashboard_widget_config (role, widget_id, is_active) VALUES
('director', 'project_progress', true),
('director', 'bidding_pipeline', true),
('director', 'contract_summary', true),
('director', 'payment_pipeline', true),
('deputy_director', 'project_progress', true),
('deputy_director', 'bidding_pipeline', true),
('deputy_director', 'contract_summary', true),
('deputy_director', 'payment_pipeline', true)
ON CONFLICT (role, widget_id) DO NOTHING;

-- Kế toán trưởng (chief_accountant): Thấy thanh toán, hợp đồng
INSERT INTO public.dashboard_widget_config (role, widget_id, is_active) VALUES
('chief_accountant', 'payment_pipeline', true),
('chief_accountant', 'contract_summary', true)
ON CONFLICT (role, widget_id) DO NOTHING;

-- Trưởng phòng (dept_head), Phó phòng (deputy_head), Chuyên viên (specialist), Nhân viên (staff): 
-- Các role này thường sẽ được cấu hình thêm hoặc dựa theo vị trí, nhưng cứ mặc định để trống hoặc cấu hình cơ bản.
INSERT INTO public.dashboard_widget_config (role, widget_id, is_active) VALUES
('dept_head', 'project_progress', true),
('deputy_head', 'project_progress', true),
('specialist', 'project_progress', true)
ON CONFLICT (role, widget_id) DO NOTHING;
