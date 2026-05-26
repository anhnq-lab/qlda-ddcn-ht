import { useState, useEffect, useMemo } from 'react';
import { supabase as _supabase } from '../../../lib/supabase';
const supabase = _supabase as any;
import { MonthlyPlanService, MonthlyPlanItemService } from '../../../services/PlanService';
import { ProjectStepsService } from '../../../services/ProjectStepsService';
import type { ProjectStep } from '../../../services/ProjectStepsService';
import {
    MonthlyPlan, MonthlyPlanItem, MonthlyTaskStatus,
    DepartmentCode, DEPARTMENT_NAMES, MonthlyReportSummary,
    DEPARTMENT_CODES,
} from '../../../types/plan.types';
import { useEmployees } from '../../../hooks/useEmployees';
import { useAuth } from '../../../context/AuthContext';
import { useTabSearchParam } from '../../../hooks/useTabSearchParam';

type ViewMode = 'plan' | 'report';

const CURRENT_DATE = new Date();

export function useMonthlyPlan(externalMonth?: number, externalYear?: number, externalDepartment?: DepartmentCode) {
    const [viewMode, setViewMode] = useTabSearchParam<ViewMode>('plan', ['plan', 'report'] as const, 'view');
    const [localMonth, setLocalMonth] = useState(CURRENT_DATE.getMonth() + 1);
    const [localYear, setLocalYear] = useState(CURRENT_DATE.getFullYear());

    const month = externalMonth !== undefined ? externalMonth : localMonth;
    const year = externalYear !== undefined ? externalYear : localYear;

    const setMonth = externalMonth !== undefined ? () => {} : setLocalMonth;
    const setYear = externalYear !== undefined ? () => {} : setLocalYear;
    const [localDept, setActiveDept] = useTabSearchParam<DepartmentCode>('HCTH', DEPARTMENT_CODES, 'dept');
    const activeDept = externalDepartment !== undefined ? externalDepartment : localDept;

    const [currentPlan, setCurrentPlan] = useState<MonthlyPlan | null>(null);
    const [items, setItems] = useState<MonthlyPlanItem[]>([]);
    const [summaries, setSummaries] = useState<MonthlyReportSummary[]>([]);

    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [seedLoading, setSeedLoading] = useState(false);
    const [seedResult, setSeedResult] = useState<{ count: number; source: string; show: boolean } | null>(null);

    // ── Step Picker (Sinh KH tháng từ các bước dự án) ──────────────
    const [stepPickerOpen, setStepPickerOpen] = useState(false);
    const [stepPickerSteps, setStepPickerSteps] = useState<ProjectStep[]>([]);
    const [stepPickerLoading, setStepPickerLoading] = useState(false);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    const { data: employees = [] } = useEmployees();
    const { currentUser } = useAuth();

    const deptEmployeeIds = useMemo(() => {
        const deptFullName = DEPARTMENT_NAMES[activeDept];
        return employees
            .filter(e => e.Department === deptFullName || e.Department === activeDept)
            .map(e => e.EmployeeID)
            .filter(Boolean) as string[];
    }, [employees, activeDept]);

    useEffect(() => { loadPlan(); }, [month, year, activeDept]);
    useEffect(() => { if (viewMode === 'report') loadSummaries(); }, [viewMode, month, year]);

    const loadPlan = async () => {
        setLoading(true);
        try {
            const plan = await MonthlyPlanService.getOrCreate(
                month, year, activeDept, DEPARTMENT_NAMES[activeDept]
            );
            setCurrentPlan(plan);

            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            const { data: tasks, error: tasksErr } = await supabase
                .from('tasks')
                .select('*, projects(project_name)')
                .eq('department_code', activeDept)
                .gte('due_date', startDate)
                .lte('due_date', endDate)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true });
            
            if (tasksErr) throw tasksErr;

            const mappedItems = (tasks || []).map((t: any) => ({
                id: t.id,
                monthly_plan_id: plan.id,
                annual_plan_item_id: t.annual_plan_item_id || undefined,
                project_id: t.project_id || undefined,
                source_project_plan_item_id: t.project_plan_step_id || undefined,
                source_type: t.source_type || 'manual',
                task_name: t.title,
                deliverable: t.description || '',
                due_date: t.due_date,
                status: t.status === 'done' ? 'completed' : (t.status === 'in_progress' ? 'partial' : (t.status === 'incomplete' ? 'incomplete' : 'planned')),
                completion_result: t.completion_result || '',
                incomplete_reason: t.incomplete_reason || '',
                notes: t.notes || '',
                sort_order: t.sort_order || 0,
                project_name: t.projects?.project_name || undefined,
                deadline_note: t.metadata?.deadline_note || (t.due_date ? new Date(t.due_date).toLocaleDateString('vi-VN') : undefined),
                collaborating_dept_codes: t.collaborator_ids || [],
                collaborating_text: t.metadata?.collaborating_text || ''
            }));

            setItems(mappedItems as any);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadSummaries = async () => {
        try {
            const data = await MonthlyPlanItemService.getSummary(month, year);
            setSummaries(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSeedFromAnnual = async () => {
        if (!currentPlan) return;
        if (!confirm(`Tự động sinh nhiệm vụ từ KH khung năm ${year} cho tháng ${month}?\n\n(Các nhiệm vụ đã có sẽ được giữ nguyên, không tạo trùng.)`)) return;
        setSeedLoading(true);
        setSeedResult(null);
        try {
            const seeded = await MonthlyPlanItemService.seedFromAnnualPlan(currentPlan.id, month, year, activeDept);
            setSeedResult({ count: seeded.length, source: 'KH khung', show: true });
            setTimeout(() => setSeedResult(null), 4000);
            await loadPlan();
        } catch (e) {
            console.error(e);
            alert('Có lỗi khi sinh nhiệm vụ. Vui lòng thử lại.');
        } finally {
            setSeedLoading(false);
        }
    };

    /**
     * "Sinh từ dự án" — mở Step Picker để user chọn bước muốn đưa vào KH tháng.
     * Load tất cả project_steps của các dự án phù hợp với phòng/tháng.
     */
    const handleOpenStepPicker = async () => {
        if (!currentPlan) return;
        setStepPickerLoading(true);
        setStepPickerOpen(true);
        try {
            // 1. Tải tất cả project_plan_steps chưa hoàn thành
            const { data: steps, error: stepsErr } = await supabase
                .from('project_plan_steps')
                .select('*')
                .neq('status', 'completed');

            if (stepsErr) throw stepsErr;

            // 2. Tải RACI của các steps này
            const stepIds = (steps || []).map((s: any) => s.id);
            let racis: any[] = [];
            if (stepIds.length > 0) {
                const { data: raciData } = await supabase
                    .from('project_plan_raci')
                    .select('*')
                    .in('step_id', stepIds);
                racis = raciData || [];
            }

            // 3. Tải các project_plan_step_id đã được tạo task trong tháng này để lọc bỏ
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];
            const { data: scheduledTasks } = await supabase
                .from('tasks')
                .select('project_plan_step_id')
                .gte('due_date', startDate)
                .lte('due_date', endDate)
                .not('project_plan_step_id', 'is', null);

            const scheduledIds = new Set((scheduledTasks || []).map((t: any) => t.project_plan_step_id));

            // Helper check matching phòng ban
            const isDeptMatch = (assigneeRole: string | undefined | null): boolean => {
                if (!assigneeRole) return false;
                const roleLower = assigneeRole.toLowerCase();
                const codeLower = activeDept.toLowerCase();
                if (roleLower.includes(codeLower)) return true;
                const deptName = DEPARTMENT_NAMES[activeDept] || '';
                const cleanDeptName = deptName.toLowerCase().replace('phòng ', '').trim();
                if (cleanDeptName && roleLower.includes(cleanDeptName)) return true;
                return false;
            };

            // 4. Lọc steps
            const filteredSteps = (steps || []).filter((s: any) => {
                // Đã schedule tháng này rồi thì bỏ qua
                if (scheduledIds.has(s.id)) return false;

                // Khớp trực tiếp assignee_role
                if (isDeptMatch(s.assignee_role)) return true;

                // Khớp qua RACI
                const stepRacis = racis.filter((r: any) => r.step_id === s.id);
                const hasRaciMatch = stepRacis.some((r: any) => {
                    if (r.assigned_employee_id && deptEmployeeIds.includes(r.assigned_employee_id)) return true;
                    if (r.assigned_department_id === activeDept) return true;
                    if (isDeptMatch(r.stakeholder_code)) return true;
                    return false;
                });
                return hasRaciMatch;
            });

            // Map fields cho đúng định dạng ProjectStep mong đợi ở UI
            const mappedSteps = filteredSteps.map((s: any) => ({
                ...s,
                task_name: s.step_name, // Map step_name DB -> task_name frontend
                is_scheduled: false,
                scheduled_monthly_plan_id: null,
            }));

            setStepPickerSteps(mappedSteps);
        } catch (e) {
            console.error(e);
            alert('Không thể tải danh sách bước dự án. Vui lòng thử lại.');
            setStepPickerOpen(false);
        } finally {
            setStepPickerLoading(false);
        }
    };

    /**
     * Đưa các steps đã chọn vào KH tháng hiện tại.
     * Gọi sau khi user xác nhận trong StepPickerModal.
     */
    const handleScheduleSteps = async (selectedStepIds: string[]) => {
        if (!currentPlan || selectedStepIds.length === 0) return;
        setScheduleLoading(true);
        setSeedResult(null);
        try {
            const result = await ProjectStepsService.scheduleToMonth(selectedStepIds, currentPlan.id);
            setSeedResult({ count: result.scheduled, source: 'dự án', show: true });
            setTimeout(() => setSeedResult(null), 4000);
            setStepPickerOpen(false);
            await loadPlan();
        } catch (e) {
            console.error(e);
            alert('Có lỗi khi đưa bước vào KH tháng. Vui lòng thử lại.');
        } finally {
            setScheduleLoading(false);
        }
    };

    const handleStatusChange = async (item: MonthlyPlanItem, status: MonthlyTaskStatus) => {
        let taskStatus: 'todo' | 'in_progress' | 'done' | 'incomplete' = 'todo';
        if (status === 'completed') taskStatus = 'done';
        else if (status === 'partial') taskStatus = 'in_progress';
        else if (status === 'incomplete') taskStatus = 'incomplete';

        const { error } = await supabase
            .from('tasks')
            .update({ status: taskStatus })
            .eq('id', item.id);
            
        if (error) {
            console.error(error);
            alert('Không thể cập nhật trạng thái công việc.');
            return;
        }
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status } : i));
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa nhiệm vụ này?')) return;
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);
        if (error) {
            console.error(error);
            alert('Không thể xóa công việc.');
            return;
        }
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            const gA = a.source_type || 'manual';
            const gB = b.source_type || 'manual';
            if (gA !== gB) return gA.localeCompare(gB);
            return (a.task_name || '').localeCompare(b.task_name || '');
        });
    }, [items]);

    return {
        state: {
            viewMode, month, year, activeDept, currentPlan,
            items, summaries, loading, exporting,
            seedLoading, seedResult,
            sortedItems,
            // Step picker
            stepPickerOpen, stepPickerSteps, stepPickerLoading, scheduleLoading,
        },
        actions: {
            setViewMode, setMonth, setYear, setActiveDept,
            setExporting, loadPlan,
            handleSeedFromAnnual,
            // Step picker actions
            handleOpenStepPicker,
            handleScheduleSteps,
            closeStepPicker: () => setStepPickerOpen(false),
            // Legacy delete
            handleStatusChange, handleDelete
        }
    };
}
