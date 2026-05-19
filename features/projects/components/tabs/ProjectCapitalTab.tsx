import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProjectService from '../../../../services/ProjectService';
import { TaskService } from '../../../../services/TaskService';

import { formatCurrency } from '../../../../utils/format';
import { Disbursement, CapitalAllocation, CapitalPlan, Task } from '../../../../types';
import { DisbursementPlanItem } from '../../../../services/CapitalService';
import {
    Coins, TrendingUp, Wallet, AlertTriangle,
    Calendar, FileText, Landmark, DollarSign, FileDown,
    ArrowDownUp, Receipt, RefreshCcw, RotateCcw,
    Plus, Pencil, Trash2, CalendarRange, BookOpen,
    CheckCircle2, Clock, Send, Edit3, ChevronDown, ChevronRight
} from 'lucide-react';
import { CapitalPlanModal } from '../CapitalPlanModal';
import { DisbursementPlanModal } from '../DisbursementPlanModal';
import { DisbursementModal } from '../DisbursementModal';
import { ImportDisbursementModal } from '../ImportDisbursementModal';
import { StatCard } from '../../../../components/ui';
import { ProjectCapitalKPIDashboard } from './ProjectCapitalKPIDashboard';
import { EmptyState } from '../../../../components/ui/EmptyState';
import {
    APPROVAL_BADGES, SOURCE_COLORS, SOURCE_LABELS as SOURCE_LABELS_MAP,
    DISBURSEMENT_TYPE_LABELS, normalizeSource
} from '../../../../utils/capitalConstants';
import {
    useProjectCapitalSummary,
    useCreateCapitalPlan, useUpdateCapitalPlan, useDeleteCapitalPlan,
    useCreateDisbursement, useUpdateDisbursement, useDeleteDisbursement,
    useBulkSaveDisbursementPlans, useDeleteDisbursementPlan,
} from '../../../../hooks/useCapital';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend,
    ComposedChart, Line, Area
} from 'recharts';

interface ProjectCapitalTabProps {
    projectID: string;
}

// Color constants — Gold Theme
const COLORS = {
    tamUng: '#4a90e2',
    klht: '#357abd',
    thuHoi: '#996515',
    pending: '#D4A843',
    rejected: '#ef4444',
};

type CapitalSubTab = 'mid_term' | 'annual';

// APPROVAL_BADGES imported from capitalConstants

// SOURCE_COLORS, SOURCE_LABELS imported from capitalConstants
const SOURCE_LABELS: Record<string, string> = {
    'NSTW': 'NS Trung ương',
    'NSĐP': 'NS Địa phương',
    'ODA': 'ODA',
    'Khác': 'Khác',
};

const TYPE_LABELS = DISBURSEMENT_TYPE_LABELS;

type DisbursementFilter = 'all' | 'TamUng' | 'ThanhToanKLHT' | 'ThuHoiTamUng';

export const ProjectCapitalTab: React.FC<ProjectCapitalTabProps> = ({ projectID }) => {
    // Single source of truth cho dữ liệu giải ngân dự án
    const { data: capitalSummary, isLoading } = useProjectCapitalSummary(projectID);
    
    // Gán dữ liệu tương thích với UI hiện tại
    const capitalPlans = capitalSummary?.capitalPlans ?? [];
    const disbursementPlanData = capitalSummary?.disbursementPlans ?? [];

    // Project tasks for "Việc trong tháng" column
    const { data: projectTasks = [] } = useQuery({
        queryKey: ['project-tasks', projectID],
        queryFn: () => TaskService.getProjectTasks(projectID),
    });

    const [disbursementFilter, setDisbursementFilter] = useState<DisbursementFilter>('all');
    const [planYearFilter, setPlanYearFilter] = useState<number>(new Date().getFullYear());
    const [capitalSubTab, setCapitalSubTab] = useState<CapitalSubTab>('annual');
    const [expandedMidTermPlan, setExpandedMidTermPlan] = useState<string | null>(null);
    const [annualPeriodFilter, setAnnualPeriodFilter] = useState<string>('all');
    const [disbYearFilter, setDisbYearFilter] = useState<number | 'all'>('all');
    const [disbSourceFilter, setDisbSourceFilter] = useState<string>('all');

    // ── CRUD State ──
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<CapitalPlan | null>(null);
    const [disbModalOpen, setDisbModalOpen] = useState(false);
    const [editingDisb, setEditingDisb] = useState<Disbursement | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'plan' | 'disb' | 'disbPlan'; id: string } | null>(null);
    const [disbPlanModalOpen, setDisbPlanModalOpen] = useState(false);
    const [modalPlanType, setModalPlanType] = useState<CapitalSubTab>('annual');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // ── Mutations ──
    const createPlan = useCreateCapitalPlan();
    const updatePlan = useUpdateCapitalPlan();
    const deletePlan = useDeleteCapitalPlan();
    const createDisb = useCreateDisbursement();
    const updateDisb = useUpdateDisbursement();
    const deleteDisb = useDeleteDisbursement();
    const bulkSaveDisbPlan = useBulkSaveDisbursementPlans();
    const deleteDisbPlan = useDeleteDisbursementPlan();

    // ── Handlers: Capital Plans ──
    const handleSavePlan = (planData: Omit<CapitalPlan, 'PlanID'>) => {
        if (editingPlan) {
            updatePlan.mutate({ planId: editingPlan.PlanID, updates: planData, projectId: projectID }, {
                onSuccess: () => { setPlanModalOpen(false); setEditingPlan(null); },
            });
        } else {
            createPlan.mutate(planData, {
                onSuccess: () => { setPlanModalOpen(false); },
            });
        }
    };

    const handleEditPlan = (plan: CapitalPlan) => {
        setEditingPlan(plan);
        setPlanModalOpen(true);
    };

    // ── Handlers: Disbursements ──
    const handleSaveDisb = (disbData: Omit<Disbursement, 'DisbursementID'>) => {
        if (editingDisb) {
            updateDisb.mutate({ id: editingDisb.DisbursementID, updates: disbData, projectId: projectID }, {
                onSuccess: () => { setDisbModalOpen(false); setEditingDisb(null); },
            });
        } else {
            createDisb.mutate(disbData, {
                onSuccess: () => { setDisbModalOpen(false); },
            });
        }
    };

    const handleEditDisb = (d: Disbursement) => {
        setEditingDisb(d);
        setDisbModalOpen(true);
    };

    // ── Handlers: Monthly Disbursement Plans ──
    const handleSaveDisbPlans = (year: number, plans: { id?: string, month: number, plannedAmount: number, actualAmount: number, notes: string }[]) => {
        bulkSaveDisbPlan.mutate({ projectId: projectID, year, plans }, {
            onSuccess: () => {
                setDisbPlanModalOpen(false);
                if (planYearFilter !== year) setPlanYearFilter(year);
            }
        });
    };

    const handleEditDisbPlan = (d: DisbursementPlanItem) => {
        setPlanYearFilter(d.Year);
        setDisbPlanModalOpen(true);
    };

    // ── Handler: Delete ──
    const handleConfirmDelete = () => {
        if (!deleteConfirm) return;
        if (deleteConfirm.type === 'plan') {
            deletePlan.mutate({ planId: deleteConfirm.id, projectId: projectID }, {
                onSuccess: () => setDeleteConfirm(null),
            });
        } else if (deleteConfirm.type === 'disb') {
            deleteDisb.mutate({ id: deleteConfirm.id, projectId: projectID }, {
                onSuccess: () => setDeleteConfirm(null),
            });
        } else if (deleteConfirm.type === 'disbPlan') {
            deleteDisbPlan.mutate({ id: deleteConfirm.id, projectId: projectID }, {
                onSuccess: () => setDeleteConfirm(null),
            });
        }
    };

    // Safe destructure — hooks must always run regardless of data
    const allocations = capitalSummary?.capitalPlans ?? [];
    const disbursements = capitalSummary?.disbursements ?? [];
    const summary = capitalSummary?.summary ?? {
        totalInvestment: 0, totalAllocated: 0, totalDisbursed: 0,
        totalAdvance: 0, advanceRecovered: 0, advanceBalance: 0,
        completionPayment: 0, disbursementRate: 0, yearlyTarget: 0, yearlyDisbursed: 0,
    };

    // ── Computed Data ──
    const filteredDisbursements = disbursements.filter(d => {
        // 1. Filter by Type
        if (disbursementFilter !== 'all' && d.Type !== disbursementFilter) return false;
        
        // 2. Filter by Year
        if (disbYearFilter !== 'all') {
            const y = new Date(d.Date).getFullYear();
            if (y !== disbYearFilter) return false;
        }

        // 3. Filter by Source
        if (disbSourceFilter !== 'all') {
            const plan = capitalPlans.find(p => p.PlanID === d.CapitalPlanID);
            const source = plan?.Source || 'Khác';
            if (source !== disbSourceFilter) return false;
        }

        return true;
    });

    // Monthly chart data — stacked by type
    const monthlyChartData = useMemo(() => {
        const map = new Map<string, { month: string; tamUng: number; klht: number; thuHoi: number }>();
        disbursements.forEach(d => {
            if (d.Status !== 'Approved') return;
            const dt = new Date(d.Date);
            const key = `${dt.getFullYear()}-T${dt.getMonth() + 1}`;
            const label = `T${dt.getMonth() + 1}/${dt.getFullYear().toString().slice(2)}`;
            if (!map.has(key)) map.set(key, { month: label, tamUng: 0, klht: 0, thuHoi: 0 });
            const entry = map.get(key)!;
            if (d.Type === 'TamUng') entry.tamUng += d.Amount;
            else if (d.Type === 'ThanhToanKLHT') entry.klht += d.Amount;
            else if (d.Type === 'ThuHoiTamUng') entry.thuHoi += d.Amount;
        });
        return Array.from(map.values());
    }, [disbursements]);

    // Donut chart — allocations by source
    const sourceChartData = useMemo(() => {
        const map = new Map<string, number>();
        allocations.forEach(a => {
            // Chuẩn hóa nguồn vốn theo Luật ĐTC 58
            let sourceKey = normalizeSource(a.Source || 'NSĐP');
            map.set(sourceKey, (map.get(sourceKey) || 0) + a.Amount);
        });
        return Array.from(map.entries()).map(([source, value]) => ({
            name: SOURCE_LABELS[source] || source,
            value,
            color: SOURCE_COLORS[source] || '#6b7280',
        }));
    }, [allocations]);

    // ── Validation limits ──
    const totalMidTermAllocated = useMemo(() => capitalPlans.filter(p => p.PlanType === 'mid_term').reduce((s, p) => s + (p.Amount || 0), 0), [capitalPlans]);
    const getMidTermForYear = (year: number) => capitalPlans.find(p => p.PlanType === 'mid_term' && (p.PeriodStart || 0) <= year && (p.PeriodEnd || 0) >= year);
    const getAnnualAllocatedInPeriod = (periodStart: number, periodEnd: number, excludePlanId?: string) => {
        return capitalPlans.filter(p => p.PlanType === 'annual' && p.Year >= periodStart && p.Year <= periodEnd && p.PlanID !== excludePlanId).reduce((s, p) => s + (p.Amount || 0), 0);
    };
    // Calculate the max allowable for the currently open modal
    const modalMaxAllowable = useMemo(() => {
        if (modalPlanType === 'mid_term') {
            // Mid-term cannot exceed TMĐT (minus other mid-terms already allocated, excluding current edit)
            const otherMidTerms = capitalPlans.filter(p => p.PlanType === 'mid_term' && p.PlanID !== editingPlan?.PlanID).reduce((s, p) => s + (p.Amount || 0), 0);
            return Math.max(0, summary.totalInvestment - otherMidTerms);
        } else {
            // Annual: find the containing mid-term plan, subtract existing annuals
            const editYear = editingPlan?.Year || new Date().getFullYear();
            const midTerm = getMidTermForYear(editYear);
            if (!midTerm) return summary.totalInvestment; // fallback
            const existingAnnual = getAnnualAllocatedInPeriod(midTerm.PeriodStart || 0, midTerm.PeriodEnd || 0, editingPlan?.PlanID);
            return Math.max(0, midTerm.Amount - existingAnnual);
        }
    }, [capitalPlans, modalPlanType, editingPlan, summary.totalInvestment]);

    // Alerts
    const alerts = useMemo(() => {
        const result: { level: string; message: string; icon: React.ReactNode }[] = [];
        const currentMonth = new Date().getMonth() + 1;

        // Cảnh báo: Tổng KH trung hạn vượt TMĐT
        if (totalMidTermAllocated > summary.totalInvestment && summary.totalInvestment > 0) {
            result.push({
                level: 'high',
                message: `Tổng KH trung hạn (${formatCurrency(totalMidTermAllocated)}) vượt Tổng mức đầu tư (${formatCurrency(summary.totalInvestment)}).`,
                icon: <AlertTriangle className="w-4 h-4" />,
            });
        }

        // Cảnh báo: annual vượt mid-term
        capitalPlans.filter(p => p.PlanType === 'mid_term').forEach(midPlan => {
            const annualTotal = getAnnualAllocatedInPeriod(midPlan.PeriodStart || 0, midPlan.PeriodEnd || 0);
            if (annualTotal > midPlan.Amount) {
                result.push({
                    level: 'high',
                    message: `KH hằng năm giai đoạn ${midPlan.PeriodStart}–${midPlan.PeriodEnd} (${formatCurrency(annualTotal)}) vượt KH trung hạn (${formatCurrency(midPlan.Amount)}).`,
                    icon: <AlertTriangle className="w-4 h-4" />,
                });
            }
        });

        if (summary.disbursementRate < 50 && currentMonth >= 6) {
            result.push({
                level: 'high',
                message: `Tỷ lệ giải ngân mới đạt ${summary.disbursementRate}% — cần đẩy nhanh tiến độ hồ sơ thanh toán.`,
                icon: <AlertTriangle className="w-4 h-4" />,
            });
        }
        if (summary.advanceBalance > 0) {
            result.push({
                level: 'medium',
                message: `Số dư tạm ứng chưa thu hồi: ${formatCurrency(summary.advanceBalance)}. Cần hoàn tất nghiệm thu để thu hồi.`,
                icon: <RotateCcw className="w-4 h-4" />,
            });
        }
        if (summary.yearlyTarget > 0 && summary.yearlyDisbursed < summary.yearlyTarget * 0.3 && currentMonth >= 6) {
            result.push({
                level: 'medium',
                message: `Giải ngân năm nay mới đạt ${Math.round((summary.yearlyDisbursed / summary.yearlyTarget) * 100)}% kế hoạch.`,
                icon: <Calendar className="w-4 h-4" />,
            });
        }
        return result;
    }, [summary, capitalPlans, totalMidTermAllocated]);

    // Per-allocation disbursement rate — tính theo NĂM phát sinh
    const allocationWithRate = useMemo(() => {
        return allocations.map(a => {
            const disbursed = disbursements
                .filter(d => {
                    const dYear = new Date(d.Date).getFullYear();
                    // Ưu tiên match theo AllocationID, fallback theo năm
                    const matchPlan = d.CapitalPlanID === a.PlanID || d.AllocationID === (a as any).AllocationID;
                    const matchYear = dYear === a.Year;
                    return (matchPlan || matchYear) && d.Status === 'Approved' && d.Type !== 'ThuHoiTamUng';
                })
                // Tránh trùng lặp: chỉ lấy bút toán của đúng năm này
                .filter(d => new Date(d.Date).getFullYear() === a.Year)
                .reduce((s, d) => s + d.Amount, 0);
            const recovered = disbursements
                .filter(d => new Date(d.Date).getFullYear() === a.Year && d.Status === 'Approved' && d.Type === 'ThuHoiTamUng')
                .reduce((s, d) => s + d.Amount, 0);
            return { ...a, disbursed: disbursed - recovered, rate: a.Amount > 0 ? ((disbursed - recovered) / a.Amount) * 100 : 0 };
        });
    }, [allocations, disbursements]);

    // ── Monthly Disbursement Plan Data ──
    const planYears = useMemo(() => {
        const years = [...new Set(disbursementPlanData.map(d => d.Year))];
        return years.sort((a, b) => a - b);
    }, [disbursementPlanData]);

    // Auto-select current year or nearest available year on first load
    React.useEffect(() => {
        if (planYears.length > 0 && !planYears.includes(planYearFilter)) {
            const currentYear = new Date().getFullYear();
            const nearest = planYears.includes(currentYear) ? currentYear : planYears[0];
            setPlanYearFilter(nearest);
        }
    }, [planYears]);

    const filteredPlanData = useMemo(() => {
        return disbursementPlanData.filter(d => d.Year === planYearFilter);
    }, [disbursementPlanData, planYearFilter]);

    const planChartData = useMemo(() => {
        return filteredPlanData.map(d => ({
            label: `T${d.Month}`,
            planned: d.PlannedAmount,
            actual: d.ActualAmount,
            diff: d.PlannedAmount - d.ActualAmount,
            notes: d.Notes,
        }));
    }, [filteredPlanData]);

    const planSummary = useMemo(() => {
        const totalPlanned = filteredPlanData.reduce((s, d) => s + d.PlannedAmount, 0);
        const totalActual = filteredPlanData.reduce((s, d) => s + d.ActualAmount, 0);
        return {
            totalPlanned,
            totalActual,
            rate: totalPlanned > 0 ? (totalActual / totalPlanned * 100) : 0,
            months: filteredPlanData.length,
        };
    }, [filteredPlanData]);

    // Early returns AFTER all hooks
    if (isLoading) return <div className="p-4 text-center text-gray-500 dark:text-slate-400">Đang tải dữ liệu vốn...</div>;
    if (!capitalSummary) return <div className="p-4 text-center text-red-500 dark:text-red-400">Không có dữ liệu vốn</div>;

    return (
        <div className="space-y-6">
            {/* ════════════════════════════════════════════
                SECTION E — Cảnh báo rủi ro (Moved to top)
               ════════════════════════════════════════════ */}
            {alerts.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-3 border-b border-gray-200 dark:border-slate-700 bg-warning-50/50 dark:bg-warning-900/20">
                        <h3 className="text-sm font-bold text-warning-800 dark:text-warning-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Cảnh báo giải ngân
                        </h3>
                    </div>
                    <div className="p-4 space-y-2">
                        {alerts.map((a, i) => (
                            <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${a.level === 'high'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                                : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300'
                                }`}>
                                <div className="mt-0.5">{a.icon}</div>
                                <p className="text-sm font-medium">{a.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                SECTION A — KPI Dashboard (6 cards)
               ════════════════════════════════════════════ */}
            <ProjectCapitalKPIDashboard summary={summary} allocationsCount={allocations.length} />

            {/* ════════════════════════════════════════════
                SECTION B — Kế hoạch vốn (Tab: Trung hạn / Hàng năm) + Donut
               ════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Capital Plan Table with Sub-tabs */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-200/60 dark:bg-slate-800 p-1 rounded-xl items-center border border-gray-200/80 dark:border-slate-700">
                                <button
                                    onClick={() => setCapitalSubTab('mid_term')}
                                    className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${capitalSubTab === 'mid_term' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                >
                                    <CalendarRange className="w-3.5 h-3.5" /> Trung hạn
                                </button>
                                <button
                                    onClick={() => setCapitalSubTab('annual')}
                                    className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${capitalSubTab === 'annual' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                >
                                    <Calendar className="w-3.5 h-3.5" /> Hàng năm
                                </button>
                            </div>

                            {capitalSubTab === 'annual' && (
                                <select
                                    value={annualPeriodFilter}
                                    onChange={(e) => setAnnualPeriodFilter(e.target.value)}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs text-gray-700 dark:text-slate-300 font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                                >
                                    <option value="all">Tất cả giai đoạn</option>
                                    {capitalPlans.filter(p => p.PlanType === 'mid_term').sort((a, b) => (b.PeriodStart || 0) - (a.PeriodStart || 0)).map(p => (
                                        <option key={p.PlanID} value={p.PlanID}>Giai đoạn {p.PeriodStart}-{p.PeriodEnd}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <button
                            onClick={() => { setEditingPlan(null); setModalPlanType(capitalSubTab); setPlanModalOpen(true); }}
                            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" /> {capitalSubTab === 'mid_term' ? 'Nhập KH trung hạn' : 'Nhập KH hằng năm'}
                        </button>
                    </div>

                    {/* SUB-TAB: TRUNG HẠN */}
                    {capitalSubTab === 'mid_term' && (() => {
                        const midTermPlans = capitalPlans.filter(p => p.PlanType === 'mid_term').sort((a, b) => (a.PeriodStart || a.Year) - (b.PeriodStart || b.Year));
                        return (
                            <div className="p-4 space-y-3">
                                {midTermPlans.length === 0 ? (
                                <EmptyState
                                    icon={<CalendarRange className="w-12 h-12 text-gray-400 dark:text-slate-400" />}
                                    title="Chưa có KH vốn trung hạn"
                                    description={'Nhấn "Nhập KH trung hạn" để tạo giai đoạn 5 năm'}
                                    className="border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl"
                                />
                                ) : (
                                    midTermPlans.map(plan => {
                                        const isExpanded = expandedMidTermPlan === plan.PlanID;
                                        const linkedAnnual = allocations.filter(p => p.Year >= (plan.PeriodStart || 0) && p.Year <= (plan.PeriodEnd || 0)).sort((a, b) => a.Year - b.Year);
                                        const totalAnnualAllocated = linkedAnnual.reduce((s, p) => s + p.Amount, 0);
                                        const totalAnnualDisbursed = linkedAnnual.reduce((s, p) => s + (p.DisbursedAmount || 0), 0);
                                        const badge = APPROVAL_BADGES['approved'];
                                        const BadgeIcon = badge.icon;
                                        const disbRate = plan.Amount > 0 ? (totalAnnualDisbursed / plan.Amount) * 100 : 0;
                                        const canAddAnnual = linkedAnnual.length < ((plan.PeriodEnd || 0) - (plan.PeriodStart || 0) + 1);

                                        return (
                                            <div key={plan.PlanID} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                                <div
                                                    className="px-5 py-3 bg-gradient-to-r from-blue-50 to-primary-50 dark:from-blue-900/20 dark:to-primary-900/20 cursor-pointer hover:from-blue-100 hover:to-primary-100 dark:hover:from-blue-900/30 dark:hover:to-primary-900/30 transition-colors"
                                                    onClick={() => setExpandedMidTermPlan(isExpanded ? null : plan.PlanID)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-blue-600" />}
                                                            <div>
                                                                <h4 className="text-sm font-black text-gray-800 dark:text-slate-100">
                                                                    Giai đoạn {plan.PeriodStart}–{plan.PeriodEnd}
                                                                </h4>
                                                                <p className="text-[10px] text-gray-500 dark:text-slate-400">
                                                                    {plan.DecisionNumber} • {plan.DateAssigned ? new Date(plan.DateAssigned).toLocaleDateString('vi-VN') : ''} • {plan.Source}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                <p className="text-base font-black text-blue-700 dark:text-blue-400">{formatCurrency(plan.Amount)}</p>
                                                                <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                                                                    <div className="h-1.5 w-16 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(disbRate, 100)}%` }} />
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-gray-500">GN {disbRate.toFixed(1)}%</span>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}>
                                                                <BadgeIcon className="w-3 h-3" /> {badge.label}
                                                            </span>
                                                            <div className="flex gap-1 ml-1">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingPlan(plan); setModalPlanType('mid_term'); setPlanModalOpen(true); }}
                                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                                    title="Sửa KH trung hạn"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'plan', id: plan.PlanID }); }}
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                                    title="Xóa KH trung hạn"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                                        <div className="grid grid-cols-4 gap-3 mb-4">
                                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                                                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">Tổng KH trung hạn</p>
                                                                <p className="text-sm font-black text-blue-700 dark:text-blue-400 mt-1">{formatCurrency(plan.Amount)}</p>
                                                            </div>
                                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                                                                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">Đã giải ngân</p>
                                                                <p className="text-sm font-black text-emerald-600 mt-1">{formatCurrency(totalAnnualDisbursed)}</p>
                                                            </div>
                                                            <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
                                                                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">Đã phân bổ HN</p>
                                                                <p className="text-sm font-black text-primary-600 mt-1">{formatCurrency(totalAnnualAllocated)}</p>
                                                            </div>
                                                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                                                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">Chưa phân bổ</p>
                                                                <p className="text-sm font-black text-purple-600 mt-1">{formatCurrency(Math.max(0, plan.Amount - totalAnnualAllocated))}</p>
                                                            </div>
                                                        </div>

                                                        {plan.Notes && (
                                                            <div className="bg-bg-app dark:bg-slate-800 p-2.5 rounded-lg mb-4 text-xs text-gray-600 dark:text-slate-300 italic flex items-start gap-1.5">
                                                                <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                                                                <span>{plan.Notes}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between mb-2">
                                                            <h5 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">Phân bổ theo năm ({linkedAnnual.length} KH)</h5>
                                                            {canAddAnnual && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingPlan(null); setModalPlanType('annual'); setPlanModalOpen(true); }}
                                                                    className="text-blue-600 hover:text-blue-700 text-[10px] font-bold flex items-center gap-1 transition-colors"
                                                                >
                                                                    <Plus className="w-3 h-3" /> Nhập KH hằng năm
                                                                </button>
                                                            )}
                                                        </div>
                                                        {linkedAnnual.length > 0 ? (
                                                            <table className="w-full text-xs mb-4">
                                                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                                                                    <tr>
                                                                        <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Năm</th>
                                                                        <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">QĐ giao vốn</th>
                                                                        <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">Vốn giao</th>
                                                                        <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">Đã GN</th>
                                                                        <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">Tỷ lệ</th>
                                                                        <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400 w-16">Thao tác</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                                    {[...linkedAnnual].sort((a, b) => a.Year - b.Year).map(ap => {
                                                                        const apRate = ap.Amount > 0 ? ((ap.DisbursedAmount || 0) / ap.Amount) * 100 : 0;
                                                                        return (
                                                                            <tr key={ap.PlanID} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10">
                                                                                <td className="px-3 py-2 font-bold text-gray-800 dark:text-slate-100">{ap.Year}</td>
                                                                                <td className="px-3 py-2 text-gray-600 dark:text-slate-300">{ap.DecisionNumber || '—'}</td>
                                                                                <td className="px-3 py-2 text-right font-mono font-bold text-blue-700">{formatCurrency(ap.Amount)}</td>
                                                                                <td className="px-3 py-2 text-right font-mono text-emerald-600">{formatCurrency(ap.DisbursedAmount || 0)}</td>
                                                                                <td className="px-3 py-2 text-right">
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                                                        apRate >= 90 ? 'bg-emerald-100 text-emerald-600' :
                                                                                        apRate >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-warning-100 text-warning-600'
                                                                                    }`}>{apRate.toFixed(1)}%</span>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-right">
                                                                                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <button 
                                                                                            onClick={(e) => { 
                                                                                                e.stopPropagation(); 
                                                                                                const rawData = capitalPlans.find(raw => raw.PlanID === ap.PlanID); 
                                                                                                if(rawData) {
                                                                                                    setEditingPlan(rawData); 
                                                                                                    setModalPlanType('annual');
                                                                                                    setPlanModalOpen(true); 
                                                                                                }
                                                                                            }} 
                                                                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                                                                        >
                                                                                            <Edit3 className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'plan', id: ap.PlanID }); }} 
                                                                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                                                                        >
                                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        ) : (
                                                            <div className="text-center py-4 text-gray-400 text-[10px]">Chưa có KH hàng năm trong giai đoạn này</div>
                                                        )}


                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}

                                {/* Legal reference */}
                                                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 rounded-lg p-2.5">
                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                        <strong>Căn cứ:</strong> Luật ĐTC 58/2024/QH15 (Đ.49-55), sửa đổi bởi Luật 90/2025/QH15
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* SUB-TAB: HÀNG NĂM (bảng cũ) */}
                    {capitalSubTab === 'annual' && (() => {
                        let filteredAnnualPlans = [...allocationWithRate];
                        if (annualPeriodFilter !== 'all') {
                            const selectedMidTerm = capitalPlans.find(p => p.PlanID === annualPeriodFilter);
                            if (selectedMidTerm) {
                                filteredAnnualPlans = filteredAnnualPlans.filter(a => a.Year >= (selectedMidTerm.PeriodStart || 0) && a.Year <= (selectedMidTerm.PeriodEnd || 0));
                            }
                        }
                        
                        const totalAnnualPlanAmount = filteredAnnualPlans.reduce((s, p) => s + p.Amount, 0);
                        const totalAnnualDisbursed = filteredAnnualPlans.reduce((s, p) => s + p.disbursed, 0);
                        const totalAnnualRate = totalAnnualPlanAmount > 0 ? (totalAnnualDisbursed / totalAnnualPlanAmount) * 100 : 0;

                        return (
                        <div className="flex flex-col">
                            {filteredAnnualPlans.length > 0 && (
                                <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 flex items-center justify-between">
                                    <div className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                                        Tổng hợp Kế hoạch Hằng năm
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase mb-0.5">Vốn giao</p>
                                            <p className="text-xs font-black text-blue-700 dark:text-blue-400">{formatCurrency(totalAnnualPlanAmount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase mb-0.5">Đã giải ngân</p>
                                            <p className="text-xs font-black text-emerald-600">{formatCurrency(totalAnnualDisbursed)}</p>
                                        </div>
                                        <div className="w-32">
                                            <div className="flex justify-between text-[10px] font-bold mb-1">
                                                <span className="text-gray-500">Tỷ lệ</span>
                                                <span className={totalAnnualRate >= 90 ? 'text-emerald-600' : totalAnnualRate >= 50 ? 'text-blue-600' : 'text-warning-600'}>
                                                    {totalAnnualRate.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${totalAnnualRate >= 90 ? 'bg-emerald-500' : totalAnnualRate >= 50 ? 'bg-blue-500' : 'bg-warning-500'}`} 
                                                    style={{ width: `${Math.min(totalAnnualRate, 100)}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-slate-500 dark:text-slate-400">Năm</th>
                                            <th className="px-4 py-2.5 text-left text-slate-500 dark:text-slate-400">QĐ giao vốn</th>
                                            <th className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">Vốn giao</th>
                                            <th className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">Đã giải ngân</th>
                                            <th className="px-4 py-2.5 text-left text-slate-500 dark:text-slate-400">Tỷ lệ</th>
                                            <th className="px-4 py-2.5 text-center text-slate-500 dark:text-slate-400 w-20">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                                        {filteredAnnualPlans.sort((a, b) => a.Year - b.Year).map(a => (
                                            <tr key={a.PlanID || (a as any).AllocationID} className="hover:bg-blue-50/30 dark:hover:bg-slate-700 transition-colors">
                                        <td className="px-4 py-2.5">
                                            <span className="font-bold text-gray-800 dark:text-slate-100">Năm {a.Year}</span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="text-gray-700 dark:text-slate-300 font-medium text-xs">{a.DecisionNumber}</span>
                                            <p className="text-[10px] text-gray-400 dark:text-slate-400 italic">{a.DateAssigned ? new Date(a.DateAssigned).toLocaleDateString('vi-VN') : ''}</p>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-700 dark:text-blue-400 text-xs">
                                            {formatCurrency(a.Amount)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                                            {formatCurrency(a.disbursed)}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${a.rate >= 90 ? 'bg-emerald-500' : a.rate >= 50 ? 'bg-blue-500' : 'bg-warning-500'}`}
                                                        style={{ width: `${Math.min(a.rate, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-[10px] font-bold ${a.rate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : a.rate >= 50 ? 'text-blue-600 dark:text-blue-400' : 'text-warning-600 dark:text-warning-400'}`}>
                                                    {a.rate.toFixed(0)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleEditPlan({
                                                        PlanID: a.PlanID || (a as any).AllocationID,
                                                        ProjectID: projectID,
                                                        Year: a.Year,
                                                        Amount: a.Amount,
                                                        Source: a.Source,
                                                        DecisionNumber: a.DecisionNumber,
                                                        DateAssigned: a.DateAssigned,
                                                        DisbursedAmount: a.disbursed,
                                                    })}
                                                    className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ type: 'plan', id: a.PlanID || (a as any).AllocationID })}
                                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-blue-50/50 dark:bg-blue-900/20 font-bold border-t border-blue-200 dark:border-blue-800">
                                    <td className="px-4 py-2.5 text-gray-800 dark:text-slate-100" colSpan={2}>
                                        Tổng cộng
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-blue-800 dark:text-blue-400 text-xs">
                                        {formatCurrency(totalAnnualPlanAmount)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400 text-xs">
                                        {formatCurrency(totalAnnualDisbursed)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`text-xs font-bold ${totalAnnualRate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-warning-600 dark:text-warning-400'}`}>
                                            {totalAnnualRate.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                );
            })()}
        </div>

                {/* Donut Chart — Nguồn vốn */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-purple-600" />
                        Phân bổ nguồn vốn
                    </h3>
                    <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sourceChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                    fontSize={10}
                                >
                                    {sourceChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: unknown) => formatCurrency(Number(value))} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-2">
                        {sourceChartData.map((s) => (
                            <div key={s.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className="text-gray-600 dark:text-slate-400">{s.name}</span>
                                </div>
                                <span className="font-bold text-gray-800 dark:text-slate-100">{formatCurrency(s.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════
                SECTION C — Kế hoạch giải ngân theo tháng
               ════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <CalendarRange className="w-4 h-4 text-violet-600" />
                        Kế hoạch giải ngân theo tháng
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                            {planYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setPlanYearFilter(year)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${planYearFilter === year
                                        ? 'bg-white dark:bg-slate-800 dark:bg-slate-600 text-gray-800 dark:text-slate-100 shadow-sm'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                        {/* Mini summary badges */}
                        <div className="hidden md:flex items-center gap-2 text-xs">
                            <span className="px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold">
                                KH: {formatCurrency(planSummary.totalPlanned)}
                            </span>
                            <span className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold">
                                TT: {formatCurrency(planSummary.totalActual)} ({planSummary.rate.toFixed(1)}%)
                            </span>
                        </div>
                        <button
                            onClick={() => { setDisbPlanModalOpen(true); }}
                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all ml-2"
                        >
                            <Plus className="w-3.5 h-3.5" /> Lập KH tháng
                        </button>
                    </div>
                </div>

                {/* Chart — Planned vs Actual */}
                <div className="px-6 pt-4 pb-2">
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={planChartData} barCategoryGap="15%">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={10}
                                    tick={{ fill: '#9ca3af' }}
                                    interval={0}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={10}
                                    tick={{ fill: '#9ca3af' }}
                                    tickFormatter={(v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(0)} tỷ` : `${(v / 1e6).toFixed(0)} tr`}
                                    width={55}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                                    formatter={(value: unknown, name: unknown) => {
                                        const labels: Record<string, string> = {
                                            planned: 'Kế hoạch',
                                            actual: 'Thực tế',
                                        };
                                        const nameStr = String(name);
                                        return [formatCurrency(Number(value)), labels[nameStr] || nameStr];
                                    }}
                                    labelFormatter={(label: unknown) => `Tháng ${label}`}
                                />
                                <Legend
                                    formatter={(value: string) => {
                                        const labels: Record<string, string> = {
                                            planned: 'Kế hoạch giải ngân',
                                            actual: 'Giải ngân thực tế',
                                        };
                                        return <span className="text-xs">{labels[value] || value}</span>;
                                    }}
                                />
                                <Bar dataKey="planned" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.7} name="planned" />
                                <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} name="actual" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Table KH tháng */}
                {filteredPlanData.length > 0 ? (
                    <div className="px-6 pb-6 mt-4 border-t border-gray-100 dark:border-slate-700/50 pt-4">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                                <tr>
                                    <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Tháng</th>
                                    <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">KH giải ngân</th>
                                    <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">Thực tế</th>
                                    <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">Tỷ lệ</th>
                                    <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Việc trong tháng</th>
                                    <th className="px-3 py-2 text-center text-slate-500 dark:text-slate-400 w-16">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                {[...filteredPlanData].sort((a,b)=>a.Month - b.Month).map((d) => {
                                    const mRate = d.PlannedAmount > 0 ? (d.ActualAmount / d.PlannedAmount) * 100 : 0;
                                    return (
                                        <tr key={d.Id} className="hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors">
                                            <td className="px-3 py-2 font-bold text-gray-800 dark:text-slate-100">Tháng {d.Month}</td>
                                            <td className="px-3 py-2 text-right font-mono text-violet-700 dark:text-violet-400">{formatCurrency(d.PlannedAmount)}</td>
                                            <td className="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(d.ActualAmount)}</td>
                                            <td className="px-3 py-2 text-right">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                    mRate >= 90 ? 'bg-emerald-100 text-emerald-600' :
                                                    mRate >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-warning-100 text-warning-600'
                                                }`}>{mRate.toFixed(1)}%</span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-500 italic max-w-xs truncate" title={d.Notes}>{d.Notes || '—'}</td>
                                            <td className="px-3 py-2 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {!d.Id.startsWith('auto-') && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditDisbPlan(d)}
                                                                className="p-1 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-gray-400 hover:text-violet-600 rounded-lg transition-colors"
                                                                title="Sửa kế hoạch"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm({ type: 'disbPlan', id: d.Id })}
                                                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                                                title="Xóa kế hoạch"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {/* Tổng cộng footer */}
                                <tr className="bg-violet-50/50 dark:bg-violet-900/20 font-bold border-t border-violet-200 dark:border-violet-800">
                                    <td className="px-3 py-2 text-gray-800 dark:text-slate-100">Tổng cộng</td>
                                    <td className="px-3 py-2 text-right font-mono text-violet-700 dark:text-violet-400">{formatCurrency(planSummary.totalPlanned)}</td>
                                    <td className="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(planSummary.totalActual)}</td>
                                    <td className="px-3 py-2 text-right">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${planSummary.rate >= 90 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : planSummary.rate >= 50 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-warning-100 text-warning-600 dark:bg-warning-900/40 dark:text-warning-400'}`}>{planSummary.rate.toFixed(1)}%</span>
                                    </td>
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        icon={<CalendarRange className="w-12 h-12 text-gray-400 dark:text-slate-400" />}
                        title={`Chưa có kế hoạch giải ngân cho năm ${planYearFilter}`}
                        className="mt-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl"
                    />
                )}
            </div>

            {/* ════════════════════════════════════════════
                SECTION D — Lịch sử giải ngân chi tiết
               ════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                        <ArrowDownUp className="w-4 h-4 text-emerald-600" />
                        Lịch sử giải ngân (NĐ 99/2021/NĐ-CP)
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={disbYearFilter}
                            onChange={(e) => setDisbYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-slate-200"
                        >
                            <option value="all">Tất cả năm</option>
                            {Array.from(new Set(disbursements.map(d => new Date(d.Date).getFullYear()))).sort((a, b) => b - a).map(y => (
                                <option key={y} value={y}>Năm {y}</option>
                            ))}
                        </select>
                        
                        <select
                            value={disbSourceFilter}
                            onChange={(e) => setDisbSourceFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-slate-200"
                        >
                            <option value="all">Tất cả nguồn vốn</option>
                            {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>

                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                            {([
                                ['all', 'Tất cả'],
                                ['TamUng', 'Tạm ứng'],
                                ['ThanhToanKLHT', 'TT KLHT'],
                                ['ThuHoiTamUng', 'Thu hồi TƯ'],
                            ] as const).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setDisbursementFilter(key)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${disbursementFilter === key
                                        ? 'bg-white dark:bg-slate-800 dark:bg-slate-600 text-gray-800 dark:text-slate-100 shadow-sm'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                        >
                            <ArrowDownUp className="w-3.5 h-3.5" /> Import (Kế toán)
                        </button>
                        <button
                            onClick={() => { setEditingDisb(null); setDisbModalOpen(true); }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                            title="Nhập thanh toán tại tab Gói thầu → Thanh quyết toán, dữ liệu sẽ tự đồng bộ về đây"
                        >
                            <Plus className="w-3.5 h-3.5" /> Thêm bút toán
                        </button>

                        {/* Mẫu xuất văn bản (Moved from Section F) */}
                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5 ml-1 border border-gray-200 dark:border-slate-600">
                             <button className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600 rounded transition-all flex items-center gap-1.5" title="Đề nghị thanh toán vốn (Mẫu 25)"><FileDown className="w-3.5 h-3.5 text-primary-600" /> M.25</button>
                             <button className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600 rounded transition-all flex items-center gap-1.5" title="Đề nghị rút vốn (Mẫu 26)"><FileDown className="w-3.5 h-3.5 text-blue-600" /> M.26</button>
                             <button className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600 rounded transition-all flex items-center gap-1.5" title="Thu hồi vốn tạm ứng (Mẫu 27)"><FileDown className="w-3.5 h-3.5 text-green-600" /> M.27</button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                            <tr>
                                <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">Ngày</th>
                                <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">Nội dung</th>
                                <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">HĐ số</th>
                                <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">Loại</th>
                                <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">Biểu mẫu</th>
                                <th className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">Số tiền</th>
                                <th className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">Lũy kế TT</th>
                                <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">Trạng thái</th>
                                <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 w-20">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                            {[...filteredDisbursements].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()).map((d) => (
                                <tr key={d.DisbursementID} className={`hover:bg-bg-app dark:bg-slate-900 dark:hover:bg-slate-700 transition-colors ${d.Type === 'ThuHoiTamUng' ? 'bg-green-50/30 dark:bg-green-900/10' :
                                    d.Type === 'TamUng' ? 'bg-primary-50/20 dark:bg-primary-900/10' : ''
                                    }`}>
                                    <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                                        {d.Date ? new Date(d.Date).toLocaleDateString('vi-VN') : '—'}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <p className="text-gray-800 dark:text-slate-200 font-medium text-xs line-clamp-1">{d.Description}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5 font-mono">{d.TreasuryCode || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-slate-400 font-medium whitespace-nowrap">
                                        {d.ContractNumber || '—'}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${d.Type === 'TamUng' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' :
                                            d.Type === 'ThanhToanKLHT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                                d.Type === 'ThuHoiTamUng' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                                    'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                            {d.Type === 'TamUng' && <Receipt className="w-3 h-3" />}
                                            {d.Type === 'ThanhToanKLHT' && <DollarSign className="w-3 h-3" />}
                                            {d.Type === 'ThuHoiTamUng' && <RefreshCcw className="w-3 h-3" />}
                                            {TYPE_LABELS[d.Type || ''] || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded text-[10px] font-mono font-bold">
                                            {d.FormType || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono font-bold">
                                        <span className={d.Type === 'ThuHoiTamUng' ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-slate-100'}>
                                            {d.Type === 'ThuHoiTamUng' ? '-' : ''}{formatCurrency(d.Amount)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-500 dark:text-slate-400">
                                        {d.CumulativeBefore != null ? formatCurrency(d.CumulativeBefore + d.Amount) : '—'}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${d.Status === 'Approved' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                                            d.Status === 'Pending' ? 'bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300' :
                                                'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${d.Status === 'Approved' ? 'bg-green-500' :
                                                d.Status === 'Pending' ? 'bg-warning-500' : 'bg-red-500'
                                                }`} />
                                            {d.Status === 'Approved' ? 'Đã duyệt' :
                                                d.Status === 'Pending' ? 'Chờ duyệt' : 'Từ chối'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleEditDisb(d)}
                                                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                                                title="Sửa"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ type: 'disb', id: d.DisbursementID })}
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredDisbursements.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-gray-400 dark:text-slate-400 text-sm">
                                        Không có giao dịch nào cho bộ lọc này
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ════════════════════════════════════════════
                MODALS
               ════════════════════════════════════════════ */}
            <CapitalPlanModal
                isOpen={planModalOpen}
                onClose={() => { setPlanModalOpen(false); setEditingPlan(null); }}
                onSave={handleSavePlan}
                editingPlan={editingPlan}
                projectID={projectID}
                planType={modalPlanType}
                isSaving={createPlan.isPending || updatePlan.isPending}
                totalInvestment={summary.totalInvestment}
                maxAllowable={modalMaxAllowable}
            />

            <DisbursementModal
                isOpen={disbModalOpen}
                onClose={() => { setDisbModalOpen(false); setEditingDisb(null); }}
                onSave={handleSaveDisb}
                editing={editingDisb}
                projectID={projectID}
                capitalPlans={capitalPlans}
                isSaving={createDisb.isPending || updateDisb.isPending}
            />

            <DisbursementPlanModal
                isOpen={disbPlanModalOpen}
                onClose={() => setDisbPlanModalOpen(false)}
                onSave={handleSaveDisbPlans}
                projectID={projectID}
                defaultYear={planYearFilter}
                allPlans={disbursementPlanData}
                annualLimit={capitalPlans.filter(p => p.PlanType === 'annual' && p.Year === planYearFilter).reduce((sum, p) => sum + (p.Amount || 0), 0)}
                isSaving={bulkSaveDisbPlan.isPending}
                projectTasks={projectTasks as any[]}
            />

            <ImportDisbursementModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                projectId={projectID}
            />

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm w-full max-w-sm mx-4 p-4 border border-gray-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                                Xác nhận xóa
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
                            Bạn có chắc chắn muốn xóa {deleteConfirm.type === 'plan' ? 'kế hoạch vốn' : 'bút toán giải ngân'} này? Hành động không thể hoàn tác.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deletePlan.isPending || deleteDisb.isPending}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                            >
                                {(deletePlan.isPending || deleteDisb.isPending) ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



