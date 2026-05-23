import { useMemo, useCallback } from 'react';
import { CapitalPlan, Disbursement } from '@/types';
import { DisbursementPlanItem } from '@/services/CapitalService';
import { SOURCE_COLORS, SOURCE_LABELS, normalizeSource } from '@/utils/capitalConstants';
import { formatCurrency } from '@/utils/format';

interface CapitalSummary {
    totalInvestment: number;
    totalAllocated: number;
    totalDisbursed: number;
    totalAdvance: number;
    advanceRecovered: number;
    advanceBalance: number;
    completionPayment: number;
    disbursementRate: number;
    yearlyTarget: number;
    yearlyDisbursed: number;
}

/**
 * Hook tập trung tất cả computed values cho ProjectCapitalTab.
 * Tách ra để giảm tải cho component, dễ test độc lập.
 */
export function useCapitalComputed(params: {
    capitalPlans: CapitalPlan[];
    disbursements: Disbursement[];
    disbursementPlanData: DisbursementPlanItem[];
    summary: CapitalSummary;
    planYearFilter: number;
    modalPlanType: 'mid_term' | 'annual';
    editingPlanId?: string;
    editingPlanYear?: number;
}) {
    const {
        capitalPlans,
        disbursements,
        disbursementPlanData,
        summary,
        planYearFilter,
        modalPlanType,
        editingPlanId,
        editingPlanYear,
    } = params;

    // Allocations = annual + mid_term plans (alias cho clarity)
    const allocations = capitalPlans;

    // ── Chart: Monthly disbursement stacked by type ──
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

    // ── Chart: Source allocation donut ──
    const sourceChartData = useMemo(() => {
        const map = new Map<string, number>();
        allocations.filter(a => a.PlanType === 'annual').forEach(a => {
            const sourceKey = normalizeSource(a.Source || 'NSĐP');
            map.set(sourceKey, (map.get(sourceKey) || 0) + a.Amount);
        });
        return Array.from(map.entries()).map(([source, value]) => ({
            name: SOURCE_LABELS[source]?.label || source,
            value,
            color: SOURCE_COLORS[source] || '#6b7280',
        }));
    }, [allocations]);

    // ── Validation: Mid-term totals ──
    const totalMidTermAllocated = useMemo(
        () => capitalPlans
            .filter(p => p.PlanType === 'mid_term')
            .reduce((s, p) => s + (p.Amount || 0), 0),
        [capitalPlans]
    );

    // Helper: tìm mid-term chứa năm hiện tại
    const getMidTermForYear = useCallback((year: number) =>
        capitalPlans.find(p =>
            p.PlanType === 'mid_term' &&
            (p.PeriodStart || 0) <= year &&
            (p.PeriodEnd || 0) >= year
        ),
        [capitalPlans]
    );

    // Helper: tổng annual trong giai đoạn
    const getAnnualAllocatedInPeriod = useCallback((periodStart: number, periodEnd: number, excludePlanId?: string) =>
        capitalPlans
            .filter(p =>
                p.PlanType === 'annual' &&
                p.Year >= periodStart &&
                p.Year <= periodEnd &&
                p.PlanID !== excludePlanId
            )
            .reduce((s, p) => s + (p.Amount || 0), 0),
        [capitalPlans]
    );

    // ── Validation: Max allowable for modal ──
    const modalMaxAllowable = useMemo(() => {
        if (modalPlanType === 'mid_term') {
            const otherMidTerms = capitalPlans
                .filter(p => p.PlanType === 'mid_term' && p.PlanID !== editingPlanId)
                .reduce((s, p) => s + (p.Amount || 0), 0);
            return Math.max(0, summary.totalInvestment - otherMidTerms);
        } else {
            const editYear = editingPlanYear || new Date().getFullYear();
            const midTerm = getMidTermForYear(editYear);
            if (!midTerm) return summary.totalInvestment;
            const existingAnnual = getAnnualAllocatedInPeriod(
                midTerm.PeriodStart || 0,
                midTerm.PeriodEnd || 0,
                editingPlanId
            );
            return Math.max(0, midTerm.Amount - existingAnnual);
        }
    }, [capitalPlans, modalPlanType, editingPlanId, editingPlanYear, summary.totalInvestment]);

    // ── Disbursement rate per allocation ──
    const allocationWithRate = useMemo(() =>
        allocations
            .filter(a => a.PlanType === 'annual')
            .map(a => {
                const disbursed = disbursements
                    .filter(d => {
                        const dYear = new Date(d.Date).getFullYear();
                        const matchPlan = d.CapitalPlanID === a.PlanID || (d as any).AllocationID === (a as any).AllocationID;
                        const matchYear = dYear === a.Year;
                        return (matchPlan || matchYear) && d.Status === 'Approved' && d.Type !== 'ThuHoiTamUng';
                    })
                    .filter(d => new Date(d.Date).getFullYear() === a.Year)
                    .reduce((s, d) => s + d.Amount, 0);
                const recovered = disbursements
                    .filter(d => new Date(d.Date).getFullYear() === a.Year && d.Status === 'Approved' && d.Type === 'ThuHoiTamUng')
                    .reduce((s, d) => s + d.Amount, 0);
                return {
                    ...a,
                    disbursed: disbursed - recovered,
                    rate: a.Amount > 0 ? ((disbursed - recovered) / a.Amount) * 100 : 0,
                };
            }),
        [allocations, disbursements]
    );

    // ── Monthly Disbursement Plan Data ──
    const planYears = useMemo(() => {
        const years = [...new Set(disbursementPlanData.map(d => d.Year))];
        return years.sort((a, b) => a - b);
    }, [disbursementPlanData]);

    const filteredPlanData = useMemo(
        () => disbursementPlanData.filter(d => d.Year === planYearFilter),
        [disbursementPlanData, planYearFilter]
    );

    const planChartData = useMemo(() =>
        filteredPlanData.map(d => ({
            label: `T${d.Month}`,
            planned: d.PlannedAmount,
            actual: d.ActualAmount,
            diff: d.PlannedAmount - d.ActualAmount,
            notes: d.Notes,
        })),
        [filteredPlanData]
    );

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

    return {
        // Charts
        monthlyChartData,
        sourceChartData,
        // Validation
        totalMidTermAllocated,
        getMidTermForYear,
        getAnnualAllocatedInPeriod,
        modalMaxAllowable,
        // Tables
        allocationWithRate,
        // Disbursement plans
        planYears,
        filteredPlanData,
        planChartData,
        planSummary,
        // formatCurrency re-export for convenience
        formatCurrency,
    };
}
