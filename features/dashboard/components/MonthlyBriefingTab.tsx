import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Calendar, TrendingUp, CheckCircle2, AlertTriangle,
    CalendarDays, Target, FileText, AlertCircle, Sparkles, Building2, Download, ChevronDown
} from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { DashboardService } from '../../../services/DashboardService';
import { MonthlyReportModal } from './MonthlyReportModal';
import { StatCard } from '../../../components/common/StatCard';

export const MonthlyBriefingTab: React.FC<{ selectedYear: number }> = ({ selectedYear }) => {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
    const [showReportModal, setShowReportModal] = useState(false);

    const { data: stats, isLoading, error, refetch } = useQuery({
        queryKey: ['dashboard', 'monthlyBriefing', selectedMonth, selectedYear],
        queryFn: () => DashboardService.getMonthlyBriefingStats(selectedMonth, selectedYear),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
                <p className="text-sm font-medium text-red-500">
                    {error instanceof Error ? error.message : 'Không thể tải dữ liệu'}
                </p>
                <button onClick={() => refetch()} className="btn btn-outline text-sm">Thử lại</button>
            </div>
        );
    }

    const disbursementRate = stats.disbursedTarget > 0 
        ? Math.round((stats.disbursedThisMonth / stats.disbursedTarget) * 100) 
        : 0;

    return (
        <><div className="space-y-6 animate-fade-in fade-in-up">
            {/* ── Toolbar ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-txt-secondary" />
                        <span className="text-sm font-bold text-txt-primary">Kỳ báo cáo:</span>
                    </div>
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="appearance-none filter-primary text-sm font-semibold rounded-lg pl-3 pr-8 py-1.5 min-w-[110px]"
                        >
                            {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted pointer-events-none" />
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="btn btn-outline border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" /> AI Soạn báo cáo
                    </button>
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Xuất DOCX
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Giải ngân trong tháng"
                    value={formatCurrency(stats.disbursedThisMonth)}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="emerald"
                    progressLabel="Tiến độ tháng"
                    progressPercentage={disbursementRate}
                    footer={
                        <p className="text-[10px] font-bold text-txt-secondary mt-1">
                            Đạt kế hoạch tháng ({formatCurrency(stats.disbursedTarget)})
                        </p>
                    }
                />

                <StatCard
                    label="Dự án khởi công mới"
                    value={stats.newProjectsStarted}
                    icon={<Building2 className="w-5 h-5" />}
                    color="blue"
                />

                <StatCard
                    label="Dự án hoàn thành"
                    value={stats.projectsCompleted}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="primary"
                />

                <StatCard
                    label="Hồ sơ pháp lý phê duyệt"
                    value={stats.docsApproved}
                    icon={<FileText className="w-5 h-5" />}
                    color="warning"
                />
            </div>

            {/* ── Layout 2 Cột: Kết quả vs Tồn tại ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Cột 1: Kết quả */}
                <div className="space-y-6">
                    <div className="bg-bg-surface p-6 rounded-2xl border border-border shadow-sm h-full">
                        <div className="flex items-center gap-2 mb-6 border-b border-border pb-3">
                            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><Target className="w-5 h-5" /></div>
                            <h3 className="text-lg font-black text-txt-primary uppercase tracking-tight">KẾT QUẢ NỔI BẬT TRONG THÁNG</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {stats.keyAchievements.map((ach) => (
                                <div key={ach.id} className="flex gap-3">
                                    <div className="mt-1">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-[13px] font-medium text-txt-primary leading-relaxed">{ach.content}</p>
                                </div>
                            ))}
                            {stats.keyAchievements.length === 0 && (
                                <p className="text-sm italic text-txt-muted">Chưa có dữ liệu cập nhật</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cột 2: Tồn tại & Kế hoạch */}
                <div className="space-y-6 h-full flex flex-col">
                    <div className="bg-bg-surface p-6 rounded-2xl border border-border shadow-sm flex-1">
                        <div className="flex items-center gap-2 mb-6 border-b border-border pb-3">
                            <div className="p-1.5 bg-red-100 text-red-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
                            <h3 className="text-lg font-black text-txt-primary uppercase tracking-tight">TỒN TẠI & VƯỚNG MẮC</h3>
                        </div>
                        
                        <div className="space-y-3">
                            {stats.roadblocks.map((rb) => (
                                <div key={rb.id} className={`p-3 rounded-xl border flex items-start gap-3
                                    ${rb.severity === 'high' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 
                                      rb.severity === 'medium' ? 'bg-warning-50 border-warning-200 dark:bg-warning-900/20 dark:border-warning-800' : 
                                      'bg-bg-surface border-border'}`}>
                                    <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                                        rb.severity === 'high' ? 'text-red-500' : rb.severity === 'medium' ? 'text-warning-500' : 'text-slate-400'
                                    }`} />
                                    <p className="text-[13px] font-medium text-txt-primary">{rb.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-bg-surface p-6 rounded-2xl border border-border shadow-sm flex-1">
                        <div className="flex items-center gap-2 mb-6 border-b border-border pb-3">
                            <div className="p-1.5 bg-primary-100 text-primary-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
                            <h3 className="text-lg font-black text-txt-primary uppercase tracking-tight">KẾ HOẠCH THÁNG TỚI</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {stats.upcomingPlans.map((plan, index) => (
                                <div key={plan.id} className="flex gap-3">
                                    <div className="mt-1 shrink-0 group">
                                        <div className="w-5 h-5 rounded bg-primary-100 text-primary-600 font-black text-[10px] flex items-center justify-center border border-primary-200">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <p className="text-[13px] font-medium text-txt-primary leading-relaxed">{plan.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {showReportModal && stats && (
            <MonthlyReportModal
                month={selectedMonth}
                year={selectedYear}
                stats={stats}
                onClose={() => setShowReportModal(false)}
            />
        )}
        </>
    );
};
