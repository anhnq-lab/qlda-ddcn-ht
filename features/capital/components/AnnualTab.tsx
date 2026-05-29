import React from 'react';
import { Calendar, Landmark, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { SOURCE_LABELS, normalizeSource } from '../../../utils/capitalConstants';
import { EmptyState } from './EmptyState';
import { useSlidePanelSafe } from '../../../context/SlidePanelContext';

const ProjectCapitalTab = React.lazy(() => import('../../../components/common/ProjectCapitalTab').then(m => ({ default: m.ProjectCapitalTab })));

interface AnnualTabProps {
    plans: any[];
    yearFilter: number;
    searchTerm: string;
    navigate: (url: string) => void;
}

export const AnnualTab: React.FC<AnnualTabProps> = ({
    plans,
    yearFilter,
    searchTerm,
    navigate
}) => {
    const slidePanel = useSlidePanelSafe();

    const filtered = plans
        .filter((p: any) => p.year === yearFilter)
        .filter((p: any) => !searchTerm || (p.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a: any, b: any) => Number(b.amount) - Number(a.amount));

    const totalAlloc = filtered.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const totalDisb = filtered.reduce((s: number, p: any) => s + Number(p.disbursed_amount), 0);
    const totalNghiemThu = filtered.reduce((s: number, p: any) => s + Number(p.luy_ke_nghiem_thu), 0);

    if (filtered.length === 0) return <EmptyState icon={Calendar} text={`Chưa có KH vốn hàng năm ${yearFilter}`} />;

    return (
        <div className="section-card">
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <thead className="sticky top-0 z-10 bg-bg-subtle text-[10px] font-black uppercase tracking-widest border-b border-border shadow-sm shadow-slate-200/20">
                        <tr className="text-txt-muted">
                            <th className="px-4 py-3 text-left w-8 border-b border-border">STT</th>
                            <th className="px-4 py-3 text-left border-b border-border">Dự án</th>
                            <th className="px-4 py-3 text-left border-b border-border">QĐ giao vốn</th>
                            <th className="px-4 py-3 border-b border-border">Nguồn</th>
                            <th className="px-4 py-3 text-right border-b border-border">KHV {yearFilter}</th>
                            <th className="px-4 py-3 text-right border-b border-border">Lũy kế Nghiệm thu</th>
                            <th className="px-4 py-3 text-right border-b border-border">Đã giải ngân</th>
                            <th className="px-4 py-3 text-right border-b border-border">Còn lại</th>
                            <th className="px-4 py-3 text-center border-b border-border">Tỷ lệ GN</th>
                            <th className="px-4 py-3 text-center w-16 border-b border-border"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                        {filtered.map((p: any, idx: number) => {
                            const remaining = Number(p.amount) - Number(p.disbursed_amount);
                            const rate = Number(p.amount) > 0 ? (Number(p.disbursed_amount) / Number(p.amount)) * 100 : 0;
                            return (
                                <tr key={p.plan_id} 
                                    className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
                                    onClick={() => {
                                        if (slidePanel) {
                                            slidePanel.openPanel({
                                                title: `Vốn & Giải ngân: ${p.project_name}`,
                                                component: (
                                                    <React.Suspense fallback={<div className="p-8 text-center text-txt-muted"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2" />Đang tải dữ liệu vốn...</div>}>
                                                        <ProjectCapitalTab projectID={p.project_id} />
                                                    </React.Suspense>
                                                ),
                                                icon: <Landmark className="w-5 h-5 text-blue-500" />,
                                                url: `/projects/${p.project_id}?tab=capital`
                                            });
                                        } else {
                                            navigate(`/projects/${p.project_id}?tab=capital`);
                                        }
                                    }}
                                >
                                    <td className="px-4 py-2.5 text-gray-400 font-mono">{idx + 1}</td>
                                    <td className="px-4 py-2.5">
                                        <p className="font-bold text-txt-primary">{p.project_name}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{p.project_id}</p>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <p className="text-txt-secondary font-medium">{p.decision_number || '—'}</p>
                                        <p className="text-[10px] text-gray-400">{p.date_assigned}</p>
                                    </td>
                                    <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${(SOURCE_LABELS[normalizeSource(p.source)] || SOURCE_LABELS['NSĐP']).color}`}>{(SOURCE_LABELS[normalizeSource(p.source)] || SOURCE_LABELS['NSĐP']).label}</span></td>
                                    <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-300">{formatCurrency(Number(p.amount))}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400">{formatCurrency(Number(p.luy_ke_nghiem_thu))}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(p.disbursed_amount))}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-txt-muted">{formatCurrency(remaining)}</td>
                                    <td className="px-4 py-2.5 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <div className="w-14 h-1.5 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-blue-500' : 'bg-warning-500'}`} style={{ width: `${Math.min(rate, 100)}%` }} />
                                            </div>
                                            <span className={`text-[10px] font-bold ${rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-blue-600' : 'text-warning-600'}`}>{rate.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <div className="p-1 text-gray-400 group-hover:text-blue-600 transition-colors" title="Xem chi tiết">
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-blue-50/50 dark:bg-blue-900/20 font-bold border-t-2 border-blue-200 dark:border-blue-800">
                        <tr>
                            <td className="px-4 py-2.5" colSpan={4}><span className="text-txt-primary">TỔNG CỘNG</span></td>
                            <td className="px-4 py-2.5 text-right font-mono text-blue-600 dark:text-blue-300">{formatCurrency(totalAlloc)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400">{formatCurrency(totalNghiemThu)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(totalDisb)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-txt-muted">{formatCurrency(totalAlloc - totalDisb)}</td>
                            <td className="px-4 py-2.5 text-center text-xs font-bold text-blue-600 dark:text-blue-300">{totalAlloc > 0 ? ((totalDisb/totalAlloc)*100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : 0}%</td>
                            <td className="px-4 py-2.5"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default AnnualTab;
