import React from 'react';
import { CalendarRange, Plus, Pencil, Trash2 } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { formatCurrency } from '../../../../../utils/format';


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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700">
                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <CalendarRange className="w-4 h-4 text-violet-600" />
                    Kế hoạch giải ngân theo tháng
                </h3>
                <div className="flex items-center gap-2">
                    {/* Year tabs */}
                    <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                        {planYears.map(year => (
                            <button
                                key={year}
                                onClick={() => setPlanYearFilter(year)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${planYearFilter === year
                                    ? 'bg-white dark:bg-slate-600 text-gray-800 dark:text-slate-100 shadow-sm'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                                }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>

                    {/* Summary badges */}
                    <div className="hidden md:flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold">
                            KH: {formatCurrency(planSummary.totalPlanned)}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold">
                            TT: {formatCurrency(planSummary.totalActual)} ({planSummary.rate.toFixed(1)}%)
                        </span>
                    </div>

                    <button
                        onClick={onOpenPlanModal}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all ml-2"
                    >
                        <Plus className="w-3.5 h-3.5" /> Lập KH tháng
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="px-6 pt-4 pb-2">
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={planChartData} barCategoryGap="15%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#9ca3af' }} interval={0} />
                            <YAxis
                                axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#9ca3af' }} width={55}
                                tickFormatter={(v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(0)} tỷ` : `${(v / 1e6).toFixed(0)} tr`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                                formatter={(value: unknown, name: unknown) => {
                                    const labels: Record<string, string> = { planned: 'Kế hoạch', actual: 'Thực tế' };
                                    return [formatCurrency(Number(value)), labels[String(name)] || String(name)];
                                }}
                                labelFormatter={(label: unknown) => `Tháng ${label}`}
                            />
                            <Legend formatter={(value: string) => {
                                const labels: Record<string, string> = { planned: 'Kế hoạch giải ngân', actual: 'Giải ngân thực tế' };
                                return <span className="text-xs">{labels[value] || value}</span>;
                            }} />
                            <Bar dataKey="planned" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.7} name="planned" />
                            <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} name="actual" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table or empty state */}
            {filteredPlanData.length > 0 ? (
                <div className="px-6 pb-6 mt-4 border-t border-gray-100 dark:border-slate-700/50 pt-4">
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm">
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
                            {[...filteredPlanData].sort((a, b) => a.Month - b.Month).map(d => {
                                const rate = d.PlannedAmount > 0 ? (d.ActualAmount / d.PlannedAmount) * 100 : 0;
                                return (
                                    <tr key={d.Id} className="hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors">
                                        <td className="px-3 py-2 font-bold text-gray-800 dark:text-slate-100">Tháng {d.Month}</td>
                                        <td className="px-3 py-2 text-right font-mono text-violet-700 dark:text-violet-400">{formatCurrency(d.PlannedAmount)}</td>
                                        <td className="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(d.ActualAmount)}</td>
                                        <td className="px-3 py-2 text-right">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                rate >= 90 ? 'bg-emerald-100 text-emerald-600' :
                                                rate >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-warning-100 text-warning-600'
                                            }`}>{rate.toFixed(1)}%</span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 italic max-w-xs truncate" title={d.Notes}>{d.Notes || '—'}</td>
                                        <td className="px-3 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {!d.Id.startsWith('auto-') && (
                                                    <>
                                                        <button onClick={() => onEditPlan(d)} className="p-1 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-gray-400 hover:text-violet-600 rounded-lg transition-colors" title="Sửa kế hoạch">
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => onDeletePlan(d.Id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-600 rounded-lg transition-colors" title="Xóa kế hoạch">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Footer row */}
                            <tr className="bg-violet-50/50 dark:bg-violet-900/20 font-bold border-t border-violet-200 dark:border-violet-800">
                                <td className="px-3 py-2 text-gray-800 dark:text-slate-100">Tổng cộng</td>
                                <td className="px-3 py-2 text-right font-mono text-violet-700 dark:text-violet-400">{formatCurrency(planSummary.totalPlanned)}</td>
                                <td className="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(planSummary.totalActual)}</td>
                                <td className="px-3 py-2 text-right">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        planSummary.rate >= 90 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                        planSummary.rate >= 50 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' :
                                        'bg-warning-100 text-warning-600 dark:bg-warning-900/40 dark:text-warning-400'
                                    }`}>{planSummary.rate.toFixed(1)}%</span>
                                </td>
                                <td className="px-3 py-2" /><td className="px-3 py-2" />
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="px-6 py-10 text-center text-gray-400 dark:text-slate-500 text-sm border-t border-gray-100 dark:border-slate-700/50">
                    <CalendarRange className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    Chưa có kế hoạch giải ngân cho năm {planYearFilter}
                </div>
            )}
        </div>
    );
};
