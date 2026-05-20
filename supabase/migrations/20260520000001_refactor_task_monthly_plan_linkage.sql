-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Refactor task - monthly plan linkage from JSONB to column
-- ═══════════════════════════════════════════════════════════════

-- 1. Thêm cột monthly_plan_item_id vật lý
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS monthly_plan_item_id UUID REFERENCES public.monthly_plan_items(id) ON DELETE SET NULL;

-- 2. Di chuyển dữ liệu cũ từ metadata->>'monthly_plan_item_id' sang cột mới
UPDATE public.tasks
  SET monthly_plan_item_id = (metadata->>'monthly_plan_item_id')::uuid
  WHERE (metadata->>'monthly_plan_item_id') IS NOT NULL 
    AND (metadata->>'monthly_plan_item_id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    AND monthly_plan_item_id IS NULL;

-- 3. Tạo index tăng tốc truy vấn lọc
CREATE INDEX IF NOT EXISTS idx_tasks_monthly_plan_item_id ON public.tasks(monthly_plan_item_id);

-- 4. Thêm bình luận mô tả
COMMENT ON COLUMN public.tasks.monthly_plan_item_id IS 'Định danh nhiệm vụ kế hoạch tháng liên kết';
