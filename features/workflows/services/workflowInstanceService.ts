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

// ─── Map bước → state_code RIÊNG theo từng loại quy trình ───────
const STEP_TO_STATE_TK1B: Record<number, string> = {
    0: '01',  // Kích hoạt quy trình
    1: '02',  // Rà soát điều kiện đầu vào tổng thể
    2: '03',  // Giao nhiệm vụ tư vấn
    3: '04',  // Tư vấn: Khảo sát + Lập BCKTKT
    4: '06',  // Tiếp nhận & Kiểm tra toàn diện
    5: '07',  // Yêu cầu chỉnh sửa & Tiếp thu
    6: '08',  // Thẩm tra thiết kế/dự toán
    7: '08',  // Lập tờ trình thẩm định BCKTKT
    8: '09',  // Tiếp thu kết quả thẩm định
    9: '10',  // Lập tờ trình + Dự thảo QĐ phê duyệt
    10: '11', // Ban hành QĐ phê duyệt & Bàn giao
    11: '12', // Cập nhật phần mềm & Lưu trữ
};

const STEP_TO_STATE_TK2B: Record<number, string> = {
    0: '01',  // Kích hoạt QT-TK2B
    1: '02',  // Rà soát điều kiện đầu vào
    2: '03',  // Giao nhiệm vụ tư vấn
    3: '04',  // Tư vấn lập TKBVTC & Dự toán
    4: '06',  // Tiếp nhận & Kiểm tra toàn diện
    5: '07',  // Yêu cầu chỉnh sửa & Tiếp thu
    6: '08',  // Thẩm tra TK/DT
    7: '08',  // Thẩm định/Kiểm soát nội bộ CĐT
    8: '10',  // Trình & Ban hành QĐ phê duyệt
    9: '12',  // Bàn giao hồ sơ & Lưu trữ
};

const STEP_TO_STATE_TK3B: Record<number, string> = {
    // Giai đoạn 1: TKKT & Dự toán
    0: '01',  // Kích hoạt QT-TK3B
    1: '02',  // Rà soát điều kiện lập TKKT
    2: '03',  // Giao nhiệm vụ TV lập TKKT
    3: '04',  // TV lập TKKT & DT theo TKKT
    4: '06',  // Tiếp nhận & Kiểm tra toàn diện TKKT&DT
    5: '07',  // Yêu cầu chỉnh sửa & Tiếp thu
    6: '08',  // Thẩm tra TKKT&DT
    7: '08',  // Thẩm định nội bộ CĐT
    8: '11',  // Phê duyệt TKKT&DT
    // Giai đoạn 2: TKBVTC
    9: '03',  // Giao nhiệm vụ lập TKBVTC
    10: '04', // TV lập TKBVTC
    11: '12', // Kiểm tra + Phê duyệt + Bàn giao
};

const STEP_TO_STATE_MAPS: Record<string, Record<number, string>> = {
    'QT-TK1B': STEP_TO_STATE_TK1B,
    'QT-TK2B': STEP_TO_STATE_TK2B,
    'QT-TK3B': STEP_TO_STATE_TK3B,
};

export function getStateCodeForStep(stepIndex: number, workflowCode?: string): string {
    const map = (workflowCode && STEP_TO_STATE_MAPS[workflowCode]) || STEP_TO_STATE_TK1B;
    return map[stepIndex] ?? '01';
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
            total_steps: params.totalSteps ?? 12,
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
export async function advanceStep(instanceId: string, nextStepIndex: number, workflowCode?: string): Promise<WorkflowInstance> {
    const newStateCode = getStateCodeForStep(nextStepIndex, workflowCode);

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
        .update({ status: 'completed', state_code: '13' })
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
