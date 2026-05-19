import { supabase } from '../../../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────
export interface WorkflowInstance {
    id: string;
    project_id: string;
    workflow_code: string;
    workflow_id: string | null;
    current_step_index: number;
    total_steps: number;
    status: 'active' | 'completed' | 'cancelled';
    state_code: string;
    initiated_by: string | null;
    officer_name: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface WorkflowStepRecord {
    id: string;
    instance_id: string;
    step_index: number;
    node_id: string | null;
    form_code: string | null;
    form_data: Record<string, any>;
    conclusion: 'pass' | 'fail' | 'na' | null;
    is_completed: boolean;
    completed_by: string | null;
    completed_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface WorkflowInstanceWithSteps extends WorkflowInstance {
    step_records: WorkflowStepRecord[];
}

// ─── Map bước → state_code theo QT-TK1B ─────────────────────────────
const STEP_TO_STATE_MAP: Record<number, string> = {
    0: '01', // Khởi tạo
    1: '02', // Rà soát điều kiện
    2: '02',
    3: '03', // Giao tư vấn
    4: '04', // Tư vấn đang thực hiện
    5: '04',
    6: '05', // Tiếp nhận hồ sơ
    7: '06', // QLDA kiểm tra
    8: '06',
    9: '06',
    10: '07', // Yêu cầu chỉnh sửa
    11: '07',
    12: '08', // Thẩm tra/thẩm định
    13: '09', // Hoàn thiện sau thẩm định
    14: '10', // Trình phê duyệt
    15: '10',
    16: '11', // Đã phê duyệt
};

export function getStateCodeForStep(stepIndex: number): string {
    return STEP_TO_STATE_MAP[stepIndex] ?? '01';
}

// ─── CRUD ────────────────────────────────────────────────────────────

/**
 * Tạo phiên quy trình mới cho dự án
 */
export async function createWorkflowInstance(params: {
    projectId: string;
    workflowCode: string;
    workflowId?: string | null;
    officerName?: string;
    totalSteps?: number;
}): Promise<WorkflowInstance> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await (supabase as any)
        .from('cde_workflow_instances')
        .insert({
            project_id: params.projectId,
            workflow_code: params.workflowCode,
            workflow_id: params.workflowId ?? null,
            current_step_index: 0,
            total_steps: params.totalSteps ?? 17,
            status: 'active',
            state_code: '01',
            initiated_by: user?.id ?? null,
            officer_name: params.officerName ?? null,
        })
        .select()
        .single();

    if (error) throw error;
    return data as WorkflowInstance;
}

/**
 * Lấy tất cả phiên đang chạy của một dự án
 */
export async function getInstancesByProject(projectId: string): Promise<WorkflowInstance[]> {
    const { data, error } = await (supabase as any)
        .from('cde_workflow_instances')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as WorkflowInstance[];
}

/**
 * Lấy chi tiết phiên + tất cả step records
 */
export async function getInstanceWithSteps(instanceId: string): Promise<WorkflowInstanceWithSteps> {
    const [instanceRes, stepsRes] = await Promise.all([
        (supabase as any).from('cde_workflow_instances').select('*').eq('id', instanceId).single(),
        (supabase as any)
            .from('cde_workflow_step_records')
            .select('*')
            .eq('instance_id', instanceId)
            .order('step_index', { ascending: true }),
    ]);

    if (instanceRes.error) throw instanceRes.error;
    return {
        ...(instanceRes.data as WorkflowInstance),
        step_records: (stepsRes.data ?? []) as WorkflowStepRecord[],
    };
}

/**
 * Lưu (upsert) kết quả bước — dùng khi người dùng "Lưu nháp" hoặc "Hoàn thành bước"
 */
export async function saveStepRecord(params: {
    instanceId: string;
    stepIndex: number;
    nodeId?: string | null;
    formCode?: string | null;
    formData?: Record<string, any>;
    conclusion?: 'pass' | 'fail' | 'na' | null;
    isCompleted?: boolean;
    notes?: string;
}): Promise<WorkflowStepRecord> {
    const { data: { user } } = await supabase.auth.getUser();

    const payload: any = {
        instance_id: params.instanceId,
        step_index: params.stepIndex,
        node_id: params.nodeId ?? null,
        form_code: params.formCode ?? null,
        form_data: params.formData ?? {},
        conclusion: params.conclusion ?? null,
        is_completed: params.isCompleted ?? false,
        notes: params.notes ?? null,
    };

    if (params.isCompleted) {
        payload.completed_by = user?.id ?? null;
        payload.completed_at = new Date().toISOString();
    }

    const { data, error } = await (supabase as any)
        .from('cde_workflow_step_records')
        .upsert(payload, { onConflict: 'instance_id,step_index' })
        .select()
        .single();

    if (error) throw error;
    return data as WorkflowStepRecord;
}

/**
 * Chuyển bước tiếp theo — cập nhật current_step_index và state_code
 */
export async function advanceStep(instanceId: string, nextStepIndex: number): Promise<WorkflowInstance> {
    const newStateCode = getStateCodeForStep(nextStepIndex);

    const { data, error } = await (supabase as any)
        .from('cde_workflow_instances')
        .update({
            current_step_index: nextStepIndex,
            state_code: newStateCode,
        })
        .eq('id', instanceId)
        .select()
        .single();

    if (error) throw error;
    return data as WorkflowInstance;
}

/**
 * Đánh dấu hoàn thành phiên quy trình
 */
export async function completeInstance(instanceId: string): Promise<WorkflowInstance> {
    const { data, error } = await (supabase as any)
        .from('cde_workflow_instances')
        .update({ status: 'completed', state_code: '11' })
        .eq('id', instanceId)
        .select()
        .single();

    if (error) throw error;
    return data as WorkflowInstance;
}

/**
 * Hủy phiên quy trình
 */
export async function cancelInstance(instanceId: string): Promise<void> {
    const { error } = await (supabase as any)
        .from('cde_workflow_instances')
        .update({ status: 'cancelled' })
        .eq('id', instanceId);

    if (error) throw error;
}
