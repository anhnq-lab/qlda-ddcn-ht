// PlanService — CRUD cho KH khung năm, KH tháng, BC tháng
// Note: Cast to `any` vì bảng mới (annual_plan_items, monthly_plans, monthly_plan_items)
// chưa có trong generated types — sẽ tự resolve sau khi run `supabase gen types`
import { supabase as _supabase } from '../lib/supabase';
const supabase = _supabase as any;
import { NotificationService } from './NotificationService';
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

    // Lấy KH khung của 1 phòng hoặc tất cả trong 1 năm
    async getByDepartment(year: number, deptCode: DepartmentCode | 'All'): Promise<AnnualPlanItem[]> {
        let query = supabase
            .from('annual_plan_items')
            .select('*')
            .eq('plan_year', year);

        if (deptCode !== 'All') {
            query = query.eq('department_code', deptCode);
        }

        const { data, error } = await query
            .order('department_code')
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

    // Submit for approval (Điều 7)
    async submitForApproval(year: number, deptCode: DepartmentCode, employeeId: string): Promise<void> {
        const { error } = await supabase
            .from('annual_plan_items')
            .update({
                approval_status: 'submitted',
                submitted_by: employeeId,
                submitted_at: new Date().toISOString()
            })
            .eq('plan_year', year)
            .eq('department_code', deptCode)
            .in('approval_status', ['draft', 'rejected', 'submitted']); // allow re-submit
        
        if (error) throw error;

        // Trigger notifications to leadership
        try {
            const { data: leaders } = await supabase
                .from('employees')
                .select('employee_id')
                .or('role.eq.director,role.eq.deputy_director,position.ilike.%Giám đốc%');

            if (leaders && leaders.length > 0) {
                for (const leader of leaders) {
                    await NotificationService.notifyApprovalNeeded(
                        'annual_plan', 
                        deptCode, 
                        `Kế hoạch năm ${year} phòng ${deptCode} chờ duyệt`, 
                        leader.employee_id
                    );
                }
            }
        } catch (notifErr) {
            console.error('Failed to trigger annual plan submission notifications:', notifErr);
        }
    },

    // Approve annual plan (Điều 7)
    async approve(year: number, deptCode: DepartmentCode, approverId: string): Promise<void> {
        const { error } = await supabase
            .from('annual_plan_items')
            .update({
                approval_status: 'approved',
                approved_by: approverId,
                approved_at: new Date().toISOString()
            })
            .eq('plan_year', year)
            .eq('department_code', deptCode)
            .eq('approval_status', 'submitted');
        
        if (error) throw error;

        // Trigger notifications to department heads
        try {
            const { data: managers } = await supabase
                .from('employees')
                .select('employee_id')
                .eq('department', deptCode)
                .or('role.eq.department_head,role.eq.manager,position.ilike.%Trưởng phòng%');

            if (managers && managers.length > 0) {
                for (const mgr of managers) {
                    await NotificationService.createNotification(
                        mgr.employee_id,
                        `Kế hoạch năm ${year} của phòng đã được phê duyệt`,
                        `Phê duyệt bởi Lãnh đạo`,
                        'success',
                        `/work-plan?tab=annual&dept=${deptCode}`
                    );
                }
            }
        } catch (notifErr) {
            console.error('Failed to trigger annual plan approval notifications:', notifErr);
        }
    },

    // Reject annual plan (Điều 7)
    async reject(year: number, deptCode: DepartmentCode, approverId: string, reason: string): Promise<void> {
        const { error } = await supabase
            .from('annual_plan_items')
            .update({
                approval_status: 'rejected',
                approved_by: approverId,
                approved_at: new Date().toISOString(),
                rejected_reason: reason
            })
            .eq('plan_year', year)
            .eq('department_code', deptCode)
            .eq('approval_status', 'submitted');
        
        if (error) throw error;

        // Trigger notifications to department heads
        try {
            const { data: managers } = await supabase
                .from('employees')
                .select('employee_id')
                .eq('department', deptCode)
                .or('role.eq.department_head,role.eq.manager,position.ilike.%Trưởng phòng%');

            if (managers && managers.length > 0) {
                for (const mgr of managers) {
                    await NotificationService.createNotification(
                        mgr.employee_id,
                        `Kế hoạch năm ${year} của phòng bị từ chối phê duyệt`,
                        `Lý do: ${reason}`,
                        'warning',
                        `/work-plan?tab=annual&dept=${deptCode}`
                    );
                }
            }
        } catch (notifErr) {
            console.error('Failed to trigger annual plan rejection notifications:', notifErr);
        }
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
        deptCode: DepartmentCode,
        createdBy?: string
    ): Promise<any[]> {
        return this.seedTasksFromAnnualPlan(month, year, deptCode, createdBy);
    },

    // Mới: seed from annual plan → tạo Tasks trực tiếp cho Báo cáo tháng
    async seedTasksFromAnnualPlan(
        month: number,
        year: number,
        deptCode: DepartmentCode,
        createdBy?: string
    ): Promise<any[]> {
        // 1. Lấy tất cả nhiệm vụ KH khung của phòng trong năm
        const { data: annualItems, error } = await supabase
            .from('annual_plan_items')
            .select('*')
            .eq('plan_year', year)
            .eq('department_code', deptCode);
        if (error) throw error;

        // 2. Lấy danh sách tasks đã seed từ annual_plan_item_id trong tháng/năm này
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const { data: existingTasks } = await supabase
            .from('tasks')
            .select('annual_plan_item_id')
            .eq('department_code', deptCode)
            .gte('due_date', startDate)
            .lte('due_date', endDate)
            .not('annual_plan_item_id', 'is', null);

        const existingIds = new Set(
            (existingTasks ?? []).map((t: any) => t.annual_plan_item_id).filter(Boolean)
        );

        // 3. Lọc items theo tần suất và tháng hiện tại
        const itemsToSeed = (annualItems ?? []).filter((item: any) => {
            if (existingIds.has(item.id)) return false;
            if (item.frequency === 'monthly' || item.frequency === 'daily') return true;
            if (item.frequency === 'quarterly') {
                return isInPeriodQuarterly(item.start_period, item.end_period, month);
            }
            if (item.frequency === 'one_time') {
                return isInPeriodOneTime(item.start_period, item.end_period, month);
            }
            return false;
        });

        if (itemsToSeed.length === 0) return [];

        // 4. Tạo tasks trực tiếp
        const tasksToInsert = itemsToSeed.map((item: any) => ({
            title: item.task_name,
            description: item.deliverable || '',
            task_type: item.project_id ? 'project' : 'internal',
            status: 'todo',
            priority: 'medium',
            progress: 0,
            due_date: endDate,
            start_date: startDate,
            assignee_id: null,
            department_code: deptCode,
            annual_plan_item_id: item.id,
            project_id: item.project_id || null,
            category: resolveTaskCategory(item.task_name, deptCode),
            source_type: 'from_annual',
            created_by: createdBy || null,
        }));

        const { data: inserted, error: insertErr } = await supabase
            .from('tasks')
            .insert(tasksToInsert)
            .select();

        if (insertErr) throw insertErr;
        return inserted || [];
    },

    // Mới: seed from project steps (bước dự án) → tạo Tasks trực tiếp
    async seedTasksFromProjectSteps(
        month: number,
        year: number,
        deptCode: string,
        deptEmployeeIds: string[],
        createdBy?: string
    ): Promise<{ inserted: any[]; skipped: number }> {
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
            return false;
        };

        // 1. Lấy tất cả project steps (project_plan_steps) có due_date trong tháng
        const { data: steps, error } = await supabase
            .from('project_plan_steps')
            .select('*')
            .gte('due_date', startOfMonth)
            .lte('due_date', endOfMonth);
        if (error) throw error;

        if (!steps || steps.length === 0) {
            return { inserted: [], skipped: 0 };
        }

        const stepIds = steps.map((s: any) => s.id);

        // Lấy RACI cho các steps này
        const { data: racis } = await supabase
            .from('project_plan_raci')
            .select('*')
            .in('step_id', stepIds);

        // Lọc các steps giao cho phòng này
        const matchingSteps = steps.filter((s: any) => {
            if (isDeptMatch(s.assignee_role)) return true;
            const stepRacis = (racis || []).filter((r: any) => r.step_id === s.id);
            const hasRaciMatch = stepRacis.some((r: any) => {
                if (r.assigned_employee_id && deptEmployeeIds.includes(r.assigned_employee_id)) return true;
                if (r.assigned_department_id === deptCode) return true;
                if (isDeptMatch(r.stakeholder_code)) return true;
                return false;
            });
            return hasRaciMatch;
        });

        if (matchingSteps.length === 0) {
            return { inserted: [], skipped: 0 };
        }

        // 2. Kiểm tra các tasks đã seed từ project_plan_step_id trong tháng
        const matchingStepIds = matchingSteps.map((s: any) => s.id);
        const { data: existingTasks } = await supabase
            .from('tasks')
            .select('project_plan_step_id')
            .in('project_plan_step_id', matchingStepIds)
            .gte('due_date', startOfMonth)
            .lte('due_date', endOfMonth)
            .not('project_plan_step_id', 'is', null);

        const existingStepIds = new Set((existingTasks ?? []).map((t: any) => t.project_plan_step_id).filter(Boolean));

        const stepsToSeed = matchingSteps.filter((s: any) => !existingStepIds.has(s.id));

        if (stepsToSeed.length === 0) {
            return { inserted: [], skipped: matchingSteps.length };
        }

        // 3. Tạo tasks
        const tasksToInsert = stepsToSeed.map((s: any) => {
            const stepRacis = (racis || []).filter((r: any) => r.step_id === s.id && r.raci_type === 'R');
            const assignedEmpId = stepRacis.find((r: any) => r.assigned_employee_id)?.assigned_employee_id || null;

            return {
                title: s.step_name,
                description: s.deliverable || '',
                task_type: 'project',
                project_id: s.project_id,
                project_plan_step_id: s.id,
                status: 'todo',
                priority: 'medium',
                progress: 0,
                due_date: s.due_date,
                start_date: s.start_date || startOfMonth,
                assignee_id: assignedEmpId,
                department_code: deptCode,
                category: resolveTaskCategory(s.step_name, deptCode),
                source_type: 'from_project_step',
                created_by: createdBy || null,
            };
        });

        const { data: inserted, error: insertErr } = await supabase
            .from('tasks')
            .insert(tasksToInsert)
            .select();

        if (insertErr) throw insertErr;

        return {
            inserted: inserted || [],
            skipped: matchingSteps.length - stepsToSeed.length
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
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            const { data: items } = await supabase
                .from('tasks')
                .select('status')
                .eq('department_code', plan.department_code)
                .gte('due_date', startDate)
                .lte('due_date', endDate);

            const counts = { completed: 0, incomplete: 0, partial: 0, deferred: 0, planned: 0 };
            (items ?? []).forEach((i: any) => {
                let mStatus: keyof typeof counts = 'planned';
                if (i.status === 'done') mStatus = 'completed';
                else if (i.status === 'in_progress') mStatus = 'partial';
                else if (i.status === 'incomplete') mStatus = 'incomplete';
                if (mStatus in counts) counts[mStatus]++;
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

/** Resolve task category based on keywords in title and fallback department */
function resolveTaskCategory(title: string, deptCode: string): string {
    const titleLower = (title || '').toLowerCase();
    
    // Keyword matches
    if (titleLower.includes('giám sát') || titleLower.includes('thi công') || titleLower.includes('hiện trường')) return 'thi_cong';
    if (titleLower.includes('thẩm định') || titleLower.includes('phê duyệt') || titleLower.includes('thẩm tra')) return 'tham_dinh';
    if (titleLower.includes('quyết toán') || titleLower.includes('hoàn công') || titleLower.includes('tất toán')) return 'quyet_toan';
    if (titleLower.includes('thanh toán') || titleLower.includes('giải ngân') || titleLower.includes('tạm ứng')) return 'thanh_toan';
    if (titleLower.includes('giải phóng mặt bằng') || titleLower.includes('gpmb') || titleLower.includes('bồi thường')) return 'gpmb';
    if (titleLower.includes('đấu thầu') || titleLower.includes('hồ sơ mời thầu') || titleLower.includes('hồ sơ dự thầu')) return 'dau_thau';
    if (titleLower.includes('điều chỉnh') || titleLower.includes('phát sinh') || titleLower.includes('bổ sung')) return 'dieu_chinh';
    if (titleLower.includes('góp ý') || titleLower.includes('văn bản') || titleLower.includes('công văn')) return 'gop_y';
    if (titleLower.includes('báo cáo') || titleLower.includes('tổng hợp')) return 'bao_cao';
    if (titleLower.includes('kiểm tra') || titleLower.includes('chất lượng') || titleLower.includes('nghiệm thu kỹ thuật')) return 'kiem_tra';
    if (titleLower.includes('bàn giao') || titleLower.includes('nghiệm thu bàn giao') || titleLower.includes('đưa vào sử dụng')) return 'ban_giao';
    if (titleLower.includes('điều hành') || titleLower.includes('chỉ đạo')) return 'dieu_hanh';

    // Department fallbacks
    if (deptCode === 'KTTD') return 'tham_dinh';
    if (deptCode === 'KHDT') return 'dau_thau';
    if (deptCode === 'QLDA1' || deptCode === 'QLDA2' || deptCode === 'QLDA3') return 'thi_cong';
    if (deptCode === 'TCKT') return 'thanh_toan';
    if (deptCode === 'HCTH') return 'dieu_hanh';

    return 'khac';
}
