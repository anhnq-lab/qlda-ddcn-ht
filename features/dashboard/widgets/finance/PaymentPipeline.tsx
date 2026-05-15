/**
 * PaymentPipeline — Widget TCKT: Thanh toán & Giải ngân
 * Phòng Tài chính - Kế toán
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Banknote, ArrowRight, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { formatShortCurrency } from '../../../../utils/format';
import { EmptyState } from '../../../../components/ui';

const STALE_5M = 5 * 60 * 1000;

export const PaymentPipeline: React.FC = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    // Disbursement summary
    const { data: disbStats } = useQuery({
        queryKey: ['dashboard-disb-stats', currentYear],
        queryFn: async () => {
            const [disbRes, planRes] = await Promise.all([
                supabase.from('disbursements')
                    .select('amount, date, project_id')
                    .gte('date', `${currentYear}-01-01`)
                    .lte('date', `${currentYear}-12-31`),
                supabase.from('capital_plans')
                    .select('amount')
                    .eq('year', currentYear),
            ]);

            const totalDisbursed = (disbRes.data || []).reduce((s, d) => s + Number(d.amount), 0);
            const totalPlanned = (planRes.data || []).reduce((s, p) => s + Number(p.amount), 0);

            // Monthly breakdown
            const monthlyMap = new Map<number, number>();
            (disbRes.data || []).forEach(d => {
                const month = new Date(d.date).getMonth() + 1;
                monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(d.amount));
            });

            return {
                totalDisbursed,
                totalPlanned,
                rate: totalPlanned > 0 ? Math.round((totalDisbursed / totalPlanned) * 1000) / 10 : 0,
                monthlyBreakdown: Array.from(monthlyMap.entries())
                    .sort((a, b) => b[0] - a[0])
                    .slice(0, 4)
                    .map(([month, amount]) => ({ month, amount })),
            };
        },
        staleTime: STALE_5M,
    });

    // Recent payments
    const { data: recentPayments = [] } = useQuery({
        queryKey: ['dashboard-recent-payments'],
        queryFn: async () => {
            const { data } = await supabase
                .from('payments')
                .select('payment_id, description, amount, payment_date, status, project_id')
                .order('payment_date', { ascending: false })
                .limit(6);
            return data || [];
        },
        staleTime: STALE_5M,
    });

    return (
        <div className="space-y-4">
            {/* Disbursement Overview */}
            <div className="section-card">
                <div className="section-card-header">
                    <div className="flex items-center gap-2">
                        <div className="section-icon"><Banknote className="w-3.5 h-3.5" /></div>
                        <span>Giải ngân năm {currentYear}</span>
                    </div>
                    <button onClick={() => navigate('/capital')} className="text-xs font-bold text-primary-600 dark:text-primary-500 flex items-center gap-1">
                        Chi tiết <ArrowRight className="w-3 h-3" />
                    </button>
                </div>

                {disbStats && (
                    <>
                        {/* Big number + progress */}
                        <div className="px-4 pb-3">
                            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70">Đã giải ngân / Kế hoạch</p>
                                        <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                                            {formatShortCurrency(disbStats.totalDisbursed)}
                                            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 ml-1">/ {formatShortCurrency(disbStats.totalPlanned)}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{disbStats.rate}%</p>
                                    </div>
                                </div>
                                <div className="h-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(disbStats.rate, 100)}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Monthly mini bars */}
                        {disbStats.monthlyBreakdown.length > 0 && (
                            <div className="px-4 pb-3">
                                <div className="flex items-center gap-1 mb-2">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">Giải ngân theo tháng gần nhất</span>
                                </div>
                                <div className="space-y-1.5">
                                    {disbStats.monthlyBreakdown.map(m => (
                                        <div key={m.month} className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 w-8 shrink-0">T{m.month}</span>
                                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min((m.amount / (disbStats.totalPlanned / 12)) * 100, 100)}%` }} />
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 shrink-0 tabular-nums w-12 text-right">{formatShortCurrency(m.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Recent Payments */}
            <div className="section-card">
                <div className="section-card-header">
                    <div className="flex items-center gap-2">
                        <div className="section-icon"><TrendingUp className="w-3.5 h-3.5" /></div>
                        <span>Thanh toán gần đây</span>
                    </div>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[200px] overflow-y-auto">
                    {recentPayments.length === 0 ? (
                        <EmptyState icon={<Banknote className="w-10 h-10" />} title="Chưa có thanh toán" className="py-6" />
                    ) : recentPayments.map((p: any) => (
                        <div key={p.payment_id} className="p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{p.description || 'Thanh toán'}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">
                                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString('vi-VN') : '—'}
                                    </p>
                                </div>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                                    {formatShortCurrency(p.amount || 0)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PaymentPipeline;
