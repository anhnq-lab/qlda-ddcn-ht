// TaskService workflow-seed module — generates a sequenced WBS (tasks +
// monthly_plan_items + workflow_instances) from a workflow template OR an
// ad-hoc custom plan. Two public functions:
//
//   createTasksFromWorkflow(projectId, workflowId, startDate, endDate?)
//   createTasksFromCustomPlan(projectId, workflowId, steps, targetEndDate?)
//
// Both replay the same pipeline: clear prior project tasks → walk a
// sequence of "steps" (template nodes or custom rows) → for each step
// emit one task per WBS sub-task (or one for the step itself when there
// are no sub-tasks) → bulk-insert monthly_plan_items first (FK target),
// then tasks, then back-fill source_task_id on the MPIs. Helper
// `buildPlanRows()` deduplicates the build logic; the two public
// functions only differ in *how they get the date range and metadata for
// each step*.
import { supabase } from '../../lib/supabase';
import { WorkflowTemplateService } from '../WorkflowTemplateService';
import { toServiceError } from '../ServiceError';
import { DEPARTMENT_NAMES } from '../../types/plan.types';
import {
  DbTask,
  addWorkingDays,
  distributeDates,
  generateUUID,
  getDeptCode,
  getOrCreateMonthlyPlan,
} from './helpers';
import { deleteProjectTasks } from './taskCrud';

// ── Internal shared row types ────────────────────────────────────────

interface PlanRow {
  task: any;            // insert row for `tasks`
  mpi: any | null;      // insert row for `monthly_plan_items` (null when no mPlan)
  link: { mpiId: string; taskId: string } | null;
}

const truncateTitle = (s: string) => (s.length > 450 ? s.substring(0, 447) + '...' : s);

const phaseGroupName = (phase: string): string => {
  if (phase === 'preparation') return 'Giai đoạn Chuẩn bị đầu tư';
  if (phase === 'completion' || phase === 'closing') return 'Giai đoạn Kết thúc dự án';
  return 'Giai đoạn Thực hiện xây lắp';
};

interface BuildOneArgs {
  projectId: string;
  workflowId: string | null;
  workflowNodeId: string | null;
  stepCode: string;
  phase: string;
  title: string;
  assigneeRole: string;
  legalBasis: string;
  outputDoc: string;
  startDateStr: string;
  endDateStr: string;
  durationDays: number;
  sortOrder: number;
  predecessor: string | null;
  metadataExtra: Record<string, any>;
  monthlyPlanCache: Record<string, string>;
  annualPlanMap: Record<string, string>;
  mpiTaskNameOverride?: string;   // for non-subtask path: 'Triển khai: <node.name>'
  mpiDeliverableOverride?: string;
}

const buildOne = async (a: BuildOneArgs): Promise<PlanRow> => {
  const startObj = new Date(a.startDateStr);
  const year = startObj.getFullYear();
  const month = startObj.getMonth() + 1;
  const deptCode = getDeptCode(a.assigneeRole);
  const deptName = DEPARTMENT_NAMES[deptCode] || '';

  let mPlanId: string | null = null;
  try {
    mPlanId = await getOrCreateMonthlyPlan(month, year, deptCode, deptName, a.monthlyPlanCache);
  } catch (err) {
    console.error('Không thể tạo kế hoạch tháng:', err);
  }

  const taskId = generateUUID();
  const mpiId  = generateUUID();

  const mpi = mPlanId
    ? {
        id: mpiId,
        monthly_plan_id: mPlanId,
        annual_plan_item_id: a.annualPlanMap[`${year}_${deptCode}`] || null,
        project_id: a.projectId,
        group_name: phaseGroupName(a.phase),
        task_name: a.mpiTaskNameOverride || a.title,
        deliverable: a.mpiDeliverableOverride || a.outputDoc || 'Sản phẩm hoàn thành nghiệm thu theo quy trình',
        deadline_note: `Định hạn hoàn thành: ${a.endDateStr}`,
        due_date: a.endDateStr,
        status: 'planned',
        source_task_id: null,
        source_type: 'from_project_task',
        collaborating_text: 'Ban Giám đốc',
        collaborating_dept_codes: ['BGĐ'],
        notes: 'Ánh xạ tự động từ quy trình WBS của Dự án',
      }
    : null;

  const task = {
    id: taskId,
    project_id: a.projectId,
    title: truncateTitle(a.title),
    status: 'todo',
    task_type: 'project',
    workflow_id: a.workflowId,
    workflow_node_id: a.workflowNodeId,
    priority: 'medium',
    progress: 0,
    start_date: a.startDateStr,
    due_date: a.endDateStr,
    duration_days: a.durationDays,
    phase: a.phase,
    step_code: a.stepCode,
    sort_order: a.sortOrder,
    predecessor_task_id: a.predecessor,
    legal_basis: a.legalBasis,
    output_document: a.outputDoc,
    monthly_plan_item_id: mPlanId ? mpiId : null,
    metadata: { assignee_role: a.assigneeRole, is_wbs: true, ...a.metadataExtra },
  };

  return { task, mpi, link: mpi ? { mpiId, taskId } : null };
};

// ── Bulk-insert + back-link MPIs → tasks ─────────────────────────────

interface CommitArgs {
  projectId: string;
  workflowId: string | null;
  tasksToInsert: any[];
  monthlyPlanItemsToInsert: any[];
  linksToUpdate: Array<{ mpiId: string; taskId: string }>;
  contextData?: Record<string, unknown>;
  errorContext: string;
}

const commit = async (a: CommitArgs): Promise<DbTask[]> => {
  if (a.monthlyPlanItemsToInsert.length > 0) {
    const { error: mpiErr } = await supabase.from('monthly_plan_items').insert(a.monthlyPlanItemsToInsert);
    if (mpiErr) {
      console.error('Lỗi khi chèn monthly plan items:', mpiErr);
      throw toServiceError(mpiErr, a.errorContext);
    }
  }

  if (a.tasksToInsert.length === 0) return [];

  const { data, error } = await supabase.from('tasks').insert(a.tasksToInsert as any).select();
  if (error) throw toServiceError(error, a.errorContext);

  if (a.linksToUpdate.length > 0) {
    try {
      await Promise.all(
        a.linksToUpdate.map((link) =>
          supabase.from('monthly_plan_items').update({ source_task_id: link.taskId } as any).eq('id', link.mpiId)
        )
      );
    } catch (updErr) {
      console.error('Lỗi khi cập nhật source_task_id cho monthly_plan_items:', updErr);
    }
  }

  if (a.workflowId) {
    const { error: instErr } = await supabase.from('workflow_instances').insert({
      id: generateUUID(),
      workflow_id: a.workflowId,
      reference_id: a.projectId,
      reference_type: 'project',
      status: 'in_progress',
      started_at: new Date().toISOString(),
      context_data: a.contextData || {},
    } as any);
    if (instErr) console.error('Lỗi khi đăng ký workflow instance:', instErr);
  }

  return (data || []) as unknown as DbTask[];
};

const loadAnnualPlanMap = async (projectId: string): Promise<Record<string, string>> => {
  const { data } = await (supabase as any)
    .from('annual_plan_items')
    .select('id, plan_year, department_code')
    .eq('project_id', projectId);

  const map: Record<string, string> = {};
  for (const ap of data || []) map[`${ap.plan_year}_${ap.department_code}`] = ap.id;
  return map;
};

const clearPriorPlan = async (projectId: string): Promise<void> => {
  await deleteProjectTasks(projectId);
  await supabase
    .from('workflow_instances')
    .delete()
    .eq('reference_id', projectId)
    .eq('reference_type', 'project');
};

// ── Public: from workflow template ───────────────────────────────────

export const createTasksFromWorkflow = async (
  projectId: string,
  workflowId: string,
  startDate: string,
  endDate?: string
): Promise<DbTask[]> => {
  await clearPriorPlan(projectId);

  const nodes = await WorkflowTemplateService.getTemplateNodes(workflowId);
  const SKIP_TYPES = new Set(['gateway', 'connector']);
  const workNodes = nodes.filter((n) => !SKIP_TYPES.has(n.type));
  if (workNodes.length === 0) return [];

  const monthlyPlanCache: Record<string, string> = {};
  const annualPlanMap = await loadAnnualPlanMap(projectId);

  const tasksToInsert: any[] = [];
  const monthlyPlanItemsToInsert: any[] = [];
  const linksToUpdate: Array<{ mpiId: string; taskId: string }> = [];

  let currentDate = new Date(startDate);
  let previousTaskId: string | null = null;
  let currentSortOrder = 0;

  for (const node of workNodes) {
    const nodeMetadata: any = node.metadata || {};
    const subTasksDef: any[] = nodeMetadata.sub_tasks || [];
    const phase = nodeMetadata.phase || 'preparation';

    let nodeSla = 1;
    if (node.sla_formula) {
      const m = node.sla_formula.match(/^(\d+)d$/);
      if (m) nodeSla = parseInt(m[1]);
    }

    const nodeStartDate = new Date(currentDate);
    const nodeEndDate = addWorkingDays(currentDate, nodeSla);

    if (subTasksDef.length > 0) {
      // ── Subtasks elevated to standalone tasks ─────────────
      const subCount = subTasksDef.length;
      const baseSla = Math.floor(nodeSla / subCount);
      const remainderSla = nodeSla % subCount;
      let currentSubStartDate = new Date(nodeStartDate);

      for (let idx = 0; idx < subCount; idx++) {
        const st = subTasksDef[idx];
        const subSla = Math.max(1, baseSla + (idx < remainderSla ? 1 : 0));
        const subStartDate = new Date(currentSubStartDate);
        const subEndDate = addWorkingDays(subStartDate, subSla);

        const row = await buildOne({
          projectId,
          workflowId,
          workflowNodeId: node.id,
          stepCode: node.id,
          phase,
          title: st.name || st.title || `Công việc ${idx + 1}`,
          assigneeRole:
            st.assignee_role || st.assignedTo || st.actor || nodeMetadata.assignee_role || '',
          legalBasis:
            st.legal_basis || st.legalBasis || nodeMetadata.legalBasis || nodeMetadata.legal_basis || '',
          outputDoc:
            st.output || st.output_document || nodeMetadata.output || nodeMetadata.output_document || '',
          startDateStr: subStartDate.toISOString().split('T')[0],
          endDateStr: subEndDate.toISOString().split('T')[0],
          durationDays: subSla,
          sortOrder: currentSortOrder++,
          predecessor: previousTaskId,
          metadataExtra: { is_elevated_subtask: true, node_id: node.id },
          monthlyPlanCache,
          annualPlanMap,
        });

        tasksToInsert.push(row.task);
        if (row.mpi) monthlyPlanItemsToInsert.push(row.mpi);
        if (row.link) linksToUpdate.push(row.link);

        previousTaskId = row.task.id;
        currentSubStartDate = new Date(subEndDate);
      }
    } else {
      // ── Single representative task for the node ────────────
      const row = await buildOne({
        projectId,
        workflowId,
        workflowNodeId: node.id,
        stepCode: node.id,
        phase,
        title: node.name,
        assigneeRole: nodeMetadata.assignee_role || '',
        legalBasis: nodeMetadata.legalBasis || nodeMetadata.legal_basis || '',
        outputDoc: nodeMetadata.output || nodeMetadata.output_document || '',
        startDateStr: nodeStartDate.toISOString().split('T')[0],
        endDateStr: nodeEndDate.toISOString().split('T')[0],
        durationDays: nodeSla,
        sortOrder: currentSortOrder++,
        predecessor: previousTaskId,
        metadataExtra: { node_id: node.id },
        monthlyPlanCache,
        annualPlanMap,
        mpiTaskNameOverride: `Triển khai: ${node.name}`,
      });

      tasksToInsert.push(row.task);
      if (row.mpi) monthlyPlanItemsToInsert.push(row.mpi);
      if (row.link) linksToUpdate.push(row.link);
      previousTaskId = row.task.id;
    }

    currentDate = new Date(nodeEndDate);
  }

  return commit({
    projectId,
    workflowId,
    tasksToInsert,
    monthlyPlanItemsToInsert,
    linksToUpdate,
    contextData: endDate ? { target_end_date: endDate } : {},
    errorContext: 'Tạo kế hoạch thất bại',
  });
};

// ── Public: from custom step list ────────────────────────────────────

export interface CustomPlanStep {
  workflow_node_id: string | null;
  title: string;
  phase: string;
  assignee_role: string;
  start_date: string;
  due_date: string;
  duration_days: number;
  legal_basis?: string;
  output_document?: string;
  metadata?: any;
  sub_tasks?: any[];
}

export const createTasksFromCustomPlan = async (
  projectId: string,
  workflowId: string | null,
  steps: CustomPlanStep[],
  targetEndDate?: string
): Promise<DbTask[]> => {
  await clearPriorPlan(projectId);

  const monthlyPlanCache: Record<string, string> = {};
  const annualPlanMap = await loadAnnualPlanMap(projectId);

  const tasksToInsert: any[] = [];
  const monthlyPlanItemsToInsert: any[] = [];
  const linksToUpdate: Array<{ mpiId: string; taskId: string }> = [];

  let previousTaskId: string | null = null;
  let currentSortOrder = 0;

  for (const step of steps) {
    const nodeMetadata = step.metadata || {};
    const parentStepCode = step.workflow_node_id || generateUUID();
    const phase = step.phase || 'preparation';

    if (step.sub_tasks && step.sub_tasks.length > 0) {
      const subCount = step.sub_tasks.length;
      for (let idx = 0; idx < subCount; idx++) {
        const st = step.sub_tasks[idx];
        const subDates = distributeDates(step.start_date, step.due_date, subCount, idx);
        const subSla =
          Math.ceil(
            Math.abs(new Date(subDates.end).getTime() - new Date(subDates.start).getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;

        const row = await buildOne({
          projectId,
          workflowId,
          workflowNodeId: step.workflow_node_id,
          stepCode: parentStepCode,
          phase,
          title: st.name || st.title || `Công việc ${idx + 1}`,
          assigneeRole:
            st.assignee_role || st.metadata?.assignee_role || st.assignedTo || step.assignee_role || '',
          legalBasis:
            st.legal_basis || st.metadata?.legal_basis || st.legalBasis || step.legal_basis || '',
          outputDoc:
            st.output || st.metadata?.output || st.output_document || step.output_document || '',
          startDateStr: subDates.start,
          endDateStr: subDates.end,
          durationDays: subSla,
          sortOrder: currentSortOrder++,
          predecessor: previousTaskId,
          metadataExtra: { is_elevated_subtask: true, node_id: step.workflow_node_id },
          monthlyPlanCache,
          annualPlanMap,
        });

        tasksToInsert.push(row.task);
        if (row.mpi) monthlyPlanItemsToInsert.push(row.mpi);
        if (row.link) linksToUpdate.push(row.link);
        previousTaskId = row.task.id;
      }
    } else {
      const row = await buildOne({
        projectId,
        workflowId,
        workflowNodeId: step.workflow_node_id,
        stepCode: parentStepCode,
        phase,
        title: step.title,
        assigneeRole: step.assignee_role || nodeMetadata.assignee_role || '',
        legalBasis: step.legal_basis || nodeMetadata.legal_basis || nodeMetadata.legalBasis || '',
        outputDoc: step.output_document || nodeMetadata.output_document || nodeMetadata.output || '',
        startDateStr: step.start_date,
        endDateStr: step.due_date,
        durationDays: step.duration_days,
        sortOrder: currentSortOrder++,
        predecessor: previousTaskId,
        metadataExtra: { node_id: step.workflow_node_id },
        monthlyPlanCache,
        annualPlanMap,
        mpiTaskNameOverride: `Triển khai: ${step.title}`,
      });

      tasksToInsert.push(row.task);
      if (row.mpi) monthlyPlanItemsToInsert.push(row.mpi);
      if (row.link) linksToUpdate.push(row.link);
      previousTaskId = row.task.id;
    }
  }

  return commit({
    projectId,
    workflowId,
    tasksToInsert,
    monthlyPlanItemsToInsert,
    linksToUpdate,
    contextData: targetEndDate ? { target_end_date: targetEndDate } : {},
    errorContext: 'Tạo kế hoạch tùy chỉnh thất bại',
  });
};
