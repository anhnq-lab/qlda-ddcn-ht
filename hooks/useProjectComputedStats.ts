import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProjectComputedStats } from '@/types';

async function fetchComputedStats(projectId: string): Promise<ProjectComputedStats> {
    const { data, error } = await (supabase as any).rpc('get_project_computed_stats', {
        p_project_id: projectId,
    });
    if (error) throw error;
    if (!data) throw new Error('No data returned from get_project_computed_stats');
    return {
        ProjectID: data.project_id,
        KHVTotal: Number(data.khv_total) || 0,
        TotalDisbursed: Number(data.total_disbursed) || 0,
        DisbursementRate: Number(data.disbursement_rate) || 0,
        PhysicalProgress: Number(data.physical_progress) || 0,
        PaymentProgress: Number(data.payment_progress) || 0,
    };
}

export function useProjectComputedStats(projectId: string | undefined) {
    return useQuery({
        queryKey: ['project-computed-stats', projectId],
        queryFn: () => fetchComputedStats(projectId!),
        enabled: !!projectId,
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}
