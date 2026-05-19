import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VariationOrderService } from '../services/VariationOrderService';
import { VariationOrder } from '../types';

export function useVariationOrders(contractId: string) {
    const { data: variationOrders = [], isLoading, error } = useQuery({
        queryKey: ['variationOrders', contractId],
        queryFn: () => VariationOrderService.getByContractId(contractId),
        enabled: !!contractId,
    });

    return { variationOrders, isLoading, error };
}

export function useCreateVariationOrder(contractId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<VariationOrder>) => VariationOrderService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['variationOrders', contractId] });
        },
    });
}

export function useUpdateVariationOrder(contractId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<VariationOrder> }) =>
            VariationOrderService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['variationOrders', contractId] });
        },
    });
}

export function useDeleteVariationOrder(contractId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => VariationOrderService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['variationOrders', contractId] });
        },
    });
}
