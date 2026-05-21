// TaskService — Unified CRUD operations for tasks (project + internal)
// Bảng `tasks` mới: UUID PK, unified schema
import { supabase } from '../lib/supabase';
import { WorkflowTemplateService } from './WorkflowTemplateService';
import { toServiceError } from './ServiceError';
import { DEPARTMENT_CODES, DEPARTMENT_NAMES, DepartmentCode } from '../types/plan.types';

const isDepartmentCode = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return (DEPARTMENT_CODES as readonly string[]).includes(id.toUpperCase());
};

const getDeptCode = (assigneeRole: string | null | undefined): DepartmentCode => {
  if (!assigneeRole) return 'QLDA1'; // Default fallback
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

const getOrCreateMonthlyPlan = async (
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

const distributeDates = (startDateStr: string, endDateStr: string, count: number, index: number) => {
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
    end: taskEnd.toISOString().split('T')[0]
  };
};

// ── Types matching the new DB schema ─────────────────────────
export type TaskType = 'project' | 'internal';
export type DbTaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type DbTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface DbTask {
  id: string;
  task_type: TaskType;
  project_id: string | null;
  workflow_id: string | null;
  workflow_node_id: string | null;
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
  estimated_cost: number | null;
  actual_cost: number | null;
  legal_basis: string | null;
  output_document: string | null;
  predecessor_task_id: string | null;
  metadata: Record<string, any>;
  monthly_plan_item_id: string | null;
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

// ── Service ──────────────────────────────────────────────────

export const TaskService = {
  // ─── READ ────────────────────────────────────────────────

  /** Lấy tất cả tasks (scoped theo project IDs nếu có) */
  getAllTasks: async (projectIds?: string[]): Promise<DbTask[]> => {
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
      const filtered = (data || []).filter((r: any) => {
        return r.task_type === 'internal' || (r.task_type === 'project' && !!r.monthly_plan_item_id);
      });
      return filtered as unknown as DbTask[];
    } catch (err) {
      throw toServiceError(err, 'Không thể tải danh sách công việc');
    }
  },

  /** Lấy tasks theo dự án */
  getProjectTasks: async (projectId: string): Promise<DbTask[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (error) throw toServiceError(error, 'Không thể tải công việc dự án');

    // Tách master tasks và sub tasks
    const masterTasks = (data || []).filter((r: any) => !r.parent_id);
    const subTasks = (data || []).filter((r: any) => r.parent_id);

    return masterTasks.map((row: any) => {
      // Map sub-tasks thực tế vào metadata cho UI sử dụng dạng JSON array
      const rowSubs = subTasks.filter((s: any) => s.parent_id === row.id).map((s: any) => ({
        SubTaskID: s.id,
        Title: s.title,
        AssigneeID: s.assignee_id || s.metadata?.assignee_role,
        DueDate: s.due_date,
        Status: s.status === 'done' ? 'Done' : (s.status === 'in_progress' ? 'InProgress' : 'Todo')
      }));

      const metadata = row.metadata || {};
      metadata.sub_tasks = rowSubs;

      return {
        ...row,
        metadata
      } as unknown as DbTask;
    });
  },

  /** Lấy tasks nội bộ (không thuộc dự án nào) */
  getInternalTasks: async (): Promise<DbTask[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('task_type', 'internal')
      .order('created_at', { ascending: false });

    if (error) throw toServiceError(error, 'Không thể tải công việc nội bộ');
    return (data || []) as unknown as DbTask[];
  },

  /** Lấy tasks của 1 nhân viên trong 1 tháng cụ thể */
  getTasksByEmployeeAndMonth: async (employeeId: string, month: number, year: number): Promise<DbTask[]> => {
    // Tháng trong JS/Supabase cần format thành khoảng thời gian
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .select('*, projects(project_name)')
      .eq('assignee_id', employeeId)
      // Tìm các task có due_date nằm trong tháng, HOẶC start_date nằm trong tháng
      .or(`and(due_date.gte.${startDate},due_date.lte.${endDate}),and(start_date.gte.${startDate},start_date.lte.${endDate})`)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as DbTask[];
  },

  /** Lấy 1 task theo ID */
  getTaskById: async (taskId: string): Promise<DbTask | null> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    
    // Lấy sub tasks (nếu có)
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
        Status: s.status === 'done' ? 'Done' : (s.status === 'in_progress' ? 'InProgress' : 'Todo')
      }));
    }

    return {
      ...row,
      metadata
    } as unknown as DbTask;
  },

  /** Lấy sub-tasks của 1 task */
  getSubTasks: async (taskId: string): Promise<DbSubTask[]> => {
    const { data, error } = await (supabase as any)
      .from('tasks')
      .select('*')
      .eq('parent_id', taskId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as DbSubTask[];
  },

  /** Đếm tasks theo project (cho Dashboard) — song song, không N+1 */
  countByProject: async (projectId: string) => {
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
  },

  // ─── COLLABORATION READ ──────────────────────────────────
  
  /** Lấy bình luận của 1 task */
  getTaskComments: async (taskId: string): Promise<any[]> => {
    const { data, error } = await (supabase as any).rpc('get_task_comments_v2', { p_task_id: taskId });
    if (error) throw error;
    return data || [];
  },
  
  /** Lấy nhật ký hoạt động của 1 task */
  getTaskActivities: async (taskId: string): Promise<any[]> => {
    const { data, error } = await (supabase as any).rpc('get_task_activities_v2', { p_task_id: taskId });
    if (error) throw error;
    return data || [];
  },

  // ─── WRITE ───────────────────────────────────────────────

  /** Tạo task mới */
  createTask: async (task: Partial<DbTask>): Promise<DbTask> => {
    const now = new Date().toISOString();
    const payload = {
      ...task,
      created_at: now,
      updated_at: now,
    };

    // Sanitize: empty strings → null for date fields
    const dateFields = ['start_date', 'due_date', 'actual_start_date', 'actual_end_date'];
    for (const f of dateFields) {
      if ((payload as any)[f] === '') (payload as any)[f] = null;
    }

    // Sanitize assignee_id
    if (payload.assignee_id) {
      if (isDepartmentCode(payload.assignee_id)) {
        // Store department assignee in metadata as role name
        (payload as any).metadata = { ...(payload as any).metadata, assignee_role: payload.assignee_id };
        payload.assignee_id = null;
      } else {
        // If assigned to a human employee, clear any previous assignee_role from metadata
        if ((payload as any).metadata) {
          delete (payload as any).metadata.assignee_role;
        }
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload as any)
      .select()
      .single();

    if (error) throw toServiceError(error, 'Không thể tạo công việc');
    return data as unknown as DbTask;
  },

  /** Cập nhật task */
  updateTask: async (taskId: string, updates: Partial<DbTask>): Promise<DbTask> => {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    delete (payload as any).id; // Don't send id in payload

    // Sanitize dates
    const dateFields = ['start_date', 'due_date', 'actual_start_date', 'actual_end_date'];
    for (const f of dateFields) {
      if ((payload as any)[f] === '') (payload as any)[f] = null;
    }

    // Sanitize assignee_id
    if (payload.assignee_id !== undefined) {
      if (payload.assignee_id && isDepartmentCode(payload.assignee_id)) {
        (payload as any).metadata = { ...((payload as any).metadata || {}), assignee_role: payload.assignee_id };
        payload.assignee_id = null;
      } else {
        // If assigned to a human employee or cleared, remove assignee_role from metadata
        if (payload.metadata) {
          delete payload.metadata.assignee_role;
        }
      }
    }

    // Separate sub_tasks from metadata so we can sync them to public.tasks
    let subTasks: any[] | null = null;
    if (payload.metadata && payload.metadata.sub_tasks !== undefined) {
      subTasks = payload.metadata.sub_tasks;
      delete payload.metadata.sub_tasks;
    }

    const { data: currentTask } = await (supabase as any).from('tasks').select('project_id, task_type').eq('id', taskId).maybeSingle();

    const { data, error } = await supabase
      .from('tasks')
      .update(payload as any)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw toServiceError(error, 'Không thể cập nhật công việc');

    // Sync sub-tasks if provided
    if (subTasks !== null) {
      // Get existing subtasks to detect deletions
      const { data: existingSubs } = await (supabase as any).from('tasks').select('id').eq('parent_id', taskId);
      const existingIds = (existingSubs || []).map((s: any) => s.id);
      
      const newIds: string[] = [];
      const subsToUpsert = subTasks.map(st => {
        // Kiểm tra xem ID có phải là UUID hợp lệ không. Nếu sinh từ UI ('SUB-xxx'), tạo UUID mới
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
          status: st.Status === 'Done' ? 'done' : (st.Status === 'InProgress' ? 'in_progress' : 'todo'),
          due_date: st.DueDate || null,
          assignee_id: st.AssigneeID && !isDept ? st.AssigneeID : null,
          metadata: isDept ? { assignee_role: st.AssigneeID } : {}
        };
      });

      if (subsToUpsert.length > 0) {
        await supabase.from('tasks').upsert(subsToUpsert as any);
      }

      // Xóa các subtask bị người dùng gỡ bỏ UI khỏi CSDL
      const toDelete = existingIds.filter((id: any) => !newIds.includes(id));
      if (toDelete.length > 0) {
        await supabase.from('tasks').delete().in('id', toDelete);
      }
    }
    
    const row = data as any;
    const metadata = row.metadata || {};
    // Phục hồi sub_tasks nếu UI cần ngay
    if (subTasks !== null) metadata.sub_tasks = subTasks;

    return {
      ...row,
      metadata
    } as unknown as DbTask;
  },

  /** Upsert task (tạo hoặc cập nhật) */
  saveTask: async (task: Partial<DbTask> & { id?: string }): Promise<DbTask> => {
    if (task.id) {
      return TaskService.updateTask(task.id, task);
    } else {
      return TaskService.createTask(task);
    }
  },

  /** Xóa task */
  deleteTask: async (taskId: string): Promise<void> => {
    // sub_tasks cascade delete automatically
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw toServiceError(error, 'Không thể xóa công việc');
  },

  /** Xóa tất cả tasks của dự án */
  deleteProjectTasks: async (projectId: string): Promise<number> => {
    // Dọn dẹp monthly_plan_items liên kết với dự án trước để tránh mồ côi
    await (supabase as any).from('monthly_plan_items').delete().eq('project_id', projectId);

    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', projectId)
      .select('id');

    if (error) throw toServiceError(error, 'Không thể xóa công việc dự án');
    return data?.length || 0;
  },

  // ─── SUB-TASKS ───────────────────────────────────────────

  /** Upsert sub-task */
  saveSubTask: async (subTask: Partial<DbSubTask> & { task_id: string }): Promise<DbSubTask> => {
    // Map DbSubTask structure to tasks structure
    const payload = {
      parent_id: subTask.task_id,
      title: subTask.title,
      status: subTask.status === 'done' ? 'done' : (subTask.status === 'in_progress' ? 'in_progress' : 'todo'),
      assignee_id: subTask.assignee_id,
      due_date: subTask.due_date,
      sort_order: subTask.sort_order,
      task_type: 'project',
      updated_at: new Date().toISOString()
    };

    if (subTask.id) {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .update(payload)
        .eq('id', subTask.id)
        .select()
        .single();
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
        updated_at: data.updated_at
      } as unknown as DbSubTask;
    } else {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single();
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
        updated_at: data.updated_at
      } as unknown as DbSubTask;
    }
  },

  /** Xóa sub-task */
  deleteSubTask: async (subTaskId: string): Promise<void> => {
    const { error } = await (supabase as any).from('tasks').delete().eq('id', subTaskId);
    if (error) throw error;
  },

  // ─── COLLABORATION WRITE ─────────────────────────────────
  
  /** Thêm bình luận mới */
  addComment: async (taskId: string, content: string, attachments: any[] = []) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Chưa đăng nhập");
    
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: userData.user.id,
        content,
        attachments
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ─── WORKFLOW INTEGRATION ────────────────────────────────

  /**
   * Tạo tasks tự động từ quy trình mẫu
   * Lấy nodes từ workflow_nodes theo thứ tự, cộng dồn Start/End Date từ Start Date
   * và nối chuỗi tuyến tính (predecessor_task_id) để vẽ Gantt chuẩn.
   */
  createTasksFromWorkflow: async (
    projectId: string,
    workflowId: string,
    startDate: string,
    endDate?: string
  ): Promise<DbTask[]> => {
    // Dọn dẹp tasks cũ, monthly plan items cũ và workflow instances cũ của dự án trước
    await TaskService.deleteProjectTasks(projectId);
    await supabase.from('workflow_instances').delete().eq('reference_id', projectId).eq('reference_type', 'project');

    // 1. Lấy nodes của workflow template
    const nodes = await WorkflowTemplateService.getTemplateNodes(workflowId);
    const SKIP_TYPES = new Set(['gateway', 'connector']);
    const workNodes = nodes.filter(n => !SKIP_TYPES.has(n.type));

    if (workNodes.length === 0) return [];

    // Helper: Cộng số ngày làm việc (Bỏ qua Thứ 7, CN)
    const addWorkingDays = (startDateObj: Date, daysToAdd: number): Date => {
      const date = new Date(startDateObj);
      let added = 0;
      while (added < daysToAdd) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          added++;
        }
      }
      return date;
    };

    const monthlyPlanCache: Record<string, string> = {};

    // Map các annual plan items hiện có của dự án
    const { data: annualPlanList } = await (supabase as any)
      .from('annual_plan_items')
      .select('id, plan_year, department_code')
      .eq('project_id', projectId);

    const annualPlanMap: Record<string, string> = {};
    if (annualPlanList) {
      annualPlanList.forEach((ap: any) => {
        annualPlanMap[`${ap.plan_year}_${ap.department_code}`] = ap.id;
      });
    }

    let currentDate = new Date(startDate);
    let previousTaskId: string | null = null;
    let currentSortOrder = 0;
    
    const tasksToInsert: any[] = [];
    const monthlyPlanItemsToInsert: any[] = [];
    const linksToUpdate: Array<{ mpiId: string; taskId: string }> = [];
    
    // Khởi tạo UUID helper
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // 2. Build task rows by accumulating SLAs sequentially
    for (let i = 0; i < workNodes.length; i++) {
      const node = workNodes[i];
      let nodeSla = 1; // Default
      
      if (node.sla_formula) {
        const match = node.sla_formula.match(/^(\d+)d$/);
        if (match) nodeSla = parseInt(match[1]);
      }

      const nodeStartDate = new Date(currentDate);
      const nodeEndDate = addWorkingDays(currentDate, nodeSla);

      const nodeMetadata = (node.metadata || {}) as any;
      const subTasksDef = nodeMetadata.sub_tasks || [];
      const phase = nodeMetadata.phase || 'preparation';

      if (subTasksDef.length > 0) {
        // Tách các công việc chi tiết lên thành công việc chính độc lập (parent_id = null)
        const subCount = subTasksDef.length;
        const baseSla = Math.floor(nodeSla / subCount);
        const remainderSla = nodeSla % subCount;

        let currentSubStartDate = new Date(nodeStartDate);

        for (let idx = 0; idx < subCount; idx++) {
          const st = subTasksDef[idx];
          const subTaskId = generateUUID();
          const subMpiId = generateUUID();

          const subSla = Math.max(1, baseSla + (idx < remainderSla ? 1 : 0));
          const subStartDate = new Date(currentSubStartDate);
          const subEndDate = addWorkingDays(subStartDate, subSla);

          const subStartDateStr = subStartDate.toISOString().split('T')[0];
          const subEndDateStr = subEndDate.toISOString().split('T')[0];

          const subTitle = st.name || st.title || `Công việc ${idx + 1}`;
          const subAssigneeRole = st.assignee_role || st.assignedTo || st.actor || nodeMetadata.assignee_role || '';
          const subLegalBasis = st.legal_basis || st.legalBasis || nodeMetadata.legalBasis || nodeMetadata.legal_basis || '';
          const subOutputDoc = st.output || st.output_document || nodeMetadata.output || nodeMetadata.output_document || '';

          const subStartYear = subStartDate.getFullYear();
          const subStartMonth = subStartDate.getMonth() + 1;
          const deptCode = getDeptCode(subAssigneeRole);
          const deptName = DEPARTMENT_NAMES[deptCode] || '';

          let mPlanId: string | null = null;
          try {
            mPlanId = await getOrCreateMonthlyPlan(subStartMonth, subStartYear, deptCode, deptName, monthlyPlanCache);
          } catch (err) {
            console.error('Không thể tạo kế hoạch tháng:', err);
          }

          if (mPlanId) {
            monthlyPlanItemsToInsert.push({
              id: subMpiId,
              monthly_plan_id: mPlanId,
              annual_plan_item_id: annualPlanMap[`${subStartYear}_${deptCode}`] || null,
              project_id: projectId,
              group_name: phase === 'preparation' ? 'Giai đoạn Chuẩn bị đầu tư' : (phase === 'completion' || phase === 'closing' ? 'Giai đoạn Kết thúc dự án' : 'Giai đoạn Thực hiện xây lắp'),
              task_name: subTitle,
              deliverable: subOutputDoc || 'Sản phẩm hoàn thành nghiệm thu theo quy trình',
              deadline_note: `Định hạn hoàn thành: ${subEndDateStr}`,
              due_date: subEndDateStr,
              status: 'planned',
              source_task_id: null,
              source_type: 'from_project_task',
              collaborating_text: 'Ban Giám đốc',
              collaborating_dept_codes: ['BGĐ'],
              notes: 'Ánh xạ tự động từ quy trình WBS của Dự án'
            });
            linksToUpdate.push({ mpiId: subMpiId, taskId: subTaskId });
          }

          tasksToInsert.push({
            id: subTaskId,
            project_id: projectId,
            title: subTitle.length > 450 ? subTitle.substring(0, 447) + '...' : subTitle,
            status: 'todo',
            task_type: 'project',
            workflow_id: workflowId,
            workflow_node_id: node.id,
            priority: 'medium',
            progress: 0,
            start_date: subStartDateStr,
            due_date: subEndDateStr,
            duration_days: subSla,
            phase: phase,
            step_code: node.id,
            sort_order: currentSortOrder++,
            predecessor_task_id: previousTaskId,
            legal_basis: subLegalBasis,
            output_document: subOutputDoc,
            monthly_plan_item_id: mPlanId ? subMpiId : null,
            metadata: {
              assignee_role: subAssigneeRole,
              is_wbs: true,
              is_elevated_subtask: true,
              node_id: node.id
            }
          });

          previousTaskId = subTaskId;
          currentSubStartDate = new Date(subEndDate);
        }
      } else {
        // Không có công việc con: tạo một công việc đại diện cho bước
        const taskId = generateUUID();
        const mpiId = generateUUID();

        const nodeStartDateStr = nodeStartDate.toISOString().split('T')[0];
        const nodeEndDateStr = nodeEndDate.toISOString().split('T')[0];

        const assigneeRole = nodeMetadata.assignee_role || '';
        const nodeStartYear = nodeStartDate.getFullYear();
        const nodeStartMonth = nodeStartDate.getMonth() + 1;
        const deptCode = getDeptCode(assigneeRole);
        const deptName = DEPARTMENT_NAMES[deptCode] || '';

        let mPlanId: string | null = null;
        try {
          mPlanId = await getOrCreateMonthlyPlan(nodeStartMonth, nodeStartYear, deptCode, deptName, monthlyPlanCache);
        } catch (err) {
          console.error('Không thể tạo kế hoạch tháng:', err);
        }

        if (mPlanId) {
          monthlyPlanItemsToInsert.push({
            id: mpiId,
            monthly_plan_id: mPlanId,
            annual_plan_item_id: annualPlanMap[`${nodeStartYear}_${deptCode}`] || null,
            project_id: projectId,
            group_name: phase === 'preparation' ? 'Giai đoạn Chuẩn bị đầu tư' : (phase === 'completion' || phase === 'closing' ? 'Giai đoạn Kết thúc dự án' : 'Giai đoạn Thực hiện xây lắp'),
            task_name: `Triển khai: ${node.name}`,
            deliverable: nodeMetadata.output || nodeMetadata.output_document || 'Sản phẩm hoàn thành nghiệm thu theo quy trình',
            deadline_note: `Định hạn hoàn thành: ${nodeEndDateStr}`,
            due_date: nodeEndDateStr,
            status: 'planned',
            source_task_id: null,
            source_type: 'from_project_task',
            collaborating_text: 'Ban Giám đốc',
            collaborating_dept_codes: ['BGĐ'],
            notes: 'Ánh xạ tự động từ quy trình WBS của Dự án'
          });
          linksToUpdate.push({ mpiId: mpiId, taskId: taskId });
        }

        tasksToInsert.push({
          id: taskId,
          project_id: projectId,
          title: node.name.length > 450 ? node.name.substring(0, 447) + '...' : node.name,
          status: 'todo',
          task_type: 'project',
          workflow_id: workflowId,
          workflow_node_id: node.id,
          priority: 'medium',
          progress: 0,
          start_date: nodeStartDateStr,
          due_date: nodeEndDateStr,
          duration_days: nodeSla,
          phase: phase,
          step_code: node.id,
          sort_order: currentSortOrder++,
          predecessor_task_id: previousTaskId,
          legal_basis: nodeMetadata.legalBasis || nodeMetadata.legal_basis || '',
          output_document: nodeMetadata.output || nodeMetadata.output_document || '',
          monthly_plan_item_id: mPlanId ? mpiId : null,
          metadata: {
            assignee_role: assigneeRole,
            is_wbs: true,
            node_id: node.id
          }
        });

        previousTaskId = taskId;
      }

      currentDate = new Date(nodeEndDate);
    }

    // 3. Insert hàng loạt monthly plan items trước để làm FK cho tasks
    if (monthlyPlanItemsToInsert.length > 0) {
      const { error: mpiErr } = await supabase
        .from('monthly_plan_items')
        .insert(monthlyPlanItemsToInsert);
      if (mpiErr) {
        console.error("Lỗi khi chèn monthly plan items:", mpiErr);
        throw new Error(`Tạo kế hoạch thất bại: ${mpiErr.message}`);
      }
    }

    // 4. Insert hàng loạt tasks vào CSDL
    if (tasksToInsert.length > 0) {
      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToInsert as any)
        .select();

      if (error) throw new Error(`Tạo kế hoạch thất bại: ${error.message}`);
      
      // 5. Cập nhật ngược source_task_id trong monthly_plan_items
      if (linksToUpdate.length > 0) {
        try {
          await Promise.all(
            linksToUpdate.map(link =>
              supabase
                .from('monthly_plan_items')
                .update({ source_task_id: link.taskId } as any)
                .eq('id', link.mpiId)
            )
          );
        } catch (updErr) {
          console.error("Lỗi khi cập nhật source_task_id cho monthly_plan_items:", updErr);
        }
      }

      // Đăng ký workflow_instances để UI biết Project này đang chạy quy trình nào
      const { error: instErr } = await supabase.from('workflow_instances').insert({
        id: generateUUID(),
        workflow_id: workflowId,
        reference_id: projectId,
        reference_type: 'project',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        context_data: endDate ? { target_end_date: endDate } : {}
      } as any);

      if (instErr) {
        console.error("Lỗi khi đăng ký workflow instance:", instErr);
      }

      return (data || []) as unknown as DbTask[];
    }

    return [];
  },

  /** Tạo kế hoạch tổng thể tùy chỉnh từ danh sách các bước tùy biến */
  createTasksFromCustomPlan: async (
    projectId: string,
    workflowId: string | null,
    steps: Array<{
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
    }>,
    targetEndDate?: string
  ): Promise<DbTask[]> => {
    // 1. Dọn dẹp tasks cũ, monthly plan items và workflow instances của dự án
    await TaskService.deleteProjectTasks(projectId);
    await supabase.from('workflow_instances').delete().eq('reference_id', projectId).eq('reference_type', 'project');

    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const monthlyPlanCache: Record<string, string> = {};

    // Map các annual plan items hiện có của dự án
    const { data: annualPlanList } = await (supabase as any)
      .from('annual_plan_items')
      .select('id, plan_year, department_code')
      .eq('project_id', projectId);

    const annualPlanMap: Record<string, string> = {};
    if (annualPlanList) {
      annualPlanList.forEach((ap: any) => {
        annualPlanMap[`${ap.plan_year}_${ap.department_code}`] = ap.id;
      });
    }

    const tasksToInsert: any[] = [];
    const monthlyPlanItemsToInsert: any[] = [];
    const linksToUpdate: Array<{ mpiId: string; taskId: string }> = [];
    let previousTaskId: string | null = null;
    let currentSortOrder = 0;

    // 2. Xây dựng danh sách công việc chính và con
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const nodeMetadata = step.metadata || {};
      const parentStepCode = step.workflow_node_id || generateUUID();
      const phase = step.phase || 'preparation';

      // Tạo các công việc con (nếu có)
      if (step.sub_tasks && step.sub_tasks.length > 0) {
        const subCount = step.sub_tasks.length;
        
        for (let idx = 0; idx < subCount; idx++) {
          const st = step.sub_tasks[idx];
          const subTaskId = generateUUID();
          const subMpiId = generateUUID();

          // Phân bổ ngày
          const subDates = distributeDates(step.start_date, step.due_date, subCount, idx);

          const subTitle = st.name || st.title || `Công việc ${idx + 1}`;
          const subAssigneeRole = st.assignee_role || st.metadata?.assignee_role || st.assignedTo || step.assignee_role || '';
          const subLegalBasis = st.legal_basis || st.metadata?.legal_basis || st.legalBasis || step.legal_basis || '';
          const subOutputDoc = st.output || st.metadata?.output || st.output_document || step.output_document || '';

          const subStartDateObj = new Date(subDates.start);
          const subStartYear = subStartDateObj.getFullYear();
          const subStartMonth = subStartDateObj.getMonth() + 1;
          const deptCode = getDeptCode(subAssigneeRole);
          const deptName = DEPARTMENT_NAMES[deptCode] || '';

          let mPlanId: string | null = null;
          try {
            mPlanId = await getOrCreateMonthlyPlan(subStartMonth, subStartYear, deptCode, deptName, monthlyPlanCache);
          } catch (err) {
            console.error('Không thể tạo kế hoạch tháng:', err);
          }

          if (mPlanId) {
            monthlyPlanItemsToInsert.push({
              id: subMpiId,
              monthly_plan_id: mPlanId,
              annual_plan_item_id: annualPlanMap[`${subStartYear}_${deptCode}`] || null,
              project_id: projectId,
              group_name: phase === 'preparation' ? 'Giai đoạn Chuẩn bị đầu tư' : (phase === 'completion' || phase === 'closing' ? 'Giai đoạn Kết thúc dự án' : 'Giai đoạn Thực hiện xây lắp'),
              task_name: subTitle,
              deliverable: subOutputDoc || 'Sản phẩm hoàn thành nghiệm thu theo quy trình',
              deadline_note: `Định hạn hoàn thành: ${subDates.end}`,
              due_date: subDates.end,
              status: 'planned',
              source_task_id: null,
              source_type: 'from_project_task',
              collaborating_text: 'Ban Giám đốc',
              collaborating_dept_codes: ['BGĐ'],
              notes: 'Ánh xạ tự động từ quy trình WBS của Dự án'
            });
            linksToUpdate.push({ mpiId: subMpiId, taskId: subTaskId });
          }

          const subSla = Math.ceil(Math.abs(new Date(subDates.end).getTime() - new Date(subDates.start).getTime()) / (1000 * 60 * 60 * 24)) + 1;

          tasksToInsert.push({
            id: subTaskId,
            project_id: projectId,
            title: subTitle.length > 450 ? subTitle.substring(0, 447) + '...' : subTitle,
            status: 'todo',
            task_type: 'project',
            workflow_id: workflowId,
            workflow_node_id: step.workflow_node_id,
            priority: 'medium',
            progress: 0,
            start_date: subDates.start,
            due_date: subDates.end,
            duration_days: subSla,
            phase: phase,
            step_code: parentStepCode,
            sort_order: currentSortOrder++,
            predecessor_task_id: previousTaskId,
            legal_basis: subLegalBasis,
            output_document: subOutputDoc,
            monthly_plan_item_id: mPlanId ? subMpiId : null,
            metadata: {
              assignee_role: subAssigneeRole,
              is_wbs: true,
              is_elevated_subtask: true,
              node_id: step.workflow_node_id
            }
          });

          previousTaskId = subTaskId;
        }
      } else {
        // Không có công việc con: tạo một công việc đại diện cho chính bước đó
        const taskId = generateUUID();
        const mpiId = generateUUID();

        const assigneeRole = step.assignee_role || nodeMetadata.assignee_role || '';
        const startDateObj = new Date(step.start_date);
        const startYear = startDateObj.getFullYear();
        const startMonth = startDateObj.getMonth() + 1;
        const deptCode = getDeptCode(assigneeRole);
        const deptName = DEPARTMENT_NAMES[deptCode] || '';

        let mPlanId: string | null = null;
        try {
          mPlanId = await getOrCreateMonthlyPlan(startMonth, startYear, deptCode, deptName, monthlyPlanCache);
        } catch (err) {
          console.error('Không thể tạo kế hoạch tháng:', err);
        }

        if (mPlanId) {
          monthlyPlanItemsToInsert.push({
            id: mpiId,
            monthly_plan_id: mPlanId,
            annual_plan_item_id: annualPlanMap[`${startYear}_${deptCode}`] || null,
            project_id: projectId,
            group_name: phase === 'preparation' ? 'Giai đoạn Chuẩn bị đầu tư' : (phase === 'completion' || phase === 'closing' ? 'Giai đoạn Kết thúc dự án' : 'Giai đoạn Thực hiện xây lắp'),
            task_name: `Triển khai: ${step.title}`,
            deliverable: step.output_document || nodeMetadata.output_document || nodeMetadata.output || 'Sản phẩm hoàn thành nghiệm thu theo quy trình',
            deadline_note: `Định hạn hoàn thành: ${step.due_date}`,
            due_date: step.due_date,
            status: 'planned',
            source_task_id: null,
            source_type: 'from_project_task',
            collaborating_text: 'Ban Giám đốc',
            collaborating_dept_codes: ['BGĐ'],
            notes: 'Ánh xạ tự động từ quy trình WBS của Dự án'
          });
          linksToUpdate.push({ mpiId: mpiId, taskId: taskId });
        }

        tasksToInsert.push({
          id: taskId,
          project_id: projectId,
          title: step.title.length > 450 ? step.title.substring(0, 447) + '...' : step.title,
          status: 'todo',
          task_type: 'project',
          workflow_id: workflowId,
          workflow_node_id: step.workflow_node_id,
          priority: 'medium',
          progress: 0,
          start_date: step.start_date,
          due_date: step.due_date,
          duration_days: step.duration_days,
          phase: phase,
          step_code: parentStepCode,
          sort_order: currentSortOrder++,
          predecessor_task_id: previousTaskId,
          legal_basis: step.legal_basis || nodeMetadata.legal_basis || nodeMetadata.legalBasis || '',
          output_document: step.output_document || nodeMetadata.output_document || nodeMetadata.output || '',
          monthly_plan_item_id: mPlanId ? mpiId : null,
          metadata: {
            assignee_role: assigneeRole,
            is_wbs: true,
            node_id: step.workflow_node_id
          }
        });

        previousTaskId = taskId;
      }
    }

    // 3. Insert hàng loạt monthly plan items trước để làm FK cho tasks
    if (monthlyPlanItemsToInsert.length > 0) {
      const { error: mpiErr } = await supabase
        .from('monthly_plan_items')
        .insert(monthlyPlanItemsToInsert);
      if (mpiErr) {
        console.error("Lỗi khi chèn monthly plan items:", mpiErr);
        throw toServiceError(mpiErr, `Tạo kế hoạch tùy chỉnh thất bại`);
      }
    }

    // 4. Insert hàng loạt tasks vào CSDL
    if (tasksToInsert.length > 0) {
      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (error) throw toServiceError(error, `Tạo kế hoạch tùy chỉnh thất bại`);

      // 5. Cập nhật ngược source_task_id trong monthly_plan_items
      if (linksToUpdate.length > 0) {
        try {
          await Promise.all(
            linksToUpdate.map(link =>
              supabase
                .from('monthly_plan_items')
                .update({ source_task_id: link.taskId } as any)
                .eq('id', link.mpiId)
            )
          );
        } catch (updErr) {
          console.error("Lỗi khi cập nhật source_task_id cho monthly_plan_items:", updErr);
        }
      }

      // Đăng ký workflow instance
      if (workflowId) {
        const { error: instErr } = await supabase.from('workflow_instances').insert({
          id: generateUUID(),
          workflow_id: workflowId,
          reference_id: projectId,
          reference_type: 'project',
          status: 'in_progress',
          started_at: new Date().toISOString(),
          context_data: targetEndDate ? { target_end_date: targetEndDate } : {}
        });

        if (instErr) {
          console.error("Lỗi khi đăng ký custom workflow instance:", instErr);
        }
      }

      return (data || []) as unknown as DbTask[];
    }

    return [];
  },
};

