import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { MONTHS } from '../../../utils/capitalConstants';
import { EmptyState } from './EmptyState';

interface DisbProgressTabProps {
    disbPlans: any[];
    disbursements: any[];
    annualPlans: any[];
    yearFilter: number;
    searchTerm: string;
}

const currentMonth = new Date().getMonth() + 1; // 1-12

function fmtB(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1, minimumFractionDigits: 0 })} tỷ`;
    if (n >= 1e6) return `${(n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} tr`;
    return formatCurrency(n);
}

export const DisbProgressTab: React.FC<DisbProgressTabProps> = ({
    disbPlans,
    disbursements,
    annualPlans,
    yearFilter,
    searchTerm
}) => {
    // Build actual disbursement by project × month from disbursements table
    const yearDisbs = disbursements.filter((d: any) => {
        const date = new Date(d.date);
        return date.getFullYear() === yearFilter && d.status !== 'Rejected';
    });
    
    const yearDisbPlans = disbPlans.filter((d: any) => d.year === yearFilter);

    // All project IDs that have either planned or actual data
    const projectIds = [...new Set([
        ...yearDisbs.map((d: any) => d.project_id),
        ...yearDisbPlans.map((d: any) => d.project_id),
    ])].filter(pid => {
        if (!searchTerm) return true;
        const name = yearDisbs.find((d:any) => d.project_id === pid)?.project_name || yearDisbPlans.find((d:any) => d.project_id === pid)?.project_name || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (projectIds.length === 0) return <EmptyState icon={TrendingUp} text={`Chưa có dữ liệu giải ngân ${yearFilter}`} />;

    return (
        <div className="section-card">
            <div className="section-card-header">
                <span>Quản lý tiến độ giải ngân {yearFilter} — So sánh KH vs Thực tế</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                        <tr className="text-slate-500 dark:text-slate-400">
                            <th className="px-3 py-2 text-left sticky left-0 z-10 min-w-[200px] border-b border-slate-200 dark:border-slate-700" style={{ background: 'inherit' }}>Dự án</th>
                            <th className="px-3 py-2 text-center min-w-[50px] border-b border-slate-200 dark:border-slate-700">Loại</th>
                            <th className="px-3 py-2 text-right min-w-[80px] border-b border-slate-200 dark:border-slate-700">KHV</th>
                            {MONTHS.map((m, i) => <th key={m} className={`px-2 py-2 text-right min-w-[80px] border-b border-slate-200 dark:border-slate-700 ${i + 1 === currentMonth ? 'bg-emerald-100/40 dark:bg-emerald-900/20' : ''}`}>{m}</th>)}
                            <th className="px-3 py-2 text-right min-w-[90px] border-b border-slate-200 dark:border-slate-700">Tổng</th>
                            <th className="px-3 py-2 text-center min-w-[60px] border-b border-slate-200 dark:border-slate-700">Tỷ lệ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projectIds.map((pid) => {
                            const pName = yearDisbs.find((d:any) => d.project_id === pid)?.project_name || yearDisbPlans.find((d:any) => d.project_id === pid)?.project_name || pid;
                            
                            // Planned by month
                            const plannedMap = new Map<number, number>();
                            yearDisbPlans.filter((d:any) => d.project_id === pid).forEach((d:any) => plannedMap.set(d.month, Number(d.planned_amount) || 0));
                            
                            // Actual by month
                            const actualMap = new Map<number, number>();
                            yearDisbs.filter((d:any) => d.project_id === pid).forEach((d:any) => {
                                const m = new Date(d.date).getMonth() + 1;
                                actualMap.set(m, (actualMap.get(m) || 0) + Number(d.amount));
                            });

                            const totalPlanned = Array.from(plannedMap.values()).reduce((s, v) => s + v, 0);
                            const totalActual = Array.from(actualMap.values()).reduce((s, v) => s + v, 0);
                            const annualPlan = annualPlans.find((a:any) => a.project_id === pid && a.year === yearFilter);
                            const khv = annualPlan ? Number(annualPlan.amount) : 0;
                            const rate = khv > 0 ? (totalActual / khv) * 100 : 0;

                            return (
                                <React.Fragment key={pid}>
                                    {/* Row KH (planned) */}
                                    <tr className="border-t border-gray-200 dark:border-slate-600 bg-blue-50/20 dark:bg-blue-900/5">
                                        <td className="px-3 py-1.5 sticky left-0 bg-blue-50/20 dark:bg-blue-900/5 z-10" rowSpan={2}>
                                            <p className="font-bold text-gray-800 dark:text-slate-100 truncate">{pName}</p>
                                        </td>
                                        <td className="px-3 py-1.5 text-center"><span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[9px] font-bold rounded">KH</span></td>
                                        <td className="px-3 py-1.5 text-right font-mono text-blue-600 dark:text-blue-300" rowSpan={2}>{khv > 0 ? fmtB(khv) : '—'}</td>
                                        {MONTHS.map((_, i) => {
                                            const v = plannedMap.get(i + 1) || 0;
                                            return <td key={i} className={`px-2 py-1.5 text-right font-mono text-blue-500 dark:text-blue-300/70 ${i + 1 === currentMonth ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>{v > 0 ? fmtB(v) : ''}</td>;
                                        })}
                                        <td className="px-3 py-1.5 text-right font-mono text-blue-600 dark:text-blue-300 font-bold">{totalPlanned > 0 ? fmtB(totalPlanned) : '—'}</td>
                                        <td className="px-3 py-1.5 text-center" rowSpan={2}>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black ${rate >= 80 ? 'bg-emerald-100 text-emerald-600' : rate >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-warning-100 text-warning-600'}`}>
                                                {rate.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}%
                                            </span>
                                        </td>
                                    </tr>
                                    {/* Row TT (actual) */}
                                    <tr className="bg-emerald-50/20 dark:bg-emerald-900/5 border-b border-gray-200 dark:border-slate-700">
                                        <td className="px-3 py-1.5 text-center"><span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[9px] font-bold rounded">TT</span></td>
                                        {MONTHS.map((_, i) => {
                                            const vActual = actualMap.get(i + 1) || 0;
                                            const vPlanned = plannedMap.get(i + 1) || 0;
                                            const diff = vActual - vPlanned;
                                            return (
                                                <td key={i} className={`px-2 py-1.5 text-right font-mono ${i + 1 === currentMonth ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                                                    {vActual > 0 ? <span className={diff >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500 dark:text-red-400'}>{fmtB(vActual)}</span> : ''}
                                                </td>
                                            );
                                        })}
                                        <td className="px-3 py-1.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">{totalActual > 0 ? fmtB(totalActual) : '—'}</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-emerald-50/30 dark:bg-emerald-900/10 font-bold border-t-2 border-emerald-200 dark:border-emerald-800">
                        <tr>
                            <td className="px-3 py-2 sticky left-0 bg-emerald-50/30 dark:bg-emerald-900/10 z-10 font-black text-gray-800 dark:text-slate-100">TỔNG</td>
                            <td className="px-3 py-2 text-center text-[9px] font-bold text-blue-600">KH</td>
                            <td className="px-3 py-2 text-right font-mono text-blue-600 dark:text-blue-300">{fmtB(projectIds.reduce((s: number, pid: string) => { const ap = annualPlans.find((a:any) => a.project_id === pid && a.year === yearFilter); return s + (ap ? Number(ap.amount) : 0); }, 0))}</td>
                            {MONTHS.map((_, i) => {
                                const total = projectIds.reduce((s: number, pid: string) => {
                                    const d = yearDisbPlans.find((x:any) => x.project_id === pid && x.month === i + 1);
                                    return s + (d ? Number(d.planned_amount) : 0);
                                }, 0);
                                return <td key={`kh-${i}`} className={`px-2 py-2 text-right font-mono text-blue-600 dark:text-blue-300 ${i + 1 === currentMonth ? 'bg-emerald-100/40 dark:bg-emerald-900/20' : ''}`}>{total > 0 ? fmtB(total) : ''}</td>;
                            })}
                            <td className="px-3 py-2 text-right font-mono text-blue-600 dark:text-blue-300 font-black">{fmtB(yearDisbPlans.reduce((s:number, d:any) => s + (Number(d.planned_amount) || 0), 0))}</td>
                            <td className="px-3 py-2"></td>
                        </tr>
                        <tr>
                            <td className="px-3 py-2 sticky left-0 bg-emerald-50/30 dark:bg-emerald-900/10 z-10"></td>
                            <td className="px-3 py-2 text-center text-[9px] font-bold text-emerald-600">TT</td>
                            <td className="px-3 py-2"></td>
                            {MONTHS.map((_, i) => {
                                const total = projectIds.reduce((s: number, pid: string) => {
                                    return s + yearDisbs.filter((d:any) => d.project_id === pid && new Date(d.date).getMonth() === i).reduce((ss: number, d: any) => ss + Number(d.amount), 0);
                                }, 0);
                                return <td key={`tt-${i}`} className={`px-2 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold ${i + 1 === currentMonth ? 'bg-emerald-100/40 dark:bg-emerald-900/20' : ''}`}>{total > 0 ? fmtB(total) : ''}</td>;
                            })}
                            <td className="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black">{fmtB(yearDisbs.reduce((s:number, d:any) => s + (Number(d.amount) || 0), 0))}</td>
                            <td className="px-3 py-2"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            {/* Legend */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-700 flex items-center gap-4 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-100 rounded" /> KH = Kế hoạch</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-100 rounded" /> TT = Thực tế</span>
                <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500" /> Đỏ = Thấp hơn KH</span>
            </div>
        </div>
    );
};

export default DisbProgressTab;
