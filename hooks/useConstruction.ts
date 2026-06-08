// hooks/useConstruction.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConstructionService } from '../services/ConstructionService';
import { DailyLogCombinedData, ConstructionProgress } from '../types/construction.types';
import { useToast } from '../components/ui/Toast';

export const useConstructionLogs = (projectId: string) => {
  return useQuery({
    queryKey: ['construction-logs', projectId],
    queryFn: () => ConstructionService.getDailyLogs(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

export const useConstructionLogCombined = (projectId: string, date: string) => {
  return useQuery({
    queryKey: ['construction-log-detail', projectId, date],
    queryFn: () => ConstructionService.getDailyLogCombined(projectId, date),
    enabled: !!projectId && !!date,
    staleTime: 1 * 60 * 1000 // 1 minute
  });
};

export const useSaveConstructionLog = (projectId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: DailyLogCombinedData) => 
      ConstructionService.saveDailyLogCombined(projectId, data),
    onSuccess: (logId, variables) => {
      // Invalidate both lists and specific day details
      queryClient.invalidateQueries({ queryKey: ['construction-logs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['construction-log-detail', projectId, variables.log.log_date] });
      
      addToast({
        title: 'Thành công',
        message: `Đã lưu nhật ký thi công ngày ${variables.log.log_date}`,
        type: 'success'
      });
    },
    onError: (error) => {
      console.error(error);
      addToast({
        title: 'Thất bại',
        message: error.message || 'Lỗi khi lưu nhật ký thi công.',
        type: 'error'
      });
    }
  });
};

export const useConstructionPhotos = (projectId: string) => {
  return useQuery({
    queryKey: ['construction-photos', projectId],
    queryFn: () => ConstructionService.getSitePhotos(projectId),
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
};

export const useUploadConstructionPhoto = (projectId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ file, caption, logId }: { file: File; caption?: string; logId?: string }) => 
      ConstructionService.uploadSitePhoto(projectId, file, caption, logId),
    onSuccess: (newPhoto) => {
      queryClient.invalidateQueries({ queryKey: ['construction-photos', projectId] });
      addToast({
        title: 'Tải lên thành công',
        message: `Đã tải lên hình ảnh: ${newPhoto.caption || 'Hiện trường thi công'}`,
        type: 'success'
      });
    },
    onError: (error) => {
      console.error(error);
      addToast({
        title: 'Thất bại',
        message: error.message || 'Lỗi khi tải hình ảnh lên.',
        type: 'error'
      });
    }
  });
};

export const useConstructionProgress = (projectId: string) => {
  return useQuery({
    queryKey: ['construction-progress', projectId],
    queryFn: () => ConstructionService.getConstructionProgress(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

export const useSaveConstructionProgress = (projectId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (tasks: ConstructionProgress[]) =>
      ConstructionService.saveConstructionProgress(projectId, tasks),
    onMutate: async (newTasks) => {
      await queryClient.cancelQueries({ queryKey: ['construction-progress', projectId] });
      const previous = queryClient.getQueryData<ConstructionProgress[]>(['construction-progress', projectId]);
      queryClient.setQueryData<ConstructionProgress[]>(['construction-progress', projectId], (old = []) => {
        const updated = [...old];
        for (const t of newTasks) {
          const idx = updated.findIndex(o => o.progress_id === t.progress_id);
          if (idx >= 0) updated[idx] = { ...updated[idx], ...t };
          else updated.push({ ...t, progress_id: t.progress_id || `temp-${Date.now()}` });
        }
        return updated;
      });
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['construction-progress', projectId], context.previous);
      }
      addToast({
        title: 'Thất bại',
        message: error.message || 'Lỗi khi cập nhật tiến độ.',
        type: 'error'
      });
    },
    onSuccess: () => {
      addToast({
        title: 'Lưu tiến độ thành công',
        message: 'Đã cập nhật tiến độ thi công của nhà thầu.',
        type: 'success'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-progress', projectId] });
    },
  });
};

export const useDeleteProgressItem = (projectId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (progressId: string) =>
      ConstructionService.deleteConstructionProgress(progressId),
    onMutate: async (progressId) => {
      await queryClient.cancelQueries({ queryKey: ['construction-progress', projectId] });
      const previous = queryClient.getQueryData<ConstructionProgress[]>(['construction-progress', projectId]);
      queryClient.setQueryData<ConstructionProgress[]>(['construction-progress', projectId], (old = []) =>
        old.filter(item => item.progress_id !== progressId)
      );
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['construction-progress', projectId], context.previous);
      }
      addToast({
        title: 'Thất bại',
        message: error.message || 'Lỗi khi xóa đầu việc tiến độ.',
        type: 'error'
      });
    },
    onSuccess: () => {
      addToast({
        title: 'Đã xóa đầu việc',
        message: 'Đã xóa đầu việc tiến độ thi công thành công.',
        type: 'success'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-progress', projectId] });
    },
  });
};

export const useDeleteConstructionLog = (projectId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (logId: string) => ConstructionService.deleteDailyLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-logs', projectId] });
      addToast({
        title: 'Thành công',
        message: 'Đã xóa nhật ký thi công.',
        type: 'success'
      });
    },
    onError: (error) => {
      console.error(error);
      addToast({
        title: 'Thất bại',
        message: error.message || 'Lỗi khi xóa nhật ký thi công.',
        type: 'error'
      });
    }
  });
};

export const useConstructionResourceStats = (projectId: string) => {
  return useQuery({
    queryKey: ['construction-resource-stats', projectId],
    queryFn: () => ConstructionService.getConstructionResourceStats(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000
  });
};

export const useConstructionKpis = (projectId: string) => {
  return useQuery({
    queryKey: ['construction-kpis', projectId],
    queryFn: () => ConstructionService.getConstructionKpis(projectId),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000
  });
};
