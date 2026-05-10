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

export const useCreateCapitalPlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (plan: Omit<CapitalPlan, 'PlanID'>) =>
            CapitalService.createCapitalPlan(plan),
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
            qc.invalidateQueries({ queryKey: ['disbursementPlans', variables.ProjectID] });
        },
    });
};

export const useUpdateDisbursementPlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates, projectId }: { id: string; updates: Partial<import('../services/CapitalService').DisbursementPlanItem>; projectId: string }) =>
            CapitalService.updateDisbursementPlan(id, updates),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ['disbursementPlans', variables.projectId] });
        },
    });
};

export const useDeleteDisbursementPlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
            CapitalService.deleteDisbursementPlan(id),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ['disbursementPlans', variables.projectId] });
        },
    });
};
