-- 1. Alter table tasks to add department_code, annual_plan_item_id, and source_type
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS department_code TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS annual_plan_item_id UUID REFERENCES public.annual_plan_items(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';

-- 2. Backfill department_code from employees
UPDATE public.tasks t SET department_code = e.department
FROM public.employees e WHERE t.assignee_id = e.employee_id AND t.department_code IS NULL;

-- 3. Trigger to auto-fill department_code on insert/update of assignee_id
CREATE OR REPLACE FUNCTION public.fill_task_department_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assignee_id IS NOT NULL THEN
        IF TG_OP = 'INSERT' OR NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
            SELECT department INTO NEW.department_code FROM public.employees WHERE employee_id = NEW.assignee_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fill_task_department_code ON public.tasks;
CREATE TRIGGER trg_fill_task_department_code
    BEFORE INSERT OR UPDATE OF assignee_id ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.fill_task_department_code();

-- 4. Drop MPI sync triggers and related functions
DROP TRIGGER IF EXISTS trg_sync_mpi_from_task_iu ON public.tasks CASCADE;
DROP TRIGGER IF EXISTS trg_sync_mpi_from_task_d ON public.tasks CASCADE;
DROP TRIGGER IF EXISTS trg_cascade_delete_tasks_with_step ON public.monthly_plan_items CASCADE;
DROP FUNCTION IF EXISTS public.compute_mpi_status_from_tasks CASCADE;
DROP FUNCTION IF EXISTS public.sync_mpi_from_task CASCADE;
DROP FUNCTION IF EXISTS public.cascade_delete_tasks_with_step CASCADE;

-- 5. Fix Foreign Key Constraints for assignee_id and approver_id in tasks
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_assignee_id_fkey
    FOREIGN KEY (assignee_id) REFERENCES public.employees(employee_id) ON DELETE SET NULL;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_approver_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_approver_id_fkey
    FOREIGN KEY (approver_id) REFERENCES public.employees(employee_id) ON DELETE SET NULL;

-- 6. Trigger to auto-update projects.progress
CREATE OR REPLACE FUNCTION public.update_project_progress() RETURNS TRIGGER AS $$
DECLARE
    v_project_id TEXT;
BEGIN
    v_project_id := COALESCE(NEW.project_id, OLD.project_id);
    IF v_project_id IS NOT NULL THEN
        UPDATE public.projects SET progress = COALESCE((
            SELECT ROUND(AVG(progress), 0)
            FROM public.tasks WHERE project_id = v_project_id
            AND parent_id IS NULL
        ), 0) WHERE project_id = v_project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_project_progress ON public.tasks;
CREATE TRIGGER trg_update_project_progress
    AFTER INSERT OR UPDATE OF progress OR DELETE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_project_progress();

-- 7. Create view_comments table
CREATE TABLE IF NOT EXISTS public.view_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    view_type TEXT NOT NULL,  -- 'briefing' | 'monthly_report' | 'evaluation'
    reference_id TEXT NOT NULL,  -- project_id, department_code
    comment_month INT NOT NULL,
    comment_year INT NOT NULL,
    content TEXT,
    commented_by TEXT REFERENCES public.employees(employee_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(view_type, reference_id, comment_month, comment_year)
);

CREATE INDEX IF NOT EXISTS idx_view_comments_lookup 
    ON public.view_comments(view_type, reference_id, comment_year, comment_month);

-- 8. Backfill existing project leader_comment into view_comments (current month/year)
INSERT INTO public.view_comments (view_type, reference_id, comment_month, comment_year, content)
SELECT 'briefing', project_id, EXTRACT(MONTH FROM now())::INT, 
       EXTRACT(YEAR FROM now())::INT, leader_comment
FROM public.projects 
WHERE leader_comment IS NOT NULL AND leader_comment != ''
ON CONFLICT (view_type, reference_id, comment_month, comment_year) DO UPDATE
SET content = EXCLUDED.content;
