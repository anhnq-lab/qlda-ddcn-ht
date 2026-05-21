/**
 * ProjectSettlementTab — Quyết toán dự án hoàn thành
 * Hiển thị: Tổng hợp vốn quyết toán, so sánh dự toán/thực tế,
 * danh sách hợp đồng đã thanh toán, và trạng thái thủ tục quyết toán.
 */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StatCard } from '@/components/common/StatCard';
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
        <div className="h-full overflow-y-auto bg-bg-muted/30">
            <div className="max-w-[1400px] mx-auto p-4 space-y-5">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-txt-primary flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-primary-500" />
                            Quyết toán dự án
                        </h1>
                        <p className="text-xs text-txt-muted mt-0.5">
                            Tổng hợp vốn, hợp đồng và thủ tục quyết toán
                        </p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-xl hover:bg-bg-muted text-txt-secondary transition-colors">
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
                            color: 'blue' as const
                        },
                        {
                            label: 'Đã giải ngân',
                            value: fmtB(stats.totalApproved),
                            sub: `${disbursedPercent.toFixed(1)}% tổng mức`,
                            icon: DollarSign,
                            color: 'emerald' as const
                        },
                        {
                            label: 'Tiết kiệm vốn',
                            value: fmtB(Math.max(0, stats.totalEstimate - stats.totalApproved)),
                            sub: stats.savingRate >= 0
                                ? `${stats.savingRate.toFixed(1)}% so với TM`
                                : 'Vượt dự toán',
                            icon: stats.savingRate >= 0 ? TrendingDown : TrendingUp,
                            color: stats.savingRate >= 0 ? ('emerald' as const) : ('rose' as const)
                        },
                        {
                            label: 'Hợp đồng hoàn thành',
                            value: `${stats.completedContracts}/${stats.totalContracts}`,
                            sub: 'Đã nghiệm thu thanh toán',
                            icon: CheckCircle2,
                            color: 'violet' as const
                        },
                    ].map((kpi, i) => (
                        <StatCard
                            key={i}
                            label={kpi.label}
                            value={kpi.value}
                            sublabel={kpi.sub}
                            icon={<kpi.icon size={20} />}
                            color={kpi.color}
                        />
                    ))}
                </div>

                {/* ── Progress bar ── */}
                <div className="bg-bg-surface rounded-2xl border border-border p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-bold text-txt-primary">Tiến độ giải ngân vốn quyết toán</span>
                        </div>
                        <span className="text-sm font-black text-primary-500">{disbursedPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 bg-bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-primary-500 transition-all duration-700"
                            style={{ width: `${Math.min(100, disbursedPercent)}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-txt-muted">
                        <span>Đã quyết toán: <b className="text-txt-secondary">{fmtB(stats.totalApproved)} đ</b></span>
                        <span>Tổng mức: <b className="text-txt-secondary">{fmtB(stats.totalEstimate)} đ</b></span>
                    </div>
                </div>

                {/* ── Settlement Steps ── */}
                <div className="bg-bg-surface rounded-2xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <ClipboardCheck className="w-4 h-4 text-primary-500" />
                        <span className="text-sm font-bold text-txt-primary">Thủ tục quyết toán</span>
                    </div>
                    <div className="flex items-center gap-0 overflow-x-auto pb-1">
                        {SETTLEMENT_STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isComplete = idx < Math.floor(disbursedPercent / 25);
                            const isActive = idx === Math.floor(disbursedPercent / 25);
                            return (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center gap-1.5 min-w-[100px] flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                                            ${isComplete ? 'bg-emerald-500 border-emerald-500 text-white' :
                                              isActive ? 'bg-primary-500/10 border-primary-500 text-primary-500' :
                                              'bg-bg-muted border-border text-txt-muted'}`}>
                                            {isComplete
                                                ? <CheckCircle2 className="w-5 h-5" />
                                                : <Icon className="w-4 h-4" />
                                            }
                                        </div>
                                        <p className={`text-[10px] font-bold text-center leading-tight max-w-[90px]
                                            ${isComplete ? 'text-emerald-500' :
                                              isActive ? 'text-primary-500' :
                                              'text-txt-muted'}`}>
                                            {step.label}
                                        </p>
                                    </div>
                                    {idx < SETTLEMENT_STEPS.length - 1 && (
                                        <ChevronRight className={`w-4 h-4 shrink-0
                                            ${isComplete ? 'text-emerald-500' : 'text-border'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* ── Contracts table ── */}
                <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-500" />
                        <span className="text-sm font-bold text-txt-primary">Danh sách hợp đồng quyết toán</span>
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-xl bg-bg-muted text-txt-muted border border-border">
                            {contracts.length} hợp đồng
                        </span>
                    </div>
                    {loadingContracts ? (
                        <div className="flex items-center justify-center py-12 text-sm text-txt-muted">Đang tải...</div>
                    ) : contracts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <Receipt className="w-8 h-8 text-txt-muted" />
                            <p className="text-sm text-txt-muted">Chưa có hợp đồng nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="sticky top-0 z-10 bg-bg-muted text-[10px] font-black uppercase tracking-widest border-b border-border shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 text-txt-muted">Tên hợp đồng</th>
                                        <th className="px-4 py-3 text-right text-txt-muted">Giá trị HĐ</th>
                                        <th className="px-4 py-3 text-right text-txt-muted">Đã thanh toán</th>
                                        <th className="px-4 py-3 text-right text-txt-muted">Còn lại</th>
                                        <th className="px-4 py-3 text-center text-txt-muted">Trạng thái</th>
                                        <th className="px-4 py-3 text-center text-txt-muted">Ngày kết thúc</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {contracts.map((c: any) => {
                                        const val = Number(c.contract_value) || 0;
                                        const paid = Number(c.paid_amount) || 0;
                                        const remain = val - paid;
                                        const paidPct = val > 0 ? (paid / val) * 100 : 0;
                                        const isDone = c.status === 2 || c.status === 'completed';
                                        return (
                                            <tr key={c.contract_id} className="hover:bg-bg-muted transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-txt-primary truncate max-w-[280px]">{c.contract_name || '—'}</p>
                                                    <div className="mt-1 w-full h-1.5 bg-bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-500 transition-all"
                                                            style={{ width: `${Math.min(100, paidPct)}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-txt-secondary tabular-nums">
                                                    {val > 0 ? `${fmtB(val)} đ` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-500 tabular-nums">
                                                    {paid > 0 ? `${fmtB(paid)} đ` : '—'}
                                                    <span className="text-[10px] font-normal text-txt-muted ml-1">
                                                        {val > 0 ? `(${paidPct.toFixed(0)}%)` : ''}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-semibold tabular-nums ${remain > 0 ? 'text-warning-500' : 'text-txt-muted'}`}>
                                                    {remain > 0 ? `${fmtB(remain)} đ` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-bold
                                                        ${isDone ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                          c.status === 1 ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' :
                                                          'bg-bg-muted text-txt-muted border border-border'}`}>
                                                        {isDone
                                                            ? <><CheckCircle2 className="w-3 h-3" /> Hoàn thành</>
                                                            : c.status === 1
                                                            ? <><Clock className="w-3 h-3" /> Đang TH</>
                                                            : <><AlertTriangle className="w-3 h-3" /> Chưa rõ</>
                                                        }
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-txt-muted">
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
                                        <tr className="bg-primary-50/5 border-t-2 border-primary-500/20">
                                            <td className="px-4 py-2.5 font-bold text-primary-500 text-xs">TỔNG CỘNG</td>
                                            <td className="px-4 py-2.5 text-right font-bold text-txt-primary tabular-nums">
                                                {fmtB(stats.totalContractValue)} đ
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-bold text-emerald-500 tabular-nums">
                                                {fmtB(stats.totalPaid)} đ
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-bold text-warning-500 tabular-nums">
                                                {fmtB(Math.max(0, stats.totalContractValue - stats.totalPaid))} đ
                                            </td>
                                            <td colSpan={2} className="px-4 py-2.5 text-center text-[10px] text-primary-500 font-bold">
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
                <div className="bg-warning-500/5 border border-warning-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-warning-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-warning-600 dark:text-warning-400 mb-1">Lưu ý quyết toán vốn đầu tư</p>
                            <ul className="text-xs text-warning-500 space-y-0.5 list-disc list-inside">
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
