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
import { DEPARTMENT_NAMES } from '../types/plan.types';

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

        // 3. Lọc items theo tần suất và tháng hiện tại
        const filteredIds: string[] = (annualItems ?? [])
            .filter((item: any) => {
                // Bỏ qua nếu đã được seed rồi (tránh trùng khi bấm nhiều lần)
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
            .map((item: any) => item.id);

        if (filteredIds.length === 0) return [];

        // 4. Gọi RPC seed_monthly_from_annual — xử lý cả 2 trường hợp:
        //    - annual_item có project_step_id → INSERT MPI với source_project_plan_item_id
        //    - annual_item không có project_step_id → INSERT MPI bình thường (source_type='from_annual')
        const { error: rpcErr } = await supabase.rpc('seed_monthly_from_annual', {
            p_annual_item_ids: filteredIds,
            p_monthly_plan_id: monthlyPlanId,
            p_created_by: null,
        });
        if (rpcErr) throw rpcErr;

        // 5. Trả về các items vừa sinh (để caller hiển thị toast)
        const { data: newItems } = await supabase
            .from('monthly_plan_items')
            .select('*')
            .eq('monthly_plan_id', monthlyPlanId)
            .in('annual_plan_item_id', filteredIds);
        return (newItems ?? []) as MonthlyPlanItem[];
    },

    /**
     * Sinh KH tháng từ "bước dự án" — sử dụng bảng project_plan_items.
     *
     * Logic:
     *   1. Tìm tasks có project_plan_item_id (tức task thuộc bước KH dự án),
     *      có hạn trong tháng AND giao cho phòng đang lập KH.
     *   2. Lấy các project_plan_items tương ứng chưa có trong KH tháng này.
     *   3. Gọi RPC schedule_project_steps_to_month → INSERT MPI với source_project_plan_item_id.
     */
    async seedFromProjectTasks(
        monthlyPlanId: string,
        month: number,
        year: number,
        deptCode: string,
        deptEmployeeIds: string[],
        _createdBy?: string
    ): Promise<{ inserted: MonthlyPlanItem[]; skipped: number }> {
        const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
        const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

        const isDeptMatch = (assigneeRole: string | undefined | null): boolean => {
            if (!assigneeRole) return false;
            const roleLower = assigneeRole.toLowerCase();
            const codeLower = deptCode.toLowerCase();
            if (roleLower.includes(codeLower)) return true;
            const deptName = DEPARTMENT_NAMES[deptCode as DepartmentCode] || '';
            const cleanDeptName = deptName.toLowerCase().replace('phòng ', '').trim();
            if (cleanDeptName && roleLower.includes(cleanDeptName)) return true;
            if (codeLower === 'hcth' && (roleLower.includes('hành chính') || roleLower.includes('tổng hợp'))) return true;
            if (codeLower === 'khdt' && (roleLower.includes('kế hoạch') || roleLower.includes('đấu thầu'))) return true;
            if (codeLower === 'kttd' && (roleLower.includes('kỹ thuật') || roleLower.includes('thẩm định'))) return true;
            if (codeLower === 'tckt' && (roleLower.includes('tài chính') || roleLower.includes('kế toán'))) return true;
            if (codeLower.startsWith('qlda') && roleLower.includes('quản lý dự án')) return true;
            return false;
        };

        // 1. Tìm tasks thuộc bước KH dự án, có hạn trong tháng
        const { data: tasksRaw, error } = await supabase
            .from('tasks')
            .select('id, project_plan_item_id, assignee_id, metadata, due_date, status, actual_end_date')
            .eq('task_type', 'project')
            .not('project_plan_item_id', 'is', null)
            .gte('due_date', startOfMonth)
            .lte('due_date', endOfMonth);
        if (error) throw error;

        const startOfMonthDate = new Date(year, month - 1, 1);
        const matchingTasks = (tasksRaw || []).filter((t: any) => {
            if (t.status === 'done' && t.actual_end_date) {
                if (new Date(t.actual_end_date) < startOfMonthDate) return false;
            }
            const byEmployee = t.assignee_id && deptEmployeeIds.includes(t.assignee_id);
            const byRole = isDeptMatch(t.metadata?.assignee_role);
            return byEmployee || byRole;
        });

        if (matchingTasks.length === 0) return { inserted: [], skipped: 0 };

        // 2. Lấy project_plan_items chưa được đưa vào KH tháng này
        const allStepIds = Array.from(new Set(matchingTasks.map((t: any) => t.project_plan_item_id)));

        // Loại bỏ các step đã có trong monthly plan này rồi
        const { data: alreadyScheduled } = await supabase
            .from('monthly_plan_items')
            .select('source_project_plan_item_id')
            .in('source_project_plan_item_id', allStepIds)
            .eq('monthly_plan_id', monthlyPlanId);

        const scheduledSet = new Set(
            (alreadyScheduled || []).map((r: any) => r.source_project_plan_item_id)
        );
        const eligibleStepIds = allStepIds.filter(id => !scheduledSet.has(id));

        if (eligibleStepIds.length === 0) {
            return { inserted: [], skipped: allStepIds.length };
        }

        // 3. Gọi RPC để gán atomic
        const { data: rpcResult, error: rpcErr } = await supabase.rpc('schedule_project_steps_to_month', {
            p_step_ids: eligibleStepIds,
            p_monthly_plan_id: monthlyPlanId,
        });
        if (rpcErr) throw rpcErr;

        const result = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
        const scheduledCount = result?.scheduled_count || 0;

        // 4. Fetch lại các MPI vừa tạo
        const { data: inserted } = await supabase
            .from('monthly_plan_items')
            .select('*')
            .in('source_project_plan_item_id', eligibleStepIds)
            .eq('monthly_plan_id', monthlyPlanId);

        return {
            inserted: (inserted ?? []) as MonthlyPlanItem[],
            skipped: allStepIds.length - scheduledCount,
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
    const clean = period.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (clean.includes('quy i') && !clean.includes('quy ii') && !clean.includes('quy iii') && !clean.includes('quy iv')) return 1;
    if (clean.includes('quy ii')) return 2;
    if (clean.includes('quy iii')) return 3;
    if (clean.includes('quy iv')) return 4;
    return null;
}

/** Parse tháng từ chuỗi ("Tháng 4", "Quý II" → 4), trả về null nếu không nhận dạng được */
function parseMonthNum(period?: string | null): number | null {
    if (!period) return null;
    const clean = period.toString().trim();
    
    // 1. Kiểm tra định dạng số Excel serial (ví dụ "46203")
    if (/^\d{5}$/.test(clean)) {
        const serial = parseInt(clean, 10);
        const date = new Date((serial - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
            return date.getMonth() + 1;
        }
    }
    
    // 2. Kiểm tra định dạng ngày dd/mm/yyyy
    const dateParts = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dateParts) {
        return parseInt(dateParts[2], 10);
    }
    
    // 3. Định dạng text tiếng Việt như "Tháng 4", "thang 04"
    const normalized = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const m = normalized.match(/thang\s*(\d+)/i);
    if (m) return parseInt(m[1], 10);
    
    // 4. Định dạng quý như "Quý II"
    const q = parseQuarterNum(clean);
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
