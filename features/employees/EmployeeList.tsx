import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployees, useDepartments, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useEmployeeStats } from '../../hooks/useEmployees';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { Employee, EmployeeStatus, Role, TaskStatus } from '../../types';
import {
    Search, Phone, Mail, UserPlus, Briefcase, Trash2, Edit, X, Save,
    Shield, User, LayoutGrid, List, Users, Building2, UserCheck,
    ArrowUpRight, ChevronDown, ListTodo, Eye, Calendar, Hash, Lock,
    Sparkles, ClipboardList, FolderOpen, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { useToast } from '../../components/ui/Toast';
import DataTable, { Column } from '../../components/ui/DataTable';
import { ViewToggle, SectionHeader, EmptyState } from '../../components/ui';
import EmployeeSlideContent from './EmployeeSlideContent';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeCreateSchema, EmployeeCreateInput } from '../../schemas/employee.schema';
import * as z from 'zod';

type EmployeeFormData = EmployeeCreateInput;

const OrgChartPage = lazy(() => import('../organization/OrgChartPage'));

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

const getRoleInfo = (role: Role) => {
    switch (role) {
        case Role.Admin: return { label: 'Q.Trị', color: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20', dot: 'bg-primary-500' };
        case Role.Manager: return { label: 'Q.Lý', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20', dot: 'bg-emerald-500' };
        default: return { label: 'N.Viên', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-1 ring-slate-500/20', dot: 'bg-slate-400' };
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
    const [activeTab, setActiveTab] = useState<'list' | 'org-chart'>('list');

    // Data Fetching
    const { data: employees = [], isLoading } = useEmployees();
    const { data: departments = [] } = useDepartments();
    const { data: stats } = useEmployeeStats();
    const { data: tasks = [] } = useTasks();
    const { projects = [] } = useProjects();

    // Mutations
    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();
    const deleteMutation = useDeleteEmployee();

    // Local state for UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
    const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

    // SlidePanel
    const { openPanel, closePanel } = useSlidePanel();

    const form = useForm<EmployeeFormData>({
        resolver: zodResolver(EmployeeCreateSchema) as any,
        defaultValues: {
            FullName: '',
            Department: departments[0] || 'Phòng Hành chính - Tổng hợp',
            Position: 'Chuyên viên',
            Email: '',
            Phone: '',
            Username: '',
            Password: '',
            Role: Role.Staff,
            Status: EmployeeStatus.Active,
            JoinDate: new Date().toISOString().split('T')[0]
        }
    });

    // ── CRUD Handlers ──
    const handleCreate = () => {
        setEditMode('create');
        setEditingEmployeeId(null);
        form.reset({
            FullName: '',
            Department: departments[0] || 'Phòng Hành chính - Tổng hợp',
            Position: 'Chuyên viên',
            Email: '',
            Phone: '',
            Username: '',
            Password: '',
            Role: Role.Staff,
            Status: EmployeeStatus.Active,
            JoinDate: new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleEdit = useCallback((emp: Employee) => {
        setEditMode('edit');
        setEditingEmployeeId(emp.EmployeeID);
        form.reset({
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
        });
        setIsModalOpen(true);
    }, [form]);

    const handleDelete = useCallback(async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
            await deleteMutation.mutateAsync(id);
            showToast('Đã xóa nhân sự thành công', 'success');
            return true;
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

    const filteredEmployees = useMemo(() => employees.filter(emp => {
        const matchesSearch = emp.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.EmployeeID.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDept === 'All' || emp.Department === selectedDept;
        const matchesRole = filterRole === 'All' || emp.Role === filterRole;
        return matchesSearch && matchesDept && matchesRole;
    }), [employees, searchTerm, selectedDept, filterRole]);

    const onSubmit = async (data: EmployeeFormData) => {
        try {
            if (editMode === 'create') {
                await createMutation.mutateAsync(data);
                showToast('Thêm nhân sự mới thành công!', 'success');
            } else {
                if (!editingEmployeeId) return;
                await updateMutation.mutateAsync({
                    id: editingEmployeeId,
                    data: data
                });
                showToast('Cập nhật thông tin thành công!', 'success');
            }
            setIsModalOpen(false);
        } catch (err: any) {
            console.error('[EmployeeSaveError]', err);
            showToast(`Lỗi: ${err.message || 'Vui lòng thử lại.'}`, 'error');
        }
    };

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
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{emp.Department}</p>
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
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20" title="Dự án tham gia">
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
            <div className="flex items-center gap-1 bg-[#FCF9F2] dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 w-fit">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'list'
                        ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-200/50 dark:shadow-primary-900/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-[#F5EFE6] dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Danh sách nhân sự
                </button>
                <button
                    onClick={() => setActiveTab('org-chart')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'org-chart'
                        ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-200/50 dark:shadow-primary-900/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-[#F5EFE6] dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <Briefcase className="w-4 h-4" />
                    Sơ đồ tổ chức
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
            ) : (
                <>

                    {/* ══════════ COMPACT STATS STRIP ══════════ */}
                    <div className="flex items-center gap-1 flex-wrap bg-[#FCF9F2] dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm px-2 py-1.5">
                        {/* Total */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50/60 dark:hover:bg-blue-500/10 transition-colors">
                            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{stats?.total || 0}</span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nhân sự</span>
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
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hoạt động</span>
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
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nam / Nữ</span>
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
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phòng ban</span>
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
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">QT.Viên</span>
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
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quản lý</span>
                            </div>
                        </button>
                    </div>

                    {/* ══════════ MAIN LAYOUT ══════════ */}
                    {/* EMPLOYEE LIST - Full width (no sidebar) */}
                    <div className="flex-1 space-y-4">

                        {/* ══════════ TOOLBAR ══════════ */}
                        <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
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
                            <div className="flex items-center justify-center h-64 bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                    <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {viewMode === 'list' ? (
                                    /* ══════════ TABLE VIEW — TaskList style ══════════ */
                                    <>
                                    <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-[#F5EFE6] dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest">
                                                    <th className="px-3 py-3 w-12 border-b border-slate-200 dark:border-slate-800 text-center">STT</th>
                                                    <th className="px-4 py-3 text-left min-w-[200px] border-b border-slate-200 dark:border-slate-800">Nhân viên</th>
                                                    <th className="px-4 py-3 text-left min-w-[160px] border-b border-slate-200 dark:border-slate-800">Chức vụ / Phòng ban</th>
                                                    <th className="px-4 py-3 text-left min-w-[180px] border-b border-slate-200 dark:border-slate-800">Liên hệ</th>
                                                    <th className="px-4 py-3 text-center w-28 border-b border-slate-200 dark:border-slate-800">KL.CV</th>
                                                    <th className="px-4 py-3 text-center w-24 border-b border-slate-200 dark:border-slate-800">Vai trò</th>
                                                    <th className="px-3 py-3 text-center w-12 border-b border-slate-200 dark:border-slate-800">TT</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                {filteredEmployees.map((emp, index) => {
                                                    const roleInfo = getRoleInfo(emp.Role);
                                                    const workload = employeeWorkload[emp.EmployeeID];
                                                    return (
                                                        <tr
                                                            key={emp.EmployeeID}
                                                            onClick={() => openEmployeePanel(emp)}
                                                            className="group cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-700"
                                                        >
                                                            {/* STT */}
                                                            <td className="px-3 py-3.5 text-center">
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{index + 1}</span>
                                                            </td>
                                                            {/* Nhân viên */}
                                                            <td className="px-4 py-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative">
                                                                        <img src={emp.AvatarUrl} alt={emp.FullName} className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-slate-700 shadow-sm object-cover" />
                                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${emp.Status === EmployeeStatus.Active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm group-hover:text-blue-600 transition-colors truncate">{emp.FullName}</p>
                                                                        <p className="text-[10px] text-slate-400 font-mono">{emp.EmployeeID}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            {/* Chức vụ */}
                                                            <td className="px-4 py-3.5">
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-slate-700 dark:text-slate-300 text-sm truncate">{emp.Position}</p>
                                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{emp.Department}</p>
                                                                </div>
                                                            </td>
                                                            {/* Liên hệ */}
                                                            <td className="px-4 py-3.5">
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
                                                            </td>
                                                            {/* KL.CV */}
                                                            <td className="px-4 py-3.5">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20" title="Công việc đang thực hiện">
                                                                        <ClipboardList className="w-3 h-3" />
                                                                        {workload?.activeTaskCount || 0}
                                                                    </span>
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20" title="Dự án tham gia">
                                                                        <FolderOpen className="w-3 h-3" />
                                                                        {workload?.projectCount || 0}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            {/* Vai trò */}
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${roleInfo.color}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dot}`} />
                                                                    {roleInfo.label}
                                                                </span>
                                                            </td>
                                                            {/* TT */}
                                                            <td className="px-3 py-3.5 text-center">
                                                                <div
                                                                    className={`w-2.5 h-2.5 rounded-full mx-auto ring-2 ${emp.Status === EmployeeStatus.Active
                                                                        ? 'bg-emerald-500 ring-emerald-200'
                                                                        : 'bg-slate-300 ring-slate-200'
                                                                    }`}
                                                                    title={emp.Status === EmployeeStatus.Active ? 'Đang hoạt động' : 'Đã nghỉ'}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer Counter */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-[#FCF9F2] dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Hiển thị <span className="font-bold text-slate-600 dark:text-slate-300">{filteredEmployees.length}</span> / {employees.length} nhân sự
                                        </span>
                                    </div>
                                    </>
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
                                                    className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
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
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                                                <FolderOpen className="w-3 h-3" /> {workload?.projectCount || 0} dự án
                                                            </span>
                                                        </div>

                                                        {/* Contact actions */}
                                                        <div className="flex gap-2 mt-4">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); }}
                                                                className="flex-1 py-2.5 bg-[#F5EFE6] dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                <Mail className="w-3 h-3" /> Email
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); }}
                                                                className="flex-1 py-2.5 bg-[#F5EFE6] dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
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
                                        icon={<Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-500" />}
                                        title="Không tìm thấy nhân sự nào."
                                        description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                                        className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {/* ══════════ MODAL — Create / Edit ══════════ */}
                    {
                        isModalOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl shadow-sm w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto ring-1 ring-black/5 dark:ring-slate-700">


                                    {/* Header */}
                                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 sticky top-0 z-10">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                                {editMode === 'create' ? 'Thêm nhân sự mới' : 'Cập nhật thông tin'}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {editMode === 'create' ? 'Điền đầy đủ thông tin để tạo tài khoản' : 'Chỉnh sửa thông tin nhân sự'}
                                            </p>
                                        </div>
                                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-5">

                                        {/* Section: Thông tin cơ bản */}
                                        <div>
                                            <SectionHeader title="Thông tin cơ bản" icon={<User className="w-3.5 h-3.5" />} size="xs" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Họ và tên *</label>
                                                    <input
                                                        {...form.register('FullName')}
                                                        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${form.formState.errors.FullName ? 'border-red-500 focus:ring-red-500/30 focus:border-red-400' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500/30 focus:border-blue-400'} rounded-xl focus:outline-none focus:ring-2 text-sm dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all`}
                                                        placeholder="Nguyễn Văn A"
                                                    />
                                                    {form.formState.errors.FullName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.FullName.message}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Phòng ban *</label>
                                                    <div className="relative">
                                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                        <select
                                                            disabled={!canManageUsers && editMode === 'edit'}
                                                            {...form.register('Department')}
                                                            className={`w-full pl-10 pr-8 py-3 bg-slate-50 dark:bg-slate-700 border ${form.formState.errors.Department ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all appearance-none`}
                                                        >
                                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                                    </div>
                                                    {form.formState.errors.Department && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Department.message}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Chức danh *</label>
                                                    <div className="relative">
                                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                        <input
                                                            disabled={!canManageUsers && editMode === 'edit'}
                                                            type="text"
                                                            {...form.register('Position')}
                                                            className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border ${form.formState.errors.Position ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                                                            placeholder="Trưởng phòng, Chuyên viên..."
                                                        />
                                                    </div>
                                                    {form.formState.errors.Position && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Position.message}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-slate-100 dark:border-slate-700" />

                                        {/* Section: Liên hệ */}
                                        <div>
                                            <SectionHeader title="Thông tin liên hệ" icon={<Mail className="w-3.5 h-3.5" />} size="xs" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Email *</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                        <input
                                                            type="email"
                                                            {...form.register('Email')}
                                                            className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border ${form.formState.errors.Email ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                                                            placeholder="email@example.com"
                                                        />
                                                    </div>
                                                    {form.formState.errors.Email && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Email.message}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Số điện thoại</label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                        <input
                                                            type="tel"
                                                            {...form.register('Phone')}
                                                            className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border ${form.formState.errors.Phone ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                                                            placeholder="0912345678"
                                                        />
                                                    </div>
                                                    {form.formState.errors.Phone && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Phone.message}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-slate-100 dark:border-slate-700" />

                                        {/* Section: Tài khoản & Quyền */}
                                        <div>
                                            <SectionHeader title="Tài khoản & Phân quyền" icon={<Lock className="w-3.5 h-3.5" />} size="xs" />
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tên đăng nhập</label>
                                                    <div className="relative">
                                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                        <input
                                                            type="text"
                                                            {...form.register('Username')}
                                                            className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border ${form.formState.errors.Username ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                                                            placeholder="username"
                                                        />
                                                    </div>
                                                    {form.formState.errors.Username && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Username.message}</p>}
                                                </div>
                                                {editMode === 'create' && (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Mật khẩu</label>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                            <input
                                                                type="password"
                                                                {...form.register('Password')}
                                                                className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border ${form.formState.errors.Password ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                                                                placeholder="••••••"
                                                            />
                                                        </div>
                                                        {form.formState.errors.Password && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Password.message}</p>}
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Vai trò *</label>
                                                    <div className="relative">
                                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                        <select
                                                            disabled={!canManageUsers}
                                                            {...form.register('Role')}
                                                            className={`w-full pl-10 pr-8 py-3 bg-slate-50 dark:bg-slate-700 border ${form.formState.errors.Role ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all appearance-none`}
                                                        >
                                                            <option value={Role.Staff}>Nhân viên</option>
                                                            <option value={Role.Manager}>Quản lý</option>
                                                            <option value={Role.Admin}>Quản trị viên</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                                    </div>
                                                    {form.formState.errors.Role && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Role.message}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-slate-100 dark:border-slate-700" />

                                        {/* Section: Thời gian & Trạng thái */}
                                        <div>
                                            <SectionHeader title="Thời gian & Trạng thái" icon={<Calendar className="w-3.5 h-3.5" />} size="xs" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Ngày vào làm</label>
                                                    <input
                                                        type="date"
                                                        {...form.register('JoinDate')}
                                                        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${form.formState.errors.JoinDate ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                                                    />
                                                    {form.formState.errors.JoinDate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.JoinDate.message}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Trạng thái</label>
                                                    <div className="relative">
                                                        <select
                                                            disabled={!canManageUsers}
                                                            {...form.register('Status', { valueAsNumber: true })}
                                                            className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${form.formState.errors.Status ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all appearance-none`}
                                                        >
                                                            <option value={EmployeeStatus.Active}>Đang làm việc</option>
                                                            <option value={EmployeeStatus.Inactive}>Đã nghỉ việc</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                                    </div>
                                                    {form.formState.errors.Status && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Status.message}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nội dung công việc & Tiêu chí */}
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Nội dung công việc</label>
                                                <textarea
                                                    {...form.register('JobContent')}
                                                    rows={3}
                                                    placeholder="Mô tả nội dung công việc..."
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tiêu chí đánh giá hoàn thành</label>
                                                <textarea
                                                    {...form.register('CompletionCriteria')}
                                                    rows={3}
                                                    placeholder="Tiêu chí đánh giá..."
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(false)}
                                                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                            >
                                                Hủy bỏ
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 rounded-xl shadow-sm shadow-primary-600/25 transition-all active:scale-[0.98] flex items-center gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                {editMode === 'create' ? 'Tạo nhân sự' : 'Lưu thay đổi'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )
                    }

                </>
            )}
        </div>
    );
};

export default EmployeeList;