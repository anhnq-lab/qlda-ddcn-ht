// Internal helpers shared by task CRUD / collaboration / workflow-seed modules.
// Not part of the public TaskService surface.
import { supabase } from '../../lib/supabase';
import { DEPARTMENT_CODES, DepartmentCode } from '../../types/plan.types';

// ── Public-facing types (re-exported through TaskService) ────────────
export type TaskType = 'project' | 'internal';
export type DbTaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type DbTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface DbTask {
  id: string;
  task_type: TaskType;
  project_id: string | null;
  title: string;
  description: string | null;
  status: DbTaskStatus;
  priority: DbTaskPriority;
  progress: number;
  assignee_id: string | null;
  collaborator_ids: string[] | null;
  approver_id: string | null;
  start_date: string | null;
  due_date: string | null;
  duration_days: number | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  phase: string | null;
  step_code: string | null;
  sort_order: number;
  legal_basis: string | null;
  output_document: string | null;
  predecessor_task_id: string | null;
  category: string | null;
  completion_result: string | null;
  incomplete_reason: string | null;
  incomplete_reason_type: 'objective' | 'subjective' | null;
  is_self_proposed: boolean;
  proposal_status: 'pending' | 'approved' | 'rejected' | null;
  proposal_approved_by: string | null;
  proposal_approved_at: string | null;
  responsibility_level: 'individual' | 'team';
  notes: string | null;
  metadata: Record<string, any>;
  monthly_plan_item_id: string | null;
  project_plan_item_id: string | null;
  project_plan_step_id?: string | null;
  department_code: string | null;
  source_type: string | null;
  obstacles: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSubTask {
  id: string;
  task_id: string;
  title: string;
  status: string;
  assignee_id: string | null;
  due_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── Department code helpers ──────────────────────────────────────────

export const isDepartmentCode = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return (DEPARTMENT_CODES as readonly string[]).includes(id.toUpperCase());
};

export const getDeptCode = (assigneeRole: string | null | undefined): DepartmentCode => {
  if (!assigneeRole) return 'QLDA1';
  const roleUpper = assigneeRole.toUpperCase();
  for (const code of DEPARTMENT_CODES) {
    if (roleUpper.includes(code)) return code;
  }
  const roleLower = assigneeRole.toLowerCase();
  if (roleLower.includes('quản lý dự án 1') || roleLower.includes('qlda 1') || roleLower.includes('qlda1')) return 'QLDA1';
  if (roleLower.includes('quản lý dự án 2') || roleLower.includes('qlda 2') || roleLower.includes('qlda2')) return 'QLDA2';
  if (roleLower.includes('quản lý dự án 3') || roleLower.includes('qlda 3') || roleLower.includes('qlda3')) return 'QLDA3';
  if (roleLower.includes('kế hoạch') || roleLower.includes('đấu thầu') || roleLower.includes('khđt') || roleLower.includes('kh-đt')) return 'KHDT';
  if (roleLower.includes('kỹ thuật') || roleLower.includes('thẩm định') || roleLower.includes('kttđ') || roleLower.includes('kt-tđ')) return 'KTTD';
  if (roleLower.includes('tài chính') || roleLower.includes('kế toán') || roleLower.includes('tckt') || roleLower.includes('tc-kt')) return 'TCKT';
  if (roleLower.includes('hành chính') || roleLower.includes('tổng hợp') || roleLower.includes('hcth') || roleLower.includes('hc-th')) return 'HCTH';
  if (roleLower.includes('phát triển') || roleLower.includes('ptdv') || roleLower.includes('pt-dv')) return 'PTDV';
  return 'QLDA1';
};

// ── Monthly-plan upsert (cached per (year,month,deptCode) within a call) ──

export const getOrCreateMonthlyPlan = async (
  month: number,
  year: number,
  deptCode: DepartmentCode,
  deptName: string,
  cache: Record<string, string>
): Promise<string> => {
  const cacheKey = `${year}_${month}_${deptCode}`;
  if (cache[cacheKey]) return cache[cacheKey];

  const { data, error } = await (supabase as any)
    .from('monthly_plans')
    .upsert({
      plan_month: month,
      plan_year: year,
      department_code: deptCode,
      department_name: deptName,
      status: 'draft',
      notes: `Kế hoạch hoạt động tháng ${month}/${year}`
    }, { onConflict: 'plan_month,plan_year,department_code' })
    .select('id')
    .single();

  if (error) {
    console.error(`Lỗi getOrCreateMonthlyPlan cho ${deptCode} tháng ${month}/${year}:`, error.message);
    throw error;
  }

  const planId = data.id;
  cache[cacheKey] = planId;
  return planId;
};

// ── Date helpers used by the workflow-seed module ────────────────────

export const distributeDates = (startDateStr: string, endDateStr: string, count: number, index: number) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const daysPerTask = Math.floor(diffDays / count);
  const remainder = diffDays % count;

  let startOffset = 0;
  for (let i = 0; i < index; i++) {
    startOffset += daysPerTask + (i < remainder ? 1 : 0);
  }

  const duration = daysPerTask + (index < remainder ? 1 : 0);

  const taskStart = new Date(start);
  taskStart.setDate(start.getDate() + startOffset);

  const taskEnd = new Date(taskStart);
  taskEnd.setDate(taskStart.getDate() + duration - 1);

  return {
    start: taskStart.toISOString().split('T')[0],
    end: taskEnd.toISOString().split('T')[0],
  };
};

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Add N working days (skip Sat/Sun)
export const addWorkingDays = (startDateObj: Date, daysToAdd: number): Date => {
  const date = new Date(startDateObj);
  let added = 0;
  while (added < daysToAdd) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) added++;
  }
  return date;
};
