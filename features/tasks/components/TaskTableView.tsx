import React from 'react';
import { FolderOpen, Calendar, AlertTriangle, Edit, Trash2, Layers, Sparkles } from 'lucide-react';
import PermissionGate from '../../../components/PermissionGate';
import { EmptyState } from '../../../components/ui';
import { Task, TaskStatus } from '../../../types';
import { getStatusInfo, getPriorityInfo } from '../TaskCreateEditModal';
interface TaskTableViewProps {
    paginatedTasks: Task[];
    tasksByProject: Record<string, Task[]>;
    selectedIds: Set<string>;
    toggleSelectAll: () => void;
    toggleSelect: (id: string) => void;
    handleSort: (field: any) => void;
    SortIcon: React.FC<{ field: any }>;
    getProjectName: (id: string, groupTasks?: Task[]) => string;
    getAssignee: (id: string) => any;
    openTaskPanel: (task: Task) => void;
    openEditModal: (task: Task) => void;
    handleDelete: (id: string) => void;
    openCreateModal: () => void;
    openPanel: (options: any) => void;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
    paginatedTasks,
    tasksByProject,
    selectedIds,
    toggleSelectAll,
    toggleSelect,
    handleSort,
    SortIcon,
    getProjectName,
    getAssignee,
    openTaskPanel,
    openEditModal,
    handleDelete,
    openCreateModal,
    openPanel
}) => {
    const getProgressGradient = (percent: number) => {
        if (percent >= 100) return 'from-emerald-400 to-emerald-600';
        if (percent >= 70) return 'from-blue-400 to-blue-600';
        if (percent >= 40) return 'from-primary-400 to-primary-500';
        if (percent > 0) return 'from-slate-300 to-slate-400';
        return 'from-slate-200 to-slate-200';
    };

    if (Object.keys(tasksByProject).length === 0) {
        return (
            <EmptyState
                icon={<Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-400" />}
                title="Không tìm thấy công việc nào."
                description="Thử thay đổi bộ lọc hoặc tạo công việc mới."
                actionLabel="Tạo công việc"
                onAction={openCreateModal}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
            />
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
            <table className="w-full">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-2 py-3 w-8 border-b border-slate-200 dark:border-slate-800 text-center">
                            <input
                                type="checkbox"
                                checked={paginatedTasks.length > 0 && selectedIds.size === paginatedTasks.length}
                                onChange={toggleSelectAll}
                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                            />
                        </th>
                        <th className="px-2 py-3 text-left w-10 border-b border-slate-200 dark:border-slate-800"></th>
                        <th onClick={() => handleSort('Title')} className="group/th px-3 py-3 text-left w-[25%] min-w-[160px] max-w-[200px] cursor-pointer select-none hover:text-blue-600 transition-colors border-b border-slate-200 dark:border-slate-800">
                            <span className="flex items-center gap-1">Công việc <SortIcon field="Title" /></span>
                        </th>
                        <th className="px-3 py-3 text-left hidden md:table-cell w-[10%] min-w-[90px] border-b border-slate-200 dark:border-slate-800">Phòng ban</th>
                        <th onClick={() => handleSort('ProgressPercent')} className="group/th px-3 py-3 text-center w-16 cursor-pointer select-none hover:text-blue-600 transition-colors border-b border-slate-200 dark:border-slate-800">
                            <span className="flex items-center justify-center gap-1">Tiến độ <SortIcon field="ProgressPercent" /></span>
                        </th>
                        <th className="px-3 py-3 text-left hidden lg:table-cell w-[12%] min-w-[110px] border-b border-slate-200 dark:border-slate-800">Phụ trách</th>
                        <th onClick={() => handleSort('Status')} className="group/th px-3 py-3 text-left hidden sm:table-cell w-24 cursor-pointer select-none hover:text-blue-600 transition-colors border-b border-slate-200 dark:border-slate-800">
                            <span className="flex items-center gap-1">Trạng thái <SortIcon field="Status" /></span>
                        </th>
                        <th onClick={() => handleSort('DueDate')} className="group/th px-3 py-3 text-left hidden sm:table-cell w-24 cursor-pointer select-none hover:text-blue-600 transition-colors border-b border-slate-200 dark:border-slate-800">
                            <span className="flex items-center gap-1">Hạn chót <SortIcon field="DueDate" /></span>
                        </th>
                        <th onClick={() => handleSort('Priority')} className="group/th px-3 py-3 text-center w-16 cursor-pointer select-none hover:text-blue-600 transition-colors border-b border-slate-200 dark:border-slate-800">
                            <span className="flex items-center justify-center gap-1">Ưu tiên <SortIcon field="Priority" /></span>
                        </th>
                        <th className="px-2 py-3 w-14 border-b border-slate-200 dark:border-slate-800"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {Object.entries(tasksByProject).map(([projectId, projectTasks]: [string, Task[]]) => (
                        <React.Fragment key={projectId}>
                            {/* ── Project Group Separator ── */}
                            <tr className="bg-slate-50/80 dark:bg-slate- border-t-2 border-slate-200 dark:border-slate-700">
                                <td colSpan={11} className="px-4 py-2.5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg shadow-sm bg-primary-100 dark:bg-primary-500/20" >
                                            <FolderOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{getProjectName(projectId, projectTasks)}</h3>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-400">{projectTasks.length} công việc</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            {/* ── Tasks for this project ── */}
                            {projectTasks.map(task => {
                                const assignee = getAssignee(task.AssigneeID);
                                const priorityInfo = getPriorityInfo(task.Priority);
                                const statusInfo = getStatusInfo(task.Status);
                                const progress = task.ProgressPercent || (task.Status === TaskStatus.Done ? 100 : 0);
                                const isOverdue = task.Status !== TaskStatus.Done && task.Status !== TaskStatus.Incomplete && task.DueDate && new Date(task.DueDate) < new Date();

                                return (
                                    <tr
                                        key={task.TaskID}
                                        onClick={() => openTaskPanel(task)}
                                        className={`group cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate- ${isOverdue ? 'bg-red-50/40 dark:bg-red-900/10' : ''} ${selectedIds.has(task.TaskID) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        {/* Checkbox */}
                                        <td className="px-2 py-3.5" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(task.TaskID)}
                                                onChange={() => toggleSelect(task.TaskID)}
                                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/30 cursor-pointer bg-white dark:bg-slate-900"
                                            />
                                        </td>
                                        {/* Status */}
                                        <td className="px-2 py-3.5">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${statusInfo.bg}/10 ${statusInfo.color}`}>
                                                {statusInfo.icon}
                                            </div>
                                        </td>

                                        {/* Title + Description */}
                                        <td className="px-3 py-3.5 pr-4 max-w-[200px]" title={task.Description || task.Title}>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className={`text-[13px] font-semibold group-hover:text-blue-600 transition-colors line-clamp-1 ${task.Status === TaskStatus.Done ? 'text-slate-400 dark:text-slate-500' : isOverdue ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'
                                                    }`}>
                                                    {task.Title?.replace(/^(?:Phòng|Ban)\s+[^-]+-\s*/i, '')}
                                                </h4>
                                                {task.IsCritical && (
                                                    <span className="shrink-0 text-[8px] font-black text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/10 px-1.5 py-0.5 rounded-md uppercase border border-red-200 dark:border-red-500/20">Găng</span>
                                                )}
                                            </div>
                                            {task.Description && (
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 pr-4 truncate">{task.Description}</p>
                                            )}
                                        </td>

                                        {/* Department */}
                                        <td className="px-3 py-3.5 hidden md:table-cell">
                                            {assignee?.Department ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-500/20">
                                                    <Layers className="w-3 shrink-0 h-3" />
                                                    <span className="line-clamp-1">{assignee.Department.replace('Phòng ', '')}</span>
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
                                            )}
                                        </td>

                                        {/* Progress */}
                                        <td className="px-3 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(progress)} transition-all duration-500`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <span className={`text-[10px] font-bold tabular-nums w-7 text-right ${progress >= 100 ? 'text-emerald-600' : progress >= 70 ? 'text-blue-600' : 'text-slate-400'
                                                    }`}>{progress}%</span>
                                            </div>
                                        </td>

                                        {/* Assignee */}
                                        <td className="px-3 py-3.5 hidden lg:table-cell">
                                            {assignee ? (
                                                <div className="flex items-center gap-2.5">
                                                    <div className="relative">
                                                        <img
                                                            src={assignee.AvatarUrl || `https://ui-avatars.com/api/?name=${assignee.FullName}&background=6366f1&color=fff&size=32`}
                                                            alt=""
                                                            className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-lg object-cover"
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{assignee.FullName}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{assignee.Position || assignee.Department}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">Chưa gán</span>
                                            )}
                                        </td>

                                        <td className="px-3 py-3.5 hidden sm:table-cell">
                                            <span className={`inline-flex items-center gap-1 text-[10px] whitespace-nowrap font-bold px-2 py-1 rounded-md ${statusInfo.bg}/10 ${statusInfo.color} border border-dashed ${statusInfo.border || 'border-transparent'}`}>
                                                {statusInfo.label}
                                            </span>
                                        </td>

                                        {/* Due */}
                                        <td className="px-3 py-3.5 hidden sm:table-cell">
                                            {task.DueDate ? (
                                                <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-600 font-semibold dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                    {new Date(task.DueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    {isOverdue && <AlertTriangle className="w-3 h-3 text-red-500 dark:text-red-400 animate-pulse" />}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
                                            )}
                                        </td>

                                        {/* Priority */}
                                        <td className="px-3 py-3.5 text-center">
                                            <span className={`inline-flex items-center gap-1 text-[9px] whitespace-nowrap font-bold px-2 py-1 rounded-md ${priorityInfo.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
                                                {priorityInfo.label}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-2 py-3.5">
                                            <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-all">
                                                <PermissionGate resource="tasks" action="update">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                </PermissionGate>
                                                <PermissionGate resource="tasks" action="delete">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(task.TaskID); }}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </PermissionGate>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
