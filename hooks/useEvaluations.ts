import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EvaluationService } from '../features/evaluation/services/evaluationService';
import { EvaluationForm, EvalScores, EvaluationStatus } from '../features/evaluation/types/evaluation.types';

export const evaluationKeys = {
    all: ['evaluations'] as const,
    lists: () => [...evaluationKeys.all, 'list'] as const,
    list: (params: any) => [...evaluationKeys.lists(), params] as const,
    details: () => [...evaluationKeys.all, 'detail'] as const,
    detail: (id: string) => [...evaluationKeys.details(), id] as const,
    periods: () => [...evaluationKeys.all, 'period'] as const,
    period: (employeeId: string, month: number, year: number) => 
        [...evaluationKeys.periods(), employeeId, month, year] as const,
};

export const useEvaluations = (params: {
    eval_year?: number;
    eval_month?: number;
    department_code?: string;
    employee_id?: string;
    status?: EvaluationStatus;
}) => {
    return useQuery({
        queryKey: evaluationKeys.list(params),
        queryFn: async () => {
            const { data, error } = await EvaluationService.list(params);
            if (error) throw new Error(error);
            return data || [];
        },
        staleTime: 2 * 60 * 1000, // 2 mins
    });
};

export const useEvaluation = (id: string) => {
    return useQuery({
        queryKey: evaluationKeys.detail(id),
        queryFn: async () => {
            const { data, error } = await EvaluationService.getById(id);
            if (error) throw new Error(error);
            return data;
        },
        enabled: !!id,
    });
};

export const useEvaluationByEmployeePeriod = (params: {
    employee_id: string;
    eval_month: number;
    eval_year: number;
}) => {
    return useQuery({
        queryKey: evaluationKeys.period(params.employee_id, params.eval_month, params.eval_year),
        queryFn: async () => {
            const { data, error } = await EvaluationService.getByEmployeePeriod(params);
            if (error) throw new Error(error);
            return data;
        },
        enabled: !!params.employee_id && !!params.eval_month && !!params.eval_year,
    });
};

export const useCreateEvaluation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Parameters<typeof EvaluationService.create>[0]) => {
            const { data, error } = await EvaluationService.create(payload);
            if (error) throw new Error(error);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
        },
    });
};

export const useUpdateSelfScores = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, scores, chucVu }: { id: string; scores: EvalScores; chucVu?: string | null }) => {
            const { error } = await EvaluationService.updateSelfScores(id, scores, chucVu);
            if (error) throw new Error(error);
            return true;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: evaluationKeys.periods() });
        },
    });
};

export const useSubmitEvaluation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await EvaluationService.submit(id);
            if (error) throw new Error(error);
            return true;
        },
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: evaluationKeys.periods() });
        },
    });
};

export const useApproveEvaluation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { 
            id: string; 
            data: {
                manager_scores: EvalScores;
                manager_notes?: string | null;
                manager_id: string;
                manager_name: string;
            }
        }) => {
            const { error } = await EvaluationService.approve(id, data);
            if (error) throw new Error(error);
            return true;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: evaluationKeys.periods() });
        },
    });
};

export const useRejectEvaluation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { 
            id: string; 
            data: {
                manager_notes: string;
                manager_id: string;
                manager_name: string;
            }
        }) => {
            const { error } = await EvaluationService.reject(id, data);
            if (error) throw new Error(error);
            return true;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: evaluationKeys.periods() });
        },
    });
};
