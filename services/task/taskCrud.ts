// TaskService CRUD module — read + write operations on the unified `tasks` table.
import { supabase } from '../../lib/supabase';
import { toServiceError } from '../ServiceError';
import { DbTask, DbSubTask, isDepartmentCode } from './helpers';

// ── READ ─────────────────────────────────────────────────────────────

/** Lấy tất cả tasks (scoped theo project IDs nếu có)
 *  Sau refactor (24/05/2026): không còn filter ẩn theo monthly_plan_item_id.
 *  Mọi task project đều có MPI gán (đảm bảo bởi migration + trigger).
 *  Subtask (parent_id != null) đã bị flatten — query chỉ lấy task gốc cho an toàn. */
export const getAllTasks = async (projectIds?: string[]): Promise<DbTask[]> => {
  try {
    let query = supabase
      .from('tasks')
      .select('*, projects(project_name)')
      .is('parent_id', null)  // an toàn — sau migration parent_id luôn null cho task project
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (projectIds && projectIds.length > 0) {
      query = query.or(`project_id.in.(${projectIds.join(',')}),task_type.eq.internal`);
    }

    const { data, error } = await query;
    if (error) throw toServiceError(error, 'Không thể tải danh sách công việc');

    return (data || []) as unknown as DbTask[];
  } catch (err) {
    throw toServiceError(err, 'Không thể tải danh sách công việc');
  }
};

/** Lấy tasks theo dự án (flat — subtask đã bỏ sau refactor 24/05/2026) */
export const getProjectTasks = async (projectId: string): Promise<DbTask[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .is('parent_id', null)
    .order('sort_order', { ascending: true });

  if (error) throw toServiceError(error, 'Không thể tải công việc dự án');
  return (data || []) as unknown as DbTask[];
};

/** Lấy tasks nội bộ (không thuộc dự án nào) */
export const getInternalTasks = async (): Promise<DbTask[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('task_type', 'internal')
    .order('created_at', { ascending: false });

  if (error) throw toServiceError(error, 'Không thể tải công việc nội bộ');
  return (data || []) as unknown as DbTask[];
};

/** Lấy tasks của 1 nhân viên trong 1 tháng cụ thể */
export const getTasksByEmployeeAndMonth = async (
  employeeId: string,
  month: number,
  year: number
): Promise<DbTask[]> => {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const { data, error } = await supabase
    .from('tasks')
    .select('*, projects(project_name)')
    .eq('assignee_id', employeeId)
    .or(
      `and(due_date.gte.${startDate},due_date.lte.${endDate}),and(start_date.gte.${startDate},start_date.lte.${endDate})`
    )
    .order('due_date', { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as DbTask[];
};

/** Lấy tasks theo phòng ban và tháng (cho báo cáo giao ban) */
export const getTasksByDepartmentAndMonth = async (
  month: number,
  year: number,
  _departmentName?: string
): Promise<DbTask[]> => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tasks')
    .select('*, projects(project_name)')
    .is('parent_id', null)
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw toServiceError(error, 'Không thể tải công việc theo phòng ban');
  return (data || []) as unknown as DbTask[];
};

/** Lấy 1 task theo ID (flat) */
export const getTaskById = async (taskId: string): Promise<DbTask | null> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data as unknown as DbTask;
};

/** Đếm tasks theo project (cho Dashboard) — song song, không N+1 */
export const countByProject = async (projectId: string) => {
  const [totalRes, doneRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .is('parent_id', null),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'done')
      .is('parent_id', null),
  ]);
  return { total: totalRes.count || 0, done: doneRes.count || 0 };
};

// ── WRITE ────────────────────────────────────────────────────────────

const DATE_FIELDS = ['start_date', 'due_date', 'actual_start_date', 'actual_end_date'] as const;
const sanitizeDates = (payload: any) => {
  for (const f of DATE_FIELDS) {
    if (payload[f] === '') payload[f] = null;
  }
};

/** Tạo task mới */
export const createTask = async (task: Partial<DbTask>): Promise<DbTask> => {
  const now = new Date().toISOString();
  const payload: any = { ...task, created_at: now, updated_at: now };

  sanitizeDates(payload);

  if (payload.assignee_id) {
    if (isDepartmentCode(payload.assignee_id)) {
      payload.metadata = { ...payload.metadata, assignee_role: payload.assignee_id };
      payload.assignee_id = null;
    } else if (payload.metadata) {
      delete payload.metadata.assignee_role;
    }
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
    .single();

  if (error) throw toServiceError(error, 'Không thể tạo công việc');
  return data as unknown as DbTask;
};

/** Cập nhật task (flat — không còn xử lý sub_tasks) */
export const updateTask = async (taskId: string, updates: Partial<DbTask>): Promise<DbTask> => {
  const payload: any = { ...updates, updated_at: new Date().toISOString() };
  delete payload.id;

  sanitizeDates(payload);

  if (payload.assignee_id !== undefined) {
    if (payload.assignee_id && isDepartmentCode(payload.assignee_id)) {
      payload.metadata = { ...(payload.metadata || {}), assignee_role: payload.assignee_id };
      payload.assignee_id = null;
    } else if (payload.metadata) {
      delete payload.metadata.assignee_role;
    }
  }

  // Strip sub_tasks nếu vô tình truyền (backward-compat, không còn dùng)
  if (payload.metadata && payload.metadata.sub_tasks !== undefined) {
    delete payload.metadata.sub_tasks;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw toServiceError(error, 'Không thể cập nhật công việc');
  return data as unknown as DbTask;
};

/** Upsert task (tạo hoặc cập nhật) */
export const saveTask = async (task: Partial<DbTask> & { id?: string }): Promise<DbTask> => {
  return task.id ? updateTask(task.id, task) : createTask(task);
};

/** Xóa task */
export const deleteTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw toServiceError(error, 'Không thể xóa công việc');
};

/** Xóa tất cả tasks + steps của dự án */
export const deleteProjectTasks = async (projectId: string): Promise<number> => {
  // Trigger BEFORE DELETE trên monthly_plan_items sẽ cascade xóa tasks
  await (supabase as any).from('monthly_plan_items').delete().eq('project_id', projectId);

  // Xóa luôn tasks không link MPI (safeguard)
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('project_id', projectId)
    .select('id');

  if (error) throw toServiceError(error, 'Không thể xóa công việc dự án');
  return data?.length || 0;
};

// ── SUB-TASKS (deprecated — bỏ sau refactor 24/05/2026) ──────────────
// Giữ no-op để backward-compat trong 1 phiên bản; sẽ xóa hẳn ở refactor sau.

/** @deprecated subtask đã bị loại bỏ. Hàm này no-op để tránh phá build. */
export const saveSubTask = async (
  _subTask: Partial<DbSubTask> & { task_id: string }
): Promise<DbSubTask> => {
  console.warn('[DEPRECATED] saveSubTask: subtask concept đã bị loại bỏ. Dùng saveTask thay thế.');
  throw new Error('Sub-task không còn được hỗ trợ. Vui lòng tạo task cá nhân trực tiếp.');
};

/** @deprecated subtask đã bị loại bỏ. */
export const deleteSubTask = async (_subTaskId: string): Promise<void> => {
  console.warn('[DEPRECATED] deleteSubTask: subtask concept đã bị loại bỏ.');
};

/** @deprecated subtask đã bị loại bỏ → return rỗng. */
export const getSubTasks = async (_taskId: string): Promise<DbSubTask[]> => {
  return [];
};
