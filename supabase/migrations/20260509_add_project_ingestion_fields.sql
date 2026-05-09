-- Migration: Add fields to projects table for investment projects ingestion
-- Date: 2026-05-09

-- 1. Add management_board column to store the department/board in charge (1, 2, or 3)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS management_board INTEGER;
COMMENT ON COLUMN projects.management_board IS 'Phòng điều hành dự án phụ trách (1, 2, 3)';

-- 2. Add decision_level_before_handover column to store the decision level before handover ('H' = Huyện, 'T' = Tỉnh)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS decision_level_before_handover TEXT;
COMMENT ON COLUMN projects.decision_level_before_handover IS 'Cấp QĐ đầu tư trước bàn giao (H = Huyện, T = Tỉnh)';

-- 3. Add old_investor column to store the name of the previous investor/owner
ALTER TABLE projects ADD COLUMN IF NOT EXISTS old_investor TEXT;
COMMENT ON COLUMN projects.old_investor IS 'Chủ đầu tư cũ';

-- 4. Add transfer_decision column to store the transfer decision code/name
ALTER TABLE projects ADD COLUMN IF NOT EXISTS transfer_decision TEXT;
COMMENT ON COLUMN projects.transfer_decision IS 'Quyết định chuyển chủ đầu tư';

-- 5. Add current_status_code column to store the detailed status from 1 to 10
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_status_code INTEGER;
COMMENT ON COLUMN projects.current_status_code IS 'Trạng thái chi tiết (1 đến 10)';
