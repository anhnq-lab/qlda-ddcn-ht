import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskService } from '@/services/TaskService';

import { Disbursement, CapitalPlan } from '@/types';
import { Trash2 } from 'lucide-react';

import { CapitalPlanModal } from '../CapitalPlanModal';
import { DisbursementPlanModal } from '../DisbursementPlanModal';
import { DisbursementModal } from '../DisbursementModal';
import { ImportDisbursementModal } from '../ImportDisbursementModal';
import { ProjectCapitalKPIDashboard } from './ProjectCapitalKPIDashboard';
import { DisbursementHistorySection } from './capital/DisbursementHistorySection';
import { MonthlyDisbursementSection } from './capital/MonthlyDisbursementSection';
import { CapitalAlertBanner, useCapitalAlerts } from './capital/CapitalAlertBanner';
import { CapitalPlanSection } from './capital/CapitalPlanSection';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/format';
import {
    useProjectCapitalSummary,
    useCreateCapitalPlan, useUpdateCapitalPlan, useDeleteCapitalPlan,
    useCreateDisbursement, useUpdateDisbursement, useDeleteDisbursement,
    useBulkSaveDisbursementPlans, useDeleteDisbursementPlan,
} from '@/hooks/useCapital';
import { useCapitalComputed } from '@/hooks/useCapitalComputed';

interface ProjectCapitalTabProps {
    projectID: string;
}

type CapitalSubTab = 'mid_term' | 'annual';
type DisbursementFilter = 'all' | 'TamUng' | 'ThanhToanKLHT' | 'ThuHoiTamUng';

export const ProjectCapitalTab: React.FC<ProjectCapitalTabProps> = ({ projectID }) => {
    // ── Data ──
    const { data: capitalSummary, isLoading } = useProjectCapitalSummary(projectID);
    const { addToast } = useToast();
    const { data: projectTasks = [] } = useQuery({
        queryKey: ['project-tasks', projectID],
        queryFn: () => TaskService.getProjectTasks(projectID),
    });

    const capitalPlans = capitalSummary?.capitalPlans ?? [];
    const disbursementPlanData = capitalSummary?.disbursementPlans ?? [];
    const disbursements = capitalSummary?.disbursements ?? [];
    const summary = capitalSummary?.summary ?? {
        totalInvestment: 0, totalAllocated: 0, totalDisbursed: 0,
        totalAdvance: 0, advanceRecovered: 0, advanceBalance: 0,
        completionPayment: 0, disbursementRate: 0, yearlyTarget: 0, yearlyDisbursed: 0,
        totalLuyKeNghiemThu: 0,
    };

    // ── UI State ──
    const [disbursementFilter, setDisbursementFilter] = useState<DisbursementFilter>('all');
    const [planYearFilter, setPlanYearFilter] = useState<number>(new Date().getFullYear());
    const [capitalSubTab, setCapitalSubTab] = useState<CapitalSubTab>('annual');
    const [expandedMidTermPlan, setExpandedMidTermPlan] = useState<string | null>(null);
    const [annualPeriodFilter, setAnnualPeriodFilter] = useState<string>('all');
    const [disbYearFilter, setDisbYearFilter] = useState<number | 'all'>('all');

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

    // ── Computed (extracted to dedicated hook) ──
    const computed = useCapitalComputed({
        capitalPlans,
        disbursements,
        disbursementPlanData,
        summary,
        planYearFilter,
        modalPlanType,
        editingPlanId: editingPlan?.PlanID,
        editingPlanYear: editingPlan?.Year,
    });

    const {
        allocationWithRate,
        sourceChartData,
        totalMidTermAllocated,
        getAnnualAllocatedInPeriod,
        modalMaxAllowable,
        planYears,
        filteredPlanData,
        planChartData,
        planSummary,
    } = computed;

    // ── Alerts ──
    const alerts = useCapitalAlerts(
        summary,
        capitalPlans as any[],
        totalMidTermAllocated,
        getAnnualAllocatedInPeriod,
        formatCurrency,
    );

    // ── Auto-select year ──
    useEffect(() => {
        if (planYears.length === 0) return;
        if (!planYears.includes(planYearFilter)) {
            const currentYear = new Date().getFullYear();
            const nearest = planYears.includes(currentYear) ? currentYear : planYears[planYears.length - 1];
            setPlanYearFilter(nearest);
        }
    }, [planYears.join(',')]);

    // ── Handlers: Capital Plans ──
    const handleSavePlan = (planData: Omit<CapitalPlan, 'PlanID'>) => {
        if (editingPlan) {
            updatePlan.mutate({ planId: editingPlan.PlanID, updates: planData, projectId: projectID }, {
                onSuccess: () => { setPlanModalOpen(false); setEditingPlan(null); },
                onError: (err: any) => addToast({ message: err?.message || 'Không thể cập nhật kế hoạch vốn', type: 'error' }),
            });
        } else {
            createPlan.mutate(planData, {
                onSuccess: () => { setPlanModalOpen(false); },
                onError: (err: any) => addToast({ message: err?.message || 'Không thể tạo kế hoạch vốn', type: 'error' }),
            });
        }
    };

    const handleEditPlan = useCallback((plan: CapitalPlan) => {
        setEditingPlan(plan);
        setModalPlanType((plan.PlanType as CapitalSubTab) || 'annual');
        setPlanModalOpen(true);
    }, []);

    const handleAddPlan = useCallback((type: CapitalSubTab) => {
        setEditingPlan(null);
        setModalPlanType(type);
        setPlanModalOpen(true);
    }, []);

    // ── Handlers: Disbursements ──
    const handleSaveDisb = (disbData: Omit<Disbursement, 'DisbursementID'>) => {
        if (editingDisb) {
            updateDisb.mutate({ id: editingDisb.DisbursementID, updates: disbData, projectId: projectID }, {
                onSuccess: () => { setDisbModalOpen(false); setEditingDisb(null); },
                onError: (err: any) => addToast({ message: err?.message || 'Không thể cập nhật giải ngân', type: 'error' }),
            });
        } else {
            createDisb.mutate(disbData, {
                onSuccess: () => { setDisbModalOpen(false); },
                onError: (err: any) => addToast({ message: err?.message || 'Không thể tạo bút toán giải ngân', type: 'error' }),
            });
        }
    };

    const handleEditDisb = useCallback((d: Disbursement) => {
        setEditingDisb(d);
        setDisbModalOpen(true);
    }, []);

    // ── Handlers: Monthly Disbursement Plans ──
    const handleSaveDisbPlans = (year: number, plans: { id?: string, month: number, plannedAmount: number, actualAmount: number, notes: string }[]) => {
        bulkSaveDisbPlan.mutate({ projectId: projectID, year, plans }, {
            onSuccess: () => {
                setDisbPlanModalOpen(false);
                if (planYearFilter !== year) setPlanYearFilter(year);
                addToast({ message: 'Kế hoạch giải ngân đã được lưu', type: 'success' });
            },
            onError: (err: any) => addToast({ message: err?.message || 'Không thể lưu kế hoạch giải ngân', type: 'error' }),
        });
    };

    // ── Handler: Delete ──
    const handleConfirmDelete = () => {
        if (!deleteConfirm) return;
        if (deleteConfirm.type === 'plan') {
            deletePlan.mutate({ planId: deleteConfirm.id, projectId: projectID }, {
                onSuccess: () => { setDeleteConfirm(null); addToast({ message: 'Xóa kế hoạch vốn thành công', type: 'success' }); },
                onError: (err: any) => addToast({ message: err?.message || 'Không thể xóa kế hoạch vốn', type: 'error' }),
            });
        } else if (deleteConfirm.type === 'disb') {
            deleteDisb.mutate({ id: deleteConfirm.id, projectId: projectID }, {
                onSuccess: () => { setDeleteConfirm(null); addToast({ message: 'Xóa bút toán thành công', type: 'success' }); },
                onError: (err: any) => addToast({ message: err?.message || 'Không thể xóa bút toán giải ngân', type: 'error' }),
            });
        } else if (deleteConfirm.type === 'disbPlan') {
            deleteDisbPlan.mutate({ id: deleteConfirm.id, projectId: projectID }, {
                onSuccess: () => { setDeleteConfirm(null); addToast({ message: 'Xóa kế hoạch thành công', type: 'success' }); },
                onError: (err: any) => addToast({ message: err?.message || 'Không thể xóa kế hoạch giải ngân', type: 'error' }),
            });
        }
    };

    // ── Early returns (AFTER all hooks) ──
    if (isLoading) return <div className="p-4 text-center text-txt-muted">Đang tải dữ liệu vốn...</div>;
    if (!capitalSummary) return <div className="p-4 text-center text-red-500">Không có dữ liệu vốn</div>;

    return (
        <div className="space-y-6">
            {/* SECTION E — Cảnh báo rủi ro */}
            <CapitalAlertBanner alerts={alerts} />

            {/* SECTION A — KPI Dashboard */}
            <ProjectCapitalKPIDashboard summary={summary} allocationsCount={capitalPlans.filter(p => p.PlanType === 'annual').length} />

            {/* SECTION B — Kế hoạch vốn + Donut chart */}
            <CapitalPlanSection
                capitalPlans={capitalPlans}
                allocationWithRate={allocationWithRate}
                sourceChartData={sourceChartData}
                projectID={projectID}
                capitalSubTab={capitalSubTab}
                setCapitalSubTab={setCapitalSubTab}
                annualPeriodFilter={annualPeriodFilter}
                setAnnualPeriodFilter={setAnnualPeriodFilter}
                expandedMidTermPlan={expandedMidTermPlan}
                setExpandedMidTermPlan={setExpandedMidTermPlan}
                onAddPlan={handleAddPlan}
                onEditPlan={handleEditPlan}
                onDeletePlan={(id) => setDeleteConfirm({ type: 'plan', id })}
            />

            {/* SECTION C — Kế hoạch giải ngân theo tháng */}
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

            {/* SECTION D — Lịch sử giải ngân chi tiết */}
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

            {/* ── MODALS ── */}
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
                            <h3 className="text-lg font-bold text-txt-primary">Xác nhận xóa</h3>
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
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deletePlan.isPending || deleteDisb.isPending || deleteDisbPlan.isPending}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-all"
                            >
                                {(deletePlan.isPending || deleteDisb.isPending || deleteDisbPlan.isPending) ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
