import React, { lazy, Suspense, useMemo } from 'react';
import {
    Search, UserPlus, Building2, Shield, X, ChevronDown,
    Users, Briefcase, ClipboardCheck, Sparkles,
} from 'lucide-react';
import { Role } from '../../types';
import DataTable from '../../components/ui/DataTable';
import { ViewToggle, EmptyState } from '../../components/ui';
import { useEmployeeList } from './hooks/useEmployeeList';
import EmployeeStatsBar from './components/EmployeeStatsBar';
import EmployeeGridView from './components/EmployeeGridView';
import { getEmployeeColumns } from './components/EmployeeColumns';

const OrgChartPage = lazy(() => import('../organization/OrgChartPage'));
const EvaluationPage = lazy(() => import('../evaluation/EvaluationPage'));
const AnnualEvaluationTab = lazy(() => import('../evaluation/components/AnnualEvaluationTab'));

const SuspenseFallback = () => (
    <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
);

const EmployeeList: React.FC = () => {
    const {
        selectedDept, setSelectedDept,
        filterRole, setFilterRole,
        viewMode, setViewMode,
        activeTab, setActiveTab,
        departments,
        stats,
        isLoading,
        employeeWorkload,
        filteredEmployees,
        hasActiveFilters,
        canManageUsers,
        handleCreate,
        openEmployeePanel,
    } = useEmployeeList();

    const columns = useMemo(
        () => getEmployeeColumns(employeeWorkload),
        [employeeWorkload]
    );

    const tabClass = (tab: string) =>
        `flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab
            ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-200/50 dark:shadow-primary-900/30'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
        }`;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ══════════ TAB NAVIGATION ══════════ */}
            <div className="flex items-center gap-1 bg-bg-surface p-1.5 rounded-2xl shadow-sm border border-border w-fit">
                <button onClick={() => setActiveTab('list')} className={tabClass('list')}>
                    <Users className="w-4 h-4" />
                    Danh sách nhân sự
                </button>
                <button onClick={() => setActiveTab('org-chart')} className={tabClass('org-chart')}>
                    <Briefcase className="w-4 h-4" />
                    Sơ đồ tổ chức
                </button>
                <button onClick={() => setActiveTab('evaluation')} className={tabClass('evaluation')}>
                    <ClipboardCheck className="w-4 h-4" />
                    Đánh giá xếp loại
                </button>
                <button onClick={() => setActiveTab('annual-evaluation')} className={tabClass('annual-evaluation')}>
                    <Sparkles className="w-4 h-4" />
                    Đánh giá cuối năm
                </button>
            </div>

            {activeTab === 'org-chart' ? (
                <Suspense fallback={<SuspenseFallback />}>
                    <OrgChartPage />
                </Suspense>
            ) : activeTab === 'evaluation' ? (
                <Suspense fallback={<SuspenseFallback />}>
                    <div className="-mt-6">
                        <EvaluationPage />
                    </div>
                </Suspense>
            ) : activeTab === 'annual-evaluation' ? (
                <Suspense fallback={<SuspenseFallback />}>
                    <div className="-mt-6">
                        <AnnualEvaluationTab />
                    </div>
                </Suspense>
            ) : (
                <>
                    {/* ══════════ STATS STRIP ══════════ */}
                    <EmployeeStatsBar
                        stats={stats}
                        departments={departments}
                        filterRole={filterRole}
                        setFilterRole={setFilterRole}
                    />

                    {/* ══════════ MAIN LAYOUT ══════════ */}
                    <div className="flex-1 space-y-4">

                        {/* ══════════ TOOLBAR ══════════ */}
                        <div className="bg-bg-surface rounded-2xl border border-border shadow-sm">
                            <div className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                {/* Left: Filters (Search removed) */}
                                <div className="flex items-center gap-3 flex-wrap flex-1 w-full lg:w-auto">
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                        <select
                                            value={selectedDept}
                                            onChange={(e) => setSelectedDept(e.target.value)}
                                            className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 appearance-none cursor-pointer transition-all"
                                        >
                                            <option value="All">Tất cả đơn vị</option>
                                            {departments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                    </div>

                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                        <select
                                            value={filterRole}
                                            onChange={(e) => setFilterRole(e.target.value)}
                                            className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 appearance-none cursor-pointer transition-all"
                                        >
                                            <option value="All">Tất cả vai trò</option>
                                            <option value={Role.Admin}>Quản trị viên</option>
                                            <option value={Role.Manager}>Quản lý</option>
                                            <option value={Role.Staff}>Nhân viên</option>
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                    </div>

                                    {hasActiveFilters && (
                                        <button
                                            onClick={() => { setSelectedDept('All'); setFilterRole('All'); }}
                                            className="text-xs text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            Xóa bộ lọc
                                        </button>
                                    )}
                                </div>

                                {/* Right: View toggle + Create */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <ViewToggle value={viewMode} onChange={setViewMode} />
                                    {canManageUsers && (
                                        <button
                                            onClick={handleCreate}
                                            className="btn btn-primary"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            <span>Thêm nhân sự</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ══════════ CONTENT ══════════ */}
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64 bg-bg-surface rounded-2xl border border-border">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                    <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {viewMode === 'list' ? (
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <DataTable
                                            data={filteredEmployees}
                                            columns={columns}
                                            onRowClick={openEmployeePanel}
                                            keyExtractor={(row) => row.EmployeeID}
                                        />
                                    </div>
                                ) : (
                                    <EmployeeGridView
                                        employees={filteredEmployees}
                                        onView={openEmployeePanel}
                                        employeeWorkload={employeeWorkload}
                                    />
                                )}

                                {filteredEmployees.length === 0 && (
                                    <EmptyState
                                        icon={<Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-400" />}
                                        title="Không tìm thấy nhân sự nào."
                                        description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                                        className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
                                    />
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default EmployeeList;
