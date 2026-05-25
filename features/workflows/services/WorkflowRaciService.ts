// ═══════════════════════════════════════════════════════════════
// WorkflowRaciService — CRUD cho bảng workflow_node_raci
// ═══════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase';

export interface WorkflowNodeRaci {
    id: string;
    workflow_node_id: string;
    stakeholder_code: string;
    raci_type: 'R' | 'A' | 'C' | 'I';
    note: string | null;
    created_at: string;
}

/** RACI grouped by node — for display */
export interface NodeRaciSummary {
    workflow_node_id: string;
    R: string[];  // stakeholder codes
    A: string[];
    C: string[];
    I: string[];
}

export const WorkflowRaciService = {

    /** Lấy tất cả RACI entries cho 1 workflow (qua nodes) */
    async getByWorkflow(workflowId: string): Promise<WorkflowNodeRaci[]> {
        // 1. Fetch node ids trước (lọc các node chưa bị xóa)
        const { data: nodes, error: nodesErr } = await (supabase as any)
            .from('workflow_nodes')
            .select('id')
            .eq('workflow_id', workflowId)
            .or('is_deleted.eq.false,is_deleted.is.null');

        if (nodesErr) throw nodesErr;
        if (!nodes || nodes.length === 0) return [];

        const nodeIds = nodes.map((n: any) => n.id);

        // 2. Fetch RACI entries cho các nodeIds đó
        const { data, error } = await (supabase as any)
            .from('workflow_node_raci')
            .select('*')
            .in('workflow_node_id', nodeIds);

        if (error) throw error;
        return (data || []) as WorkflowNodeRaci[];
    },

    /** Lấy RACI cho 1 node cụ thể */
    async getByNode(nodeId: string): Promise<WorkflowNodeRaci[]> {
        const { data, error } = await (supabase as any)
            .from('workflow_node_raci')
            .select('*')
            .eq('workflow_node_id', nodeId)
            .order('raci_type', { ascending: true });

        if (error) throw error;
        return (data || []) as WorkflowNodeRaci[];
    },

    /** Set RACI cho 1 node — upsert (thêm nếu chưa có, xóa nếu bỏ chọn) */
    async setNodeRaci(
        nodeId: string,
        assignments: Array<{ stakeholder_code: string; raci_type: 'R' | 'A' | 'C' | 'I'; note?: string }>
    ): Promise<void> {
        // 1. Xóa tất cả RACI hiện tại của node
        await (supabase as any)
            .from('workflow_node_raci')
            .delete()
            .eq('workflow_node_id', nodeId);

        if (assignments.length === 0) return;

        // 2. Insert mới
        const rows = assignments.map(a => ({
            workflow_node_id: nodeId,
            stakeholder_code: a.stakeholder_code,
            raci_type: a.raci_type,
            note: a.note || null,
        }));

        const { error } = await (supabase as any)
            .from('workflow_node_raci')
            .insert(rows);

        if (error) throw error;
    },

    /** Thêm 1 RACI entry */
    async addRaci(nodeId: string, stakeholderCode: string, raciType: 'R' | 'A' | 'C' | 'I', note?: string): Promise<WorkflowNodeRaci> {
        const { data, error } = await (supabase as any)
            .from('workflow_node_raci')
            .upsert({
                workflow_node_id: nodeId,
                stakeholder_code: stakeholderCode,
                raci_type: raciType,
                note: note || null,
            }, { onConflict: 'workflow_node_id,stakeholder_code,raci_type' })
            .select()
            .single();

        if (error) throw error;
        return data as WorkflowNodeRaci;
    },

    /** Xóa 1 RACI entry */
    async removeRaci(nodeId: string, stakeholderCode: string, raciType: string): Promise<void> {
        const { error } = await (supabase as any)
            .from('workflow_node_raci')
            .delete()
            .eq('workflow_node_id', nodeId)
            .eq('stakeholder_code', stakeholderCode)
            .eq('raci_type', raciType);

        if (error) throw error;
    },

    /** Build summary map: nodeId → { R: [...], A: [...], C: [...], I: [...] } */
    buildRaciMap(entries: WorkflowNodeRaci[]): Map<string, NodeRaciSummary> {
        const map = new Map<string, NodeRaciSummary>();

        for (const entry of entries) {
            if (!map.has(entry.workflow_node_id)) {
                map.set(entry.workflow_node_id, {
                    workflow_node_id: entry.workflow_node_id,
                    R: [], A: [], C: [], I: [],
                });
            }
            const summary = map.get(entry.workflow_node_id)!;
            summary[entry.raci_type].push(entry.stakeholder_code);
        }

        return map;
    },
};
