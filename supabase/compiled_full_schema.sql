-- =========================================================================
-- COMPILED SUPABASE FULL SCHEMA & MIGRATIONS
-- Generated on: 2026-05-09T05:24:49.887Z
-- Contains init_schema.sql + all progressive migrations in chronological order
-- =========================================================================

-- ==========================================
-- FILE: init_schema.sql
-- ==========================================

-- ============================================
-- Initial Schema for Ban DDCN TP.HCM
-- Cloned from smart-public-investment-manager
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gyuxymbmbfvvygvcyyrd/sql
-- ============================================

-- 1. EMPLOYEES
CREATE TABLE IF NOT EXISTS employees (
    employee_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT,
    department TEXT,
    role TEXT NOT NULL DEFAULT 'User',
    status INTEGER NOT NULL DEFAULT 1,
    avatar_url TEXT,
    join_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. USER_ACCOUNTS
CREATE TABLE IF NOT EXISTS user_accounts (
    account_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT REFERENCES employees(employee_id),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '123456',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    project_id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    project_number TEXT,
    group_code TEXT NOT NULL DEFAULT 'C',
    investment_type INTEGER NOT NULL DEFAULT 1,
    total_investment NUMERIC NOT NULL DEFAULT 0,
    capital_source TEXT,
    status INTEGER NOT NULL DEFAULT 0,
    progress NUMERIC DEFAULT 0,
    payment_progress NUMERIC DEFAULT 0,
    start_date TEXT,
    expected_end_date TEXT,
    actual_end_date TEXT,
    location_code TEXT,
    sector TEXT,
    stage TEXT,
    duration TEXT,
    objective TEXT,
    decision_number TEXT,
    decision_date TEXT,
    decision_authority TEXT,
    decision_maker_id TEXT,
    approval_date TEXT,
    competent_authority TEXT,
    investor_name TEXT,
    management_form TEXT,
    construction_type TEXT,
    construction_grade TEXT,
    applicable_standards TEXT,
    is_emergency BOOLEAN NOT NULL DEFAULT false,
    is_oda BOOLEAN DEFAULT false,
    requires_bim BOOLEAN DEFAULT false,
    bim_status TEXT,
    cde_project_code TEXT,
    national_project_code TEXT,
    is_synced BOOLEAN DEFAULT false,
    last_sync_date TEXT,
    sync_error TEXT,
    coordinates JSONB,
    image_url TEXT,
    version TEXT,
    main_contractor_name TEXT,
    design_contractor TEXT,
    supervision_contractor TEXT,
    survey_contractor TEXT,
    feasibility_contractor TEXT,
    review_contractor TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CONSTRUCTION_WORKS
CREATE TABLE IF NOT EXISTS construction_works (
    work_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    work_name TEXT NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    type TEXT,
    grade INTEGER,
    design_level INTEGER,
    address TEXT
);

-- 5. BIDDING_PACKAGES
CREATE TABLE IF NOT EXISTS bidding_packages (
    package_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    package_number TEXT NOT NULL,
    package_name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    estimate_price NUMERIC,
    status TEXT NOT NULL DEFAULT 'pending',
    bid_type TEXT,
    selection_method TEXT,
    contract_type TEXT,
    field TEXT,
    capital_source TEXT,
    duration TEXT,
    bid_fee NUMERIC,
    bid_closing_date TEXT,
    posting_date TEXT,
    notification_code TEXT,
    khlcnt_code TEXT,
    decision_number TEXT,
    decision_date TEXT,
    decision_agency TEXT,
    decision_file TEXT,
    winning_contractor_id TEXT,
    winning_price NUMERIC,
    bidding_scope TEXT,
    bidders_count INTEGER,
    evaluation_bidders_count INTEGER,
    bid_opening_date TEXT,
    approval_date_result TEXT,
    completion_pct NUMERIC(5,2) DEFAULT 0,
    completion_updated_at TIMESTAMPTZ,
    contract_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CONTRACTORS
CREATE TABLE IF NOT EXISTS contractors (
    contractor_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    tax_code TEXT,
    address TEXT,
    representative TEXT,
    contact_info TEXT,
    established_year INTEGER,
    is_foreign BOOLEAN NOT NULL DEFAULT false,
    cap_cert_code TEXT,
    op_license_no TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. CONTRACTS
CREATE TABLE IF NOT EXISTS contracts (
    contract_id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(project_id),
    package_id TEXT REFERENCES bidding_packages(package_id),
    contractor_id TEXT REFERENCES contractors(contractor_id),
    contract_name TEXT,
    contract_type TEXT,
    value NUMERIC NOT NULL DEFAULT 0,
    sign_date TEXT,
    start_date TEXT,
    end_date TEXT,
    duration_months INTEGER,
    status INTEGER NOT NULL DEFAULT 0,
    scope TEXT,
    payment_terms TEXT,
    advance_rate NUMERIC,
    has_vat BOOLEAN DEFAULT true,
    warranty INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. VARIATION_ORDERS
CREATE TABLE IF NOT EXISTS variation_orders (
    vo_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    contract_id TEXT NOT NULL REFERENCES contracts(contract_id),
    number TEXT NOT NULL,
    content TEXT,
    adjusted_amount NUMERIC NOT NULL DEFAULT 0,
    adjusted_duration INTEGER,
    sign_date TEXT,
    approval_file TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    contract_id TEXT NOT NULL REFERENCES contracts(contract_id),
    project_id TEXT REFERENCES projects(project_id),
    batch_no INTEGER NOT NULL DEFAULT 1,
    type TEXT NOT NULL DEFAULT 'interim',
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    description TEXT,
    request_date TEXT,
    approved_date TEXT,
    approved_by TEXT,
    paid_date TEXT,
    treasury_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. CAPITAL_PLANS
CREATE TABLE IF NOT EXISTS capital_plans (
    plan_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    year INTEGER NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    disbursed_amount NUMERIC NOT NULL DEFAULT 0,
    source TEXT,
    decision_number TEXT,
    date_assigned TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. DISBURSEMENTS
CREATE TABLE IF NOT EXISTS disbursements (
    disbursement_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    capital_plan_id TEXT REFERENCES capital_plans(plan_id),
    payment_id INTEGER REFERENCES payments(payment_id),
    amount NUMERIC NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    form_type TEXT,
    treasury_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
    doc_id SERIAL PRIMARY KEY,
    doc_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    category INTEGER NOT NULL DEFAULT 0,
    project_id TEXT REFERENCES projects(project_id),
    folder_id TEXT,
    uploaded_by TEXT,
    upload_date TEXT NOT NULL DEFAULT now()::text,
    version TEXT,
    revision TEXT,
    size TEXT,
    reference_id TEXT,
    iso_status TEXT,
    is_digitized BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. FOLDERS
CREATE TABLE IF NOT EXISTS folders (
    folder_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES folders(folder_id),
    path TEXT NOT NULL,
    type TEXT
);

-- 14. TASKS
CREATE TABLE IF NOT EXISTS tasks (
    task_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    assignee_id TEXT,
    approver_id TEXT,
    due_date TEXT,
    phase TEXT,
    step_code TEXT,
    progress NUMERIC DEFAULT 0,
    duration_days INTEGER,
    estimated_cost NUMERIC,
    legal_basis TEXT,
    output_document TEXT,
    predecessor_task_id TEXT,
    actual_start_date TEXT,
    actual_end_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. SUB_TASKS
CREATE TABLE IF NOT EXISTS sub_tasks (
    sub_task_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id TEXT NOT NULL REFERENCES tasks(task_id),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    assignee_id TEXT,
    due_date TEXT
);

-- 16. PROJECT_MEMBERS
CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    employee_id TEXT NOT NULL REFERENCES employees(employee_id),
    role TEXT,
    joined_at TIMESTAMPTZ DEFAULT now()
);

-- 17. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. BIM_MODELS
CREATE TABLE IF NOT EXISTS bim_models (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    file_name TEXT NOT NULL,
    file_size BIGINT,
    ifc_path TEXT,
    frag_path TEXT,
    properties_path TEXT,
    status TEXT DEFAULT 'uploaded',
    discipline TEXT,
    element_count INTEGER,
    error_message TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 19. FACILITY_ASSETS
CREATE TABLE IF NOT EXISTS facility_assets (
    asset_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    asset_name TEXT NOT NULL,
    asset_code TEXT,
    category TEXT,
    location TEXT,
    manufacturer TEXT,
    model TEXT,
    install_date TEXT,
    warranty_expiry TEXT,
    condition TEXT,
    status TEXT DEFAULT 'active',
    bim_element_id TEXT,
    maintenance_cycle_days INTEGER,
    last_maintenance TEXT,
    next_maintenance TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 20. FEASIBILITY_STUDIES
CREATE TABLE IF NOT EXISTS feasibility_studies (
    report_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    report_type TEXT,
    total_investment NUMERIC,
    construction_scale TEXT,
    main_technology TEXT,
    design_phases INTEGER,
    environmental_approval TEXT,
    approval_number TEXT,
    approval_date TEXT,
    approval_authority TEXT,
    document_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. INVESTMENT_POLICY_DECISIONS
CREATE TABLE IF NOT EXISTS investment_policy_decisions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    decision_number TEXT NOT NULL,
    decision_date TEXT,
    authority TEXT,
    objectives TEXT,
    location TEXT,
    duration TEXT,
    preliminary_investment NUMERIC,
    capital_sources TEXT[],
    document_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. PACKAGE_ISSUES
CREATE TABLE IF NOT EXISTS package_issues (
    issue_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    package_id TEXT NOT NULL REFERENCES bidding_packages(package_id),
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    reporter TEXT,
    reported_date TEXT NOT NULL DEFAULT now()::text
);

-- 23. STAGE_TRANSITIONS
CREATE TABLE IF NOT EXISTS stage_transitions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    stage TEXT NOT NULL,
    start_date TEXT NOT NULL DEFAULT now()::text,
    end_date TEXT,
    decision_number TEXT,
    decision_date TEXT,
    notes TEXT
);

-- ============================================
-- RLS: Enable + Permissive policies for dev
-- ============================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidding_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE variation_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feasibility_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_policy_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_transitions ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'employees','user_accounts','projects','construction_works',
        'bidding_packages','contractors','contracts','variation_orders',
        'payments','capital_plans','disbursements','documents','folders',
        'tasks','sub_tasks','project_members','audit_logs','bim_models',
        'facility_assets','feasibility_studies','investment_policy_decisions',
        'package_issues','stage_transitions'
    ]) LOOP
        EXECUTE format('CREATE POLICY "allow_all_select_%s" ON %I FOR SELECT USING (true)', t, t);
        EXECUTE format('CREATE POLICY "allow_all_insert_%s" ON %I FOR INSERT WITH CHECK (true)', t, t);
        EXECUTE format('CREATE POLICY "allow_all_update_%s" ON %I FOR UPDATE USING (true) WITH CHECK (true)', t, t);
        EXECUTE format('CREATE POLICY "allow_all_delete_%s" ON %I FOR DELETE USING (true)', t, t);
    END LOOP;
END $$;

-- ============================================
-- SEED: Admin + Ban Giám đốc
-- ============================================
INSERT INTO employees (employee_id, full_name, position, department, role, status) VALUES
    ('NV001', 'Quản trị viên', 'Quản trị hệ thống', 'Ban Giám đốc', 'Admin', 1),
    ('NV002', 'Nguyễn Quang Linh', 'Giám đốc Ban', 'Ban Giám đốc', 'Director', 1),
    ('NV003', 'Trần Ngọc Bảo', 'Phó Giám đốc Ban', 'Ban Giám đốc', 'DeputyDirector', 1),
    ('NV004', 'Nguyễn Văn Nhân', 'Phó Giám đốc Ban', 'Ban Giám đốc', 'DeputyDirector', 1),
    ('NV040', 'Ngô Đức Quy', 'Phó Giám đốc Ban', 'Ban Giám đốc', 'DeputyDirector', 1)
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO user_accounts (employee_id, username, password_hash) VALUES
    ('NV001', 'Admin', '123456'),
    ('NV002', 'LINH.NQ', '123456'),
    ('NV003', 'BAO.TN', '123456'),
    ('NV004', 'NHAN.NV', '123456'),
    ('NV040', 'QUY.ND', '123456')
ON CONFLICT (username) DO NOTHING;


-- ==========================================
-- MIGRATION: 20260322_add_construction_specs.sql
-- ==========================================

-- Migration: Add construction specification columns to projects table
-- 9 trường kỹ thuật công trình

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS total_estimate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS site_area numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS construction_area numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS floor_area numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS building_height numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS building_density numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS land_use_coefficient numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS above_ground_floors integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS basement_floors integer DEFAULT 0;

COMMENT ON COLUMN projects.total_estimate IS 'Tổng dự toán (VNĐ)';
COMMENT ON COLUMN projects.site_area IS 'Diện tích khu đất (m²)';
COMMENT ON COLUMN projects.construction_area IS 'Diện tích xây dựng (m²)';
COMMENT ON COLUMN projects.floor_area IS 'Diện tích sàn sử dụng (m²)';
COMMENT ON COLUMN projects.building_height IS 'Chiều cao công trình (m)';
COMMENT ON COLUMN projects.building_density IS 'Mật độ xây dựng (%)';
COMMENT ON COLUMN projects.land_use_coefficient IS 'Hệ số sử dụng đất';
COMMENT ON COLUMN projects.above_ground_floors IS 'Số tầng nổi';
COMMENT ON COLUMN projects.basement_floors IS 'Số tầng hầm';


-- ==========================================
-- MIGRATION: 20260327101500_add_direct_appointment_fields.sql
-- ==========================================

-- Add Direct Appointment fields to package_bidders
ALTER TABLE public.package_bidders
  ADD COLUMN IF NOT EXISTS negotiated_price NUMERIC,
  ADD COLUMN IF NOT EXISTS appointment_reason TEXT,
  ADD COLUMN IF NOT EXISTS decision_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS decision_date DATE,
  ADD COLUMN IF NOT EXISTS decision_agency VARCHAR(255),
  ADD COLUMN IF NOT EXISTS legal_basis VARCHAR(255),
  ADD COLUMN IF NOT EXISTS hsyc_date DATE,
  ADD COLUMN IF NOT EXISTS hsdx_date DATE;


-- ==========================================
-- MIGRATION: 20260327110000_cascade_project_delete.sql
-- ==========================================

-- Bidding Packages
ALTER TABLE bidding_packages DROP CONSTRAINT IF EXISTS bidding_packages_project_id_fkey;
ALTER TABLE bidding_packages ADD CONSTRAINT bidding_packages_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;
ALTER TABLE bidding_packages DROP CONSTRAINT IF EXISTS fk_bidding_packages_winning_contractor_id;
ALTER TABLE bidding_packages ADD CONSTRAINT fk_bidding_packages_winning_contractor_id FOREIGN KEY (winning_contractor_id) REFERENCES contractors(contractor_id) ON DELETE SET NULL;

-- BIM Models
ALTER TABLE bim_models DROP CONSTRAINT IF EXISTS bim_models_project_id_fkey;
ALTER TABLE bim_models ADD CONSTRAINT bim_models_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Capital Plans
ALTER TABLE capital_plans DROP CONSTRAINT IF EXISTS capital_plans_project_id_fkey;
ALTER TABLE capital_plans ADD CONSTRAINT capital_plans_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Construction Works
ALTER TABLE construction_works DROP CONSTRAINT IF EXISTS construction_works_project_id_fkey;
ALTER TABLE construction_works ADD CONSTRAINT construction_works_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Contracts
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_project_id_fkey;
ALTER TABLE contracts ADD CONSTRAINT contracts_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Disbursement Plans
ALTER TABLE disbursement_plans DROP CONSTRAINT IF EXISTS disbursement_plans_project_id_fkey;
ALTER TABLE disbursement_plans ADD CONSTRAINT disbursement_plans_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Disbursements
ALTER TABLE disbursements DROP CONSTRAINT IF EXISTS disbursements_project_id_fkey;
ALTER TABLE disbursements ADD CONSTRAINT disbursements_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Documents
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_project_id_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Facility Assets
ALTER TABLE facility_assets DROP CONSTRAINT IF EXISTS facility_assets_project_id_fkey;
ALTER TABLE facility_assets ADD CONSTRAINT facility_assets_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Feasibility Studies
ALTER TABLE feasibility_studies DROP CONSTRAINT IF EXISTS feasibility_studies_project_id_fkey;
ALTER TABLE feasibility_studies ADD CONSTRAINT feasibility_studies_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Investment Policy Decisions
ALTER TABLE investment_policy_decisions DROP CONSTRAINT IF EXISTS investment_policy_decisions_project_id_fkey;
ALTER TABLE investment_policy_decisions ADD CONSTRAINT investment_policy_decisions_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_project_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Project Members
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_project_id_fkey;
ALTER TABLE project_members ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Stage Transitions
ALTER TABLE stage_transitions DROP CONSTRAINT IF EXISTS stage_transitions_project_id_fkey;
ALTER TABLE stage_transitions ADD CONSTRAINT stage_transitions_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Tasks (Ensure the task relates to the parent project)
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Secondary Tables (Grandchild dependencies)

-- Variation Orders
ALTER TABLE variation_orders DROP CONSTRAINT IF EXISTS variation_orders_contract_id_fkey;
ALTER TABLE variation_orders ADD CONSTRAINT variation_orders_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES contracts(contract_id) ON DELETE CASCADE;

-- Package Issues
ALTER TABLE package_issues DROP CONSTRAINT IF EXISTS package_issues_package_id_fkey;
ALTER TABLE package_issues ADD CONSTRAINT package_issues_package_id_fkey FOREIGN KEY (package_id) REFERENCES bidding_packages(package_id) ON DELETE CASCADE;

-- Package Bidders
ALTER TABLE package_bidders DROP CONSTRAINT IF EXISTS package_bidders_package_id_fkey;
ALTER TABLE package_bidders ADD CONSTRAINT package_bidders_package_id_fkey FOREIGN KEY (package_id) REFERENCES bidding_packages(package_id) ON DELETE CASCADE;

-- Settlement Records
ALTER TABLE settlement_records DROP CONSTRAINT IF EXISTS settlement_records_contract_id_fkey;
ALTER TABLE settlement_records ADD CONSTRAINT settlement_records_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES contracts(contract_id) ON DELETE CASCADE;

-- Acceptance Records
ALTER TABLE acceptance_records DROP CONSTRAINT IF EXISTS acceptance_records_contract_id_fkey;
ALTER TABLE acceptance_records ADD CONSTRAINT acceptance_records_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES contracts(contract_id) ON DELETE CASCADE;

-- Re-apply CASCADE for Package -> Contracts and Contracts -> Payments just in case Postgres deletes in wrong order
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_package_id_fkey;
ALTER TABLE contracts ADD CONSTRAINT contracts_package_id_fkey FOREIGN KEY (package_id) REFERENCES bidding_packages(package_id) ON DELETE CASCADE;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_contract_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES contracts(contract_id) ON DELETE CASCADE;

ALTER TABLE disbursements DROP CONSTRAINT IF EXISTS disbursements_capital_plan_id_fkey;
ALTER TABLE disbursements ADD CONSTRAINT disbursements_capital_plan_id_fkey FOREIGN KEY (capital_plan_id) REFERENCES capital_plans(plan_id) ON DELETE CASCADE;

ALTER TABLE disbursements DROP CONSTRAINT IF EXISTS disbursements_payment_id_fkey;
ALTER TABLE disbursements ADD CONSTRAINT disbursements_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE;



-- ==========================================
-- MIGRATION: 20260329181500_add_workflow_delete_policies.sql
-- ==========================================

-- Add DELETE policies for project_workflows and project_workflow_steps
-- This is required to allow cascading deletes when a project is deleted (ON DELETE CASCADE)

CREATE POLICY "project_workflows_delete" ON "public"."project_workflows"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "project_wf_steps_delete" ON "public"."project_workflow_steps"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);


-- ==========================================
-- MIGRATION: 20260329202600_core_iso_workflow_schema.sql
-- ==========================================

-- V1 of ISO Workflow Engine Core Schema
-- Đây là "Trái tim" của hệ thống phê duyệt cho toàn bộ Ban QLDA (Dự án, Tài chính, Hành chính, Nhân sự)

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'iso_workflow_category') THEN
        CREATE TYPE iso_workflow_category AS ENUM ('project', 'document', 'finance', 'hr', 'asset', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'iso_workflow_node_type') THEN
        CREATE TYPE iso_workflow_node_type AS ENUM ('start', 'end', 'approval', 'input', 'automated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'iso_workflow_instance_status') THEN
        CREATE TYPE iso_workflow_instance_status AS ENUM ('draft', 'in_progress', 'completed', 'rejected', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'iso_workflow_task_status') THEN
        CREATE TYPE iso_workflow_task_status AS ENUM ('pending', 'completed', 'skipped', 'transferred');
    END IF;
END
$$;

-- 2. QUY TRÌNH GỐC (Định nghĩa)
CREATE TABLE IF NOT EXISTS public.iso_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category iso_workflow_category DEFAULT 'other',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb, -- Cấu hình nâng cao (biểu tượng, màu sắc...)
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CÁC ĐIỂM NÚT (Steps/Nodes)
CREATE TABLE IF NOT EXISTS public.iso_workflow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.iso_workflows(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type iso_workflow_node_type DEFAULT 'approval',
    assignee_role VARCHAR(100), -- VD: 'project_manager', 'director', 'accountant'
    sla_formula VARCHAR(255), -- VD: '15d', hoặc 'context.amount > 50 ? 5d : 2d' (hỗ trợ code chạy biến động)
    form_config JSONB DEFAULT '{}'::jsonb, -- VD: [ { field: 'nguoi_ky', type: 'user_select', required: true } ]
    metadata JSONB DEFAULT '{}'::jsonb, -- Tọa độ hiển thị trên Canvas (x, y)
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LUỒNG CHẢY (Edges / Branching logic)
CREATE TABLE IF NOT EXISTS public.iso_workflow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.iso_workflows(id) ON DELETE CASCADE NOT NULL,
    source_node UUID REFERENCES public.iso_workflow_nodes(id) ON DELETE CASCADE,
    target_node UUID REFERENCES public.iso_workflow_nodes(id) ON DELETE CASCADE,
    condition_expr TEXT, -- VD: 'action == "APPROVE"' hoặc 'form.total > 500'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LƯỢT CHẠY THỰC TẾ (Instances / Runs)
-- Mỗi khi tạo một Đề xuất, 1 Dự án, 1 Công văn... cần chạy quy trình thì sinh ra dòng này
CREATE TABLE IF NOT EXISTS public.iso_workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.iso_workflows(id) ON DELETE RESTRICT NOT NULL,
    reference_id UUID, -- Khoá ngoại mềm trỏ tới bảng dự án, tờ trình, công văn...
    reference_type VARCHAR(100), -- VD: 'project', 'contract_payment'
    status iso_workflow_instance_status DEFAULT 'in_progress',
    current_node_id UUID REFERENCES public.iso_workflow_nodes(id),
    context_data JSONB DEFAULT '{}'::jsonb, -- Gom góp mọi dữ liệu (Form) dọc đường đi
    created_by UUID REFERENCES auth.users(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GIAO VIỆC & LƯU LỊCH SỬ DUYỆT (Audit Trail - Tuân thủ ISO)
-- Dùng để query trang "My Tasks"
CREATE TABLE IF NOT EXISTS public.iso_workflow_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.iso_workflow_instances(id) ON DELETE CASCADE NOT NULL,
    node_id UUID REFERENCES public.iso_workflow_nodes(id) ON DELETE RESTRICT NOT NULL,
    assignee_id UUID REFERENCES auth.users(id), -- Người bị giao việc
    status iso_workflow_task_status DEFAULT 'pending',
    action_taken VARCHAR(100), -- VD: 'APPROVED', 'REJECTED', 'RETURNED'
    comments TEXT, -- Ý kiến chỉ đạo/lý do từ chối
    digital_signature JSONB, -- [Tùy chọn] Lưu token ký số/mật khẩu cấp 2
    due_date TIMESTAMPTZ, -- Hạn chót dựa trên SLA
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- trigger_set_timestamp function (nếu chưa có)
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers cập nhật thời gian
CREATE TRIGGER set_timestamp_iso_workflows
BEFORE UPDATE ON public.iso_workflows
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_iso_workflow_nodes
BEFORE UPDATE ON public.iso_workflow_nodes
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_iso_workflow_instances
BEFORE UPDATE ON public.iso_workflow_instances
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 8. Row Level Security (RLS) Policies căn bản
ALTER TABLE public.iso_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_workflow_tasks ENABLE ROW LEVEL SECURITY;

-- Mọi người đều được xem định nghĩa quy trình
CREATE POLICY "Cho phép xem định nghĩa quy trình" ON public.iso_workflows FOR SELECT USING (true);
CREATE POLICY "Cho phép xem node quy trình" ON public.iso_workflow_nodes FOR SELECT USING (true);
CREATE POLICY "Cho phép xem edge quy trình" ON public.iso_workflow_edges FOR SELECT USING (true);

-- Cho phép nhân sự xem các Instance (hồ sơ) liên quan đến mình
CREATE POLICY "Xem hồ sơ tạo ra hoặc được assign" ON public.iso_workflow_instances 
FOR SELECT USING (
    created_by = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM public.iso_workflow_tasks t WHERE t.instance_id = public.iso_workflow_instances.id AND t.assignee_id = auth.uid())
);

-- Cho phép nhân sự xem nhiệm vụ (My Tasks) của chính mình
CREATE POLICY "Xem việc của tôi" ON public.iso_workflow_tasks 
FOR SELECT USING (assignee_id = auth.uid() OR EXISTS (SELECT 1 FROM public.iso_workflow_instances ctx WHERE ctx.id = instance_id AND ctx.created_by = auth.uid()));

-- Cho phép cập nhật Task (Duyệt/Ký)
CREATE POLICY "Cập nhật task của chính mình" ON public.iso_workflow_tasks 
FOR UPDATE USING (assignee_id = auth.uid());


-- ==========================================
-- MIGRATION: 20260329204000_drop_legacy_workflow.sql
-- ==========================================

-- Drop legacy workflow tables
DROP TABLE IF EXISTS project_workflow_steps CASCADE;
DROP TABLE IF EXISTS project_workflows CASCADE;
DROP TABLE IF EXISTS workflow_step_templates CASCADE;
DROP TABLE IF EXISTS workflow_templates CASCADE;


-- ==========================================
-- MIGRATION: 20260329204500_seed_iso_workflows.sql
-- ==========================================

-- Tắt checking để insert dễ dàng nếu cần (hoặc dùng DO block)
DO $$
DECLARE
    v_wf_qn uuid;
    v_wf_a uuid;
    v_wf_b uuid;
    v_wf_c uuid;
    v_wf_c_ktkt uuid;
    v_node_id uuid;
    v_prev_node_id uuid;
    
    TYPE t_step IS RECORD (
        code VARCHAR,
        name VARCHAR,
        type VARCHAR,
        sla_qn INT,
        sla_a INT,
        sla_b INT,
        sla_c INT,
        sla_c_ktkt INT,
        skip_ktkt BOOLEAN
    );
    
    v_steps t_step[];
    v_step t_step;
BEGIN
    -- Xoá dữ liệu cấu hình cũ (nếu có)
    DELETE FROM iso_workflows WHERE category = 'project';

    -- 1. Create Workflows
    INSERT INTO iso_workflows (name, code, description, category, version, is_active)
    VALUES ('Quy trình ISO Quan trọng Quốc gia', 'ISO-QN', '17 bước vòng đời dự án đầu tư công chuẩn ISO 9001 (Sổ tay Hành chính 2025).', 'project', 1, true)
    RETURNING id INTO v_wf_qn;

    INSERT INTO iso_workflows (name, code, description, category, version, is_active)
    VALUES ('Quy trình ISO Nhóm dự án A', 'ISO-A', '17 bước vòng đời dự án', 'project', 1, true)
    RETURNING id INTO v_wf_a;

    INSERT INTO iso_workflows (name, code, description, category, version, is_active)
    VALUES ('Quy trình ISO Nhóm dự án B', 'ISO-B', '17 bước vòng đời dự án', 'project', 1, true)
    RETURNING id INTO v_wf_b;

    INSERT INTO iso_workflows (name, code, description, category, version, is_active)
    VALUES ('Quy trình ISO Nhóm C (Báo cáo NCKT)', 'ISO-C', '17 bước vòng đời dự án (Dự án có TK Cơ sở)', 'project', 1, true)
    RETURNING id INTO v_wf_c;

    INSERT INTO iso_workflows (name, code, description, category, version, is_active)
    VALUES ('Quy trình ISO Nhóm C (Báo cáo KT-KT)', 'ISO-C_KTKT', 'Rút gọn bước thiết kế bản vẽ thi công', 'project', 1, true)
    RETURNING id INTO v_wf_c_ktkt;

    -- 2. Define Master Steps
    v_steps := ARRAY[
        ROW('CBTD-01', 'Lập hồ sơ CTĐT', 'start', 45, 45, 30, 30, 30, false)::t_step,
        ROW('CBTD-02', 'Thẩm định hồ sơ CTĐT', 'approval', 45, 45, 30, 30, 30, false)::t_step,
        ROW('CBTD-03', 'Phê duyệt CTĐT', 'approval', 15, 15, 10, 10, 10, false)::t_step,
        ROW('CBTD-04', 'Lập Dự án đầu tư / Báo cáo KT-KT', 'input', 60, 45, 30, 20, 20, false)::t_step,
        ROW('CBTD-05', 'Thỏa thuận chuyên ngành', 'approval', 20, 20, 15, 15, 15, false)::t_step,
        ROW('CBTD-06', 'Thẩm định Dự án', 'approval', 40, 40, 30, 20, 20, false)::t_step,
        ROW('CBTD-07', 'Phê duyệt Dự án đầu tư', 'approval', 15, 15, 10, 10, 10, false)::t_step,
        
        ROW('THDA-08', 'Lập, duyệt Kế hoạch LCNT', 'approval', 10, 10, 7, 7, 7, false)::t_step,
        ROW('THDA-09', 'Thiết kế bản vẽ thi công', 'input', 45, 30, 20, 15, 0, true)::t_step,
        ROW('THDA-10', 'Giải phóng mặt bằng', 'approval', 180, 120, 90, 60, 60, false)::t_step,
        ROW('THDA-11', 'Lựa chọn nhà thầu', 'approval', 45, 45, 30, 30, 30, false)::t_step,
        ROW('THDA-12', 'Thi công & Giám sát', 'input', 720, 360, 240, 180, 180, false)::t_step,
        ROW('THDA-13', 'Nghiệm thu hoàn thành', 'approval', 30, 30, 20, 15, 15, false)::t_step,
        
        ROW('KTDA-14', 'Lập hồ sơ Quyết toán', 'input', 270, 270, 180, 120, 120, false)::t_step,
        ROW('KTDA-15', 'Kiểm toán báo cáo Quyết toán', 'approval', 45, 45, 30, 30, 30, false)::t_step,
        ROW('KTDA-16', 'Thẩm tra Quyết toán dự án', 'approval', 60, 60, 45, 30, 30, false)::t_step,
        ROW('KTDA-17', 'Phê duyệt QT, Tất toán', 'end', 15, 15, 10, 10, 10, false)::t_step
    ];

    -- Group QN
    v_prev_node_id := NULL;
    FOREACH v_step IN ARRAY v_steps LOOP
        INSERT INTO iso_workflow_nodes (workflow_id, name, type, assignee_role, sla_formula)
        VALUES (v_wf_qn, '[' || v_step.code || '] ' || v_step.name, v_step.type::iso_workflow_node_type, 'manager', v_step.sla_qn || 'd')
        RETURNING id INTO v_node_id;

        IF v_prev_node_id IS NOT NULL THEN
            INSERT INTO iso_workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_qn, v_prev_node_id, v_node_id);
        END IF;
        v_prev_node_id := v_node_id;
    END LOOP;

    -- Group A
    v_prev_node_id := NULL;
    FOREACH v_step IN ARRAY v_steps LOOP
        INSERT INTO iso_workflow_nodes (workflow_id, name, type, assignee_role, sla_formula)
        VALUES (v_wf_a, '[' || v_step.code || '] ' || v_step.name, v_step.type::iso_workflow_node_type, 'manager', v_step.sla_a || 'd')
        RETURNING id INTO v_node_id;

        IF v_prev_node_id IS NOT NULL THEN
            INSERT INTO iso_workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_a, v_prev_node_id, v_node_id);
        END IF;
        v_prev_node_id := v_node_id;
    END LOOP;

    -- Group B
    v_prev_node_id := NULL;
    FOREACH v_step IN ARRAY v_steps LOOP
        INSERT INTO iso_workflow_nodes (workflow_id, name, type, assignee_role, sla_formula)
        VALUES (v_wf_b, '[' || v_step.code || '] ' || v_step.name, v_step.type::iso_workflow_node_type, 'manager', v_step.sla_b || 'd')
        RETURNING id INTO v_node_id;

        IF v_prev_node_id IS NOT NULL THEN
            INSERT INTO iso_workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_b, v_prev_node_id, v_node_id);
        END IF;
        v_prev_node_id := v_node_id;
    END LOOP;

    -- Group C
    v_prev_node_id := NULL;
    FOREACH v_step IN ARRAY v_steps LOOP
        INSERT INTO iso_workflow_nodes (workflow_id, name, type, assignee_role, sla_formula)
        VALUES (v_wf_c, '[' || v_step.code || '] ' || v_step.name, v_step.type::iso_workflow_node_type, 'manager', v_step.sla_c || 'd')
        RETURNING id INTO v_node_id;

        IF v_prev_node_id IS NOT NULL THEN
            INSERT INTO iso_workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_c, v_prev_node_id, v_node_id);
        END IF;
        v_prev_node_id := v_node_id;
    END LOOP;

    -- Group C_KTKT
    v_prev_node_id := NULL;
    FOREACH v_step IN ARRAY v_steps LOOP
        IF NOT v_step.skip_ktkt THEN
            INSERT INTO iso_workflow_nodes (workflow_id, name, type, assignee_role, sla_formula)
            VALUES (v_wf_c_ktkt, '[' || v_step.code || '] ' || v_step.name, v_step.type::iso_workflow_node_type, 'manager', v_step.sla_c_ktkt || 'd')
            RETURNING id INTO v_node_id;

            IF v_prev_node_id IS NOT NULL THEN
                INSERT INTO iso_workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_c_ktkt, v_prev_node_id, v_node_id);
            END IF;
            v_prev_node_id := v_node_id;
        END IF;
    END LOOP;

END $$;


-- ==========================================
-- MIGRATION: 20260329214400_patch_iso_workflow_enums_columns.sql
-- ==========================================

-- Migration: Bổ sung enum values và cột thiếu cho ISO Workflow Engine
-- Chạy sau migration 20260329202600_core_iso_workflow_schema.sql

-- 1. Thêm status 'in_progress' và 'rejected' vào iso_workflow_task_status
DO $$
BEGIN
    -- Check if value exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'in_progress'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'iso_workflow_task_status')
    ) THEN
        ALTER TYPE iso_workflow_task_status ADD VALUE 'in_progress';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'rejected'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'iso_workflow_task_status')
    ) THEN
        ALTER TYPE iso_workflow_task_status ADD VALUE 'rejected';
    END IF;
END
$$;

-- 2. Thêm cột started_at cho tasks (tracking khi nào task bắt đầu thực hiện)
ALTER TABLE public.iso_workflow_tasks
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- 3. Thêm cột cde_folder_id cho tasks (link tới thư mục CDE)
ALTER TABLE public.iso_workflow_tasks
    ADD COLUMN IF NOT EXISTS cde_folder_id UUID REFERENCES public.cde_folders(id) ON DELETE SET NULL;

-- Cập nhật Policies cũ, dùng public.user_accounts u join với employees e thay vì e.auth_user_id
-- Table: iso_workflows
DROP POLICY IF EXISTS "Cho phép Admin tạo/sửa luồng" ON public.iso_workflows;
CREATE POLICY "Cho phép Admin tạo/sửa luồng" ON public.iso_workflows FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.employees e 
        JOIN public.user_accounts u ON e.employee_id = u.employee_id
        WHERE u.auth_user_id::text = auth.uid()::text AND e.role = 'admin'
    )
);

-- Table: iso_workflow_nodes
DROP POLICY IF EXISTS "Cho phép Admin tạo/sửa nodes" ON public.iso_workflow_nodes;
CREATE POLICY "Cho phép Admin tạo/sửa nodes" ON public.iso_workflow_nodes FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.employees e 
        JOIN public.user_accounts u ON e.employee_id = u.employee_id
        WHERE u.auth_user_id::text = auth.uid()::text AND e.role = 'admin'
    )
);

-- Table: iso_workflow_edges
DROP POLICY IF EXISTS "Cho phép Admin tạo/sửa edges" ON public.iso_workflow_edges;
CREATE POLICY "Cho phép Admin tạo/sửa edges" ON public.iso_workflow_edges FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.employees e 
        JOIN public.user_accounts u ON e.employee_id = u.employee_id
        WHERE u.auth_user_id::text = auth.uid()::text AND e.role = 'admin'
    )
);

-- Table: iso_workflow_instances
DROP POLICY IF EXISTS "Cho phép người dùng tạo instance cho dự án của họ" ON public.iso_workflow_instances;
CREATE POLICY "Cho phép người dùng tạo instance" ON public.iso_workflow_instances FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.employees e 
        JOIN public.user_accounts u ON e.employee_id = u.employee_id
        WHERE u.auth_user_id::text = auth.uid()::text
    )
);

-- Table: iso_workflow_tasks
DROP POLICY IF EXISTS "Cho phép assignee cập nhật task" ON public.iso_workflow_tasks;
CREATE POLICY "Cho phép assignee cập nhật task" ON public.iso_workflow_tasks FOR UPDATE USING (
    assignee_id::text IN (
        SELECT e.employee_id FROM public.employees e 
        JOIN public.user_accounts u ON e.employee_id = u.employee_id
        WHERE u.auth_user_id::text = auth.uid()::text
    )
);

-- Tasks: admin tạo task, assignee cập nhật (policy UPDATE đã có)
CREATE POLICY "Admin tạo task" ON public.iso_workflow_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees e 
            JOIN public.user_accounts u ON e.employee_id = u.employee_id
            WHERE u.auth_user_id::text = auth.uid()::text AND e.role = 'admin'
        )
    );

-- 5. Index tối ưu query My Tasks
CREATE INDEX IF NOT EXISTS idx_iso_workflow_tasks_assignee_status
    ON public.iso_workflow_tasks(assignee_id, status);

CREATE INDEX IF NOT EXISTS idx_iso_workflow_instances_reference
    ON public.iso_workflow_instances(reference_id, reference_type);


-- ==========================================
-- MIGRATION: 20260330103000_enable_admin_iso_management.sql
-- ==========================================

-- Cho phép admin hoặc những người dùng nội bộ (authenticated) được quyền quản trị Sổ tay Quy trình ISO
-- (Tobe Refined: Sau này có thể bọc bằng hàm check role Admin)

CREATE POLICY "Cho phép thêm quy trình ISO" ON public.iso_workflows
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Cho phép sửa quy trình ISO" ON public.iso_workflows
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Cho phép xoá quy trình ISO" ON public.iso_workflows
    FOR DELETE USING (auth.role() = 'authenticated');

-- Các bảng Node & Edges
CREATE POLICY "Cho phép quản trị node" ON public.iso_workflow_nodes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Cho phép quản trị edges" ON public.iso_workflow_edges
    FOR ALL USING (auth.role() = 'authenticated');


-- ==========================================
-- MIGRATION: 20260330120000_core_workflow_system.sql
-- ==========================================

-- 1. DỌN SẠCH TÀN DƯ CŨ (Drop legacy ISO tables and types)
DROP TABLE IF EXISTS public.iso_workflow_tasks CASCADE;
DROP TABLE IF EXISTS public.iso_workflow_instances CASCADE;
DROP TABLE IF EXISTS public.iso_workflow_edges CASCADE;
DROP TABLE IF EXISTS public.iso_workflow_nodes CASCADE;
DROP TABLE IF EXISTS public.iso_workflows CASCADE;

DROP TYPE IF EXISTS iso_workflow_category CASCADE;
DROP TYPE IF EXISTS iso_workflow_node_type CASCADE;
DROP TYPE IF EXISTS iso_workflow_instance_status CASCADE;
DROP TYPE IF EXISTS iso_workflow_task_status CASCADE;

-- 2. TẠO TYPE MỚI (CLEAN, NO PREFIX)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_category') THEN
        CREATE TYPE workflow_category AS ENUM ('project', 'document', 'finance', 'hr', 'asset', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_node_type') THEN
        CREATE TYPE workflow_node_type AS ENUM ('start', 'end', 'approval', 'input', 'automated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_instance_status') THEN
        CREATE TYPE workflow_instance_status AS ENUM ('draft', 'in_progress', 'completed', 'rejected', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_task_status') THEN
        CREATE TYPE workflow_task_status AS ENUM ('pending', 'completed', 'skipped', 'transferred');
    END IF;
END
$$;

-- 3. QUY TRÌNH GỐC (Workflows)
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category workflow_category DEFAULT 'other',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NÚT XỬ LÝ (Workflow Nodes)
CREATE TABLE IF NOT EXISTS public.workflow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type workflow_node_type DEFAULT 'approval',
    assignee_role VARCHAR(100),
    sla_formula VARCHAR(255),
    form_config JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb, 
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LƯỚI KẾT NỐI (Workflow Edges)
CREATE TABLE IF NOT EXISTS public.workflow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
    source_node UUID REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
    target_node UUID REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
    condition_expr TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BIÊN BẢN CHẠY THỰC TẾ (Workflow Instances)
CREATE TABLE IF NOT EXISTS public.workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE RESTRICT NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(100),
    status workflow_instance_status DEFAULT 'in_progress',
    current_node_id UUID REFERENCES public.workflow_nodes(id),
    context_data JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LỊCH SỬ GIAO VIỆC (Workflow Tasks)
CREATE TABLE IF NOT EXISTS public.workflow_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.workflow_instances(id) ON DELETE CASCADE NOT NULL,
    node_id UUID REFERENCES public.workflow_nodes(id) ON DELETE RESTRICT NOT NULL,
    assignee_id UUID REFERENCES auth.users(id),
    status workflow_task_status DEFAULT 'pending',
    action_taken VARCHAR(100),
    comments TEXT,
    digital_signature JSONB,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TRIGGER UPDATE TIME
CREATE TRIGGER set_timestamp_workflows
BEFORE UPDATE ON public.workflows
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_workflow_nodes
BEFORE UPDATE ON public.workflow_nodes
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_workflow_instances
BEFORE UPDATE ON public.workflow_instances
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 9. BẬT BẢO MẬT (RLS) NHƯNG MỞ RỘNG ALL (Dành cho Dev/Admin)
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for workflows" ON public.workflows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for workflow_nodes" ON public.workflow_nodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for workflow_edges" ON public.workflow_edges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for workflow_instances" ON public.workflow_instances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for workflow_tasks" ON public.workflow_tasks FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- MIGRATION: 20260330200000_seed_hai_duong_workflows.sql
-- ==========================================

-- ============================================================
-- SEED 3 QUY TRÌNH ĐẦU TƯ CÔNG - SỔ TAY HẢI DƯƠNG 2025
-- 1 bước thiết kế (BCKT-KT)
-- 2 bước thiết kế (TKCS → TKBVTC)
-- 3 bước thiết kế (TKCS → TKKT → TKBVTC)
-- ============================================================

-- Xóa dữ liệu cũ (nếu có)
DELETE FROM public.workflow_edges;
DELETE FROM public.workflow_nodes;
DELETE FROM public.workflows WHERE category = 'project';

DO $$
DECLARE
    -- Workflow IDs
    v_wf_1step UUID;
    v_wf_2step UUID;
    v_wf_3step UUID;

    -- Node IDs for chaining edges
    v_node_id UUID;
    v_prev_node UUID;

    -- Phase marker nodes
    v_phase1_start UUID;
    v_phase2_start UUID;
    v_phase3_start UUID;

BEGIN
-- ============================================================
-- QUY TRÌNH 1 BƯỚC THIẾT KẾ (BCKT-KT)
-- ============================================================
INSERT INTO public.workflows (code, name, description, category, version, is_active, metadata)
VALUES (
    'DTC-1STEP',
    'Quy trình dự án 1 bước thiết kế',
    'Dự án chỉ lập Báo cáo Kinh tế - Kỹ thuật (BCKT-KT), TKBVTC gộp chung. Áp dụng cho công trình quy mô nhỏ theo Sổ tay ĐTC Hải Dương 2025.',
    'project', 1, true,
    '{"design_steps": 1, "source": "So tay DTC Hai Duong 2025", "applicable": "Cong trinh quy mo nho"}'::jsonb
) RETURNING id INTO v_wf_1step;

-- --- GIAI ĐOẠN I: CHUẨN BỊ DỰ ÁN ---
v_prev_node := NULL;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Bắt đầu quy trình', 'start', 'system', NULL,
    '{"phase": "I", "phase_name": "Chuẩn bị dự án"}'::jsonb)
RETURNING id INTO v_node_id;
v_phase1_start := v_node_id;
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Lập Báo cáo đề xuất chủ trương đầu tư', 'input', 'don_vi_de_xuat', '20d',
    '{"phase": "I", "step": "I.1.1", "description": "Lập BCKT-KT / Báo cáo đề xuất CTrĐT"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Thẩm định chủ trương đầu tư', 'approval', 'hoi_dong_tham_dinh', '30d',
    '{"phase": "I", "step": "I.1.2", "description": "Thẩm định BCNCTKT, nguồn vốn & khả năng cân đối vốn"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Phê duyệt chủ trương đầu tư', 'approval', 'nguoi_quyet_dinh_dt', '10d',
    '{"phase": "I", "step": "I.1.4", "description": "Quyết định chủ trương đầu tư"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Giao Chủ đầu tư dự án', 'approval', 'nguoi_quyet_dinh_dt', '5d',
    '{"phase": "I", "step": "I.1.5"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Lập Báo cáo Kinh tế - Kỹ thuật (BCKT-KT)', 'input', 'tu_van_thiet_ke', '60d',
    '{"phase": "I", "step": "I.2.5", "description": "Lập BCKT-KT (gộp TKBVTC). Dự án 1 bước thiết kế."}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Thẩm định BCKT-KT', 'approval', 'co_quan_chuyen_mon', '20d',
    '{"phase": "I", "step": "I.2.5b", "description": "Thẩm định Báo cáo Kinh tế - Kỹ thuật đầu tư XD"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Phê duyệt dự án (BCKT-KT)', 'approval', 'nguoi_quyet_dinh_dt', '5d',
    '{"phase": "I", "step": "I.2.7"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

-- --- GIAI ĐOẠN II: THỰC HIỆN DỰ ÁN ---
INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Lập, phê duyệt KH LCNT', 'approval', 'chu_dau_tu', '30d',
    '{"phase": "II", "phase_name": "Thực hiện dự án", "step": "II.1.2", "description": "Lập, thẩm định, phê duyệt KHLCNT dự án. TĐ: 20 ngày, PD: 10 ngày"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Giải phóng mặt bằng (GPMB)', 'approval', 'hoi_dong_bt_ht_tdc', '90d',
    '{"phase": "II", "step": "II.1.1b", "description": "Tổ chức BT, HT&TĐC GPMB (12 bước con)"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Lựa chọn nhà thầu thi công', 'approval', 'chu_dau_tu', '30d',
    '{"phase": "II", "step": "II.2.2", "description": "Lựa chọn nhà thầu theo KH LCNT"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Thông báo khởi công', 'input', 'chu_dau_tu', '3d',
    '{"phase": "II", "step": "II.2.3.1", "description": "Thông báo khởi công ít nhất 03 ngày trước"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Thi công xây dựng & Giám sát', 'input', 'nha_thau_thi_cong', '180d',
    '{"phase": "II", "step": "II.2.3.2", "description": "Thi công, hoàn thành, bàn giao - 11 trình tự quản lý thi công"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Nghiệm thu hoàn thành công trình', 'approval', 'co_quan_qlnn_xd', '15d',
    '{"phase": "II", "step": "II.2.4.2", "description": "Kiểm tra nghiệm thu hoàn thành CT"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

-- --- GIAI ĐOẠN III: KẾT THÚC DỰ ÁN ---
INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Bàn giao công trình đưa vào sử dụng', 'input', 'chu_dau_tu', '15d',
    '{"phase": "III", "phase_name": "Kết thúc dự án", "step": "III.2"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Lập hồ sơ Quyết toán dự án', 'input', 'chu_dau_tu', '120d',
    '{"phase": "III", "step": "III.3.3", "description": "Nhóm C: 4 tháng"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Thẩm tra Quyết toán dự án', 'approval', 'so_tai_chinh', '90d',
    '{"phase": "III", "step": "III.3.4", "description": "Nhóm C: 3 tháng"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_1step, 'Phê duyệt QT, Tất toán & Đóng mã DA', 'end', 'nguoi_quyet_dinh_dt', '15d',
    '{"phase": "III", "step": "III.3.5+6", "description": "Phê duyệt QT (15 ngày) + Tất toán tài khoản, đóng mã DA"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_1step, v_prev_node, v_node_id);


-- ============================================================
-- QUY TRÌNH 2 BƯỚC THIẾT KẾ (TKCS → TKBVTC)
-- ============================================================
INSERT INTO public.workflows (code, name, description, category, version, is_active, metadata)
VALUES (
    'DTC-2STEP',
    'Quy trình dự án 2 bước thiết kế',
    'Thiết kế cơ sở (TKCS) → Thiết kế bản vẽ thi công (TKBVTC). Áp dụng dự án thông thường nhóm B, C theo Sổ tay ĐTC Hải Dương 2025.',
    'project', 1, true,
    '{"design_steps": 2, "source": "So tay DTC Hai Duong 2025", "applicable": "Du an nhom B, C thong thuong"}'::jsonb
) RETURNING id INTO v_wf_2step;

v_prev_node := NULL;

-- --- GIAI ĐOẠN I: CHUẨN BỊ DỰ ÁN ---
INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Bắt đầu quy trình', 'start', 'system', NULL,
    '{"phase": "I", "phase_name": "Chuẩn bị dự án"}'::jsonb)
RETURNING id INTO v_node_id;
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Lập Báo cáo đề xuất chủ trương đầu tư', 'input', 'don_vi_de_xuat', '20d',
    '{"phase": "I", "step": "I.1.1"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Thẩm định chủ trương đầu tư', 'approval', 'hoi_dong_tham_dinh', '30d',
    '{"phase": "I", "step": "I.1.2"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Phê duyệt chủ trương đầu tư', 'approval', 'nguoi_quyet_dinh_dt', '10d',
    '{"phase": "I", "step": "I.1.4"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Giao Chủ đầu tư dự án', 'approval', 'nguoi_quyet_dinh_dt', '5d',
    '{"phase": "I", "step": "I.1.5"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Lập dự toán chi phí chuẩn bị đầu tư', 'input', 'chu_dau_tu', '10d',
    '{"phase": "I", "step": "I.2.1"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Lập, phê duyệt KHLCNT bước chuẩn bị', 'approval', 'chu_dau_tu', '30d',
    '{"phase": "I", "step": "I.2.2", "description": "TĐ: 20 ngày, PD: 10 ngày"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'LCNT khảo sát, tư vấn lập TKCS', 'approval', 'chu_dau_tu', '30d',
    '{"phase": "I", "step": "I.2.3"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Lập Báo cáo NCKT (có TKCS)', 'input', 'tu_van_thiet_ke', '60d',
    '{"phase": "I", "step": "I.2.5", "description": "Lập BCNCKT bao gồm Thiết kế cơ sở"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Thẩm định BCNCKT & TKCS', 'approval', 'co_quan_chuyen_mon', '30d',
    '{"phase": "I", "step": "I.2.5b", "description": "Nhóm B: 30 ngày, Nhóm C: 20 ngày"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Phê duyệt dự án', 'approval', 'nguoi_quyet_dinh_dt', '7d',
    '{"phase": "I", "step": "I.2.7"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

-- --- GIAI ĐOẠN II: THỰC HIỆN DỰ ÁN ---
INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Lập, phê duyệt NV KSTK (triển khai sau TKCS)', 'input', 'chu_dau_tu', '15d',
    '{"phase": "II", "phase_name": "Thực hiện dự án", "step": "II.1.1a"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Giải phóng mặt bằng (GPMB)', 'approval', 'hoi_dong_bt_ht_tdc', '120d',
    '{"phase": "II", "step": "II.1.1b", "description": "12 bước con GPMB"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Lập TKBVTC (thiết kế bước 2)', 'input', 'tu_van_thiet_ke', '30d',
    '{"phase": "II", "step": "II.1.4a", "description": "Lập TK bản vẽ thi công sau TKCS"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Thẩm định TKBVTC', 'approval', 'co_quan_chuyen_mon', '30d',
    '{"phase": "II", "step": "II.1.4a-TD", "description": "Cấp II-III: 30 ngày, còn lại: 20 ngày"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Phê duyệt TKBVTC', 'approval', 'chu_dau_tu', '7d',
    '{"phase": "II", "step": "II.1.4a-PD"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Lập, phê duyệt KH LCNT giai đoạn THDA', 'approval', 'chu_dau_tu', '30d',
    '{"phase": "II", "step": "II.2.1"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Lựa chọn nhà thầu thi công, giám sát', 'approval', 'chu_dau_tu', '30d',
    '{"phase": "II", "step": "II.2.2"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Thông báo khởi công', 'input', 'chu_dau_tu', '3d',
    '{"phase": "II", "step": "II.2.3.1"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Thi công xây dựng & Giám sát', 'input', 'nha_thau_thi_cong', '240d',
    '{"phase": "II", "step": "II.2.3.2", "description": "11 trình tự quản lý thi công"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Nghiệm thu hoàn thành công trình', 'approval', 'co_quan_qlnn_xd', '20d',
    '{"phase": "II", "step": "II.2.4.2"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

-- --- GIAI ĐOẠN III: KẾT THÚC DỰ ÁN ---
INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Bàn giao công trình đưa vào sử dụng', 'input', 'chu_dau_tu', '15d',
    '{"phase": "III", "phase_name": "Kết thúc dự án", "step": "III.2"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Lập hồ sơ Quyết toán dự án', 'input', 'chu_dau_tu', '180d',
    '{"phase": "III", "step": "III.3.3", "description": "Nhóm B: 6 tháng"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Thẩm tra Quyết toán dự án', 'approval', 'so_tai_chinh', '120d',
    '{"phase": "III", "step": "III.3.4", "description": "Nhóm B: 4 tháng"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_2step, 'Phê duyệt QT, Tất toán & Đóng mã DA', 'end', 'nguoi_quyet_dinh_dt', '20d',
    '{"phase": "III", "step": "III.3.5+6"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_2step, v_prev_node, v_node_id);


-- ============================================================
-- QUY TRÌNH 3 BƯỚC THIẾT KẾ (TKCS → TKKT → TKBVTC)
-- ============================================================
INSERT INTO public.workflows (code, name, description, category, version, is_active, metadata)
VALUES (
    'DTC-3STEP',
    'Quy trình dự án 3 bước thiết kế',
    'Thiết kế cơ sở (TKCS) → Thiết kế kỹ thuật (TKKT) → Thiết kế bản vẽ thi công (TKBVTC). Áp dụng dự án lớn, phức tạp nhóm A hoặc công trình cấp đặc biệt, cấp I theo Sổ tay ĐTC Hải Dương 2025.',
    'project', 1, true,
    '{"design_steps": 3, "source": "So tay DTC Hai Duong 2025", "applicable": "Du an nhom A, cong trinh cap dac biet, cap I"}'::jsonb
) RETURNING id INTO v_wf_3step;

v_prev_node := NULL;

-- --- GIAI ĐOẠN I: CHUẨN BỊ DỰ ÁN ---
INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Bắt đầu quy trình', 'start', 'system', NULL,
    '{"phase": "I", "phase_name": "Chuẩn bị dự án"}'::jsonb)
RETURNING id INTO v_node_id;
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Lập Báo cáo NCTKT / đề xuất chủ trương ĐT', 'input', 'don_vi_de_xuat', '30d',
    '{"phase": "I", "step": "I.1.1", "description": "Lập BCNCTKT (dự án nhóm A)"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Thẩm định chủ trương đầu tư', 'approval', 'hoi_dong_tham_dinh', '45d',
    '{"phase": "I", "step": "I.1.2", "description": "Nhóm A: 45 ngày"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Phê duyệt chủ trương đầu tư', 'approval', 'nguoi_quyet_dinh_dt', '15d',
    '{"phase": "I", "step": "I.1.4"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Giao Chủ đầu tư dự án', 'approval', 'nguoi_quyet_dinh_dt', '5d',
    '{"phase": "I", "step": "I.1.5"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Lập dự toán chi phí chuẩn bị đầu tư', 'input', 'chu_dau_tu', '10d',
    '{"phase": "I", "step": "I.2.1"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Lập, phê duyệt KHLCNT bước chuẩn bị', 'approval', 'chu_dau_tu', '30d',
    '{"phase": "I", "step": "I.2.2"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'LCNT khảo sát, tư vấn lập TKCS', 'approval', 'chu_dau_tu', '30d',
    '{"phase": "I", "step": "I.2.3"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Lập Báo cáo NCKT (có TKCS)', 'input', 'tu_van_thiet_ke', '80d',
    '{"phase": "I", "step": "I.2.5", "description": "Nhóm A: 80 ngày"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Thẩm định BCNCKT & TKCS', 'approval', 'co_quan_chuyen_mon', '40d',
    '{"phase": "I", "step": "I.2.5b", "description": "Nhóm A: 40 ngày (phấn đấu 35)"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Phê duyệt dự án', 'approval', 'nguoi_quyet_dinh_dt', '7d',
    '{"phase": "I", "step": "I.2.7"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

-- --- GIAI ĐOẠN II: THỰC HIỆN DỰ ÁN ---
INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Lập, phê duyệt NV KSTK (triển khai sau TKCS)', 'input', 'chu_dau_tu', '15d',
    '{"phase": "II", "phase_name": "Thực hiện dự án", "step": "II.1.1a"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Giải phóng mặt bằng (GPMB)', 'approval', 'hoi_dong_bt_ht_tdc', '180d',
    '{"phase": "II", "step": "II.1.1b", "description": "12 bước con GPMB. DA nhóm A: 180 ngày"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

-- Bước thiết kế 2: TKKT (chỉ có ở quy trình 3 bước)
INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Lập Thiết kế Kỹ thuật (TKKT)', 'input', 'tu_van_thiet_ke', '45d',
    '{"phase": "II", "step": "II.1.4a-TKKT", "description": "Bước thiết kế thứ 2 - chỉ có ở QT 3 bước"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Thẩm định TKKT', 'approval', 'co_quan_chuyen_mon', '40d',
    '{"phase": "II", "step": "II.1.4a-TKKT-TD", "description": "Cấp đặc biệt/cấp I: 40 ngày"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Phê duyệt TKKT', 'approval', 'chu_dau_tu', '7d',
    '{"phase": "II", "step": "II.1.4a-TKKT-PD"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

-- Bước thiết kế 3: TKBVTC
INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Lập TKBVTC (thiết kế bước 3)', 'input', 'tu_van_thiet_ke', '30d',
    '{"phase": "II", "step": "II.1.4a-TKBVTC", "description": "TK bản vẽ thi công"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Lập, phê duyệt KH LCNT giai đoạn THDA', 'approval', 'chu_dau_tu', '30d',
    '{"phase": "II", "step": "II.2.1"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Lựa chọn nhà thầu thi công, giám sát', 'approval', 'chu_dau_tu', '45d',
    '{"phase": "II", "step": "II.2.2"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Thông báo khởi công', 'input', 'chu_dau_tu', '3d',
    '{"phase": "II", "step": "II.2.3.1"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Thi công xây dựng & Giám sát', 'input', 'nha_thau_thi_cong', '720d',
    '{"phase": "II", "step": "II.2.3.2", "description": "DA nhóm A: lên đến 720 ngày"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Nghiệm thu hoàn thành công trình', 'approval', 'co_quan_qlnn_xd', '30d',
    '{"phase": "II", "step": "II.2.4.2", "description": "CT cấp đặc biệt, cấp I: 30 ngày"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

-- --- GIAI ĐOẠN III: KẾT THÚC DỰ ÁN ---
INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Bàn giao công trình đưa vào sử dụng', 'input', 'chu_dau_tu', '30d',
    '{"phase": "III", "phase_name": "Kết thúc dự án", "step": "III.2"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Lập hồ sơ Quyết toán dự án', 'input', 'chu_dau_tu', '270d',
    '{"phase": "III", "step": "III.3.3", "description": "Nhóm A: 9 tháng"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Thẩm tra Quyết toán dự án', 'approval', 'so_tai_chinh', '240d',
    '{"phase": "III", "step": "III.3.4", "description": "Nhóm A: 8 tháng"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Phê duyệt QT dự án hoàn thành', 'approval', 'nguoi_quyet_dinh_dt', '30d',
    '{"phase": "III", "step": "III.3.5", "description": "Nhóm A: 1 tháng"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);
v_prev_node := v_node_id;

INSERT INTO public.workflow_nodes (workflow_id, name, type, assignee_role, sla_formula, metadata)
VALUES (v_wf_3step, 'Tất toán tài khoản & Đóng mã DA', 'end', 'chu_dau_tu', '15d',
    '{"phase": "III", "step": "III.3.6", "description": "CĐT tất toán → KBNN đối chiếu → STC đóng mã"}'::jsonb)
RETURNING id INTO v_node_id;
INSERT INTO public.workflow_edges (workflow_id, source_node, target_node) VALUES (v_wf_3step, v_prev_node, v_node_id);

RAISE NOTICE 'Successfully seeded 3 workflows: DTC-1STEP (% nodes), DTC-2STEP, DTC-3STEP',
    (SELECT COUNT(*) FROM public.workflow_nodes WHERE workflow_id = v_wf_1step);

END $$;


-- ==========================================
-- MIGRATION: 20260331150000_create_user_permissions.sql
-- ==========================================

-- ============================================
-- Migration: Create user_permissions table
-- For RBAC permission management
-- ============================================

-- 1. Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    resource TEXT NOT NULL,
    actions TEXT[] NOT NULL DEFAULT '{}',
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, resource)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON user_permissions(resource);

-- 3. Enable RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (restrictive — only admin can manage, all authenticated can read own)

-- All authenticated users can read their OWN permissions
CREATE POLICY "user_permissions_select_own"
    ON user_permissions FOR SELECT
    USING (true);  -- Hook reads all; filtering is done in frontend by user_id

-- Only admin can insert
CREATE POLICY "user_permissions_insert_admin"
    ON user_permissions FOR INSERT
    WITH CHECK (true);  -- Admin check done at app level via role

-- Only admin can update
CREATE POLICY "user_permissions_update_admin"
    ON user_permissions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Only admin can delete
CREATE POLICY "user_permissions_delete_admin"
    ON user_permissions FOR DELETE
    USING (true);

-- 5. Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_permissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_permissions_updated_at
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_permissions_timestamp();


-- ==========================================
-- MIGRATION: 20260331160000_create_audit_logs.sql
-- ==========================================

-- ============================================================
-- Migration: audit_logs table for permission change tracking
-- Created: 2026-03-31
-- ============================================================

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,                    -- e.g. 'permission_update'
    target_entity TEXT NOT NULL,             -- e.g. 'user_permissions'
    target_id TEXT NOT NULL,                 -- id of the affected entity/user
    changed_by TEXT NOT NULL,                -- user_id of the person making the change
    details JSONB DEFAULT '{}'::jsonb,       -- JSON payload with before/after state
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_target
    ON public.audit_logs (target_entity, target_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
    ON public.audit_logs (action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by
    ON public.audit_logs (changed_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON public.audit_logs (created_at DESC);

-- 3. RLS — Only admins can read audit logs. Insert is open for the service.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone (via authenticated role) to INSERT audit entries
CREATE POLICY "audit_logs_insert"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only the admin or the user themselves can SELECT audit entries
CREATE POLICY "audit_logs_select"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        -- Super permissive for now (admin check done at app level)
        -- In production, cross-reference auth.uid() with an admin role lookup
        true
    );

-- No UPDATE or DELETE on audit logs (append-only)
-- Explicitly deny any modification
CREATE POLICY "audit_logs_no_update"
    ON public.audit_logs FOR UPDATE
    TO authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY "audit_logs_no_delete"
    ON public.audit_logs FOR DELETE
    TO authenticated
    USING (false);

-- 4. Comment for documentation
COMMENT ON TABLE public.audit_logs IS 'Append-only audit trail for permission changes and security-sensitive actions';


-- ==========================================
-- MIGRATION: 20260401120000_rls_hardening_all_tables.sql
-- ==========================================

-- ============================================================
-- Migration: RLS Hardening for All Tables
-- Description: Replace permissive USING(true) policies with
--              role-based + project-scoped access control
-- Created: 2026-04-01
-- ============================================================

-- ╔══════════════════════════════════════════════╗
-- ║  STEP 1: Helper Functions                    ║
-- ╚══════════════════════════════════════════════╝

-- Get current employee record from auth.uid()
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS TEXT AS $$
  SELECT ua.employee_id
  FROM user_accounts ua
  WHERE ua.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current employee role
CREATE OR REPLACE FUNCTION public.get_current_employee_role()
RETURNS TEXT AS $$
  SELECT e.role
  FROM employees e
  JOIN user_accounts ua ON ua.employee_id = e.employee_id
  WHERE ua.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current employee department
CREATE OR REPLACE FUNCTION public.get_current_employee_department()
RETURNS TEXT AS $$
  SELECT e.department
  FROM employees e
  JOIN user_accounts ua ON ua.employee_id = e.employee_id
  WHERE ua.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is admin/director (global scope)
CREATE OR REPLACE FUNCTION public.is_global_role()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees e
    JOIN user_accounts ua ON ua.employee_id = e.employee_id
    WHERE ua.auth_user_id = auth.uid()
    AND (
      e.role IN ('Admin', 'Director', 'DeputyDirector')
      OR e.department IN (
        'Ban Giám đốc',
        'Văn phòng',
        'Phòng Kế hoạch – Đầu tư',
        'Phòng Tài chính – Kế toán',
        'Phòng Chính sách – Pháp chế',
        'Phòng Kỹ thuật – Chất lượng',
        'Trung tâm Dịch vụ tư vấn'
      )
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees e
    JOIN user_accounts ua ON ua.employee_id = e.employee_id
    WHERE ua.auth_user_id = auth.uid()
    AND e.role = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is a member of a specific project
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = p_project_id
    AND pm.employee_id = public.get_current_employee_id()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is a contractor
CREATE OR REPLACE FUNCTION public.get_current_contractor_id()
RETURNS TEXT AS $$
  SELECT ca.contractor_id
  FROM contractor_accounts ca
  WHERE ca.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ╔══════════════════════════════════════════════╗
-- ║  STEP 2: Drop ALL existing permissive        ║
-- ║  "allow_all_*" policies                      ║
-- ╚══════════════════════════════════════════════╝

DO $$
DECLARE
    t TEXT;
    policy_name TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'employees','user_accounts','projects','construction_works',
        'bidding_packages','contractors','contracts','variation_orders',
        'payments','capital_plans','disbursements','documents','folders',
        'tasks','sub_tasks','project_members','audit_logs','bim_models',
        'facility_assets','feasibility_studies','investment_policy_decisions',
        'package_issues','stage_transitions'
    ]) LOOP
        -- Drop allow_all policies
        FOR policy_name IN
            SELECT policyname FROM pg_policies
            WHERE tablename = t AND schemaname = 'public'
            AND policyname LIKE 'allow_all_%'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, t);
            RAISE NOTICE 'Dropped policy % on %', policy_name, t;
        END LOOP;
    END LOOP;
END $$;

-- Also drop old migration-created policies for user_permissions and audit_logs
DROP POLICY IF EXISTS "user_permissions_select_own" ON user_permissions;
DROP POLICY IF EXISTS "user_permissions_insert_admin" ON user_permissions;
DROP POLICY IF EXISTS "user_permissions_update_admin" ON user_permissions;
DROP POLICY IF EXISTS "user_permissions_delete_admin" ON user_permissions;


-- ╔══════════════════════════════════════════════╗
-- ║  STEP 3: New RLS Policies                   ║
-- ║  Pattern: Global roles see all,              ║
-- ║  Project-scoped roles see own projects       ║
-- ╚══════════════════════════════════════════════╝

-- ─────────────────────────────────────────────
-- 3.1  EMPLOYEES — everyone reads, admin writes
-- ─────────────────────────────────────────────
CREATE POLICY "employees_select" ON employees FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "employees_insert" ON employees FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "employees_update" ON employees FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "employees_delete" ON employees FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.2  USER_ACCOUNTS — own data or admin
-- ─────────────────────────────────────────────
CREATE POLICY "user_accounts_select" ON user_accounts FOR SELECT
  TO authenticated USING (
    auth_user_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "user_accounts_insert" ON user_accounts FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "user_accounts_update" ON user_accounts FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_admin())
  WITH CHECK (auth_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "user_accounts_delete" ON user_accounts FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.3  PROJECTS — global roles see all, others see own projects
-- ─────────────────────────────────────────────
CREATE POLICY "projects_select" ON projects FOR SELECT
  TO authenticated USING (
    public.is_global_role()
    OR public.is_project_member(project_id)
    OR (public.get_current_contractor_id() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM contracts c
          WHERE c.project_id = projects.project_id
          AND c.contractor_id = public.get_current_contractor_id()
        ))
  );

CREATE POLICY "projects_insert" ON projects FOR INSERT
  TO authenticated WITH CHECK (
    public.get_current_employee_role() IN ('Admin', 'Director', 'DeputyDirector', 'Manager')
  );

CREATE POLICY "projects_update" ON projects FOR UPDATE
  TO authenticated
  USING (
    public.is_global_role() OR public.is_project_member(project_id)
  )
  WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "projects_delete" ON projects FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.4  PROJECT_MEMBERS — scoped
-- ─────────────────────────────────────────────
CREATE POLICY "project_members_select" ON project_members FOR SELECT
  TO authenticated USING (
    public.is_global_role()
    OR employee_id = public.get_current_employee_id()
    OR public.is_project_member(project_id)
  );

CREATE POLICY "project_members_insert" ON project_members FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "project_members_update" ON project_members FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "project_members_delete" ON project_members FOR DELETE
  TO authenticated USING (public.is_global_role());


-- ─────────────────────────────────────────────
-- 3.5  CONTRACTORS — everyone reads, restricted writes
-- ─────────────────────────────────────────────
CREATE POLICY "contractors_select" ON contractors FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "contractors_insert" ON contractors FOR INSERT
  TO authenticated WITH CHECK (public.get_current_employee_id() IS NOT NULL);

CREATE POLICY "contractors_update" ON contractors FOR UPDATE
  TO authenticated
  USING (public.get_current_employee_id() IS NOT NULL)
  WITH CHECK (public.get_current_employee_id() IS NOT NULL);

CREATE POLICY "contractors_delete" ON contractors FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.6  CONTRACTS — project-scoped
-- ─────────────────────────────────────────────
CREATE POLICY "contracts_select" ON contracts FOR SELECT
  TO authenticated USING (
    public.is_global_role()
    OR public.is_project_member(project_id)
    OR contractor_id = public.get_current_contractor_id()
  );

CREATE POLICY "contracts_insert" ON contracts FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "contracts_update" ON contracts FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "contracts_delete" ON contracts FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.7  PAYMENTS — project-scoped, write restricted
-- ─────────────────────────────────────────────
CREATE POLICY "payments_select" ON payments FOR SELECT
  TO authenticated USING (
    public.is_global_role()
    OR public.is_project_member(project_id)
    OR (public.get_current_contractor_id() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM contracts c
          WHERE c.contract_id = payments.contract_id
          AND c.contractor_id = public.get_current_contractor_id()
        ))
  );

CREATE POLICY "payments_insert" ON payments FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "payments_update" ON payments FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "payments_delete" ON payments FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.8  BIDDING_PACKAGES — project-scoped
-- ─────────────────────────────────────────────
CREATE POLICY "bidding_packages_select" ON bidding_packages FOR SELECT
  TO authenticated USING (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "bidding_packages_insert" ON bidding_packages FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "bidding_packages_update" ON bidding_packages FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "bidding_packages_delete" ON bidding_packages FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.9  CAPITAL_PLANS — project-scoped
-- ─────────────────────────────────────────────
CREATE POLICY "capital_plans_select" ON capital_plans FOR SELECT
  TO authenticated USING (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "capital_plans_insert" ON capital_plans FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "capital_plans_update" ON capital_plans FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "capital_plans_delete" ON capital_plans FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.10 DISBURSEMENTS — project-scoped
-- ─────────────────────────────────────────────
CREATE POLICY "disbursements_select" ON disbursements FOR SELECT
  TO authenticated USING (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "disbursements_insert" ON disbursements FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "disbursements_update" ON disbursements FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "disbursements_delete" ON disbursements FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.11 DOCUMENTS — project-scoped
-- ─────────────────────────────────────────────
CREATE POLICY "documents_select" ON documents FOR SELECT
  TO authenticated USING (
    public.is_global_role()
    OR public.is_project_member(project_id)
    OR project_id IS NULL  -- legal/regulation docs without project
  );

CREATE POLICY "documents_insert" ON documents FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role()
    OR public.is_project_member(project_id)
    OR project_id IS NULL
  );

CREATE POLICY "documents_update" ON documents FOR UPDATE
  TO authenticated
  USING (
    public.is_global_role()
    OR public.is_project_member(project_id)
    OR project_id IS NULL
  )
  WITH CHECK (
    public.is_global_role()
    OR public.is_project_member(project_id)
    OR project_id IS NULL
  );

CREATE POLICY "documents_delete" ON documents FOR DELETE
  TO authenticated USING (public.is_global_role());


-- ─────────────────────────────────────────────
-- 3.12 TASKS — project-scoped + assigned
-- ─────────────────────────────────────────────
CREATE POLICY "tasks_select" ON tasks FOR SELECT
  TO authenticated USING (
    public.is_global_role()
    OR public.is_project_member(project_id)
    OR assignee_id = public.get_current_employee_id()
    OR created_by = public.get_current_employee_id()
  );

CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role()
    OR public.is_project_member(project_id)
  );

CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  TO authenticated
  USING (
    public.is_global_role()
    OR public.is_project_member(project_id)
    OR assignee_id = public.get_current_employee_id()
  )
  WITH CHECK (
    public.is_global_role()
    OR public.is_project_member(project_id)
    OR assignee_id = public.get_current_employee_id()
  );

CREATE POLICY "tasks_delete" ON tasks FOR DELETE
  TO authenticated USING (
    public.is_global_role() OR public.is_project_member(project_id)
  );


-- ─────────────────────────────────────────────
-- 3.13 SUB_TASKS — inherits from parent task
-- ─────────────────────────────────────────────
CREATE POLICY "sub_tasks_select" ON sub_tasks FOR SELECT
  TO authenticated USING (true);  -- filtered via parent task

CREATE POLICY "sub_tasks_insert" ON sub_tasks FOR INSERT
  TO authenticated WITH CHECK (public.get_current_employee_id() IS NOT NULL);

CREATE POLICY "sub_tasks_update" ON sub_tasks FOR UPDATE
  TO authenticated USING (public.get_current_employee_id() IS NOT NULL)
  WITH CHECK (public.get_current_employee_id() IS NOT NULL);

CREATE POLICY "sub_tasks_delete" ON sub_tasks FOR DELETE
  TO authenticated USING (public.get_current_employee_id() IS NOT NULL);


-- ─────────────────────────────────────────────
-- 3.14 CONSTRUCTION_WORKS — project-scoped
-- ─────────────────────────────────────────────
CREATE POLICY "construction_works_select" ON construction_works FOR SELECT
  TO authenticated USING (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "construction_works_insert" ON construction_works FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "construction_works_update" ON construction_works FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "construction_works_delete" ON construction_works FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.15 VARIATION_ORDERS — via contract->project
-- ─────────────────────────────────────────────
CREATE POLICY "variation_orders_select" ON variation_orders FOR SELECT
  TO authenticated USING (
    public.is_global_role()
    OR EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.contract_id = variation_orders.contract_id
      AND public.is_project_member(c.project_id)
    )
  );

CREATE POLICY "variation_orders_insert" ON variation_orders FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role()
    OR EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.contract_id = variation_orders.contract_id
      AND public.is_project_member(c.project_id)
    )
  );

CREATE POLICY "variation_orders_update" ON variation_orders FOR UPDATE
  TO authenticated
  USING (
    public.is_global_role()
    OR EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.contract_id = variation_orders.contract_id
      AND public.is_project_member(c.project_id)
    )
  )
  WITH CHECK (
    public.is_global_role()
    OR EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.contract_id = variation_orders.contract_id
      AND public.is_project_member(c.project_id)
    )
  );

CREATE POLICY "variation_orders_delete" ON variation_orders FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.16 BIM_MODELS — project-scoped
-- ─────────────────────────────────────────────
CREATE POLICY "bim_models_select" ON bim_models FOR SELECT
  TO authenticated USING (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "bim_models_insert" ON bim_models FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "bim_models_update" ON bim_models FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "bim_models_delete" ON bim_models FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.17 FACILITY_ASSETS — project-scoped
-- ─────────────────────────────────────────────
CREATE POLICY "facility_assets_select" ON facility_assets FOR SELECT
  TO authenticated USING (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "facility_assets_insert" ON facility_assets FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "facility_assets_update" ON facility_assets FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "facility_assets_delete" ON facility_assets FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.18 FEASIBILITY_STUDIES — project-scoped
-- ─────────────────────────────────────────────
CREATE POLICY "feasibility_studies_select" ON feasibility_studies FOR SELECT
  TO authenticated USING (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "feasibility_studies_insert" ON feasibility_studies FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "feasibility_studies_update" ON feasibility_studies FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "feasibility_studies_delete" ON feasibility_studies FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.19 INVESTMENT_POLICY_DECISIONS — project-scoped
-- ─────────────────────────────────────────────
CREATE POLICY "ipd_select" ON investment_policy_decisions FOR SELECT
  TO authenticated USING (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "ipd_insert" ON investment_policy_decisions FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "ipd_update" ON investment_policy_decisions FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "ipd_delete" ON investment_policy_decisions FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.20 PACKAGE_ISSUES — via bidding_packages->project
-- ─────────────────────────────────────────────
CREATE POLICY "package_issues_select" ON package_issues FOR SELECT
  TO authenticated USING (
    public.is_global_role()
    OR EXISTS (
      SELECT 1 FROM bidding_packages bp
      WHERE bp.package_id = package_issues.package_id
      AND public.is_project_member(bp.project_id)
    )
  );

CREATE POLICY "package_issues_insert" ON package_issues FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role()
    OR EXISTS (
      SELECT 1 FROM bidding_packages bp
      WHERE bp.package_id = package_issues.package_id
      AND public.is_project_member(bp.project_id)
    )
  );

CREATE POLICY "package_issues_update" ON package_issues FOR UPDATE
  TO authenticated
  USING (
    public.is_global_role()
    OR EXISTS (
      SELECT 1 FROM bidding_packages bp
      WHERE bp.package_id = package_issues.package_id
      AND public.is_project_member(bp.project_id)
    )
  )
  WITH CHECK (
    public.is_global_role()
    OR EXISTS (
      SELECT 1 FROM bidding_packages bp
      WHERE bp.package_id = package_issues.package_id
      AND public.is_project_member(bp.project_id)
    )
  );

CREATE POLICY "package_issues_delete" ON package_issues FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.21 STAGE_TRANSITIONS — project-scoped
-- ─────────────────────────────────────────────
CREATE POLICY "stage_transitions_select" ON stage_transitions FOR SELECT
  TO authenticated USING (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "stage_transitions_insert" ON stage_transitions FOR INSERT
  TO authenticated WITH CHECK (
    public.is_global_role() OR public.is_project_member(project_id)
  );

CREATE POLICY "stage_transitions_update" ON stage_transitions FOR UPDATE
  TO authenticated
  USING (public.is_global_role() OR public.is_project_member(project_id))
  WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));

CREATE POLICY "stage_transitions_delete" ON stage_transitions FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.22 FOLDERS — open read (legacy), write authenticated
-- ─────────────────────────────────────────────
CREATE POLICY "folders_select" ON folders FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "folders_insert" ON folders FOR INSERT
  TO authenticated WITH CHECK (public.get_current_employee_id() IS NOT NULL);

CREATE POLICY "folders_update" ON folders FOR UPDATE
  TO authenticated USING (public.get_current_employee_id() IS NOT NULL)
  WITH CHECK (public.get_current_employee_id() IS NOT NULL);

CREATE POLICY "folders_delete" ON folders FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.23 USER_PERMISSIONS — own read, admin write
-- ─────────────────────────────────────────────
CREATE POLICY "user_permissions_select" ON user_permissions FOR SELECT
  TO authenticated USING (
    user_id = public.get_current_employee_id()
    OR public.is_admin()
  );

CREATE POLICY "user_permissions_insert" ON user_permissions FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "user_permissions_update" ON user_permissions FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_permissions_delete" ON user_permissions FOR DELETE
  TO authenticated USING (public.is_admin());


-- ─────────────────────────────────────────────
-- 3.24 AUDIT_LOGS — admin read, all insert (append-only)
-- ─────────────────────────────────────────────
-- Keep existing policies from migration 20260331160000
-- They already have: INSERT(all), SELECT(all), no UPDATE, no DELETE
-- We just need to tighten SELECT to admin-only:
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
DROP POLICY IF EXISTS "allow_all_select_audit_logs" ON audit_logs;

CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT
  TO authenticated USING (public.is_admin());


-- ╔══════════════════════════════════════════════╗
-- ║  STEP 4: Additional tables discovered in DB  ║
-- ║  (not in init_schema but exist in production) ║
-- ╚══════════════════════════════════════════════╝

-- 4.1 INSPECTIONS — project-scoped
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inspections') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_inspections" ON inspections';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_inspections" ON inspections';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_inspections" ON inspections';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_inspections" ON inspections';
    
    EXECUTE 'CREATE POLICY "inspections_select" ON inspections FOR SELECT TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "inspections_insert" ON inspections FOR INSERT TO authenticated WITH CHECK (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "inspections_update" ON inspections FOR UPDATE TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id)) WITH CHECK (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "inspections_delete" ON inspections FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- 4.2 PROCUREMENT_PLANS — project-scoped
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'procurement_plans') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_procurement_plans" ON procurement_plans';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_procurement_plans" ON procurement_plans';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_procurement_plans" ON procurement_plans';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_procurement_plans" ON procurement_plans';
    
    EXECUTE 'CREATE POLICY "procurement_plans_select" ON procurement_plans FOR SELECT TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "procurement_plans_insert" ON procurement_plans FOR INSERT TO authenticated WITH CHECK (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "procurement_plans_update" ON procurement_plans FOR UPDATE TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id)) WITH CHECK (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "procurement_plans_delete" ON procurement_plans FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- 4.3 PACKAGE_BIDDERS — via bidding_packages->project
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_bidders') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_package_bidders" ON package_bidders';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_package_bidders" ON package_bidders';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_package_bidders" ON package_bidders';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_package_bidders" ON package_bidders';
    
    EXECUTE 'CREATE POLICY "package_bidders_select" ON package_bidders FOR SELECT TO authenticated USING (public.is_global_role() OR EXISTS (SELECT 1 FROM bidding_packages bp WHERE bp.package_id = package_bidders.package_id AND public.is_project_member(bp.project_id)))';
    EXECUTE 'CREATE POLICY "package_bidders_insert" ON package_bidders FOR INSERT TO authenticated WITH CHECK (public.is_global_role() OR EXISTS (SELECT 1 FROM bidding_packages bp WHERE bp.package_id = package_bidders.package_id AND public.is_project_member(bp.project_id)))';
    EXECUTE 'CREATE POLICY "package_bidders_update" ON package_bidders FOR UPDATE TO authenticated USING (public.is_global_role() OR EXISTS (SELECT 1 FROM bidding_packages bp WHERE bp.package_id = package_bidders.package_id AND public.is_project_member(bp.project_id))) WITH CHECK (public.is_global_role() OR EXISTS (SELECT 1 FROM bidding_packages bp WHERE bp.package_id = package_bidders.package_id AND public.is_project_member(bp.project_id)))';
    EXECUTE 'CREATE POLICY "package_bidders_delete" ON package_bidders FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- 4.4 SETTLEMENT_RECORDS — via contracts->project
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settlement_records') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_settlement_records" ON settlement_records';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_settlement_records" ON settlement_records';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_settlement_records" ON settlement_records';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_settlement_records" ON settlement_records';
    
    EXECUTE 'CREATE POLICY "settlement_records_select" ON settlement_records FOR SELECT TO authenticated USING (public.is_global_role() OR EXISTS (SELECT 1 FROM contracts c WHERE c.contract_id = settlement_records.contract_id AND public.is_project_member(c.project_id)))';
    EXECUTE 'CREATE POLICY "settlement_records_insert" ON settlement_records FOR INSERT TO authenticated WITH CHECK (public.is_global_role() OR EXISTS (SELECT 1 FROM contracts c WHERE c.contract_id = settlement_records.contract_id AND public.is_project_member(c.project_id)))';
    EXECUTE 'CREATE POLICY "settlement_records_update" ON settlement_records FOR UPDATE TO authenticated USING (public.is_global_role() OR EXISTS (SELECT 1 FROM contracts c WHERE c.contract_id = settlement_records.contract_id AND public.is_project_member(c.project_id))) WITH CHECK (public.is_global_role() OR EXISTS (SELECT 1 FROM contracts c WHERE c.contract_id = settlement_records.contract_id AND public.is_project_member(c.project_id)))';
    EXECUTE 'CREATE POLICY "settlement_records_delete" ON settlement_records FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- 4.5 ACCEPTANCE_RECORDS — via contracts->project
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'acceptance_records') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_acceptance_records" ON acceptance_records';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_acceptance_records" ON acceptance_records';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_acceptance_records" ON acceptance_records';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_acceptance_records" ON acceptance_records';
    
    EXECUTE 'CREATE POLICY "acceptance_records_select" ON acceptance_records FOR SELECT TO authenticated USING (public.is_global_role() OR EXISTS (SELECT 1 FROM contracts c WHERE c.contract_id = acceptance_records.contract_id AND public.is_project_member(c.project_id)))';
    EXECUTE 'CREATE POLICY "acceptance_records_insert" ON acceptance_records FOR INSERT TO authenticated WITH CHECK (public.is_global_role() OR EXISTS (SELECT 1 FROM contracts c WHERE c.contract_id = acceptance_records.contract_id AND public.is_project_member(c.project_id)))';
    EXECUTE 'CREATE POLICY "acceptance_records_update" ON acceptance_records FOR UPDATE TO authenticated USING (public.is_global_role() OR EXISTS (SELECT 1 FROM contracts c WHERE c.contract_id = acceptance_records.contract_id AND public.is_project_member(c.project_id))) WITH CHECK (public.is_global_role() OR EXISTS (SELECT 1 FROM contracts c WHERE c.contract_id = acceptance_records.contract_id AND public.is_project_member(c.project_id)))';
    EXECUTE 'CREATE POLICY "acceptance_records_delete" ON acceptance_records FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- 4.6 DISBURSEMENT_PLANS — project-scoped
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disbursement_plans') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_disbursement_plans" ON disbursement_plans';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_disbursement_plans" ON disbursement_plans';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_disbursement_plans" ON disbursement_plans';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_disbursement_plans" ON disbursement_plans';
    
    EXECUTE 'CREATE POLICY "disbursement_plans_select" ON disbursement_plans FOR SELECT TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "disbursement_plans_insert" ON disbursement_plans FOR INSERT TO authenticated WITH CHECK (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "disbursement_plans_update" ON disbursement_plans FOR UPDATE TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id)) WITH CHECK (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "disbursement_plans_delete" ON disbursement_plans FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- 4.7 CDE-related tables — project-scoped
DO $$ BEGIN
  -- cde_folders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cde_folders') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_cde_folders" ON cde_folders';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_cde_folders" ON cde_folders';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_cde_folders" ON cde_folders';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_cde_folders" ON cde_folders';
    
    EXECUTE 'CREATE POLICY "cde_folders_select" ON cde_folders FOR SELECT TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "cde_folders_insert" ON cde_folders FOR INSERT TO authenticated WITH CHECK (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "cde_folders_update" ON cde_folders FOR UPDATE TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id)) WITH CHECK (public.is_global_role() OR public.is_project_member(project_id))';
    EXECUTE 'CREATE POLICY "cde_folders_delete" ON cde_folders FOR DELETE TO authenticated USING (public.is_global_role())';
  END IF;
END $$;

-- 4.8 WORKFLOW tables — open read (system data), restricted write
DO $$ BEGIN
  -- workflows (template definitions)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflows') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_workflows" ON workflows';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_workflows" ON workflows';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_workflows" ON workflows';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_workflows" ON workflows';
    
    EXECUTE 'CREATE POLICY "workflows_select" ON workflows FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "workflows_insert" ON workflows FOR INSERT TO authenticated WITH CHECK (public.is_admin())';
    EXECUTE 'CREATE POLICY "workflows_update" ON workflows FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    EXECUTE 'CREATE POLICY "workflows_delete" ON workflows FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
  
  -- workflow_nodes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_nodes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_workflow_nodes" ON workflow_nodes';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_workflow_nodes" ON workflow_nodes';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_workflow_nodes" ON workflow_nodes';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_workflow_nodes" ON workflow_nodes';
    
    EXECUTE 'CREATE POLICY "workflow_nodes_select" ON workflow_nodes FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "workflow_nodes_insert" ON workflow_nodes FOR INSERT TO authenticated WITH CHECK (public.is_admin())';
    EXECUTE 'CREATE POLICY "workflow_nodes_update" ON workflow_nodes FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    EXECUTE 'CREATE POLICY "workflow_nodes_delete" ON workflow_nodes FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;

  -- workflow_edges
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_edges') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_workflow_edges" ON workflow_edges';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_workflow_edges" ON workflow_edges';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_workflow_edges" ON workflow_edges';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_workflow_edges" ON workflow_edges';
    
    EXECUTE 'CREATE POLICY "workflow_edges_select" ON workflow_edges FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "workflow_edges_insert" ON workflow_edges FOR INSERT TO authenticated WITH CHECK (public.is_admin())';
    EXECUTE 'CREATE POLICY "workflow_edges_update" ON workflow_edges FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    EXECUTE 'CREATE POLICY "workflow_edges_delete" ON workflow_edges FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;

  -- workflow_instances
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_instances') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_workflow_instances" ON workflow_instances';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_workflow_instances" ON workflow_instances';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_workflow_instances" ON workflow_instances';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_workflow_instances" ON workflow_instances';
    
    EXECUTE 'CREATE POLICY "workflow_instances_select" ON workflow_instances FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "workflow_instances_insert" ON workflow_instances FOR INSERT TO authenticated WITH CHECK (public.get_current_employee_id() IS NOT NULL)';
    EXECUTE 'CREATE POLICY "workflow_instances_update" ON workflow_instances FOR UPDATE TO authenticated USING (public.get_current_employee_id() IS NOT NULL) WITH CHECK (public.get_current_employee_id() IS NOT NULL)';
    EXECUTE 'CREATE POLICY "workflow_instances_delete" ON workflow_instances FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;

  -- workflow_tasks
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_tasks') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_select_workflow_tasks" ON workflow_tasks';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert_workflow_tasks" ON workflow_tasks';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_update_workflow_tasks" ON workflow_tasks';
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete_workflow_tasks" ON workflow_tasks';
    
    EXECUTE 'CREATE POLICY "workflow_tasks_select" ON workflow_tasks FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "workflow_tasks_insert" ON workflow_tasks FOR INSERT TO authenticated WITH CHECK (public.get_current_employee_id() IS NOT NULL)';
    EXECUTE 'CREATE POLICY "workflow_tasks_update" ON workflow_tasks FOR UPDATE TO authenticated USING (public.get_current_employee_id() IS NOT NULL) WITH CHECK (public.get_current_employee_id() IS NOT NULL)';
    EXECUTE 'CREATE POLICY "workflow_tasks_delete" ON workflow_tasks FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- 4.9 Remaining tables: open read, authenticated write
DO $$ BEGIN
  DECLARE t TEXT;
  BEGIN
    FOR t IN SELECT unnest(ARRAY[
      'task_statuses', 'task_comments', 'task_links',
      'cde_comments', 'cde_workflow_history', 'cde_permissions',
      'cde_transmittals', 'cde_audit_log',
      'contractor_accounts', 'document_attachments', 'entity_registry'
    ]) LOOP
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_select_%s" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_insert_%s" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_update_%s" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_delete_%s" ON %I', t, t);
        
        EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT TO authenticated USING (true)', t, t);
        EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT TO authenticated WITH CHECK (public.get_current_employee_id() IS NOT NULL OR public.get_current_contractor_id() IS NOT NULL)', t, t);
        EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE TO authenticated USING (public.get_current_employee_id() IS NOT NULL OR public.get_current_contractor_id() IS NOT NULL) WITH CHECK (public.get_current_employee_id() IS NOT NULL OR public.get_current_contractor_id() IS NOT NULL)', t, t);
        EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE TO authenticated USING (public.is_admin())', t, t);
      END IF;
    END LOOP;
  END;
END $$;


-- ╔══════════════════════════════════════════════╗
-- ║  STEP 5: Performance indexes for RLS          ║
-- ║  Helper function queries need fast lookups     ║
-- ╚══════════════════════════════════════════════╝

-- Critical: auth_user_id lookup (used in every RLS check)
CREATE INDEX IF NOT EXISTS idx_user_accounts_auth_user_id
  ON user_accounts(auth_user_id);

-- Project member lookups (used in is_project_member)
CREATE INDEX IF NOT EXISTS idx_project_members_composite
  ON project_members(employee_id, project_id);

-- Contractor auth lookup
CREATE INDEX IF NOT EXISTS idx_contractor_accounts_auth_user_id
  ON contractor_accounts(auth_user_id);

-- Employee role/department lookup
CREATE INDEX IF NOT EXISTS idx_employees_role_department
  ON employees(role, department);

-- Contract lookups for indirect project access
CREATE INDEX IF NOT EXISTS idx_contracts_project_id
  ON contracts(project_id);

CREATE INDEX IF NOT EXISTS idx_contracts_contractor_id
  ON contracts(contractor_id);

-- Payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_project_id
  ON payments(project_id);

CREATE INDEX IF NOT EXISTS idx_payments_contract_id
  ON payments(contract_id);

-- Bidding package lookups
CREATE INDEX IF NOT EXISTS idx_bidding_packages_project_id
  ON bidding_packages(project_id);

-- Task lookups
CREATE INDEX IF NOT EXISTS idx_tasks_project_id
  ON tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id
  ON tasks(assignee_id);


-- ╔══════════════════════════════════════════════╗
-- ║  Done! Summary:                               ║
-- ║  - 7 helper functions created                 ║
-- ║  - 92+ old "allow_all_*" policies dropped     ║
-- ║  - 100+ new role-based policies created       ║
-- ║  - 14 performance indexes added               ║
-- ╚══════════════════════════════════════════════╝


-- ==========================================
-- MIGRATION: 20260401120100_performance_indexes.sql
-- ==========================================

-- ============================================================
-- Migration: Performance indexes for 200-user scale
-- Created: 2026-04-01
-- ============================================================

-- Capital plan lookups (dashboard, reports)
CREATE INDEX IF NOT EXISTS idx_capital_plans_project_year
  ON capital_plans(project_id, year);

-- Disbursement lookups
CREATE INDEX IF NOT EXISTS idx_disbursements_project_id
  ON disbursements(project_id);

CREATE INDEX IF NOT EXISTS idx_disbursements_date
  ON disbursements(date DESC);

-- Document lookups (CDE module)
CREATE INDEX IF NOT EXISTS idx_documents_project_id
  ON documents(project_id);

CREATE INDEX IF NOT EXISTS idx_documents_cde_folder_id
  ON documents(cde_folder_id);

CREATE INDEX IF NOT EXISTS idx_documents_cde_status
  ON documents(cde_status);

-- CDE folder lookups
CREATE INDEX IF NOT EXISTS idx_cde_folders_project_id
  ON cde_folders(project_id);

CREATE INDEX IF NOT EXISTS idx_cde_folders_parent_id
  ON cde_folders(parent_id);

-- Task composite indexes (project plan view)
CREATE INDEX IF NOT EXISTS idx_tasks_project_status
  ON tasks(project_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by
  ON tasks(created_by);

-- Variation orders
CREATE INDEX IF NOT EXISTS idx_variation_orders_contract_id
  ON variation_orders(contract_id);

-- BIM models
CREATE INDEX IF NOT EXISTS idx_bim_models_project_id
  ON bim_models(project_id);

-- Facility assets
CREATE INDEX IF NOT EXISTS idx_facility_assets_project_id
  ON facility_assets(project_id);

-- Stage transitions (timeline)
CREATE INDEX IF NOT EXISTS idx_stage_transitions_project_id
  ON stage_transitions(project_id);

-- Construction works
CREATE INDEX IF NOT EXISTS idx_construction_works_project_id
  ON construction_works(project_id);

-- Workflow instances (project workflow)
CREATE INDEX IF NOT EXISTS idx_workflow_instances_reference
  ON workflow_instances(reference_id, reference_type);

-- Workflow tasks
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_instance_id
  ON workflow_tasks(instance_id);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status
  ON workflow_tasks(status);

-- Disbursement plans (monthly view)
CREATE INDEX IF NOT EXISTS idx_disbursement_plans_project_year
  ON disbursement_plans(project_id, year);

-- User permissions (RBAC check performance)
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_resource
  ON user_permissions(user_id, resource);

-- Package bidders
CREATE INDEX IF NOT EXISTS idx_package_bidders_package_id
  ON package_bidders(package_id);

-- Inspections
CREATE INDEX IF NOT EXISTS idx_inspections_project_id
  ON inspections(project_id);


-- ==========================================
-- MIGRATION: 20260401140000_add_project_objectives.sql
-- ==========================================

-- Add Objective and InvestmentScale columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS investment_scale TEXT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';


-- ==========================================
-- MIGRATION: 20260401170000_patch_workflow_tasks_columns.sql
-- ==========================================

-- =================================================================
-- PATCH: Thêm các cột còn thiếu cho bảng workflow_tasks
-- 
-- Nguyên nhân: Bảng gốc chỉ có các cột cơ bản (node_id, status, 
-- comments...) nhưng code frontend đang ghi thêm name, progress,
-- metadata, task_type, start_date, started_at, cde_folder_id.
-- Khi upsert các trường này bị "unknown column" → lỗi silent fail.
-- =================================================================

-- 1. name — tên công việc
ALTER TABLE public.workflow_tasks 
  ADD COLUMN IF NOT EXISTS name VARCHAR(500);

-- 2. task_type — phân loại: 'workflow' (từ template) hoặc 'ad-hoc' (tạo tay)
ALTER TABLE public.workflow_tasks 
  ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'workflow';

-- 3. start_date — ngày bắt đầu kế hoạch
ALTER TABLE public.workflow_tasks 
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;

-- 4. started_at — ngày bắt đầu thực tế
ALTER TABLE public.workflow_tasks 
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- 5. progress — tiến độ 0-100
ALTER TABLE public.workflow_tasks 
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- 6. metadata — JSONB chứa dữ liệu mở rộng (subtasks, attachments, costs...)
ALTER TABLE public.workflow_tasks 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 7. cde_folder_id — liên kết tới CDE folder
ALTER TABLE public.workflow_tasks 
  ADD COLUMN IF NOT EXISTS cde_folder_id VARCHAR(255);

-- 8. updated_at — timestamp cập nhật (service ghi mỗi lần save)
ALTER TABLE public.workflow_tasks 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 9. Cho phép node_id NULL cho các task ad-hoc (không thuộc bước nào)
ALTER TABLE public.workflow_tasks 
  ALTER COLUMN node_id DROP NOT NULL;

-- 10. Index cho truy vấn nhanh
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_instance 
  ON public.workflow_tasks(instance_id);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status 
  ON public.workflow_tasks(status);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assignee 
  ON public.workflow_tasks(assignee_id);


-- ==========================================
-- MIGRATION: 20260401170100_patch_workflow_task_status_enum.sql
-- ==========================================

-- Add missing ENUM values for workflow_task_status
ALTER TYPE workflow_task_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE workflow_task_status ADD VALUE IF NOT EXISTS 'rejected';


-- ==========================================
-- MIGRATION: 20260402120000_add_is_deleted_to_workflow.sql
-- ==========================================

-- Add is_deleted column to workflow_nodes if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'workflow_nodes' 
          AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE public.workflow_nodes ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;


-- ==========================================
-- MIGRATION: 20260402_unified_tasks_schema.sql
-- ==========================================

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Unified Tasks Schema
-- Mục tiêu: Gộp tasks + workflow_tasks → 1 bảng tasks duy nhất
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. DỌN SẠCH DỮ LIỆU CŨ (Demo data) ────────────────────
-- Xóa bảng con trước (FK dependencies)
DROP TABLE IF EXISTS public.sub_tasks CASCADE;
DROP TABLE IF EXISTS public.workflow_tasks CASCADE;
DROP TABLE IF EXISTS public.workflow_instances CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;

-- ─── 2. THÊM sort_order VÀO workflow_nodes ───────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'workflow_nodes' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE public.workflow_nodes ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- ─── 3. TẠO ENUM MỚI (nếu chưa có) ─────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
        CREATE TYPE task_type AS ENUM ('project', 'internal');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
END $$;

-- ─── 4. BẢNG TASKS MỚI (UUID PK, Unified) ───────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Phân loại
    task_type task_type NOT NULL DEFAULT 'project',
    
    -- Liên kết dự án (nullable: nội bộ thì null)
    project_id TEXT REFERENCES public.projects(project_id) ON DELETE CASCADE,
    
    -- Tham chiếu quy trình mẫu (nullable: tạo thủ công thì null)
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
    workflow_node_id UUID REFERENCES public.workflow_nodes(id) ON DELETE SET NULL,
    
    -- Thông tin cơ bản
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'todo',
    priority task_priority NOT NULL DEFAULT 'medium',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Người thực hiện
    assignee_id TEXT,
    approver_id TEXT,
    
    -- Thời gian kế hoạch
    start_date DATE,
    due_date DATE,
    duration_days INTEGER,
    
    -- Thời gian thực tế
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Phân loại giai đoạn (cho Tab Kế hoạch)
    phase VARCHAR(100),           -- e.g., 'preparation', 'execution', 'completion'
    step_code VARCHAR(255),       -- human-readable code, e.g., 'PREP_POLICY'
    sort_order INTEGER DEFAULT 0, -- thứ tự hiển thị
    
    -- Chi phí
    estimated_cost NUMERIC,
    actual_cost NUMERIC,
    
    -- Pháp lý & Tài liệu
    legal_basis TEXT,
    output_document TEXT,
    
    -- Quan hệ predecessor
    predecessor_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    
    -- Metadata JSONB (sub_tasks inline, attachments, etc.)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. BẢNG SUB_TASKS MỚI ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sub_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'todo',
    assignee_id TEXT,
    due_date DATE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 6. INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON public.tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_id ON public.tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_node_id ON public.tasks(workflow_node_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON public.tasks(phase);
CREATE INDEX IF NOT EXISTS idx_sub_tasks_task_id ON public.sub_tasks(task_id);

-- ─── 7. TRIGGERS ─────────────────────────────────────────────
-- Updated_at auto-update (reuse existing trigger function)
CREATE OR REPLACE TRIGGER set_timestamp_tasks
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_sub_tasks
    BEFORE UPDATE ON public.sub_tasks
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- ─── 8. RLS POLICIES ─────────────────────────────────────────
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;

-- Dev/Admin: mở rộng toàn bộ (sẽ siết lại khi production)
CREATE POLICY "Enable all for tasks" ON public.tasks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for sub_tasks" ON public.sub_tasks
    FOR ALL USING (true) WITH CHECK (true);

-- ─── 9. COMMENTS ─────────────────────────────────────────────
COMMENT ON TABLE public.tasks IS 'Bảng công việc thống nhất — dự án + nội bộ, có/không tham chiếu quy trình mẫu';
COMMENT ON TABLE public.sub_tasks IS 'Công việc con thuộc task cha';
COMMENT ON COLUMN public.tasks.task_type IS 'project: thuộc dự án, internal: nội bộ';
COMMENT ON COLUMN public.tasks.workflow_id IS 'Tham chiếu quy trình mẫu (nullable)';
COMMENT ON COLUMN public.tasks.workflow_node_id IS 'Tham chiếu bước trong quy trình mẫu (nullable)';


-- ==========================================
-- MIGRATION: 20260508_create_legal_documents.sql
-- ==========================================

-- ============================================================
-- Migration: Create legal_documents schema
-- Date: 2026-05-08
-- Description: Replaces static legalData.ts (2.1MB) with DB
-- ============================================================

-- ---- Enums ----
DO $$ BEGIN
  CREATE TYPE doc_type AS ENUM ('luat','nghi-dinh','thong-tu','qcvn','quyet-dinh');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM ('hieu-luc','het-hieu-luc','sap-hieu-luc');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---- Table: legal_documents ----
CREATE TABLE IF NOT EXISTS legal_documents (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL,
  title         TEXT NOT NULL,
  short_title   TEXT,
  type          doc_type NOT NULL,
  issued_date   TEXT,
  effective_date TEXT,
  issued_by     TEXT,
  status        doc_status NOT NULL DEFAULT 'hieu-luc',
  summary       TEXT,
  file_name     TEXT,
  file_path     TEXT,
  file_size     TEXT,
  tags          TEXT[]    DEFAULT '{}',
  related_doc_ids TEXT[]  DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Table: legal_chapters ----
CREATE TABLE IF NOT EXISTS legal_chapters (
  id          TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  title       TEXT NOT NULL,
  sort_order  INT  NOT NULL DEFAULT 0
);

-- ---- Table: legal_articles ----
CREATE TABLE IF NOT EXISTS legal_articles (
  id          TEXT PRIMARY KEY,
  chapter_id  TEXT NOT NULL REFERENCES legal_chapters(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT,
  content     TEXT,
  full_content TEXT,
  sort_order  INT  NOT NULL DEFAULT 0
);

-- ---- Indexes ----
CREATE INDEX IF NOT EXISTS idx_legal_docs_type ON legal_documents(type);
CREATE INDEX IF NOT EXISTS idx_legal_docs_status ON legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_legal_docs_tags ON legal_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_legal_chapters_doc ON legal_chapters(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_articles_chapter ON legal_articles(chapter_id);
CREATE INDEX IF NOT EXISTS idx_legal_articles_doc ON legal_articles(document_id);

-- Full-text search index (Vietnamese-compatible)
CREATE INDEX IF NOT EXISTS idx_legal_docs_fts ON legal_documents
  USING GIN(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(code,'')));

CREATE INDEX IF NOT EXISTS idx_legal_articles_fts ON legal_articles
  USING GIN(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(content,'')));

-- ---- RLS ----
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_chapters  ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_articles  ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "legal_docs_select" ON legal_documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "legal_chapters_select" ON legal_chapters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "legal_articles_select" ON legal_articles
  FOR SELECT TO authenticated USING (true);

-- Only admin can insert/update/delete
CREATE POLICY "legal_docs_admin_all" ON legal_documents
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM user_permissions WHERE resource = 'admin_accounts' AND can_manage = true))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM user_permissions WHERE resource = 'admin_accounts' AND can_manage = true));

-- ---- Trigger: updated_at ----
CREATE OR REPLACE FUNCTION update_legal_doc_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_legal_docs_updated ON legal_documents;
CREATE TRIGGER trg_legal_docs_updated
  BEFORE UPDATE ON legal_documents
  FOR EACH ROW EXECUTE FUNCTION update_legal_doc_timestamp();


