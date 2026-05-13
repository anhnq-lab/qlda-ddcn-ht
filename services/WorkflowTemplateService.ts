// WorkflowTemplateService — CRUD quy trình mẫu (chỉ template, không runtime)
import { supabase } from '../lib/supabase';
import type { Workflow, WorkflowNode, WorkflowEdge } from '../types/workflow.types';

export const WorkflowTemplateService = {
  // ─── READ ──────────────────────────────────────────────────

  /** Lấy danh sách tất cả quy trình mẫu */
  getTemplates: async (category?: string): Promise<Workflow[]> => {
    let query = supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category as any);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as Workflow[];
  },

  /** Lấy chi tiết 1 template bao gồm nodes + edges */
  getTemplateDetail: async (workflowId: string) => {
    const [wfRes, nodesRes, edgesRes] = await Promise.all([
      supabase.from('workflows').select('*').eq('id', workflowId).single(),
      supabase.from('workflow_nodes').select('*')
        .eq('workflow_id', workflowId)
        .eq('is_deleted', false)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase.from('workflow_edges').select('*').eq('workflow_id', workflowId),
    ]);

    if (wfRes.error) throw wfRes.error;

    return {
      workflow: wfRes.data as unknown as Workflow,
      nodes: (nodesRes.data || []) as unknown as WorkflowNode[],
      edges: (edgesRes.data || []) as unknown as WorkflowEdge[],
    };
  },

  /** Lấy template theo code (e.g., 'QT-TK1B') */
  getTemplateByCode: async (code: string): Promise<Workflow | null> => {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data ? data as unknown as Workflow : null;
  },

  /** Lấy nodes của một template */
  getTemplateNodes: async (workflowId: string): Promise<WorkflowNode[]> => {
    const { data, error } = await supabase
      .from('workflow_nodes')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }); // tiebreaker

    if (error) throw error;
    return (data || []) as unknown as WorkflowNode[];
  },

  // ─── WRITE ─────────────────────────────────────────────────

  /** Tạo hoặc cập nhật template */
  saveTemplate: async (workflow: Partial<Workflow> & { id?: string }): Promise<Workflow> => {
    if (workflow.id) {
      const { data, error } = await supabase
        .from('workflows')
        .update(workflow as any)
        .eq('id', workflow.id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Workflow;
    } else {
      const { data, error } = await supabase
        .from('workflows')
        .insert(workflow as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Workflow;
    }
  },

  /** Xóa template */
  deleteTemplate: async (workflowId: string): Promise<void> => {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId);
    if (error) throw error;
  },

  /** Seed/Upsert workflow template + nodes + edges */
  seedTemplate: async (
    workflow: any,
    nodes: any[],
    edges: any[]
  ): Promise<string> => {
    // 1. Upsert workflow
    const { data: wf, error: wfErr } = await supabase
      .from('workflows')
      .upsert(workflow, { onConflict: 'code' })
      .select('id')
      .single();
    if (wfErr) throw wfErr;
    const workflowId = wf.id;

    // 2. Delete old nodes & edges
    await supabase.from('workflow_edges').delete().eq('workflow_id', workflowId);
    await supabase.from('workflow_nodes').delete().eq('workflow_id', workflowId);

    // 3. Insert nodes
    if (nodes.length > 0) {
      const nodeRows = nodes.map((n, idx) => ({
        ...n,
        workflow_id: workflowId,
        sort_order: n.sort_order ?? idx,
      }));
      const { error: nodeErr } = await supabase.from('workflow_nodes').insert(nodeRows);
      if (nodeErr) throw nodeErr;
    }

    // 4. Insert edges
    if (edges.length > 0) {
      // Re-fetch nodes for edge reference
      const { data: savedNodes } = await supabase
        .from('workflow_nodes')
        .select('id, name')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: true });

      const edgeRows = edges.map(e => ({
        ...e,
        workflow_id: workflowId,
      }));
      const { error: edgeErr } = await supabase.from('workflow_edges').insert(edgeRows);
      if (edgeErr) console.warn('Edge insert warning:', edgeErr);
    }

    return workflowId;
  },
};
