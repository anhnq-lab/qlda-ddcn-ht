import React from 'react';
import { Search, FolderOpen, ChevronDown, Calendar, Layers, Filter, X, AlertTriangle, ListTodo, LayoutGrid, Plus, User, Tag, FileCheck, Clock } from 'lucide-react';
import PermissionGate from '../../../components/PermissionGate';
import { TaskStatus } from '../../../types';

interface TaskFilterBarProps {
    filterProject: string;
    setFilterProject: (v: string) => void;
    filterMonth: string;
    setFilterMonth: (v: string) => void;
    filterDepartment: string;
    setFilterDepartment: (v: string) => void;
    filterStatus: string;
    setFilterStatus: (v: string) => void;
    filterOverdue: boolean;
    setFilterOverdue: (v: boolean) => void;
    filterNotUpdatedThisWeek: boolean;
    setFilterNotUpdatedThisWeek: (v: boolean) => void;
    filterPersonal: boolean;
    setFilterPersonal: (v: boolean) => void;
    filterPendingProposal: boolean;
    setFilterPendingProposal: (v: boolean) => void;
    filterTaskType: string;
    setFilterTaskType: (v: string) => void;
    hasActiveFilters: boolean;
    projects: any[];
    departments: string[];
    viewMode: 'list' | 'board';
    setViewMode: (v: 'list' | 'board') => void;
    openCreateModal: () => void;
    hideMonthFilter?: boolean;
    hideDepartmentFilter?: boolean;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
    filterProject, setFilterProject,
    filterMonth, setFilterMonth,
    filterDepartment, setFilterDepartment,
    filterStatus, setFilterStatus,
    filterOverdue, setFilterOverdue,
    filterNotUpdatedThisWeek, setFilterNotUpdatedThisWeek,
    filterPersonal, setFilterPersonal,
    filterPendingProposal, setFilterPendingProposal,
    filterTaskType, setFilterTaskType,
    hasActiveFilters,
    projects, departments,
    viewMode, setViewMode,
    openCreateModal,
    hideMonthFilter = false,
    hideDepartmentFilter = false
}) => {
    return (
        <div className="bg-transparent pb-2.5 flex items-center justify-between gap-1.5 w-full flex-wrap shrink-0 border-b border-slate-100/30 dark:border-slate-800/30">
            {/* Trái: Tất cả các bộ lọc (Toggles, Tìm kiếm, Selects) */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1 w-full lg:w-auto">
                {/* Cá nhân toggle button */}
                <button
                    onClick={() => setFilterPersonal(!filterPersonal)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                        filterPersonal 
                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title={filterPersonal ? "Đang hiện việc cá nhân" : "Hiện việc cá nhân"}
                >
                    <User className={`w-3 h-3 ${filterPersonal ? 'text-primary-500' : ''}`} />
                    <span className="whitespace-nowrap">Việc của tôi</span>
                </button>

                {/* Quá hạn toggle button */}
                <button
                    onClick={() => setFilterOverdue(!filterOverdue)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                        filterOverdue 
                        ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title={filterOverdue ? "Đang hiện việc quá hạn" : "Hiện việc quá hạn"}
                >
                    <AlertTriangle className={`w-3 h-3 ${filterOverdue ? 'text-rose-500' : ''}`} />
                    <span className="whitespace-nowrap">Quá hạn</span>
                </button>

                {/* Chưa cập nhật tuần này toggle button */}
                <button
                    onClick={() => setFilterNotUpdatedThisWeek(!filterNotUpdatedThisWeek)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                        filterNotUpdatedThisWeek 
                        ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title={filterNotUpdatedThisWeek ? "Đang hiện việc chưa cập nhật tuần này" : "Hiện việc chưa cập nhật tuần này"}
                >
                    <Clock className={`w-3 h-3 ${filterNotUpdatedThisWeek ? 'text-amber-500' : ''}`} />
                    <span className="whitespace-nowrap">Chưa cập nhật tuần này</span>
                </button>

                {/* Chờ duyệt đề xuất toggle button */}
                <button
                    onClick={() => setFilterPendingProposal(!filterPendingProposal)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                        filterPendingProposal 
                        ? 'bg-amber-55 dark:bg-amber-900/30 border-amber-250 dark:border-amber-800 text-amber-700 dark:text-amber-400 shadow-sm font-black' 
                        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title={filterPendingProposal ? "Đang hiện việc chờ duyệt đề xuất" : "Hiện việc chờ duyệt đề xuất"}
                >
                    <FileCheck className={`w-3 h-3 ${filterPendingProposal ? 'text-amber-500' : ''}`} />
                    <span className="whitespace-nowrap">Chờ duyệt đề xuất</span>
                </button>

                {/* Dự án */}
                <div className="relative">
                    <FolderOpen className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                    <select
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        className="pl-[26px] pr-5 py-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all max-w-[140px]"
                    >
                        <option value="All">Tất cả dự án</option>
                        {projects.map(p => (
                            <option key={p.ProjectID} value={p.ProjectID} title={p.ProjectName}>
                                {p.ProjectName.length > 15 ? p.ProjectName.substring(0, 15) + '...' : p.ProjectName}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
                </div>

                {/* Tháng (Nếu không bị ẩn) */}
                {!hideMonthFilter && (
                    <div className="relative">
                        <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="pl-[26px] pr-5 py-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all min-w-[85px]"
                        >
                            <option value="All">Tất cả tháng</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <option key={month} value={month.toString()}>Tháng {month}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
                    </div>
                )}

                {/* Phòng ban */}
                {!hideDepartmentFilter && (
                    <div className="relative">
                        <Layers className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="pl-[26px] pr-5 py-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all max-w-[140px]"
                        >
                            <option value="All">Tất cả phòng ban</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
                    </div>
                )}

                {/* Loại công việc */}
                <div className="relative">
                    <Tag className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                    <select
                        value={filterTaskType}
                        onChange={(e) => setFilterTaskType(e.target.value)}
                        className="pl-[26px] pr-5 py-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all max-w-[120px]"
                    >
                        <option value="All">Tất cả loại</option>
                        <option value="project">📁 Dự án</option>
                        <option value="management">📋 Điều hành</option>
                        <option value="internal">🏢 Nội bộ</option>
                    </select>
                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
                </div>

                {/* Trạng thái */}
                <div className="relative">
                    <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-[26px] pr-5 py-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all max-w-[140px]"
                    >
                        <option value="All">Tất cả trạng thái</option>
                        <option value={TaskStatus.Todo}>Mới</option>
                        <option value={TaskStatus.InProgress}>Đang làm</option>
                        <option value={TaskStatus.Done}>Xong</option>
                        <option value={TaskStatus.Incomplete}>Chưa xong</option>
                    </select>
                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 w-2.5 h-2.5 pointer-events-none" />
                </div>

                {/* Xóa bộ lọc button */}
                {hasActiveFilters && (
                    <button
                        onClick={() => { 
                            setFilterStatus('All'); 
                            setFilterProject('All'); 
                            setFilterMonth('All'); 
                            setFilterDepartment('All'); 
                            setFilterOverdue(false); 
                            setFilterNotUpdatedThisWeek(false);
                            setFilterPersonal(false);
                            setFilterPendingProposal(false);
                            setFilterTaskType('All');
                        }}
                        className="text-[10px] text-slate-500 hover:text-red-500 dark:hover:text-red-400 px-1.5 py-1 rounded-lg hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-colors font-bold whitespace-nowrap"
                    >
                        Xóa lọc
                    </button>
                )}
            </div>

            {/* Phải: View toggle + Tạo công việc */}
            <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-700 dark:text-slate-200' : 'text-slate-450 hover:text-slate-650 dark:hover:text-slate-300'}`}
                    >
                        <ListTodo className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => setViewMode('board')}
                        className={`p-1 rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-700 dark:text-slate-200' : 'text-slate-450 hover:text-slate-650 dark:hover:text-slate-305'}`}
                    >
                        <LayoutGrid className="w-3 h-3" />
                    </button>
                </div>

                <PermissionGate resource="tasks" action="create">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-primary-600 hover:bg-primary-500 rounded-lg shadow-sm transition-all hover:-translate-y-[1px] whitespace-nowrap"
                    >
                        <Plus className="w-3 h-3" />
                        <span>Tạo công việc</span>
                    </button>
                </PermissionGate>
            </div>
        </div>
    );
};
