import React, { memo } from 'react';
import { CapitalPlan } from '@/types';
import { formatCurrency } from '@/utils/format';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    Calendar, CalendarRange, FileText, BookOpen,
    Plus, Trash2, Edit3, ChevronDown, ChevronRight, Pencil,
    Wallet
} from 'lucide-react';
import { APPROVAL_BADGES } from '@/utils/capitalConstants';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';

type CapitalSubTab = 'mid_term' | 'annual';

// AllocationWithRate extends CapitalPlan to include computed disbursement fields
interface AllocationWithRate extends CapitalPlan {
    disbursed: number;
    rate: number;
}

interface SourceChartEntry {
    name: string;
    value: number;
    color: string;
}

interface CapitalPlanSectionProps {
    // Data
    capitalPlans: CapitalPlan[];
    allocationWithRate: AllocationWithRate[];
    sourceChartData: SourceChartEntry[];
    projectID: string;
    // State
    capitalSubTab: CapitalSubTab;
    setCapitalSubTab: (tab: CapitalSubTab) => void;
    annualPeriodFilter: string;
    setAnnualPeriodFilter: (v: string) => void;
    expandedMidTermPlan: string | null;
    setExpandedMidTermPlan: (id: string | null) => void;
    // Handlers
    onAddPlan: (type: CapitalSubTab) => void;
    onEditPlan: (plan: CapitalPlan) => void;
    onDeletePlan: (id: string) => void;
}

/**
 * Section B — Kế hoạch vốn (Tab Trung hạn / Hằng năm) + Donut chart nguồn vốn
 * Tách ra từ ProjectCapitalTab để giảm kích thước component chính.
 * React.memo ngăn re-render không cần thiết khi tab khác thay đổi.
 */
export const CapitalPlanSection: React.FC<CapitalPlanSectionProps> = memo(({
    capitalPlans,
    allocationWithRate,
    sourceChartData,
    projectID,
    capitalSubTab,
    setCapitalSubTab,
    annualPeriodFilter,
    setAnnualPeriodFilter,
    expandedMidTermPlan,
    setExpandedMidTermPlan,
    onAddPlan,
    onEditPlan,
    onDeletePlan,
}) => {
    // allocations chỉ lấy annual cho bảng hằng năm
    const annualPlans = allocationWithRate;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Capital Plan Table with Sub-tabs */}
            <div className="lg:col-span-2 bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                {/* Header toolbar */}
                <div className="px-5 py-3 border-b border-border flex flex-wrap justify-between items-center gap-2 bg-bg-muted">
                    <div className="flex items-center gap-4">
                        {/* Sub-tab toggle */}
                        <div className="flex bg-bg-muted p-1 rounded-2xl items-center border border-border">
                            <button
                                onClick={() => setCapitalSubTab('mid_term')}
                                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 ${capitalSubTab === 'mid_term' ? 'bg-bg-surface text-primary-500 shadow-sm' : 'text-txt-muted hover:text-txt-primary'}`}
                            >
                                <CalendarRange className="w-3.5 h-3.5" /> Trung hạn
                            </button>
                            <button
                                onClick={() => setCapitalSubTab('annual')}
                                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 ${capitalSubTab === 'annual' ? 'bg-bg-surface text-primary-500 shadow-sm' : 'text-txt-muted hover:text-txt-primary'}`}
                            >
                                <Calendar className="w-3.5 h-3.5" /> Hằng năm
                            </button>
                        </div>

                        {/* Period filter (annual only) */}
                        {capitalSubTab === 'annual' && (
                            <select
                                value={annualPeriodFilter}
                                onChange={(e) => setAnnualPeriodFilter(e.target.value)}
                                className="px-3 py-1.5 bg-bg-surface border border-border rounded-xl text-xs text-txt-primary font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                            >
                                <option value="all">Tất cả giai đoạn</option>
                                {capitalPlans
                                    .filter(p => p.PlanType === 'mid_term')
                                    .sort((a, b) => (b.PeriodStart || 0) - (a.PeriodStart || 0))
                                    .map(p => (
                                        <option key={p.PlanID} value={p.PlanID}>
                                            Giai đoạn {p.PeriodStart}-{p.PeriodEnd}
                                        </option>
                                    ))
                                }
                            </select>
                        )}
                    </div>

                    {/* Add button */}
                    <button
                        onClick={() => onAddPlan(capitalSubTab)}
                        className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {capitalSubTab === 'mid_term' ? 'Nhập KH trung hạn' : 'Nhập KH hằng năm'}
                    </button>
                </div>

                {/* ─── SUB-TAB: TRUNG HẠN ─── */}
                {capitalSubTab === 'mid_term' && (() => {
                    const midTermPlans = capitalPlans
                        .filter(p => p.PlanType === 'mid_term')
                        .sort((a, b) => (a.PeriodStart || a.Year) - (b.PeriodStart || b.Year));

                    return (
                        <div className="p-4 space-y-3">
                            {midTermPlans.length === 0 ? (
                                <EmptyState
                                    icon={<CalendarRange className="w-12 h-12 text-txt-placeholder" />}
                                    title="Chưa có KH vốn trung hạn"
                                    description={'Nhấn "Nhập KH trung hạn" để tạo giai đoạn 5 năm'}
                                    className="border border-dashed border-border rounded-2xl"
                                />
                            ) : (
                                midTermPlans.map(plan => {
                                    const isExpanded = expandedMidTermPlan === plan.PlanID;
                                    const linkedAnnual = annualPlans
                                        .filter(p => p.Year >= (plan.PeriodStart || 0) && p.Year <= (plan.PeriodEnd || 0))
                                        .sort((a, b) => a.Year - b.Year);
                                    const totalAnnualAllocated = linkedAnnual.reduce((s, p) => s + p.Amount, 0);
                                    const totalAnnualDisbursed = linkedAnnual.reduce((s, p) => s + (p.disbursed || 0), 0);
                                    const badge = APPROVAL_BADGES['approved'];
                                    const BadgeIcon = badge.icon;
                                    const disbRate = plan.Amount > 0 ? (totalAnnualDisbursed / plan.Amount) * 100 : 0;
                                    const canAddAnnual = linkedAnnual.length < ((plan.PeriodEnd || 0) - (plan.PeriodStart || 0) + 1);

                                    return (
                                        <div key={plan.PlanID} className="border border-border rounded-2xl overflow-hidden">
                                            {/* Plan header row */}
                                            <div
                                                className="px-5 py-3 bg-bg-muted/50 cursor-pointer hover:bg-bg-muted transition-colors"
                                                onClick={() => setExpandedMidTermPlan(isExpanded ? null : plan.PlanID)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded
                                                            ? <ChevronDown className="w-4 h-4 text-primary-500" />
                                                            : <ChevronRight className="w-4 h-4 text-primary-500" />
                                                        }
                                                        <div>
                                                            <h4 className="text-sm font-black text-txt-primary">
                                                                Giai đoạn {plan.PeriodStart}–{plan.PeriodEnd}
                                                            </h4>
                                                            <p className="text-[10px] text-txt-muted">
                                                                {plan.DecisionNumber} • {plan.DateAssigned ? new Date(plan.DateAssigned).toLocaleDateString('vi-VN') : ''} • {plan.Source}
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
                                                                onClick={(e) => { e.stopPropagation(); onEditPlan(plan); }}
                                                                className="p-1.5 text-txt-muted hover:text-primary-500 hover:bg-bg-muted rounded-xl transition-colors"
                                                                title="Sửa KH trung hạn"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onDeletePlan(plan.PlanID); }}
                                                                className="p-1.5 text-txt-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                                                title="Xóa KH trung hạn"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded detail */}
                                            {isExpanded && (
                                                <div className="px-5 py-4 border-t border-border bg-bg-surface">
                                                    <div className="grid grid-cols-4 gap-3 mb-4">
                                                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl">
                                                            <p className="text-[10px] text-txt-muted font-bold uppercase">Tổng KH trung hạn</p>
                                                            <p className="text-sm font-black text-blue-500 mt-1">{formatCurrency(plan.Amount)}</p>
                                                        </div>
                                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl">
                                                            <p className="text-[10px] text-txt-muted font-bold uppercase">Đã giải ngân</p>
                                                            <p className="text-sm font-black text-emerald-500 mt-1">{formatCurrency(totalAnnualDisbursed)}</p>
                                                        </div>
                                                        <div className="bg-primary-500/10 border border-primary-500/20 p-3 rounded-2xl">
                                                            <p className="text-[10px] text-txt-muted font-bold uppercase">Đã phân bổ HN</p>
                                                            <p className="text-sm font-black text-primary-500 mt-1">{formatCurrency(totalAnnualAllocated)}</p>
                                                        </div>
                                                        <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-2xl">
                                                            <p className="text-[10px] text-txt-muted font-bold uppercase">Chưa phân bổ</p>
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
                                                        <h5 className="text-[10px] font-black text-txt-muted uppercase tracking-wider">
                                                            Phân bổ theo năm ({linkedAnnual.length} KH)
                                                        </h5>
                                                        {canAddAnnual && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onAddPlan('annual'); }}
                                                                className="text-primary-500 hover:text-primary-600 text-[10px] font-bold flex items-center gap-1 transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3" /> Nhập KH hằng năm
                                                            </button>
                                                        )}
                                                    </div>

                                                    {linkedAnnual.length > 0 ? (
                                                        <table className="w-full text-xs mb-4">
                                                            <thead className="sticky top-0 z-10 bg-bg-muted text-[10px] font-black uppercase tracking-widest border-b border-border shadow-sm">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left text-txt-muted">Năm</th>
                                                                    <th className="px-3 py-2 text-left text-txt-muted">QĐ giao vốn</th>
                                                                    <th className="px-3 py-2 text-right text-txt-muted">Vốn giao</th>
                                                                    <th className="px-3 py-2 text-right text-txt-muted">Đã GN</th>
                                                                    <th className="px-3 py-2 text-right text-txt-muted">Tỷ lệ</th>
                                                                    <th className="px-3 py-2 text-right text-txt-muted w-16">Thao tác</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border">
                                                                {linkedAnnual.sort((a, b) => a.Year - b.Year).map(ap => {
                                                                    const apRate = ap.Amount > 0 ? ((ap.disbursed || 0) / ap.Amount) * 100 : 0;
                                                                    return (
                                                                        <tr key={ap.PlanID} className="group hover:bg-bg-muted/50">
                                                                            <td className="px-3 py-2 font-bold text-txt-primary">{ap.Year}</td>
                                                                            <td className="px-3 py-2 text-txt-secondary">{ap.DecisionNumber || '—'}</td>
                                                                            <td className="px-3 py-2 text-right font-mono font-bold text-primary-500">{formatCurrency(ap.Amount)}</td>
                                                                            <td className="px-3 py-2 text-right font-mono text-emerald-500">{formatCurrency(ap.disbursed || 0)}</td>
                                                                            <td className="px-3 py-2 text-right">
                                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${apRate >= 90 ? 'bg-emerald-500/10 text-emerald-500' : apRate >= 50 ? 'bg-primary-500/10 text-primary-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                                                    {apRate.toFixed(1)}%
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right">
                                                                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); onEditPlan(ap); }}
                                                                                        className="p-1 text-txt-muted hover:text-primary-500 hover:bg-bg-muted rounded-xl"
                                                                                    >
                                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); onDeletePlan(ap.PlanID); }}
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
                                                        <div className="text-center py-4 text-txt-muted text-[10px]">Chưa có KH hằng năm trong giai đoạn này</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}

                            {/* Legal reference */}
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-2.5">
                                <p className="text-[10px] text-blue-500 font-medium flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                    <strong>Căn cứ:</strong> Luật ĐTC 58/2024/QH15 (Đ.49-55), sửa đổi bởi Luật 90/2025/QH15
                                </p>
                            </div>
                        </div>
                    );
                })()}

                {/* ─── SUB-TAB: HẰNG NĂM ─── */}
                {capitalSubTab === 'annual' && (() => {
                    let filteredAnnualPlans = [...annualPlans];
                    if (annualPeriodFilter !== 'all') {
                        const selectedMidTerm = capitalPlans.find(p => p.PlanID === annualPeriodFilter);
                        if (selectedMidTerm) {
                            filteredAnnualPlans = filteredAnnualPlans.filter(a =>
                                a.Year >= (selectedMidTerm.PeriodStart || 0) &&
                                a.Year <= (selectedMidTerm.PeriodEnd || 0)
                            );
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
                            {/* Summary bar */}
                            <div className="px-5 py-3 border-b border-border bg-bg-muted flex items-center justify-between">
                                <div className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">
                                    Tổng hợp Kế hoạch Hằng năm
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] text-txt-muted font-bold uppercase mb-0.5">Vốn giao</p>
                                        <p className="text-xs font-black text-primary-500">{formatCurrency(totalAnnualPlanAmount)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-txt-muted font-bold uppercase mb-0.5">Đã giải ngân</p>
                                        <p className="text-xs font-black text-emerald-600">{formatCurrency(totalAnnualDisbursed)}</p>
                                    </div>
                                    <div className="w-32">
                                        <div className="flex justify-between text-[10px] font-bold mb-1">
                                            <span className="text-txt-muted">Tỷ lệ</span>
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

                            {/* Annual table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="sticky top-0 z-10 bg-bg-muted text-[10px] font-black uppercase tracking-widest border-b border-border shadow-sm">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-txt-muted">Năm</th>
                                            <th className="px-4 py-2.5 text-left text-txt-muted">QĐ giao vốn</th>
                                            <th className="px-4 py-2.5 text-right text-txt-muted">Vốn giao</th>
                                            <th className="px-4 py-2.5 text-right text-txt-muted">Đã giải ngân</th>
                                            <th className="px-4 py-2.5 text-left text-txt-muted">Tỷ lệ</th>
                                            <th className="px-4 py-2.5 text-center text-txt-muted w-20">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredAnnualPlans.sort((a, b) => a.Year - b.Year).map(a => (
                                            <tr key={a.PlanID || (a as any).AllocationID} className="hover:bg-bg-muted/50 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <span className="font-bold text-txt-primary">Năm {a.Year}</span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-txt-secondary font-medium text-xs">{a.DecisionNumber}</span>
                                                    <p className="text-[10px] text-txt-muted italic">
                                                        {a.DateAssigned ? new Date(a.DateAssigned).toLocaleDateString('vi-VN') : ''}
                                                    </p>
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
                                                            onClick={() => onEditPlan({
                                                                PlanID: a.PlanID || (a as any).AllocationID,
                                                                ProjectID: a.ProjectID,
                                                                Year: a.Year,
                                                                Amount: a.Amount,
                                                                Source: a.Source,
                                                                DecisionNumber: a.DecisionNumber,
                                                                DateAssigned: a.DateAssigned,
                                                                DisbursedAmount: a.disbursed,
                                                                PlanType: 'annual',
                                                            } as CapitalPlan)}
                                                            className="p-1 hover:bg-bg-muted text-txt-muted hover:text-primary-500 rounded-xl transition-colors"
                                                            title="Sửa"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => onDeletePlan(a.PlanID || (a as any).AllocationID)}
                                                            className="p-1 hover:bg-red-500/10 text-txt-muted hover:text-red-500 rounded-xl transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-bg-muted/50 font-bold border-t border-border">
                                            <td className="px-4 py-2.5 text-txt-primary" colSpan={2}>Tổng cộng</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-primary-500 text-xs">{formatCurrency(totalAnnualPlanAmount)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-emerald-500 text-xs">{formatCurrency(totalAnnualDisbursed)}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`text-xs font-bold ${totalAnnualRate >= 50 ? 'text-emerald-500' : 'text-yellow-500'}`}>
                                                    {totalAnnualRate.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5" />
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* ─── Donut Chart: Nguồn vốn ─── */}
            <div className="bg-bg-surface p-5 rounded-2xl border border-border shadow-sm">
                <h3 className="text-sm font-bold text-txt-primary mb-4 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-purple-500" />
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
                                <span className="text-txt-muted">{s.name}</span>
                            </div>
                            <span className="font-bold text-txt-primary">{formatCurrency(s.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

CapitalPlanSection.displayName = 'CapitalPlanSection';
