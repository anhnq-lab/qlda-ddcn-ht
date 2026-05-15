import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployee } from '../../hooks/useEmployees';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useContracts } from '../../hooks/useContracts';
import { TaskStatus, TaskPriority, EmployeeStatus, Role } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
    Mail, Phone, Calendar, Shield, Briefcase, Building2,
    CheckCircle2, Clock, AlertCircle, ClipboardList, FolderOpen,
    FileText, ExternalLink, TrendingUp, Target, User, Hash,
    AlertTriangle, Sparkles, Edit, Trash2
} from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

const getPriorityInfo = (p: TaskPriority) => {
    switch (p) {
        case TaskPriority.Urgent: return { label: 'Khẩn cấp', color: 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20', dot: 'bg-red-500' };
        case TaskPriority.High: return { label: 'Cao', color: 'bg-warning-500/10 text-warning-600 ring-1 ring-warning-500/20', dot: 'bg-warning-500' };
        case TaskPriority.Medium: return { label: 'Trung bình', color: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20', dot: 'bg-sky-500' };
        case TaskPriority.Low: return { label: 'Thấp', color: 'bg-slate- text-slate-500 ring-1 ring-slate-500/20', dot: 'bg-slate-400' };
        default: return { label: p, color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' };
    }
};

const getStatusInfo = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done: return { label: 'Hoàn thành', color: 'text-emerald-600', bg: 'bg-emerald-500', icon: <CheckCircle2 className="w-4 h-4" /> };
        case TaskStatus.Review: return { label: 'Chờ duyệt', color: 'text-violet-600', bg: 'bg-violet-500', icon: <AlertCircle className="w-4 h-4" /> };
        case TaskStatus.InProgress: return { label: 'Đang thực hiện', color: 'text-blue-600', bg: 'bg-blue-500', icon: <Clock className="w-4 h-4" /> };
        default: return { label: 'Cần làm', color: 'text-slate-500', bg: 'bg-slate-300', icon: <div className="w-4 h-4 rounded-full border-2 border-slate-300" /> };
    }
};

const getRoleInfo = (role: Role) => {
    switch (role) {
        case Role.Admin: return { label: 'Quản trị viên', color: 'bg-primary-500/10 text-primary-600 ring-1 ring-primary-500/20' };
        case Role.Manager: return { label: 'Quản lý', color: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20' };
        default: return { label: 'Nhân viên', color: 'bg-slate- text-slate-500 ring-1 ring-slate-500/20' };
    }
};

const CHART_COLORS = ['#4a90e2', '#357abd', '#404040', '#A3A3A3'];

const getProgressGradient = (percent: number) => {
    if (percent >= 100) return 'from-emerald-400 to-emerald-600';
    if (percent >= 70) return 'from-blue-400 to-blue-600';
    if (percent >= 40) return 'from-primary-400 to-primary-500';
    if (percent > 0) return 'from-slate-300 to-slate-400';
    return 'from-slate-200 to-slate-200';
};

// ═══════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════

interface EmployeeSlideContentProps {
    employeeId: string;
    onEdit?: (employeeId: string) => void;
    onDelete?: (employeeId: string) => void;
}

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════

const EmployeeSlideContent: React.FC<EmployeeSlideContentProps> = ({ employeeId, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const { data: employee, isLoading: empLoading } = useEmployee(employeeId);
    const { data: tasks = [] } = useTasks();
    const { projects = [] } = useProjects();
    const { contracts = [] } = useContracts();

    const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'contracts'>('tasks');

    // ── Cross-module computed data ──
    const empTasks = useMemo(() => tasks.filter(t => t.AssigneeID === employeeId), [tasks, employeeId]);
    const activeTasks = useMemo(() => empTasks.filter(t => t.Status !== TaskStatus.Done), [empTasks]);
    const completedTasks = useMemo(() => empTasks.filter(t => t.Status === TaskStatus.Done), [empTasks]);
    const overdueTasks = useMemo(() => {
        const now = new Date();
        return empTasks.filter(t => t.Status !== TaskStatus.Done && t.DueDate && new Date(t.DueDate) < now);
    }, [empTasks]);

    const empProjects = useMemo(() => {
        const taskProjectIds = new Set(empTasks.map(t => t.ProjectID));
        const memberProjectIds = new Set(projects.filter(p => p.Members?.includes(employeeId)).map(p => p.ProjectID));
        const allIds = new Set([...taskProjectIds, ...memberProjectIds]);
        return projects.filter(p => allIds.has(p.ProjectID));
    }, [empTasks, projects, employeeId]);

    const empContracts = useMemo(() => {
        const empProjectIds = new Set<string>(empProjects.map(p => String(p.ProjectID)));
        return contracts.filter(c => {
            const pkgProject = Array.from<string>(empProjectIds).some(pid => c.PackageID && c.PackageID.startsWith(pid));
            return pkgProject;
        });
    }, [contracts, empProjects]);

    // ── Chart Data ──
    const chartData = useMemo(() => {
        const inProgress = empTasks.filter(t => t.Status === TaskStatus.InProgress).length;
        const todo = empTasks.filter(t => t.Status === TaskStatus.Todo).length;
        const done = completedTasks.length;
        const review = empTasks.filter(t => t.Status === TaskStatus.Review).length;
        return [
            { name: 'Đang thực hiện', value: inProgress, color: '#4a90e2' },
            { name: 'Chờ duyệt', value: review, color: '#357abd' },
            { name: 'Hoàn thành', value: done, color: '#404040' },
            { name: 'Cần làm', value: todo, color: '#A3A3A3' },
        ].filter(d => d.value > 0);
    }, [empTasks, completedTasks]);

    const completionRate = empTasks.length > 0 ? Math.round((completedTasks.length / empTasks.length) * 100) : 0;

    // ── Loading / Not Found ──
    if (empLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                    <p className="text-sm text-slate-400">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="py-20">
                <EmptyState
                    icon={<Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600" />}
                    title="Không tìm thấy nhân sự."
                    className="border-0 shadow-none bg-transparent"
                />
            </div>
        );
    }

    const roleInfo = getRoleInfo(employee.Role);

    // ═══════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════
    return (
        <div className="flex flex-col h-full">

            {/* ══════════ HERO HEADER — Compact for SlidePanel ══════════ */}
            <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-b-[3px] border-primary-500 relative shrink-0">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0djJoLTJ2LTJoMnptMCAxMHYyaC0ydi0yaDJ6bTAtMTB2MmgtMnYtMmgyek0yNiAyNHYyaC0ydi0yaDJ6bTAtMTB2MmgtMnYtMmgyek0xNiAxNHYyaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="relative px-5 py-5">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <img
                                src={employee.AvatarUrl}
                                alt={employee.FullName}
                                className="w-16 h-16 rounded-xl object-cover border-3 border-white/20 shadow-sm"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${employee.Status === EmployeeStatus.Active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-black text-white truncate">{employee.FullName}</h2>
                            <p className="text-blue-200 font-medium text-sm">{employee.Position}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/80 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-md">
                                    <Building2 className="w-3 h-3" /> {employee.Department}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/80 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-md">
                                    <Shield className="w-3 h-3" /> {roleInfo.label}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-white/60 bg-white/5 px-2 py-1 rounded-md">
                                    <Hash className="w-3 h-3" /> {employee.EmployeeID}
                                </span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(employeeId)}
                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
                                    title="Chỉnh sửa"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(employeeId)}
                                    className="p-2 rounded-lg bg-white/10 hover:bg-red-500/80 text-white/60 hover:text-white transition-all"
                                    title="Xóa nhân sự"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════ CONTENT — Scrollable ══════════ */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

                {/* ── Info Row — Contact + Stats ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contact */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <User className="w-3 h-3" /> Liên hệ
                        </h3>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /></div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{employee.Email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg"><Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /></div>
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{employee.Phone || '—'}</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-violet-50 dark:bg-violet-900/30 rounded-lg"><Calendar className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /></div>
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {employee.JoinDate ? new Date(employee.JoinDate).toLocaleDateString('vi-VN') : '—'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mini Stats */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <ClipboardList className="w-3 h-3" /> Thống kê
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-2.5 text-center">
                                <p className="text-xl font-black text-slate-800 dark:text-slate-200">{empTasks.length}</p>
                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">Tổng CV</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2.5 text-center">
                                <p className="text-xl font-black text-blue-600 dark:text-blue-400">{activeTasks.length}</p>
                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">Đang làm</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-2.5 text-center">
                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{completedTasks.length}</p>
                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">Hoàn thành</p>
                            </div>
                            <div className={`rounded-lg p-2.5 text-center ${overdueTasks.length > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-slate-50 dark:bg-slate-700'}`}>
                                <p className={`text-xl font-black ${overdueTasks.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>{overdueTasks.length}</p>
                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">Quá hạn</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Cross-Module Summary Strip ── */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2">
                        <FolderOpen className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{empProjects.length} Dự án</span>
                    </div>
                    <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg px-3 py-2">
                        <ClipboardList className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{empTasks.length} Công việc</span>
                    </div>
                    <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2">
                        <FileText className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{empContracts.length} Hợp đồng</span>
                    </div>
                    {chartData.length > 0 && (
                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                            <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{completionRate}% hoàn thành</span>
                        </div>
                    )}
                </div>

                {/* ── Nội dung công việc & Tiêu chí đánh giá ── */}
                {(employee.JobContent || employee.CompletionCriteria) && (
                    <div className="grid grid-cols-1 gap-4">
                        {employee.JobContent && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <ClipboardList className="w-3 h-3" /> Nội dung công việc
                                </h3>
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{employee.JobContent}</p>
                            </div>
                        )}
                        {employee.CompletionCriteria && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Target className="w-3 h-3" /> Tiêu chí đánh giá hoàn thành
                                </h3>
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{employee.CompletionCriteria}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════ TABS ══════════ */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4">
                        <div className="flex gap-1">
                            {[
                                { key: 'tasks' as const, label: 'Công việc', icon: <ClipboardList className="w-3.5 h-3.5" />, count: empTasks.length },
                                { key: 'projects' as const, label: 'Dự án', icon: <FolderOpen className="w-3.5 h-3.5" />, count: empProjects.length },
                                { key: 'contracts' as const, label: 'Hợp đồng', icon: <FileText className="w-3.5 h-3.5" />, count: empContracts.length },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-all -mb-px ${activeTab === tab.key
                                        ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                                        : 'border-transparent text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === tab.key ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400'
                                        }`}>{tab.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                        {/* ── Tasks Tab ── */}
                        {activeTab === 'tasks' && (
                            <div>
                                {empTasks.length > 0 ? (
                                    <div className="space-y-2">
                                        {empTasks.map(task => {
                                            const statusInfo = getStatusInfo(task.Status);
                                            const priorityInfo = getPriorityInfo(task.Priority);
                                            const progress = task.ProgressPercent || (task.Status === TaskStatus.Done ? 100 : 0);
                                            const isOverdue = task.Status !== TaskStatus.Done && task.DueDate && new Date(task.DueDate) < new Date();

                                            return (
                                                <div
                                                    key={task.TaskID}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700 group ${isOverdue ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}
                                                >
                                                    {/* Status icon */}
                                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${statusInfo.bg}/10 ${statusInfo.color}`}>
                                                        {React.cloneElement(statusInfo.icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5' })}
                                                    </div>

                                                    {/* Task info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <h4 className={`text-xs font-semibold truncate ${task.Status === TaskStatus.Done ? 'text-slate-400 line-through' : isOverdue ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                {task.Title}
                                                            </h4>
                                                            {task.IsCritical && <span className="shrink-0 text-[7px] font-black text-red-600 bg-red-100 px-1 py-0.5 rounded uppercase">Găng</span>}
                                                        </div>
                                                        {task.DueDate && (
                                                            <p className={`text-[10px] mt-0.5 ${isOverdue ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                                                                {new Date(task.DueDate).toLocaleDateString('vi-VN')}
                                                                {isOverdue && ' ⚠'}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Progress */}
                                                    <div className="flex items-center gap-1.5 shrink-0 w-16">
                                                        <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(progress)}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-[9px] font-bold tabular-nums ${progress >= 100 ? 'text-emerald-600' : 'text-slate-400'}`}>{progress}%</span>
                                                    </div>

                                                    {/* Priority */}
                                                    <span className={`shrink-0 inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded ${priorityInfo.color}`}>
                                                        <span className={`w-1 h-1 rounded-full ${priorityInfo.dot}`} />
                                                        {priorityInfo.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-400" />}
                                        title="Chưa có công việc nào được giao."
                                        className="py-10 border-0 bg-transparent shadow-none"
                                    />
                                )}
                            </div>
                        )}

                        {/* ── Projects Tab ── */}
                        {activeTab === 'projects' && (
                            <div>
                                {empProjects.length > 0 ? (
                                    <div className="space-y-2">
                                        {empProjects.map(project => {
                                            const projectTasks = empTasks.filter(t => t.ProjectID === project.ProjectID);
                                            const doneTasks = projectTasks.filter(t => t.Status === TaskStatus.Done);
                                            const progress = projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;

                                            return (
                                                <div
                                                    key={project.ProjectID}
                                                    onClick={() => navigate(`/projects/${project.ProjectID}`)}
                                                    className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700 group"
                                                >
                                                    <div className="p-1.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shrink-0">
                                                        <Briefcase className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary-600 transition-colors">
                                                            {project.ProjectName}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] text-slate-400 font-mono">{project.ProjectID}</span>
                                                            <span className="text-[10px] text-slate-300">•</span>
                                                            <span className="text-[10px] text-slate-400">{doneTasks.length}/{projectTasks.length} CV</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className={`text-[10px] font-bold ${progress >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>{progress}%</span>
                                                        <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-400 transition-colors" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-400" />}
                                        title="Chưa tham gia dự án nào."
                                        className="py-10 border-0 bg-transparent shadow-none"
                                    />
                                )}
                            </div>
                        )}

                        {/* ── Contracts Tab ── */}
                        {activeTab === 'contracts' && (
                            <div>
                                {empContracts.length > 0 ? (
                                    <div className="space-y-2">
                                        {empContracts.map(contract => (
                                            <div
                                                key={contract.ContractID}
                                                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <div className="p-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg shrink-0">
                                                    <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{contract.ContractID}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        {contract.SignDate ? new Date(contract.SignDate).toLocaleDateString('vi-VN') : '—'}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        {(contract.Value || 0).toLocaleString('vi-VN')} đ
                                                    </p>
                                                    <span className="inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mt-0.5">
                                                        {contract.Status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<FileText className="w-10 h-10 text-slate-300 dark:text-slate-400" />}
                                        title="Không có hợp đồng liên quan."
                                        className="py-10 border-0 bg-transparent shadow-none"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeSlideContent;
