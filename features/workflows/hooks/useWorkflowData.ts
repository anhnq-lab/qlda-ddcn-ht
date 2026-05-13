// ─── useWorkflowData.ts ────────────────────────────────────────
// Shared fetch hook cho Workflow + Nodes + Edges.
// Tránh duplicate fetch logic giữa WorkflowManagerPage, BuilderPanel,
// ProcessTable, InternalWorkflowViewerPanel.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Workflow, WorkflowNode, WorkflowEdge } from '../../../types/workflow.types';

interface UseWorkflowDataOptions {
    /** Nếu true: chỉ fetch nodes chưa bị xóa (is_deleted = false hoặc null) */
    excludeDeleted?: boolean;
}

interface UseWorkflowDataReturn {
    workflow: Workflow | null;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    isLoading: boolean;
    error: string | null;
    /** Gọi để refresh lại toàn bộ dữ liệu */
    refetch: () => void;
    /** Cập nhật nodes locally (sau khi user thay đổi — tránh roundtrip) */
    setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
}

/**
 * Fetch workflow + nodes (sorted by sort_order) + edges.
 * 
 * @example
 * const { workflow, nodes, isLoading, refetch } = useWorkflowData(workflowId);
 */
export function useWorkflowData(
    workflowId: string | null | undefined,
    options: UseWorkflowDataOptions = {}
): UseWorkflowDataReturn {
    const { excludeDeleted = true } = options;

    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [edges, setEdges] = useState<WorkflowEdge[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const refetch = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        if (!workflowId) {
            setWorkflow(null);
            setNodes([]);
            setEdges([]);
            return;
        }

        let cancelled = false;

        const fetchAll = async () => {
            setIsLoading(true);
            setError(null);

            try {
                let nodesQuery = supabase
                    .from('workflow_nodes')
                    .select('*')
                    .eq('workflow_id', workflowId)
                    .order('sort_order', { ascending: true })
                    .order('created_at', { ascending: true }); // tiebreaker

                if (excludeDeleted) {
                    nodesQuery = nodesQuery.or('is_deleted.eq.false,is_deleted.is.null');
                }

                const [wfRes, nodesRes, edgesRes] = await Promise.all([
                    supabase.from('workflows').select('*').eq('id', workflowId).single(),
                    nodesQuery,
                    supabase.from('workflow_edges').select('*').eq('workflow_id', workflowId),
                ]);

                if (cancelled) return;

                if (wfRes.error) throw wfRes.error;
                if (nodesRes.error) throw nodesRes.error;
                if (edgesRes.error) throw edgesRes.error;

                setWorkflow(wfRes.data as Workflow);
                setNodes((nodesRes.data as WorkflowNode[]) || []);
                setEdges((edgesRes.data as WorkflowEdge[]) || []);
            } catch (err: any) {
                if (!cancelled) {
                    setError(err.message || 'Không thể tải dữ liệu quy trình');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchAll();
        return () => { cancelled = true; };
    }, [workflowId, excludeDeleted, tick]);

    return { workflow, nodes, edges, isLoading, error, refetch, setNodes };
}
