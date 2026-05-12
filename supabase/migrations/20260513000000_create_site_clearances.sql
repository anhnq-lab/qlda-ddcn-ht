CREATE TABLE IF NOT EXISTS public.site_clearances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id TEXT NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE UNIQUE,
    total_area NUMERIC(15, 2) DEFAULT 0,
    cleared_area NUMERIC(15, 2) DEFAULT 0,
    total_households INTEGER DEFAULT 0,
    resettled_households INTEGER DEFAULT 0,
    compensation_budget NUMERIC(20, 2) DEFAULT 0,
    disbursed_compensation NUMERIC(20, 2) DEFAULT 0,
    status TEXT DEFAULT 'Chưa bắt đầu',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_clearance_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id TEXT NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    completed_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, step_number)
);

ALTER TABLE public.site_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_clearance_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read site_clearances for authenticated users" 
    ON public.site_clearances FOR SELECT 
    TO authenticated USING (true);

CREATE POLICY "Allow read site_clearance_milestones for authenticated users" 
    ON public.site_clearance_milestones FOR SELECT 
    TO authenticated USING (true);

CREATE POLICY "Allow insert/update site_clearances for authorized users" 
    ON public.site_clearances FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM user_permissions up
            WHERE up.user_id = auth.uid()::text 
            AND up.resource = 'site_clearance' 
            AND 'update' = ANY(up.actions)
        )
        OR 
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.employee_id = auth.uid()::text AND e.role IN ('super_admin', 'director', 'deputy_director')
        )
    );

CREATE POLICY "Allow insert/update milestones for authorized users" 
    ON public.site_clearance_milestones FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM user_permissions up
            WHERE up.user_id = auth.uid()::text 
            AND up.resource = 'site_clearance' 
            AND 'update' = ANY(up.actions)
        )
        OR 
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.employee_id = auth.uid()::text AND e.role IN ('super_admin', 'director', 'deputy_director')
        )
    );

CREATE TRIGGER set_timestamp_site_clearances
BEFORE UPDATE ON public.site_clearances
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_site_clearance_milestones
BEFORE UPDATE ON public.site_clearance_milestones
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
