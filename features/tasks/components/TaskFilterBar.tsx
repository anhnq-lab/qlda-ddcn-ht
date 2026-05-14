import React from 'react';
import { Search, FolderOpen, ChevronDown, Calendar, Layers, Filter, X, AlertTriangle, ListTodo, LayoutGrid, Plus, User, Tag } from 'lucide-react';
import PermissionGate from '../../../components/PermissionGate';
import { TaskStatus } from '../../../types';

interface TaskFilterBarProps {
    searchTerm: string;
    setSearchTerm: (v: string) => void;
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
    filterPersonal: boolean;
    setFilterPersonal: (v: boolean) => void;
    filterTaskType: string;
    setFilterTaskType: (v: string) => void;
    hasActiveFilters: boolean;
    projects: any[];
    departments: string[];
    viewMode: 'list' | 'board';
    setViewMode: (v: 'list' | 'board') => void;
    openCreateModal: () => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
    searchTerm, setSearchTerm,
    filterProject, setFilterProject,
    filterMonth, setFilterMonth,
    filterDepartment, setFilterDepartment,
    filterStatus, setFilterStatus,
    filterOverdue, setFilterOverdue,
    filterPersonal, setFilterPersonal,
    filterTaskType, setFilterTaskType,
    hasActiveFilters,
    projects, departments,
    viewMode, setViewMode,
    openCreateModal
}) => {
    return (
        <div className="toolbar">
            <div className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* Left: Search + Filters */}
                <div className="flex items-center gap-3 flex-wrap flex-1 w-full lg:w-auto">
                    {/* Cá nhân toggle button */}
                    <button
                        onClick={() => setFilterPersonal(!filterPersonal)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                            filterPersonal 
                            ? 'bg-primary-50 border-primary-200 text-primary-600 shadow-sm' 
                            : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 hover:text-slate-600'
                        }`}
                        title={filterPersonal ? "Đang hiện việc cá nhân" : "Hiện việc cá nhân"}
                    >
                        <User className={`w-4 h-4 ${filterPersonal ? 'text-primary-500' : ''}`} />
                        <span className="text-sm font-medium whitespace-nowrap">Việc của tôi</span>
                    </button>

                    <button
                        onClick={() => setFilterOverdue(!filterOverdue)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                            filterOverdue 
                            ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' 
                            : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 hover:text-slate-600'
                        }`}
                        title={filterOverdue ? "Đang hiện việc quá hạn" : "Hiện việc quá hạn"}
                    >
                        <AlertTriangle className={`w-4 h-4 ${filterOverdue ? 'text-rose-500' : ''}`} />
                        <span className="text-sm font-medium whitespace-nowrap">Quá hạn</span>
                    </button>

                    <div className="relative flex-1 min-w-[200px] max-w-[360px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm công việc..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="filter-input"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                        <select
                            value={filterProject}
                            onChange={(e) => setFilterProject(e.target.value)}
                            className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all max-w-[220px]"
                        >
                            <option value="All">Tất cả dự án</option>
                            {projects.map(p => (
                                <option key={p.ProjectID} value={p.ProjectID} title={p.ProjectName}>
                                    {p.ProjectName.length > 28 ? p.ProjectName.substring(0, 28) + '...' : p.ProjectName}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all min-w-[140px]"
                        >
                            <option value="All">Tất cả tháng</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <option key={month} value={month.toString()}>Tháng {month}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all min-w-[150px] max-w-[200px]"
                        >
                            <option value="All">Tất cả phòng ban</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                    </div>

                    {/* Loại công việc */}
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                        <select
                            value={filterTaskType}
                            onChange={(e) => setFilterTaskType(e.target.value)}
                            className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all"
                        >
                            <option value="All">Tất cả loại</option>
                            <option value="project">📁 Dự án</option>
                            <option value="management">📋 Điều hành</option>
                            <option value="internal">🏢 Nội bộ</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all"
                        >
                            <option value="All">Tất cả trạng thái</option>
                            <option value={TaskStatus.Todo}>Công việc mới</option>
                            <option value={TaskStatus.InProgress}>Đang thực hiện</option>
                            <option value={TaskStatus.Done}>Hoàn thành</option>
                            <option value={TaskStatus.Incomplete}>Chưa hoàn thành</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={() => { 
                                setSearchTerm(''); 
                                setFilterStatus('All'); 
                                setFilterProject('All'); 
                                setFilterMonth('All'); 
                                setFilterDepartment('All'); 
                                setFilterOverdue(false); 
                                setFilterPersonal(false);
                                setFilterTaskType('All');
                            }}
                            className="text-xs text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                    )}

                </div>

                {/* Right: View toggle + Create */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 dark:bg-slate-600 shadow-lg text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <ListTodo className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-800 dark:bg-slate-600 shadow-lg text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>

                    <PermissionGate resource="tasks" action="create">
                        <button
                            onClick={openCreateModal}
                            className="btn btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tạo công việc</span>
                        </button>
                    </PermissionGate>
                </div>
            </div>
        </div>
    );
};
