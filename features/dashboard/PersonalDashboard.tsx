import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    User, Briefcase, CheckSquare, FileText, AlertTriangle,
    Clock, ArrowRight, Building2, TrendingUp,
    ChevronRight, Target, FileBox
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { useContracts } from '../../hooks/useContracts';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { ProjectStatus, TaskStatus, TaskPriority } from '../../types';
import { StatCard, EmptyState } from '../../components/ui';
import { supabase } from '../../lib/supabase';

const PersonalDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { projects } = useProjects();
    const { data: allTasks } = useTasks();
    const { contracts } = useContracts();
    const tasks = allTasks || [];

    // Get projects where current user is a member (or all if Admin/Director)
    const myProjects = useMemo(() => {
        if (!currentUser) return [];
        
        // Admins and Directors have visibility across all projects
        if (currentUser.Role === ('Admin' as any) || currentUser.Role === ('Director' as any)) {
            return projects;
        }
        
        return projects.filter(p =>
            p.Members?.includes(currentUser.EmployeeID)
        );
    }, [currentUser, projects]);

    const myProjectIds = useMemo(() => myProjects.map(p => p.ProjectID), [myProjects]);

    // Get tasks assigned to current user
    const myTasks = useMemo(() => {
        if (!currentUser) return [];
        return tasks.filter(t => t.AssigneeID === currentUser.EmployeeID);
    }, [currentUser, tasks]);

    // Tasks by status
    const taskStats = useMemo(() => {
        const inProgress = myTasks.filter(t => t.Status === TaskStatus.InProgress).length;
        const todo = myTasks.filter(t => t.Status === TaskStatus.Todo).length;
        const done = myTasks.filter(t => t.Status === TaskStatus.Done).length;
        const overdue = myTasks.filter(t => {
            const due = new Date(t.DueDate);
            return t.Status !== TaskStatus.Done && due < new Date();
        }).length;
        return { inProgress, todo, done, overdue, total: myTasks.length };
    }, [myTasks]);

    // Upcoming deadlines (next 7 days) — with project name resolution
    const upcomingDeadlines = useMemo(() => {
        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Build project name lookup map
        const projectNameMap: Record<string, string> = {};
        projects.forEach(p => {
            projectNameMap[p.ProjectID] = p.ProjectName;
        });

        return myTasks
            .filter(t => {
                const due = new Date(t.DueDate);
                return t.Status !== TaskStatus.Done && due >= now && due <= next7Days;
            })
            .sort((a, b) => new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime())
            .slice(0, 5)
            .map(t => ({
                ...t,
                _projectName: projectNameMap[t.ProjectID] || t.ProjectID,
            }));
    }, [myTasks, projects]);

    // Fetch recent documents from Supabase for my projects
    const { data: myDocuments = [] } = useQuery({
        queryKey: ['personal-documents', myProjectIds],
        queryFn: async () => {
            if (myProjectIds.length === 0) return [];
            const { data } = await supabase
                .from('documents')
                .select('doc_id, doc_name, project_id, upload_date, iso_status, version, category')
                .in('project_id', myProjectIds)
                .order('upload_date', { ascending: false })
                .limit(5);
            return data || [];
        },
        enabled: myProjectIds.length > 0,
    });

    // Get contracts for my projects
    const myContracts = useMemo(() => {
        return contracts.filter(c => myProjectIds.includes(c.ProjectID));
    }, [contracts, myProjectIds]);

    // Total investment of my projects
    const totalInvestment = myProjects.reduce((sum, p) => sum + p.TotalInvestment, 0);

    // Priority colors
    const priorityColors: Record<string, string> = {
        [TaskPriority.Urgent]: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
        [TaskPriority.High]: 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800',
        [TaskPriority.Medium]: 'bg-yellow-100 text-primary-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
        [TaskPriority.Low]: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    };

    const daysUntil = (dateStr: string) => {
        const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Hôm nay';
        if (diff === 1) return 'Ngày mai';
        return `${diff} ngày`;
    };

    // Build project name lookup for documents
    const projectNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        projects.forEach(p => { map[p.ProjectID] = p.ProjectName; });
        return map;
    }, [projects]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Welcome Header */}
            <div className="rounded-2xl p-4 sm:p-8 relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 dark:from-slate-800 dark:to-slate-900 border border-transparent dark:border-slate-800 shadow-sm">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none"></div>
                <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 blur-xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur shadow-sm ring-1 ring-white/30">
                            {currentUser?.AvatarUrl ? (
                                <img src={currentUser.AvatarUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <User className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white drop-shadow-lg">Xin chào, {currentUser?.FullName || 'Khách'}!</h1>
                            <p className="text-primary-100 dark:text-slate-300 mt-1 font-medium">{currentUser?.Position} - {currentUser?.Department}</p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-sm text-primary-100 dark:text-slate-400">Hôm nay</p>
                        <p className="text-lg font-bold text-white">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Card 1: Dự án phụ trách */}
                <div onClick={() => navigate('/projects')} className="cursor-pointer transition-transform hover:-translate-y-1">
                    <StatCard label="Dự án phụ trách" value={myProjects.length} color="blue" icon={<Building2 className="w-5 h-5" />} />
                </div>

                {/* Card 2: Công việc đang làm */}
                <div onClick={() => navigate('/tasks')} className="cursor-pointer transition-transform hover:-translate-y-1">
                    <StatCard label="Công việc đang làm" value={taskStats.inProgress} color="amber" icon={<Target className="w-5 h-5" />} />
                </div>

                {/* Card 3: Chờ xử lý */}
                <div onClick={() => navigate('/tasks')} className="cursor-pointer transition-transform hover:-translate-y-1">
                    <StatCard label="Chờ xử lý" value={taskStats.todo} color="violet" icon={<Clock className="w-5 h-5" />} />
                </div>

                {/* Card 4: Quá hạn */}
                <div onClick={() => navigate('/tasks')} className="cursor-pointer transition-transform hover:-translate-y-1">
                    <StatCard label="Công việc quá hạn" value={taskStats.overdue} color="rose" icon={<AlertTriangle className="w-5 h-5" />} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* My Projects */}
                <div className="xl:col-span-2 section-card">
                    <div className="section-card-header">
                        <div className="flex items-center gap-2">
                            <div className="section-icon"><Briefcase className="w-3.5 h-3.5" /></div>
                            <span>Dự án của tôi</span>
                        </div>
                        <button
                            onClick={() => navigate('/projects')}
                            className="text-xs font-bold text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 flex items-center gap-1"
                        >
                            Xem tất cả <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-slate-700">
                        {myProjects.length === 0 ? (
                            <EmptyState icon={<Building2 className="w-10 h-10" />} title="Bạn chưa được phân công dự án nào" className="py-6" />
                        ) : (
                            myProjects.slice(0, 4).map(project => (
                                <div
                                    key={project.ProjectID}
                                    onClick={() => navigate(`/projects/${project.ProjectID}`)}
                                    className="p-4 hover:bg-bg-app dark:bg-slate-900 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center gap-4"
                                >
                                    <div className={`w-2 h-12 rounded-full ${project.Status === ProjectStatus.Preparation ? 'bg-blue-500' :
                                        project.Status === ProjectStatus.Execution ? 'bg-orange-500' :
                                            project.Status === ProjectStatus.Completion ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'
                                        }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 dark:text-slate-100 truncate">{project.ProjectName}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-slate-400">
                                            <span>Nhóm {project.GroupCode}</span>
                                            <span>•</span>
                                            <span>{formatCurrency(project.TotalInvestment)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-20 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full transition-all"
                                                    style={{ width: `${project.Progress || 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-600 dark:text-slate-300">{project.Progress || 0}%</span>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${project.Status === ProjectStatus.Preparation ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            project.Status === ProjectStatus.Execution ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                project.Status === ProjectStatus.Completion ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                                            }`}>
                                            {project.Status === ProjectStatus.Execution ? 'Thực hiện DA' :
                                                project.Status === ProjectStatus.Completion ? 'Kết thúc XD' : 'Chuẩn bị DA'}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="section-card">
                    <div className="section-card-header">
                        <div className="flex items-center gap-2">
                            <div className="section-icon"><Clock className="w-3.5 h-3.5" /></div>
                            <span>Deadline sắp tới</span>
                        </div>
                        <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">7 ngày</span>
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-slate-700">
                        {upcomingDeadlines.length === 0 ? (
                            <EmptyState icon={<CheckSquare className="w-10 h-10" />} title="Không có deadline trong 7 ngày tới" className="py-6" />
                        ) : (
                            upcomingDeadlines.map(task => (
                                <div
                                    key={task.TaskID}
                                    onClick={() => navigate(`/tasks/${task.TaskID}`)}
                                    className="p-4 hover:bg-bg-app dark:bg-slate-900 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 dark:text-slate-100 text-sm truncate">{task.Title}</p>
                                            <p className="text-xs text-gray-400 dark:text-slate-400 mt-1 truncate">{task._projectName}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 ${priorityColors[task.Priority]}`}>
                                            {daysUntil(task.DueDate)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* My Tasks */}
                <div className="section-card">
                    <div className="section-card-header">
                        <div className="flex items-center gap-2">
                            <div className="section-icon"><CheckSquare className="w-3.5 h-3.5" /></div>
                            <span>Công việc đang thực hiện</span>
                        </div>
                        <button
                            onClick={() => navigate('/tasks')}
                            className="text-xs font-bold text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 flex items-center gap-1"
                        >
                            Xem tất cả <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[300px] overflow-y-auto">
                        {myTasks.filter(t => t.Status === TaskStatus.InProgress).slice(0, 5).map(task => (
                            <div
                                key={task.TaskID}
                                onClick={() => navigate(`/tasks/${task.TaskID}`)}
                                className="p-4 hover:bg-bg-app dark:bg-slate-900 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center gap-3"
                            >
                                <div className={`w-2 h-2 rounded-full ${task.Priority === TaskPriority.Urgent ? 'bg-rose-500' :
                                    task.Priority === TaskPriority.High ? 'bg-primary-500' :
                                        task.Priority === TaskPriority.Medium ? 'bg-yellow-500' : 'bg-emerald-500'
                                    }`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 dark:text-slate-100 text-sm truncate">{task.Title}</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">{task.DueDate}</p>
                                </div>
                                <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
                                    Đang làm
                                </span>
                            </div>
                        ))}

                        {myTasks.filter(t => t.Status === TaskStatus.InProgress).length === 0 && (
                            <EmptyState icon={<Target className="w-10 h-10" />} title="Không có công việc đang thực hiện" className="py-6" />
                        )}
                    </div>
                </div>

                {/* My Documents — Real Data from Supabase */}
                <div className="section-card">
                    <div className="section-card-header">
                        <div className="flex items-center gap-2">
                            <div className="section-icon"><FileText className="w-3.5 h-3.5" /></div>
                            <span>Tài liệu gần đây</span>
                        </div>
                        <button
                            onClick={() => navigate('/documents')}
                            className="text-xs font-bold text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 flex items-center gap-1"
                        >
                            Xem tất cả <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[300px] overflow-y-auto">
                        {myDocuments.length === 0 ? (
                            <EmptyState icon={<FileText className="w-10 h-10" />} title="Chưa có tài liệu nào" className="py-6" />
                        ) : (
                            myDocuments.map((doc: any) => (
                                <div
                                    key={doc.doc_id}
                                    className="p-4 hover:bg-bg-app dark:bg-slate-900 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center gap-3"
                                    onClick={() => navigate('/documents')}
                                >
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                                        <FileBox className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 dark:text-slate-100 text-sm truncate">{doc.doc_name}</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5 truncate">
                                            {projectNameMap[doc.project_id] || doc.project_id}
                                            {doc.version ? ` • v${doc.version}` : ''}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${doc.iso_status?.startsWith('A')
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                                        }`}>
                                        {doc.iso_status?.startsWith('A') ? 'Đã duyệt' : doc.iso_status || 'Nháp'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Contracts Row */}
            {myContracts.length > 0 && (
                <div className="section-card">
                    <div className="section-card-header">
                        <div className="flex items-center gap-2">
                            <div className="section-icon"><FileText className="w-3.5 h-3.5" /></div>
                            <span>Hợp đồng liên quan</span>
                        </div>
                        <button
                            onClick={() => navigate('/contracts')}
                            className="text-xs font-bold text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 flex items-center gap-1"
                        >
                            Xem tất cả <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-slate-700">
                        {myContracts.slice(0, 3).map(contract => (
                            <div
                                key={contract.ContractID}
                                onClick={() => navigate(`/contracts/${contract.ContractID}`)}
                                className="p-4 hover:bg-bg-app dark:bg-slate-900 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center gap-4"
                            >
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                                    <Briefcase className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm truncate">{contract.ContractName}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-slate-400">
                                        <span>{formatCurrency(contract.Value)}</span>
                                        <span>•</span>
                                        <span>{projectNameMap[contract.ProjectID] || contract.ProjectID}</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary Footer */}
            <div className="bg-bg-surface rounded-2xl shadow-sm border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div>
                            <p className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase">Tổng mức đầu tư phụ trách</p>
                            <p className="text-xl font-black text-gray-900 dark:text-slate-100 mt-1">{formatCurrency(totalInvestment)}</p>
                        </div>
                        <div className="h-10 w-px bg-gray-200 dark:bg-slate-700"></div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase">Hoàn thành công việc</p>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                {taskStats.done}/{taskStats.total} <span className="text-sm font-normal text-gray-400 dark:text-slate-400">({taskStats.total > 0 ? Math.round(taskStats.done / taskStats.total * 100) : 0}%)</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/tasks')}
                        className="btn btn-primary btn-md shadow-sm flex items-center gap-2"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Xem báo cáo chi tiết
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PersonalDashboard;
