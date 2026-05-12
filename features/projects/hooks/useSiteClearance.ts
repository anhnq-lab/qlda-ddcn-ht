import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SiteClearanceService } from '@/services';
import { UpdateSiteClearanceDTO, UpdateClearanceMilestoneDTO } from '@/types';
import { useToast } from '@/components/ui/Toast';

export const useSiteClearanceKeys = {
    all: ['site-clearance'] as const,
    details: (projectId: string) => [...useSiteClearanceKeys.all, projectId, 'details'] as const,
    milestones: (projectId: string) => [...useSiteClearanceKeys.all, projectId, 'milestones'] as const,
};

export const useSiteClearance = (projectId: string) => {
    return useQuery({
        queryKey: useSiteClearanceKeys.details(projectId),
        queryFn: () => SiteClearanceService.getClearanceByProjectId(projectId),
        enabled: !!projectId,
    });
};

export const useInitializeClearance = () => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    
    return useMutation({
        mutationFn: (projectId: string) => SiteClearanceService.initializeClearance(projectId),
        onSuccess: (data) => {
            queryClient.setQueryData(useSiteClearanceKeys.details(data.project_id), data);
            queryClient.invalidateQueries({ queryKey: useSiteClearanceKeys.milestones(data.project_id) });
            showToast('Khởi tạo quy trình Giải phóng mặt bằng thành công', 'success');
        },
        onError: (error: any) => {
            showToast(error.message || 'Lỗi khi khởi tạo GPMB', 'error');
        }
    });
};

export const useUpdateSiteClearance = (projectId: string) => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    
    return useMutation({
        mutationFn: (updates: UpdateSiteClearanceDTO) => SiteClearanceService.updateClearance(projectId, updates),
        onSuccess: (data) => {
            queryClient.setQueryData(useSiteClearanceKeys.details(projectId), data);
            showToast('Cập nhật thông tin GPMB thành công', 'success');
        },
        onError: (error: any) => {
            showToast(error.message || 'Lỗi khi cập nhật GPMB', 'error');
        }
    });
};

export const useSiteClearanceMilestones = (projectId: string) => {
    return useQuery({
        queryKey: useSiteClearanceKeys.milestones(projectId),
        queryFn: () => SiteClearanceService.getMilestones(projectId),
        enabled: !!projectId,
    });
};

export const useUpdateClearanceMilestone = (projectId: string) => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    
    return useMutation({
        mutationFn: ({ milestoneId, updates }: { milestoneId: string, updates: UpdateClearanceMilestoneDTO }) => 
            SiteClearanceService.updateMilestone(milestoneId, updates),
        onSuccess: (data) => {
            // Update cache
            queryClient.setQueryData(useSiteClearanceKeys.milestones(projectId), (oldData: any[]) => {
                if (!oldData) return oldData;
                return oldData.map(m => m.id === data.id ? data : m);
            });
            showToast('Cập nhật bước GPMB thành công', 'success');
        },
        onError: (error: any) => {
            showToast(error.message || 'Lỗi khi cập nhật bước GPMB', 'error');
        }
    });
};
