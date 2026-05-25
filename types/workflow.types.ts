// Workflow types — Template only (no runtime instances/tasks)
export type WorkflowCategory = 'project' | 'implementation' | 'investment' | 'procurement' | 'document' | 'finance' | 'hr' | 'asset' | 'other';
export type WorkflowNodeType = 'start' | 'end' | 'approval' | 'input' | 'automated';
export type PhaseType = 'preparation' | 'execution' | 'completion';
export type SlaUnit = 'd' | 'wd' | 'h';

// ─── SubTask (công việc con trong mỗi bước quy trình) ────────
export interface SubTask {
    id: string;
    name: string;
    assignee_role: string;
    output: string;
    template_forms: string;
    legal_basis: string;
    template_url?: string;
    sla?: string;
    sla_unit?: SlaUnit;
}

// ─── Metadata Schema cho WorkflowNode ─────────────────────────
export interface WorkflowNodeMetadata {
    // Common
    phase?: PhaseType;
    sub_process?: string;
    description?: string;
    sub_tasks?: SubTask[];
    // Legacy fields (backwards-compat, synced from primary sub_task)
    legal_basis?: string;
    output?: string;
    template_forms?: string | string[];
    // Internal workflows (Ban DDCN) extra fields
    coordinating_role?: string;
    sla_regulated?: string;
    notes?: string;
    // Extensible
    [key: string]: unknown;
}

export interface Workflow {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: WorkflowCategory;
    version: number;
    is_active: boolean;
    metadata: Record<string, unknown>;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface WorkflowNode {
    id: string;
    workflow_id: string;
    name: string;
    type: WorkflowNodeType;
    assignee_role: string | null;
    sla_formula: string | null;
    form_config: Record<string, unknown>;
    metadata: WorkflowNodeMetadata;
    sort_order: number;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    legal_basis?: string | null;
    output_document?: string | null;
}

export interface WorkflowEdge {
    id: string;
    workflow_id: string;
    source_node: string;
    target_node: string;
    condition_expr: string | null;
    created_at: string;
}
