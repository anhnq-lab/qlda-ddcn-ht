-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Refactor "Project Steps" — Unify into monthly_plan_items
-- ═══════════════════════════════════════════════════════════════
-- KIẾN TRÚC MỚI:
--   workflow_nodes       → CHỈ TEMPLATE (đọc khi user bấm "Tạo KH tổng thể")
--   monthly_plan_items   → STEP của KH dự án + ITEM của KH tháng (gộp 1 bảng)
--                          phân biệt qua schedule_state:
--                             'project_step'  → chỉ hiện trong tab KH dự án
--                             'monthly_plan'  → hiện cả ở tab KH tháng
--   tasks                → CÔNG VIỆC CÁ NHÂN, FLAT (bỏ subtask, parent_id ngừng dùng)
--
-- LIÊN KẾT:
--   monthly_plan_items.id  ←→ tasks.monthly_plan_item_id  (1:N)
--   monthly_plan_items.monthly_plan_id  → monthly_plans  (nullable: null=chưa lên KH)
--   monthly_plan_items.workflow_node_id → workflow_nodes (nullable, tham chiếu template)
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. SCHEMA: monthly_plan_items ──────────────────────────────

-- 1.1. Cho phép monthly_plan_id NULL (step chưa lên KH tháng)
ALTER TABLE public.monthly_plan_items
    ALTER COLUMN monthly_plan_id DROP NOT NULL;

-- 1.2. Thêm các cột phân biệt + metadata của step
ALTER TABLE public.monthly_plan_items
    ADD COLUMN IF NOT EXISTS schedule_state TEXT NOT NULL DEFAULT 'monthly_plan',
    ADD COLUMN IF NOT EXISTS workflow_node_id UUID,
    ADD COLUMN IF NOT EXISTS phase TEXT,
    ADD COLUMN IF NOT EXISTS step_code TEXT,
    ADD COLUMN IF NOT EXISTS step_order INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS assignee_role TEXT,
    ADD COLUMN IF NOT EXISTS legal_basis TEXT,
    ADD COLUMN IF NOT EXISTS output_document TEXT,
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS duration_days INTEGER,
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS workflow_id UUID;

-- 1.3. CHECK constraint cho schedule_state
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'monthly_plan_items_schedule_state_chk'
    ) THEN
        ALTER TABLE public.monthly_plan_items
            ADD CONSTRAINT monthly_plan_items_schedule_state_chk
            CHECK (schedule_state IN ('project_step', 'monthly_plan'));
    END IF;
END $$;

-- 1.4. FK tới workflow_nodes (không cascade — node template không xóa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'monthly_plan_items_workflow_node_fk'
    ) THEN
        ALTER TABLE public.monthly_plan_items
            ADD CONSTRAINT monthly_plan_items_workflow_node_fk
            FOREIGN KEY (workflow_node_id)
            REFERENCES public.workflow_nodes(id)
            ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'monthly_plan_items_workflow_fk'
    ) THEN
        ALTER TABLE public.monthly_plan_items
            ADD CONSTRAINT monthly_plan_items_workflow_fk
            FOREIGN KEY (workflow_id)
            REFERENCES public.workflows(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- 1.5. Đảm bảo: khi schedule_state='monthly_plan' thì monthly_plan_id KHÔNG được NULL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'monthly_plan_items_scheduled_has_plan_chk'
    ) THEN
        ALTER TABLE public.monthly_plan_items
            ADD CONSTRAINT monthly_plan_items_scheduled_has_plan_chk
            CHECK (
                (schedule_state = 'project_step' AND monthly_plan_id IS NULL)
                OR
                (schedule_state = 'monthly_plan' AND monthly_plan_id IS NOT NULL)
            ) NOT VALID;  -- NOT VALID để không fail trên data cũ; backfill xong sẽ VALIDATE
    END IF;
END $$;

-- 1.6. Indexes
CREATE INDEX IF NOT EXISTS idx_mpi_project_state
    ON public.monthly_plan_items(project_id, schedule_state);
CREATE INDEX IF NOT EXISTS idx_mpi_state
    ON public.monthly_plan_items(schedule_state);
CREATE INDEX IF NOT EXISTS idx_mpi_workflow_node
    ON public.monthly_plan_items(workflow_node_id);
CREATE INDEX IF NOT EXISTS idx_mpi_phase
    ON public.monthly_plan_items(phase) WHERE phase IS NOT NULL;

-- 1.7. Comments
COMMENT ON COLUMN public.monthly_plan_items.schedule_state IS
    '''project_step'' = bước trong KH dự án (chưa lên KH tháng); ''monthly_plan'' = đã đưa vào KH tháng cụ thể';
COMMENT ON COLUMN public.monthly_plan_items.monthly_plan_id IS
    'NULL khi schedule_state=''project_step''. Set khi user bấm "Sinh KH tháng X"';
COMMENT ON COLUMN public.monthly_plan_items.workflow_node_id IS
    'Tham chiếu template workflow_nodes — chỉ để truy nguồn, không bắt buộc';
COMMENT ON COLUMN public.monthly_plan_items.scheduled_at IS
    'Thời điểm step được gán vào KH tháng (null khi vẫn là project_step)';


-- ─── 2. BACKFILL DATA ──────────────────────────────────────────

-- 2.1. Phân loại MPI cũ:
--      - Nếu status != 'planned' (đã có động thái báo cáo) → giữ là 'monthly_plan'
--      - Còn lại (status='planned', có project_id) → coi như chưa user sinh KH → 'project_step'
--      - MPI không thuộc project (project_id=NULL, nhiệm vụ hành chính KH khung) → giữ 'monthly_plan'
UPDATE public.monthly_plan_items
SET
    schedule_state = 'project_step',
    monthly_plan_id = NULL,
    scheduled_at = NULL
WHERE project_id IS NOT NULL
  AND status = 'planned';

UPDATE public.monthly_plan_items
SET
    schedule_state = 'monthly_plan',
    scheduled_at = COALESCE(scheduled_at, created_at)
WHERE schedule_state = 'monthly_plan';

-- 2.2. Copy metadata từ tasks → mpi (phase, step_code, workflow_node_id, ...)
UPDATE public.monthly_plan_items mpi
SET
    phase = COALESCE(mpi.phase, t.phase),
    step_code = COALESCE(mpi.step_code, t.step_code),
    workflow_node_id = COALESCE(mpi.workflow_node_id, t.workflow_node_id),
    workflow_id = COALESCE(mpi.workflow_id, t.workflow_id),
    assignee_role = COALESCE(mpi.assignee_role, t.metadata->>'assignee_role'),
    legal_basis = COALESCE(mpi.legal_basis, t.legal_basis),
    output_document = COALESCE(mpi.output_document, t.output_document),
    start_date = COALESCE(mpi.start_date, t.start_date),
    duration_days = COALESCE(mpi.duration_days, t.duration_days),
    step_order = COALESCE(NULLIF(mpi.step_order, 0), t.sort_order, 0)
FROM public.tasks t
WHERE t.monthly_plan_item_id = mpi.id;

-- 2.3. Tạo MPI cho task project chưa có (đảm bảo mọi task project đều có step)
INSERT INTO public.monthly_plan_items (
    id, project_id, schedule_state, monthly_plan_id,
    task_name, deliverable, due_date, start_date, duration_days,
    phase, step_code, workflow_node_id, workflow_id, assignee_role,
    legal_basis, output_document,
    status, source_task_id, source_type, sort_order, step_order, group_name
)
SELECT
    gen_random_uuid(),
    t.project_id,
    'project_step',
    NULL,
    t.title,
    t.description,
    t.due_date,
    t.start_date,
    t.duration_days,
    t.phase,
    t.step_code,
    t.workflow_node_id,
    t.workflow_id,
    t.metadata->>'assignee_role',
    t.legal_basis,
    t.output_document,
    CASE t.status
        WHEN 'done' THEN 'completed'::monthly_task_status
        WHEN 'in_progress' THEN 'planned'::monthly_task_status
        ELSE 'planned'::monthly_task_status
    END,
    t.id,
    'from_project_task',
    COALESCE(t.sort_order, 0),
    COALESCE(t.sort_order, 0),
    CASE t.phase
        WHEN 'preparation' THEN 'Giai đoạn Chuẩn bị đầu tư'
        WHEN 'completion'  THEN 'Giai đoạn Kết thúc dự án'
        WHEN 'closing'     THEN 'Giai đoạn Kết thúc dự án'
        ELSE 'Giai đoạn Thực hiện xây lắp'
    END
FROM public.tasks t
WHERE t.task_type = 'project'
  AND t.monthly_plan_item_id IS NULL
  AND t.parent_id IS NULL
  AND t.project_id IS NOT NULL;

-- 2.4. Backfill ngược task.monthly_plan_item_id
UPDATE public.tasks t
SET monthly_plan_item_id = mpi.id
FROM public.monthly_plan_items mpi
WHERE mpi.source_task_id = t.id
  AND t.monthly_plan_item_id IS NULL
  AND t.task_type = 'project';

-- 2.5. VALIDATE constraint sau khi backfill xong
ALTER TABLE public.monthly_plan_items
    VALIDATE CONSTRAINT monthly_plan_items_scheduled_has_plan_chk;


-- ─── 3. SUBTASK CLEANUP (soft — không drop cột, ngừng dùng) ────

-- 3.1. Đánh dấu parent_id deprecated (không xóa cột để rollback an toàn)
COMMENT ON COLUMN public.tasks.parent_id IS
    'DEPRECATED — concept subtask đã bị loại bỏ. Cột giữ lại để rollback an toàn, sẽ xóa ở migration sau.';

-- 3.2. Convert orphan subtasks (parent_id != null) thành flat tasks:
--      - Kế thừa monthly_plan_item_id từ parent
--      - Đặt project_id từ parent nếu thiếu
--      - Set parent_id = NULL
UPDATE public.tasks child
SET
    parent_id = NULL,
    monthly_plan_item_id = COALESCE(child.monthly_plan_item_id, parent.monthly_plan_item_id),
    project_id = COALESCE(child.project_id, parent.project_id),
    workflow_node_id = COALESCE(child.workflow_node_id, parent.workflow_node_id),
    phase = COALESCE(child.phase, parent.phase),
    step_code = COALESCE(child.step_code, parent.step_code),
    task_type = COALESCE(child.task_type, parent.task_type)
FROM public.tasks parent
WHERE child.parent_id = parent.id;

-- 3.3. Dọn metadata.sub_tasks (không còn cần)
UPDATE public.tasks
SET metadata = metadata - 'sub_tasks'
WHERE metadata ? 'sub_tasks';


-- ─── 4. RLS POLICIES (giữ nguyên — đã enable từ migration cũ) ───
-- (không thay đổi RLS, schedule_state không yêu cầu phân quyền riêng)


-- ─── 5. VERIFY (chạy để check) ─────────────────────────────────
DO $$
DECLARE
    orphan_count INT;
    project_step_count INT;
    monthly_count INT;
    task_no_mpi INT;
BEGIN
    -- Số task project không có MPI
    SELECT COUNT(*) INTO task_no_mpi
    FROM public.tasks
    WHERE task_type = 'project'
      AND monthly_plan_item_id IS NULL
      AND parent_id IS NULL
      AND project_id IS NOT NULL;

    -- Số subtask còn lại (phải = 0)
    SELECT COUNT(*) INTO orphan_count
    FROM public.tasks WHERE parent_id IS NOT NULL;

    -- Đếm theo state
    SELECT COUNT(*) INTO project_step_count
    FROM public.monthly_plan_items WHERE schedule_state = 'project_step';

    SELECT COUNT(*) INTO monthly_count
    FROM public.monthly_plan_items WHERE schedule_state = 'monthly_plan';

    RAISE NOTICE 'Migration verify:';
    RAISE NOTICE '  - MPI project_step: %', project_step_count;
    RAISE NOTICE '  - MPI monthly_plan: %', monthly_count;
    RAISE NOTICE '  - Tasks project chưa có MPI: % (kỳ vọng: 0)', task_no_mpi;
    RAISE NOTICE '  - Subtasks còn lại: % (kỳ vọng: 0)', orphan_count;

    IF orphan_count > 0 THEN
        RAISE WARNING 'Vẫn còn % subtasks chưa flatten — kiểm tra bằng SELECT * FROM tasks WHERE parent_id IS NOT NULL', orphan_count;
    END IF;
END $$;
