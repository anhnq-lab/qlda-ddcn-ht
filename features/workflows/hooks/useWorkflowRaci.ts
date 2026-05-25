// ═══════════════════════════════════════════════════════════════
// useWorkflowRaci — Hook fetch RACI data cho workflow
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkflowRaciService, type WorkflowNodeRaci, type NodeRaciSummary } from '../services/WorkflowRaciService';
import { StakeholderService, type StakeholderType } from '../services/StakeholderService';

const RACI_KEY = 'workflow-raci';
const STAKEHOLDER_KEY = 'stakeholder-types';

/** Hook: fetch RACI data cho 1 workflow + stakeholder types */
export function useWorkflowRaci(workflowId: string | null) {
    const queryClient = useQueryClient();

    // Fetch stakeholder types (cached globally)
    const { data: stakeholders = [] } = useQuery<StakeholderType[]>({
        queryKey: [STAKEHOLDER_KEY],
        queryFn: () => StakeholderService.getAll(),
        staleTime: 30 * 60 * 1000, // 30 min
    });

    // Fetch RACI entries for this workflow
    const { data: raciEntries = [], isLoading } = useQuery<WorkflowNodeRaci[]>({
        queryKey: [RACI_KEY, workflowId],
        queryFn: () => WorkflowRaciService.getByWorkflow(workflowId!),
        enabled: !!workflowId,
        staleTime: 5 * 60 * 1000,
    });

    // Build RACI map: nodeId → { R: [...], A: [...], C: [...], I: [...] }
    const raciMap = WorkflowRaciService.buildRaciMap(raciEntries);

    // Stakeholder lookup: code → name
    const stakeholderMap = new Map<string, StakeholderType>();
    stakeholders.forEach(s => stakeholderMap.set(s.code, s));

    // Mutation: set RACI cho 1 node
    const setNodeRaci = useMutation({
        mutationFn: async ({ nodeId, assignments }: {
            nodeId: string;
            assignments: Array<{ stakeholder_code: string; raci_type: 'R' | 'A' | 'C' | 'I'; note?: string }>;
        }) => {
            await WorkflowRaciService.setNodeRaci(nodeId, assignments);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [RACI_KEY, workflowId] });
        },
    });

    // Mutation: thêm 1 RACI entry
    const addRaci = useMutation({
        mutationFn: async ({ nodeId, stakeholderCode, raciType }: {
            nodeId: string;
            stakeholderCode: string;
            raciType: 'R' | 'A' | 'C' | 'I';
        }) => {
            await WorkflowRaciService.addRaci(nodeId, stakeholderCode, raciType);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [RACI_KEY, workflowId] });
        },
    });

    // Mutation: xóa 1 RACI entry
    const removeRaci = useMutation({
        mutationFn: async ({ nodeId, stakeholderCode, raciType }: {
            nodeId: string;
            stakeholderCode: string;
            raciType: string;
        }) => {
            await WorkflowRaciService.removeRaci(nodeId, stakeholderCode, raciType);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [RACI_KEY, workflowId] });
        },
    });

    /** Helper: lấy RACI summary cho 1 node */
    const getNodeRaci = (nodeId: string): NodeRaciSummary | undefined => {
        return raciMap.get(nodeId);
    };

    /** Helper: lấy tên stakeholder */
    const getStakeholderName = (code: string): string => {
        return stakeholderMap.get(code)?.name || code;
    };

    /** Helper: format RACI display cho 1 node (compact) */
    const formatNodeRaciCompact = (nodeId: string): string => {
        const summary = raciMap.get(nodeId);
        if (!summary) return '';
        const parts: string[] = [];
        if (summary.R.length > 0) parts.push(`R: ${summary.R.join(', ')}`);
        if (summary.A.length > 0) parts.push(`A: ${summary.A.join(', ')}`);
        if (summary.C.length > 0) parts.push(`C: ${summary.C.join(', ')}`);
        if (summary.I.length > 0) parts.push(`I: ${summary.I.join(', ')}`);
        return parts.join(' | ');
    };

    return {
        stakeholders,
        stakeholderMap,
        raciEntries,
        raciMap,
        isLoading,
        getNodeRaci,
        getStakeholderName,
        formatNodeRaciCompact,
        setNodeRaci,
        addRaci,
        removeRaci,
    };
}
