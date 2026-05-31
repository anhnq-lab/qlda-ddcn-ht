import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, ChevronDown, ChevronRight, Edit2, Trash2,
    BookOpen, Filter, Download, Upload, Calendar, Users, Building2, X, Layers
} from 'lucide-react';
import { AnnualPlanService, MonthlyPlanService } from '../../services/PlanService';
import {
    AnnualPlanItem, DepartmentCode, DEPARTMENT_CODES,
    DEPARTMENT_NAMES, FREQUENCY_LABELS, PlanFrequency,
} from '../../types/plan.types';
import AnnualPlanItemModal from './AnnualPlanItemModal';
import AnnualPlanItemDetail from './AnnualPlanItemDetail';
import MonthlyPlanItemModal from '../monthly-plan/MonthlyPlanItemModal';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { useEmployeeOptions } from '../../hooks/usePlanData';
import { useAuth } from '../../context/AuthContext';
import DataTable, { Column as ColumnDef } from '../../components/ui/DataTable';
import { formatPeriod } from '../../utils/format';
import { useTabSearchParam } from '../../hooks/useTabSearchParam';

const CURRENT_YEAR = new Date().getFullYear();

const FREQ_BADGE: Record<PlanFrequency, { label: string; color: string }> = {
    one_time:  { label: 'Một lần',      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
    monthly:   { label: 'Hàng tháng',   color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' },
    quarterly: { label: 'Hàng quý',     color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' },
    daily:     { label: 'Hàng ngày',    color: 'bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400' },
    as_needed: { label: 'Phát sinh',    color: 'bg-bg-muted text-txt-muted' },
};

interface AnnualPlanPageProps {
    year?: number;
    hideDeptSelector?: boolean;
    departmentCode?: DepartmentCode | 'All';
    filterProject?: string;
    filterTaskType?: string;
    filterStatus?: string;
}

const AnnualPlanPage: React.FC<AnnualPlanPageProps> = ({ 
    year: externalYear, 
    hideDeptSelector, 
    departmentCode: externalDepartment,
    filterProject = 'All',
    filterTaskType = 'All',
    filterStatus = 'All'
}) => {
    const { openPanel, closePanel } = useSlidePanel();
    const { options: employeeOptions } = useEmployeeOptions();
    const { currentUser } = useAuth();

    const empMap = useMemo(() => {
        const m: Record<string, string> = {};
        for (const o of employeeOptions) m[String(o.value)] = o.label;
        return m;
    }, [employeeOptions]);

    const [localYear, setLocalYear] = useState(CURRENT_YEAR);
    const year = externalYear !== undefined ? externalYear : localYear;
    const setYear = externalYear !== undefined ? () => {} : setLocalYear;
    const [activeDeptState, setActiveDept] = useTabSearchParam<DepartmentCode | 'All'>('HCTH', [...DEPARTMENT_CODES, 'All'] as const, 'dept');
    const activeDept = externalDepartment !== undefined ? externalDepartment : activeDeptState;
    const [items, setItems] = useState<AnnualPlanItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const isLeadership = useMemo(() => {
        const pos = currentUser?.Position?.toLowerCase() || '';
        return pos.includes('giám đốc') || currentUser?.Role === 'Admin';
    }, [currentUser]);

    const isDeptHead = useMemo(() => {
        if (activeDept === 'All') return false;
        return currentUser?.Role === 'Manager' && currentUser?.Department === DEPARTMENT_NAMES[activeDept as DepartmentCode];
    }, [currentUser, activeDept]);

    const canSubmit = isDeptHead || currentUser?.Role === 'Admin';

    const planStatus = useMemo(() => {
        return items.length > 0 ? items[0].approval_status || 'draft' : 'draft';
    }, [items]);

    const rejectedReason = useMemo(() => {
        return items.length > 0 ? items[0].rejected_reason : null;
    }, [items]);

    const handleSubmitPlan = async () => {
        if (activeDept === 'All') return;
        if (!confirm(`Bạn có chắc chắn muốn gửi duyệt kế hoạch năm ${year} của phòng ${DEPARTMENT_NAMES[activeDept as DepartmentCode]}?`)) return;
        try {
            await AnnualPlanService.submitForApproval(year, activeDept as DepartmentCode, currentUser?.EmployeeID || '');
            alert('Đã gửi duyệt kế hoạch thành công.');
            loadItems();
        } catch (e: any) {
            alert(`Lỗi: ${e.message || 'Không thể gửi duyệt'}`);
        }
    };

    const handleApprovePlan = async () => {
        if (activeDept === 'All') return;
        if (!confirm(`Phê duyệt kế hoạch năm ${year} của phòng ${DEPARTMENT_NAMES[activeDept as DepartmentCode]}?`)) return;
        try {
            await AnnualPlanService.approve(year, activeDept as DepartmentCode, currentUser?.EmployeeID || '');
            alert('Đã phê duyệt kế hoạch thành công.');
            loadItems();
        } catch (e: any) {
            alert(`Lỗi: ${e.message || 'Không thể phê duyệt'}`);
        }
    };

    const handleRejectPlan = async () => {
        if (activeDept === 'All') return;
        const reason = prompt('Nhập lý do từ chối phê duyệt:');
        if (reason === null) return;
        if (!reason.trim()) {
            alert('Vui lòng nhập lý do từ chối.');
            return;
        }
        try {
            await AnnualPlanService.reject(year, activeDept as DepartmentCode, currentUser?.EmployeeID || '', reason.trim());
            alert('Đã từ chối phê duyệt kế hoạch.');
            loadItems();
        } catch (e: any) {
            alert(`Lỗi: ${e.message || 'Không thể thực hiện'}`);
        }
    };
    
    // Month selection state for creating monthly tasks
    const [monthSelectOpen, setMonthSelectOpen] = useState(false);
    const [selectedAnnualItem, setSelectedAnnualItem] = useState<AnnualPlanItem | null>(null);
    const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth() + 1);
    const [isCreatingMonthly, setIsCreatingMonthly] = useState(false);

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
        let res = items;
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            res = res.filter(i =>
                i.task_name.toLowerCase().includes(q) ||
                (i.group_name ?? '').toLowerCase().includes(q) ||
                (i.deliverable ?? '').toLowerCase().includes(q)
            );
        }

        // Lọc theo Dự án dùng chung
        if (filterProject !== 'All') {
            res = res.filter(i => i.project_id === filterProject);
        }

        // Lọc theo Loại công việc dùng chung
        if (filterTaskType !== 'All') {
            res = res.filter(i => {
                if (filterTaskType === 'project') return !!i.project_id || i.source_type === 'from_project_task';
                if (filterTaskType === 'internal') return !i.project_id && i.source_type !== 'from_project_task';
                return true;
            });
        }

        return res;
    }, [items, searchTerm, filterProject, filterTaskType]);

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
                    departmentCode={activeDept as DepartmentCode}
                    departmentName={activeDept === 'All' ? 'Tất cả phòng ban' : DEPARTMENT_NAMES[activeDept as DepartmentCode]}
                    item={item}
                    onSaved={() => { closePanel(); loadItems(); }}
                    onClose={closePanel}
                />
            ),
            width: '50vw',
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
                    onCreateMonthlyTask={(selectedItem) => {
                        setSelectedAnnualItem(selectedItem);
                        let suggestedMonth = new Date().getMonth() + 1;
                        if (selectedItem.start_period) {
                            const match = selectedItem.start_period.match(/\d+/);
                            if (match) suggestedMonth = parseInt(match[0], 10);
                        }
                        setTargetMonth(suggestedMonth);
                        setMonthSelectOpen(true);
                    }}
                />
            ),
            width: '50vw',
        });
    };

    const handleConfirmMonth = async () => {
        if (!selectedAnnualItem) return;
        setIsCreatingMonthly(true);
        try {
            const monthlyPlan = await MonthlyPlanService.getOrCreate(
                targetMonth,
                year,
                activeDept as DepartmentCode,
                activeDept === 'All' ? 'Tất cả phòng ban' : DEPARTMENT_NAMES[activeDept as DepartmentCode]
            );
            
            setMonthSelectOpen(false);
            closePanel();
            
            setTimeout(() => {
                openPanel({
                    title: `Thêm nhiệm vụ KH tháng ${targetMonth}/${year}`,
                    component: (
                        <MonthlyPlanItemModal
                            monthlyPlanId={monthlyPlan.id}
                            month={targetMonth}
                            year={year}
                            departmentCode={activeDept as DepartmentCode}
                            item={null}
                            initialAnnualPlanItem={selectedAnnualItem}
                            onSaved={() => {
                                closePanel();
                            }}
                            onClose={closePanel}
                        />
                    ),
                    width: '50vw',
                });
            }, 150);
        } catch (e) {
            console.error('Lỗi khi khởi tạo kế hoạch tháng:', e);
            alert('Có lỗi xảy ra khi khởi tạo kế hoạch tháng.');
        } finally {
            setIsCreatingMonthly(false);
        }
    };

    const columns = useMemo<ColumnDef<AnnualPlanItem>[]>(() => [
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
            header: 'Nội dung nhiệm vụ',
            width: '105%',
            minWidth: '280px',
            render: (_, item) => (
                <div className="flex flex-col">
                    <span className="font-medium text-txt-primary leading-snug">{item.task_name}</span>
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
            width: '180px',
            minWidth: '180px',
            maxWidth: '180px',
            className: 'w-[180px] min-w-[180px]',
            render: (_, item) => <span className="text-xs text-txt-muted leading-snug">{item.deliverable ?? '—'}</span>
        },
        {
            key: 'start_period',
            header: 'Bắt đầu',
            width: '90px',
            minWidth: '90px',
            maxWidth: '90px',
            align: 'center',
            className: 'w-[90px] min-w-[90px] max-w-[90px]',
            render: (_, item) => <span className="text-xs text-txt-muted">{formatPeriod(item.start_period)}</span>
        },
        {
            key: 'end_period',
            header: 'Kết thúc',
            width: '90px',
            minWidth: '90px',
            maxWidth: '90px',
            align: 'center',
            className: 'w-[90px] min-w-[90px] max-w-[90px]',
            render: (_, item) => <span className="text-xs text-txt-muted">{formatPeriod(item.end_period)}</span>
        },
        {
            key: 'frequency',
            header: 'Tần suất',
            width: '100px',
            minWidth: '100px',
            maxWidth: '100px',
            align: 'center',
            className: 'w-[100px] min-w-[100px] max-w-[100px]',
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
            key: 'collaborating',
            header: 'Phòng phối hợp',
            width: '160px',
            minWidth: '160px',
            maxWidth: '160px',
            className: 'w-[160px] min-w-[160px]',
            render: (_, item) => {
                if (item.collaborating_dept_codes && item.collaborating_dept_codes.length > 0) {
                    return (
                        <div className="flex flex-wrap gap-1">
                            {item.collaborating_dept_codes.map(code => (
                                <span key={code} className="inline-block text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-medium leading-tight">
                                    {code}
                                </span>
                            ))}
                        </div>
                    );
                }
                return <span className="text-xs text-slate-400">{item.collaborating_text ?? '—'}</span>;
            }
        },
        {
            key: 'notes',
            header: 'Ghi chú',
            width: '180px',
            minWidth: '180px',
            maxWidth: '180px',
            className: 'w-[180px] min-w-[180px]',
            render: (_, item) => <span className="text-xs text-txt-muted leading-snug">{item.notes ?? '—'}</span>
        },
        {
            key: 'actions',
            header: '',
            width: '70px',
            minWidth: '70px',
            maxWidth: '70px',
            align: 'right',
            className: 'w-[70px] min-w-[70px] max-w-[70px]',
            render: (_, item) => {
                const canEditItem = planStatus === 'draft' || planStatus === 'rejected' || currentUser?.Role === 'Admin';
                if (!canEditItem) return null;
                return (
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => openFormPanel(item)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 rounded-lg transition-colors cursor-pointer"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            }
        }
    ], [empMap, planStatus, currentUser]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'submitted':
                return <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-900/50">Chờ phê duyệt</span>;
            case 'approved':
                return <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-900/50">Đã phê duyệt</span>;
            case 'rejected':
                return <span className="px-2.5 py-1 text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 rounded-full border border-red-200 dark:border-red-900/50">Bị từ chối</span>;
            default:
                return <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full border border-border">Bản nháp</span>;
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* ── Thanh công cụ 1 hàng tối giản ── */}
            <div className="px-0 py-2.5 bg-transparent border-b border-border-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Trái: Tìm kiếm + Dropdown phòng ban */}
                <div className="flex items-center gap-2 flex-wrap flex-1">
                    {/* Tìm kiếm */}
                    <div className="relative w-full max-w-[200px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt-placeholder pointer-events-none" />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Tìm nhiệm vụ..."
                            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-txt-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                        />
                    </div>

                    {/* Bộ lọc phòng ban Dropdown */}
                    {!hideDeptSelector && (
                        <div className="relative">
                            <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                            <select
                                value={activeDept}
                                onChange={e => setActiveDept(e.target.value as DepartmentCode)}
                                className="pl-[26px] pr-7 py-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all max-w-[140px] font-bold"
                            >
                                {DEPARTMENT_CODES.map(code => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                        </div>
                    )}
                </div>

                {/* Phải: Thống kê nhiệm vụ phòng + Chọn năm + Nút Thêm */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-txt-muted font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-750 dark:text-slate-350">{activeDept === 'All' ? 'Tất cả phòng ban' : DEPARTMENT_NAMES[activeDept as DepartmentCode]}</span>
                        <span>·</span>
                        <span className="font-bold text-primary-600 dark:text-primary-400">{items.length} nhiệm vụ</span>
                    </div>

                    {/* Status Badge */}
                    {items.length > 0 && getStatusBadge(planStatus)}

                    {/* Chọn năm */}
                    {!externalYear && (
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="text-xs font-bold border border-border rounded-lg px-2.5 py-1 bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                        >
                            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                                <option key={y} value={y}>Năm {y}</option>
                            ))}
                        </select>
                    )}

                    {activeDept !== 'All' && (
                        <>
                            {/* Action buttons based on status & role */}
                            {items.length > 0 && (planStatus === 'draft' || planStatus === 'rejected') && canSubmit && (
                                <button
                                    onClick={handleSubmitPlan}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                                >
                                    Gửi duyệt KH
                                </button>
                            )}

                            {planStatus === 'submitted' && isLeadership && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={handleApprovePlan}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                                    >
                                        Duyệt KH
                                    </button>
                                    <button
                                        onClick={handleRejectPlan}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-650 hover:bg-red-750 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                                    >
                                        Từ chối
                                    </button>
                                </div>
                            )}

                            {/* Thêm nhiệm vụ only allowed in draft or rejected, or for admin */}
                            {((planStatus === 'draft' || planStatus === 'rejected') || currentUser?.Role === 'Admin') && (
                                <button
                                    onClick={() => openFormPanel(null)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-sm cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Thêm nhiệm vụ</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Rejection Banner */}
            {planStatus === 'rejected' && rejectedReason && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400 flex flex-col gap-1 shadow-sm shrink-0">
                    <span className="font-bold">Lý do từ chối phê duyệt:</span>
                    <span>{rejectedReason}</span>
                </div>
            )}

            {/* ── Nội dung ── */}
            <div className="flex-1 px-0 py-4 flex flex-col min-h-0">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-txt-placeholder text-sm">
                        Đang tải...
                    </div>
                ) : groups.size === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-txt-placeholder">
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
                                className="bg-slate-50/80 dark:bg-slate-800 cursor-pointer hover:bg-bg-muted transition-colors border-b border-border"
                                onClick={toggle}
                            >
                                <td colSpan={9} className="px-4 py-2.5 border-t border-border">
                                    <div className="flex items-center gap-2">
                                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        <span className="text-sm font-semibold text-txt-primary">
                                            {groupName}
                                        </span>
                                        <span className="text-xs text-txt-muted bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-medium">
                                            {groupItems.length}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    />
                )}
            </div>

            {/* Month Selection Modal */}
            {monthSelectOpen && selectedAnnualItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-bg-surface border border-border-subtle shadow-2xl rounded-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                            <h3 className="font-bold text-slate-850 dark:text-slate-100 text-base">Chọn tháng lập kế hoạch</h3>
                            <button 
                                onClick={() => setMonthSelectOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-bg-muted hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="p-5 space-y-4">
                            <div>
                                <p className="text-xs text-txt-placeholder uppercase font-black tracking-wider mb-1">Nhiệm vụ khung năm</p>
                                <p className="text-sm font-bold text-slate-750 dark:text-slate-200 leading-snug">{selectedAnnualItem.task_name}</p>
                            </div>
                            
                            {selectedAnnualItem.start_period && (
                                <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 rounded-xl p-3 text-xs text-blue-600 dark:text-blue-400 leading-relaxed flex items-center gap-2">
                                    <span className="text-base leading-none">ℹ️</span>
                                    <span>Nhiệm vụ này dự kiến thực hiện trong khoảng: <strong>{formatPeriod(selectedAnnualItem.start_period)} - {formatPeriod(selectedAnnualItem.end_period)}</strong>.</span>
                                </div>
                            )}

                            <div>
                                <p className="text-xs text-txt-placeholder uppercase font-black tracking-wider mb-3">Chọn tháng áp dụng</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                                        const isSelected = targetMonth === m;
                                        // Kiểm tra xem tháng này có nằm trong khoảng dự kiến không (nếu có định dạng Tháng X)
                                        let inPeriod = true;
                                        if (selectedAnnualItem.start_period && selectedAnnualItem.end_period) {
                                            const startMatch = selectedAnnualItem.start_period.match(/\d+/);
                                            const endMatch = selectedAnnualItem.end_period.match(/\d+/);
                                            if (startMatch && endMatch) {
                                                const start = parseInt(startMatch[0], 10);
                                                const end = parseInt(endMatch[0], 10);
                                                inPeriod = m >= start && m <= end;
                                            }
                                        }

                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setTargetMonth(m)}
                                                className={`py-2 px-3 text-sm rounded-xl font-bold transition-all relative ${
                                                    isSelected
                                                        ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-500/20'
                                                        : inPeriod
                                                            ? 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-805 dark:border-slate-750 dark:text-slate-300 dark:hover:bg-slate-750'
                                                            : 'bg-white border border-slate-100 text-slate-400 hover:bg-bg-subtle dark:border-slate-800 dark:text-slate-500 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                T. {m}
                                                {inPeriod && !isSelected && (
                                                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-4 border-t border-border-subtle bg-slate-50 dark:bg-slate-805 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setMonthSelectOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-bg-muted rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-750"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmMonth}
                                disabled={isCreatingMonthly}
                                className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-1.5 animate-pulse-once"
                            >
                                {isCreatingMonthly ? 'Đang tạo...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AnnualPlanPage;
