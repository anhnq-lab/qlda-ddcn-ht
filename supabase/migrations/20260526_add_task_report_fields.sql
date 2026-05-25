-- Migration: Thêm 4 fields phục vụ báo cáo tháng vào bảng tasks
-- Context: Chuẩn hóa báo cáo công việc 5 phòng (KTTD, PTDV, QLDA1, QLDA2, QLDA3)
--          sang module Task để tự động tổng hợp Báo cáo giao ban tháng.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS completion_result TEXT,
  ADD COLUMN IF NOT EXISTS incomplete_reason TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index cho query báo cáo tháng (filter by assignee + due_date range + category)
CREATE INDEX IF NOT EXISTS idx_tasks_report
  ON public.tasks (assignee_id, due_date, category)
  WHERE status IS NOT NULL;

COMMENT ON COLUMN public.tasks.category IS 'Phân loại: dieu_hanh, tham_dinh, thi_cong, quyet_toan, thanh_toan, gpmb, dau_thau, dieu_chinh, gop_y, bao_cao, kiem_tra, ban_giao, khac';
COMMENT ON COLUMN public.tasks.completion_result IS 'Kết quả thực hiện cụ thể trong kỳ báo cáo';
COMMENT ON COLUMN public.tasks.incomplete_reason IS 'Lý do chưa hoàn thành / vướng mắc';
COMMENT ON COLUMN public.tasks.notes IS 'Ghi chú bổ sung';
