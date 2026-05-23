-- Migration: Merge duplicate updated_at triggers into a single set_updated_at() function
-- Targets: workflows, workflow_nodes, workflow_instances, tasks, legal_documents, cde_internal_workflows, bim_saved_views, bim_issues

-- 1. Create the unified trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop existing triggers and recreate them using the unified function
-- Workflows
DROP TRIGGER IF EXISTS set_timestamp_workflows ON public.workflows;
CREATE TRIGGER set_timestamp_workflows
BEFORE UPDATE ON public.workflows
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_workflow_nodes ON public.workflow_nodes;
CREATE TRIGGER set_timestamp_workflow_nodes
BEFORE UPDATE ON public.workflow_nodes
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_workflow_instances ON public.workflow_instances;
CREATE TRIGGER set_timestamp_workflow_instances
BEFORE UPDATE ON public.workflow_instances
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Tasks
DROP TRIGGER IF EXISTS set_timestamp_tasks ON public.tasks;
CREATE TRIGGER set_timestamp_tasks
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Legal Documents
DROP TRIGGER IF EXISTS trg_legal_docs_updated ON public.legal_documents;
CREATE TRIGGER trg_legal_docs_updated
BEFORE UPDATE ON public.legal_documents
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- CDE Internal Workflows
DROP TRIGGER IF EXISTS trg_cde_internal_workflows_updated_at ON public.cde_internal_workflows;
CREATE TRIGGER trg_cde_internal_workflows_updated_at
BEFORE UPDATE ON public.cde_internal_workflows
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- BIM Saved Views
DROP TRIGGER IF EXISTS trg_bim_saved_views_updated_at ON public.bim_saved_views;
CREATE TRIGGER trg_bim_saved_views_updated_at
BEFORE UPDATE ON public.bim_saved_views
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- BIM Issues
DROP TRIGGER IF EXISTS trg_bim_issues_updated_at ON public.bim_issues;
CREATE TRIGGER trg_bim_issues_updated_at
BEFORE UPDATE ON public.bim_issues
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- 3. Cleanup old trigger functions safely
DROP FUNCTION IF EXISTS update_legal_doc_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_cwi_updated_at() CASCADE;
DROP FUNCTION IF EXISTS bim_collab_touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS trigger_set_timestamp() CASCADE;
