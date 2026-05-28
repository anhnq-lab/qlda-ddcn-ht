import React from 'react';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { MONTHS } from '../../../utils/capitalConstants';
import { EmptyState } from './EmptyState';

interface DisbPlanTabProps {
    disbPlans: any[];
    annualPlans: any[];
    yearFilter: number;
    searchTerm: string;
}

const currentMonth = new Date().getMonth() + 1; // 1-12

function fmtB(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} tỷ`;
    if (n >= 1e6) return `${(n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} tr`;
    return formatCurrency(n);
}

export const DisbPlanTab: React.FC<DisbPlanTabProps> = ({
    disbPlans,
    annualPlans,
    yearFilter,
    searchTerm
}) => {
    // Group by project
    const yearDisbPlans = disbPlans.filter((d: any) => d.year === yearFilter);
    const projectIds: string[] = [...new Set<string>(yearDisbPlans.map((d: any) => d.project_id))].filter(pid => !searchTerm || (yearDisbPlans.find((d:any) => d.project_id === pid)?.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()));

    if (projectIds.length === 0) return <EmptyState icon={BarChart3} text={`Chưa có KH giải ngân ${yearFilter}`} />;

    return (
        <div className="section-card">
            <div className="section-card-header">
                <span>Quản lý nguồn vốn & KH giải ngân {yearFilter} — Theo tháng</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                        <tr className="text-slate-500 dark:text-slate-400">
                            <th className="px-3 py-2 text-left sticky left-0 z-10 min-w-[200px] border-b border-slate-200 dark:border-slate-700" style={{ background: 'inherit' }}>Dự án</th>
                            <th className="px-3 py-2 text-right min-w-[80px] border-b border-slate-200 dark:border-slate-700">KHV</th>
                            {MONTHS.map((m, i) => <th key={m} className={`px-2 py-2 text-right min-w-[80px] border-b border-slate-200 dark:border-slate-700 ${i + 1 === currentMonth ? 'bg-primary-100/60 dark:bg-primary-900/20' : ''}`}>{m}</th>)}
                            <th className="px-3 py-2 text-right min-w-[90px] border-b border-slate-200 dark:border-slate-700">Tổng KH GN</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {projectIds.map((pid) => {
                            const pPlans = yearDisbPlans.filter((d: any) => d.project_id === pid);
                            const pName = pPlans[0]?.project_name || pid;
                            const monthlyMap = new Map<number, number>();
                            pPlans.forEach((d: any) => monthlyMap.set(d.month, Number(d.planned_amount) || 0));
                            const totalPlanned = Array.from(monthlyMap.values()).reduce((s, v) => s + v, 0);
                            const annualPlan = annualPlans.find((a: any) => a.project_id === pid && a.year === yearFilter);
                            const khv = annualPlan ? Number(annualPlan.amount) : 0;

                            return (
                                <tr key={pid} className="hover:bg-primary-50/20 dark:hover:bg-primary-900/5 transition-colors">
                                    <td className="px-3 py-2 sticky left-0 bg-white dark:bg-slate-800 z-10">
                                        <p className="font-bold text-gray-800 dark:text-slate-100 truncate">{pName}</p>
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-blue-600 dark:text-blue-300">{khv > 0 ? fmtB(khv) : '—'}</td>
                                    {MONTHS.map((_, i) => {
                                        const v = monthlyMap.get(i + 1) || 0;
                                        return <td key={i} className={`px-2 py-2 text-right font-mono text-slate-600 dark:text-slate-300 ${i + 1 === currentMonth ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''}`}>{v > 0 ? fmtB(v) : ''}</td>;
                                    })}
                                    <td className="px-3 py-2 text-right font-mono font-bold text-primary-600 dark:text-primary-300">{totalPlanned > 0 ? fmtB(totalPlanned) : '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-primary-50/30 dark:bg-primary-900/10 font-bold border-t-2 border-primary-200 dark:border-primary-800">
                        <tr>
                            <td className="px-3 py-2 sticky left-0 bg-primary-50/30 dark:bg-primary-900/10 z-10 font-black text-gray-800 dark:text-slate-100">TỔNG</td>
                            <td className="px-3 py-2 text-right font-mono text-blue-600 dark:text-blue-300">{fmtB(projectIds.reduce((s: number, pid: string) => { const ap = annualPlans.find((a:any) => a.project_id === pid && a.year === yearFilter); return s + (ap ? Number(ap.amount) : 0); }, 0))}</td>
                            {MONTHS.map((_, i) => {
                                const total = projectIds.reduce((s: number, pid: string) => {
                                    const d = yearDisbPlans.find((x:any) => x.project_id === pid && x.month === i + 1);
                                    return s + (d ? Number(d.planned_amount) : 0);
                                }, 0);
                                return <td key={i} className={`px-2 py-2 text-right font-mono text-primary-600 dark:text-primary-300 ${i + 1 === currentMonth ? 'bg-primary-100/60 dark:bg-primary-900/20' : ''}`}>{total > 0 ? fmtB(total) : ''}</td>;
                            })}
                            <td className="px-3 py-2 text-right font-mono text-primary-600 dark:text-primary-300 font-black">{fmtB(yearDisbPlans.reduce((s:number, d:any) => s + (Number(d.planned_amount) || 0), 0))}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default DisbPlanTab;
