-- Migration: Create Construction Management Schema
-- Generated: 2026-05-30
-- Description: Bảng quản lý Nhật ký thi công, nhân công, thiết bị, hình ảnh và tiến độ do nhà thầu lập.

-- 1. BẢNG NHẬT KÝ THI CÔNG HẰNG NGÀY (Daily Construction Logs)
CREATE TABLE IF NOT EXISTS public.construction_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    weather_temp NUMERIC,                     -- Nhiệt độ hiện tại (°C)
    weather_desc TEXT,                       -- Mô tả thời tiết (Nắng, Mưa, Mưa giông, Nhiều mây...)
    weather_wind TEXT,                       -- Tình trạng gió (Gió nhẹ, Gió to, Yên gió...)
    construction_status TEXT NOT NULL DEFAULT 'normal', -- normal (Bình thường), suspended (Tạm dừng), delayed (Trì hoãn một phần)
    notes TEXT,                              -- Ghi chú chung của ngày hôm đó
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_project_date UNIQUE(project_id, log_date)
);

-- 2. BẢNG CHI TIẾT NHẬT KÝ THI CÔNG (Daily Work Details)
CREATE TABLE IF NOT EXISTS public.construction_log_details (
    detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES public.construction_logs(log_id) ON DELETE CASCADE,
    contract_id TEXT REFERENCES public.contracts(contract_id) ON DELETE SET NULL,
    work_item TEXT NOT NULL,                  -- Tên hạng mục/đầu việc đang thi công (ví dụ: Thi công lắp dựng cốt thép dầm sàn)
    location TEXT,                           -- Vị trí cụ thể (ví dụ: Trục A-C, Tầng 2)
    work_volume TEXT,                        -- Khối lượng thi công trong ngày (ví dụ: Đổ 120m3 bê tông, Lắp ráp 2 tấn thép)
    status TEXT NOT NULL DEFAULT 'completed', -- completed (Hoàn thành trong ngày), in_progress (Đang tiếp tục), delayed (Bị chậm tiến độ)
    safety_status TEXT NOT NULL DEFAULT 'safe', -- safe (An toàn), warning (Nhắc nhở), incident (Có sự cố)
    safety_notes TEXT,                       -- Chi tiết nhắc nhở/biên bản an toàn
    issues TEXT,                             -- Vấn đề vướng mắc phát sinh (Ví dụ: Thiếu vật tư cát, mất điện hiện trường...)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. BẢNG NHÂN LỰC THI CÔNG (Manpower Details)
CREATE TABLE IF NOT EXISTS public.construction_manpower (
    manpower_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES public.construction_logs(log_id) ON DELETE CASCADE,
    contractor_id TEXT REFERENCES public.contractors(contractor_id) ON DELETE CASCADE,
    role_title TEXT NOT NULL,                 -- Chỉ huy trưởng, Kỹ sư giám sát, Công nhân cốt thép, Thợ hàn...
    quantity INTEGER NOT NULL DEFAULT 0,
    notes TEXT
);

-- 4. BẢNG MÁY MÓC THI CÔNG (Equipment Details)
CREATE TABLE IF NOT EXISTS public.construction_equipment (
    equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES public.construction_logs(log_id) ON DELETE CASCADE,
    equipment_name TEXT NOT NULL,             -- Xe cẩu bánh xích, Xe lu rung, Máy trộn bê tông...
    quantity INTEGER NOT NULL DEFAULT 1,
    operating_hours NUMERIC DEFAULT 8,        -- Số giờ hoạt động trong ngày
    status TEXT NOT NULL DEFAULT 'active',    -- active (Hoạt động tốt), broken (Hỏng hóc), idle (Đứng im/Chờ việc)
    notes TEXT
);

-- 5. BẢNG HÌNH ẢNH HIỆN TRƯỜNG CÔNG TRƯỜNG (Site Photos)
CREATE TABLE IF NOT EXISTS public.construction_site_photos (
    photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
    log_id UUID REFERENCES public.construction_logs(log_id) ON DELETE SET NULL,
    image_path TEXT NOT NULL,                 -- Đường dẫn tệp tin trên Supabase Storage
    caption TEXT,                             -- Mô tả hình ảnh (Ví dụ: Công tác ép cọc thử tải móng)
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. BẢNG TIẾN ĐỘ THI CÔNG DO NHÀ THẦU LẬP (Contractor Construction Progress / WBS)
CREATE TABLE IF NOT EXISTS public.construction_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
    contract_id TEXT REFERENCES public.contracts(contract_id) ON DELETE CASCADE, -- Liên kết hợp đồng nhà thầu thi công
    task_name TEXT NOT NULL,                  -- Tên công việc (ví dụ: Đào đất hố móng, Đổ bê tông lót, Thi công cột tầng trệt...)
    planned_start_date DATE,                  -- Ngày bắt đầu kế hoạch
    planned_end_date DATE,                    -- Ngày hoàn thành kế hoạch
    actual_start_date DATE,                    -- Ngày bắt đầu thực tế
    actual_end_date DATE,                      -- Ngày hoàn thành thực tế
    weight_percent NUMERIC(5,2) DEFAULT 0,    -- Trọng số đóng góp (%) vào gói thầu/hợp đồng (tổng weight_percent của 1 hợp đồng = 100%)
    planned_percent NUMERIC(5,2) DEFAULT 0,   -- % Tiến độ kế hoạch lũy kế
    actual_percent NUMERIC(5,2) DEFAULT 0,    -- % Tiến độ thực tế đạt được lũy kế
    status TEXT NOT NULL DEFAULT 'pending',   -- pending (Chưa bắt đầu), in_progress (Đang làm), completed (Đã xong), delayed (Chậm tiến độ)
    notes TEXT,
    sort_order INTEGER DEFAULT 0,             -- Thứ tự sắp xếp các đầu việc
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. BẬT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.construction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_log_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_manpower ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_site_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_progress ENABLE ROW LEVEL SECURITY;

-- 8. THIẾT LẬP CÁC CHÍNH SÁCH BẢO MẬT (RLS POLICIES)

-- 8.1 SELECT (Xem thông tin): Tất cả thành viên dự án và Ban giám đốc đều được xem
CREATE POLICY "Xem nhat ky thi cong" ON public.construction_logs
    FOR SELECT TO authenticated
    USING (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "Xem chi tiet nhat ky" ON public.construction_log_details
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.construction_logs cl WHERE cl.log_id = log_id AND (public.is_global_role() OR public.is_project_member(cl.project_id))));

CREATE POLICY "Xem chi tiet nhan luc" ON public.construction_manpower
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.construction_logs cl WHERE cl.log_id = log_id AND (public.is_global_role() OR public.is_project_member(cl.project_id))));

CREATE POLICY "Xem chi tiet thiet bi" ON public.construction_equipment
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.construction_logs cl WHERE cl.log_id = log_id AND (public.is_global_role() OR public.is_project_member(cl.project_id))));

CREATE POLICY "Xem hinh anh hien truong" ON public.construction_site_photos
    FOR SELECT TO authenticated
    USING (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "Xem tien do nha thau" ON public.construction_progress
    FOR SELECT TO authenticated
    USING (public.is_global_role() OR public.is_project_member(project_id));

-- 8.2 INSERT / UPDATE (Thêm mới & Cập nhật): Giám sát công trình, Chỉ huy trưởng nhà thầu
CREATE POLICY "Cap nhat nhat ky" ON public.construction_logs
    FOR ALL TO authenticated
    USING (public.is_global_role() OR public.is_project_member(project_id))
    WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "Cap nhat chi tiet nhat ky" ON public.construction_log_details
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.construction_logs cl WHERE cl.log_id = log_id AND (public.is_global_role() OR public.is_project_member(cl.project_id))))
    WITH CHECK (EXISTS (SELECT 1 FROM public.construction_logs cl WHERE cl.log_id = log_id AND (public.is_global_role() OR public.is_project_member(cl.project_id))));

CREATE POLICY "Cap nhat nhan luc" ON public.construction_manpower
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.construction_logs cl WHERE cl.log_id = log_id AND (public.is_global_role() OR public.is_project_member(cl.project_id))))
    WITH CHECK (EXISTS (SELECT 1 FROM public.construction_logs cl WHERE cl.log_id = log_id AND (public.is_global_role() OR public.is_project_member(cl.project_id))));

CREATE POLICY "Cap nhat thiet bi" ON public.construction_equipment
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.construction_logs cl WHERE cl.log_id = log_id AND (public.is_global_role() OR public.is_project_member(cl.project_id))))
    WITH CHECK (EXISTS (SELECT 1 FROM public.construction_logs cl WHERE cl.log_id = log_id AND (public.is_global_role() OR public.is_project_member(cl.project_id))));

CREATE POLICY "Cap nhat hinh anh hien truong" ON public.construction_site_photos
    FOR ALL TO authenticated
    USING (public.is_global_role() OR public.is_project_member(project_id))
    WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "Cap nhat tien do nha thau" ON public.construction_progress
    FOR ALL TO authenticated
    USING (public.is_global_role() OR public.is_project_member(project_id))
    WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

-- 9. TRIGGERS CẬP NHẬT THỜI GIAN
CREATE TRIGGER set_timestamp_construction_logs
BEFORE UPDATE ON public.construction_logs
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER set_timestamp_construction_progress
BEFORE UPDATE ON public.construction_progress
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
