import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Calendar, TrendingUp, CheckCircle2, AlertTriangle,
    CalendarDays, Target, FileText, AlertCircle, Sparkles, Building2, Download, ChevronDown,
    ChevronRight, Layers, Users, Edit3, Check, X, MessageSquare
} from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { DashboardService, TaskBriefingSummary, ProjectBriefingData } from '../../../services/DashboardService';
import { TASK_CATEGORY_COLORS, type TaskCategory } from '../../../types/task.types';
import { MonthlyReportModal } from './MonthlyReportModal';
import { StatCard } from '../../../components/common/StatCard';
import { exportDepartmentTaskReport, exportConsolidatedBriefingReport } from '../../tasks/exportTaskMonthlyReport';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { TaskService } from '../../../services/TaskService';
import { RegulationScoringService } from '../../regulation-scoring/services/scoringService';
import { DEPARTMENT_NAMES } from '../../../types/plan.types';

export const MonthlyBriefingTab: React.FC<{ selectedYear: number; selectedBoard?: string }> = ({ selectedYear, selectedBoard = 'all' }) => {
    const { currentUser, supabaseUser } = useAuth();
    const queryClient = useQueryClient();

    const pos = currentUser?.Position?.toLowerCase() || '';
    const isLeader = pos.includes('giám đốc') || 
                     (currentUser?.Role as string) === 'Admin' || 
                     (currentUser?.Role as string) === 'director' || 
                     (currentUser?.Role as string) === 'admin' || 
                     (currentUser as any)?.SystemRole === 'admin';

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

    const { data: projectBriefing = [], isLoading: isProjectLoading } = useQuery({
        queryKey: ['dashboard', 'projectBriefing', selectedMonth, selectedYear],
        queryFn: () => DashboardService.getProjectBriefingData(selectedMonth, selectedYear),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const { data: deptScores = [] } = useQuery({
        queryKey: ['dashboard', 'deptScores', selectedMonth, selectedYear],
        queryFn: () => RegulationScoringService.getDeptScores(selectedMonth, selectedYear),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const getClassBadgeVariant = (classification?: string) => {
        switch (classification) {
            case 'xuat_sac': return 'warning';
            case 'tot': return 'success';
            case 'hoan_thanh': return 'info';
            case 'khong_hoan_thanh': return 'danger';
            default: return 'neutral';
        }
    };

    const getClassificationLabel = (classification?: string) => {
        switch (classification) {
            case 'xuat_sac': return 'Xuất sắc';
            case 'tot': return 'Tốt';
            case 'hoan_thanh': return 'Hoàn thành';
            case 'khong_hoan_thanh': return 'Chưa xong';
            default: return 'Chưa có';
        }
    };

    const filteredProjectBriefing = React.useMemo(() => {
        if (!selectedBoard || selectedBoard === 'all') return projectBriefing;
        return projectBriefing.filter(p => {
            if (p.projectId === 'internal_admin') return true;
            return p.managementBoard?.toString() === selectedBoard;
        });
    }, [projectBriefing, selectedBoard]);

    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['internal_admin']));
    const [expandAll, setExpandAll] = useState(false);

    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState<string>('');
    const [isSavingComment, setIsSavingComment] = useState<boolean>(false);

    const handleSaveComment = async (projectId: string) => {
        setIsSavingComment(true);
        try {
            const success = await DashboardService.updateProjectLeaderComment(projectId, commentText.trim(), selectedMonth, selectedYear);
            if (success) {
                queryClient.invalidateQueries({
                    queryKey: ['dashboard', 'projectBriefing', selectedMonth, selectedYear]
                });
                setEditingProjectId(null);
            } else {
                alert('Có lỗi xảy ra khi lưu ý kiến.');
            }
        } catch (e) {
            console.error(e);
            alert('Có lỗi xảy ra khi lưu ý kiến.');
        } finally {
            setIsSavingComment(false);
        }
    };

    const { data: employees = [] } = useQuery({
        queryKey: ['dashboard', 'employeesList'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('employee_id, full_name, department')
                .order('full_name', { ascending: true });
            if (error) {
                console.error("Error fetching employees:", error);
                return [];
            }
            return data || [];
        },
        staleTime: 10 * 60 * 1000,
    });

    const [addingTaskProjectId, setAddingTaskProjectId] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState<string>('');
    const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>('');
    const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);

    const handleCreateTask = async (projectId: string) => {
        if (!newTaskTitle.trim() || !newTaskAssigneeId) {
            alert('Vui lòng điền đầy đủ tên công việc và chọn người phụ trách.');
            return;
        }

        setIsCreatingTask(true);
        try {
            const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
            const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
            const lastDay = new Date(nextYear, nextMonth, 0).getDate();
            const nextEndDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            const nextStartDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

            await TaskService.createTask({
                title: newTaskTitle.trim(),
                project_id: projectId === 'internal_admin' ? null : projectId,
                assignee_id: newTaskAssigneeId,
                due_date: nextEndDate,
                start_date: nextStartDate,
                status: 'todo',
                priority: 'medium',
                task_type: projectId === 'internal_admin' ? 'internal' : 'project',
                progress: 0,
                created_by: supabaseUser?.id || null
            } as any);

            queryClient.invalidateQueries({
                queryKey: ['dashboard', 'projectBriefing', selectedMonth, selectedYear]
            });
            queryClient.invalidateQueries({
                queryKey: ['dashboard', 'taskBriefing', selectedMonth, selectedYear]
            });

            setAddingTaskProjectId(null);
            setNewTaskTitle('');
            setNewTaskAssigneeId('');
        } catch (e) {
            console.error(e);
            alert('Có lỗi xảy ra khi tạo công việc.');
        } finally {
            setIsCreatingTask(false);
        }
    };

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId); else next.add(projectId);
            return next;
        });
    };

    const handleToggleAll = () => {
        if (expandAll) {
            setExpandedProjects(new Set());
        } else {
            setExpandedProjects(new Set(filteredProjectBriefing.map(p => p.projectId)));
        }
        setExpandAll(!expandAll);
    };

    const toggleCategory = (key: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    if (isLoading || isProjectLoading) {
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
                    compact={true}
                    label="Giải ngân trong tháng"
                    value={formatCurrency(stats.disbursedThisMonth)}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="emerald"
                    progressLabel="Tiến độ tháng"
                    progressPercentage={disbursementRate}
                    footer={
                        <p className="text-[9px] font-bold text-txt-secondary mt-0.5">
                            Kế hoạch: {formatCurrency(stats.disbursedTarget)}
                        </p>
                    }
                />

                <StatCard
                    compact={true}
                    label="Dự án khởi công mới"
                    value={stats.newProjectsStarted}
                    icon={<Building2 className="w-5 h-5" />}
                    color="blue"
                />

                <StatCard
                    compact={true}
                    label="Dự án hoàn thành"
                    value={stats.projectsCompleted}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="primary"
                />

                <StatCard
                    compact={true}
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

            {/* ── BẢNG XẾP HẠNG ĐÁNH GIÁ PHÒNG BAN (QCKHCV) ── */}
            {deptScores && deptScores.length > 0 && (
                <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-border">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                                <Target className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black text-txt-primary uppercase tracking-tight">
                                Bảng xếp hạng Đánh giá Phòng ban (QCKHCV)
                            </h3>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...deptScores]
                                .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
                                .map((score, index) => {
                                    const deptName = DEPARTMENT_NAMES[score.department_code] || score.department_code;
                                    const variant = getClassBadgeVariant(score.classification);
                                    const label = getClassificationLabel(score.classification);
                                    
                                    return (
                                        <div 
                                            key={score.department_code}
                                            className="relative flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 shadow-sm"
                                        >
                                            {/* Rank badge */}
                                            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${
                                                index === 0 ? 'bg-amber-500 text-white' :
                                                index === 1 ? 'bg-slate-400 text-white' :
                                                index === 2 ? 'bg-amber-700 text-white' :
                                                'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-350'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            
                                            <div className="ml-3 flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">
                                                    {deptName}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <span className="text-[10px] text-slate-400 font-bold">
                                                        Điểm: <span className="text-primary-600 dark:text-primary-400 font-black font-mono">{score.total_score}</span>/100
                                                    </span>
                                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                        variant === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' :
                                                        variant === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                                        variant === 'info' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' :
                                                        variant === 'danger' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400' :
                                                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        {label}
                                                    </span>
                                                </div>
                                                {/* Mini breakdown */}
                                                <p className="text-[10px] text-slate-450 mt-2 font-medium">
                                                    Hoàn thành: {Number(score.a1_score || 0) + Number(score.a2_score || 0) + Number(score.a3_score || 0)}đ · Giải ngân: {Number(score.b1_score || 0) + Number(score.b2_score || 0)}đ · Chung: {Number(score.c1_score || 0) + Number(score.c2_score || 0)}đ
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── BÁO CÁO CHI TIẾT THEO DỰ ÁN ── */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-surface p-4 rounded-xl border border-border shadow-sm gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-txt-primary uppercase tracking-tight">TÌNH HÌNH CÁC DỰ ÁN & NHIỆM VỤ</h3>
                            <p className="text-xs text-txt-muted mt-0.5">Tổng hợp kết quả, vướng mắc và kế hoạch phân nhóm theo dự án</p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleAll}
                        className="btn btn-outline text-xs px-3 py-1.5 font-bold flex items-center gap-1.5 border-slate-200 dark:border-slate-800 text-txt-secondary hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        {expandAll ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                    </button>
                </div>

                <div className="space-y-2">
                    {filteredProjectBriefing.map((proj) => {
                        const isExpanded = expandedProjects.has(proj.projectId);
                        const totalTasks = proj.completedTasks.length + proj.incompleteTasks.length + proj.inProgressTasks.length;
                        const hasDisbursement = proj.disbursedAmount > 0;
                        const hasIssues = proj.issues.length > 0;

                        return (
                            <div
                                key={proj.projectId}
                                className={`
                                    bg-bg-surface border rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.01)]
                                    dark:shadow-[0_1px_4px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-200
                                    ${isExpanded ? 'border-primary-500 ring-1 ring-primary-500/20' : 'border-border hover:border-slate-300 dark:hover:border-slate-700'}
                                `}
                            >
                                {/* Header */}
                                <div
                                    onClick={() => toggleProject(proj.projectId)}
                                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-2 px-3.5 gap-2 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <ChevronRight
                                            className={`w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
                                                isExpanded ? 'rotate-90 text-primary-500' : ''
                                            }`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-snug hover:text-primary-600 transition-colors truncate">
                                                {proj.projectName}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                    proj.projectId === 'internal_admin'
                                                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        : proj.statusLabel === 'Thực hiện'
                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50'
                                                        : proj.statusLabel === 'Chuẩn bị ĐT'
                                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50'
                                                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50'
                                                }`}>
                                                    {proj.statusLabel}
                                                </span>
                                                {proj.projectId !== 'internal_admin' && (
                                                    <div className="flex items-center gap-1 text-[11px] text-txt-muted">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">Tiến độ:</span>
                                                        <div className="w-12 md:w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden inline-block align-middle">
                                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${proj.progress}%` }}></div>
                                                        </div>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{proj.progress}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Badges and summary info */}
                                    <div className="flex flex-wrap items-center gap-1.5 lg:gap-2 shrink-0 w-full lg:w-auto pl-6 lg:pl-0">
                                        {hasDisbursement && (
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />
                                                +{formatCurrency(proj.disbursedAmount)}
                                            </span>
                                        )}
                                        
                                        {/* Task summaries */}
                                        <div className="flex flex-wrap items-center gap-1">
                                            {proj.completedTasks.length > 0 && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" title="Hoàn thành">
                                                    {proj.completedTasks.length} HT
                                                </span>
                                            )}
                                            {proj.incompleteTasks.length > 0 && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400" title="Chưa hoàn thành">
                                                    {proj.incompleteTasks.length} Trễ
                                                </span>
                                            )}
                                            {proj.inProgressTasks.length > 0 && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" title="Đang thực hiện">
                                                    {proj.inProgressTasks.length} Đang làm
                                                </span>
                                            )}
                                            {proj.nextMonthTasks.length > 0 && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400" title="Kế hoạch tháng tới">
                                                    {proj.nextMonthTasks.length} KH tới
                                                </span>
                                            )}
                                            {hasIssues && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 animate-pulse flex items-center gap-0.5" title="Vướng mắc gói thầu">
                                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                                    {proj.issues.length} vướng mắc
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Accordion Content */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 p-3 lg:p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                                            {/* Cột 1: Tình hình & Giải ngân */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-1.5 border-b border-border pb-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                    <h5 className="text-[11px] font-black uppercase tracking-wider text-txt-secondary">TÌNH HÌNH & GIẢI NGÂN</h5>
                                                </div>
                                                <div className="bg-bg-surface p-3 rounded-lg border border-border space-y-2.5 shadow-sm">
                                                    <div>
                                                        <span className="text-[10px] text-txt-muted font-bold">Trạng thái dự án</span>
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{proj.statusLabel}</p>
                                                    </div>
                                                    {proj.projectId !== 'internal_admin' && (
                                                        <div>
                                                            <span className="text-[10px] text-txt-muted font-bold">Tiến độ hoàn thành</span>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                 <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 overflow-hidden">
                                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${proj.progress}%` }}></div>
                                                                </div>
                                                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{proj.progress}%</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-[10px] text-txt-muted font-bold">Giải ngân trong tháng</span>
                                                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                            {proj.disbursedAmount > 0 ? formatCurrency(proj.disbursedAmount) : '0 VNĐ'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cột 2: Kết quả nổi bật */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-1.5 border-b border-border pb-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                    <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">KẾT QUẢ NỔI BẬT ({proj.completedTasks.length})</h5>
                                                </div>
                                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                                    {proj.completedTasks.map((t) => (
                                                        <div key={t.id} className="p-2.5 bg-bg-surface border border-border rounded-lg shadow-sm space-y-1 hover:shadow transition-shadow">
                                                            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-normal">{t.title}</p>
                                                            <div className="flex justify-between items-center gap-2">
                                                                <span className="text-[9px] font-medium text-txt-muted flex items-center gap-1">
                                                                    <Users className="w-3 h-3 text-slate-400 shrink-0" /> {t.assigneeName}
                                                                </span>
                                                                <span className="text-[8px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 rounded">
                                                                    Hoàn thành
                                                                </span>
                                                            </div>
                                                            {t.completionResult && (
                                                                <div className="text-[10px] bg-bg-subtle p-1.5 rounded border-l-2 border-emerald-500 text-txt-secondary italic leading-tight mt-1">
                                                                    <span className="font-bold text-[9px] text-emerald-600 block not-italic uppercase tracking-wide">Sản phẩm bàn giao:</span>
                                                                    {t.completionResult}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {proj.completedTasks.length === 0 && (
                                                        <p className="text-[10px] italic text-txt-muted text-center py-3 bg-bg-surface rounded-lg border border-border border-dashed">
                                                            Không có công việc hoàn thành
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Cột 3: Tồn tại & Vấn đề */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-1.5 border-b border-border pb-1.5">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                                    <h5 className="text-[11px] font-black uppercase tracking-wider text-red-700 dark:text-red-400">TỒN TẠI & VẤN ĐỀ ({proj.incompleteTasks.length + proj.inProgressTasks.length + proj.issues.length})</h5>
                                                </div>
                                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                                    {/* In-progress tasks */}
                                                    {proj.inProgressTasks.map((t) => (
                                                        <div key={t.id} className="p-2.5 bg-blue-50/10 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-950/50 rounded-lg space-y-1">
                                                            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-normal">{t.title}</p>
                                                            <div className="space-y-1 mt-1">
                                                                <div className="flex justify-between items-center gap-2">
                                                                    <span className="text-[9px] font-medium text-txt-muted flex items-center gap-1">
                                                                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {t.assigneeName}
                                                                    </span>
                                                                    <span className="text-[8px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded">
                                                                        Đang làm
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 overflow-hidden">
                                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.progress}%` }}></div>
                                                                    </div>
                                                                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">{t.progress}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Incomplete tasks */}
                                                    {proj.incompleteTasks.map((t) => (
                                                        <div key={t.id} className="p-2.5 bg-red-50/10 dark:bg-red-950/10 border border-red-100/50 dark:border-red-950/50 rounded-lg space-y-1">
                                                            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-normal">{t.title}</p>
                                                            <div className="flex justify-between items-center gap-2">
                                                                <span className="text-[9px] font-medium text-txt-muted flex items-center gap-1">
                                                                    <Users className="w-3 h-3 text-slate-400 shrink-0" /> {t.assigneeName}
                                                                </span>
                                                                <span className="text-[8px] font-bold px-1.5 py-0.2 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded">
                                                                    Chưa HT
                                                                </span>
                                                            </div>
                                                            {t.incompleteReason && (
                                                                <div className="text-[10px] bg-bg-subtle p-1.5 rounded border-l-2 border-rose-500 text-txt-secondary italic leading-tight mt-1">
                                                                    <span className="font-bold text-[9px] text-red-600 block not-italic uppercase tracking-wide">Nguyên nhân ({t.incompleteReasonType || 'Chưa phân loại'}):</span>
                                                                    {t.incompleteReason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Package Issues */}
                                                    {proj.issues.map((i) => (
                                                        <div key={i.id} className="p-2.5 bg-amber-50/10 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-950/50 rounded-lg space-y-1">
                                                            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-normal flex items-start gap-1">
                                                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                                <span>{i.title}</span>
                                                            </p>
                                                            <div className="flex justify-between items-center gap-2">
                                                                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Vướng mắc gói thầu</span>
                                                                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                                                                    i.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                    {i.severity === 'high' ? 'Nghiêm trọng' : 'Thường'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {proj.incompleteTasks.length === 0 && proj.inProgressTasks.length === 0 && proj.issues.length === 0 && (
                                                        <p className="text-[10px] italic text-txt-muted text-center py-3 bg-bg-surface rounded-lg border border-border border-dashed">
                                                            Không có tồn tại, vướng mắc
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Cột 4: Kế hoạch tháng tới */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between border-b border-border pb-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">KẾ HOẠCH THÁNG TỚI ({proj.nextMonthTasks.length})</h5>
                                                    </div>
                                                    {currentUser && addingTaskProjectId !== proj.projectId && (
                                                        <button
                                                            onClick={() => {
                                                                setAddingTaskProjectId(proj.projectId);
                                                                setNewTaskTitle('');
                                                                setNewTaskAssigneeId('');
                                                            }}
                                                            className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-0.5"
                                                        >
                                                            + Thêm
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                                    {addingTaskProjectId === proj.projectId && (
                                                        <div className="p-2 bg-indigo-50/30 dark:bg-indigo-950/15 border border-indigo-100/50 dark:border-indigo-900/30 rounded-lg space-y-1.5 shadow-sm">
                                                            <input
                                                                type="text"
                                                                value={newTaskTitle}
                                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                                placeholder="Tên công việc mới..."
                                                                className="w-full text-xs p-1.5 border border-border rounded bg-bg-surface text-txt-primary focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                                autoFocus
                                                            />
                                                            <div className="relative">
                                                                <select
                                                                    value={newTaskAssigneeId}
                                                                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                                                                    className="appearance-none w-full text-[11px] pl-2 pr-6 py-1.5 border border-border rounded bg-bg-surface text-txt-primary font-medium"
                                                                >
                                                                    <option value="">-- Chọn cán bộ phụ trách --</option>
                                                                    {employees.map(emp => (
                                                                        <option key={emp.employee_id} value={emp.employee_id}>
                                                                            {emp.full_name} ({emp.department?.replace('Phòng ', '') || 'N/A'})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt-muted pointer-events-none" />
                                                            </div>
                                                            <div className="flex justify-end gap-1 text-[10px]">
                                                                <button
                                                                    onClick={() => setAddingTaskProjectId(null)}
                                                                    disabled={isCreatingTask}
                                                                    className="px-2 py-1 border border-border rounded hover:bg-bg-subtle text-txt-secondary"
                                                                >
                                                                    Hủy
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCreateTask(proj.projectId)}
                                                                    disabled={isCreatingTask || !newTaskTitle.trim() || !newTaskAssigneeId}
                                                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-bold"
                                                                >
                                                                    {isCreatingTask ? 'Đang tạo...' : 'Xác nhận'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {proj.nextMonthTasks.map((t) => (
                                                        <div key={t.id} className="p-2.5 bg-bg-surface border border-border rounded-lg shadow-sm space-y-1 hover:shadow transition-shadow">
                                                            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-normal">{t.title}</p>
                                                            <div className="flex justify-between items-center gap-2">
                                                                <span className="text-[9px] font-medium text-txt-muted flex items-center gap-1">
                                                                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {t.assigneeName}
                                                                </span>
                                                                <span className="text-[8px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded">
                                                                    Lập kế hoạch
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {proj.nextMonthTasks.length === 0 && addingTaskProjectId !== proj.projectId && (
                                                        <p className="text-[10px] italic text-txt-muted text-center py-3 bg-bg-surface rounded-lg border border-border border-dashed">
                                                            Chưa lập kế hoạch tháng tới
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ý kiến chỉ đạo của Ban lãnh đạo */}
                                        <div className="mt-4 pt-3 border-t border-dashed border-border">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <MessageSquare className="w-4 h-4 text-primary-500" />
                                                    <h5 className="text-xs font-black uppercase tracking-wider text-txt-secondary">
                                                        Ý kiến chỉ đạo của Ban lãnh đạo
                                                    </h5>
                                                </div>
                                                {isLeader && editingProjectId !== proj.projectId && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingProjectId(proj.projectId);
                                                            setCommentText(proj.leaderComment || '');
                                                        }}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-950/30 px-2 py-1 rounded transition-colors"
                                                    >
                                                        <Edit3 className="w-3 h-3" /> Cập nhật ý kiến
                                                    </button>
                                                )}
                                            </div>

                                            {editingProjectId === proj.projectId ? (
                                                <div className="space-y-2 bg-bg-surface p-3 rounded-lg border border-primary-300 dark:border-primary-800">
                                                    <textarea
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        placeholder="Nhập ý kiến chỉ đạo của Ban lãnh đạo đối với dự án này..."
                                                        className="w-full text-xs p-2 border border-border rounded bg-bg-surface focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                                        rows={3}
                                                    />
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setEditingProjectId(null)}
                                                            disabled={isSavingComment}
                                                            className="btn btn-outline text-[10px] px-2.5 py-1 flex items-center gap-1"
                                                        >
                                                            <X className="w-3.5 h-3.5" /> Hủy
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveComment(proj.projectId)}
                                                            disabled={isSavingComment}
                                                            className="btn btn-primary text-[10px] px-2.5 py-1 flex items-center gap-1"
                                                        >
                                                            {isSavingComment ? (
                                                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                                                            ) : (
                                                                <Check className="w-3.5 h-3.5" />
                                                            )}
                                                            Lưu ý kiến
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`p-3 rounded-lg border leading-relaxed ${
                                                    proj.leaderComment 
                                                        ? 'bg-primary-50/20 dark:bg-primary-950/10 border-primary-100 dark:border-primary-900/30' 
                                                        : 'bg-slate-50/50 dark:bg-slate-900/5 border-dashed border-slate-200 dark:border-slate-800'
                                                }`}>
                                                    {proj.leaderComment ? (
                                                        <div className="relative pl-3 border-l-2 border-primary-500">
                                                            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line italic">
                                                                "{proj.leaderComment}"
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] text-txt-muted italic text-center py-1">
                                                            Chưa có ý kiến chỉ đạo từ Ban lãnh đạo
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
