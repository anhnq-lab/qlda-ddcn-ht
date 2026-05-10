// TaskService — Unified CRUD operations for tasks (project + internal)
// Bảng `tasks` mới: UUID PK, unified schema
import { supabase } from '../lib/supabase';
import { WorkflowTemplateService } from './WorkflowTemplateService';

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
    let query = supabase
      .from('tasks')
      .select('*, projects(project_name)')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (projectIds && projectIds.length > 0) {
      // Lấy cả tasks thuộc projects + internal tasks
      query = query.or(`project_id.in.(${projectIds.join(',')}),task_type.eq.internal`);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []) as unknown as DbTask[];
  },

  /** Lấy tasks theo dự án */
  getProjectTasks: async (projectId: string): Promise<DbTask[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    
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
    const { data, error } = await (supabase as any)
      .from('tasks')
      .select('*')
      .eq('task_type', 'internal')
      .order('created_at', { ascending: false });

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
    const { data: subData } = await supabase
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
    const { data, error } = await supabase
      .from('sub_tasks')
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as DbSubTask[];
  },

  /** Đếm tasks theo project (cho Dashboard) */
  countByProject: async (projectId: string) => {
    const { count: total } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const { count: done } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'done');

    return { total: total || 0, done: done || 0 };
  },

  // ─── COLLABORATION READ ──────────────────────────────────
  
  /** Lấy bình luận của 1 task */
  getTaskComments: async (taskId: string) => {
    const { data, error } = await supabase.rpc('get_task_comments_v2', { p_task_id: taskId });
    if (error) throw error;
    return data || [];
  },
  
  /** Lấy nhật ký hoạt động của 1 task */
  getTaskActivities: async (taskId: string) => {
    const { data, error } = await supabase.rpc('get_task_activities_v2', { p_task_id: taskId });
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
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(payload.assignee_id)) {
        // Store non-UUID assignee in metadata as role name
        (payload as any).metadata = { ...(payload as any).metadata, assignee_role: payload.assignee_id };
        payload.assignee_id = null;
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload as any)
      .select()
      .single();

    if (error) throw error;
    
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
      if (payload.assignee_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.assignee_id)) {
        (payload as any).metadata = { ...((payload as any).metadata || {}), assignee_role: payload.assignee_id };
        payload.assignee_id = null;
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

    if (error) throw error;

    // Sync sub-tasks if provided
    if (subTasks !== null) {
      // Get existing subtasks to detect deletions
      const { data: existingSubs } = await supabase.from('tasks').select('id').eq('parent_id', taskId);
      const existingIds = (existingSubs || []).map(s => s.id);
      
      const newIds: string[] = [];
      const subsToUpsert = subTasks.map(st => {
        // Kiểm tra xem ID có phải là UUID hợp lệ không. Nếu sinh từ UI ('SUB-xxx'), tạo UUID mới
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(st.SubTaskID);
        const subId = isUUID ? st.SubTaskID : crypto.randomUUID();
        newIds.push(subId);
        
        const isAssigneeUUID = st.AssigneeID && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(st.AssigneeID);

        return {
          id: subId,
          parent_id: taskId,
          project_id: currentTask?.project_id,
          task_type: currentTask?.task_type || 'project',
          title: st.Title,
          status: st.Status === 'Done' ? 'done' : (st.Status === 'InProgress' ? 'in_progress' : 'todo'),
          due_date: st.DueDate || null,
          assignee_id: isAssigneeUUID ? st.AssigneeID : null,
          metadata: isAssigneeUUID ? {} : { assignee_role: st.AssigneeID }
        };
      });

      if (subsToUpsert.length > 0) {
        await supabase.from('tasks').upsert(subsToUpsert);
      }

      // Xóa các subtask bị người dùng gỡ bỏ UI khỏi CSDL
      const toDelete = existingIds.filter(id => !newIds.includes(id));
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

    if (error) throw error;
  },

  /** Xóa tất cả tasks của dự án */
  deleteProjectTasks: async (projectId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', projectId)
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  },

  // ─── SUB-TASKS ───────────────────────────────────────────

  /** Upsert sub-task */
  saveSubTask: async (subTask: Partial<DbSubTask> & { task_id: string }): Promise<DbSubTask> => {
    if (subTask.id) {
      const { data, error } = await (supabase as any)
        .from('sub_tasks')
        .update({ ...subTask, updated_at: new Date().toISOString() } as any)
        .eq('id', subTask.id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DbSubTask;
    } else {
      const { data, error } = await (supabase as any)
        .from('sub_tasks')
        .insert(subTask as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DbSubTask;
    }
  },

  /** Xóa sub-task */
  deleteSubTask: async (subTaskId: string): Promise<void> => {
    const { error } = await (supabase as any).from('sub_tasks').delete().eq('id', subTaskId);
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
      .select('*, user:auth.users!user_id(id, email, raw_user_meta_data)')
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
    startDate: string
  ): Promise<DbTask[]> => {
    // 1. Lấy nodes của workflow template
    const nodes = await WorkflowTemplateService.getTemplateNodes(workflowId);
    const workNodes = nodes.filter(n => ['approval', 'input', 'automated', 'start'].includes(n.type));

    if (workNodes.length === 0) return [];

    // Helper: Cộng số ngày làm việc (Bỏ qua Thứ 7, CN)
    const addWorkingDays = (startDateObj: Date, daysToAdd: number): Date => {
      const date = new Date(startDateObj);
      let added = 0;
      while (added < daysToAdd) {
        date.setDate(date.getDate() + 1);
        // 0 = Sunday, 6 = Saturday
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          added++;
        }
      }
      return date;
    };

    let currentDate = new Date(startDate);
    let previousTaskId: string | null = null;
    
    const tasksToInsert: any[] = [];
    const subTasksToInsert: any[] = [];
    
    // Khởi tạo UUID helper (cho cả môi trường browser và fallback pseudo)
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback
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

      // Start Date = Current Tracker
      const nodeStartDate = new Date(currentDate);
      // End Date = currentDate + SLA (working days)
      const nodeEndDate = addWorkingDays(currentDate, nodeSla);

      const taskId = generateUUID();
      const nodeMetadata = (node.metadata || {}) as any;
      const subTasksDef = nodeMetadata.sub_tasks || [];

      // Translate into existing DB columns
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
        start_date: nodeStartDate.toISOString().split('T')[0],
        due_date: nodeEndDate.toISOString().split('T')[0],
        duration_days: nodeSla,
        phase: nodeMetadata.phase || 'preparation',
        step_code: nodeMetadata.step_code || (node.name.match(/^(\d+)\./) ? node.name.match(/^(\d+)\./)![1] : (i + 1).toString()),
        sort_order: i,
        predecessor_task_id: previousTaskId, // Link for Gantt
        legal_basis: nodeMetadata.legalBasis || '',
        metadata: {
          sub_process: nodeMetadata.sub_process || '',
          sla_formula: node.sla_formula,
          assignee_role: nodeMetadata.assignee_role || '',
        },
      } as any);

      // Prepare Sub Tasks definitions stored directly to `tasks` table with `parent_id`
      if (subTasksDef.length > 0) {
        subTasksDef.forEach((st: any, idx: number) => {
          const subTaskName = st.name || st.title || `Công việc ${idx + 1}`;
          subTasksToInsert.push({
            id: generateUUID(),
            parent_id: taskId,
            project_id: projectId,
            title: subTaskName.length > 255 ? subTaskName.substring(0, 252) + '...' : subTaskName,
            status: 'todo',
            task_type: 'project',
            sort_order: idx,
            due_date: null,
            assignee_id: null,
            metadata: {
              assignee_role: st.assignee_role || st.assignedTo || '',
              legal_basis: st.legal_basis || st.legalBasis || '',
              output: st.output || '',
            }
          });
        });
      }

      // Update trackers for the next node
      previousTaskId = taskId;
      currentDate = new Date(nodeEndDate); // The next node starts on the day after the previous node ended (or technically same day if chain is continuous)
    }

    // 3. Batch DB insertions
    if (tasksToInsert.length > 0) {
      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToInsert as any)
        .select();

      if (error) throw new Error(`Tạo kế hoạch thất bại: ${error.message}`);
      
      // Batch insert sub_tasks if they exist into `tasks` table
      if (subTasksToInsert.length > 0) {
        const { error: subErr } = await supabase
          .from('tasks')
          .insert(subTasksToInsert as any);
          
        if (subErr) {
          console.error("Lỗi khi tạo công việc con:", subErr);
          // Không throw để tránh fail nguyên luồng tạo Master Plan
        }
      }

      // Đăng ký workflow_instances để UI biết Project này đang chạy quy trình nào
      const { error: instErr } = await supabase.from('workflow_instances').insert({
        id: generateUUID(),
        workflow_id: workflowId,
        reference_id: projectId,
        reference_type: 'project',
        status: 'in_progress',
        started_at: new Date().toISOString()
      } as any);

      if (instErr) {
        console.error("Lỗi khi đăng ký workflow instance:", instErr);
      }

      // Trả lại task đã tạo
      return (data || []) as unknown as DbTask[];
    }

    return [];
  },
};

