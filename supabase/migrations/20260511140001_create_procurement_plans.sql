CREATE TABLE IF NOT EXISTS public.procurement_plans (
    plan_id character varying(50) PRIMARY KEY,
    project_id character varying(50) NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
    plan_name text NOT NULL,
    plan_code character varying(100),
    msc_plan_code character varying(100),
    plan_type character varying(100),
    total_value numeric,
    status character varying(50),
    decision_agency character varying(255),
    decision_date date,
    decision_number character varying(100),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Bật RLS
ALTER TABLE public.procurement_plans ENABLE ROW LEVEL SECURITY;

-- Cấp quyền truy cập dựa trên RLS (giống như trong rls_hardening_all_tables.sql)
CREATE POLICY "procurement_plans_select" ON procurement_plans FOR SELECT TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id));
CREATE POLICY "procurement_plans_insert" ON procurement_plans FOR INSERT TO authenticated WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));
CREATE POLICY "procurement_plans_update" ON procurement_plans FOR UPDATE TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id)) WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));
CREATE POLICY "procurement_plans_delete" ON procurement_plans FOR DELETE TO authenticated USING (public.is_admin());

-- Index
CREATE INDEX IF NOT EXISTS idx_procurement_plans_project_id ON procurement_plans(project_id);
