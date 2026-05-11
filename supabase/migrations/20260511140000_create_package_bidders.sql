CREATE TABLE IF NOT EXISTS public.package_bidders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id character varying(50) NOT NULL REFERENCES public.bidding_packages(package_id) ON DELETE CASCADE,
    contractor_id character varying(50) NOT NULL REFERENCES public.contractors(contractor_id),
    bid_price numeric,
    status character varying(50),
    rank integer,
    technical_score numeric,
    financial_score numeric,
    combined_score numeric,
    appointment_reason text,
    decision_agency character varying(255),
    decision_date date,
    decision_number character varying(100),
    evaluation_file_name character varying(255),
    evaluation_file_url text,
    hsdx_date date,
    hsyc_date date,
    legal_basis text,
    negotiated_price numeric,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Bật RLS
ALTER TABLE public.package_bidders ENABLE ROW LEVEL SECURITY;

-- Cấp quyền truy cập dựa trên RLS (giống như trong rls_hardening_all_tables.sql)
CREATE POLICY "package_bidders_select" ON package_bidders FOR SELECT TO authenticated USING (public.is_global_role() OR EXISTS (SELECT 1 FROM bidding_packages bp WHERE bp.package_id = package_bidders.package_id AND public.is_project_member(bp.project_id)));
CREATE POLICY "package_bidders_insert" ON package_bidders FOR INSERT TO authenticated WITH CHECK (public.is_global_role() OR EXISTS (SELECT 1 FROM bidding_packages bp WHERE bp.package_id = package_bidders.package_id AND public.is_project_member(bp.project_id)));
CREATE POLICY "package_bidders_update" ON package_bidders FOR UPDATE TO authenticated USING (public.is_global_role() OR EXISTS (SELECT 1 FROM bidding_packages bp WHERE bp.package_id = package_bidders.package_id AND public.is_project_member(bp.project_id))) WITH CHECK (public.is_global_role() OR EXISTS (SELECT 1 FROM bidding_packages bp WHERE bp.package_id = package_bidders.package_id AND public.is_project_member(bp.project_id)));
CREATE POLICY "package_bidders_delete" ON package_bidders FOR DELETE TO authenticated USING (public.is_admin());

-- Index
CREATE INDEX IF NOT EXISTS idx_package_bidders_package_id ON package_bidders(package_id);
