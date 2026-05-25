// ═══════════════════════════════════════════════════════════════
// ProjectStepsService — Facade cho bảng project_plan_steps
// ═══════════════════════════════════════════════════════════════
//
// Sau refactor tách bảng (25/05/2026):
//   - project_plan_steps = bảng KH dự án (bước, step)
//   - monthly_plan_items = bảng KH tháng (nhiệm vụ tháng)
//   - project_plan_raci = ma trận RACI của kế hoạch dự án
//
// Luồng:
//   1. User lập KH dự án → tạo rows trong project_plan_steps
//   2. "Đưa vào KH tháng" → INSERT vào monthly_plan_items với
//      source_project_plan_item_id = step.id
//   3. Công việc tạo thủ công từ bước → tasks.project_plan_step_id = step.id
//
// API public:
//   - getByProject(projectId)        → tất cả steps + RACI + trạng thái lên KH tháng
//   - getStepWithTasks(stepId)        → step + tasks con + RACI
//   - createFromCustomPlan(...)       → tạo loạt steps + copy RACI từ template
//   - createStep / updateStep / deleteStep — CRUD đơn lẻ
//   - scheduleToMonth(stepIds, ...)   → đưa steps vào KH tháng (INSERT monthly_plan_items)
//   - unscheduleFromMonth(stepIds)    → gỡ steps khỏi KH tháng (DELETE monthly_plan_items)
//   - getRaciForStep / setRaciForStep → CRUD RACI cho từng bước
// ═══════════════════════════════════════════════════════════════

import { supabase as _supabase } from '../lib/supabase';
import { toServiceError } from './ServiceError';
import type { DbTask } from './task/helpers';
import { generateUUID } from './task/helpers';

const supabase = _supabase as any;

// ─── Types ─────────────────────────────────────────────────────

export interface ProjectStepRaci {
    id: string;
    step_id: string;
    stakeholder_code: string;
    raci_type: 'R' | 'A' | 'C' | 'I';
    stakeholder_name: string | null;
    assigned_employee_id: string | null;
    assigned_department_id: string | null;
    note: string | null;
}

export interface ProjectStep {
    id: string;
    project_id: string;

    // Nguồn gốc workflow (optional — trace từ quy trình mẫu)
    workflow_node_id: string | null;
    workflow_id: string | null;

    // Phân loại & thứ tự
    step_code: string | null;
    step_order: number;
    phase: string | null;   // preparation | execution | completion

    // Nội dung
    task_name: string;      // Map từ cột step_name trong DB
    deliverable: string | null;
    assignee_role: string | null;
    legal_basis: string | null;
    output_document: string | null;
    collaborating_dept_codes: string[] | null;
    collaborating_text: string | null;

    // Tiến độ
    start_date: string | null;
    due_date: string | null;
    duration_days: number | null;

    // Trạng thái thực hiện bước
    status: 'planned' | 'in_progress' | 'completed' | 'incomplete' | 'deferred';
    completion_result: string | null;
    incomplete_reason: string | null;
    notes: string | null;

    sort_order: number;
    created_at: string;
    updated_at: string;

    // Computed từ join với monthly_plan_items
    is_scheduled: boolean;
    scheduled_monthly_plan_id: string | null;

    // RACI assignments
    raci?: ProjectStepRaci[];
}

export interface ProjectStepWithTasks extends ProjectStep {
    tasks: DbTask[];
}

export interface CreateStepInput {
    project_id: string;
    workflow_node_id?: string | null;
    workflow_id?: string | null;
    step_code?: string | null;
    step_order?: number;
    phase?: string | null;
    task_name: string;
    deliverable?: string | null;
    assignee_role?: string | null;
    legal_basis?: string | null;
    output_document?: string | null;
    start_date?: string | null;
    due_date?: string | null;
    duration_days?: number | null;
}

export interface CustomPlanStep {
    workflow_node_id: string | null;
    title: string;
    phase: string;
    assignee_role: string;
    start_date: string;
    due_date: string;
    duration_days: number;
    legal_basis?: string;
    output_document?: string;
    sub_tasks?: Array<{
        name?: string;
        title?: string;
        assignee_role?: string;
        actor?: string;
        legal_basis?: string;
        output?: string;
        duration_days?: number;
    }>;
    metadata?: Record<string, any>;
    raci?: Array<{
        stakeholder_code: string;
        raci_type: 'R' | 'A' | 'C' | 'I';
        stakeholder_name?: string | null;
        note?: string | null;
    }>;
}

// ─── Service ───────────────────────────────────────────────────

export const ProjectStepsService = {

    /**
     * Lấy tất cả steps của 1 dự án, kèm ma trận RACI và trạng thái đã lên KH tháng chưa.
     */
    async getByProject(projectId: string): Promise<ProjectStep[]> {
        const { data: steps, error } = await supabase
            .from('project_plan_steps')
            .select('*')
            .eq('project_id', projectId)
            .order('step_order', { ascending: true })
            .order('start_date', { ascending: true, nullsFirst: false });

        if (error) throw toServiceError(error, 'Không thể tải bước dự án');
        if (!steps || steps.length === 0) return [];

        const stepIds = steps.map((s: any) => s.id);

        // Fetch RACI cho các steps này
        const { data: raciData } = await supabase
            .from('project_plan_raci')
            .select('*')
            .in('step_id', stepIds);

        // Lấy danh sách step IDs đã lên KH tháng
        const { data: scheduled } = await supabase
            .from('monthly_plan_items')
            .select('source_project_plan_item_id, monthly_plan_id')
            .in('source_project_plan_item_id', stepIds);

        const scheduledMap = new Map<string, string>();
        for (const row of (scheduled || [])) {
            if (row.source_project_plan_item_id) {
                scheduledMap.set(row.source_project_plan_item_id, row.monthly_plan_id);
            }
        }

        const raciMap = new Map<string, ProjectStepRaci[]>();
        for (const r of (raciData || [])) {
            if (!raciMap.has(r.step_id)) {
                raciMap.set(r.step_id, []);
            }
            raciMap.get(r.step_id)!.push(r);
        }

        return steps.map((s: any): ProjectStep => ({
            ...s,
            task_name: s.step_name, // Map step_name DB -> task_name frontend
            is_scheduled: scheduledMap.has(s.id),
            scheduled_monthly_plan_id: scheduledMap.get(s.id) ?? null,
            raci: raciMap.get(s.id) || [],
        }));
    },

    /** Lấy 1 step kèm tasks con và RACI */
    async getStepWithTasks(stepId: string): Promise<ProjectStepWithTasks | null> {
        const { data: step, error } = await supabase
            .from('project_plan_steps')
            .select('*')
            .eq('id', stepId)
            .maybeSingle();
        if (error) throw toServiceError(error, 'Không thể tải bước');
        if (!step) return null;

        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_plan_step_id', stepId)
            .order('sort_order', { ascending: true });

        const { data: raciData } = await supabase
            .from('project_plan_raci')
            .select('*')
            .eq('step_id', stepId);

        // Tính is_scheduled
        const { data: mpi } = await supabase
            .from('monthly_plan_items')
            .select('source_project_plan_item_id, monthly_plan_id')
            .eq('source_project_plan_item_id', stepId)
            .maybeSingle();

        return {
            ...step,
            task_name: step.step_name,
            is_scheduled: !!mpi,
            scheduled_monthly_plan_id: mpi?.monthly_plan_id ?? null,
            tasks: (tasks || []) as DbTask[],
            raci: raciData || [],
        };
    },

    /** Tạo 1 step thủ công */
    async createStep(input: CreateStepInput): Promise<ProjectStep> {
        const stepId = generateUUID();
        const payload = {
            id: stepId,
            project_id: input.project_id,
            workflow_node_id: input.workflow_node_id ?? null,
            workflow_id: input.workflow_id ?? null,
            step_code: input.step_code ?? null,
            step_order: input.step_order ?? 0,
            phase: input.phase ?? 'preparation',
            step_name: input.task_name,
            legal_basis: input.legal_basis ?? null,
            output_document: input.output_document ?? null,
            start_date: input.start_date ?? null,
            due_date: input.due_date ?? null,
            duration_days: input.duration_days ?? null,
            status: 'planned',
            sort_order: input.step_order ?? 0,
        };

        const { data, error } = await supabase
            .from('project_plan_steps')
            .insert(payload)
            .select()
            .single();
        if (error) throw toServiceError(error, 'Không thể tạo bước');

        return {
            ...data,
            task_name: data.step_name,
            is_scheduled: false,
            scheduled_monthly_plan_id: null,
            raci: [],
        } as ProjectStep;
    },

    /** Cập nhật step */
    async updateStep(id: string, input: Partial<CreateStepInput> & { step_name?: string }): Promise<ProjectStep> {
        const dbPayload: any = { ...input, updated_at: new Date().toISOString() };
        if (input.task_name !== undefined) {
            dbPayload.step_name = input.task_name;
            delete dbPayload.task_name;
        }

        const { data, error } = await supabase
            .from('project_plan_steps')
            .update(dbPayload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw toServiceError(error, 'Không thể cập nhật bước');

        // Lấy is_scheduled
        const { data: mpi } = await supabase
            .from('monthly_plan_items')
            .select('source_project_plan_item_id, monthly_plan_id')
            .eq('source_project_plan_item_id', id)
            .maybeSingle();

        const { data: raciData } = await supabase
            .from('project_plan_raci')
            .select('*')
            .eq('step_id', id);

        return {
            ...data,
            task_name: data.step_name,
            is_scheduled: !!mpi,
            scheduled_monthly_plan_id: mpi?.monthly_plan_id ?? null,
            raci: raciData || [],
        } as ProjectStep;
    },

    /**
     * Xóa 1 step.
     */
    async deleteStep(id: string): Promise<void> {
        const { error } = await supabase
            .from('project_plan_steps')
            .delete()
            .eq('id', id);
        if (error) throw toServiceError(error, 'Không thể xóa bước');
    },

    /**
     * Xóa toàn bộ steps của 1 dự án khi reset KH tổng thể.
     */
    async deleteAllByProject(projectId: string): Promise<void> {
        const { error } = await supabase
            .from('project_plan_steps')
            .delete()
            .eq('project_id', projectId);
        if (error) throw toServiceError(error, 'Không thể xóa kế hoạch dự án');

        // Xóa workflow_instances liên kết
        await supabase
            .from('workflow_instances')
            .delete()
            .eq('reference_id', projectId)
            .eq('reference_type', 'project');
    },

    /**
     * Tạo loạt steps từ Custom Plan (gọi từ CreateMasterPlanPanel).
     * Tự động copy RACI template từ workflow_node_raci sang project_plan_raci.
     */
    async createFromCustomPlan(
        projectId: string,
        workflowId: string | null,
        steps: CustomPlanStep[]
    ): Promise<{ steps: ProjectStep[] }> {
        if (!projectId) throw new Error('projectId required');

        // 1. Xóa kế hoạch cũ
        await this.deleteAllByProject(projectId);

        const stepsToInsert: any[] = [];
        const customRaciToInsert: any[] = [];
        const stepsWithNoCustomRaciIds: Array<{ dbStepId: string; workflowNodeId: string }> = [];
        let stepOrder = 0;

        for (const step of steps) {
            const stepId = generateUUID();
            const phase = step.phase || 'preparation';

            stepsToInsert.push({
                id: stepId,
                project_id: projectId,
                workflow_node_id: step.workflow_node_id,
                workflow_id: workflowId,
                step_code: step.workflow_node_id || generateUUID(),
                step_order: stepOrder++,
                step_name: step.title,
                phase,
                start_date: step.start_date,
                due_date: step.due_date,
                duration_days: step.duration_days,
                legal_basis: step.legal_basis || null,
                output_document: step.output_document || null,
                status: 'planned',
                sort_order: stepOrder,
            });

            if (step.raci && step.raci.length > 0) {
                for (const r of step.raci) {
                    customRaciToInsert.push({
                        id: generateUUID(),
                        step_id: stepId,
                        stakeholder_code: r.stakeholder_code,
                        raci_type: r.raci_type,
                        stakeholder_name: r.stakeholder_name || null,
                        note: r.note || null,
                    });
                }
            } else if (step.workflow_node_id) {
                stepsWithNoCustomRaciIds.push({
                    dbStepId: stepId,
                    workflowNodeId: step.workflow_node_id,
                });
            }
        }

        // 2. Insert steps
        const { data: stepsData, error: stepsErr } = await supabase
            .from('project_plan_steps')
            .insert(stepsToInsert)
            .select();
        if (stepsErr) throw toServiceError(stepsErr, 'Tạo bước dự án thất bại');

        const insertedSteps = stepsData || [];

        // 3. Lưu RACI: Ưu tiên RACI tùy chỉnh từ client, fallback về RACI template
        const raciToInsert = [...customRaciToInsert];

        if (stepsWithNoCustomRaciIds.length > 0) {
            const nodeIds = stepsWithNoCustomRaciIds.map(x => x.workflowNodeId);
            const { data: raciTemplates } = await supabase
                .from('workflow_node_raci')
                .select('*')
                .in('workflow_node_id', nodeIds);

            if (raciTemplates && raciTemplates.length > 0) {
                for (const item of stepsWithNoCustomRaciIds) {
                    const templatesForNode = raciTemplates.filter(
                        (t: any) => t.workflow_node_id === item.workflowNodeId
                    );
                    for (const temp of templatesForNode) {
                        raciToInsert.push({
                            id: generateUUID(),
                            step_id: item.dbStepId,
                            stakeholder_code: temp.stakeholder_code,
                            raci_type: temp.raci_type,
                            note: temp.note,
                        });
                    }
                }
            }
        }

        if (raciToInsert.length > 0) {
            const { error: raciErr } = await supabase
                .from('project_plan_raci')
                .insert(raciToInsert);
            if (raciErr) {
                console.error('Lỗi lưu RACI cho project steps:', raciErr);
            }
        }

        // 4. Register workflow instance
        if (workflowId) {
            await supabase.from('workflow_instances').insert({
                id: generateUUID(),
                workflow_id: workflowId,
                reference_id: projectId,
                reference_type: 'project',
                status: 'in_progress',
                started_at: new Date().toISOString(),
            });
        }

        // Fetch lại toàn bộ RACI đã tạo để trả về đầy đủ
        const stepIds = insertedSteps.map((s: any) => s.id);
        const { data: stepRacis } = await supabase
            .from('project_plan_raci')
            .select('*')
            .in('step_id', stepIds);

        const raciMap = new Map<string, ProjectStepRaci[]>();
        for (const r of (stepRacis || [])) {
            if (!raciMap.has(r.step_id)) raciMap.set(r.step_id, []);
            raciMap.get(r.step_id)!.push(r);
        }

        const result = insertedSteps.map((s: any): ProjectStep => ({
            ...s,
            task_name: s.step_name,
            is_scheduled: false,
            scheduled_monthly_plan_id: null,
            raci: raciMap.get(s.id) || [],
        }));

        return { steps: result };
    },

    /**
     * "Sinh KH tháng" — gán nhiều steps vào 1 monthly_plan.
     * Tạo bản ghi trong monthly_plan_items tham chiếu tới project_plan_steps.
     */
    async scheduleToMonth(
        stepIds: string[],
        monthlyPlanId: string
    ): Promise<{ scheduled: number; skipped: number }> {
        if (stepIds.length === 0) return { scheduled: 0, skipped: 0 };

        // 1. Lấy thông tin các steps cần schedule
        const { data: steps, error: fetchErr } = await supabase
            .from('project_plan_steps')
            .select('*')
            .in('id', stepIds);

        if (fetchErr) throw toServiceError(fetchErr, 'Không thể tải thông tin bước dự án');
        if (!steps || steps.length === 0) return { scheduled: 0, skipped: 0 };

        // 2. Kiểm tra xem những step nào đã được schedule rồi (tránh duplicate)
        const { data: existingMpis } = await supabase
            .from('monthly_plan_items')
            .select('source_project_plan_item_id')
            .in('source_project_plan_item_id', stepIds);

        const scheduledIds = new Set(existingMpis?.map((m: any) => m.source_project_plan_item_id) || []);

        const toInsert = steps
            .filter((step: any) => !scheduledIds.has(step.id))
            .map((step: any) => ({
                id: generateUUID(),
                monthly_plan_id: monthlyPlanId,
                project_id: step.project_id,
                source_project_plan_item_id: step.id,
                source_type: 'project_step',
                task_name: step.step_name,
                deliverable: step.output_document || null,
                notes: step.notes || null,
                status: 'planned', // default
            }));

        if (toInsert.length === 0) {
            return { scheduled: 0, skipped: steps.length };
        }

        const { error: insErr } = await supabase
            .from('monthly_plan_items')
            .insert(toInsert);

        if (insErr) throw toServiceError(insErr, 'Không thể đưa bước vào kế hoạch tháng');

        return {
            scheduled: toInsert.length,
            skipped: steps.length - toInsert.length,
        };
    },

    /**
     * Gỡ steps khỏi KH tháng.
     * Xóa các dòng trong monthly_plan_items tham chiếu tới steps này.
     */
    async unscheduleFromMonth(stepIds: string[]): Promise<number> {
        if (stepIds.length === 0) return 0;

        const { data, error } = await supabase
            .from('monthly_plan_items')
            .delete()
            .in('source_project_plan_item_id', stepIds)
            .select('id');

        if (error) throw toServiceError(error, 'Không thể gỡ bước khỏi kế hoạch tháng');
        return data?.length || 0;
    },

    /** Lấy RACI cho một bước cụ thể */
    async getRaciForStep(stepId: string): Promise<ProjectStepRaci[]> {
        const { data, error } = await supabase
            .from('project_plan_raci')
            .select('*')
            .eq('step_id', stepId);
        if (error) throw toServiceError(error, 'Không thể tải ma trận RACI của bước');
        return data || [];
    },

    /** Gán/cập nhật ma trận RACI cho một bước */
    async setRaciForStep(
        stepId: string,
        raciList: Array<{
            stakeholder_code: string;
            raci_type: 'R' | 'A' | 'C' | 'I';
            stakeholder_name?: string | null;
            note?: string | null;
        }>
    ): Promise<ProjectStepRaci[]> {
        // 1. Xóa các RACI cũ của step này
        const { error: delErr } = await supabase
            .from('project_plan_raci')
            .delete()
            .eq('step_id', stepId);
        if (delErr) throw toServiceError(delErr, 'Không thể làm sạch RACI cũ');

        if (raciList.length === 0) return [];

        // 2. Insert RACI mới
        const payload = raciList.map(r => ({
            id: generateUUID(),
            step_id: stepId,
            stakeholder_code: r.stakeholder_code,
            raci_type: r.raci_type,
            stakeholder_name: r.stakeholder_name || null,
            note: r.note || null,
        }));

        const { data, error: insErr } = await supabase
            .from('project_plan_raci')
            .insert(payload)
            .select();
        if (insErr) throw toServiceError(insErr, 'Không thể lưu ma trận RACI mới');

        return data || [];
    },
};

