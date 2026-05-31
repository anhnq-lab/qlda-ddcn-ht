import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTaskWeeklyUpdates,
  addWeeklyUpdate,
  updateWeeklyUpdate,
  getCurrentWeekUpdate,
  type WeeklyUpdate,
  type WeeklyUpdateInput,
} from '../services/task/taskWeeklyUpdates';

const weeklyUpdateKeys = {
  all: ['task_weekly_updates'] as const,
  byTask: (taskId: string) => [...weeklyUpdateKeys.all, taskId] as const,
  currentWeek: (taskId: string) => [...weeklyUpdateKeys.all, taskId, 'current'] as const,
};

/** Lấy tất cả báo cáo tuần của 1 task */
export const useTaskWeeklyUpdates = (taskId?: string) => {
  return useQuery<WeeklyUpdate[]>({
    queryKey: weeklyUpdateKeys.byTask(taskId || ''),
    queryFn: () => getTaskWeeklyUpdates(taskId!),
    enabled: !!taskId,
  });
};

/** Lấy báo cáo tuần hiện tại */
export const useCurrentWeekUpdate = (taskId?: string) => {
  return useQuery<WeeklyUpdate | null>({
    queryKey: weeklyUpdateKeys.currentWeek(taskId || ''),
    queryFn: () => getCurrentWeekUpdate(taskId!),
    enabled: !!taskId,
  });
};

/** Mutation: thêm/cập nhật báo cáo tuần */
export const useAddWeeklyUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: WeeklyUpdateInput }) =>
      addWeeklyUpdate(taskId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: weeklyUpdateKeys.byTask(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: weeklyUpdateKeys.currentWeek(variables.taskId) });
    },
  });
};

/** Mutation: sửa báo cáo tuần */
export const useUpdateWeeklyUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ updateId, input }: { updateId: string; input: Partial<WeeklyUpdateInput> }) =>
      updateWeeklyUpdate(updateId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weeklyUpdateKeys.all });
    },
  });
};
