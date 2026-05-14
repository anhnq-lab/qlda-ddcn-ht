import React, { useState, useEffect, useMemo } from 'react';
import {
    CalendarDays, Plus, ChevronDown, ChevronRight,
    CheckCircle2, XCircle, Clock, AlertCircle,
    ArrowRight, Edit2, Trash2, RefreshCw, Download, Link2, FolderOpen,
    FolderSync, Users,
} from 'lucide-react';
import { exportMonthlyReport } from './exportMonthlyReport';
import { MonthlyPlanService, MonthlyPlanItemService } from '../../services/PlanService';
import {
    MonthlyPlan, MonthlyPlanItem, MonthlyTaskStatus,
    DepartmentCode, DEPARTMENT_CODES, DEPARTMENT_NAMES,
    MONTHLY_STATUS_LABELS, MonthlyReportSummary,
    SOURCE_TYPE_CONFIG, getStaffDisplay,
} from '../../types/plan.types';
import { useEmployees } from '../../hooks/useEmployees';
import { useAuth } from '../../context/AuthContext';
import MonthlyPlanItemModal from './MonthlyPlanItemModal';
import MonthlyPlanItemDetail from './MonthlyPlanItemDetail';
import { useSlidePanel } from "../../context/SlidePanelContext";
import DataTable, { Column } from '../../components/ui/DataTable';

const CURRENT_DATE = new Date();
const MONTH_NAMES = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const STATUS_CONFIG: Record<MonthlyTaskStatus, { icon: React.ReactNode; color: string; bg: string }> = {
    planned:    { icon: <Clock className="w-3.5 h-3.5" />,         color: 'text-slate-500',  bg: 'bg-slate-100' },
    completed:  { icon: <CheckCircle2 className="w-3.5 h-3.5" />,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    incomplete: { icon: <XCircle className="w-3.5 h-3.5" />,       color: 'text-red-500',    bg: 'bg-red-50' },
    partial:    { icon: <AlertCircle className="w-3.5 h-3.5" />,   color: 'text-warning-500',  bg: 'bg-warning-50' },
    deferred:   { icon: <ArrowRight className="w-3.5 h-3.5" />,    color: 'text-blue-500',   bg: 'bg-blue-50' },
};

type ViewMode = 'plan' | 'report';

const MonthlyPlanPage: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('plan');
    const [month, setMonth] = useState(CURRENT_DATE.getMonth() + 1);
    const [year, setYear] = useState(CURRENT_DATE.getFullYear());
    const [activeDept, setActiveDept] = useState<DepartmentCode>('HCTH');
    const [currentPlan, setCurrentPlan] = useState<MonthlyPlan | null>(null);
    const [items, setItems] = useState<MonthlyPlanItem[]>([]);
    const [summaries, setSummaries] = useState<MonthlyReportSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const { openPanel, closePanel } = useSlidePanel();
    const [exporting, setExporting] = useState(false);
    const [seedLoading, setSeedLoading] = useState(false);
    const [seedProjectLoading, setSeedProjectLoading] = useState(false);
    const [seedResult, setSeedResult] = useState<{ count: number; source: string; show: boolean } | null>(null);

    const { data: employees = [] } = useEmployees();
    const { currentUser } = useAuth();

    // Danh sách EmployeeID thuộc phòng đang chọn
    // Employee.Department là tên đầy đủ, ví dụ "Phòng Quản lý dự án 1"
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

    const columns: Column<MonthlyPlanItem>[] = useMemo(() => [
        {
            key: 'stt',
            header: 'STT',
            width: '60px',
            align: 'center',
            render: (_, __, idx) => <span className="text-xs text-slate-400 font-medium">{idx + 1}</span>
        },
        {
            key: 'task_name',
            header: 'Nội dung công việc',
            flex: 1,
            render: (_, item) => (
                <div className="flex flex-col gap-1 py-1">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.task_name}</span>
                    {item.deliverable && <span className="text-xs text-slate-500 dark:text-slate-400">{item.deliverable}</span>}
                    {viewMode === 'report' && item.status === 'incomplete' && item.incomplete_reason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded inline-block">
                            Lý do: {item.incomplete_reason}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.source_type && item.source_type !== 'manual' && (() => {
                            const cfg = SOURCE_TYPE_CONFIG[item.source_type];
                            return cfg ? (
                                <span className={`text-[10px] ${cfg.color} ${cfg.bg} px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium border border-current/10`}>
                                    {cfg.icon} {cfg.label}
                                </span>
                            ) : null;
                        })()}
                        {!item.source_type && item.annual_plan_item_id && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium border border-blue-100 dark:border-blue-500/20">
                                <Link2 className="w-2.5 h-2.5" />KH Khung
                            </span>
                        )}
                        {!item.source_type && !item.annual_plan_item_id && item.project_id && (
                            <span className="text-[10px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium border border-violet-100 dark:border-violet-500/20">
                                <FolderOpen className="w-2.5 h-2.5" />Dự án
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'deadline',
            header: 'Thời gian HT',
            width: '120px',
            align: 'center',
            render: (_, item) => <span className="text-xs text-slate-500">{item.deadline_note ?? '—'}</span>
        },
        {
            key: 'staff',
            header: 'Phụ trách',
            width: '160px',
            render: (_, item) => {
                const names = item.staff_names && item.staff_names.length > 0 ? item.staff_names : item.staff_name ? [item.staff_name] : [];
                if (names.length === 0) return <span className="text-slate-400">—</span>;
                if (names.length === 1) return <span className="text-xs text-slate-700 font-medium">{names[0]}</span>;
                return (
                    <span className="flex items-center gap-1 text-xs text-slate-700 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{names.join(', ')}</span>
                    </span>
                );
            }
        },
        {
            key: 'status',
            header: 'Trạng thái',
            width: '140px',
            align: 'center',
            render: (_, item) => {
                const cfg = STATUS_CONFIG[item.status];
                if (viewMode === 'report') {
                    return (
                        <select
                            value={item.status}
                            onChange={e => handleStatusChange(item, e.target.value as MonthlyTaskStatus)}
                            className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            {Object.entries(MONTHLY_STATUS_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                            ))}
                        </select>
                    );
                }
                return (
                    <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                            item.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            item.status === 'incomplete' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                            item.status === 'planned' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                            item.status === 'partial' ? 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                        }`}>
                            {cfg?.icon}
                            {MONTHLY_STATUS_LABELS[item.status]}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'actions',
            header: '',
            width: '80px',
            align: 'center',
            render: (_, item) => (
                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openFormPanel(item)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ], [viewMode]);

    const stats = useMemo(() => ({
        total: items.length,
        completed: items.filter(i => i.status === 'completed').length,
        incomplete: items.filter(i => i.status === 'incomplete').length,
        planned: items.filter(i => i.status === 'planned').length,
    }), [items]);

    const openFormPanel = (item: MonthlyPlanItem | null) => {
        if (!currentPlan) return;
        openPanel({
            component: (
                <MonthlyPlanItemModal
                    monthlyPlanId={currentPlan.id}
                    month={month}
                    year={year}
                    departmentCode={activeDept}
                    item={item}
                    onSaved={() => {
                        closePanel();
                        loadPlan();
                    }}
                    onClose={closePanel}
                />
            ),
            title: item ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ',
        });
    };

    const openDetailPanel = (item: MonthlyPlanItem) => {
        openPanel({
            component: (
                <MonthlyPlanItemDetail
                    item={item}
                    month={month}
                    year={year}
                    onEdit={() => openFormPanel(item)}
                    onDelete={() => {
                        handleDelete(item.id);
                        closePanel();
                    }}
                    onClose={closePanel}
                />
            ),
            title: 'Chi tiết nhiệm vụ',
        });
    };

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-140px)] bg-slate-50 dark:bg-slate-900">
            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-800">
                                {viewMode === 'plan' ? 'Kế hoạch tháng' : 'Báo cáo tháng'}
                            </h1>
                            <p className="text-xs text-slate-500">
                                {MONTH_NAMES[month]}/{year} · {DEPARTMENT_NAMES[activeDept]}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Toast kết quả seed */}
                        {seedResult?.show && (
                            <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium animate-in fade-in duration-300 ${
                                seedResult.count > 0
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-warning-50 text-warning-700 border border-warning-200'
                            }`}>
                                {seedResult.count > 0
                                    ? `✓ Đã sinh ${seedResult.count} nhiệm vụ từ ${seedResult.source}`
                                    : `⚠ Không có nhiệm vụ mới (${seedResult.source} trống hoặc đã sinh hết)`}
                            </span>
                        )}
                        {/* Export Excel */}
                        <button
                            onClick={async () => {
                                setExporting(true);
                                try { await exportMonthlyReport(month, year); }
                                catch (e) { console.error(e); }
                                finally { setExporting(false); }
                            }}
                            disabled={exporting}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-slate-600 disabled:opacity-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
                        </button>

                        {/* Toggle Plan/Report */}
                        <div className="flex bg-slate-100 rounded-lg p-0.5">
                            {(['plan', 'report'] as ViewMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                        viewMode === mode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                                    }`}
                                >
                                    {mode === 'plan' ? 'KH tháng' : 'BC tháng'}
                                </button>
                            ))}
                        </div>

                        {/* Tháng */}
                        <select
                            value={month}
                            onChange={e => setMonth(Number(e.target.value))}
                            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {MONTH_NAMES.slice(1).map((name, i) => (
                                <option key={i + 1} value={i + 1}>{name}</option>
                            ))}
                        </select>

                        {/* Năm */}
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {[year - 1, year, year + 1].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        {viewMode === 'plan' && (
                            <>
                                {/* Sinh từ Dự án */}
                                <button
                                    id="monthly-plan-seed-project-btn"
                                    onClick={handleSeedFromProject}
                                    disabled={seedProjectLoading || loading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-violet-200 rounded-lg hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Sinh nhiệm vụ từ công việc dự án đang chạy"
                                >
                                    <FolderSync className={`w-4 h-4 ${seedProjectLoading ? 'animate-spin' : ''}`} />
                                    {seedProjectLoading ? 'Đang sinh...' : 'Sinh từ dự án'}
                                </button>
                                {/* Sinh từ KH khung */}
                                <button
                                    id="monthly-plan-seed-annual-btn"
                                    onClick={handleSeedFromAnnual}
                                    disabled={seedLoading || loading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Sinh từ KH khung"
                                >
                                    <RefreshCw className={`w-4 h-4 ${seedLoading ? 'animate-spin' : ''}`} />
                                    {seedLoading ? 'Đang sinh...' : 'Sinh từ KH khung'}
                                </button>
                                <button
                                    id="monthly-plan-add-btn"
                                    onClick={() => openFormPanel(null)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Thêm nhiệm vụ
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Tab phòng */}
                <div className="flex gap-1 overflow-x-auto">
                    {DEPARTMENT_CODES.map(code => (
                        <button
                            key={code}
                            onClick={() => setActiveDept(code)}
                            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                activeDept === code ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {code}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Thống kê nhanh ── */}
            {viewMode === 'plan' && items.length > 0 && (
                <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-4">
                    <span className="text-xs text-slate-500">Tổng: <b className="text-slate-800">{stats.total}</b></span>
                    <span className="text-xs text-emerald-600">✓ Hoàn thành: <b>{stats.completed}</b></span>
                    <span className="text-xs text-red-500">✗ Chưa HT: <b>{stats.incomplete}</b></span>
                    <span className="text-xs text-slate-400">○ Chưa báo cáo: <b>{stats.planned}</b></span>
                    {stats.total > 0 && (
                        <div className="ml-auto flex items-center gap-2">
                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${Math.round((stats.completed / stats.total) * 100)}%` }}
                                />
                            </div>
                            <span className="text-xs text-slate-500">
                                {Math.round((stats.completed / stats.total) * 100)}%
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ── BC tháng: Summary table ── */}
            {viewMode === 'report' && (
                <div className="px-6 py-4 bg-white border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">
                        Tổng hợp kết quả {MONTH_NAMES[month]}/{year} — Toàn Ban
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                                <tr className="text-slate-500 dark:text-slate-400">
                                    <th className="px-3 py-2 text-left border-b border-slate-200 dark:border-slate-700">Phòng/Ban</th>
                                    <th className="px-3 py-2 text-center border-b border-slate-200 dark:border-slate-700">Tổng</th>
                                    <th className="px-3 py-2 text-center text-emerald-600 border-b border-slate-200 dark:border-slate-700">Hoàn thành</th>
                                    <th className="px-3 py-2 text-center text-warning-500 border-b border-slate-200 dark:border-slate-700">Một phần</th>
                                    <th className="px-3 py-2 text-center text-red-500 border-b border-slate-200 dark:border-slate-700">Chưa HT</th>
                                    <th className="px-3 py-2 text-center text-blue-500 border-b border-slate-200 dark:border-slate-700">Chuyển tháng</th>
                                    <th className="px-3 py-2 text-center border-b border-slate-200 dark:border-slate-700">Tỷ lệ HT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {summaries.map(s => (
                                    <tr key={s.department_code} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-medium text-slate-700">{s.department_name}</td>
                                        <td className="px-3 py-2 text-center text-slate-600">{s.total_tasks}</td>
                                        <td className="px-3 py-2 text-center text-emerald-600 font-medium">{s.completed}</td>
                                        <td className="px-3 py-2 text-center text-warning-500">{s.partial}</td>
                                        <td className="px-3 py-2 text-center text-red-500">{s.incomplete}</td>
                                        <td className="px-3 py-2 text-center text-blue-500">{s.deferred}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`font-semibold ${
                                                s.completion_rate >= 80 ? 'text-emerald-600'
                                                : s.completion_rate >= 50 ? 'text-warning-500'
                                                : 'text-red-500'
                                            }`}>
                                                {s.completion_rate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {summaries.length === 0 && (
                                    <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-400 text-sm">
                                        Chưa có dữ liệu báo cáo
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Danh sách nhiệm vụ ── */}
            <div className="flex-1 px-6 py-4 flex flex-col min-h-0">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Đang tải...</div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <CalendarDays className="w-10 h-10 opacity-30" />
                        <p className="text-sm">Chưa có nhiệm vụ nào trong tháng này</p>
                        <div className="flex flex-wrap gap-2 text-sm justify-center">
                            <button onClick={handleSeedFromProject} className="text-violet-600 hover:underline flex items-center gap-1">
                                <FolderSync className="w-3.5 h-3.5" /> Sinh từ dự án
                            </button>
                            <span className="text-slate-300">|</span>
                            <button onClick={handleSeedFromAnnual} className="text-primary-600 hover:underline">
                                Sinh từ KH khung
                            </button>
                            <span className="text-slate-300">|</span>
                            <button onClick={() => openFormPanel(null)} className="text-primary-600 hover:underline">
                                Thêm thủ công
                            </button>
                        </div>
                    </div>
                ) : (
                    <DataTable
                        data={sortedItems}
                        columns={columns}
                        keyExtractor={item => item.id}
                        stickyHeader
                        maxHeight="calc(100vh - 280px)"
                        onRowClick={openDetailPanel}
                        groupBy={(item) => item.group_name || 'Công việc khác'}
                        defaultExpandedGroups={true}
                        renderGroupHeader={(groupName, groupItems, isExpanded, toggle) => {
                            if (groupName === 'Công việc khác') return null;
                            return (
                                <tr className="bg-slate-50/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                                    <td colSpan={6} className="px-2 py-2">
                                        <button
                                            onClick={toggle}
                                            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                <FolderOpen className="w-4 h-4 text-primary-500" />
                                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{groupName}</span>
                                                <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                                                    {groupItems.length}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pr-2">
                                                <span className="text-emerald-600 dark:text-emerald-500 font-medium">{groupItems.filter(i => i.status === 'completed').length} HT</span>
                                            </div>
                                        </button>
                                    </td>
                                </tr>
                            );
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default MonthlyPlanPage;
