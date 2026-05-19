/**
 * ProjectSettlementTab — Quyết toán dự án hoàn thành
 * Hiển thị: Tổng hợp vốn quyết toán, so sánh dự toán/thực tế,
 * danh sách hợp đồng đã thanh toán, và trạng thái thủ tục quyết toán.
 */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
    CheckCircle2, Clock, AlertTriangle, FileText,
    DollarSign, TrendingUp, TrendingDown, BarChart3,
    Wallet, ClipboardCheck, Building2, Calendar,
    Download, ChevronRight, Scale, Receipt
} from 'lucide-react';

interface Props { projectID: string; }

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtB = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} tỷ`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)} tr`;
    return fmt(n);
};

const SETTLEMENT_STEPS = [
    { id: 1, label: 'Hoàn công & nghiệm thu', icon: ClipboardCheck, color: 'blue' },
    { id: 2, label: 'Kiểm toán nội bộ', icon: Scale, color: 'violet' },
    { id: 3, label: 'Kiểm toán nhà nước', icon: Building2, color: 'amber' },
    { id: 4, label: 'Phê duyệt quyết toán', icon: CheckCircle2, color: 'emerald' },
    { id: 5, label: 'Lưu trữ hồ sơ', icon: FileText, color: 'slate' },
];

// ── Main Component ─────────────────────────────────────────────
export const ProjectSettlementTab: React.FC<Props> = ({ projectID }) => {

    // ── Fetch contracts ──
    const { data: contracts = [], isLoading: loadingContracts } = useQuery({
        queryKey: ['settlement-contracts', projectID],
        queryFn: async () => {
            const { data } = await (supabase as any)
                .from('contracts')
                .select('contract_id, contract_name, contract_value, paid_amount, status, end_date, contractor_id')
                .eq('project_id', projectID)
                .order('contract_value', { ascending: false });
            return (data || []) as any[];
        },
        staleTime: 5 * 60 * 1000,
    });

    // ── Fetch disbursements ──
    const { data: disbursements = [] } = useQuery({
        queryKey: ['settlement-disbursements', projectID],
        queryFn: async () => {
            const { data } = await (supabase as any)
                .from('disbursements')
                .select('id, amount, type, status, month, year, description')
                .eq('project_id', projectID)
                .in('status', ['Approved', 'approved', 'completed', 'Completed'])
                .order('year', { ascending: true })
                .order('month', { ascending: true });
            return (data || []) as any[];
        },
        staleTime: 5 * 60 * 1000,
    });

    // ── Fetch project info for totals ──
    const { data: project } = useQuery({
        queryKey: ['settlement-project-info', projectID],
        queryFn: async () => {
            const { data } = await (supabase as any)
                .from('projects')
                .select('project_name, total_investment, total_estimate, group_code, start_date, end_date')
                .eq('project_id', projectID)
                .maybeSingle();
            return data;
        },
        staleTime: 10 * 60 * 1000,
    });

    // ── Derived stats ──
    const stats = useMemo(() => {
        const totalApproved = disbursements.reduce((s: number, d: any) => {
            const amt = Number(d.amount) || 0;
            return d.type === 'ThuHoiTamUng' ? s - amt : s + amt;
        }, 0);

        const totalContractValue = contracts.reduce((s: number, c: any) => s + (Number(c.contract_value) || 0), 0);
        const totalPaid = contracts.reduce((s: number, c: any) => s + (Number(c.paid_amount) || 0), 0);
        const totalInvestment = Number(project?.total_investment) || 0;
        const totalEstimate = Number(project?.total_estimate) || totalInvestment;

        const savingRate = totalEstimate > 0
            ? ((totalEstimate - totalApproved) / totalEstimate) * 100
            : 0;

        const completedContracts = contracts.filter((c: any) => c.status === 2 || c.status === 'completed').length;

        return {
            totalApproved: Math.max(0, totalApproved),
            totalContractValue,
            totalPaid,
            totalInvestment,
            totalEstimate,
            savingRate,
            completedContracts,
            totalContracts: contracts.length,
        };
    }, [disbursements, contracts, project]);

    const disbursedPercent = stats.totalEstimate > 0
        ? Math.min(100, (stats.totalApproved / stats.totalEstimate) * 100)
        : 0;

    // ── Render ──────────────────────────────────────────────────
    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-800 dark:bg-slate-950">
            <div className="max-w-[1400px] mx-auto p-4 space-y-5">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-violet-500" />
                            Quyết toán dự án
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Tổng hợp vốn, hợp đồng và thủ tục quyết toán
                        </p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Xuất báo cáo
                    </button>
                </div>

                {/* ── KPI Row ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        {
                            label: 'Tổng mức đầu tư',
                            value: fmtB(stats.totalEstimate),
                            sub: 'Theo quyết định phê duyệt',
                            icon: Wallet,
                            color: 'blue'
                        },
                        {
                            label: 'Đã giải ngân',
                            value: fmtB(stats.totalApproved),
                            sub: `${disbursedPercent.toFixed(1)}% tổng mức`,
                            icon: DollarSign,
                            color: 'emerald'
                        },
                        {
                            label: 'Tiết kiệm vốn',
                            value: fmtB(Math.max(0, stats.totalEstimate - stats.totalApproved)),
                            sub: stats.savingRate >= 0
                                ? `${stats.savingRate.toFixed(1)}% so với TM`
                                : 'Vượt dự toán',
                            icon: stats.savingRate >= 0 ? TrendingDown : TrendingUp,
                            color: stats.savingRate >= 0 ? 'emerald' : 'red'
                        },
                        {
                            label: 'Hợp đồng hoàn thành',
                            value: `${stats.completedContracts}/${stats.totalContracts}`,
                            sub: 'Đã nghiệm thu thanh toán',
                            icon: CheckCircle2,
                            color: 'violet'
                        },
                    ].map((kpi, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{kpi.label}</p>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center
                                    ${kpi.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                      kpi.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                      kpi.color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
                                      'bg-violet-100 dark:bg-violet-900/30'}`}>
                                    <kpi.icon className={`w-3.5 h-3.5
                                        ${kpi.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                          kpi.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                                          kpi.color === 'red' ? 'text-red-600 dark:text-red-400' :
                                          'text-violet-600 dark:text-violet-400'}`} />
                                </div>
                            </div>
                            <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{kpi.value}</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{kpi.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Progress bar ── */}
                <div className="bg-white dark:bg-slate-800 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-violet-500" />
                            <span className="text-sm font-bold text-gray-800 dark:text-slate-100">Tiến độ giải ngân vốn quyết toán</span>
                        </div>
                        <span className="text-sm font-black text-violet-600 dark:text-violet-400">{disbursedPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary-500 transition-all duration-700"
                            style={{ width: `${Math.min(100, disbursedPercent)}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400 dark:text-slate-500">
                        <span>Đã quyết toán: <b className="text-gray-700 dark:text-slate-200">{fmtB(stats.totalApproved)} đ</b></span>
                        <span>Tổng mức: <b className="text-gray-700 dark:text-slate-200">{fmtB(stats.totalEstimate)} đ</b></span>
                    </div>
                </div>

                {/* ── Settlement Steps ── */}
                <div className="bg-white dark:bg-slate-800 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <ClipboardCheck className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-bold text-gray-800 dark:text-slate-100">Thủ tục quyết toán</span>
                    </div>
                    <div className="flex items-center gap-0 overflow-x-auto pb-1">
                        {SETTLEMENT_STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            // Determine status based on disbursement progress (simplified)
                            const isComplete = idx < Math.floor(disbursedPercent / 25);
                            const isActive = idx === Math.floor(disbursedPercent / 25);
                            return (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center gap-1.5 min-w-[100px] flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                                            ${isComplete ? 'bg-emerald-500 border-emerald-500 text-white' :
                                              isActive ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-400 text-violet-600 dark:text-violet-400' :
                                              'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-300 dark:text-slate-600'}`}>
                                            {isComplete
                                                ? <CheckCircle2 className="w-5 h-5" />
                                                : <Icon className="w-4 h-4" />
                                            }
                                        </div>
                                        <p className={`text-[10px] font-semibold text-center leading-tight max-w-[90px]
                                            ${isComplete ? 'text-emerald-600 dark:text-emerald-400' :
                                              isActive ? 'text-violet-600 dark:text-violet-400' :
                                              'text-gray-400 dark:text-slate-600'}`}>
                                            {step.label}
                                        </p>
                                    </div>
                                    {idx < SETTLEMENT_STEPS.length - 1 && (
                                        <ChevronRight className={`w-4 h-4 shrink-0
                                            ${isComplete ? 'text-emerald-400' : 'text-gray-200 dark:text-slate-700'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* ── Contracts table ── */}
                <div className="bg-white dark:bg-slate-800 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-bold text-gray-800 dark:text-slate-100">Danh sách hợp đồng quyết toán</span>
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                            {contracts.length} hợp đồng
                        </span>
                    </div>
                    {loadingContracts ? (
                        <div className="flex items-center justify-center py-12 text-sm text-slate-400">Đang tải...</div>
                    ) : contracts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <Receipt className="w-8 h-8 text-gray-200 dark:text-slate-700" />
                            <p className="text-sm text-gray-400 dark:text-slate-500">Chưa có hợp đồng nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">Tên hợp đồng</th>
                                        <th className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">Giá trị HĐ</th>
                                        <th className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">Đã thanh toán</th>
                                        <th className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">Còn lại</th>
                                        <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">Trạng thái</th>
                                        <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">Ngày kết thúc</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                    {contracts.map((c: any) => {
                                        const val = Number(c.contract_value) || 0;
                                        const paid = Number(c.paid_amount) || 0;
                                        const remain = val - paid;
                                        const paidPct = val > 0 ? (paid / val) * 100 : 0;
                                        const isDone = c.status === 2 || c.status === 'completed';
                                        return (
                                            <tr key={c.contract_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[280px]">{c.contract_name || '—'}</p>
                                                    <div className="mt-1 w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-400 transition-all"
                                                            style={{ width: `${Math.min(100, paidPct)}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-slate-200 tabular-nums">
                                                    {val > 0 ? `${fmtB(val)} đ` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                    {paid > 0 ? `${fmtB(paid)} đ` : '—'}
                                                    <span className="text-[10px] font-normal text-gray-400 dark:text-slate-500 ml-1">
                                                        {val > 0 ? `(${paidPct.toFixed(0)}%)` : ''}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-semibold tabular-nums ${remain > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-gray-400 dark:text-slate-600'}`}>
                                                    {remain > 0 ? `${fmtB(remain)} đ` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                                                        ${isDone ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                                          c.status === 1 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                                          'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                                                        {isDone
                                                            ? <><CheckCircle2 className="w-3 h-3" /> Hoàn thành</>
                                                            : c.status === 1
                                                            ? <><Clock className="w-3 h-3" /> Đang TH</>
                                                            : <><AlertTriangle className="w-3 h-3" /> Chưa rõ</>
                                                        }
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-500 dark:text-slate-400">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {c.end_date
                                                            ? new Date(c.end_date).toLocaleDateString('vi-VN')
                                                            : '—'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* Totals row */}
                                {contracts.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-violet-50/60 dark:bg-violet-900/10 border-t-2 border-violet-200 dark:border-violet-800/40">
                                            <td className="px-4 py-2.5 font-black text-violet-700 dark:text-violet-300 text-xs">TỔNG CỘNG</td>
                                            <td className="px-4 py-2.5 text-right font-black text-gray-800 dark:text-slate-100 tabular-nums">
                                                {fmtB(stats.totalContractValue)} đ
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                {fmtB(stats.totalPaid)} đ
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-black text-warning-600 dark:text-warning-400 tabular-nums">
                                                {fmtB(Math.max(0, stats.totalContractValue - stats.totalPaid))} đ
                                            </td>
                                            <td colSpan={2} className="px-4 py-2.5 text-center text-[10px] text-violet-500 dark:text-violet-400 font-semibold">
                                                {stats.completedContracts}/{stats.totalContracts} hợp đồng hoàn thành
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Ghi chú quyết toán ── */}
                <div className="bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800/40 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-warning-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-warning-700 dark:text-warning-400 mb-1">Lưu ý quyết toán vốn đầu tư</p>
                            <ul className="text-xs text-warning-600 dark:text-warning-500 space-y-0.5 list-disc list-inside">
                                <li>Quyết toán phải hoàn thành trong vòng <b>12 tháng</b> kể từ khi dự án hoàn thành (Nghị định 99/2021/NĐ-CP)</li>
                                <li>Hồ sơ quyết toán cần bao gồm đầy đủ: biên bản nghiệm thu, thanh lý hợp đồng, và kết quả kiểm toán</li>
                                <li>Chủ đầu tư chịu trách nhiệm lưu trữ hồ sơ quyết toán tối thiểu <b>10 năm</b></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectSettlementTab;
