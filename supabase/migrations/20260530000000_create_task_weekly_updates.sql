-- Migration: Tạo bảng task_weekly_updates cho báo cáo cập nhật tiến độ hằng tuần
-- Và thêm column obstacles vào bảng tasks

-- 1. Thêm column obstacles nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'obstacles') THEN
        ALTER TABLE tasks ADD COLUMN obstacles TEXT;
        COMMENT ON COLUMN tasks.obstacles IS 'Khó khăn / vướng mắc hiện tại của công việc';
    END IF;
END $$;

-- 2. Tạo bảng task_weekly_updates
CREATE TABLE IF NOT EXISTS task_weekly_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 53),
    year INT NOT NULL CHECK (year BETWEEN 2020 AND 2099),
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    progress INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    work_done TEXT,
    obstacles TEXT,
    plan_next_week TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, week_number, year)
);

-- Index cho truy vấn theo task
CREATE INDEX IF NOT EXISTS idx_task_weekly_updates_task_id ON task_weekly_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_task_weekly_updates_week ON task_weekly_updates(year DESC, week_number DESC);

-- Comments
COMMENT ON TABLE task_weekly_updates IS 'Báo cáo cập nhật tiến độ công việc hằng tuần';
COMMENT ON COLUMN task_weekly_updates.week_number IS 'Tuần thứ mấy trong năm (1-53)';
COMMENT ON COLUMN task_weekly_updates.work_done IS 'Kết quả thực hiện trong tuần';
COMMENT ON COLUMN task_weekly_updates.obstacles IS 'Khó khăn, vướng mắc trong tuần';
COMMENT ON COLUMN task_weekly_updates.plan_next_week IS 'Kế hoạch thực hiện tuần tới';

-- RLS
ALTER TABLE task_weekly_updates ENABLE ROW LEVEL SECURITY;

-- Policy: Tất cả authenticated users đều có thể đọc
CREATE POLICY "task_weekly_updates_select" ON task_weekly_updates
    FOR SELECT TO authenticated USING (true);

-- Policy: Authenticated users có thể insert
CREATE POLICY "task_weekly_updates_insert" ON task_weekly_updates
    FOR INSERT TO authenticated WITH CHECK (true);

-- Policy: Chỉ người tạo hoặc admin được update
CREATE POLICY "task_weekly_updates_update" ON task_weekly_updates
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM employees WHERE user_id = auth.uid() AND role IN ('Admin', 'Director')
    ));
