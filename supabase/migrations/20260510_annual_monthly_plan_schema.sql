-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Annual & Monthly Plan Schema
-- Mục tiêu: Quản lý KH khung năm, KH tháng, BC tháng
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. ENUMs ────────────────────────────────────────────────
DO $$
BEGIN
    -- Tần suất nhiệm vụ trong KH khung
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_frequency') THEN
        CREATE TYPE plan_frequency AS ENUM (
            'one_time',   -- Một lần (có thời gian bắt đầu/kết thúc cụ thể)
            'monthly',    -- Hàng tháng
            'quarterly',  -- Hàng quý
            'daily',      -- Hàng ngày
            'as_needed'   -- Khi phát sinh
        );
    END IF;

    -- Trạng thái nhiệm vụ trong BC tháng
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'monthly_task_status') THEN
        CREATE TYPE monthly_task_status AS ENUM (
            'planned',    -- Đã lên kế hoạch, chưa báo cáo
            'completed',  -- Hoàn thành
            'incomplete', -- Chưa hoàn thành
            'partial',    -- Hoàn thành một phần
            'deferred'    -- Chuyển sang tháng sau
        );
    END IF;

    -- Trạng thái KH tháng / KH khung
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_status') THEN
        CREATE TYPE plan_status AS ENUM (
            'draft',     -- Bản nháp
            'published', -- Đã ban hành
            'closed'     -- Đã đóng
        );
    END IF;
END $$;

-- ─── 2. BẢNG KH KHUNG NĂM ────────────────────────────────────
-- Mỗi bản ghi = 1 nhiệm vụ trong kế hoạch khung của 1 phòng/năm
CREATE TABLE IF NOT EXISTS public.annual_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Năm kế hoạch
    plan_year INTEGER NOT NULL,

    -- Phòng/ban (dùng mã phòng theo thực tế: HCTH, KHDT, KTTD, QLDA1, QLDA2, QLDA3, PTDV)
    department_code VARCHAR(20) NOT NULL,
    department_name VARCHAR(100) NOT NULL,

    -- Nhóm công việc trong phòng (vd: "Công tác Hành chính", "Tham mưu tổng hợp")
    group_name VARCHAR(200),
    group_sort_order INTEGER DEFAULT 0,

    -- Nội dung nhiệm vụ
    task_name TEXT NOT NULL,
    deliverable TEXT,           -- Sản phẩm đầu ra

    -- Thời gian (lưu dạng text vì thực tế là "Quý I", "Tháng 4", "Hàng tháng")
    start_period VARCHAR(50),   -- "Quý I", "Tháng 4", "Hàng ngày", ...
    end_period VARCHAR(50),     -- "Quý II", "Tháng 12", ...
    frequency plan_frequency NOT NULL DEFAULT 'one_time',

    -- Liên kết dự án (nếu task thuộc dự án cụ thể)
    project_id TEXT REFERENCES public.projects(project_id) ON DELETE SET NULL,

    -- Người thực hiện (lưu text vì format thực tế: "HCTH/ Lộc, Minh/ Hữu")
    responsible_text TEXT,      -- Text gốc từ file Excel
    collaborating_text TEXT,    -- Phòng/cá nhân phối hợp

    -- Liên kết employee IDs (populate khi có thể)
    responsible_ids TEXT[],     -- mảng employee IDs
    collaborating_ids TEXT[],   -- mảng employee IDs

    notes TEXT,
    sort_order INTEGER DEFAULT 0,

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. BẢNG KH THÁNG ────────────────────────────────────────
-- Header: mỗi kỳ kế hoạch tháng của 1 phòng
CREATE TABLE IF NOT EXISTS public.monthly_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_month INTEGER NOT NULL CHECK (plan_month BETWEEN 1 AND 12),
    plan_year INTEGER NOT NULL,
    department_code VARCHAR(20) NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    status plan_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (plan_month, plan_year, department_code)
);

-- ─── 4. BẢNG NHIỆM VỤ TRONG KH THÁNG ────────────────────────
CREATE TABLE IF NOT EXISTS public.monthly_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monthly_plan_id UUID NOT NULL REFERENCES public.monthly_plans(id) ON DELETE CASCADE,

    -- Link về KH khung (nullable: task phát sinh thì null)
    annual_plan_item_id UUID REFERENCES public.annual_plan_items(id) ON DELETE SET NULL,

    -- Link dự án (nullable: task nội bộ thì null)
    project_id TEXT REFERENCES public.projects(project_id) ON DELETE SET NULL,

    -- Nhóm công việc
    group_name VARCHAR(200),
    group_sort_order INTEGER DEFAULT 0,

    -- Nội dung nhiệm vụ
    task_name TEXT NOT NULL,
    deliverable TEXT,

    -- Thời hạn hoàn thành trong tháng
    deadline_note VARCHAR(100),   -- "Tháng 5", "Tuần 2", ngày cụ thể text
    due_date DATE,                -- Ngày cụ thể nếu có

    -- Phân công
    staff_id TEXT,                -- Cán bộ trực tiếp phụ trách (employee ID)
    staff_name VARCHAR(100),      -- Cache tên (tránh join)
    dept_head_id TEXT,            -- Lãnh đạo Phòng
    dept_head_name VARCHAR(100),
    ban_head_id TEXT,             -- Lãnh đạo Ban phụ trách
    ban_head_name VARCHAR(100),

    -- Kết quả (điền khi báo cáo)
    status monthly_task_status NOT NULL DEFAULT 'planned',
    completion_result TEXT,       -- Mô tả kết quả đạt được
    incomplete_reason TEXT,       -- Lý do chưa hoàn thành (nếu có)

    -- Chuyển sang tháng sau
    deferred_to_plan_id UUID REFERENCES public.monthly_plans(id) ON DELETE SET NULL,

    notes TEXT,
    sort_order INTEGER DEFAULT 0,

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_annual_plan_year       ON public.annual_plan_items(plan_year);
CREATE INDEX IF NOT EXISTS idx_annual_plan_dept       ON public.annual_plan_items(department_code);
CREATE INDEX IF NOT EXISTS idx_annual_plan_project    ON public.annual_plan_items(project_id);

CREATE INDEX IF NOT EXISTS idx_monthly_plans_period   ON public.monthly_plans(plan_year, plan_month);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_dept     ON public.monthly_plans(department_code);

CREATE INDEX IF NOT EXISTS idx_monthly_items_plan     ON public.monthly_plan_items(monthly_plan_id);
CREATE INDEX IF NOT EXISTS idx_monthly_items_annual   ON public.monthly_plan_items(annual_plan_item_id);
CREATE INDEX IF NOT EXISTS idx_monthly_items_project  ON public.monthly_plan_items(project_id);
CREATE INDEX IF NOT EXISTS idx_monthly_items_staff    ON public.monthly_plan_items(staff_id);
CREATE INDEX IF NOT EXISTS idx_monthly_items_status   ON public.monthly_plan_items(status);

-- ─── 6. TRIGGERS (updated_at) ────────────────────────────────
CREATE OR REPLACE TRIGGER set_timestamp_annual_plan_items
    BEFORE UPDATE ON public.annual_plan_items
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_monthly_plans
    BEFORE UPDATE ON public.monthly_plans
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_monthly_plan_items
    BEFORE UPDATE ON public.monthly_plan_items
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- ─── 7. RLS POLICIES ─────────────────────────────────────────
ALTER TABLE public.annual_plan_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for annual_plan_items" ON public.annual_plan_items
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for monthly_plans" ON public.monthly_plans
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for monthly_plan_items" ON public.monthly_plan_items
    FOR ALL USING (true) WITH CHECK (true);

-- ─── 8. COMMENTS ─────────────────────────────────────────────
COMMENT ON TABLE public.annual_plan_items  IS 'Nhiệm vụ trong Kế hoạch khung năm — mỗi phòng/ban';
COMMENT ON TABLE public.monthly_plans      IS 'Header KH tháng — 1 bản ghi/phòng/tháng';
COMMENT ON TABLE public.monthly_plan_items IS 'Nhiệm vụ trong KH tháng; dùng để báo cáo kết quả tháng';

COMMENT ON COLUMN public.annual_plan_items.frequency     IS 'one_time | monthly | quarterly | daily | as_needed';
COMMENT ON COLUMN public.annual_plan_items.start_period  IS 'Text gốc: "Quý I", "Tháng 4", "Hàng tháng"';
COMMENT ON COLUMN public.annual_plan_items.project_id    IS 'Nullable — chỉ điền khi nhiệm vụ thuộc dự án cụ thể';

COMMENT ON COLUMN public.monthly_plan_items.annual_plan_item_id IS 'Link về KH khung — null nếu task phát sinh';
COMMENT ON COLUMN public.monthly_plan_items.project_id          IS 'Link dự án — null nếu task nội bộ';
COMMENT ON COLUMN public.monthly_plan_items.deferred_to_plan_id IS 'Chuyển sang tháng sau khi chưa hoàn thành';
