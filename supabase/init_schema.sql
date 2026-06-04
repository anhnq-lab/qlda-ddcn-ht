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
    file_hash TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    encryption_key_id TEXT,
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
    file_hash TEXT,
    is_encrypted BOOLEAN DEFAULT false,
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
    ('NV001', 'quantrivien', '97aaf2d6a56550735e4c4a2bc1bc42b8b37f081f4bc0b8ca50203189fe86789a'),
    ('NV002', 'nguyenquanglinh', '1a678f06451f9296895f0ff755289072d5a86dc660c100758f031e2977184aa2'),
    ('NV003', 'tranngocbao', '75971380c0e6558d69bdf2cbca67b424152a71175d2cc3fe1b3b4bb7815dbc39'),
    ('NV004', 'nguyenvannhan', '56337a3684f46b49c9d8152e8bcdd3ffb1538319c32eb5261ac7862b02aeadb1'),
    ('NV040', 'ngoducquy', 'efd6e7c51b3a844ee68ac4f4578980b1645e7a9f7aeab125258ebfc1e1dfbc78')
ON CONFLICT (username) DO NOTHING;
