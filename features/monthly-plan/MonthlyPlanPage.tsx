import React, { useMemo } from 'react';
import { useMonthlyPlan } from './hooks/useMonthlyPlan';
import {
    CalendarDays, Plus, ChevronDown, ChevronRight,
    CheckCircle2, XCircle, Clock, AlertCircle,
    ArrowRight, Edit2, Trash2, RefreshCw, Download, Link2, FolderOpen,
    FolderSync, Users,
} from 'lucide-react';
// exportMonthlyReport: lazy-loaded inside the click handler to keep exceljs out of the initial bundle
import {
    MonthlyPlan, MonthlyPlanItem, MonthlyTaskStatus,
    DepartmentCode, DEPARTMENT_CODES, DEPARTMENT_NAMES,
    MONTHLY_STATUS_LABELS, MonthlyReportSummary,
    SOURCE_TYPE_CONFIG, getStaffDisplay,
} from '../../types/plan.types';
import MonthlyPlanItemModal from './MonthlyPlanItemModal';
import MonthlyPlanItemDetail from './MonthlyPlanItemDetail';
import { StepPickerModal } from './StepPickerModal';
import { useSlidePanel } from "../../context/SlidePanelContext";
import DataTable, { Column } from '../../components/ui/DataTable';
import { StatusBadge, BadgeVariant } from '../../components/ui';

const STATUS_CONFIG: Record<MonthlyTaskStatus, { icon: React.ReactNode; variant: BadgeVariant }> = {
    planned:    { icon: <Clock className="w-3.5 h-3.5" />,         variant: 'neutral' },
    completed:  { icon: <CheckCircle2 className="w-3.5 h-3.5" />,  variant: 'success' },
    incomplete: { icon: <XCircle className="w-3.5 h-3.5" />,       variant: 'danger' },
    partial:    { icon: <AlertCircle className="w-3.5 h-3.5" />,   variant: 'warning' },
    deferred:   { icon: <ArrowRight className="w-3.5 h-3.5" />,    variant: 'info' },
};

const MONTH_NAMES = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

type ViewMode = 'plan' | 'report';

interface MonthlyPlanPageProps {
    month?: number;
    year?: number;
    hideModeSelector?: boolean;
    leftElement?: React.ReactNode;
    department?: DepartmentCode;
}

const MonthlyPlanPage: React.FC<MonthlyPlanPageProps> = ({ month: externalMonth, year: externalYear, hideModeSelector, leftElement, department: externalDepartment }) => {
    const { state, actions } = useMonthlyPlan(externalMonth, externalYear, externalDepartment);
    const { openPanel, closePanel } = useSlidePanel();

    const {
        viewMode: stateViewMode, month, year, activeDept, currentPlan,
        items, summaries, loading, exporting,
        seedLoading, seedResult,
        sortedItems,
        // Step picker (sinh KH tháng từ các bước dự án)
        stepPickerOpen, stepPickerSteps, stepPickerLoading, scheduleLoading,
    } = state;

    const viewMode = hideModeSelector ? 'plan' : stateViewMode;

    const {
        setViewMode, setMonth, setYear, setActiveDept,
        setExporting, loadPlan,
        handleSeedFromAnnual,
        // Step picker actions
        handleOpenStepPicker,
        handleScheduleSteps,
        closeStepPicker,
        handleStatusChange, handleDelete
    } = actions;

    const columns: Column<MonthlyPlanItem>[] = useMemo(() => [
        {
            key: 'stt',
            header: 'STT',
            width: '50px',
            minWidth: '50px',
            maxWidth: '50px',
            align: 'center',
            className: 'w-[50px] min-w-[50px] max-w-[50px]',
            render: (_, __, idx) => <span className="tabular-nums text-xs text-slate-500">{idx + 1}</span>
        },
        {
            key: 'task_name',
            header: 'Nội dung công việc',
            width: '100%',
            minWidth: '280px',
            render: (_, item) => (
                <div className="flex flex-col gap-1 py-1">
                    <span className="text-sm font-medium text-slate-850 dark:text-slate-200 leading-snug">{item.task_name}</span>
                    {item.deliverable && <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{item.deliverable}</span>}
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
                                {item.project_name || 'Dự án'}
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
            minWidth: '120px',
            maxWidth: '120px',
            align: 'center',
            className: 'w-[120px] min-w-[120px] max-w-[120px]',
            render: (_, item) => <span className="text-xs text-slate-650 dark:text-slate-400">{item.deadline_note ?? '—'}</span>
        },
        {
            key: 'collaborating',
            header: 'Đơn vị phối hợp',
            width: '180px',
            minWidth: '180px',
            maxWidth: '180px',
            className: 'w-[180px] min-w-[180px] max-w-[180px]',
            render: (_, item) => {
                const codes = item.collaborating_dept_codes ?? [];
                const text = item.collaborating_text;
                if (codes.length === 0 && !text) return <span className="text-slate-400">—</span>;
                return (
                    <div className="flex flex-col gap-0.5 text-xs text-slate-700 dark:text-slate-300">
                        {codes.length > 0 && (
                            <span className="font-bold text-slate-750 dark:text-slate-200">
                                {codes.join(', ')}
                            </span>
                        )}
                        {text && (
                            <span className="text-[11px] text-slate-500 italic truncate" title={text}>
                                {text}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'status',
            header: 'Trạng thái',
            width: '140px',
            minWidth: '140px',
            maxWidth: '140px',
            align: 'center',
            className: 'w-[140px] min-w-[140px] max-w-[140px]',
            render: (_, item) => {
                const cfg = STATUS_CONFIG[item.status];
                if (viewMode === 'report') {
                    return (
                        <select
                            value={item.status}
                            onChange={e => handleStatusChange(item, e.target.value as MonthlyTaskStatus)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer w-full"
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
                        <StatusBadge
                            variant={cfg?.variant || 'neutral'}
                            label={MONTHLY_STATUS_LABELS[item.status]}
                            icon={cfg?.icon}
                        />
                    </div>
                );
            }
        },
        {
            key: 'actions',
            header: '',
            width: '80px',
            minWidth: '80px',
            maxWidth: '80px',
            align: 'center',
            className: 'w-[80px] min-w-[80px] max-w-[80px]',
            render: (_, item) => (
                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openFormPanel(item)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
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
            width: '50vw',
        });
    };

    const openDetailPanel = (item: MonthlyPlanItem) => {
        openPanel({
            component: (
                <MonthlyPlanItemDetail
                    item={item}
                    month={month}
                    year={year}
                    departmentCode={activeDept}
                    onEdit={() => openFormPanel(item)}
                    onDelete={() => {
                        handleDelete(item.id);
                        closePanel();
                    }}
                    onClose={closePanel}
                />
            ),
            title: 'Chi tiết nhiệm vụ',
            width: '50vw',
        });
    };

    return (
        <>
        <div className="flex flex-col h-full bg-transparent">
            {/* ── Thanh công cụ 1 hàng tối giản ── */}
            <div className="px-0 py-2.5 bg-transparent border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Trái: Segmented control Plan/Report + Dropdown chọn phòng ban */}
                <div className="flex items-center gap-2 flex-wrap flex-1">
                    {leftElement}
                    {/* Segmented control */}
                    {!hideModeSelector && (
                        <div className="flex bg-slate-150 dark:bg-slate-900 rounded-lg p-0.5 shadow-sm border border-slate-200/50 dark:border-slate-800 shrink-0">
                            {(['plan', 'report'] as ViewMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                        viewMode === mode 
                                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-305'
                                    }`}
                                >
                                    {mode === 'plan' ? 'Kế hoạch' : 'Báo cáo'}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Bộ lọc phòng ban Dropdown */}
                    {!hideModeSelector && (
                        <div className="relative">
                            <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                            <select
                                value={activeDept}
                                onChange={e => setActiveDept(e.target.value as DepartmentCode)}
                                className="pl-[26px] pr-7 py-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all max-w-[140px] font-bold"
                            >
                                {DEPARTMENT_CODES.map(code => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                        </div>
                    )}
                </div>

                {/* Phải: Toast seed kết quả + Các nút hành động */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Toast kết quả seed */}
                    {seedResult?.show && (
                        <span className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-bold animate-in fade-in duration-300 ${
                            seedResult.count > 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20'
                                : 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300 border border-warning-100 dark:border-warning-500/20'
                        }`}>
                            {seedResult.count > 0
                                ? `✓ Đã sinh ${seedResult.count} nhiệm vụ`
                                : `⚠ Không có nhiệm vụ mới`}
                        </span>
                    )}

                    {/* Xuất Excel */}
                    <button
                        onClick={async () => {
                            setExporting(true);
                            try {
                                const { exportMonthlyReport } = await import('./exportMonthlyReport');
                                await exportMonthlyReport(month, year);
                            }
                            catch (e) { console.error(e); }
                            finally { setExporting(false); }
                        }}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 hover:text-emerald-700 text-slate-650 dark:text-slate-350 disabled:opacity-50 transition-colors bg-white dark:bg-slate-800"
                        title="Xuất Excel"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{exporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
                    </button>

                    {viewMode === 'plan' && (
                        <>
                            {/* Sinh từ dự án */}
                            <button
                                onClick={handleOpenStepPicker}
                                disabled={stepPickerLoading || loading}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border border-violet-200 dark:border-violet-850 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-400 hover:border-violet-300 text-slate-655 dark:text-slate-350 disabled:opacity-50 transition-colors bg-white dark:bg-slate-800"
                                title="Sinh từ Dự án"
                            >
                                <FolderSync className={`w-3.5 h-3.5 ${stepPickerLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">{stepPickerLoading ? 'Đang tải...' : 'Sinh từ dự án'}</span>
                            </button>

                            {/* Sinh từ KH khung */}
                            <button
                                onClick={handleSeedFromAnnual}
                                disabled={seedLoading || loading}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 disabled:opacity-50 transition-colors bg-white dark:bg-slate-800"
                                title="Sinh từ KH khung"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${seedLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">{seedLoading ? 'Đang sinh...' : 'Sinh từ KH khung'}</span>
                            </button>

                            {/* Thêm nhiệm vụ */}
                            <button
                                onClick={() => openFormPanel(null)}
                                className="flex items-center gap-1.5 px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Thêm nhiệm vụ</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Thống kê tiến độ tinh gọn ── */}
            {viewMode === 'plan' && items.length > 0 && (
                <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0 mt-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="font-semibold text-slate-550 dark:text-slate-400">
                            Tổng NV: <strong className="text-slate-800 dark:text-white font-black">{stats.total}</strong>
                        </span>
                        <span className="text-slate-200 dark:text-slate-700">|</span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Hoàn thành: <strong>{stats.completed}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-red-550 dark:text-red-450 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Chưa HT: <strong className="text-red-650 dark:text-red-400">{stats.incomplete}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-slate-450 dark:text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-350 dark:bg-slate-600"></span>
                            Chưa báo cáo: <strong>{stats.planned}</strong>
                        </span>
                    </div>
                    
                    {stats.total > 0 && (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-150 dark:border-slate-700/80 w-full sm:w-auto self-stretch sm:self-auto shadow-sm">
                            <span className="font-medium text-slate-550 dark:text-slate-400">Tiến độ</span>
                            <div className="flex-1 sm:w-28 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.round((stats.completed / stats.total) * 100)}%` }}
                                />
                            </div>
                            <span className="font-black text-emerald-650 dark:text-emerald-400 w-8 text-right shrink-0">
                                {Math.round((stats.completed / stats.total) * 100)}%
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Nội dung ── */}
            <div className="flex-1 min-h-0 py-3 flex flex-col">
                {viewMode === 'report' ? (
                    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-slate-150 dark:border-slate-750 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                            <h3 className="text-xs font-bold text-slate-750 dark:text-slate-200 uppercase tracking-wider">
                                Tổng hợp kết quả {MONTH_NAMES[month]}/{year} — Toàn Ban
                            </h3>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 backdrop-blur text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm">
                                    <tr className="text-slate-500 dark:text-slate-400">
                                        <th className="px-4 py-2.5 text-left border-b border-slate-200 dark:border-slate-700">Phòng/Ban</th>
                                        <th className="px-4 py-2.5 text-center border-b border-slate-200 dark:border-slate-700">Tổng</th>
                                        <th className="px-4 py-2.5 text-center text-emerald-600 dark:text-emerald-500 border-b border-slate-200 dark:border-slate-700">Hoàn thành</th>
                                        <th className="px-4 py-2.5 text-center text-warning-550 dark:text-warning-400 border-b border-slate-200 dark:border-slate-700">Một phần</th>
                                        <th className="px-4 py-2.5 text-center text-red-550 dark:text-red-400 border-b border-slate-200 dark:border-slate-700">Chưa HT</th>
                                        <th className="px-4 py-2.5 text-center text-blue-550 dark:text-blue-450 border-b border-slate-200 dark:border-slate-700">Chuyển tháng</th>
                                        <th className="px-4 py-2.5 text-center border-b border-slate-200 dark:border-slate-700">Tỷ lệ HT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {summaries.map(s => (
                                        <tr key={s.department_code} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-xs">
                                            <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200">{s.department_name}</td>
                                            <td className="px-4 py-2.5 text-center text-slate-500 dark:text-slate-400">{s.total_tasks}</td>
                                            <td className="px-4 py-2.5 text-center text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-500/5 dark:bg-emerald-500/10">{s.completed}</td>
                                            <td className="px-4 py-2.5 text-center text-warning-600 dark:text-warning-400 font-medium">{s.partial}</td>
                                            <td className="px-4 py-2.5 text-center text-red-600 dark:text-red-450 font-medium bg-red-500/5 dark:bg-red-500/10">{s.incomplete}</td>
                                            <td className="px-4 py-2.5 text-center text-blue-600 dark:text-blue-450">{s.deferred}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                <StatusBadge
                                                    variant={s.completion_rate >= 80 ? 'success' : s.completion_rate >= 50 ? 'warning' : 'danger'}
                                                    label={`${s.completion_rate}%`}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {summaries.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                                                Chưa có dữ liệu báo cáo
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">Đang tải...</div>
                        ) : items.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
                                <CalendarDays className="w-10 h-10 opacity-30" />
                                <p className="text-xs">Chưa có nhiệm vụ nào trong tháng này</p>
                                <div className="flex flex-wrap gap-2 text-xs justify-center mt-2">
                                    <button onClick={handleOpenStepPicker} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors font-bold">
                                        <FolderSync className="w-3.5 h-3.5" /> Sinh từ dự án
                                    </button>
                                    <button onClick={handleSeedFromAnnual} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-655 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors font-bold">
                                        Sinh từ KH khung
                                    </button>
                                    <button onClick={() => openFormPanel(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-650 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors font-bold">
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
                                maxHeight="calc(100vh - 260px)"
                                onRowClick={openDetailPanel}
                                groupBy={(item) => item.source_type === 'project_step' ? 'Kế hoạch dự án' : item.source_type === 'from_annual' ? 'KH Khung năm' : 'Công việc khác'}
                                defaultExpandedGroups={true}
                                renderGroupHeader={(groupName, groupItems, isExpanded, toggle) => {
                                    if (groupName === 'Công việc khác') return null;
                                    return (
                                        <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50">
                                            <td colSpan={6} className="px-2 py-2">
                                                <button
                                                    onClick={toggle}
                                                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                        <FolderOpen className="w-4 h-4 text-primary-500" />
                                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-250">{groupName}</span>
                                                        <span className="text-[10px] font-bold bg-slate-250 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                                            {groupItems.length}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 pr-2">
                                                        <div className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            {groupItems.filter(i => i.status === 'completed').length} HT
                                                        </div>
                                                    </div>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Step Picker Modal — chọn bước dự án để đưa vào KH tháng */}
        <StepPickerModal
            isOpen={stepPickerOpen}
            onClose={closeStepPicker}
            steps={stepPickerSteps}
            loading={stepPickerLoading}
            scheduling={scheduleLoading}
            onConfirm={handleScheduleSteps}
            month={month}
            year={year}
        />
        </>
    );
};

export default MonthlyPlanPage;
