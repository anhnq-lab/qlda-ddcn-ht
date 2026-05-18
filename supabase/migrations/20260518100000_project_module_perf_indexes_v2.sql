-- ============================================================
-- Migration: Performance indexes v2 — Project Module Optimization
-- Created: 2026-05-18
-- Rationale: 
--   1. Support N+1 fix in TaskService.countByProject (group_by project_id on workflow_tasks)
--   2. Support ProjectService.getStats faceted search (group_code, management_board, status)
--   3. Support ProjectService.getPaginated sorting by total_investment, project_name
--   4. Support CapitalService disbursement queries by type and status
--   5. Support MidTermCapitalPage cross-project aggregate queries
-- ============================================================

-- ── workflow_tasks: support countByProject GROUP BY query ──
-- CountByProject dùng GROUP BY project_id qua workflow_instances join
-- Index này tăng tốc JOIN giữa workflow_tasks và workflow_instances
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_node_status
  ON workflow_tasks(node_id, status);

-- Composite index hỗ trợ filter theo assignee + project (task assignment queries)
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assignee_status
  ON workflow_tasks(assignee_id, status)
  WHERE assignee_id IS NOT NULL;

-- ── projects: support faceted search in getStats and getPaginated ──
-- Cột group_code và management_board dùng cho filter/faceting trong ProjectService.getStats()
CREATE INDEX IF NOT EXISTS idx_projects_group_code
  ON projects(group_code)
  WHERE group_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_management_board
  ON projects(management_board)
  WHERE management_board IS NOT NULL;

-- Composite index cho filter kết hợp status + group (phổ biến nhất trong filter panel)
CREATE INDEX IF NOT EXISTS idx_projects_status_group
  ON projects(status, group_code);

-- Index cho sort by total_investment (Sorting in getPaginated)
CREATE INDEX IF NOT EXISTS idx_projects_total_investment
  ON projects(total_investment DESC NULLS LAST);

-- Index cho sort by project_name (text sorting) — partial để skip NULLs
CREATE INDEX IF NOT EXISTS idx_projects_name_lower
  ON projects(lower(project_name));

-- ── disbursements: support type and status filters in CapitalService ──
-- Queries như: type = 'TamUng' AND status = 'Approved' dùng thường xuyên
CREATE INDEX IF NOT EXISTS idx_disbursements_type_status
  ON disbursements(type, status);

-- Composite: project + type + date (dùng trong calculateTrueDisbursed)
CREATE INDEX IF NOT EXISTS idx_disbursements_project_type
  ON disbursements(project_id, type, status);

-- ── bidding_packages: support KHLCNT grouping queries ──
CREATE INDEX IF NOT EXISTS idx_bidding_packages_project_plan
  ON bidding_packages(project_id, procurement_plan_id)
  WHERE procurement_plan_id IS NOT NULL;

-- ── workflow_instances: support reference_type filter (project workflows) ──
CREATE INDEX IF NOT EXISTS idx_workflow_instances_project_ref
  ON workflow_instances(reference_id)
  WHERE reference_type = 'project';

-- ── capital_plans: support mid-term period range queries ──
CREATE INDEX IF NOT EXISTS idx_capital_plans_period
  ON capital_plans(project_id, plan_type, period_start, period_end)
  WHERE plan_type = 'mid_term';

-- ── Analyze tables to update query planner statistics ──
ANALYZE projects;
ANALYZE workflow_tasks;
ANALYZE disbursements;
ANALYZE capital_plans;
