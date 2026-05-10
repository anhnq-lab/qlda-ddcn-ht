-- ═══════════════════════════════════════════════════════════════
-- CDE Internal Workflow Schema
-- Quy trình nội bộ giữa các phòng ban trong Ban QLDA
-- Ví dụ: QT.04.QTVDTDAHT — Quyết toán vốn đầu tư dự án hoàn thành
-- ═══════════════════════════════════════════════════════════════

-- Enum: trạng thái instance
DO $$ BEGIN
  CREATE TYPE internal_workflow_instance_status AS ENUM (
    'draft', 'in_progress', 'completed', 'rejected', 'on_hold'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enum: trạng thái từng bước
DO $$ BEGIN
  CREATE TYPE internal_step_status AS ENUM (
    'waiting', 'pending', 'done', 'rejected', 'skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Bảng: cde_internal_workflow_instances ───────────────────────────────────
-- Mỗi row = 1 hồ sơ đang lưu chuyển theo 1 quy trình nội bộ

CREATE TABLE IF NOT EXISTS cde_internal_workflow_instances (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       text NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    doc_id           integer REFERENCES documents(doc_id) ON DELETE SET NULL,
    template_id      text NOT NULL,        -- ID template (khớp với frontend constant)
    template_code    text NOT NULL,        -- VD: 'QT.04.QTVDTDAHT'
    template_name    text NOT NULL,        -- Tên hiển thị
    title            text NOT NULL,        -- Tiêu đề hồ sơ cụ thể
    current_step_no  int NOT NULL DEFAULT 1,
    status           internal_workflow_instance_status NOT NULL DEFAULT 'in_progress',
    created_by       text NOT NULL,        -- EmployeeID người tạo
    created_by_name  text NOT NULL DEFAULT '',
    started_at       timestamptz NOT NULL DEFAULT now(),
    completed_at     timestamptz,
    due_date         timestamptz,
    metadata         jsonb NOT NULL DEFAULT '{}',
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cwi_project ON cde_internal_workflow_instances(project_id);
CREATE INDEX IF NOT EXISTS idx_cwi_status  ON cde_internal_workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_cwi_doc     ON cde_internal_workflow_instances(doc_id) WHERE doc_id IS NOT NULL;

-- ─── Bảng: cde_internal_workflow_step_records ────────────────────────────────
-- Lịch sử xử lý từng bước của mỗi instance

CREATE TABLE IF NOT EXISTS cde_internal_workflow_step_records (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id      uuid NOT NULL REFERENCES cde_internal_workflow_instances(id) ON DELETE CASCADE,
    step_no          int NOT NULL,
    step_code        text NOT NULL,
    step_name        text NOT NULL,
    department       text NOT NULL,        -- InternalDepartment enum value
    department_label text NOT NULL DEFAULT '',
    actor_id         text,                 -- EmployeeID người xử lý
    actor_name       text,
    status           internal_step_status NOT NULL DEFAULT 'waiting',
    comment          text NOT NULL DEFAULT '',
    attachments      text[] NOT NULL DEFAULT '{}',
    acted_at         timestamptz,
    deadline         timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cwsr_instance ON cde_internal_workflow_step_records(instance_id);
CREATE INDEX IF NOT EXISTS idx_cwsr_step     ON cde_internal_workflow_step_records(instance_id, step_no);

-- ─── Function: auto-update updated_at ────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_cwi_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cwi_updated_at ON cde_internal_workflow_instances;
CREATE TRIGGER trg_cwi_updated_at
  BEFORE UPDATE ON cde_internal_workflow_instances
  FOR EACH ROW EXECUTE FUNCTION update_cwi_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE cde_internal_workflow_instances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cde_internal_workflow_step_records  ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see instances for their projects
CREATE POLICY "cwi_select" ON cde_internal_workflow_instances
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cwi_insert" ON cde_internal_workflow_instances
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "cwi_update" ON cde_internal_workflow_instances
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "cwsr_select" ON cde_internal_workflow_step_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cwsr_insert" ON cde_internal_workflow_step_records
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "cwsr_update" ON cde_internal_workflow_step_records
  FOR UPDATE TO authenticated USING (true);
