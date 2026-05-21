-- Migration: Create Public Assets Management Module Tables
-- Target: Supabase / PostgreSQL

-- 1. Create public_asset_categories table
CREATE TABLE IF NOT EXISTS public.public_asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES public.public_asset_categories(id) ON DELETE SET NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('tangible', 'intangible')),
    depreciation_rate NUMERIC(5,2) DEFAULT 0.00, -- % per year
    useful_life_years INTEGER DEFAULT 0, -- useful life in years
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create public_assets table
CREATE TABLE IF NOT EXISTS public.public_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code VARCHAR(100) UNIQUE NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL REFERENCES public.public_asset_categories(id),
    description TEXT,
    unit VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    location VARCHAR(255),
    department VARCHAR(100),
    custodian_id TEXT REFERENCES public.employees(employee_id) ON DELETE SET NULL,
    project_id TEXT REFERENCES public.projects(project_id) ON DELETE SET NULL,
    
    -- Purchase & Use Dates
    purchase_date DATE NOT NULL,
    use_date DATE NOT NULL,
    
    -- Value tracking (historical cost)
    original_cost NUMERIC(20,2) NOT NULL DEFAULT 0.00 CHECK (original_cost >= 0),
    funding_budget_cost NUMERIC(20,2) DEFAULT 0.00 CHECK (funding_budget_cost >= 0),
    funding_other_cost NUMERIC(20,2) DEFAULT 0.00 CHECK (funding_other_cost >= 0),
    
    -- Depreciation & Net Book Value
    depreciation_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (depreciation_rate >= 0 AND depreciation_rate <= 100),
    accumulated_depreciation NUMERIC(20,2) NOT NULL DEFAULT 0.00 CHECK (accumulated_depreciation >= 0),
    remaining_value NUMERIC(20,2) NOT NULL DEFAULT 0.00 CHECK (remaining_value >= 0),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'liquidated', 'pending_liquidation', 'transferred')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create public_asset_transactions table
CREATE TABLE IF NOT EXISTS public.public_asset_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.public_assets(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('increase', 'decrease', 'revalue', 'repair')),
    reason VARCHAR(100) NOT NULL, -- e.g., 'purchase', 'project_handover', 'liquidation', 'transfer_out', 'upgrade'
    description TEXT,
    decision_number VARCHAR(100),
    decision_date DATE,
    cost_change NUMERIC(20,2) DEFAULT 0.00,
    depreciation_change NUMERIC(20,2) DEFAULT 0.00,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create public_asset_inventories table
CREATE TABLE IF NOT EXISTS public.public_asset_inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    inventory_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create public_asset_inventory_details table
CREATE TABLE IF NOT EXISTS public.public_asset_inventory_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.public_asset_inventories(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.public_assets(id) ON DELETE CASCADE,
    book_quantity INTEGER NOT NULL CHECK (book_quantity >= 0),
    actual_quantity INTEGER NOT NULL CHECK (actual_quantity >= 0),
    difference_quantity INTEGER GENERATED ALWAYS AS (actual_quantity - book_quantity) STORED,
    condition VARCHAR(100), -- 'good', 'damaged', 'need_repair'
    notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_assets_category ON public.public_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_public_assets_custodian ON public.public_assets(custodian_id);
CREATE INDEX IF NOT EXISTS idx_public_assets_project ON public.public_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_public_assets_status ON public.public_assets(status);
CREATE INDEX IF NOT EXISTS idx_public_asset_trans_asset ON public.public_asset_transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_public_asset_trans_date ON public.public_asset_transactions(transaction_date);

-- Enable RLS on all tables
ALTER TABLE public.public_asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_asset_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_asset_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_asset_inventory_details ENABLE ROW LEVEL SECURITY;

-- Policies: Selects for all authenticated users
CREATE POLICY "Select categories allowed" ON public.public_asset_categories FOR SELECT USING (true);
CREATE POLICY "Select assets allowed" ON public.public_assets FOR SELECT USING (true);
CREATE POLICY "Select transactions allowed" ON public.public_asset_transactions FOR SELECT USING (true);
CREATE POLICY "Select inventories allowed" ON public.public_asset_inventories FOR SELECT USING (true);
CREATE POLICY "Select inventory details allowed" ON public.public_asset_inventory_details FOR SELECT USING (true);

-- Policies: Write modifications allowed for all authenticated users
CREATE POLICY "Write assets allowed" ON public.public_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Write transactions allowed" ON public.public_asset_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Write inventories allowed" ON public.public_asset_inventories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Write inventory details allowed" ON public.public_asset_inventory_details FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Categories according to Circular 23/2023/TT-BTC
INSERT INTO public.public_asset_categories (code, name, asset_type, depreciation_rate, useful_life_years) VALUES
('LAND', 'Đất (Khuôn viên trụ sở, cơ sở sự nghiệp)', 'tangible', 0.00, 0),
('BUILDING_HQ', 'Nhà làm việc, nhà trụ sở', 'tangible', 2.00, 50),
('BUILDING_OTHER', 'Nhà khác (Nhà kho, nhà xe, nhà nghỉ công vụ)', 'tangible', 4.00, 25),
('STRUCTURE', 'Vật kiến trúc (Sân bãi, tường rào, đường nội bộ)', 'tangible', 10.00, 10),
('CAR_OFFICIAL', 'Xe ô tô phục vụ công tác chung', 'tangible', 10.00, 10),
('CAR_SPECIAL', 'Xe ô tô chuyên dùng', 'tangible', 10.00, 10),
('VEHICLE_OTHER', 'Phương tiện vận tải khác (Xe máy, xuồng...)', 'tangible', 12.50, 8),
('PC_DESKTOP', 'Máy vi tính để bàn', 'tangible', 20.00, 5),
('PC_LAPTOP', 'Máy vi tính xách tay (Laptop)', 'tangible', 20.00, 5),
('PRINTER_PHOTO', 'Máy in, máy photocopy', 'tangible', 20.00, 5),
('AIR_CON', 'Thiết bị điều hòa không khí', 'tangible', 12.50, 8),
('OFFICE_EQUIP', 'Thiết bị văn phòng khác', 'tangible', 20.00, 5),
('SPECIAL_EQUIP', 'Thiết bị chuyên dùng', 'tangible', 12.50, 8),
('INTANGIBLE_SOFTWARE', 'Phần mềm ứng dụng', 'intangible', 20.00, 5),
('INTANGIBLE_LAND_RIGHT', 'Quyền sử dụng đất', 'intangible', 0.00, 0),
('TANGIBLE_OTHER', 'Tài sản cố định hữu hình khác', 'tangible', 10.00, 10)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, 
    asset_type = EXCLUDED.asset_type, 
    depreciation_rate = EXCLUDED.depreciation_rate, 
    useful_life_years = EXCLUDED.useful_life_years;
