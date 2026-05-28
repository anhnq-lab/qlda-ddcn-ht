/**
 * useDepartmentData — Scoped data fetching for dashboard
 * 
 * Provides department-scoped queries for employees, tasks,
 * projects, monthly plans, and evaluation data.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { useProjects } from '../../../hooks/useProjects';
import { useTasks } from '../../../hooks/useTasks';
import { supabase } from '../../../lib/supabase';
import { TaskStatus } from '../../../types';
import type { DashboardConfig } from './useDashboardConfig';
import { DashboardService } from '../../../services/DashboardService';

const STALE_5M = 5 * 60 * 1000;

export function useDepartmentData(config: DashboardConfig) {
    const { currentUser } = useAuth();
    const { projects } = useProjects();
    const { data: allTasks } = useTasks();
    const tasks = allTasks || [];

    // ── Department dashboard scoped data (via RPC) ──
    const { data: deptDashboardData } = useQuery({
        queryKey: ['dept-dashboard-data', config.departmentCode, currentUser?.EmployeeID],
        queryFn: async () => {
            if (!config.departmentCode || !currentUser?.EmployeeID) {
                return { dept_employees: [], monthly_plan_items: [], dept_member_ids: [] };
            }
            return DashboardService.getDepartmentDashboardData(config.departmentCode, currentUser.EmployeeID);
        },
        enabled: !!config.departmentCode && !!currentUser?.EmployeeID,
        staleTime: STALE_5M,
    });

    const deptEmployees = deptDashboardData?.dept_employees || [];
    const deptMemberIds = deptDashboardData?.dept_member_ids || [];

    // ── My Projects (scoped) ──
    const myProjects = useMemo(() => {
        if (!currentUser) return [];
        if (config.isGlobalScope) return projects;

        return projects.filter(p =>
            p.Members?.includes(currentUser.EmployeeID)
        );
    }, [currentUser, projects, config.isGlobalScope]);

    // ── Department projects (for managers) ──
    const deptProjects = useMemo(() => {
        if (config.tier === 'staff') return myProjects;
        if (config.isGlobalScope) return projects;

        // Determine ManagementBoard ID based on department code
        const code = config.departmentCode?.toUpperCase() || '';
        let boardId: number | null = null;
        if (code === 'QLDA1') boardId = 1;
        else if (code === 'QLDA2') boardId = 2;
        else if (code === 'QLDA3') boardId = 3;
        else if (code === 'PTDV') boardId = 4;

        if (boardId !== null) {
            // For QLDA/PTDV managers: Show projects managed by this board, 
            // PLUS projects explicitly assigned to any department member (fallback)
            return projects.filter(p => 
                p.ManagementBoard === boardId || 
                p.Members?.some((m: string) => deptMemberIds.includes(m))
            );
        }

        // Projects where any dept member is assigned
        return projects.filter(p =>
            p.Members?.some((m: string) => deptMemberIds.includes(m))
        );
    }, [projects, deptMemberIds, config.tier, config.isGlobalScope, myProjects, config.departmentCode]);

    // ── My Tasks ──
    const myTasks = useMemo(() => {
        if (!currentUser) return [];
        return tasks.filter(t => t.AssigneeID === currentUser.EmployeeID);
    }, [currentUser, tasks]);

    // ── Department Tasks (for managers) ──
    const deptTasks = useMemo(() => {
        if (config.tier === 'staff') return myTasks;
        return tasks.filter(t => deptMemberIds.includes(t.AssigneeID));
    }, [tasks, deptMemberIds, config.tier, myTasks]);

    // ── Dashboard Stats (via RPC) ──
    const { data: dashboardStats } = useQuery({
        queryKey: ['dashboard_stats', currentUser?.EmployeeID, config.departmentName, config.systemRole],
        queryFn: async () => {
            if (!currentUser) return null;
            const { data } = await (supabase as any).rpc('get_user_dashboard_stats', {
                p_employee_id: currentUser.EmployeeID,
                p_department: config.departmentName,
                p_role: config.systemRole
            });
            return data;
        },
        enabled: !!currentUser,
        staleTime: STALE_5M,
    });

    // ── Task Stats (Unified via RPC) ──
    const unifiedTaskStats = useMemo(() => {
        if (!dashboardStats) {
            return { inProgress: 0, todo: 0, done: 0, overdue: 0, total: 0 };
        }
        
        const stats = dashboardStats as any;
        const inProgress = stats.in_progress_tasks || 0;
        const done = stats.done_tasks || 0;
        const total = stats.total_tasks || 0;
        const overdue = stats.overdue_tasks || 0;
        // Approximation for todo (total - in_progress - done)
        const todo = Math.max(0, total - inProgress - done);

        return { inProgress, todo, done, overdue, total };
    }, [dashboardStats]);

    const myTaskStats = unifiedTaskStats;
    
    const deptTaskStats = useMemo(() => {
        if (config.tier === 'staff') return unifiedTaskStats;
        const inProgress = deptTasks.filter(t => t.Status === TaskStatus.InProgress).length;
        const done = deptTasks.filter(t => t.Status === TaskStatus.Done).length;
        const overdue = deptTasks.filter(t => {
            if (t.Status === TaskStatus.Done) return false;
            if (!t.DueDate) return false;
            return new Date(t.DueDate) < new Date();
        }).length;
        const total = deptTasks.length;
        const todo = Math.max(0, total - inProgress - done);

        return { inProgress, todo, done, overdue, total };
    }, [deptTasks, config.tier, unifiedTaskStats]);

    // ── Monthly Plan Progress ──
    const { currentMonth, currentYear } = useMemo(() => {
        const now = new Date();
        return {
            currentMonth: now.getMonth() + 1,
            currentYear: now.getFullYear()
        };
    }, []);

    const monthlyPlanItems = deptDashboardData?.monthly_plan_items || [];

    // ── My Monthly Plan Items (for staff tier) ──
    const myMonthlyItems = useMemo(() => {
        if (!currentUser) return monthlyPlanItems;
        if (config.tier === 'staff') {
            return monthlyPlanItems.filter(
                (item: any) => item.staff_id === currentUser.EmployeeID
            );
        }
        return monthlyPlanItems;
    }, [monthlyPlanItems, currentUser, config.tier]);

    // ── Monthly Plan Stats ──
    const monthlyPlanStats = useMemo(() => {
        const items = config.tier === 'staff' ? myMonthlyItems : monthlyPlanItems;
        const total = items.length;
        const completed = items.filter((i: any) => i.status === 'completed').length;
        const incomplete = items.filter((i: any) => i.status === 'incomplete').length;
        const planned = items.filter((i: any) => i.status === 'planned').length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, incomplete, planned, rate };
    }, [monthlyPlanItems, myMonthlyItems, config.tier]);

    // ── Upcoming Deadlines (7 days) ──
    const upcomingDeadlines = useMemo(() => {
        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const taskSource = config.tier === 'staff' ? myTasks : deptTasks;

        const projectNameMap: Record<string, string> = {};
        projects.forEach(p => { projectNameMap[p.ProjectID] = p.ProjectName; });

        const employeeMap: Record<string, { name: string, avatar?: string }> = {};
        deptEmployees.forEach(e => {
            employeeMap[e.employee_id] = { name: e.full_name, avatar: e.avatar_url || undefined };
        });

        return taskSource
            .filter(t => {
                const due = new Date(t.DueDate);
                return t.Status !== TaskStatus.Done && due >= now && due <= next7Days;
            })
            .sort((a, b) => new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime())
            .slice(0, 6)
            .map(t => ({
                ...t,
                _projectName: projectNameMap[t.ProjectID] || t.ProjectID,
                AssigneeName: employeeMap[t.AssigneeID]?.name || '',
                AssigneeAvatar: employeeMap[t.AssigneeID]?.avatar || '',
            }));
    }, [myTasks, deptTasks, config.tier, projects, deptEmployees]);

    return {
        // Employees
        deptEmployees,
        deptMemberIds,
        // Projects
        myProjects,
        deptProjects,
        // Tasks
        myTasks,
        deptTasks,
        myTaskStats,
        deptTaskStats,
        // Monthly Plan
        monthlyPlanItems,
        myMonthlyItems,
        monthlyPlanStats,
        // Deadlines
        upcomingDeadlines,
        // Helpers
        allProjects: projects,
    };
}
