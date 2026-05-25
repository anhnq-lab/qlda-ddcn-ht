import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
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

export function useMonthlyPlan(externalMonth?: number, externalYear?: number) {
    const [viewMode, setViewMode] = useTabSearchParam<ViewMode>('plan', ['plan', 'report'] as const, 'view');
    const [localMonth, setLocalMonth] = useState(CURRENT_DATE.getMonth() + 1);
    const [localYear, setLocalYear] = useState(CURRENT_DATE.getFullYear());

    const month = externalMonth !== undefined ? externalMonth : localMonth;
    const year = externalYear !== undefined ? externalYear : localYear;

    const setMonth = externalMonth !== undefined ? () => {} : setLocalMonth;
    const setYear = externalYear !== undefined ? () => {} : setLocalYear;
    const [activeDept, setActiveDept] = useTabSearchParam<DepartmentCode>('HCTH', DEPARTMENT_CODES, 'dept');

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
            const detail = await MonthlyPlanService.getWithItems(plan.id);
            setItems(detail.items ?? []);
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
            // Lấy tất cả project_steps chưa lên KH của phòng hiện tại
            const { data: stepsRaw, error } = await (supabase as any)
                .from('monthly_plan_items')
                .select('*')
                .eq('schedule_state', 'project_step')
                .or(
                    deptEmployeeIds.length > 0
                        ? `assignee_role.eq.${activeDept},assignee_role.is.null`
                        : 'assignee_role.is.null'
                )
                .order('step_order', { ascending: true });

            if (error) throw error;
            setStepPickerSteps((stepsRaw || []) as ProjectStep[]);
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
        await MonthlyPlanItemService.updateResult(item.id, status);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status } : i));
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa nhiệm vụ này?')) return;
        await MonthlyPlanItemService.delete(id);
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
