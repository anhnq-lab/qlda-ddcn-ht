import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, ChevronDown, ChevronRight, Edit2, Trash2,
    BookOpen, Filter, Download, Upload, Calendar, Users, Building2
} from 'lucide-react';
import { AnnualPlanService } from '../../services/PlanService';
import {
    AnnualPlanItem, DepartmentCode, DEPARTMENT_CODES,
    DEPARTMENT_NAMES, FREQUENCY_LABELS, PlanFrequency,
} from '../../types/plan.types';
import AnnualPlanItemModal from './AnnualPlanItemModal';
import AnnualPlanItemDetail from './AnnualPlanItemDetail';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { useEmployeeOptions } from '../../hooks/usePlanData';
import DataTable, { Column as ColumnDef } from '../../components/ui/DataTable';

const CURRENT_YEAR = new Date().getFullYear();

const FREQ_BADGE: Record<PlanFrequency, { label: string; color: string }> = {
    one_time:  { label: 'Một lần',      color: 'bg-blue-100 text-blue-700' },
    monthly:   { label: 'Hàng tháng',   color: 'bg-green-100 text-green-700' },
    quarterly: { label: 'Hàng quý',     color: 'bg-purple-100 text-purple-700' },
    daily:     { label: 'Hàng ngày',    color: 'bg-warning-100 text-warning-700' },
    as_needed: { label: 'Phát sinh',    color: 'bg-slate-100 text-slate-600' },
};

const AnnualPlanPage: React.FC = () => {
    const { openPanel, closePanel } = useSlidePanel();
    const { options: employeeOptions } = useEmployeeOptions();
    const empMap = useMemo(() => {
        const m: Record<string, string> = {};
        for (const o of employeeOptions) m[String(o.value)] = o.label;
        return m;
    }, [employeeOptions]);

    const [year, setYear] = useState(CURRENT_YEAR);
    const [activeDept, setActiveDept] = useState<DepartmentCode>('HCTH');
    const [items, setItems] = useState<AnnualPlanItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadItems();
    }, [year, activeDept]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await AnnualPlanService.getByDepartment(year, activeDept);
            setItems(data);
            // Mở hết group khi load
            const groups = new Set(data.map(i => i.group_name ?? ''));
            setExpandedGroups(groups);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return items;
        const q = searchTerm.toLowerCase();
        return items.filter(i =>
            i.task_name.toLowerCase().includes(q) ||
            (i.group_name ?? '').toLowerCase().includes(q) ||
            (i.deliverable ?? '').toLowerCase().includes(q)
        );
    }, [items, searchTerm]);

    // Nhóm theo group_name
    const groups = useMemo(() => {
        const map = new Map<string, AnnualPlanItem[]>();
        for (const item of filtered) {
            const g = item.group_name ?? 'Khác';
            if (!map.has(g)) map.set(g, []);
            map.get(g)!.push(item);
        }
        return map;
    }, [filtered]);

    const toggleGroup = (g: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            next.has(g) ? next.delete(g) : next.add(g);
            return next;
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa nhiệm vụ này?')) return;
        await AnnualPlanService.delete(id);
        loadItems();
    };

    const openFormPanel = (item: AnnualPlanItem | null) => {
        openPanel({
            title: item ? 'Sửa nhiệm vụ KH khung' : 'Thêm nhiệm vụ KH khung',
            component: (
                <AnnualPlanItemModal
                    year={year}
                    departmentCode={activeDept}
                    departmentName={DEPARTMENT_NAMES[activeDept]}
                    item={item}
                    onSaved={() => { closePanel(); loadItems(); }}
                    onClose={closePanel}
                />
            ),
        });
    };

    const openDetailPanel = (item: AnnualPlanItem) => {
        openPanel({
            title: item.task_name.length > 35 ? item.task_name.slice(0, 35) + '…' : item.task_name,
            component: (
                <AnnualPlanItemDetail
                    item={item}
                    year={year}
                    onEdit={() => openFormPanel(item)}
                    onDelete={() => { handleDelete(item.id); closePanel(); }}
                    onClose={closePanel}
                />
            ),
        });
    };

    const columns = useMemo<ColumnDef<AnnualPlanItem>[]>(() => [
        {
            key: 'stt',
            header: 'STT',
            width: '3rem',
            align: 'center',
            render: (_, __, idx) => <span className="tabular-nums text-xs text-slate-500">{idx + 1}</span>
        },
        {
            key: 'task_name',
            header: 'Nội dung nhiệm vụ',
            render: (_, item) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-800 dark:text-slate-200 leading-snug">{item.task_name}</span>
                    {item.project_id && (
                        <span className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded inline-flex w-fit items-center gap-0.5 font-medium border border-blue-100 dark:border-blue-500/20">
                            Dự án
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'deliverable',
            header: 'Sản phẩm đầu ra',
            width: '12rem',
            render: (_, item) => <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{item.deliverable ?? '—'}</span>
        },
        {
            key: 'start_period',
            header: 'Bắt đầu',
            width: '6rem',
            align: 'center',
            render: (_, item) => <span className="text-xs text-slate-600 dark:text-slate-400">{item.start_period ?? '—'}</span>
        },
        {
            key: 'end_period',
            header: 'Kết thúc',
            width: '6rem',
            align: 'center',
            render: (_, item) => <span className="text-xs text-slate-600 dark:text-slate-400">{item.end_period ?? '—'}</span>
        },
        {
            key: 'frequency',
            header: 'Tần suất',
            width: '7rem',
            align: 'center',
            render: (_, item) => {
                const badge = item.frequency ? FREQ_BADGE[item.frequency] : null;
                if (!badge) return <span className="text-xs text-slate-400">—</span>;
                return (
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${badge.color.replace('bg-', 'bg-opacity-10 bg-').replace('text-', 'text-')}`}>
                        {badge.label}
                    </span>
                );
            }
        },
        {
            key: 'responsible',
            header: 'Phụ trách',
            width: '10rem',
            render: (_, item) => (
                item.responsible_ids && item.responsible_ids.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {item.responsible_ids.map(id => (
                            <span key={id} className="inline-block text-[11px] bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300 px-1.5 py-0.5 rounded-full font-medium leading-tight">
                                {empMap[id] ? empMap[id].split(' ').pop() : id}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-xs text-slate-400">{item.responsible_text ?? '—'}</span>
                )
            )
        },
        {
            key: 'notes',
            header: 'Ghi chú',
            width: '12rem',
            render: (_, item) => <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{item.notes ?? '—'}</span>
        },
        {
            key: 'actions',
            header: '',
            width: '4rem',
            align: 'right',
            render: (_, item) => (
                <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => openFormPanel(item)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 rounded-lg transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ], [empMap]);

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* ── Header ── */}
            <div className="bg-transparent border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Kế hoạch khung năm</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Chương trình công tác thường xuyên của các phòng</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Chọn năm */}
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                                <option key={y} value={y}>Năm {y}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => openFormPanel(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm nhiệm vụ
                        </button>
                    </div>
                </div>

                {/* Tab phòng */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                    {DEPARTMENT_CODES.map(code => (
                        <button
                            key={code}
                            onClick={() => setActiveDept(code)}
                            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                activeDept === code
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {code}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Thanh công cụ ── */}
            <div className="px-6 py-3 bg-transparent border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm nhiệm vụ..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate- text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{DEPARTMENT_NAMES[activeDept]}</span>
                    <span>·</span>
                    <span>{items.length} nhiệm vụ</span>
                </div>
            </div>

            {/* ── Nội dung ── */}
            <div className="flex-1 px-6 py-4 flex flex-col min-h-0">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-sm">
                        Đang tải...
                    </div>
                ) : groups.size === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 dark:text-slate-500">
                        <BookOpen className="w-10 h-10 opacity-30" />
                        <p className="text-sm">Chưa có nhiệm vụ nào trong kế hoạch khung năm {year}</p>
                        <button
                            onClick={() => openFormPanel(null)}
                            className="text-primary-600 dark:text-primary-400 text-sm hover:underline"
                        >
                            Thêm nhiệm vụ đầu tiên
                        </button>
                    </div>
                ) : (
                    <DataTable
                        data={filtered}
                        columns={columns}
                        keyExtractor={item => item.id}
                        stickyHeader
                        maxHeight="calc(100vh - 260px)"
                        onRowClick={openDetailPanel}
                        groupBy={(item) => item.group_name || 'Khác'}
                        defaultExpandedGroups={true}
                        renderGroupHeader={(groupName, groupItems, isExpanded, toggle) => (
                            <tr
                                className="bg-slate-50/80 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-800"
                                onClick={toggle}
                            >
                                <td colSpan={9} className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {groupName}
                                        </span>
                                        <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-medium">
                                            {groupItems.length}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    />
                )}
            </div>

        </div>
    );
};

export default AnnualPlanPage;
