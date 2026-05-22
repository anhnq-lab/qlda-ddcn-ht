import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskService } from '../../../../services/TaskService';

import { formatCurrency } from '../../../../utils/format';
import { Disbursement, CapitalPlan } from '../../../../types';
import { DisbursementPlanItem } from '../../../../services/CapitalService';
import {
    Wallet, AlertTriangle,
    Calendar, FileText,
    RotateCcw,
    Plus, Trash2, CalendarRange, BookOpen,
    Edit3, ChevronDown, ChevronRight, Pencil
} from 'lucide-react';
import { CapitalPlanModal } from '../CapitalPlanModal';
import { DisbursementPlanModal } from '../DisbursementPlanModal';
import { DisbursementModal } from '../DisbursementModal';
import { ImportDisbursementModal } from '../ImportDisbursementModal';
import { ProjectCapitalKPIDashboard } from './ProjectCapitalKPIDashboard';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { DisbursementHistorySection } from './capital/DisbursementHistorySection';
import { MonthlyDisbursementSection } from './capital/MonthlyDisbursementSection';
import {
    APPROVAL_BADGES, SOURCE_COLORS, SOURCE_LABELS as SOURCE_LABELS_MAP,
    normalizeSource
} from '../../../../utils/capitalConstants';
import {
    useProjectCapitalSummary,
    useCreateCapitalPlan, useUpdateCapitalPlan, useDeleteCapitalPlan,
    useCreateDisbursement, useUpdateDisbursement, useDeleteDisbursement,
    useBulkSaveDisbursementPlans, useDeleteDisbursementPlan,
} from '../../../../hooks/useCapital';
import {
    ResponsiveContainer, Cell, PieChart, Pie, Tooltip
} from 'recharts';

interface ProjectCapitalTabProps {
    projectID: string;
}

// Color constants â€” Gold Theme
const COLORS = {
    tamUng: '#4a90e2',
    klht: '#357abd',
    thuHoi: '#996515',
    pending: '#D4A843',
    rejected: '#ef4444',
};

type CapitalSubTab = 'mid_term' | 'annual';

// APPROVAL_BADGES imported from capitalConstants

// SOURCE_LABELS tá»« capitalConstants (dÃ¹ng .label)
const SOURCE_LABELS: Record<string, string> = {
    'NSTW': 'NS Trung Æ°Æ¡ng',
    'NSÄP': 'NS Äá»‹a phÆ°Æ¡ng',
    'ODA': 'ODA',
    'KhÃ¡c': 'KhÃ¡c',
};

type DisbursementFilter = 'all' | 'TamUng' | 'ThanhToanKLHT' | 'ThuHoiTamUng';

export const ProjectCapitalTab: React.FC<ProjectCapitalTabProps> = ({ projectID }) => {
    // Single source of truth cho dá»¯ liá»‡u giáº£i ngÃ¢n dá»± Ã¡n
    const { data: capitalSummary, isLoading } = useProjectCapitalSummary(projectID);
    
    // GÃ¡n dá»¯ liá»‡u tÆ°Æ¡ng thÃ­ch vá»›i UI hiá»‡n táº¡i
    const capitalPlans = capitalSummary?.capitalPlans ?? [];
    const disbursementPlanData = capitalSummary?.disbursementPlans ?? [];

    // Project tasks for "Viá»‡c trong thÃ¡ng" column
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

    // â”€â”€ CRUD State â”€â”€
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<CapitalPlan | null>(null);
    const [disbModalOpen, setDisbModalOpen] = useState(false);
    const [editingDisb, setEditingDisb] = useState<Disbursement | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'plan' | 'disb' | 'disbPlan'; id: string } | null>(null);
    const [disbPlanModalOpen, setDisbPlanModalOpen] = useState(false);
    const [modalPlanType, setModalPlanType] = useState<CapitalSubTab>('annual');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // â”€â”€ Mutations â”€â”€
    const createPlan = useCreateCapitalPlan();
    const updatePlan = useUpdateCapitalPlan();
    const deletePlan = useDeleteCapitalPlan();
    const createDisb = useCreateDisbursement();
    const updateDisb = useUpdateDisbursement();
    const deleteDisb = useDeleteDisbursement();
    const bulkSaveDisbPlan = useBulkSaveDisbursementPlans();
    const deleteDisbPlan = useDeleteDisbursementPlan();

    // â”€â”€ Handlers: Capital Plans â”€â”€
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

    // â”€â”€ Handlers: Disbursements â”€â”€
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

    // â”€â”€ Handlers: Monthly Disbursement Plans â”€â”€
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

    // â”€â”€ Handler: Delete â”€â”€
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

    // Safe destructure â€” hooks must always run regardless of data
    const allocations = capitalSummary?.capitalPlans ?? [];
    const disbursements = capitalSummary?.disbursements ?? [];
    const summary = capitalSummary?.summary ?? {
        totalInvestment: 0, totalAllocated: 0, totalDisbursed: 0,
        totalAdvance: 0, advanceRecovered: 0, advanceBalance: 0,
        completionPayment: 0, disbursementRate: 0, yearlyTarget: 0, yearlyDisbursed: 0,
    };

    // â”€â”€ Computed Data â”€â”€
    // Disbursements khÃ´ng cÃ³ field Source trá»±c tiáº¿p â†’ chá»‰ filter theo Type vÃ  Year
    const filteredDisbursements = disbursements.filter(d => {
        if (disbursementFilter !== 'all' && d.Type !== disbursementFilter) return false;
        if (disbYearFilter !== 'all') {
            const y = new Date(d.Date).getFullYear();
            if (y !== disbYearFilter) return false;
        }
        return true;
    });

    // Monthly chart data â€” stacked by type
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

    // Donut chart â€” allocations by source
    const sourceChartData = useMemo(() => {
        const map = new Map<string, number>();
        allocations.forEach(a => {
            // Chuáº©n hÃ³a nguá»“n vá»‘n theo Luáº­t ÄTC 58
            let sourceKey = normalizeSource(a.Source || 'NSÄP');
            map.set(sourceKey, (map.get(sourceKey) || 0) + a.Amount);
        });
        return Array.from(map.entries()).map(([source, value]) => ({
            name: SOURCE_LABELS[source] || source,
            value,
            color: SOURCE_COLORS[source] || '#6b7280',
        }));
    }, [allocations]);

    // â”€â”€ Validation limits â”€â”€
    const totalMidTermAllocated = useMemo(() => capitalPlans.filter(p => p.PlanType === 'mid_term').reduce((s, p) => s + (p.Amount || 0), 0), [capitalPlans]);
    const getMidTermForYear = (year: number) => capitalPlans.find(p => p.PlanType === 'mid_term' && (p.PeriodStart || 0) <= year && (p.PeriodEnd || 0) >= year);
    const getAnnualAllocatedInPeriod = (periodStart: number, periodEnd: number, excludePlanId?: string) => {
        return capitalPlans.filter(p => p.PlanType === 'annual' && p.Year >= periodStart && p.Year <= periodEnd && p.PlanID !== excludePlanId).reduce((s, p) => s + (p.Amount || 0), 0);
    };
    // Calculate the max allowable for the currently open modal
    const modalMaxAllowable = useMemo(() => {
        if (modalPlanType === 'mid_term') {
            // Mid-term cannot exceed TMÄT (minus other mid-terms already allocated, excluding current edit)
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

        // Cáº£nh bÃ¡o: Tá»•ng KH trung háº¡n vÆ°á»£t TMÄT
        if (totalMidTermAllocated > summary.totalInvestment && summary.totalInvestment > 0) {
            result.push({
                level: 'high',
                message: `Tá»•ng KH trung háº¡n (${formatCurrency(totalMidTermAllocated)}) vÆ°á»£t Tá»•ng má»©c Ä‘áº§u tÆ° (${formatCurrency(summary.totalInvestment)}).`,
                icon: <AlertTriangle className="w-4 h-4" />,
            });
        }

        // Cáº£nh bÃ¡o: annual vÆ°á»£t mid-term
        capitalPlans.filter(p => p.PlanType === 'mid_term').forEach(midPlan => {
            const annualTotal = getAnnualAllocatedInPeriod(midPlan.PeriodStart || 0, midPlan.PeriodEnd || 0);
            if (annualTotal > midPlan.Amount) {
                result.push({
                    level: 'high',
                    message: `KH háº±ng nÄƒm giai Ä‘oáº¡n ${midPlan.PeriodStart}â€“${midPlan.PeriodEnd} (${formatCurrency(annualTotal)}) vÆ°á»£t KH trung háº¡n (${formatCurrency(midPlan.Amount)}).`,
                    icon: <AlertTriangle className="w-4 h-4" />,
                });
            }
        });

        if (summary.disbursementRate < 50 && currentMonth >= 6) {
            result.push({
                level: 'high',
                message: `Tá»· lá»‡ giáº£i ngÃ¢n má»›i Ä‘áº¡t ${summary.disbursementRate}% â€” cáº§n Ä‘áº©y nhanh tiáº¿n Ä‘á»™ há»“ sÆ¡ thanh toÃ¡n.`,
                icon: <AlertTriangle className="w-4 h-4" />,
            });
        }
        if (summary.advanceBalance > 0) {
            result.push({
                level: 'medium',
                message: `Sá»‘ dÆ° táº¡m á»©ng chÆ°a thu há»“i: ${formatCurrency(summary.advanceBalance)}. Cáº§n hoÃ n táº¥t nghiá»‡m thu Ä‘á»ƒ thu há»“i.`,
                icon: <RotateCcw className="w-4 h-4" />,
            });
        }
        if (summary.yearlyTarget > 0 && summary.yearlyDisbursed < summary.yearlyTarget * 0.3 && currentMonth >= 6) {
            result.push({
                level: 'medium',
                message: `Giáº£i ngÃ¢n nÄƒm nay má»›i Ä‘áº¡t ${Math.round((summary.yearlyDisbursed / summary.yearlyTarget) * 100)}% káº¿ hoáº¡ch.`,
                icon: <Calendar className="w-4 h-4" />,
            });
        }
        return result;
    }, [summary, capitalPlans, totalMidTermAllocated]);

    // Per-allocation disbursement rate â€” tÃ­nh theo NÄ‚M phÃ¡t sinh
    const allocationWithRate = useMemo(() => {
        return allocations.map(a => {
            const disbursed = disbursements
                .filter(d => {
                    const dYear = new Date(d.Date).getFullYear();
                    // Æ¯u tiÃªn match theo AllocationID, fallback theo nÄƒm
                    const matchPlan = d.CapitalPlanID === a.PlanID || d.AllocationID === (a as any).AllocationID;
                    const matchYear = dYear === a.Year;
                    return (matchPlan || matchYear) && d.Status === 'Approved' && d.Type !== 'ThuHoiTamUng';
                })
                // TrÃ¡nh trÃ¹ng láº·p: chá»‰ láº¥y bÃºt toÃ¡n cá»§a Ä‘Ãºng nÄƒm nÃ y
                .filter(d => new Date(d.Date).getFullYear() === a.Year)
                .reduce((s, d) => s + d.Amount, 0);
            const recovered = disbursements
                .filter(d => new Date(d.Date).getFullYear() === a.Year && d.Status === 'Approved' && d.Type === 'ThuHoiTamUng')
                .reduce((s, d) => s + d.Amount, 0);
            return { ...a, disbursed: disbursed - recovered, rate: a.Amount > 0 ? ((disbursed - recovered) / a.Amount) * 100 : 0 };
        });
    }, [allocations, disbursements]);

    // â”€â”€ Monthly Disbursement Plan Data â”€â”€
    const planYears = useMemo(() => {
        const years = [...new Set(disbursementPlanData.map(d => d.Year))];
        return years.sort((a, b) => a - b);
    }, [disbursementPlanData]);

    // Auto-select current year hoáº·c nÄƒm gáº§n nháº¥t khi dá»¯ liá»‡u load hoáº·c thay Ä‘á»•i
    React.useEffect(() => {
        if (planYears.length === 0) return; // khÃ´ng cÃ³ nÄƒm nÃ o â†’ giá»¯ nguyÃªn
        if (!planYears.includes(planYearFilter)) {
            const currentYear = new Date().getFullYear();
            const nearest = planYears.includes(currentYear) ? currentYear : planYears[planYears.length - 1];
            setPlanYearFilter(nearest);
        }
    }, [planYears.join(',')]); // stable dependency

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
    if (isLoading) return <div className="p-4 text-center text-gray-500 dark:text-slate-400">Äang táº£i dá»¯ liá»‡u vá»‘n...</div>;
    if (!capitalSummary) return <div className="p-4 text-center text-red-500 dark:text-red-400">KhÃ´ng cÃ³ dá»¯ liá»‡u vá»‘n</div>;

    return (
        <div className="space-y-6">
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                SECTION E â€” Cáº£nh bÃ¡o rá»§i ro (Moved to top)
               â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {alerts.length > 0 && (
                <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="px-6 py-3 border-b border-border bg-yellow-500/10">
                        <h3 className="text-sm font-bold text-yellow-500 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Cáº£nh bÃ¡o giáº£i ngÃ¢n
                        </h3>
                    </div>
                    <div className="p-4 space-y-2">
                        {alerts.map((a, i) => (
                            <div key={i} className={`p-3 rounded-xl border flex items-start gap-3 ${a.level === 'high'
                                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                : 'bg-primary-500/10 border-primary-500/20 text-primary-500'
                                }`}>
                                <div className="mt-0.5">{a.icon}</div>
                                <p className="text-sm font-medium">{a.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                SECTION A â€” KPI Dashboard (6 cards)
               â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <ProjectCapitalKPIDashboard summary={summary} allocationsCount={allocations.length} />

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                SECTION B â€” Káº¿ hoáº¡ch vá»‘n (Tab: Trung háº¡n / HÃ ng nÄƒm) + Donut
               â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Capital Plan Table with Sub-tabs */}
                <div className="lg:col-span-2 bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-border flex flex-wrap justify-between items-center gap-2 bg-bg-muted">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-bg-muted p-1 rounded-2xl items-center border border-border">
                                <button
                                    onClick={() => setCapitalSubTab('mid_term')}
                                    className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 ${capitalSubTab === 'mid_term' ? 'bg-bg-surface text-primary-500 shadow-sm' : 'text-txt-muted hover:text-txt-primary'}`}
                                >
                                    <CalendarRange className="w-3.5 h-3.5" /> Trung háº¡n
                                </button>
                                <button
                                    onClick={() => setCapitalSubTab('annual')}
                                    className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 ${capitalSubTab === 'annual' ? 'bg-bg-surface text-primary-500 shadow-sm' : 'text-txt-muted hover:text-txt-primary'}`}
                                >
                                    <Calendar className="w-3.5 h-3.5" /> HÃ ng nÄƒm
                                </button>
                            </div>

                            {capitalSubTab === 'annual' && (
                                <select
                                    value={annualPeriodFilter}
                                    onChange={(e) => setAnnualPeriodFilter(e.target.value)}
                                    className="px-3 py-1.5 bg-bg-surface border border-border rounded-xl text-xs text-txt-primary font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                                >
                                    <option value="all">Táº¥t cáº£ giai Ä‘oáº¡n</option>
                                    {capitalPlans.filter(p => p.PlanType === 'mid_term').sort((a, b) => (b.PeriodStart || 0) - (a.PeriodStart || 0)).map(p => (
                                        <option key={p.PlanID} value={p.PlanID}>Giai Ä‘oáº¡n {p.PeriodStart}-{p.PeriodEnd}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <button
                            onClick={() => { setEditingPlan(null); setModalPlanType(capitalSubTab); setPlanModalOpen(true); }}
                            className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" /> {capitalSubTab === 'mid_term' ? 'Nháº­p KH trung háº¡n' : 'Nháº­p KH háº±ng nÄƒm'}
                        </button>
                    </div>

                    {/* SUB-TAB: TRUNG Háº N */}
                    {capitalSubTab === 'mid_term' && (() => {
                        const midTermPlans = capitalPlans.filter(p => p.PlanType === 'mid_term').sort((a, b) => (a.PeriodStart || a.Year) - (b.PeriodStart || b.Year));
                        return (
                            <div className="p-4 space-y-3">
                                {midTermPlans.length === 0 ? (
                                <EmptyState
                                    icon={<CalendarRange className="w-12 h-12 text-gray-400 dark:text-slate-400" />}
                                    title="ChÆ°a cÃ³ KH vá»‘n trung háº¡n"
                                    description={'Nháº¥n "Nháº­p KH trung háº¡n" Ä‘á»ƒ táº¡o giai Ä‘oáº¡n 5 nÄƒm'}
                                    className="border border-dashed border-border rounded-2xl"
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
                                            <div key={plan.PlanID} className="border border-border rounded-2xl overflow-hidden">
                                                <div
                                                    className="px-5 py-3 bg-bg-muted/50 cursor-pointer hover:bg-bg-muted transition-colors"
                                                    onClick={() => setExpandedMidTermPlan(isExpanded ? null : plan.PlanID)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-primary-500" /> : <ChevronRight className="w-4 h-4 text-primary-500" />}
                                                            <div>
                                                                <h4 className="text-sm font-black text-txt-primary">
                                                                    Giai Ä‘oáº¡n {plan.PeriodStart}â€“{plan.PeriodEnd}
                                                                </h4>
                                                                <p className="text-[10px] text-txt-muted">
                                                                    {plan.DecisionNumber} â€¢ {plan.DateAssigned ? new Date(plan.DateAssigned).toLocaleDateString('vi-VN') : ''} â€¢ {plan.Source}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                <p className="text-base font-black text-primary-500">{formatCurrency(plan.Amount)}</p>
                                                                <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                                                                    <div className="h-1.5 w-16 bg-bg-muted rounded-full overflow-hidden">
                                                                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(disbRate, 100)}%` }} />
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-txt-muted">GN {disbRate.toFixed(1)}%</span>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}>
                                                                <BadgeIcon className="w-3 h-3" /> {badge.label}
                                                            </span>
                                                            <div className="flex gap-1 ml-1">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingPlan(plan); setModalPlanType('mid_term'); setPlanModalOpen(true); }}
                                                                    className="p-1.5 text-txt-muted hover:text-primary-500 hover:bg-bg-muted rounded-xl transition-colors"
                                                                    title="Sá»­a KH trung háº¡n"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'plan', id: plan.PlanID }); }}
                                                                    className="p-1.5 text-txt-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                                                    title="XÃ³a KH trung háº¡n"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="px-5 py-4 border-t border-border bg-bg-surface">
                                                        <div className="grid grid-cols-4 gap-3 mb-4">
                                                            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl">
                                                                <p className="text-[10px] text-txt-muted font-bold uppercase">Tá»•ng KH trung háº¡n</p>
                                                                <p className="text-sm font-black text-blue-500 mt-1">{formatCurrency(plan.Amount)}</p>
                                                            </div>
                                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl">
                                                                <p className="text-[10px] text-txt-muted font-bold uppercase">ÄÃ£ giáº£i ngÃ¢n</p>
                                                                <p className="text-sm font-black text-emerald-500 mt-1">{formatCurrency(totalAnnualDisbursed)}</p>
                                                            </div>
                                                            <div className="bg-primary-500/10 border border-primary-500/20 p-3 rounded-2xl">
                                                                <p className="text-[10px] text-txt-muted font-bold uppercase">ÄÃ£ phÃ¢n bá»• HN</p>
                                                                <p className="text-sm font-black text-primary-500 mt-1">{formatCurrency(totalAnnualAllocated)}</p>
                                                            </div>
                                                            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-2xl">
                                                                <p className="text-[10px] text-txt-muted font-bold uppercase">ChÆ°a phÃ¢n bá»•</p>
                                                                <p className="text-sm font-black text-purple-500 mt-1">{formatCurrency(Math.max(0, plan.Amount - totalAnnualAllocated))}</p>
                                                            </div>
                                                        </div>

                                                        {plan.Notes && (
                                                            <div className="bg-bg-muted p-2.5 rounded-xl mb-4 text-xs text-txt-secondary italic flex items-start gap-1.5">
                                                                <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-txt-muted" />
                                                                <span>{plan.Notes}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between mb-2">
                                                            <h5 className="text-[10px] font-black text-txt-muted uppercase tracking-wider">PhÃ¢n bá»• theo nÄƒm ({linkedAnnual.length} KH)</h5>
                                                            {canAddAnnual && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingPlan(null); setModalPlanType('annual'); setPlanModalOpen(true); }}
                                                                    className="text-primary-500 hover:text-primary-600 text-[10px] font-bold flex items-center gap-1 transition-colors"
                                                                >
                                                                    <Plus className="w-3 h-3" /> Nháº­p KH háº±ng nÄƒm
                                                                </button>
                                                            )}
                                                        </div>
                                                        {linkedAnnual.length > 0 ? (
                                                            <table className="w-full text-xs mb-4">
                                                                <thead className="sticky top-0 z-10 bg-bg-muted text-[10px] font-black uppercase tracking-widest border-b border-border shadow-sm">
                                                                    <tr>
                                                                        <th className="px-3 py-2 text-left text-txt-muted">NÄƒm</th>
                                                                        <th className="px-3 py-2 text-left text-txt-muted">QÄ giao vá»‘n</th>
                                                                        <th className="px-3 py-2 text-right text-txt-muted">Vá»‘n giao</th>
                                                                        <th className="px-3 py-2 text-right text-txt-muted">ÄÃ£ GN</th>
                                                                        <th className="px-3 py-2 text-right text-txt-muted">Tá»· lá»‡</th>
                                                                        <th className="px-3 py-2 text-right text-txt-muted w-16">Thao tÃ¡c</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border">
                                                                    {[...linkedAnnual].sort((a, b) => a.Year - b.Year).map(ap => {
                                                                        const apRate = ap.Amount > 0 ? ((ap.DisbursedAmount || 0) / ap.Amount) * 100 : 0;
                                                                        return (
                                                                            <tr key={ap.PlanID} className="group hover:bg-bg-muted/50">
                                                                                <td className="px-3 py-2 font-bold text-txt-primary">{ap.Year}</td>
                                                                                <td className="px-3 py-2 text-txt-secondary">{ap.DecisionNumber || 'â€”'}</td>
                                                                                <td className="px-3 py-2 text-right font-mono font-bold text-primary-500">{formatCurrency(ap.Amount)}</td>
                                                                                <td className="px-3 py-2 text-right font-mono text-emerald-500">{formatCurrency(ap.DisbursedAmount || 0)}</td>
                                                                                <td className="px-3 py-2 text-right">
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                                                        apRate >= 90 ? 'bg-emerald-500/10 text-emerald-500' :
                                                                                        apRate >= 50 ? 'bg-primary-500/10 text-primary-500' : 'bg-yellow-500/10 text-yellow-500'
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
                                                                                            className="p-1 text-txt-muted hover:text-primary-500 hover:bg-bg-muted rounded-xl"
                                                                                        >
                                                                                            <Edit3 className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'plan', id: ap.PlanID }); }} 
                                                                                            className="p-1 text-txt-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl"
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
                                                            <div className="text-center py-4 text-txt-muted text-[10px]">ChÆ°a cÃ³ KH hÃ ng nÄƒm trong giai Ä‘oáº¡n nÃ y</div>
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
                                        <strong>CÄƒn cá»©:</strong> Luáº­t ÄTC 58/2024/QH15 (Ä.49-55), sá»­a Ä‘á»•i bá»Ÿi Luáº­t 90/2025/QH15
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* SUB-TAB: HÃ€NG NÄ‚M (báº£ng cÅ©) */}
                    {capitalSubTab === 'annual' && (() => {
                        let filteredAnnualPlans = [...allocationWithRate];
                        if (annualPeriodFilter !== 'all') {
                            const selectedMidTerm = capitalPlans.find(p => p.PlanID === annualPeriodFilter);
                            if (selectedMidTerm) {
                                filteredAnnualPlans = filteredAnnualPlans.filter(a => a.Year >= (selectedMidTerm.PeriodStart || 0) && a.Year <= (selectedMidTerm.PeriodEnd || 0));
                            }
                        }
                        if (filteredAnnualPlans.length === 0) {
                            return (
                                <div className="p-4">
                                    <EmptyState
                                        icon={<CalendarRange className="w-12 h-12 text-txt-muted" />}
                                        title="Chưa có kế hoạch vốn hằng năm"
                                        description='Nhấn "Nhập KH hằng năm" ở phía trên để tạo kế hoạch vốn hằng năm cho dự án'
                                        className="border border-dashed border-border rounded-2xl py-8"
                                    />
                                </div>
                            );
                        }

                        const totalAnnualPlanAmount = filteredAnnualPlans.reduce((s, p) => s + p.Amount, 0);
                        const totalAnnualDisbursed = filteredAnnualPlans.reduce((s, p) => s + p.disbursed, 0);
                        const totalAnnualRate = totalAnnualPlanAmount > 0 ? (totalAnnualDisbursed / totalAnnualPlanAmount) * 100 : 0;

                        return (
                        <div className="flex flex-col">
                            {filteredAnnualPlans.length > 0 && (
                                <div className="px-5 py-3 border-b border-border bg-bg-muted flex items-center justify-between">
                                    <div className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">
                                        Tá»•ng há»£p Káº¿ hoáº¡ch Háº±ng nÄƒm
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] text-txt-muted font-bold uppercase mb-0.5">Vá»‘n giao</p>
                                            <p className="text-xs font-black text-primary-500">{formatCurrency(totalAnnualPlanAmount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-txt-muted font-bold uppercase mb-0.5">ÄÃ£ giáº£i ngÃ¢n</p>
                                            <p className="text-xs font-black text-emerald-600">{formatCurrency(totalAnnualDisbursed)}</p>
                                        </div>
                                        <div className="w-32">
                                            <div className="flex justify-between text-[10px] font-bold mb-1">
                                                <span className="text-txt-muted">Tá»· lá»‡</span>
                                                <span className={totalAnnualRate >= 90 ? 'text-emerald-600' : totalAnnualRate >= 50 ? 'text-primary-500' : 'text-yellow-600'}>
                                                    {totalAnnualRate.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-bg-muted rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${totalAnnualRate >= 90 ? 'bg-emerald-500' : totalAnnualRate >= 50 ? 'bg-primary-500' : 'bg-yellow-500'}`} 
                                                    style={{ width: `${Math.min(totalAnnualRate, 100)}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="sticky top-0 z-10 bg-bg-muted text-[10px] font-black uppercase tracking-widest border-b border-border shadow-sm">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-txt-muted">NÄƒm</th>
                                            <th className="px-4 py-2.5 text-left text-txt-muted">QÄ giao vá»‘n</th>
                                            <th className="px-4 py-2.5 text-right text-txt-muted">Vá»‘n giao</th>
                                            <th className="px-4 py-2.5 text-right text-txt-muted">ÄÃ£ giáº£i ngÃ¢n</th>
                                            <th className="px-4 py-2.5 text-left text-txt-muted">Tá»· lá»‡</th>
                                            <th className="px-4 py-2.5 text-center text-txt-muted w-20">Thao tÃ¡c</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredAnnualPlans.sort((a, b) => a.Year - b.Year).map(a => (
                                            <tr key={a.PlanID || (a as any).AllocationID} className="hover:bg-bg-muted/50 transition-colors">
                                        <td className="px-4 py-2.5">
                                            <span className="font-bold text-txt-primary">NÄƒm {a.Year}</span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="text-txt-secondary font-medium text-xs">{a.DecisionNumber}</span>
                                            <p className="text-[10px] text-txt-muted italic">{a.DateAssigned ? new Date(a.DateAssigned).toLocaleDateString('vi-VN') : ''}</p>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-primary-500 text-xs">
                                            {formatCurrency(a.Amount)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-medium text-emerald-500 text-xs">
                                            {formatCurrency(a.disbursed)}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${a.rate >= 90 ? 'bg-emerald-500' : a.rate >= 50 ? 'bg-primary-500' : 'bg-yellow-500'}`}
                                                        style={{ width: `${Math.min(a.rate, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-[10px] font-bold ${a.rate >= 90 ? 'text-emerald-500' : a.rate >= 50 ? 'text-primary-500' : 'text-yellow-500'}`}>
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
                                                    className="p-1 hover:bg-bg-muted text-txt-muted hover:text-primary-500 rounded-xl transition-colors"
                                                    title="Sá»­a"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ type: 'plan', id: a.PlanID || (a as any).AllocationID })}
                                                    className="p-1 hover:bg-red-500/10 text-txt-muted hover:text-red-500 rounded-xl transition-colors"
                                                    title="XÃ³a"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-bg-muted/50 font-bold border-t border-border">
                                    <td className="px-4 py-2.5 text-txt-primary" colSpan={2}>
                                        Tá»•ng cá»™ng
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-primary-500 text-xs">
                                        {formatCurrency(totalAnnualPlanAmount)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-emerald-500 text-xs">
                                        {formatCurrency(totalAnnualDisbursed)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`text-xs font-bold ${totalAnnualRate >= 50 ? 'text-emerald-500' : 'text-yellow-500'}`}>
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

                {/* Donut Chart â€” Nguá»“n vá»‘n */}
                <div className="bg-bg-surface p-5 rounded-2xl border border-border shadow-sm">
                    <h3 className="text-sm font-bold text-txt-primary mb-4 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-purple-500" />
                        PhÃ¢n bá»• nguá»“n vá»‘n
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
                                    <span className="text-txt-muted">{s.name}</span>
                                </div>
                                <span className="font-bold text-txt-primary">{formatCurrency(s.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                SECTION C â€” Káº¿ hoáº¡ch giáº£i ngÃ¢n theo thÃ¡ng
               â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <MonthlyDisbursementSection
                planYearFilter={planYearFilter}
                planYears={planYears}
                setPlanYearFilter={setPlanYearFilter}
                filteredPlanData={filteredPlanData}
                planChartData={planChartData}
                planSummary={planSummary}
                onOpenPlanModal={() => setDisbPlanModalOpen(true)}
                onEditPlan={(d) => { setPlanYearFilter(d.Year); setDisbPlanModalOpen(true); }}
                onDeletePlan={(id) => setDeleteConfirm({ type: 'disbPlan', id })}
            />

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                SECTION D â€” Lá»‹ch sá»­ giáº£i ngÃ¢n chi tiáº¿t
               â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <DisbursementHistorySection
                disbursements={disbursements}
                disbursementFilter={disbursementFilter}
                setDisbursementFilter={setDisbursementFilter}
                disbYearFilter={disbYearFilter}
                setDisbYearFilter={setDisbYearFilter}
                onAddDisb={() => { setEditingDisb(null); setDisbModalOpen(true); }}
                onEditDisb={handleEditDisb}
                onDeleteDisb={(id) => setDeleteConfirm({ type: 'disb', id })}
                onImport={() => setIsImportModalOpen(true)}
            />

            {/* SECTION MODALS */}
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
                    <div className="bg-bg-surface rounded-2xl shadow-lg w-full max-w-sm mx-4 p-4 border border-border" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-xl">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-txt-primary">
                                Xác nhận xóa
                            </h3>
                        </div>
                        <p className="text-sm text-txt-secondary mb-6">
                            Bạn có chắc chắn muốn xóa {
                                deleteConfirm.type === 'plan'
                                    ? 'kế hoạch vốn'
                                    : deleteConfirm.type === 'disbPlan'
                                        ? 'kế hoạch giải ngân tháng'
                                        : 'bút toán giải ngân'
                            } này? Hành động không thể hoàn tác.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-sm font-medium text-txt-secondary bg-bg-muted rounded-xl hover:bg-bg-muted/80 transition-colors"
                            >
                                Há»§y
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deletePlan.isPending || deleteDisb.isPending || deleteDisbPlan.isPending}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-all"
                            >
                                {(deletePlan.isPending || deleteDisb.isPending || deleteDisbPlan.isPending) ? 'Äang xÃ³a...' : 'XÃ³a'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



