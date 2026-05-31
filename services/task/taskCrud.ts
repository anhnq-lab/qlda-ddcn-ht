// TaskService CRUD module — read + write operations on the unified `tasks` table.
import { supabase } from '../../lib/supabase';
import { toServiceError } from '../ServiceError';
import { DbTask, DbSubTask, isDepartmentCode } from './helpers';
import { NotificationService } from '../NotificationService';

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
  departmentCode?: string
): Promise<DbTask[]> => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  let query = supabase
    .from('tasks')
    .select('*, projects(project_name)')
    .is('parent_id', null)
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  if (departmentCode) {
    query = query.eq('department_code', departmentCode);
  }

  const { data, error } = await query
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
  const createdTask = data as unknown as DbTask;

  try {
    if (createdTask.is_self_proposed && createdTask.proposal_status === 'pending' && createdTask.assignee_id) {
      NotificationService.notifyTaskProposal(createdTask.title, createdTask.id, createdTask.assignee_id);
    } else if (createdTask.assignee_id && createdTask.assignee_id !== createdTask.created_by) {
      NotificationService.notifyTaskAssigned(createdTask.title, createdTask.id, createdTask.assignee_id);
    }
  } catch (notifErr) {
    console.error('Failed to trigger notification on task creation:', notifErr);
  }

  return createdTask;
};

/** Cập nhật task */
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

/** Xóa task (Delete Guard - Điều 14) */
export const deleteTask = async (taskId: string, currentEmployeeId?: string): Promise<void> => {
  // 1. Lấy thông tin công việc để kiểm tra quyền
  const { data, error: fetchErr } = await (supabase as any)
    .from('tasks')
    .select('assignee_id, created_by, is_self_proposed, proposal_status')
    .eq('id', taskId)
    .single();
  if (fetchErr) throw toServiceError(fetchErr, 'Không tìm thấy công việc để xóa');

  const task = data as any;

  // Nếu là công việc tự đề xuất
  if (task.is_self_proposed) {
    if (task.proposal_status && task.proposal_status !== 'pending') {
      throw new Error('Không thể xóa công việc tự đề xuất đã được duyệt hoặc từ chối');
    }
  } else {
    // Nếu là công việc được giao (không phải tự đề xuất)
    // Cán bộ (assignee) không được xóa công việc do trưởng phòng giao
    if (currentEmployeeId && task.assignee_id === currentEmployeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('role')
        .eq('employee_id', currentEmployeeId)
        .single();
      
      const isStaff = emp && (emp.role === 'User' || emp.role === 'staff');
      if (isStaff) {
        throw new Error('Cán bộ không được phép xóa công việc do Trưởng phòng giao');
      }
    }
  }

  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw toServiceError(error, 'Không thể xóa công việc');
};

/** Đề xuất công việc (Cán bộ tự đề xuất - Điều 9.3) */
export const proposeTask = async (task: Partial<DbTask>): Promise<DbTask> => {
  return createTask({
    ...task,
    is_self_proposed: true,
    proposal_status: 'pending'
  });
};

/** Duyệt đề xuất công việc */
export const approveProposal = async (taskId: string, approverEmployeeId: string): Promise<DbTask> => {
  const result = await updateTask(taskId, {
    proposal_status: 'approved',
    proposal_approved_by: approverEmployeeId,
    proposal_approved_at: new Date().toISOString()
  });

  try {
    if (result.assignee_id) {
      await NotificationService.notifyProposalResponse(result.title, result.id, result.assignee_id, true);
    }
  } catch (notifErr) {
    console.error('Failed to trigger proposal approval notification:', notifErr);
  }

  return result;
};

/** Từ chối đề xuất công việc */
export const rejectProposal = async (taskId: string, approverEmployeeId: string): Promise<DbTask> => {
  const result = await updateTask(taskId, {
    proposal_status: 'rejected',
    proposal_approved_by: approverEmployeeId,
    proposal_approved_at: new Date().toISOString()
  });

  try {
    if (result.assignee_id) {
      await NotificationService.notifyProposalResponse(result.title, result.id, result.assignee_id, false);
    }
  } catch (notifErr) {
    console.error('Failed to trigger proposal rejection notification:', notifErr);
  }

  return result;
};

/** Gia hạn / hoãn việc sang tháng sau (Điều 20.2) */
export const deferToNextMonth = async (taskId: string, reason: string): Promise<DbTask> => {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Không tìm thấy công việc');

  // Đánh dấu task cũ chưa hoàn thành với lý do
  await updateTask(taskId, {
    status: 'incomplete' as any,
    incomplete_reason: reason,
    incomplete_reason_type: 'objective' // Gia hạn / hoãn việc do nguyên nhân khách quan
  });

  // Clone sang tháng tiếp theo
  const oldDueDate = task.due_date ? new Date(task.due_date) : new Date();
  const nextDueDate = new Date(oldDueDate.getFullYear(), oldDueDate.getMonth() + 1, oldDueDate.getDate());
  
  const oldStartDate = task.start_date ? new Date(task.start_date) : new Date();
  const nextStartDate = new Date(oldStartDate.getFullYear(), oldStartDate.getMonth() + 1, oldStartDate.getDate());

  const { id: _id, created_at: _c, updated_at: _u, ...rest } = task;
  
  return createTask({
    ...rest,
    status: 'todo' as any,
    progress: 0,
    due_date: nextDueDate.toISOString().split('T')[0],
    start_date: nextStartDate.toISOString().split('T')[0],
    actual_start_date: null,
    actual_end_date: null,
    completion_result: null,
    incomplete_reason: null,
    incomplete_reason_type: null,
    metadata: {
      ...task.metadata,
      deferred_from_task_id: taskId
    }
  });
};

/** Xóa tất cả tasks của dự án */
export const deleteProjectTasks = async (projectId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('project_id', projectId)
    .select('id');

  if (error) throw toServiceError(error, 'Không thể xóa công việc dự án');
  return data?.length || 0;
};
