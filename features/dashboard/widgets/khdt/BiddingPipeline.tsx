/**
 * BiddingPipeline — Widget KHĐT: Tổng hợp gói thầu theo trạng thái
 * Hiển thị pipeline đấu thầu cho Phòng Kế hoạch - Đấu thầu
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gavel, ArrowRight, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { EmptyState } from '../../../../components/ui';

const STALE_5M = 5 * 60 * 1000;

// Bidding status mapping
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    'Draft': { label: 'Nháp', color: 'text-gray-600 dark:text-slate-400', bgColor: 'bg-gray-100 dark:bg-slate-700' },
    'Planning': { label: 'Lập kế hoạch', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
    'Approved': { label: 'Đã duyệt', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30' },
    'Bidding': { label: 'Đang đấu thầu', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30' },
    'Evaluating': { label: 'Đánh giá', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/30' },
    'Awarded': { label: 'Đã chọn thầu', color: 'text-teal-700 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-900/30' },
    'Completed': { label: 'Hoàn thành', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30' },
};

export const BiddingPipeline: React.FC = () => {
    const navigate = useNavigate();

    const { data: packages = [], isLoading } = useQuery({
        queryKey: ['dashboard-bidding-pipeline'],
        queryFn: async () => {
            const { data } = await supabase
                .from('bidding_packages')
                .select('package_id, package_name, project_id, status, estimated_value, bid_opening_date')
                .neq('status', 'Completed')
                .order('bid_opening_date', { ascending: true })
                .limit(10);
            return data || [];
        },
        staleTime: STALE_5M,
    });

    // Summary stats
    const { data: pipelineStats } = useQuery({
        queryKey: ['dashboard-bidding-stats'],
        queryFn: async () => {
            const { data } = await supabase
                .from('bidding_packages')
                .select('status');
            const all = data || [];
            return {
                total: all.length,
                active: all.filter(p => ['Bidding', 'Evaluating'].includes(p.status)).length,
                planning: all.filter(p => ['Draft', 'Planning'].includes(p.status)).length,
                awarded: all.filter(p => p.status === 'Awarded').length,
            };
        },
        staleTime: STALE_5M,
    });

    const now = new Date();

    return (
        <div className="section-card">
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><Gavel className="w-3.5 h-3.5" /></div>
                    <span>Pipeline đấu thầu</span>
                </div>
                <button onClick={() => navigate('/bidding')} className="text-xs font-bold text-primary-600 dark:text-primary-500 flex items-center gap-1">
                    Xem tất cả <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {/* Mini stats */}
            {pipelineStats && (
                <div className="grid grid-cols-3 gap-2 px-4 pb-3">
                    <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-lg font-black text-blue-700 dark:text-blue-400 tabular-nums">{pipelineStats.planning}</p>
                        <p className="text-[9px] font-bold text-blue-600/70 dark:text-blue-500/70">Chuẩn bị</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                        <p className="text-lg font-black text-amber-700 dark:text-amber-400 tabular-nums">{pipelineStats.active}</p>
                        <p className="text-[9px] font-bold text-amber-600/70 dark:text-amber-500/70">Đang thầu</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                        <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{pipelineStats.awarded}</p>
                        <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500/70">Đã chọn thầu</p>
                    </div>
                </div>
            )}

            <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[320px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" /></div>
                ) : packages.length === 0 ? (
                    <EmptyState icon={<Gavel className="w-10 h-10" />} title="Không có gói thầu đang xử lý" className="py-6" />
                ) : packages.map((pkg: any) => {
                    const cfg = STATUS_CONFIG[pkg.status] || STATUS_CONFIG['Draft'];
                    const bidDate = pkg.bid_opening_date ? new Date(pkg.bid_opening_date) : null;
                    const isUrgent = bidDate && bidDate > now && (bidDate.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000;

                    return (
                        <div key={pkg.package_id} onClick={() => navigate(`/bidding/${pkg.package_id}`)} className="p-3 hover:bg-bg-app dark:hover:bg-slate-700 cursor-pointer transition-colors">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{pkg.package_name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bgColor} ${cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                        {isUrgent && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 flex items-center gap-0.5">
                                                <AlertTriangle className="w-2.5 h-2.5" /> Sắp mở thầu
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {bidDate && (
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 shrink-0 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {bidDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BiddingPipeline;
