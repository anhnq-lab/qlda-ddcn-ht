-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Stakeholder Types + Project Plan RACI Schema
-- ═══════════════════════════════════════════════════════════════
-- Mục tiêu:
--   1. Tạo bảng stakeholder_types (danh mục bên liên quan ĐTXD)
--   2. Tạo bảng project_plan_steps (kế hoạch dự án — tách riêng)
--   3. Tạo bảng project_plan_raci (ma trận RACI cho từng bước)
--   4. Tạo bảng workflow_node_raci (RACI template trên quy trình mẫu)
--   5. Bổ sung cột legal_basis, output_document cho workflow_nodes
--   6. Thêm FK project_plan_step_id cho tasks
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. STAKEHOLDER_TYPES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stakeholder_types (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('owner', 'consultant', 'authority', 'contractor')),
    description TEXT,
    default_sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stakeholder_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for stakeholder_types"
    ON public.stakeholder_types FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.stakeholder_types IS 'Danh mục bên liên quan trong quy trình ĐTXD (RACI)';

-- Seed data (18 loại)
INSERT INTO public.stakeholder_types (code, name, category, default_sort_order) VALUES
    ('BQL',      'Ban QLDA (Ban Giám đốc)',      'owner',       1),
    ('BQL_PTDV', 'Ban QLDA - Phòng Phát triển DV', 'owner',      2),
    ('BQL_QLDA', 'Ban QLDA - Phòng QLDA',        'owner',       3),
    ('BQL_HCTH', 'Ban QLDA - Phòng HC-TH',       'owner',       4),
    ('BQL_KHDT', 'Ban QLDA - Phòng KH-ĐT',       'owner',       5),
    ('BQL_KTTD', 'Ban QLDA - Phòng KT-TĐ',       'owner',       6),
    ('TVTK',     'Tư vấn thiết kế',              'consultant',  7),
    ('TVGS',     'Tư vấn giám sát',              'consultant',  8),
    ('TVTT',     'Tư vấn thẩm tra',              'consultant',  9),
    ('TVDT',     'Tư vấn đấu thầu',              'consultant', 10),
    ('NTC',      'Nhà thầu chính (thi công)',     'contractor', 11),
    ('NTPHU',    'Nhà thầu phụ',                 'contractor', 12),
    ('NQDDT',    'Người quyết định đầu tư',       'authority',  13),
    ('SXD',      'Sở Xây dựng',                  'authority',  14),
    ('STC',      'Sở Tài chính',                 'authority',  15),
    ('UBND',     'UBND tỉnh/thành phố',          'authority',  16),
    ('KBNN',     'Kho bạc Nhà nước',             'authority',  17),
    ('KTNN',     'Kiểm toán Nhà nước',           'authority',  18)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, 
    category = EXCLUDED.category, 
    default_sort_order = EXCLUDED.default_sort_order;


-- ─── 2. PROJECT_PLAN_STEPS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_plan_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,

    -- Truy nguồn template
    workflow_instance_id UUID REFERENCES public.workflow_instances(id) ON DELETE SET NULL,
    workflow_node_id UUID REFERENCES public.workflow_nodes(id) ON DELETE SET NULL,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,

    -- Phân loại & thứ tự
    step_order INT NOT NULL DEFAULT 0,
    step_code VARCHAR(50),
    phase VARCHAR(20) DEFAULT 'preparation'
        CHECK (phase IN ('preparation', 'execution', 'completion')),

    -- Nội dung
    step_name TEXT NOT NULL,
    legal_basis TEXT,
    output_document TEXT,

    -- Tiến độ
    start_date DATE,
    due_date DATE,
    duration_days INT,

    -- Trạng thái
    status VARCHAR(20) NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned', 'in_progress', 'completed', 'incomplete', 'deferred')),
    completion_result TEXT,
    incomplete_reason TEXT,
    notes TEXT,

    sort_order INT DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_plan_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for project_plan_steps"
    ON public.project_plan_steps FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pps_project ON public.project_plan_steps(project_id);
CREATE INDEX IF NOT EXISTS idx_pps_phase ON public.project_plan_steps(phase);
CREATE INDEX IF NOT EXISTS idx_pps_status ON public.project_plan_steps(status);
CREATE INDEX IF NOT EXISTS idx_pps_order ON public.project_plan_steps(project_id, step_order);
CREATE INDEX IF NOT EXISTS idx_pps_workflow_node ON public.project_plan_steps(workflow_node_id);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER set_timestamp_project_plan_steps
    BEFORE UPDATE ON public.project_plan_steps
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

COMMENT ON TABLE public.project_plan_steps IS 'Bước kế hoạch dự án — tách riêng khỏi monthly_plan_items, hỗ trợ RACI';


-- ─── 3. PROJECT_PLAN_RACI ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_plan_raci (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES public.project_plan_steps(id) ON DELETE CASCADE,
    stakeholder_code VARCHAR(20) NOT NULL REFERENCES public.stakeholder_types(code),
    raci_type VARCHAR(1) NOT NULL CHECK (raci_type IN ('R', 'A', 'C', 'I')),

    -- Gán cụ thể (optional)
    stakeholder_name TEXT,
    assigned_employee_id UUID,
    assigned_department_id UUID,
    note TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (step_id, stakeholder_code, raci_type)
);

ALTER TABLE public.project_plan_raci ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for project_plan_raci"
    ON public.project_plan_raci FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ppr_step ON public.project_plan_raci(step_id);
CREATE INDEX IF NOT EXISTS idx_ppr_stakeholder ON public.project_plan_raci(stakeholder_code);

COMMENT ON TABLE public.project_plan_raci IS 'Ma trận RACI cho từng bước kế hoạch dự án';


-- ─── 4. WORKFLOW_NODE_RACI (template) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_node_raci (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
    stakeholder_code VARCHAR(20) NOT NULL REFERENCES public.stakeholder_types(code),
    raci_type VARCHAR(1) NOT NULL CHECK (raci_type IN ('R', 'A', 'C', 'I')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (workflow_node_id, stakeholder_code, raci_type)
);

ALTER TABLE public.workflow_node_raci ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for workflow_node_raci"
    ON public.workflow_node_raci FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_wnr_node ON public.workflow_node_raci(workflow_node_id);

COMMENT ON TABLE public.workflow_node_raci IS 'RACI template cho workflow nodes — copy sang project khi tạo KH';


-- ─── 5. BỔ SUNG WORKFLOW_NODES ────────────────────────────────
ALTER TABLE public.workflow_nodes
    ADD COLUMN IF NOT EXISTS legal_basis TEXT,
    ADD COLUMN IF NOT EXISTS output_document TEXT;

COMMENT ON COLUMN public.workflow_nodes.legal_basis IS 'Căn cứ pháp lý template (VD: NĐ 15/2021/NĐ-CP)';
COMMENT ON COLUMN public.workflow_nodes.output_document IS 'Sản phẩm đầu ra template (VD: Báo cáo NCKT)';

-- Backfill từ metadata nếu có
UPDATE public.workflow_nodes
SET
    legal_basis = COALESCE(legal_basis, metadata->>'legalBasis', metadata->>'legal_basis'),
    output_document = COALESCE(output_document, metadata->>'output', metadata->>'output_document')
WHERE metadata IS NOT NULL
  AND (legal_basis IS NULL OR output_document IS NULL);


-- ─── 6. TASKS — FK MỚI ───────────────────────────────────────
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS project_plan_step_id UUID
        REFERENCES public.project_plan_steps(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_plan_step
    ON public.tasks(project_plan_step_id) WHERE project_plan_step_id IS NOT NULL;


-- ─── 7. BACKFILL: monthly_plan_items (project_step) → project_plan_steps ──
-- Migrate dữ liệu cũ nếu có
INSERT INTO public.project_plan_steps (
    id, project_id, workflow_node_id, workflow_id,
    step_order, step_code, phase,
    step_name, legal_basis, output_document,
    start_date, due_date, duration_days,
    status, completion_result, incomplete_reason, notes,
    sort_order, created_at, updated_at
)
SELECT
    mpi.id,
    mpi.project_id,
    mpi.workflow_node_id,
    mpi.workflow_id,
    COALESCE(mpi.step_order, 0),
    mpi.step_code,
    COALESCE(mpi.phase, 'preparation'),
    mpi.task_name,
    mpi.legal_basis,
    mpi.output_document,
    mpi.start_date,
    mpi.due_date,
    mpi.duration_days,
    CASE mpi.status
        WHEN 'completed' THEN 'completed'
        WHEN 'incomplete' THEN 'incomplete'
        WHEN 'partial' THEN 'in_progress'
        WHEN 'deferred' THEN 'deferred'
        ELSE 'planned'
    END,
    mpi.completion_result,
    mpi.incomplete_reason,
    mpi.notes,
    COALESCE(mpi.sort_order, 0),
    mpi.created_at,
    mpi.updated_at
FROM public.monthly_plan_items mpi
WHERE mpi.schedule_state = 'project_step'
  AND mpi.project_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Backfill tasks.project_plan_step_id từ monthly_plan_item_id
UPDATE public.tasks t
SET project_plan_step_id = t.monthly_plan_item_id
FROM public.project_plan_steps pps
WHERE pps.id = t.monthly_plan_item_id
  AND t.project_plan_step_id IS NULL;

-- Backfill project_plan_raci từ assignee_role (set as R)
INSERT INTO public.project_plan_raci (step_id, stakeholder_code, raci_type, stakeholder_name)
SELECT
    pps.id,
    CASE
        WHEN pps.step_name ILIKE '%thiết kế%' OR pps.step_name ILIKE '%BVTC%' THEN 'TVTK'
        WHEN pps.step_name ILIKE '%giám sát%' THEN 'TVGS'
        WHEN pps.step_name ILIKE '%thẩm tra%' OR pps.step_name ILIKE '%thẩm định%' THEN 'TVTT'
        WHEN pps.step_name ILIKE '%đấu thầu%' OR pps.step_name ILIKE '%lựa chọn nhà thầu%' THEN 'TVDT'
        WHEN pps.step_name ILIKE '%thi công%' OR pps.step_name ILIKE '%xây lắp%' THEN 'NTC'
        WHEN pps.step_name ILIKE '%Sở Xây dựng%' OR pps.step_name ILIKE '%SXD%' THEN 'SXD'
        WHEN pps.step_name ILIKE '%quyết toán%' OR pps.step_name ILIKE '%Sở Tài chính%' THEN 'STC'
        WHEN pps.step_name ILIKE '%UBND%' OR pps.step_name ILIKE '%phê duyệt%' THEN 'UBND'
        WHEN pps.step_name ILIKE '%kho bạc%' THEN 'KBNN'
        WHEN pps.step_name ILIKE '%kiểm toán%' THEN 'KTNN'
        ELSE 'BQL'
    END,
    'R',
    NULL
FROM public.project_plan_steps pps
WHERE NOT EXISTS (
    SELECT 1 FROM public.project_plan_raci pr WHERE pr.step_id = pps.id
)
ON CONFLICT (step_id, stakeholder_code, raci_type) DO NOTHING;


-- ─── 8. VERIFY ────────────────────────────────────────────────
DO $$
DECLARE
    v_stakeholder_count INT;
    v_step_count INT;
    v_raci_count INT;
BEGIN
    SELECT COUNT(*) INTO v_stakeholder_count FROM public.stakeholder_types;
    SELECT COUNT(*) INTO v_step_count FROM public.project_plan_steps;
    SELECT COUNT(*) INTO v_raci_count FROM public.project_plan_raci;

    RAISE NOTICE 'RACI Migration verify:';
    RAISE NOTICE '  - Stakeholder types: %', v_stakeholder_count;
    RAISE NOTICE '  - Project plan steps: %', v_step_count;
    RAISE NOTICE '  - RACI assignments: %', v_raci_count;
END $$;
