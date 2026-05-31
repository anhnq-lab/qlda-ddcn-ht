import React, { lazy, Suspense, useMemo } from 'react';
import {
    Search, UserPlus, Building2, Shield, X, ChevronDown,
    Users, Briefcase, ClipboardCheck, Sparkles, Award
} from 'lucide-react';
import { Role } from '../../types';
import DataTable from '../../components/ui/DataTable';
import { ViewToggle, EmptyState, FilterChip } from '../../components/ui';
import { useEmployeeList } from './hooks/useEmployeeList';
import EmployeeStatsBar from './components/EmployeeStatsBar';
import EmployeeGridView from './components/EmployeeGridView';
import { getEmployeeColumns } from './components/EmployeeColumns';

const OrgChartPage = lazy(() => import('../organization/OrgChartPage'));
const EvaluationPage = lazy(() => import('../evaluation/EvaluationPage'));
const AnnualEvaluationTab = lazy(() => import('../evaluation/components/AnnualEvaluationTab'));
const RegulationScoringTab = lazy(() => import('../regulation-scoring/RegulationScoringTab'));

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
        handleEdit,
        handleDelete,
        canEdit,
    } = useEmployeeList();

    const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
    const currentYear = useMemo(() => new Date().getFullYear(), []);

    const columns = useMemo(
        () => getEmployeeColumns(employeeWorkload, handleEdit, handleDelete, canEdit, canManageUsers),
        [employeeWorkload, handleEdit, handleDelete, canEdit, canManageUsers]
    );

    const tabClass = (tab: string) =>
        `flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab
            ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-200/50 dark:shadow-primary-900/30'
            : 'text-txt-muted hover:bg-bg-subtle dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
        }`;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ══════════ TAB NAVIGATION & FILTERS ══════════ */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-transparent pb-1">
                {/* Tabs */}
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
                    <button onClick={() => setActiveTab('regulation-scoring')} className={tabClass('regulation-scoring')}>
                        <Award className="w-4 h-4" />
                        Đánh giá Quy chế KHCV
                    </button>
                    <button onClick={() => setActiveTab('annual-evaluation')} className={tabClass('annual-evaluation')}>
                        <Sparkles className="w-4 h-4" />
                        Đánh giá cuối năm
                    </button>
                </div>

                {/* Bộ lọc Đơn vị & Vai trò chuyển lên đầu */}
                {activeTab === 'list' && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-full">
                        <FilterChip
                            label="Đơn vị"
                            value={selectedDept}
                            onChange={setSelectedDept}
                            allValue="All"
                            options={[
                                { value: 'All', label: 'Tất cả đơn vị' },
                                ...departments.map(dept => ({ value: dept, label: dept })),
                            ]}
                        />

                        <FilterChip
                            label="Vai trò"
                            value={filterRole}
                            onChange={setFilterRole}
                            allValue="All"
                            options={[
                                { value: 'All', label: 'Tất cả vai trò' },
                                { value: Role.Admin, label: 'Quản trị viên' },
                                { value: Role.Manager, label: 'Quản lý' },
                                { value: Role.Staff, label: 'Nhân viên' },
                            ]}
                        />

                        {hasActiveFilters && (
                            <button
                                onClick={() => { setSelectedDept('All'); setFilterRole('All'); }}
                                className="text-xs text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-bold"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                )}
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
            ) : activeTab === 'regulation-scoring' ? (
                <Suspense fallback={<SuspenseFallback />}>
                    <div className="-mt-6">
                        <RegulationScoringTab month={currentMonth} year={currentYear} />
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
                    {/* ══════════ MAIN LAYOUT ══════════ */}
                    <div className="flex-1 space-y-4">
                        
                        {/* ══════════ STATS STRIP & TOOLBAR (Gộp chung hàng) ══════════ */}
                        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 shrink-0 pb-1">
                            {/* Left: Các chỉ số nhân sự */}
                            <div className="flex-1 min-w-0">
                                <EmployeeStatsBar
                                    stats={stats}
                                    departments={departments}
                                    filterRole={filterRole}
                                    setFilterRole={setFilterRole}
                                />
                            </div>

                            {/* Right: View toggle + Create */}
                            <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                                <ViewToggle value={viewMode} onChange={setViewMode} />
                                {canManageUsers && (
                                    <button
                                        onClick={handleCreate}
                                        className="btn btn-primary cursor-pointer"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        <span>Thêm nhân sự</span>
                                    </button>
                                )}
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
                                            stickyHeader={true}
                                            maxHeight="calc(100vh - 260px)"
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
                                        className="bg-bg-surface rounded-2xl border border-dashed border-border"
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
