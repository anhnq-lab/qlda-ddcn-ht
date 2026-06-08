/**
 * useTasks — Unified hooks for tasks (project + internal)
 * Replaces both legacy useTasks.ts and useWorkflowTasks.ts
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskService } from '../services/TaskService';
import type { DbTask } from '../services/TaskService';
import { workflowTaskToTask, taskToDbTask } from '../lib/dbMappers';
import { Task } from '../types/task.types';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';

// ── Query Keys ────────────────────────────────────────────────
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string, filters?: Record<string, any>) => [...taskKeys.details(), id, filters || {}] as const,
};

// ── Read Hooks ────────────────────────────────────────────────

/** Lấy tasks theo dự án */
export const useProjectTasks = (projectId?: string) => {
  const { currentUser } = useAuth();
  const { impersonatedUser, isImpersonating } = useImpersonation();
  const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;
  const userId = effectiveUser?.EmployeeID || 'guest';

  return useQuery({
    queryKey: taskKeys.list({ projectId, userId }),
    queryFn: async () => {
      if (!projectId) return [] as Task[];
      const data = await TaskService.getProjectTasks(projectId);
      return data.map(wt => workflowTaskToTask(wt));
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/** Lấy tất cả tasks (scoped theo project IDs) — cho TaskList page */
export const useAllTasks = (projectIds?: string[]) => {
  const { currentUser } = useAuth();
  const { impersonatedUser, isImpersonating } = useImpersonation();
  const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;
  const userId = effectiveUser?.EmployeeID || 'guest';

  return useQuery({
    queryKey: taskKeys.list({ scope: projectIds, userId }),
    queryFn: async () => {
      const data = await TaskService.getAllTasks(projectIds);
      return data.map(wt => workflowTaskToTask(wt));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/** Lấy tasks nội bộ */
export const useInternalTasks = () => {
  const { currentUser } = useAuth();
  const { impersonatedUser, isImpersonating } = useImpersonation();
  const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;
  const userId = effectiveUser?.EmployeeID || 'guest';

  return useQuery({
    queryKey: taskKeys.list({ type: 'internal', userId }),
    queryFn: async () => {
        const data = await TaskService.getInternalTasks();
        return data.map(wt => workflowTaskToTask(wt));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/** Lấy 1 task */
export const useTask = (taskId?: string) => {
  const { currentUser } = useAuth();
  const { impersonatedUser, isImpersonating } = useImpersonation();
  const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;
  const userId = effectiveUser?.EmployeeID || 'guest';

  return useQuery({
    queryKey: taskKeys.detail(taskId || '', { userId }),
    queryFn: async () => {
      if (!taskId) return null;
      const data = await TaskService.getTaskById(taskId);
      return data ? workflowTaskToTask(data) : null;
    },
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// ── Mutation Hooks ────────────────────────────────────────────

/** Tạo/Cập nhật task */
export const useSaveTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task: Partial<DbTask> & { id?: string }) => TaskService.saveTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/** Cập nhật task */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (arg: { taskId: string; updates: Partial<DbTask> } | Partial<Task>) => {
      let tid: string;
      let upd: Partial<DbTask>;
      if ('taskId' in arg && 'updates' in arg) {
        tid = arg.taskId as string;
        upd = arg.updates as Partial<DbTask>;
      } else {
        tid = (arg as Partial<Task>).TaskID!;
        upd = taskToDbTask(arg as Task);
      }
      return TaskService.updateTask(tid, upd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/** Xóa task */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => TaskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/** Tạo tasks từ workflow template */
export const useCreateTasksFromWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      workflowId,
      startDate,
      endDate,
    }: {
      projectId: string;
      workflowId: string;
      startDate: string;
      endDate: string;
    }) => TaskService.createTasksFromWorkflow(projectId, workflowId, startDate, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/** Xóa tất cả tasks của dự án */
export const useDeleteProjectTasks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => TaskService.deleteProjectTasks(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

// ── Backward Compatibility Aliases ────────────────────────────
// These exist so old imports don't break during migration
export const useWorkflowTasks = useProjectTasks;
export const useAllWorkflowTasks = useAllTasks;
export const useUpdateWorkflowTask = useUpdateTask;
export const useDeleteWorkflowTask = useDeleteTask;
export const workflowTaskKeys = taskKeys;
