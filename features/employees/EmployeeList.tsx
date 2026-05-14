import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEmployees, useDepartments, useDeleteEmployee, useEmployeeStats } from '../../hooks/useEmployees';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { Employee, EmployeeStatus, Role, TaskStatus } from '../../types';
import {
    Search, Phone, Mail, UserPlus, Briefcase, Trash2, Edit, X, Save,
    Shield, User, LayoutGrid, List, Users, Building2, UserCheck,
    ArrowUpRight, ChevronDown, ListTodo, Eye, Calendar, Hash, Lock,
    Sparkles, ClipboardList, FolderOpen, TrendingUp, ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { useToast } from '../../components/ui/Toast';
import DataTable, { Column } from '../../components/ui/DataTable';
import { ViewToggle, SectionHeader, EmptyState } from '../../components/ui';
import EmployeeSlideContent from './EmployeeSlideContent';
import EmployeeFormPanel from './EmployeeFormPanel';
import { EmployeeCreateInput } from '../../schemas/employee.schema';

type EmployeeFormData = EmployeeCreateInput;

const OrgChartPage = lazy(() => import('../organization/OrgChartPage'));
const EvaluationPage = lazy(() => import('../evaluation/EvaluationPage'));

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

const getRoleInfo = (role: Role) => {
    switch (role) {
        case Role.Admin: return { label: 'Q.Trị', color: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20', dot: 'bg-primary-500' };
        case Role.Manager: return { label: 'Q.Lý', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20', dot: 'bg-emerald-500' };
        default: return { label: 'N.Viên', color: 'bg-slate- text-slate-600 dark:text-slate-400 ring-1 ring-slate-500/20', dot: 'bg-slate-400' };
    }
};

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════

const EmployeeList: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    // ── Permissions ──
    const canManageUsers = currentUser?.Role === Role.Admin;
    const canEdit = useCallback((targetId: string) => canManageUsers || currentUser?.EmployeeID === targetId, [canManageUsers, currentUser?.EmployeeID]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [filterRole, setFilterRole] = useState('All');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'list';
    const setActiveTab = (tab: string) => setSearchParams({ tab });

    // Data Fetching
    const { data: employees = [], isLoading } = useEmployees();
    const { data: departments = [] } = useDepartments();
    const { data: stats } = useEmployeeStats();
    const { data: tasks = [] } = useTasks();
    const { projects = [] } = useProjects();

    // Mutations
    const deleteMutation = useDeleteEmployee();

    // Local state for UI
    const { openPanel, closePanel } = useSlidePanel();

    // ── CRUD Handlers ──
    const handleCreate = () => {
        openPanel({
            title: 'Thêm nhân sự mới',
            icon: <UserPlus className="w-4 h-4" />,
            url: '/employees/new',
            component: <EmployeeFormPanel editMode="create" />
        });
    };

    const handleEdit = useCallback((emp: Employee) => {
        openPanel({
            title: 'Chỉnh sửa thông tin',
            icon: <User className="w-4 h-4" />,
            url: `/employees/edit/${emp.EmployeeID}`,
            component: <EmployeeFormPanel editMode="edit" employeeId={emp.EmployeeID} initialData={{
                FullName: emp.FullName || '',
                Department: emp.Department || '',
                Position: emp.Position || '',
                Email: emp.Email || '',
                Phone: emp.Phone || '',
                Role: emp.Role || Role.Staff,
                Status: emp.Status || EmployeeStatus.Active,
                JoinDate: emp.JoinDate || '',
                Username: emp.Username || '',
                Password: '',
                JobContent: (emp as any).JobContent || '',
                CompletionCriteria: (emp as any).CompletionCriteria || '',
            }} />
        });
    }, [openPanel]);

    const handleDelete = useCallback(async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa nhân sự này? Thao tác này không thể hoàn tác.')) {
            try {
                await deleteMutation.mutateAsync(id);
                showToast('Đã xóa nhân sự thành công', 'success');
                return true;
            } catch (err: any) {
                console.error('Delete employee error:', err);
                showToast(`Lỗi: ${err.message || 'Không thể xóa nhân sự.'}`, 'error');
                return false;
            }
        }
        return false;
    }, [deleteMutation, showToast]);

    const openEmployeePanel = useCallback((emp: Employee) => {
        const empId = emp.EmployeeID;
        openPanel({
            title: emp.FullName,
            icon: <User className="w-4 h-4" />,
            url: `/employees/${empId}`,
            component: (
                <EmployeeSlideContent
                    employeeId={empId}
                    onEdit={canEdit(empId) ? (id) => {
                        const found = employees.find(e => e.EmployeeID === id);
                        if (found) handleEdit(found);
                    } : undefined}
                    onDelete={canManageUsers ? async (id) => {
                        const deleted = await handleDelete(id);
                        if (deleted) closePanel(`/employees/${id}`);
                    } : undefined}
                />
            ),
        });
    }, [openPanel, closePanel, employees, canManageUsers, canEdit, handleEdit, handleDelete]);

    const employeeWorkload = useMemo(() => {
        const workloadMap: Record<string, { taskCount: number; activeTaskCount: number; projectCount: number }> = {};
        employees.forEach(emp => {
            const empTasks = tasks.filter(t => t.AssigneeID === emp.EmployeeID);
            const empActiveTasks = empTasks.filter(t => t.Status !== TaskStatus.Done);
            // Projects: either Member[] or via Task assignments
            const taskProjectIds = new Set(empTasks.map(t => t.ProjectID));
            const memberProjectIds = new Set(
                projects.filter(p => p.Members?.includes(emp.EmployeeID)).map(p => p.ProjectID)
            );
            const allProjectIds = new Set([...taskProjectIds, ...memberProjectIds]);

            workloadMap[emp.EmployeeID] = {
                taskCount: empTasks.length,
                activeTaskCount: empActiveTasks.length,
                projectCount: allProjectIds.size,
            };
        });
        return workloadMap;
    }, [employees, tasks, projects]);

    const filteredEmployees = useMemo(() => {
        const result = employees.filter(emp => {
            // Ẩn tài khoản Quản trị viên khỏi danh sách Ban Giám đốc
            if (emp.Department === 'Ban Giám đốc' && (emp.Position.toLowerCase().includes('quản trị') || emp.FullName.toLowerCase().includes('quản trị'))) {
                return false;
            }

            const matchesSearch = emp.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.EmployeeID.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = selectedDept === 'All' || emp.Department === selectedDept;
            const matchesRole = filterRole === 'All' || emp.Role === filterRole;
            return matchesSearch && matchesDept && matchesRole;
        });

        // Sắp xếp tùy chỉnh cho Ban Giám đốc
        const bgdOrder = ['Nguyễn Quang Linh', 'Trần Ngọc Bảo', 'Nguyễn Văn Nhân', 'Ngô Đức Quy'];
        result.sort((a, b) => {
            if (a.Department === 'Ban Giám đốc' && b.Department === 'Ban Giám đốc') {
                const indexA = bgdOrder.indexOf(a.FullName);
                const indexB = bgdOrder.indexOf(b.FullName);
                const valA = indexA === -1 ? 999 : indexA;
                const valB = indexB === -1 ? 999 : indexB;
                return valA - valB;
            }
            return 0; // Giữ nguyên thứ tự nếu không cùng thuộc Ban Giám đốc
        });

        return result;
    }, [employees, searchTerm, selectedDept, filterRole]);

    const hasActiveFilters = selectedDept !== 'All' || filterRole !== 'All' || searchTerm !== '';

    const columns: Column<Employee>[] = useMemo(() => [
        {
            key: 'stt',
            header: 'STT',
            width: '48px',
            align: 'center',
            render: (_: any, __: Employee, index: number) => (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{index + 1}</span>
            )
        },
        {
            key: 'FullName',
            header: 'Nhân viên',
            render: (_: any, emp: Employee) => (
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={emp.AvatarUrl} alt={emp.FullName} className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm object-cover" />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${emp.Status === EmployeeStatus.Active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm group-hover:text-blue-600 transition-colors truncate">{emp.FullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{emp.EmployeeID}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'Position',
            header: 'Chức vụ / Phòng ban',
            render: (_: any, emp: Employee) => (
                <div className="min-w-0">
                    <p className="font-medium text-slate-700 dark:text-slate-300 text-sm truncate">{emp.Position}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">{emp.Department}</p>
                </div>
            )
        },
        {
            key: 'Email',
            header: 'Liên hệ',
            render: (_: any, emp: Employee) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{emp.Email}</span>
                    </div>
                    {emp.Phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{emp.Phone}</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'workload',
            header: 'KL.CV',
            align: 'center',
            render: (_: any, emp: Employee) => {
                const workload = employeeWorkload[emp.EmployeeID];
                return (
                    <div className="flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20" title="Công việc đang thực hiện">
                            <ClipboardList className="w-3 h-3" />
                            {workload?.activeTaskCount || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-primary-500/10 text-primary-600 ring-1 ring-primary-500/20" title="Dự án tham gia">
                            <FolderOpen className="w-3 h-3" />
                            {workload?.projectCount || 0}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'Role',
            header: 'Vai trò',
            align: 'center',
            render: (_: any, emp: Employee) => {
                const roleInfo = getRoleInfo(emp.Role);
                return (
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md ${roleInfo.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dot}`} />
                        {roleInfo.label}
                    </span>
                );
            }
        },
        {
            key: 'Status',
            header: 'TT',
            align: 'center',
            width: '48px',
            render: (_: any, emp: Employee) => (
                <div
                    className={`w-2.5 h-2.5 rounded-full mx-auto ring-2 ${emp.Status === EmployeeStatus.Active
                        ? 'bg-emerald-500 ring-emerald-200'
                        : 'bg-slate-300 ring-slate-200'
                        }`}
                    title={emp.Status === EmployeeStatus.Active ? 'Đang hoạt động' : 'Đã nghỉ'}
                />
            )
        }
    ], [employeeWorkload]);

    // ═══════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════
    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ══════════ TAB NAVIGATION ══════════ */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 w-fit">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'list'
                        ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-200/50 dark:shadow-primary-900/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Danh sách nhân sự
                </button>
                <button
                    onClick={() => setActiveTab('org-chart')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'org-chart'
                        ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-200/50 dark:shadow-primary-900/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <Briefcase className="w-4 h-4" />
                    Sơ đồ tổ chức
                </button>
                <button
                    onClick={() => setActiveTab('evaluation')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'evaluation'
                        ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-200/50 dark:shadow-primary-900/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <ClipboardCheck className="w-4 h-4" />
                    Đánh giá xếp loại
                </button>
            </div>

            {activeTab === 'org-chart' ? (
                <Suspense fallback={
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                    </div>
                }>
                    <OrgChartPage />
                </Suspense>
            ) : activeTab === 'evaluation' ? (
                <Suspense fallback={
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                    </div>
                }>
                    <div className="-mt-6">
                        <EvaluationPage />
                    </div>
                </Suspense>
            ) : (
                <>

                    {/* ══════════ COMPACT STATS STRIP ══════════ */}
                    <div className="flex items-center gap-1 flex-wrap bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm px-2 py-1.5">
                        {/* Total */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50/60 dark:hover:bg-blue-500/10 transition-colors">
                            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{stats?.total || 0}</span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Nhân sự</span>
                            </div>
                        </div>

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                        {/* Active */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-emerald-50/60 dark:hover:bg-emerald-500/10 transition-colors">
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{stats?.active || 0}</span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Hoạt động</span>
                            </div>
                        </div>

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                        {/* Nam / Nữ */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-cyan-50/60 dark:hover:bg-cyan-500/10 transition-colors">
                            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10">
                                <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{stats?.male || 0}<span className="text-slate-300 dark:text-slate-600 mx-0.5">/</span>{stats?.female || 0}</span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Nam / Nữ</span>
                            </div>
                        </div>

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                        {/* Departments */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-50/60 dark:hover:bg-primary-500/10 transition-colors">
                            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-500/10">
                                <Building2 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{departments.length}</span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Phòng ban</span>
                            </div>
                        </div>

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                        {/* Admins - clickable filter */}
                        <button
                            onClick={() => setFilterRole(filterRole === Role.Admin ? 'All' : Role.Admin)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${filterRole === Role.Admin ? 'bg-violet-100 dark:bg-violet-500/20 ring-1 ring-violet-300 dark:ring-violet-500/30' : 'hover:bg-violet-50/60 dark:hover:bg-violet-500/10'}`}
                        >
                            <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10">
                                <Shield className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{stats?.byRole?.[Role.Admin] || 0}</span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">QT.Viên</span>
                            </div>
                        </button>

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                        {/* Managers - clickable filter */}
                        <button
                            onClick={() => setFilterRole(filterRole === Role.Manager ? 'All' : Role.Manager)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${filterRole === Role.Manager ? 'bg-rose-100 dark:bg-rose-500/20 ring-1 ring-rose-300 dark:ring-rose-500/30' : 'hover:bg-rose-50/60 dark:hover:bg-rose-500/10'}`}
                        >
                            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10">
                                <TrendingUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{stats?.byRole?.[Role.Manager] || 0}</span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Quản lý</span>
                            </div>
                        </button>
                    </div>

                    {/* ══════════ MAIN LAYOUT ══════════ */}
                    {/* EMPLOYEE LIST - Full width (no sidebar) */}
                    <div className="flex-1 space-y-4">

                        {/* ══════════ TOOLBAR ══════════ */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                {/* Left: Search + Filters */}
                                <div className="flex items-center gap-3 flex-wrap flex-1 w-full lg:w-auto">
                                    <div className="relative flex-1 min-w-[240px] max-w-[360px]">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm nhân sự..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                        />
                                        {searchTerm && (
                                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

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
                                            onClick={() => { setSearchTerm(''); setSelectedDept('All'); setFilterRole('All'); }}
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
                                            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98] hover:shadow-lg hover:-translate-y-0.5 hover:from-primary-500 hover:to-primary-500"
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
                            <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
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
                                    /* ══════════ GRID VIEW ══════════ */
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {filteredEmployees.map((emp) => {
                                            const roleInfo = getRoleInfo(emp.Role);
                                            const workload = employeeWorkload[emp.EmployeeID];
                                            return (
                                                <div
                                                    key={emp.EmployeeID}
                                                    onClick={() => openEmployeePanel(emp)}
                                                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                                                >
                                                    {/* Header gradient */}
                                                    <div className="h-20 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-b-[3px] border-primary-500 relative">
                                                        <div className="absolute inset-0 bg-black/10" />
                                                        <div className="absolute top-3 right-3">
                                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm text-white`}>
                                                                {roleInfo.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Avatar overlapping */}
                                                    <div className="px-5 -mt-10 relative z-10">
                                                        <div className="relative inline-block">
                                                            <img
                                                                src={emp.AvatarUrl}
                                                                alt={emp.FullName}
                                                                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-sm"
                                                            />
                                                            <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${emp.Status === EmployeeStatus.Active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                        </div>
                                                    </div>

                                                    {/* Info */}
                                                    <div className="px-5 pt-3 pb-5">
                                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{emp.FullName}</h3>
                                                        <p className="text-sm text-blue-600 font-medium">{emp.Position}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{emp.Department}</p>

                                                        {/* Workload Badges */}
                                                        <div className="flex items-center gap-2 mt-4">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400">
                                                                <ClipboardList className="w-3 h-3" /> {workload?.activeTaskCount || 0} công việc
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                                                                <FolderOpen className="w-3 h-3" /> {workload?.projectCount || 0} dự án
                                                            </span>
                                                        </div>

                                                        {/* Contact actions */}
                                                        <div className="flex gap-2 mt-4">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); }}
                                                                className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                <Mail className="w-3 h-3" /> Email
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); }}
                                                                className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                <Phone className="w-3 h-3" /> Gọi
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Empty State */}
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