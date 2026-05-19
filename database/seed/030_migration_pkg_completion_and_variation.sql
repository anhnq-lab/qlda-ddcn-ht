-- ============================================================
-- Migration: Bidding Package Completion & Variation Orders
-- Ngày: 2026-05-19
-- Mô tả:
--   1. Thêm cột completion_pct vào bidding_packages
--   2. Tạo bảng variation_orders (phụ lục điều chỉnh hợp đồng)
-- ============================================================

-- 1. Thêm cột tiến độ vào bidding_packages
ALTER TABLE bidding_packages
    ADD COLUMN IF NOT EXISTS completion_pct      NUMERIC(5,2) DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS completion_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN bidding_packages.completion_pct       IS '% Khối lượng hoàn thành (nhập thủ công, 0-100)';
COMMENT ON COLUMN bidding_packages.completion_updated_at IS 'Thời điểm cập nhật % hoàn thành gần nhất';

-- 2. Tạo bảng variation_orders (phụ lục điều chỉnh hợp đồng)
CREATE TABLE IF NOT EXISTS variation_orders (
    vo_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id         VARCHAR(100) NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
    number              VARCHAR(100),           -- Số phụ lục (VD: PL-01/2025)
    sign_date           DATE,                   -- Ngày ký phụ lục
    content             TEXT,                   -- Nội dung / lý do điều chỉnh
    adjusted_amount     NUMERIC(18,0) DEFAULT 0,-- Giá trị điều chỉnh (âm = giảm, dương = tăng)
    adjusted_duration   INTEGER DEFAULT 0,      -- Điều chỉnh thời gian (số ngày, âm = giảm)
    approval_file       TEXT,                   -- Link file QĐ phê duyệt phụ lục
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_variation_orders_contract ON variation_orders(contract_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_variation_orders_updated_at ON variation_orders;
CREATE TRIGGER trg_variation_orders_updated_at
    BEFORE UPDATE ON variation_orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE variation_orders ENABLE ROW LEVEL SECURITY;

-- Đọc: tất cả user đã xác thực
CREATE POLICY IF NOT EXISTS "variation_orders_select"
    ON variation_orders FOR SELECT
    TO authenticated USING (true);

-- Ghi: tất cả user đã xác thực (điều chỉnh khi cần RLS chặt hơn)
CREATE POLICY IF NOT EXISTS "variation_orders_insert"
    ON variation_orders FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "variation_orders_update"
    ON variation_orders FOR UPDATE
    TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "variation_orders_delete"
    ON variation_orders FOR DELETE
    TO authenticated USING (true);

COMMENT ON TABLE variation_orders IS 'Phụ lục điều chỉnh hợp đồng (tăng/giảm giá trị, thời gian)';
