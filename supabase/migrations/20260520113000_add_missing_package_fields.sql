-- Migration: Add missing columns to bidding_packages table
-- Cân bằng schema giữa types và DB.
-- Các cột phục vụ cho:
--   - Báo cáo đấu thầu (bidding_scope, bidders_count, evaluation_bidders_count)
--   - Tiến trình LCNT (bid_opening_date, approval_date_result)
--   - Trạng thái liên kết (contract_id)
--   - Tiến độ thực hiện (completion_pct, completion_updated_at)

ALTER TABLE bidding_packages
  ADD COLUMN IF NOT EXISTS bidding_scope TEXT,
  ADD COLUMN IF NOT EXISTS bidders_count INTEGER,
  ADD COLUMN IF NOT EXISTS evaluation_bidders_count INTEGER,
  ADD COLUMN IF NOT EXISTS bid_opening_date TEXT,
  ADD COLUMN IF NOT EXISTS approval_date_result TEXT,
  ADD COLUMN IF NOT EXISTS completion_pct NUMERIC(5,2) DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS completion_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_id TEXT;
