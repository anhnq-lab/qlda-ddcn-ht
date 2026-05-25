// TaskService workflow-seed module — wrapper mỏng quanh ProjectStepsService.
// Sau refactor 24/05/2026, chỉ tạo steps (MPI rows) — KHÔNG tạo tasks tự động.
// Công việc phải được tạo thủ công từ tab Công việc hoặc từ bước trong KH tháng.
//
//   createTasksFromWorkflow(projectId, workflowId, startDate, endDate?)
//   createTasksFromCustomPlan(projectId, workflowId, steps, targetEndDate?)

import { WorkflowTemplateService } from '../WorkflowTemplateService';
import { ProjectStepsService, type CustomPlanStep } from '../ProjectStepsService';
import { addWorkingDays } from './helpers';

// Re-export type for backward compat
export type { CustomPlanStep };

// ── Public: from workflow template ───────────────────────────────────

export const createTasksFromWorkflow = async (
  projectId: string,
  workflowId: string,
  startDate: string,
  _endDate?: string
): Promise<void> => {
  const nodes = await WorkflowTemplateService.getTemplateNodes(workflowId);
  const SKIP_TYPES = new Set(['gateway', 'connector']);
  const workNodes = nodes.filter((n) => !SKIP_TYPES.has(n.type));
  if (workNodes.length === 0) return;

  // Build CustomPlanStep[] từ template
  const customSteps: CustomPlanStep[] = [];
  let currentDate = new Date(startDate);

  for (const node of workNodes) {
    const nodeMetadata: any = node.metadata || {};

    let nodeSla = 1;
    if (node.sla_formula) {
      const m = node.sla_formula.match(/^(\d+)d$/);
      if (m) nodeSla = parseInt(m[1]);
    }

    const nodeStartDate = new Date(currentDate);
    const nodeEndDate = addWorkingDays(currentDate, nodeSla);

    customSteps.push({
      workflow_node_id: node.id,
      title: node.name,
      phase: nodeMetadata.phase || 'preparation',
      assignee_role: nodeMetadata.assignee_role || '',
      start_date: nodeStartDate.toISOString().split('T')[0],
      due_date: nodeEndDate.toISOString().split('T')[0],
      duration_days: nodeSla,
      legal_basis: nodeMetadata.legalBasis || nodeMetadata.legal_basis || '',
      output_document: nodeMetadata.output || nodeMetadata.output_document || '',
      sub_tasks: nodeMetadata.sub_tasks || [],
      metadata: nodeMetadata,
    });

    currentDate = new Date(nodeEndDate);
  }

  await ProjectStepsService.createFromCustomPlan(projectId, workflowId, customSteps);
};

// ── Public: from custom step list ────────────────────────────────────

export const createTasksFromCustomPlan = async (
  projectId: string,
  workflowId: string | null,
  steps: CustomPlanStep[],
  _targetEndDate?: string
): Promise<void> => {
  await ProjectStepsService.createFromCustomPlan(projectId, workflowId, steps);
};
