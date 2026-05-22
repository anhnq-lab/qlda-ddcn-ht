import { useState, useEffect, useMemo } from 'react';
import { MonthlyPlanService, MonthlyPlanItemService } from '../../../services/PlanService';
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

export function useMonthlyPlan() {
    const [viewMode, setViewMode] = useTabSearchParam<ViewMode>('plan', ['plan', 'report'] as const, 'view');
    const [month, setMonth] = useState(CURRENT_DATE.getMonth() + 1);
    const [year, setYear] = useState(CURRENT_DATE.getFullYear());
    const [activeDept, setActiveDept] = useTabSearchParam<DepartmentCode>('HCTH', DEPARTMENT_CODES, 'dept');
    
    const [currentPlan, setCurrentPlan] = useState<MonthlyPlan | null>(null);
    const [items, setItems] = useState<MonthlyPlanItem[]>([]);
    const [summaries, setSummaries] = useState<MonthlyReportSummary[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [seedLoading, setSeedLoading] = useState(false);
    const [seedProjectLoading, setSeedProjectLoading] = useState(false);
    const [seedResult, setSeedResult] = useState<{ count: number; source: string; show: boolean } | null>(null);

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

    const handleSeedFromProject = async () => {
        if (!currentPlan) return;
        if (deptEmployeeIds.length === 0) {
            alert(`Không tìm thấy nhân viên thuộc phòng ${activeDept}. Vui lòng kiểm tra cấu hình phòng ban.`);
            return;
        }
        if (!confirm(
            `Sinh nhiệm vụ từ công việc dự án đang chạy cho tháng ${month}/${year}?\n` +
            `Tiêu chí: công việc có hạn trong tháng AND giao cho nhân viên thuộc phòng ${activeDept}.\n\n` +
            `(Không tạo trùng nếu đã sinh rồi.)`
        )) return;

        setSeedProjectLoading(true);
        setSeedResult(null);
        try {
            const result = await MonthlyPlanItemService.seedFromProjectTasks(
                currentPlan.id,
                month,
                year,
                activeDept,
                deptEmployeeIds,
                currentUser?.EmployeeID
            );
            setSeedResult({ count: result.inserted.length, source: 'dự án', show: true });
            setTimeout(() => setSeedResult(null), 4000);
            await loadPlan();
        } catch (e) {
            console.error(e);
            alert('Có lỗi khi sinh từ dự án. Vui lòng thử lại.');
        } finally {
            setSeedProjectLoading(false);
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
            const gA = a.group_name || 'Công việc khác';
            const gB = b.group_name || 'Công việc khác';
            if (gA !== gB) return gA.localeCompare(gB);
            return (a.task_name || '').localeCompare(b.task_name || '');
        });
    }, [items]);

    return {
        state: {
            viewMode, month, year, activeDept, currentPlan,
            items, summaries, loading, exporting,
            seedLoading, seedProjectLoading, seedResult,
            sortedItems
        },
        actions: {
            setViewMode, setMonth, setYear, setActiveDept,
            setExporting, loadPlan,
            handleSeedFromAnnual, handleSeedFromProject,
            handleStatusChange, handleDelete
        }
    };
}
