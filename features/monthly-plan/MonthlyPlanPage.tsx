import React, { useState, useEffect, useMemo } from 'react';
import {
    CalendarDays, Plus, ChevronDown, ChevronRight,
    CheckCircle2, XCircle, Clock, AlertCircle,
    ArrowRight, Edit2, Trash2, RefreshCw, Download, Link2, FolderOpen,
} from 'lucide-react';
import { exportMonthlyReport } from './exportMonthlyReport';
import { MonthlyPlanService, MonthlyPlanItemService } from '../../services/PlanService';
import {
    MonthlyPlan, MonthlyPlanItem, MonthlyTaskStatus,
    DepartmentCode, DEPARTMENT_CODES, DEPARTMENT_NAMES,
    MONTHLY_STATUS_LABELS, MonthlyReportSummary,
} from '../../types/plan.types';
import MonthlyPlanItemModal from './MonthlyPlanItemModal';
import MonthlyPlanItemDetail from './MonthlyPlanItemDetail';
import { useSlidePanel } from "../../context/SlidePanelContext";

const CURRENT_DATE = new Date();
const MONTH_NAMES = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const STATUS_CONFIG: Record<MonthlyTaskStatus, { icon: React.ReactNode; color: string; bg: string }> = {
    planned:    { icon: <Clock className="w-3.5 h-3.5" />,         color: 'text-slate-500',  bg: 'bg-slate-100' },
    completed:  { icon: <CheckCircle2 className="w-3.5 h-3.5" />,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    incomplete: { icon: <XCircle className="w-3.5 h-3.5" />,       color: 'text-red-500',    bg: 'bg-red-50' },
    partial:    { icon: <AlertCircle className="w-3.5 h-3.5" />,   color: 'text-amber-500',  bg: 'bg-amber-50' },
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
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MonthlyPlanItem | null>(null);
    const { openPanel, closePanel } = useSlidePanel();
    const [exporting, setExporting] = useState(false);
    const [seedLoading, setSeedLoading] = useState(false);
    const [seedResult, setSeedResult] = useState<{ count: number; show: boolean } | null>(null);

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
            const groups = new Set((detail.items ?? []).map(i => i.group_name ?? ''));
            setExpandedGroups(groups);
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
            setSeedResult({ count: seeded.length, show: true });
            // Ẩn thông báo sau 4 giây
            setTimeout(() => setSeedResult(null), 4000);
            await loadPlan();
        } catch (e) {
            console.error(e);
            alert('Có lỗi khi sinh nhiệm vụ. Vui lòng thử lại.');
        } finally {
            setSeedLoading(false);
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

    const groups = useMemo(() => {
        const map = new Map<string, MonthlyPlanItem[]>();
        for (const item of items) {
            const g = item.group_name ?? 'Công việc khác';
            if (!map.has(g)) map.set(g, []);
            map.get(g)!.push(item);
        }
        return map;
    }, [items]);

    const toggleGroup = (g: string) =>
        setExpandedGroups(prev => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; });

    const stats = useMemo(() => ({
        total: items.length,
        completed: items.filter(i => i.status === 'completed').length,
        incomplete: items.filter(i => i.status === 'incomplete').length,
        planned: items.filter(i => i.status === 'planned').length,
    }), [items]);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-indigo-600" />
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
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                                {seedResult.count > 0
                                    ? `✓ Đã sinh ${seedResult.count} nhiệm vụ từ KH khung`
                                    : '⚠ Không có nhiệm vụ mới nào (KH khung trống hoặc đã sinh hết)'}
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
                            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {MONTH_NAMES.slice(1).map((name, i) => (
                                <option key={i + 1} value={i + 1}>{name}</option>
                            ))}
                        </select>

                        {/* Năm */}
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {[year - 1, year, year + 1].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        {viewMode === 'plan' && (
                            <>
                                <button
                                    onClick={handleSeedFromAnnual}
                                    disabled={seedLoading || loading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Sinh từ KH khung"
                                >
                                    <RefreshCw className={`w-4 h-4 ${seedLoading ? 'animate-spin' : ''}`} />
                                    {seedLoading ? 'Đang sinh...' : 'Sinh từ KH khung'}
                                </button>
                                <button
                                    onClick={() => { setEditingItem(null); setModalOpen(true); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
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
                                activeDept === code ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                            <thead>
                                <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                                    <th className="px-3 py-2 text-left">Phòng/Ban</th>
                                    <th className="px-3 py-2 text-center">Tổng</th>
                                    <th className="px-3 py-2 text-center text-emerald-600">Hoàn thành</th>
                                    <th className="px-3 py-2 text-center text-amber-500">Một phần</th>
                                    <th className="px-3 py-2 text-center text-red-500">Chưa HT</th>
                                    <th className="px-3 py-2 text-center text-blue-500">Chuyển tháng</th>
                                    <th className="px-3 py-2 text-center">Tỷ lệ HT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {summaries.map(s => (
                                    <tr key={s.department_code} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-medium text-slate-700">{s.department_name}</td>
                                        <td className="px-3 py-2 text-center text-slate-600">{s.total_tasks}</td>
                                        <td className="px-3 py-2 text-center text-emerald-600 font-medium">{s.completed}</td>
                                        <td className="px-3 py-2 text-center text-amber-500">{s.partial}</td>
                                        <td className="px-3 py-2 text-center text-red-500">{s.incomplete}</td>
                                        <td className="px-3 py-2 text-center text-blue-500">{s.deferred}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`font-semibold ${
                                                s.completion_rate >= 80 ? 'text-emerald-600'
                                                : s.completion_rate >= 50 ? 'text-amber-500'
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
            <div className="flex-1 overflow-auto px-6 py-4">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Đang tải...</div>
                ) : groups.size === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <CalendarDays className="w-10 h-10 opacity-30" />
                        <p className="text-sm">Chưa có nhiệm vụ nào trong tháng này</p>
                        <div className="flex gap-2 text-sm">
                            <button onClick={handleSeedFromAnnual} className="text-indigo-600 hover:underline">
                                Sinh từ KH khung
                            </button>
                            <span className="text-slate-300">|</span>
                            <button onClick={() => { setEditingItem(null); setModalOpen(true); }} className="text-indigo-600 hover:underline">
                                Thêm thủ công
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Array.from(groups.entries()).map(([groupName, groupItems]) => (
                            <div key={groupName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <button
                                    onClick={() => toggleGroup(groupName)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-2">
                                        {expandedGroups.has(groupName)
                                            ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                            : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                        <span className="font-semibold text-sm text-slate-800">{groupName}</span>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{groupItems.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <span className="text-emerald-500">{groupItems.filter(i => i.status === 'completed').length} HT</span>
                                        <span>/</span>
                                        <span>{groupItems.length}</span>
                                    </div>
                                </button>

                                {expandedGroups.has(groupName) && (
                                    <div className="border-t border-slate-100 divide-y divide-slate-50">
                                        {groupItems.map((item, idx) => (
                                            <TaskRow
                                                key={item.id}
                                                idx={idx + 1}
                                                item={item}
                                                viewMode={viewMode}
                                                onStatusChange={handleStatusChange}
                                                onRowClick={() => {
                                                    openPanel(
                                                        <MonthlyPlanItemDetail
                                                            item={item}
                                                            month={month}
                                                            year={year}
                                                            onEdit={() => {
                                                                setEditingItem(item);
                                                                setModalOpen(true);
                                                                closePanel();
                                                            }}
                                                            onDelete={() => {
                                                                handleDelete(item.id);
                                                                closePanel();
                                                            }}
                                                            onClose={closePanel}
                                                            onAddTask={() => {
                                                                // Will implement later if needed
                                                            }}
                                                        />
                                                    );
                                                }}
                                                onEdit={() => { setEditingItem(item); setModalOpen(true); }}
                                                onDelete={() => handleDelete(item.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modal tạo/sửa ── */}
            {modalOpen && currentPlan && (
                <MonthlyPlanItemModal
                    monthlyPlanId={currentPlan.id}
                    month={month}
                    year={year}
                    departmentCode={activeDept}
                    item={editingItem}
                    onSaved={() => { setModalOpen(false); setEditingItem(null); loadPlan(); }}
                    onClose={() => { setModalOpen(false); setEditingItem(null); }}
                />
            )}
        </div>
    );
};

// ─── TaskRow component ────────────────────────────────────────

interface TaskRowProps {
    idx: number;
    item: MonthlyPlanItem;
    viewMode: ViewMode;
    onStatusChange: (item: MonthlyPlanItem, status: MonthlyTaskStatus) => void;
    onRowClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ idx, item, viewMode, onStatusChange, onRowClick, onEdit, onDelete }) => {
    const cfg = STATUS_CONFIG[item.status];
    return (
        <div
            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors group cursor-pointer"
            onClick={onRowClick}
        >
            <span className="text-xs text-slate-400 w-5 pt-0.5 flex-shrink-0">{idx}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 leading-snug">{item.task_name}</p>
                {item.deliverable && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.deliverable}</p>
                )}
                {viewMode === 'report' && item.status === 'incomplete' && item.incomplete_reason && (
                    <p className="text-xs text-red-500 mt-1 bg-red-50 px-2 py-1 rounded">
                        Lý do: {item.incomplete_reason}
                    </p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                    {item.annual_plan_item_id && (
                        <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                            <Link2 className="w-2.5 h-2.5" />KH khung
                        </span>
                    )}
                    {item.project_id && (
                        <span className="text-xs text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                            <FolderOpen className="w-2.5 h-2.5" />Dự án
                        </span>
                    )}
                </div>
            </div>

            {/* Thời hạn */}
            <span className="text-xs text-slate-500 w-20 flex-shrink-0 text-center">
                {item.deadline_note ?? '—'}
            </span>

            {/* Phụ trách */}
            <span className="text-xs text-slate-500 w-28 flex-shrink-0 truncate">
                {item.staff_name ?? '—'}
            </span>

            {/* Trạng thái */}
            {viewMode === 'report' ? (
                <select
                    value={item.status}
                    onChange={e => onStatusChange(item, e.target.value as MonthlyTaskStatus)}
                    className={`text-xs px-2 py-1 rounded-lg border-0 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 ${cfg.bg} ${cfg.color}`}
                >
                    {Object.entries(MONTHLY_STATUS_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                    ))}
                </select>
            ) : (
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                    {MONTHLY_STATUS_LABELS[item.status]}
                </span>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={onEdit} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default MonthlyPlanPage;
