-- Create inspections table
CREATE TABLE IF NOT EXISTS public.inspections (
  inspection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES public.projects(project_id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('thanh_tra', 'kiem_toan')),
  inspection_name TEXT NOT NULL,
  inspection_agency TEXT,
  inspector_name TEXT,
  decision_number TEXT,
  decision_date DATE,
  start_date DATE,
  end_date DATE,
  conclusion TEXT,
  recommendations TEXT,
  penalties NUMERIC DEFAULT 0,
  follow_up_status TEXT DEFAULT 'pending' CHECK (follow_up_status IN ('pending', 'in_progress', 'completed')),
  follow_up_deadline DATE,
  follow_up_notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by TEXT REFERENCES public.employees(employee_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS inspections_select ON public.inspections;
DROP POLICY IF EXISTS inspections_insert ON public.inspections;
DROP POLICY IF EXISTS inspections_update ON public.inspections;
DROP POLICY IF EXISTS inspections_delete ON public.inspections;

-- Create Policies
CREATE POLICY "inspections_select" ON public.inspections FOR SELECT TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id));
CREATE POLICY "inspections_insert" ON public.inspections FOR INSERT TO authenticated WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));
CREATE POLICY "inspections_update" ON public.inspections FOR UPDATE TO authenticated USING (public.is_global_role() OR public.is_project_member(project_id)) WITH CHECK (public.is_global_role() OR public.is_project_member(project_id));
CREATE POLICY "inspections_delete" ON public.inspections FOR DELETE TO authenticated USING (public.is_admin());

-- Create performance index
CREATE INDEX IF NOT EXISTS idx_inspections_project_id ON public.inspections(project_id);
