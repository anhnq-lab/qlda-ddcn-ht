import React, { useMemo } from 'react';
import {
    CalendarRange, Calendar, Building2, ChevronDown, ChevronRight, FileText, ArrowRight, Landmark
} from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { APPROVAL_BADGES, SOURCE_LABELS, normalizeSource } from '../../../utils/capitalConstants';
import { EmptyState } from './EmptyState';

interface MidTermTabProps {
    plans: any[];
    annualPlans: any[];
    searchTerm: string;
    expandedPlan: string | null;
    setExpandedPlan: (v: string | null) => void;
    navigate: (url: string) => void;
}

function fmtB(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} tỷ`;
    if (n >= 1e6) return `${(n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} tr`;
    return formatCurrency(n);
}

export const MidTermTab: React.FC<MidTermTabProps> = ({
    plans,
    annualPlans,
    searchTerm,
    expandedPlan,
    setExpandedPlan,
    navigate
}) => {
    const filtered = plans.filter((p: any) => !searchTerm || (p.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Group by period
    const grouped = useMemo(() => {
        const map = new Map<string, any[]>();
        filtered.forEach((p: any) => {
            const key = `${p.period_start}-${p.period_end}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(p);
        });
        return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filtered]);

    if (filtered.length === 0) return <EmptyState icon={CalendarRange} text="Chưa có KH vốn trung hạn" />;

    return (
        <div className="space-y-4">
            {grouped.map(([period, grpPlans]) => {
                const total = grpPlans.reduce((s: number, p: any) => s + Number(p.amount), 0);
                const disbursed = grpPlans.reduce((s: number, p: any) => s + Number(p.disbursed_amount), 0);
                const rate = total > 0 ? (disbursed / total) * 100 : 0;
                return (
                    <div key={period} className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-base font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600" /> Giai đoạn {period}
                            </h2>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                                <span>Tổng: <span className="text-blue-700">{fmtB(total)}</span></span>
                                <span>GN: <span className={rate >= 50 ? 'text-emerald-600' : 'text-warning-600'}>{rate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span></span>
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded-full">{grpPlans.length} DA</span>
                            </div>
                        </div>
                        {grpPlans.map((plan: any) => {
                            const isExp = expandedPlan === plan.plan_id;
                            const badge = APPROVAL_BADGES[plan.approval_status || 'draft'];
                            const BadgeIcon = badge.icon;
                            const dr = Number(plan.amount) > 0 ? (Number(plan.disbursed_amount) / Number(plan.amount)) * 100 : 0;
                            const linked = annualPlans.filter((a: any) => a.project_id === plan.project_id && a.year >= plan.period_start && a.year <= plan.period_end);

                            return (
                                <div key={plan.plan_id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors" onClick={() => setExpandedPlan(isExp ? null : plan.plan_id)}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {isExp ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-blue-600" />}
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-gray-400" /> {plan.project_name}
                                                    </h3>
                                                    <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 ml-5">{plan.decision_number} • {plan.date_assigned} • <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${(SOURCE_LABELS[plan.source] || SOURCE_LABELS['NSĐP']).color}`}>{(SOURCE_LABELS[plan.source] || SOURCE_LABELS['NSĐP']).label}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-blue-700 dark:text-blue-400">{formatCurrency(Number(plan.amount))}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                                                        <div className="h-2 w-20 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden"><div className={`h-full rounded-full ${dr >= 80 ? 'bg-emerald-500' : dr >= 50 ? 'bg-blue-500' : 'bg-warning-500'}`} style={{ width: `${Math.min(dr, 100)}%` }} /></div>
                                                        <span className={`text-[10px] font-bold ${dr >= 80 ? 'text-emerald-600' : dr >= 50 ? 'text-blue-600' : 'text-warning-600'}`}>GN {dr.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 whitespace-nowrap ${badge.color}`}>
                                                    <BadgeIcon className="w-3 h-3" /> {badge.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {isExp && (
                                        <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                            <div className="grid grid-cols-4 gap-3 mb-4">
                                                {[
                                                    { label: 'Tổng KH trung hạn', value: formatCurrency(Number(plan.amount)), cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' },
                                                    { label: 'Đã giải ngân', value: formatCurrency(Number(plan.disbursed_amount)), cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
                                                    { label: 'Đã phân bổ HN', value: formatCurrency(linked.reduce((s:number, a:any) => s + Number(a.amount), 0)), cls: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' },
                                                    { label: 'Chưa phân bổ', value: formatCurrency(Math.max(0, Number(plan.amount) - linked.reduce((s:number, a:any) => s + Number(a.amount), 0))), cls: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
                                                ].map(kpi => (
                                                    <div key={kpi.label} className={`p-3 rounded-lg ${kpi.cls.split(' ').slice(0,2).join(' ')}`}>
                                                        <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">{kpi.label}</p>
                                                        <p className={`text-sm font-black mt-1 ${kpi.cls.split(' ').pop()}`}>{kpi.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            {plan.notes && <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg mb-3 text-xs text-gray-600 dark:text-slate-300 italic border border-gray-100 dark:border-slate-600 flex items-start gap-1.5"><FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" /><span>{plan.notes}</span></div>}
                                            {linked.length > 0 && (
                                                <>
                                                    <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Phân bổ theo năm ({linked.length} KH)</h5>
                                                    <table className="w-full text-xs mb-3">
                                                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                                                            <tr className="text-slate-500 dark:text-slate-400"><th className="px-3 py-1.5 text-left border-b border-slate-200 dark:border-slate-700">Năm</th><th className="px-3 py-1.5 text-left border-b border-slate-200 dark:border-slate-700">QĐ</th><th className="px-3 py-1.5 text-right border-b border-slate-200 dark:border-slate-700">Vốn giao</th><th className="px-3 py-1.5 text-right border-b border-slate-200 dark:border-slate-700">Đã GN</th><th className="px-3 py-1.5 text-right border-b border-slate-200 dark:border-slate-700">Tỷ lệ</th></tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                            {linked.sort((a:any,b:any) => a.year - b.year).map((ap: any) => {
                                                                const r = Number(ap.amount) > 0 ? (Number(ap.disbursed_amount) / Number(ap.amount)) * 100 : 0;
                                                                return (
                                                                    <tr key={ap.plan_id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10">
                                                                        <td className="px-3 py-1.5 font-bold">{ap.year}</td>
                                                                        <td className="px-3 py-1.5 text-gray-600">{ap.decision_number || '—'}</td>
                                                                        <td className="px-3 py-1.5 text-right font-mono font-bold text-blue-700">{formatCurrency(Number(ap.amount))}</td>
                                                                        <td className="px-3 py-1.5 text-right font-mono text-emerald-600">{formatCurrency(Number(ap.disbursed_amount))}</td>
                                                                        <td className="px-3 py-1.5 text-right"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r >= 80 ? 'bg-emerald-100 text-emerald-600' : r >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-warning-100 text-warning-600'}`}>{r.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span></td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </>
                                            )}
                                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
                                                <div className="text-[10px] text-gray-500">{plan.approved_by && <span>Phê duyệt: <strong>{plan.approved_by}</strong> • {plan.approved_date}</span>}</div>
                                                <button onClick={() => navigate(`/projects/${plan.project_id}`)} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"><ArrowRight className="w-3 h-3" /> Xem dự án</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default MidTermTab;
