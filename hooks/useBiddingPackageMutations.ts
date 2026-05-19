import { useMutation, useQueryClient } from '@tanstack/react-query';
import ProjectService from '../services/ProjectService';
import { BiddingPackage } from '../types';

/**
 * Query keys for bidding packages — centralized for consistent invalidation
 */
export const packageKeys = {
    all: ['bidding-packages-all'] as const,
    byProject: (projectId: string) => ['project-packages', projectId] as const,
};

/**
 * Hook: Create a new bidding package
 */
export const useCreatePackage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<BiddingPackage>) => ProjectService.createPackage(data),
        onSuccess: (_result, variables) => {
            // Invalidate relevant queries
            if (variables.ProjectID) {
                queryClient.invalidateQueries({ queryKey: packageKeys.byProject(variables.ProjectID) });
            }
            queryClient.invalidateQueries({ queryKey: packageKeys.all });
        },
    });
};

/**
 * Hook: Update an existing bidding package
 */
export const useUpdatePackage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<BiddingPackage> }) =>
            ProjectService.updatePackage(id, data),
        onSuccess: (_result, variables) => {
            // Invalidate all package queries — update could affect plan totals, status, etc.
            if (variables.data.ProjectID) {
                queryClient.invalidateQueries({ queryKey: packageKeys.byProject(variables.data.ProjectID) });
            }
            queryClient.invalidateQueries({ queryKey: packageKeys.all });
            // Also invalidate contracts in case winning contractor changed
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
        },
    });
};

/**
 * Hook: Delete a bidding package (with safety checks)
 */
export const useDeletePackage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
            ProjectService.deletePackage(id),
        onSuccess: (_result, variables) => {
            queryClient.invalidateQueries({ queryKey: packageKeys.byProject(variables.projectId) });
            queryClient.invalidateQueries({ queryKey: packageKeys.all });
        },
    });
};

