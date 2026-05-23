import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CapitalService } from '../services/CapitalService';
import { CapitalPlan, Disbursement } from '../types';

// ═══════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════

export const useCapitalPlans = (projectId: string) => {
    return useQuery({
        queryKey: ['capitalPlans', projectId],
        queryFn: () => CapitalService.getCapitalPlans(projectId),
        enabled: !!projectId
    });
};

export const useDisbursements = (projectId: string) => {
    return useQuery({
        queryKey: ['disbursements', projectId],
        queryFn: () => CapitalService.getDisbursements(projectId),
        enabled: !!projectId
    });
};

export const useDisbursementPlans = (projectId: string) => {
    return useQuery({
        queryKey: ['disbursementPlans', projectId],
        queryFn: () => CapitalService.getDisbursementPlans(projectId),
        enabled: !!projectId
    });
};

export const useCapitalStats = (projectId: string) => {
    return useQuery({
        queryKey: ['capitalStats', projectId],
        queryFn: () => CapitalService.getFinancialStats(projectId),
        enabled: !!projectId
    });
};

export const useCapitalAlerts = (projectId: string) => {
    return useQuery({
        queryKey: ['capitalAlerts', projectId],
        queryFn: () => CapitalService.getAlerts(projectId),
        enabled: !!projectId
    });
};

/**
 * [PRIMARY HOOK] Single source of truth for project capital data.
 * Replaces both useCapitalStats + useCapitalPlans + useDisbursements with one cached call.
 * Used by ProjectCapitalTab and (optionally) MidTermCapitalPage project drill-down.
 */
export const useProjectCapitalSummary = (projectId: string) => {
    return useQuery({
        queryKey: ['project-capital-summary', projectId],
        queryFn: () => CapitalService.getProjectCapitalSummary(projectId),
        enabled: !!projectId,
        staleTime: 30_000, // 30s cache — balance between freshness and performance
    });
};



// ═══════════════════════════════════════════════════════════
// MUTATIONS — Capital Plans
// ═══════════════════════════════════════════════════════════

const CAPITAL_QUERY_KEYS = (projectId: string) => [
    ['capitalPlans', projectId],
    ['capitalStats', projectId],
    ['capitalAlerts', projectId],
    ['project-capital', projectId],
    ['project-capital-summary', projectId],
    ['all-capital-plans'],
    ['all-disb-plans'],
    ['all-disbursements'],
];

/** Primary summary query key */
const SUMMARY_KEY = (projectId: string) => ['project-capital-summary', projectId];

export const useCreateCapitalPlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (plan: Omit<CapitalPlan, 'PlanID'>) =>
            CapitalService.createCapitalPlan(plan),
        onMutate: async (newPlan) => {
            await qc.cancelQueries({ queryKey: SUMMARY_KEY(newPlan.ProjectID) });
            const prev = qc.getQueryData(SUMMARY_KEY(newPlan.ProjectID));
            qc.setQueryData(SUMMARY_KEY(newPlan.ProjectID), (old: any) => {
                if (!old) return old;
                return { ...old, capitalPlans: [...(old.capitalPlans ?? []), { ...newPlan, PlanID: `__opt_${Date.now()}`, DisbursedAmount: 0 }] };
            });
            return { prev, projectId: newPlan.ProjectID };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev !== undefined) qc.setQueryData(SUMMARY_KEY(ctx.projectId), ctx.prev);
        },
        onSuccess: (_data, variables) => {
            CAPITAL_QUERY_KEYS(variables.ProjectID).forEach(k => qc.invalidateQueries({ queryKey: k }));
        },
    });
};

export const useUpdateCapitalPlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ planId, updates, projectId }: { planId: string; updates: Partial<CapitalPlan>; projectId: string }) =>
            CapitalService.updateCapitalPlan(planId, updates),
        onSuccess: (_data, variables) => {
            CAPITAL_QUERY_KEYS(variables.projectId).forEach(k => qc.invalidateQueries({ queryKey: k }));
        },
    });
};

export const useDeleteCapitalPlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ planId, projectId }: { planId: string; projectId: string }) =>
            CapitalService.deleteCapitalPlan(planId),
        onMutate: async ({ planId, projectId }) => {
            await qc.cancelQueries({ queryKey: SUMMARY_KEY(projectId) });
            const prev = qc.getQueryData(SUMMARY_KEY(projectId));
            qc.setQueryData(SUMMARY_KEY(projectId), (old: any) => {
                if (!old) return old;
                return { ...old, capitalPlans: (old.capitalPlans ?? []).filter((p: CapitalPlan) => p.PlanID !== planId) };
            });
            return { prev, projectId };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev !== undefined) qc.setQueryData(SUMMARY_KEY(ctx.projectId), ctx.prev);
        },
        onSuccess: (_data, variables) => {
            CAPITAL_QUERY_KEYS(variables.projectId).forEach(k => qc.invalidateQueries({ queryKey: k }));
        },
    });
};

// ═══════════════════════════════════════════════════════════
// MUTATIONS — Disbursements
// ═══════════════════════════════════════════════════════════

export const useCreateDisbursement = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (d: Omit<Disbursement, 'DisbursementID'>) =>
            CapitalService.createDisbursement(d),
        onMutate: async (newDisb) => {
            await qc.cancelQueries({ queryKey: SUMMARY_KEY(newDisb.ProjectID) });
            const prev = qc.getQueryData(SUMMARY_KEY(newDisb.ProjectID));
            qc.setQueryData(SUMMARY_KEY(newDisb.ProjectID), (old: any) => {
                if (!old) return old;
                return { ...old, disbursements: [...(old.disbursements ?? []), { ...newDisb, DisbursementID: `__opt_${Date.now()}`, Status: newDisb.Status || 'Pending' }] };
            });
            return { prev, projectId: newDisb.ProjectID };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev !== undefined) qc.setQueryData(SUMMARY_KEY(ctx.projectId), ctx.prev);
        },
        onSuccess: (_data, variables) => {
            CAPITAL_QUERY_KEYS(variables.ProjectID).forEach(k => qc.invalidateQueries({ queryKey: k }));
        },
    });
};

export const useUpdateDisbursement = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates, projectId }: { id: string; updates: Partial<Disbursement>; projectId: string }) =>
            CapitalService.updateDisbursement(id, updates),
        onSuccess: (_data, variables) => {
            CAPITAL_QUERY_KEYS(variables.projectId).forEach(k => qc.invalidateQueries({ queryKey: k }));
        },
    });
};

export const useDeleteDisbursement = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
            CapitalService.deleteDisbursement(id),
        onMutate: async ({ id, projectId }) => {
            await qc.cancelQueries({ queryKey: SUMMARY_KEY(projectId) });
            const prev = qc.getQueryData(SUMMARY_KEY(projectId));
            qc.setQueryData(SUMMARY_KEY(projectId), (old: any) => {
                if (!old) return old;
                return { ...old, disbursements: (old.disbursements ?? []).filter((d: Disbursement) => d.DisbursementID !== id) };
            });
            return { prev, projectId };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev !== undefined) qc.setQueryData(SUMMARY_KEY(ctx.projectId), ctx.prev);
        },
        onSuccess: (_data, variables) => {
            CAPITAL_QUERY_KEYS(variables.projectId).forEach(k => qc.invalidateQueries({ queryKey: k }));
        },
    });
};

export const useBulkSaveDisbursementPlans = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, year, plans }: { projectId: string; year: number; plans: { id?: string, month: number, plannedAmount: number, actualAmount: number, notes: string }[] }) =>
            CapitalService.bulkSaveDisbursementPlans(projectId, year, plans),
        onSuccess: (_data, variables) => {
            CAPITAL_QUERY_KEYS(variables.projectId).forEach(k => qc.invalidateQueries({ queryKey: k }));
        },
    });
};

// ═══════════════════════════════════════════════════════════
// MUTATIONS — Disbursement Plans
// ═══════════════════════════════════════════════════════════

export const useCreateDisbursementPlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (plan: Omit<import('../services/CapitalService').DisbursementPlanItem, 'Id'>) =>
            CapitalService.createDisbursementPlan(plan),
        onSuccess: (_data, variables) => {
            CAPITAL_QUERY_KEYS(variables.ProjectID).forEach(k => qc.invalidateQueries({ queryKey: k }));
        },
    });
};

export const useUpdateDisbursementPlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates, projectId }: { id: string; updates: Partial<import('../services/CapitalService').DisbursementPlanItem>; projectId: string }) =>
            CapitalService.updateDisbursementPlan(id, updates),
        onSuccess: (_data, variables) => {
            CAPITAL_QUERY_KEYS(variables.projectId).forEach(k => qc.invalidateQueries({ queryKey: k }));
        },
    });
};

export const useDeleteDisbursementPlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
            CapitalService.deleteDisbursementPlan(id),
        onSuccess: (_data, variables) => {
            CAPITAL_QUERY_KEYS(variables.projectId).forEach(k => qc.invalidateQueries({ queryKey: k }));
        },
    });
};


