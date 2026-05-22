import React from 'react';
import { CalendarRange, Plus, Pencil, Trash2 } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { formatCurrency } from '../../../../../utils/format';
import { EmptyState } from '../../../../../components/ui/EmptyState';

interface MonthlyPlanRow {
    Id: string;
    Month: number;
    Year: number;
    PlannedAmount: number;
    ActualAmount: number;
    Notes?: string;
}

interface PlanSummary {
    totalPlanned: number;
    totalActual: number;
    rate: number;
}

interface MonthlyDisbursementSectionProps {
    planYearFilter: number;
    planYears: number[];
    setPlanYearFilter: (y: number) => void;
    filteredPlanData: MonthlyPlanRow[];
    planChartData: Array<{ label: string; planned: number; actual: number }>;
    planSummary: PlanSummary;
    onOpenPlanModal: () => void;
    onEditPlan: (row: MonthlyPlanRow) => void;
    onDeletePlan: (id: string) => void;
}

export const MonthlyDisbursementSection: React.FC<MonthlyDisbursementSectionProps> = ({
    planYearFilter,
    planYears,
    setPlanYearFilter,
    filteredPlanData,
    planChartData,
    planSummary,
    onOpenPlanModal,
    onEditPlan,
    onDeletePlan,
}) => {
    return (
        <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex flex-wrap justify-between items-center gap-3 bg-bg-muted">
                <h3 className="text-sm font-bold text-txt-primary uppercase tracking-wider flex items-center gap-2">
                    <CalendarRange className="w-4 h-4 text-violet-500" />
                    Kế hoạch giải ngân theo tháng
                </h3>
                <div className="flex items-center gap-2">
                    {/* Year tabs — hiện kể cả khi trống để luôn có context */}
                    {planYears.length > 0 ? (
                        <div className="flex bg-bg-muted border border-border rounded-xl p-0.5">
                            {planYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setPlanYearFilter(year)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${planYearFilter === year
                                        ? 'bg-bg-surface text-txt-primary shadow-sm'
                                        : 'text-txt-muted hover:text-txt-primary'
                                    }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span className="text-xs text-txt-muted italic">Chưa có năm nào</span>
                    )}

                    {/* Summary badges */}
                    {planYears.length > 0 && (
                        <div className="hidden md:flex items-center gap-2 text-xs">
                            <span className="px-2 py-1 rounded-full bg-violet-500/10 text-violet-500 font-bold">
                                KH: {formatCurrency(planSummary.totalPlanned)}
                            </span>
                            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                                TT: {formatCurrency(planSummary.totalActual)} ({planSummary.rate.toFixed(1)}%)
                            </span>
                        </div>
                    )}

                    <button
                        onClick={onOpenPlanModal}
                        className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all ml-2"
                    >
                        <Plus className="w-3.5 h-3.5" /> Lập KH tháng
                    </button>
                </div>
            </div>

            {/* Empty state khi chưa có kế hoạch tháng nào */}
            {planYears.length === 0 ? (
                <EmptyState
                    icon={<CalendarRange className="w-12 h-12 text-txt-muted" />}
                    title="Chưa có kế hoạch giải ngân theo tháng"
                    description='Nhấn "Lập KH tháng" để tạo kế hoạch giải ngân chi tiết theo từng tháng'
                    className="py-12 border-t border-border"
                />
            ) : (
                <>
                    {/* Chart — Planned vs Actual */}
                    <div className="px-6 pt-4 pb-2">
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={planChartData} barCategoryGap="15%">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-border-subtle, #e5e7eb)" />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={10}
                                        tick={{ fill: 'var(--txt-muted, #9ca3af)' }}
                                        interval={0}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={10}
                                        tick={{ fill: 'var(--txt-muted, #9ca3af)' }}
                                        width={55}
                                        tickFormatter={(v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(0)} tỷ` : `${(v / 1e6).toFixed(0)} tr`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: '1px solid var(--border-border, #e5e7eb)',
                                            backgroundColor: 'var(--bg-surface, #fff)',
                                            fontSize: 12,
                                        }}
                                        formatter={(value: unknown, name: unknown) => {
                                            const labels: Record<string, string> = { planned: 'Kế hoạch', actual: 'Thực tế' };
                                            return [formatCurrency(Number(value)), labels[String(name)] || String(name)];
                                        }}
                                        labelFormatter={(label: unknown) => `Tháng ${label}`}
                                    />
                                    <Legend formatter={(value: string) => {
                                        const labels: Record<string, string> = { planned: 'Kế hoạch giải ngân', actual: 'Giải ngân thực tế' };
                                        return <span className="text-xs text-txt-secondary">{labels[value] || value}</span>;
                                    }} />
                                    <Bar dataKey="planned" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.7} name="planned" />
                                    <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} name="actual" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Table or per-year empty state */}
                    {filteredPlanData.length > 0 ? (
                        <div className="px-6 pb-6 mt-4 border-t border-border pt-4">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 z-10 bg-bg-muted text-[10px] font-black uppercase tracking-widest border-b border-border shadow-sm">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-txt-muted">Tháng</th>
                                        <th className="px-3 py-2 text-right text-txt-muted">KH giải ngân</th>
                                        <th className="px-3 py-2 text-right text-txt-muted">Thực tế</th>
                                        <th className="px-3 py-2 text-right text-txt-muted">Tỷ lệ</th>
                                        <th className="px-3 py-2 text-left text-txt-muted">Ghi chú / Việc trong tháng</th>
                                        <th className="px-3 py-2 text-center text-txt-muted w-16">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {[...filteredPlanData].sort((a, b) => a.Month - b.Month).map(d => {
                                        const rate = d.PlannedAmount > 0 ? (d.ActualAmount / d.PlannedAmount) * 100 : 0;
                                        const isAuto = d.Id.startsWith('auto-');
                                        return (
                                            <tr key={d.Id} className="hover:bg-violet-500/5 transition-colors">
                                                <td className="px-3 py-2 font-bold text-txt-primary">
                                                    Tháng {d.Month}
                                                    {isAuto && (
                                                        <span className="ml-1 text-[9px] text-txt-muted font-normal italic">(tự động)</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono text-violet-500">
                                                    {d.PlannedAmount > 0 ? formatCurrency(d.PlannedAmount) : <span className="text-txt-muted">—</span>}
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono text-emerald-500">
                                                    {formatCurrency(d.ActualAmount)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {d.PlannedAmount > 0 ? (
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                            rate >= 90 ? 'bg-emerald-500/10 text-emerald-500' :
                                                            rate >= 50 ? 'bg-primary-500/10 text-primary-500' : 'bg-yellow-500/10 text-yellow-500'
                                                        }`}>{rate.toFixed(1)}%</span>
                                                    ) : (
                                                        <span className="text-txt-muted text-[10px]">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-txt-muted italic max-w-xs truncate" title={d.Notes}>
                                                    {d.Notes || '—'}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    {!isAuto && (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => onEditPlan(d)}
                                                                className="p-1 hover:bg-bg-muted text-txt-muted hover:text-violet-500 rounded-xl transition-colors"
                                                                title="Sửa kế hoạch"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => onDeletePlan(d.Id)}
                                                                className="p-1 hover:bg-red-500/10 text-txt-muted hover:text-red-500 rounded-xl transition-colors"
                                                                title="Xóa kế hoạch"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Footer tổng cộng */}
                                    <tr className="bg-violet-500/10 font-bold border-t-2 border-violet-500/20">
                                        <td className="px-3 py-2 text-txt-primary">Tổng cộng</td>
                                        <td className="px-3 py-2 text-right font-mono text-violet-500">{formatCurrency(planSummary.totalPlanned)}</td>
                                        <td className="px-3 py-2 text-right font-mono text-emerald-500">{formatCurrency(planSummary.totalActual)}</td>
                                        <td className="px-3 py-2 text-right">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                planSummary.rate >= 90 ? 'bg-emerald-500/10 text-emerald-500' :
                                                planSummary.rate >= 50 ? 'bg-primary-500/10 text-primary-500' :
                                                'bg-yellow-500/10 text-yellow-500'
                                            }`}>{planSummary.rate.toFixed(1)}%</span>
                                        </td>
                                        <td className="px-3 py-2" />
                                        <td className="px-3 py-2" />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState
                            icon={<CalendarRange className="w-10 h-10 text-txt-muted" />}
                            title={`Chưa có kế hoạch giải ngân cho năm ${planYearFilter}`}
                            description='Nhấn "Lập KH tháng" để tạo kế hoạch cho năm này'
                            className="py-10 border-t border-border"
                        />
                    )}
                </>
            )}
        </div>
    );
};
