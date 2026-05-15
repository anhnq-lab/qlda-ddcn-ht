// PlanService — CRUD cho KH khung năm, KH tháng, BC tháng
// Note: Cast to `any` vì bảng mới (annual_plan_items, monthly_plans, monthly_plan_items)
// chưa có trong generated types — sẽ tự resolve sau khi run `supabase gen types`
import { supabase as _supabase } from '../lib/supabase';
const supabase = _supabase as any;
import type {
    AnnualPlanItem,
    AnnualPlanItemInput,
    MonthlyPlan,
    MonthlyPlanInput,
    MonthlyPlanItem,
    MonthlyPlanItemInput,
    MonthlyReportSummary,
    DepartmentCode,
    MonthlyTaskStatus,
} from '../types/plan.types';

// ══════════════════════════════════════════════════════════════
// ANNUAL PLAN — Kế hoạch khung năm
// ══════════════════════════════════════════════════════════════

export const AnnualPlanService = {
    // Lấy tất cả nhiệm vụ KH khung của 1 năm
    async getByYear(year: number): Promise<AnnualPlanItem[]> {
        const { data, error } = await supabase
            .from('annual_plan_items')
            .select('*')
            .eq('plan_year', year)
            .order('department_code')
            .order('group_sort_order')
            .order('sort_order');
        if (error) throw error;
        return data as AnnualPlanItem[];
    },

    // Lấy KH khung của 1 phòng trong 1 năm
    async getByDepartment(year: number, deptCode: DepartmentCode): Promise<AnnualPlanItem[]> {
        const { data, error } = await supabase
            .from('annual_plan_items')
            .select('*')
            .eq('plan_year', year)
            .eq('department_code', deptCode)
            .order('group_sort_order')
            .order('sort_order');
        if (error) throw error;
        return data as AnnualPlanItem[];
    },

    // Lấy KH khung gắn với 1 dự án
    async getByProject(projectId: string): Promise<AnnualPlanItem[]> {
        const { data, error } = await supabase
            .from('annual_plan_items')
            .select('*')
            .eq('project_id', projectId)
            .order('plan_year')
            .order('sort_order');
        if (error) throw error;
        return data as AnnualPlanItem[];
    },

    async create(input: AnnualPlanItemInput): Promise<AnnualPlanItem> {
        const { data, error } = await supabase
            .from('annual_plan_items')
            .insert(input)
            .select()
            .single();
        if (error) throw error;
        return data as AnnualPlanItem;
    },

    async update(id: string, input: Partial<AnnualPlanItemInput>): Promise<AnnualPlanItem> {
        const { data, error } = await supabase
            .from('annual_plan_items')
            .update(input)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as AnnualPlanItem;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('annual_plan_items')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Bulk insert (dùng khi import từ Excel)
    async bulkCreate(items: AnnualPlanItemInput[]): Promise<AnnualPlanItem[]> {
        const { data, error } = await supabase
            .from('annual_plan_items')
            .insert(items)
            .select();
        if (error) throw error;
        return data as AnnualPlanItem[];
    },

    /**
     * Xuất task cấp phòng từ KHTHDA dự án sang KH khung năm.
     * Chỉ xuất task có responsibility_level = 'team' (bước quy trình cấp phòng).
     * Kiểm tra trùng theo source_task_id để không seed 2 lần.
     */
    async importFromProjectTasks(
        year: number,
        deptCode: string,
        deptName: string,
        projectId: string,
        createdBy?: string
    ): Promise<{ inserted: AnnualPlanItem[]; skipped: number }> {
        // 1. Lấy tasks cấp phòng của dự án (responsibility_level = 'team')
        const { data: projectTasks, error } = await supabase
            .from('tasks')
            .select('id, title, description, phase, step_code, start_date, due_date, responsible_text, assignee_id, metadata')
            .eq('project_id', projectId)
            .eq('task_type', 'project')
            .eq('responsibility_level', 'team')
            .order('sort_order');
        if (error) throw error;

        if (!projectTasks || projectTasks.length === 0) {
            return { inserted: [], skipped: 0 };
        }

        // 2. Kiểm tra đã import rồi chưa (theo source_task_id)
        const taskIds = projectTasks.map((t: any) => t.id);
        const { data: existing } = await supabase
            .from('annual_plan_items')
            .select('source_task_id')
            .eq('plan_year', year)
            .eq('department_code', deptCode)
            .in('source_task_id', taskIds);
        const existingSourceIds = new Set((existing ?? []).map((e: any) => e.source_task_id));

        // 3. Map và insert những task chưa có
        const toInsert = (projectTasks as any[])
            .filter(t => !existingSourceIds.has(t.id))
            .map((t, idx) => ({
                plan_year: year,
                department_code: deptCode,
                department_name: deptName,
                group_name: t.phase ?? 'Công việc dự án',
                group_sort_order: 0,
                task_name: t.title,
                deliverable: t.description ?? null,
                start_period: t.start_date ? `Tháng ${new Date(t.start_date).getMonth() + 1}` : null,
                end_period: t.due_date ? `Tháng ${new Date(t.due_date).getMonth() + 1}` : null,
                frequency: 'one_time' as const,
                project_id: projectId,
                source_task_id: t.id,
                source_type: 'from_project_task',
                sort_order: idx,
                created_by: createdBy ?? null,
            }));

        if (toInsert.length === 0) {
            return { inserted: [], skipped: existingSourceIds.size };
        }

        const { data: inserted, error: insertErr } = await supabase
            .from('annual_plan_items')
            .insert(toInsert)
            .select();
        if (insertErr) throw insertErr;

        return {
            inserted: (inserted ?? []) as AnnualPlanItem[],
            skipped: existingSourceIds.size,
        };
    },
};

// ══════════════════════════════════════════════════════════════
// MONTHLY PLAN — Kế hoạch tháng
// ══════════════════════════════════════════════════════════════

export const MonthlyPlanService = {
    // Lấy danh sách KH tháng (tất cả phòng) trong 1 tháng/năm
    async getByPeriod(month: number, year: number): Promise<MonthlyPlan[]> {
        const { data, error } = await supabase
            .from('monthly_plans')
            .select('*')
            .eq('plan_month', month)
            .eq('plan_year', year)
            .order('department_code');
        if (error) throw error;
        return data as MonthlyPlan[];
    },

    // Lấy KH tháng của 1 phòng (tạo mới nếu chưa có)
    async getOrCreate(month: number, year: number, deptCode: DepartmentCode, deptName: string): Promise<MonthlyPlan> {
        const { data: existing } = await supabase
            .from('monthly_plans')
            .select('*')
            .eq('plan_month', month)
            .eq('plan_year', year)
            .eq('department_code', deptCode)
            .maybeSingle();

        if (existing) return existing as MonthlyPlan;

        const { data, error } = await supabase
            .from('monthly_plans')
            .insert({ plan_month: month, plan_year: year, department_code: deptCode, department_name: deptName })
            .select()
            .single();
        if (error) throw error;
        return data as MonthlyPlan;
    },

    // Lấy KH tháng kèm danh sách nhiệm vụ
    async getWithItems(id: string): Promise<MonthlyPlan & { items: MonthlyPlanItem[] }> {
        const { data: plan, error: planErr } = await supabase
            .from('monthly_plans')
            .select('*')
            .eq('id', id)
            .single();
        if (planErr) throw planErr;

        const { data: items, error: itemsErr } = await supabase
            .from('monthly_plan_items')
            .select('*, annual_plan_item:annual_plan_items(*)')
            .eq('monthly_plan_id', id)
            .order('group_sort_order')
            .order('sort_order');
        if (itemsErr) throw itemsErr;

        return { ...(plan as MonthlyPlan), items: (items ?? []) as MonthlyPlanItem[] };
    },

    // Lấy tất cả KH tháng của 1 phòng trong 1 năm
    async getByDepartmentYear(deptCode: DepartmentCode, year: number): Promise<MonthlyPlan[]> {
        const { data, error } = await supabase
            .from('monthly_plans')
            .select('*')
            .eq('department_code', deptCode)
            .eq('plan_year', year)
            .order('plan_month');
        if (error) throw error;
        return data as MonthlyPlan[];
    },

    async updateStatus(id: string, status: MonthlyPlan['status']): Promise<void> {
        const { error } = await supabase
            .from('monthly_plans')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
    },
};

// ══════════════════════════════════════════════════════════════
// MONTHLY PLAN ITEMS — Nhiệm vụ trong KH tháng
// ══════════════════════════════════════════════════════════════

export const MonthlyPlanItemService = {
    // Sinh nhiệm vụ KH tháng từ KH khung (các task định kỳ hoặc đúng kỳ)
    async seedFromAnnualPlan(
        monthlyPlanId: string,
        month: number,
        year: number,
        deptCode: DepartmentCode
    ): Promise<MonthlyPlanItem[]> {
        // 1. Lấy tất cả nhiệm vụ KH khung của phòng trong năm
        const { data: annualItems, error } = await supabase
            .from('annual_plan_items')
            .select('*')
            .eq('plan_year', year)
            .eq('department_code', deptCode);
        if (error) throw error;

        // 2. Lấy danh sách annual_plan_item_id đã tồn tại trong monthly_plan này
        //    để tránh tạo bản ghi trùng khi bấm "Sinh từ KH khung" nhiều lần
        const { data: existing } = await supabase
            .from('monthly_plan_items')
            .select('annual_plan_item_id')
            .eq('monthly_plan_id', monthlyPlanId)
            .not('annual_plan_item_id', 'is', null);
        const existingIds = new Set((existing ?? []).map((e: any) => e.annual_plan_item_id));

        // 3. Lọc và map items cần sinh
        const toInsert: MonthlyPlanItemInput[] = (annualItems ?? [])
            .filter((item: any) => {
                // Bỏ qua nếu đã được seed rồi
                if (existingIds.has(item.id)) return false;

                // Luôn thêm task hàng tháng và hàng ngày
                if (item.frequency === 'monthly' || item.frequency === 'daily') return true;

                // Task hàng quý: chỉ sinh vào đầu quý (tháng 1, 4, 7, 10)
                if (item.frequency === 'quarterly') {
                    return isInPeriodQuarterly(item.start_period, item.end_period, month);
                }

                // Task một lần: kiểm tra khoảng thời gian; nếu không parse được → include
                if (item.frequency === 'one_time') {
                    return isInPeriodOneTime(item.start_period, item.end_period, month);
                }

                // as_needed: không tự sinh, người dùng thêm thủ công
                return false;
            })
            .map((item: any, idx: number) => ({
                monthly_plan_id: monthlyPlanId,
                annual_plan_item_id: item.id,
                project_id: item.project_id ?? null,
                group_name: item.group_name ?? null,
                group_sort_order: item.group_sort_order ?? 0,
                task_name: item.task_name,
                deliverable: item.deliverable ?? null,
                deadline_note: `Tháng ${month}`,
                status: 'planned' as MonthlyTaskStatus,
                sort_order: idx,
            }));

        if (toInsert.length === 0) return [];

        const { data, error: insertErr } = await supabase
            .from('monthly_plan_items')
            .insert(toInsert)
            .select();
        if (insertErr) throw insertErr;
        return data as MonthlyPlanItem[];
    },

    /**
     * Sinh nhiệm vụ KH tháng từ sub-tasks (cấp cá nhân) của KHTHDA dự án.
     * Tiêu chí: due_date trong tháng AND assignee thuộc phòng đang lập KH.
     * Hỗ trợ nhiều người thực hiện (staff_ids[]).
     * Không tạo trùng nếu đã seed rồi (kiểm tra source_subtask_id).
     */
    async seedFromProjectTasks(
        monthlyPlanId: string,
        month: number,
        year: number,
        deptCode: string,
        deptEmployeeIds: string[],  // Danh sách EmployeeID thuộc phòng này
        createdBy?: string
    ): Promise<{ inserted: MonthlyPlanItem[]; skipped: number }> {
        // Khoảng ngày của tháng
        const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
        const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0]; // Ngày cuối tháng

        // 1. Lấy sub-tasks (cấp cá nhân) của dự án thuộc phòng và trong tháng
        let query = supabase
            .from('tasks')
            .select('id, title, description, project_id, assignee_id, due_date, start_date, phase, step_code, metadata')
            .eq('task_type', 'project')
            .eq('responsibility_level', 'individual')
            .gte('due_date', startOfMonth)
            .lte('due_date', endOfMonth);

        // Lọc theo phòng (chỉ lấy tasks giao cho người thuộc phòng này)
        if (deptEmployeeIds.length > 0) {
            query = query.in('assignee_id', deptEmployeeIds);
        }

        const { data: subtasks, error } = await query.order('due_date');
        if (error) throw error;
        if (!subtasks || subtasks.length === 0) return { inserted: [], skipped: 0 };

        // 2. Kiểm tra đã seed rồi chưa
        const subtaskIds = (subtasks as any[]).map(t => t.id);
        const { data: existing } = await supabase
            .from('monthly_plan_items')
            .select('source_subtask_id')
            .eq('monthly_plan_id', monthlyPlanId)
            .in('source_subtask_id', subtaskIds);
        const existingSourceIds = new Set((existing ?? []).map((e: any) => e.source_subtask_id));

        // 3. Lấy thông tin assignee để điền staff_name
        const assigneeIds = [...new Set((subtasks as any[]).map(t => t.assignee_id).filter(Boolean))];
        let employeeMap: Record<string, string> = {};
        if (assigneeIds.length > 0) {
            const { data: emps } = await supabase
                .from('employees')
                .select('id, full_name')
                .in('id', assigneeIds);
            (emps ?? []).forEach((e: any) => { employeeMap[e.id] = e.full_name; });
        }

        // 4. Map và insert
        const toInsert = (subtasks as any[])
            .filter(t => !existingSourceIds.has(t.id))
            .map((t, idx) => ({
                monthly_plan_id: monthlyPlanId,
                project_id: t.project_id ?? null,
                group_name: t.phase ?? t.step_code ?? 'Công việc dự án',
                group_sort_order: 0,
                task_name: t.title,
                deliverable: t.description ?? null,
                due_date: t.due_date,
                deadline_note: t.due_date ? `${new Date(t.due_date).getDate()}/${month}` : `Tháng ${month}`,
                staff_id: t.assignee_id ?? null,
                staff_name: t.assignee_id ? (employeeMap[t.assignee_id] ?? null) : null,
                staff_ids: t.assignee_id ? [t.assignee_id] : [],
                staff_names: t.assignee_id ? [employeeMap[t.assignee_id] ?? ''] : [],
                executor_ids: t.assignee_id ? [t.assignee_id] : [],
                executor_names: t.assignee_id ? [employeeMap[t.assignee_id] ?? ''] : [],
                source_task_id: t.metadata?.parent_task_id ?? null,
                source_subtask_id: t.id,
                source_type: 'from_subtask' as const,
                status: 'planned' as MonthlyTaskStatus,
                sort_order: idx,
                created_by: createdBy ?? null,
            }));

        if (toInsert.length === 0) return { inserted: [], skipped: existingSourceIds.size };

        const { data: inserted, error: insertErr } = await supabase
            .from('monthly_plan_items')
            .insert(toInsert)
            .select();
        if (insertErr) throw insertErr;

        return {
            inserted: (inserted ?? []) as MonthlyPlanItem[],
            skipped: existingSourceIds.size,
        };
    },

    async create(input: MonthlyPlanItemInput): Promise<MonthlyPlanItem> {
        const { data, error } = await supabase
            .from('monthly_plan_items')
            .insert(input)
            .select()
            .single();
        if (error) throw error;
        return data as MonthlyPlanItem;
    },

    async update(id: string, input: Partial<MonthlyPlanItemInput>): Promise<MonthlyPlanItem> {
        const { data, error } = await supabase
            .from('monthly_plan_items')
            .update(input)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as MonthlyPlanItem;
    },

    // Cập nhật kết quả báo cáo (BC tháng)
    async updateResult(
        id: string,
        status: MonthlyTaskStatus,
        completionResult?: string,
        incompleteReason?: string
    ): Promise<void> {
        const { error } = await supabase
            .from('monthly_plan_items')
            .update({ status, completion_result: completionResult, incomplete_reason: incompleteReason })
            .eq('id', id);
        if (error) throw error;
    },

    // Chuyển task chưa HT sang tháng sau
    async deferToNextMonth(id: string, nextMonthPlanId: string): Promise<MonthlyPlanItem> {
        // Đánh dấu deferred trên item cũ
        await supabase
            .from('monthly_plan_items')
            .update({ status: 'deferred', deferred_to_plan_id: nextMonthPlanId })
            .eq('id', id);

        // Lấy item cũ để copy sang tháng mới
        const { data: original, error } = await supabase
            .from('monthly_plan_items')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;

        const { id: _id, created_at: _c, updated_at: _u, deferred_to_plan_id: _d, ...rest } = original;
        const { data: newItem, error: insertErr } = await supabase
            .from('monthly_plan_items')
            .insert({ ...rest, monthly_plan_id: nextMonthPlanId, status: 'planned' })
            .select()
            .single();
        if (insertErr) throw insertErr;
        return newItem as MonthlyPlanItem;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('monthly_plan_items')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Tổng hợp BC tháng
    async getSummary(month: number, year: number): Promise<MonthlyReportSummary[]> {
        const { data: plans, error } = await supabase
            .from('monthly_plans')
            .select('id, department_code, department_name')
            .eq('plan_month', month)
            .eq('plan_year', year);
        if (error) throw error;

        const summaries: MonthlyReportSummary[] = [];
        for (const plan of (plans ?? [])) {
            const { data: items } = await supabase
                .from('monthly_plan_items')
                .select('status')
                .eq('monthly_plan_id', plan.id);

            const counts = { completed: 0, incomplete: 0, partial: 0, deferred: 0, planned: 0 };
            (items ?? []).forEach((i: any) => {
                if (i.status in counts) counts[i.status as keyof typeof counts]++;
            });

            const total = (items ?? []).length;
            summaries.push({
                plan_month: month,
                plan_year: year,
                department_code: plan.department_code as DepartmentCode,
                department_name: plan.department_name,
                total_tasks: total,
                ...counts,
                completion_rate: total > 0
                    ? Math.round(((counts.completed + counts.partial * 0.5) / total) * 100)
                    : 0,
            });
        }
        return summaries;
    },
};

// ─── Helpers ─────────────────────────────────────────────────

/** Map quý → số quý (1-4) */
const QUARTER_NUM_MAP: Record<string, number> = {
    'Quý I': 1, 'Quý II': 2, 'Quý III': 3, 'Quý IV': 4,
};

/** Map quý → tháng đầu quý */
const QUARTER_START_MONTH: Record<number, number> = {
    1: 1, 2: 4, 3: 7, 4: 10,
};

/** Parse quý từ chuỗi, trả về số quý (1-4) hoặc null */
function parseQuarterNum(period?: string | null): number | null {
    if (!period) return null;
    for (const [label, num] of Object.entries(QUARTER_NUM_MAP)) {
        if (period.includes(label)) return num;
    }
    return null;
}

/** Parse tháng từ chuỗi ("Tháng 4", "Quý II" → 4), trả về null nếu không nhận dạng được */
function parseMonthNum(period?: string | null): number | null {
    if (!period) return null;
    const m = period.match(/Tháng\s*(\d+)/i);
    if (m) return parseInt(m[1]);
    const q = parseQuarterNum(period);
    if (q) return QUARTER_START_MONTH[q];
    return null;
}

/**
 * Kiểm tra task HÀNG QUÝ có nên sinh vào tháng này không.
 * Quy tắc: chỉ sinh vào tháng ĐẦU quý (1, 4, 7, 10) trong khoảng quý cho phép.
 */
function isInPeriodQuarterly(startPeriod?: string | null, endPeriod?: string | null, month?: number): boolean {
    if (!month) return false;

    // Chỉ sinh vào đầu quý
    const quarterStartMonths = [1, 4, 7, 10];
    if (!quarterStartMonths.includes(month)) return false;

    const currentQuarter = Math.ceil(month / 3);

    // Parse khoảng quý từ start/end period
    const startQ = parseQuarterNum(startPeriod) ?? 1;
    const endQ   = parseQuarterNum(endPeriod)   ?? 4;

    return currentQuarter >= startQ && currentQuarter <= endQ;
}

/**
 * Kiểm tra task MỘT LẦN có nên sinh vào tháng này không.
 * - Nếu cả start và end đều không parse được → include (an toàn hơn bỏ sót).
 * - Nếu parse được → kiểm tra khoảng tháng.
 */
function isInPeriodOneTime(startPeriod?: string | null, endPeriod?: string | null, month?: number): boolean {
    if (!month) return false;

    const start = parseMonthNum(startPeriod);
    const end   = parseMonthNum(endPeriod);

    // Không nhận dạng được period nào → include (để user tự quyết định)
    if (start === null && end === null) return true;

    const effectiveStart = start ?? 1;
    const effectiveEnd   = end   ?? 12;
    return month >= effectiveStart && month <= effectiveEnd;
}

/** @deprecated Dùng isInPeriodOneTime hoặc isInPeriodQuarterly thay thế */
function isInPeriod(startPeriod?: string, endPeriod?: string, month?: number): boolean {
    return isInPeriodOneTime(startPeriod, endPeriod, month);
}
