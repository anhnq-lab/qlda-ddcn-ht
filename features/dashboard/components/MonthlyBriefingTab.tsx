import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Calendar, TrendingUp, CheckCircle2, AlertTriangle,
    CalendarDays, Target, FileText, AlertCircle, Sparkles, Building2, Download, ChevronDown,
    ChevronRight, Layers, Users
} from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { DashboardService, TaskBriefingSummary } from '../../../services/DashboardService';
import { TASK_CATEGORY_COLORS, type TaskCategory } from '../../../types/task.types';
import { MonthlyReportModal } from './MonthlyReportModal';
import { StatCard } from '../../../components/common/StatCard';
import { exportDepartmentTaskReport, exportConsolidatedBriefingReport } from '../../tasks/exportTaskMonthlyReport';

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

    const { data: taskBriefing = [] } = useQuery({
        queryKey: ['dashboard', 'taskBriefing', selectedMonth, selectedYear],
        queryFn: () => DashboardService.getTaskBriefingSummary(selectedMonth, selectedYear),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const toggleCategory = (key: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

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

            {/* ── TỔNG HỢP CÔNG VIỆC CÁC PHÒNG BAN ── */}
            {taskBriefing.length > 0 && (() => {
                const deptNames = taskBriefing.map(d => d.department_name);
                const filteredDepts = selectedDept === 'all' ? taskBriefing : taskBriefing.filter(d => d.department_name === selectedDept);
                const totalAll = taskBriefing.reduce((s, d) => s + d.total_tasks, 0);
                const completedAll = taskBriefing.reduce((s, d) => s + d.completed, 0);
                const rateAll = totalAll > 0 ? Math.round((completedAll / totalAll) * 1000) / 10 : 0;

                return (
                    <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-border">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
                                    <h3 className="text-lg font-black text-txt-primary uppercase tracking-tight">TỔNG HỢP CÔNG VIỆC CÁC PHÒNG BAN</h3>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-bold text-emerald-600">{completedAll}/{totalAll}</span>
                                    <span className="text-txt-muted">hoàn thành</span>
                                    <span className={`font-black text-sm px-2 py-0.5 rounded-lg ${rateAll >= 80 ? 'bg-emerald-100 text-emerald-700' : rateAll >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {rateAll}%
                                    </span>
                                    <button
                                        onClick={() => exportConsolidatedBriefingReport(selectedMonth, selectedYear)}
                                        className="ml-2 btn btn-outline text-xs px-2.5 py-1 flex items-center gap-1 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Xuất Excel tổng hợp
                                    </button>
                                </div>
                            </div>

                            {/* Department tabs */}
                            <div className="flex flex-wrap gap-1.5 mt-4">
                                <button
                                    onClick={() => setSelectedDept('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedDept === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
                                >
                                    Tất cả
                                </button>
                                {deptNames.map(name => (
                                    <button
                                        key={name}
                                        onClick={() => setSelectedDept(name)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedDept === name ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
                                    >
                                        {name.replace('Phòng ', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary table per department */}
                        {selectedDept === 'all' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <th className="px-4 py-3 text-left">Phòng ban</th>
                                            <th className="px-3 py-3 text-center">Tổng CV</th>
                                            <th className="px-3 py-3 text-center">Hoàn thành</th>
                                            <th className="px-3 py-3 text-center">Đang làm</th>
                                            <th className="px-3 py-3 text-center">Chưa HT</th>
                                            <th className="px-3 py-3 text-center">Tỷ lệ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {taskBriefing.map(dept => (
                                            <tr key={dept.department_name} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => setSelectedDept(dept.department_name)}>
                                                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{dept.department_name}</td>
                                                <td className="px-3 py-3 text-center font-bold">{dept.total_tasks}</td>
                                                <td className="px-3 py-3 text-center text-emerald-600 font-bold">{dept.completed}</td>
                                                <td className="px-3 py-3 text-center text-blue-600 font-bold">{dept.in_progress}</td>
                                                <td className="px-3 py-3 text-center text-rose-600 font-bold">{dept.incomplete}</td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-black ${dept.completion_rate >= 80 ? 'bg-emerald-100 text-emerald-700' : dept.completion_rate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                        {dept.completion_rate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Detail view per department */}
                        {filteredDepts.filter(() => selectedDept !== 'all').map(dept => (
                            <div key={dept.department_name} className="p-5 space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{dept.department_name}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500">
                                            <span className="font-bold text-emerald-600">{dept.completed}</span>/{dept.total_tasks} hoàn thành ({dept.completion_rate}%)
                                        </span>
                                        <button
                                            onClick={() => exportDepartmentTaskReport(selectedMonth, selectedYear, dept.department_name)}
                                            className="btn btn-outline text-xs px-2 py-1 flex items-center gap-1 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Xuất Excel phòng
                                        </button>
                                    </div>
                                </div>

                                {dept.by_category.map((catGroup, catIdx) => {
                                    const catKey = `${dept.department_name}-${catGroup.category}`;
                                    const isExpanded = expandedCategories.has(catKey);
                                    const catColors = TASK_CATEGORY_COLORS[catGroup.category as TaskCategory];

                                    return (
                                        <div key={catGroup.category} className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggleCategory(catKey)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${catColors?.text || 'text-slate-600'}`}>
                                                        {String.fromCharCode(73 + catIdx)}. {catGroup.category_label}
                                                    </span>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${catGroup.completed === catGroup.total ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {catGroup.completed}/{catGroup.total}
                                                </span>
                                            </button>

                                            {isExpanded && (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-white dark:bg-slate-800">
                                                            <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                <th className="px-3 py-2 text-center w-8">STT</th>
                                                                <th className="px-3 py-2 text-left">Nội dung</th>
                                                                <th className="px-3 py-2 text-left hidden md:table-cell">Dự án</th>
                                                                <th className="px-3 py-2 text-left">Kết quả</th>
                                                                <th className="px-3 py-2 text-left hidden sm:table-cell">Cán bộ PT</th>
                                                                <th className="px-3 py-2 text-center w-12">%</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                                            {catGroup.items.map((item, i) => (
                                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                                    <td className="px-3 py-2 text-center text-slate-400">{i + 1}</td>
                                                                    <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={item.title}>{item.title}</td>
                                                                    <td className="px-3 py-2 text-slate-500 hidden md:table-cell max-w-[150px] truncate">{item.project_name || '—'}</td>
                                                                    <td className="px-3 py-2 max-w-[200px] truncate" title={item.completion_result || item.incomplete_reason || ''}>
                                                                        {item.status === 'done' && <span className="text-emerald-600">{item.completion_result || 'Hoàn thành'}</span>}
                                                                        {item.status === 'incomplete' && <span className="text-rose-600">{item.incomplete_reason || 'Chưa HT'}</span>}
                                                                        {item.status === 'in_progress' && <span className="text-blue-600">{item.completion_result || 'Đang thực hiện'}</span>}
                                                                        {!['done', 'incomplete', 'in_progress'].includes(item.status) && <span className="text-slate-400">—</span>}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-slate-500 hidden sm:table-cell">{item.assignee_name}</td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        <span className={`font-bold ${item.progress >= 100 ? 'text-emerald-600' : item.progress >= 50 ? 'text-blue-600' : 'text-slate-400'}`}>
                                                                            {item.progress}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                );
            })()}

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
