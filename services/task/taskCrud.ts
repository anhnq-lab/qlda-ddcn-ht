// TaskService CRUD module — read + write operations on the unified `tasks` table.
import { supabase } from '../../lib/supabase';
import { toServiceError } from '../ServiceError';
import { DbTask, DbSubTask, isDepartmentCode } from './helpers';

// ── READ ─────────────────────────────────────────────────────────────

/** Lấy tất cả tasks (scoped theo project IDs nếu có) */
export const getAllTasks = async (projectIds?: string[]): Promise<DbTask[]> => {
  try {
    let query = supabase
      .from('tasks')
      .select('*, projects(project_name)')
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (projectIds && projectIds.length > 0) {
      query = query.or(`project_id.in.(${projectIds.join(',')}),task_type.eq.internal`);
    }

    const { data, error } = await query;
    if (error) throw toServiceError(error, 'Không thể tải danh sách công việc');

    // Lọc bỏ các bước dự án lớn (task_type = project nhưng chưa sinh kế hoạch tháng)
    const filtered = (data || []).filter((r: any) =>
      r.task_type === 'internal' || (r.task_type === 'project' && !!r.monthly_plan_item_id)
    );
    return filtered as unknown as DbTask[];
  } catch (err) {
    throw toServiceError(err, 'Không thể tải danh sách công việc');
  }
};

/** Lấy tasks theo dự án */
export const getProjectTasks = async (projectId: string): Promise<DbTask[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  if (error) throw toServiceError(error, 'Không thể tải công việc dự án');

  const masterTasks = (data || []).filter((r: any) => !r.parent_id);
  const subTasks = (data || []).filter((r: any) => r.parent_id);

  return masterTasks.map((row: any) => {
    const rowSubs = subTasks
      .filter((s: any) => s.parent_id === row.id)
      .map((s: any) => ({
        SubTaskID: s.id,
        Title: s.title,
        AssigneeID: s.assignee_id || s.metadata?.assignee_role,
        DueDate: s.due_date,
        Status: s.status === 'done' ? 'Done' : s.status === 'in_progress' ? 'InProgress' : 'Todo',
      }));

    const metadata = row.metadata || {};
    metadata.sub_tasks = rowSubs;

    return { ...row, metadata } as unknown as DbTask;
  });
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

/** Lấy 1 task theo ID */
export const getTaskById = async (taskId: string): Promise<DbTask | null> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: subData } = await (supabase as any)
    .from('tasks')
    .select('*')
    .eq('parent_id', taskId)
    .order('created_at', { ascending: true });

  const row = data as any;
  const metadata = row.metadata || {};

  if (subData && subData.length > 0) {
    metadata.sub_tasks = subData.map((s: any) => ({
      SubTaskID: s.id,
      Title: s.title,
      AssigneeID: s.assignee_id || s.metadata?.assignee_role,
      DueDate: s.due_date,
      Status: s.status === 'done' ? 'Done' : s.status === 'in_progress' ? 'InProgress' : 'Todo',
    }));
  }

  return { ...row, metadata } as unknown as DbTask;
};

/** Lấy sub-tasks của 1 task */
export const getSubTasks = async (taskId: string): Promise<DbSubTask[]> => {
  const { data, error } = await (supabase as any)
    .from('tasks')
    .select('*')
    .eq('parent_id', taskId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as DbSubTask[];
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

/** Cập nhật task (cùng đồng bộ subtasks nếu metadata.sub_tasks được truyền) */
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

  let subTasks: any[] | null = null;
  if (payload.metadata && payload.metadata.sub_tasks !== undefined) {
    subTasks = payload.metadata.sub_tasks;
    delete payload.metadata.sub_tasks;
  }

  const { data: currentTask } = await (supabase as any)
    .from('tasks')
    .select('project_id, task_type')
    .eq('id', taskId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw toServiceError(error, 'Không thể cập nhật công việc');

  // Sync sub-tasks (treated as full tasks with parent_id)
  if (subTasks !== null) {
    const { data: existingSubs } = await (supabase as any).from('tasks').select('id').eq('parent_id', taskId);
    const existingIds = (existingSubs || []).map((s: any) => s.id);

    const newIds: string[] = [];
    const subsToUpsert = subTasks.map((st) => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(st.SubTaskID);
      const subId = isUUID ? st.SubTaskID : crypto.randomUUID();
      newIds.push(subId);

      const isDept = isDepartmentCode(st.AssigneeID);

      return {
        id: subId,
        parent_id: taskId,
        project_id: currentTask?.project_id,
        task_type: currentTask?.task_type || 'project',
        title: st.Title,
        status: st.Status === 'Done' ? 'done' : st.Status === 'InProgress' ? 'in_progress' : 'todo',
        due_date: st.DueDate || null,
        assignee_id: st.AssigneeID && !isDept ? st.AssigneeID : null,
        metadata: isDept ? { assignee_role: st.AssigneeID } : {},
      };
    });

    if (subsToUpsert.length > 0) {
      await supabase.from('tasks').upsert(subsToUpsert as any);
    }

    const toDelete = existingIds.filter((id: any) => !newIds.includes(id));
    if (toDelete.length > 0) {
      await supabase.from('tasks').delete().in('id', toDelete);
    }
  }

  const row = data as any;
  const metadata = row.metadata || {};
  if (subTasks !== null) metadata.sub_tasks = subTasks;

  return { ...row, metadata } as unknown as DbTask;
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

/** Xóa tất cả tasks của dự án (kèm dọn monthly_plan_items) */
export const deleteProjectTasks = async (projectId: string): Promise<number> => {
  await (supabase as any).from('monthly_plan_items').delete().eq('project_id', projectId);

  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('project_id', projectId)
    .select('id');

  if (error) throw toServiceError(error, 'Không thể xóa công việc dự án');
  return data?.length || 0;
};

// ── SUB-TASKS (legacy DbSubTask shape) ───────────────────────────────

/** Upsert sub-task */
export const saveSubTask = async (
  subTask: Partial<DbSubTask> & { task_id: string }
): Promise<DbSubTask> => {
  const payload = {
    parent_id: subTask.task_id,
    title: subTask.title,
    status: subTask.status === 'done' ? 'done' : subTask.status === 'in_progress' ? 'in_progress' : 'todo',
    assignee_id: subTask.assignee_id,
    due_date: subTask.due_date,
    sort_order: subTask.sort_order,
    task_type: 'project',
    updated_at: new Date().toISOString(),
  };

  const isUpdate = !!subTask.id;
  const query = isUpdate
    ? (supabase as any).from('tasks').update(payload).eq('id', subTask.id)
    : (supabase as any).from('tasks').insert({ ...payload, created_at: new Date().toISOString() });

  const { data, error } = await query.select().single();
  if (error) throw error;

  return {
    id: data.id,
    task_id: data.parent_id,
    title: data.title,
    status: data.status,
    assignee_id: data.assignee_id,
    due_date: data.due_date,
    sort_order: data.sort_order,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as unknown as DbSubTask;
};

/** Xóa sub-task */
export const deleteSubTask = async (subTaskId: string): Promise<void> => {
  const { error } = await (supabase as any).from('tasks').delete().eq('id', subTaskId);
  if (error) throw error;
};
