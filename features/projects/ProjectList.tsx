import React, { useState, useCallback, useEffect, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualList } from '../../hooks/useVirtualList';
import { useScopedProjects } from '../../hooks/useScopedProjects';
import { useProjectsRealtime } from '../../hooks/useProjectsRealtime';
import { useInvalidateProjects } from '../../hooks/usePaginatedProjects';
import { ProjectGroup, MANAGEMENT_BOARDS, ProjectStatus, PROJECT_CURRENT_STATUS_CONFIG } from '../../types';
import { ProjectCard, STATUS_CONFIG } from './ProjectCard';
import { ProgressBar, DataTable, Column } from '../../components/ui';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { getGroupGradient } from '../../utils/projectCompliance';
import PermissionGate from '../../components/PermissionGate';
import { Plus, Filter, ChevronRight, ChevronLeft, Calendar, FileText, CheckCircle, BarChart3, Clock, AlertTriangle, Layers, Maximize2, Search, LayoutGrid, List as ListIcon, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { CreateProjectModal } from './components/CreateProjectModal';
import { SelectedMember } from '../../types';
import ProjectService from '../../services/ProjectService';
import { Project } from '../../types';
import { supabase } from '../../lib/supabase';

// ── PaginationBar — memo để tránh re-render không cần thiết khi filter/sort thay đổi ──
const PaginationBar = memo(({ page, totalPages, total, pageSize, onPageChange }: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (p: number) => void;
}) => {
    if (totalPages <= 1) return null;
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    return (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 mt-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Hiển thị {startItem}-{endItem} / {total} dự án
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Trang trước"
                >
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                        pageNum = i + 1;
                    } else if (page <= 4) {
                        pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                    } else {
                        pageNum = page - 3 + i;
                    }
                    return (
                        <button
                            key={pageNum}
                            onClick={() => onPageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                page === pageNum
                                    ? 'bg-primary-500 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            {pageNum}
                        </button>
                    );
                })}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Trang sau"
                >
                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
            </div>
        </div>
    );
});
PaginationBar.displayName = 'PaginationBar';

import { ProjectMemberService } from '../../services/ProjectMemberService';
import { useProjectFilters, STATUS_OPTIONS, CURRENT_STATUS_OPTIONS, GROUP_OPTIONS, SortOption } from './hooks/useProjectFilters';
import { useToast } from '../../components/ui/Toast';

const ProjectList: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { addToast } = useToast();

    // ── Real-time: auto-refresh when other users modify projects ──
    useProjectsRealtime();
    const invalidateProjects = useInvalidateProjects();

    // ── Filter Hook (debounce, URL sync, builds QueryParams) ──
    const {
        searchQuery, setSearchQuery,
        selectedStatus, setSelectedStatus,
        selectedCurrentStatus, setSelectedCurrentStatus,
        selectedGroup, setSelectedGroup,
        selectedBoard, setSelectedBoard,
        sortBy, setSortBy,
        page, setPage,
        viewMode, setViewMode,
        queryParams,
        clearFilters, hasActiveFilters,
    } = useProjectFilters();

    // ── Data Fetching with scope + server-side pagination ──
    const { 
        scopedProjects, total, totalPages, pageSize, isLoading, isFetching, refetch,
        statusCounts, currentStatusCounts, groupCounts, boardCounts, totalUnfiltered
    } = useScopedProjects(queryParams);

    // Create Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Responsive setup
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleCreateProject = () => {
        setIsModalOpen(true);
    };

    const handleSaveProject = async (data: Partial<Project> & { StartDate: Date }, members: SelectedMember[]) => {
        try {
            // 1. Create Project
            const newProject = await ProjectService.create(data);

            // 2. Save Project Members
            if (members.length > 0) {
                try {
                    await ProjectMemberService.saveMembers(newProject.ProjectID, members);
                } catch (memberError: any) {
                    console.error('Failed to save members:', memberError.message);
                    addToast({ title: 'Cảnh báo', message: 'Tạo dự án thành công nhưng lưu thành viên thất bại.', type: 'warning' });
                }
            }

            // 3. Notify and Navigate
            invalidateProjects();
            setIsModalOpen(false);
            addToast({ title: 'Thành công', message: `Đã tạo dự án "${newProject.ProjectName}"`, type: 'success' });
            navigate(`/projects/${newProject.ProjectID}`);
        } catch (error) {
            console.error('Error creating project:', error);
            const errObj = error as any;
            addToast({
                title: 'Lỗi tạo dự án',
                message: errObj?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.',
                type: 'error',
            });
        }
    };

    // Open project detail — full page navigation
    const handleOpenProject = useCallback((project: Project) => {
        navigate(`/projects/${project.ProjectID}`);
    }, [navigate]);




    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300 pb-20">
            <div className="flex flex-col lg:flex-row gap-4 items-start">
                {/* 2. SIDEBAR FILTER (Premium Style) */}
                <div className={`shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-full lg:w-72' : 'w-0 lg:w-10'}`}>
                    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-6 ${!isSidebarOpen ? 'hidden lg:flex lg:items-center lg:justify-center lg:py-4' : ''}`}>
                        {/* Collapsed state */}
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all"
                                title="Mở bộ lọc"
                            >
                                <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </button>
                        )}

                        {/* Expanded state */}
                        {isSidebarOpen && (
                            <>
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Bộ lọc dự án
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {hasActiveFilters && (
                                            <button onClick={clearFilters} className="text-xs text-red-500 dark:text-red-400 hover:underline">Xóa lọc</button>
                                        )}
                                        <button
                                            onClick={() => setIsSidebarOpen(false)}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-all hidden lg:block"
                                            title="Thu gọn bộ lọc"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 space-y-6">
                                    {/* Status Filter */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Giai đoạn</label>
                                        <div className="space-y-1">
                                            {STATUS_OPTIONS.map(opt => {
                                                const count = opt.val === 'all' ? totalUnfiltered : (statusCounts[Number(opt.val)] || 0);
                                                return (
                                                    <label
                                                        key={opt.val}
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${selectedStatus === opt.val
                                                            ? 'bg-primary-50 dark:bg-slate-700 ring-1 ring-primary-200 dark:ring-slate-600'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="status"
                                                            checked={selectedStatus === opt.val}
                                                            onChange={() => setSelectedStatus(opt.val)}
                                                            className="sr-only"
                                                        />
                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm" style={{ backgroundColor: opt.hex }}></span>
                                                        <span className={`text-sm flex-1 ${selectedStatus === opt.val ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>{opt.label}</span>
                                                        {count > 0 && (
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                                {count}
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 dark:bg-slate-700"></div>

                                    {/* Current Status Filter */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Trạng thái hiện tại</label>
                                        <div className="space-y-1">
                                            {CURRENT_STATUS_OPTIONS.map(opt => {
                                                const count = opt.val === 'all' ? totalUnfiltered : (currentStatusCounts[Number(opt.val)] || 0);
                                                return (
                                                    <label
                                                        key={opt.val}
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${selectedCurrentStatus === opt.val
                                                            ? 'bg-primary-50 dark:bg-slate-700 ring-1 ring-primary-200 dark:ring-slate-600'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="currentStatus"
                                                            checked={selectedCurrentStatus === opt.val}
                                                            onChange={() => setSelectedCurrentStatus(opt.val)}
                                                            className="sr-only"
                                                        />
                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm" style={{ backgroundColor: opt.hex }}></span>
                                                        <span className={`text-sm flex-1 ${selectedCurrentStatus === opt.val ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>{opt.label}</span>
                                                        {count > 0 && (
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                                {count}
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 dark:bg-slate-700"></div>

                                    {/* Group Filter */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Nhóm dự án</label>
                                        <div className="space-y-1">
                                            {GROUP_OPTIONS.map(g => {
                                                const count = g === 'all' ? totalUnfiltered : (groupCounts[g] || 0);
                                                return (
                                                    <button
                                                        key={g}
                                                        onClick={() => setSelectedGroup(g)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between items-center ${selectedGroup === g ? 'bg-primary-50 dark:bg-slate-700 text-primary-700 dark:text-primary-400 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        <span>{g === 'all' ? 'Tất cả nhóm' : `Nhóm ${g}`}</span>
                                                        {count > 0 && (
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                                {count}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 dark:bg-slate-700"></div>

                                    {/* Management Board Filter */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Ban QLDA</label>
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => setSelectedBoard('all')}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between items-center ${selectedBoard === 'all' ? 'bg-primary-50 dark:bg-slate-700 text-primary-700 dark:text-primary-400 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                            >
                                                <span>Tất cả ban</span>
                                                {totalUnfiltered > 0 && (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                        {totalUnfiltered}
                                                    </span>
                                                )}
                                            </button>
                                            {MANAGEMENT_BOARDS.map(board => {
                                                const count = boardCounts[board.value.toString()] || 0;
                                                return (
                                                    <button
                                                        key={board.value}
                                                        onClick={() => setSelectedBoard(board.value.toString())}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between items-center ${selectedBoard === board.value.toString() ? 'bg-primary-50 dark:bg-slate-700 text-primary-700 dark:text-primary-400 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: board.hex }}></span>
                                                            <span className="flex-1">{board.label}</span>
                                                        </div>
                                                        {count > 0 && (
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                                {count}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. MAIN LIST AREA */}
                <div className="flex-1 w-full space-y-4">
                    {/* Toolbar */}
                    <div className="bg-white dark:bg-slate-800 p-2 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm dự án, mã, chủ đầu tư..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-transparent border-none rounded-xl focus:ring-0 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                aria-label="Tìm kiếm dự án"
                            />
                        </div>

                        <div className="flex items-center gap-3 shrink-0 px-2 pb-2 md:pb-0">
                            {/* Result count */}
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap hidden sm:inline">
                                {total} dự án
                            </span>

                            <div className="h-8 w-px bg-slate-100 dark:bg-slate-700 hidden md:block"></div>

                            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 dark:bg-slate-600 shadow text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                                    aria-label="Hiển thị dạng lưới"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 dark:bg-slate-600 shadow text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                                    aria-label="Hiển thị dạng danh sách"
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-1.5">
                                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as SortOption)}
                                    className="text-xs font-semibold bg-transparent border-none outline-none text-slate-600 dark:text-slate-300 cursor-pointer pr-4"
                                    aria-label="Sắp xếp dự án"
                                >
                                    <option value="name">Tên A→Z</option>
                                    <option value="budget">Ngân sách ↓</option>
                                    <option value="progress">Tiến độ ↓</option>
                                    <option value="created">Mới nhất</option>
                                </select>
                            </div>

                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>

                            <PermissionGate resource="projects" action="create">
                                <button
                                    onClick={handleCreateProject}
                                    className="btn btn-primary shrink-0"
                                    title="Thêm mới dự án"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Thêm mới</span>
                                </button>
                            </PermissionGate>
                        </div>
                    </div>

                    {/* Pagination fetch indicator — thin bar shown during page/filter changes */}
                    {isFetching && !isLoading && (
                        <div className="h-0.5 w-full rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30">
                            <div className="h-full w-2/5 bg-primary-500 rounded-full animate-pulse" />
                        </div>
                    )}

                    {/* Content */}
                    <div className={`min-h-[400px] transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-white dark:bg-slate-800 h-72 rounded-2xl p-4 space-y-4 border border-slate-200 dark:border-slate-700">
                                        <Skeleton className="h-40 w-full rounded-xl" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : scopedProjects.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg width="60" height="60" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="60" cy="60" r="56" fill="currentColor" className="text-gray-50 dark:text-slate-700/50" />
                                        <rect x="30" y="35" width="60" height="45" rx="6" stroke="currentColor" strokeWidth="2" className="text-gray-300 dark:text-slate-600" fill="none" />
                                        <path d="M30 47h60" stroke="currentColor" strokeWidth="2" className="text-gray-300 dark:text-slate-600" />
                                        <circle cx="38" cy="41" r="2" fill="currentColor" className="text-gray-300 dark:text-slate-600" />
                                        <circle cx="45" cy="41" r="2" fill="currentColor" className="text-gray-300 dark:text-slate-600" />
                                        <circle cx="52" cy="41" r="2" fill="currentColor" className="text-gray-300 dark:text-slate-600" />
                                        <path d="M50 62l6 6 14-14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-slate-600" />
                                    </svg>
                                }
                                title={hasActiveFilters ? 'Không tìm thấy dự án phù hợp' : 'Chưa có dự án nào'}
                                description={hasActiveFilters
                                    ? 'Không có dự án nào phù hợp với bộ lọc hiện tại. Hãy thử thay đổi từ khóa hoặc bộ lọc.'
                                    : 'Hãy bắt đầu bằng việc tạo dự án đầu tiên.'}
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed"
                            >
                                {hasActiveFilters ? (
                                    <button
                                        onClick={clearFilters}
                                        className="text-primary-600 dark:text-primary-400 font-bold hover:underline text-sm"
                                    >
                                        Xóa tất cả bộ lọc
                                    </button>
                                ) : (
                                    <PermissionGate resource="projects" action="create">
                                        <button
                                            onClick={handleCreateProject}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-md active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Tạo dự án mới
                                        </button>
                                    </PermissionGate>
                                )}
                            </EmptyState>
                        ) : viewMode === 'list' ? (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
                                    <table className="w-full text-left text-sm">
                                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                                            <tr className="text-slate-500 dark:text-slate-400">
                                                <th className="px-3 py-3 text-center w-12 border-b border-slate-200 dark:border-slate-700">STT</th>
                                                <th className="px-4 py-3 min-w-[280px] border-b border-slate-200 dark:border-slate-700">Tên dự án</th>
                                                <th className="px-4 py-3 text-center w-20 border-b border-slate-200 dark:border-slate-700">Nhóm</th>
                                                <th className="px-4 py-3 text-center w-24 border-b border-slate-200 dark:border-slate-700">Ban QLDA</th>
                                                <th className="px-4 py-3 text-center w-36 border-b border-slate-200 dark:border-slate-700">Giai đoạn</th>
                                                <th className="px-4 py-3 text-right w-28 border-b border-slate-200 dark:border-slate-700">Tiến độ</th>
                                                <th className="px-4 py-3 text-right w-28 border-b border-slate-200 dark:border-slate-700">Giải ngân</th>
                                                <th className="px-4 py-3 text-right w-32 border-b border-slate-200 dark:border-slate-700">Tổng mức ĐT</th>
                                                <th className="px-4 py-3 min-w-[160px] border-b border-slate-200 dark:border-slate-700">Nguồn vốn</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                            {scopedProjects.map((project, index) => {
                                                const board = project.ManagementBoard ? MANAGEMENT_BOARDS.find(b => b.value === project.ManagementBoard) : null;
                                                const currentStatus = project.CurrentStatusCode ? PROJECT_CURRENT_STATUS_CONFIG[project.CurrentStatusCode] : null;
                                                const status = currentStatus || STATUS_CONFIG[project.Status] || { label: 'N/A', hex: '#9CA3AF' };
                                                
                                                return (
                                                    <tr
                                                        key={project.ProjectID}
                                                        className="group cursor-pointer transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-700/50"
                                                        onClick={() => handleOpenProject(project)}
                                                    >
                                                        {/* STT */}
                                                        <td className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                                                            {(page - 1) * pageSize + index + 1}
                                                        </td>
                                                        {/* Dự án */}
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col">
                                                                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                                                                    {project.ProjectName}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 rounded">
                                                                        #{(project.ProjectID || '').slice(-5)}
                                                                    </span>
                                                                    {project.LocationCode && (
                                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[220px]">
                                                                            {project.LocationCode}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {/* Nhóm */}
                                                        <td className="px-4 py-4 text-center">
                                                            <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full ${getGroupGradient(project.GroupCode)}`}>
                                                                Nhóm {project.GroupCode}
                                                            </span>
                                                        </td>
                                                        {/* Ban QLDA */}
                                                        <td className="px-4 py-4 text-center">
                                                            {board ? (
                                                                <span className="inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: board.hex }}>
                                                                    Ban {board.value}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 dark:text-slate-600">—</span>
                                                            )}
                                                        </td>
                                                        {/* Giai đoạn */}
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap" style={{ backgroundColor: status.hex }}>
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                        {/* Tiến độ */}
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">{project.Progress || 0}%</span>
                                                                <ProgressBar value={project.Progress || 0} color="blue" size="sm" className="w-16" />
                                                            </div>
                                                        </td>
                                                        {/* Giải ngân */}
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{project.PaymentProgress || 0}%</span>
                                                                <ProgressBar value={project.PaymentProgress || 0} color="emerald" size="sm" className="w-16" />
                                                            </div>
                                                        </td>
                                                        {/* Tổng mức ĐT */}
                                                        <td className="px-4 py-4 text-right">
                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tabular-nums whitespace-nowrap">
                                                                {formatCurrency(project.TotalInvestment)}
                                                            </span>
                                                        </td>
                                                        {/* Nguồn vốn */}
                                                        <td className="px-4 py-4">
                                                            <span className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                                                                {project.CapitalSource || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {scopedProjects.map(project => (
                                <ProjectCard
                                        key={project.ProjectID}
                                        project={project}
                                        onClick={handleOpenProject}
                                        layout="grid"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <PaginationBar
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={50}
                        onPageChange={setPage}
                    />
                </div>
            </div>

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProject}
            />
        </div>
    );
};

export default ProjectList;