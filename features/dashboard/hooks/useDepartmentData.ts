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

const STALE_5M = 5 * 60 * 1000;

export function useDepartmentData(config: DashboardConfig) {
    const { currentUser } = useAuth();
    const { projects } = useProjects();
    const { data: allTasks } = useTasks();
    const tasks = allTasks || [];

    // ── Department employees ──
    const { data: deptEmployees = [] } = useQuery({
        queryKey: ['dept-employees', config.departmentName],
        queryFn: async () => {
            if (!config.departmentName) return [];
            const { data } = await supabase
                .from('employees')
                .select('employee_id, full_name, position, role, avatar_url, status')
                .eq('department', config.departmentName)
                .eq('status', 1)
                .order('position');
            return data || [];
        },
        enabled: !!config.departmentName && config.tier !== 'staff',
        staleTime: STALE_5M,
    });

    // ── Department member IDs ──
    const deptMemberIds = useMemo(() =>
        deptEmployees.map((e: any) => e.employee_id),
        [deptEmployees]
    );

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

        // Projects where any dept member is assigned
        return projects.filter(p =>
            p.Members?.some((m: string) => deptMemberIds.includes(m))
        );
    }, [projects, deptMemberIds, config.tier, config.isGlobalScope, myProjects]);

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

    // ── Task Stats (personal) ──
    const myTaskStats = useMemo(() => {
        const inProgress = myTasks.filter(t => t.Status === TaskStatus.InProgress).length;
        const todo = myTasks.filter(t => t.Status === TaskStatus.Todo).length;
        const done = myTasks.filter(t => t.Status === TaskStatus.Done).length;
        const overdue = myTasks.filter(t => {
            const due = new Date(t.DueDate);
            return t.Status !== TaskStatus.Done && due < new Date();
        }).length;
        return { inProgress, todo, done, overdue, total: myTasks.length };
    }, [myTasks]);

    // ── Task Stats (department — for managers) ──
    const deptTaskStats = useMemo(() => {
        const inProgress = deptTasks.filter(t => t.Status === TaskStatus.InProgress).length;
        const todo = deptTasks.filter(t => t.Status === TaskStatus.Todo).length;
        const done = deptTasks.filter(t => t.Status === TaskStatus.Done).length;
        const overdue = deptTasks.filter(t => {
            const due = new Date(t.DueDate);
            return t.Status !== TaskStatus.Done && due < new Date();
        }).length;
        return { inProgress, todo, done, overdue, total: deptTasks.length };
    }, [deptTasks]);

    // ── Monthly Plan Progress ──
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const { data: monthlyPlanItems = [] } = useQuery({
        queryKey: ['dashboard-monthly-plan', config.departmentCode, currentMonth, currentYear],
        queryFn: async () => {
            if (!config.departmentCode) return [];
            // Get monthly plan for this department
            const { data: plan } = await supabase
                .from('monthly_plans')
                .select('id')
                .eq('department_code', config.departmentCode)
                .eq('plan_month', currentMonth)
                .eq('plan_year', currentYear)
                .single();

            if (!plan) return [];

            const { data: items } = await supabase
                .from('monthly_plan_items')
                .select('id, task_name, status, staff_id, staff_name, due_date')
                .eq('monthly_plan_id', plan.id)
                .order('sort_order');

            return items || [];
        },
        enabled: !!config.departmentCode,
        staleTime: STALE_5M,
    });

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
            }));
    }, [myTasks, deptTasks, config.tier, projects]);

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
