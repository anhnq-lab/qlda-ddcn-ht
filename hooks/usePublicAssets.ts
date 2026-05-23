import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PublicAssetService } from '../services/PublicAssetService';
import { PublicAsset, PublicAssetCategory, PublicAssetTransaction } from '../types/public-asset.types';

export const publicAssetKeys = {
    all: ['public-assets'] as const,
    lists: () => [...publicAssetKeys.all, 'list'] as const,
    categories: () => [...publicAssetKeys.all, 'categories'] as const,
    transactions: (assetId: string) => [...publicAssetKeys.all, 'transactions', assetId] as const,
};

export const usePublicAssets = () => {
    return useQuery<PublicAsset[]>({
        queryKey: publicAssetKeys.lists(),
        queryFn: () => PublicAssetService.getAll(),
        staleTime: 5 * 60 * 1000, // 5 mins
    });
};

export const usePublicAssetCategories = () => {
    return useQuery<PublicAssetCategory[]>({
        queryKey: publicAssetKeys.categories(),
        queryFn: () => PublicAssetService.getCategories(),
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export const usePublicAssetTransactions = (assetId: string) => {
    return useQuery<PublicAssetTransaction[]>({
        queryKey: publicAssetKeys.transactions(assetId),
        queryFn: () => PublicAssetService.getTransactionsByAsset(assetId),
        enabled: !!assetId,
    });
};

export const useCreatePublicAsset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<PublicAsset>) => PublicAssetService.create(payloadToRaw(data)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: publicAssetKeys.lists() });
        },
    });
};

export const useUpdatePublicAsset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PublicAsset> }) => 
            PublicAssetService.update(id, payloadToRaw(data)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: publicAssetKeys.lists() });
        },
    });
};

export const useDeletePublicAsset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => PublicAssetService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: publicAssetKeys.lists() });
        },
    });
};

export const useLiquidatePublicAsset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ assetId, reason }: { assetId: string; reason: string }) => {
            await PublicAssetService.update(assetId, { status: 'pending_liquidation' });
            await PublicAssetService.createTransaction({
                asset_id: assetId,
                transaction_date: new Date().toISOString().split('T')[0],
                transaction_type: 'decrease',
                reason: 'pending_liquidation',
                description: `Đề xuất thanh lý: ${reason}`,
                cost_change: 0,
                depreciation_change: 0
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: publicAssetKeys.lists() });
        },
    });
};

export const useTriggerDepreciation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (year: number) => PublicAssetService.calculateAnnualDepreciation(year),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: publicAssetKeys.lists() });
        },
    });
};

// Helper function to map camelCase backend payload to database expected fields
// (or filter out null values if needed)
function payloadToRaw(payload: any): any {
    return {
        ...payload,
        // map optional keys if necessary
    };
}
