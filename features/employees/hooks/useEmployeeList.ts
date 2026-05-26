import { useState, useMemo, useCallback } from 'react';
import React from 'react';
import { useTabSearchParam } from '../../../hooks/useTabSearchParam';
import { useEmployees, useDepartments, useDeleteEmployee, useEmployeeStats } from '../../../hooks/useEmployees';
import { useTasks } from '../../../hooks/useTasks';
import { useProjects } from '../../../hooks/useProjects';
import { Employee, EmployeeStatus, Role, TaskStatus } from '../../../types';
import { UserPlus, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSlidePanel } from '../../../context/SlidePanelContext';
import { useToast } from '../../../components/ui/Toast';
import EmployeeSlideContent from '../EmployeeSlideContent';
import EmployeeFormPanel from '../EmployeeFormPanel';

export type WorkloadData = {
    taskCount: number;
    activeTaskCount: number;
    projectCount: number;
};

export type EmployeeStats = {
    total: number;
    active: number;
    male: number;
    female: number;
    byDepartment: Record<string, number>;
    byRole: Record<Role, number>;
};

export function useEmployeeList() {
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    // ── Permissions ──
    const canManageUsers = currentUser?.Role === Role.Admin;
    const canEdit = useCallback(
        (targetId: string) => canManageUsers || currentUser?.EmployeeID === targetId,
        [canManageUsers, currentUser?.EmployeeID]
    );

    // ── Filter state ──
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [filterRole, setFilterRole] = useState('All');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const [activeTab, setActiveTab] = useTabSearchParam<'list' | 'org-chart' | 'evaluation' | 'annual-evaluation' | 'regulation-scoring'>(
        'list',
        ['list', 'org-chart', 'evaluation', 'annual-evaluation', 'regulation-scoring'] as const,
        'tab'
    );

    // ── Data fetching ──
    const { data: employees = [], isLoading } = useEmployees();
    const { data: departments = [] } = useDepartments();
    const { data: stats } = useEmployeeStats();
    const { data: tasks = [] } = useTasks();
    const { projects = [] } = useProjects();

    // ── Mutations ──
    const deleteMutation = useDeleteEmployee();

    // ── Panel ──
    const { openPanel, closePanel } = useSlidePanel();

    // ── CRUD handlers ──
    const handleCreate = () => {
        openPanel({
            title: 'Thêm nhân sự mới',
            icon: React.createElement(UserPlus, { className: 'w-4 h-4' }),
            url: '/employees/new',
            component: React.createElement(EmployeeFormPanel, { editMode: 'create' }),
        });
    };

    const handleEdit = useCallback(
        (emp: Employee) => {
            openPanel({
                title: 'Chỉnh sửa thông tin',
                icon: React.createElement(User, { className: 'w-4 h-4' }),
                url: `/employees/edit/${emp.EmployeeID}`,
                component: React.createElement(EmployeeFormPanel, {
                    editMode: 'edit',
                    employeeId: emp.EmployeeID,
                    initialData: {
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
                    },
                }),
            });
        },
        [openPanel]
    );

    const handleDelete = useCallback(
        async (id: string) => {
            if (
                window.confirm(
                    'Bạn có chắc chắn muốn xóa nhân sự này? Thao tác này không thể hoàn tác.'
                )
            ) {
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
        },
        [deleteMutation, showToast]
    );

    const openEmployeePanel = useCallback(
        (emp: Employee) => {
            const empId = emp.EmployeeID;
            openPanel({
                title: emp.FullName,
                icon: React.createElement(User, { className: 'w-4 h-4' }),
                url: `/employees/${empId}`,
                component: React.createElement(EmployeeSlideContent, {
                    employeeId: empId,
                    onEdit: canEdit(empId)
                        ? (id: string) => {
                              const found = employees.find((e) => e.EmployeeID === id);
                              if (found) handleEdit(found);
                          }
                        : undefined,
                    onDelete: canManageUsers
                        ? async (id: string) => {
                              const deleted = await handleDelete(id);
                              if (deleted) closePanel(`/employees/${id}`);
                          }
                        : undefined,
                }),
            });
        },
        [openPanel, closePanel, employees, canManageUsers, canEdit, handleEdit, handleDelete]
    );

    // ── Derived data ──
    const employeeWorkload = useMemo(() => {
        const workloadMap: Record<string, WorkloadData> = {};
        employees.forEach((emp) => {
            const empTasks = tasks.filter((t) => t.AssigneeID === emp.EmployeeID);
            const empActiveTasks = empTasks.filter((t) => t.Status !== TaskStatus.Done);
            const taskProjectIds = new Set(empTasks.map((t) => t.ProjectID));
            const memberProjectIds = new Set(
                projects
                    .filter((p) => p.Members?.includes(emp.EmployeeID))
                    .map((p) => p.ProjectID)
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
        const result = employees.filter((emp) => {
            // Ẩn tài khoản Quản trị viên khỏi danh sách Ban Giám đốc
            if (
                emp.Department === 'Ban Giám đốc' &&
                (emp.Position.toLowerCase().includes('quản trị') ||
                    emp.FullName.toLowerCase().includes('quản trị'))
            ) {
                return false;
            }

            const matchesSearch =
                emp.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            return 0;
        });

        return result;
    }, [employees, searchTerm, selectedDept, filterRole]);

    const hasActiveFilters = selectedDept !== 'All' || filterRole !== 'All' || searchTerm !== '';

    return {
        // state
        searchTerm,
        setSearchTerm,
        selectedDept,
        setSelectedDept,
        filterRole,
        setFilterRole,
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        // data
        employees,
        departments,
        stats: stats as EmployeeStats | undefined,
        isLoading,
        // derived
        employeeWorkload,
        filteredEmployees,
        hasActiveFilters,
        // permissions
        canManageUsers,
        canEdit,
        // handlers
        handleCreate,
        handleEdit,
        handleDelete,
        openEmployeePanel,
    };
}
