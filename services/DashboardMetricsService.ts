import { supabase } from '../lib/supabase';

export interface DashboardOverviewMetrics {
    totalProjects: number;
    totalInvestment: number;
    yearlyPlanned: number;
    yearlyDisbursed: number;
    yearlyDisbursementRate: number;
    riskCount: number;
}

export interface DirectorDashboardData {
    overview_metrics: DashboardOverviewMetrics;
    capital_by_board: {
        name: string;
        planned: number;
        actual: number;
        rate: number;
        color: string;
    }[];
    task_completion: {
        done: number;
        inProgress: number;
        todo: number;
        overdue: number;
        total: number;
    };
    dept_kpis: {
        code: string;
        name: string;
        total: number;
        completed: number;
        rate: number;
    }[];
}

export interface DepartmentDashboardData {
    dept_employees: {
        employee_id: string;
        full_name: string;
        position: string;
        role: string;
        avatar_url: string | null;
        status: number;
    }[];
    monthly_plan_items: {
        id: string;
        task_name: string;
        status: 'completed' | 'partial' | 'incomplete' | 'planned';
        staff_id: string;
        staff_name: string;
        due_date: string;
    }[];
    dept_member_ids: string[];
}

export const DashboardMetricsService = {
    /** Get all aggregated data for the Director Dashboard using the RPC */
    getDirectorDashboardData: async (year: number, month: number): Promise<DirectorDashboardData> => {
        const { data, error } = await (supabase as any).rpc('get_director_dashboard_data', {
            p_year: year,
            p_month: month
        });
        if (error) {
            console.error("Error calling get_director_dashboard_data RPC:", error);
            throw error;
        }
        return data as unknown as DirectorDashboardData;
    },

    /** Get department scoped dashboard data using the RPC */
    getDepartmentDashboardData: async (deptCode: string, employeeId: string): Promise<DepartmentDashboardData> => {
        const { data, error } = await (supabase as any).rpc('get_department_dashboard', {
            p_dept_code: deptCode,
            p_employee_id: employeeId
        });
        if (error) {
            console.error("Error calling get_department_dashboard RPC:", error);
            throw error;
        }
        return data as unknown as DepartmentDashboardData;
    },

    /** Core overview metrics — year-aware (Fallback/legacy support) */
    getOverviewMetrics: async (year: number): Promise<DashboardOverviewMetrics> => {
        const today = new Date().toISOString();

        const [projectsCountRes, totalInvRes, capitalRes, disbursedRes, overdueTasksRes, issueRes] = await Promise.all([
            supabase.from('projects').select('*', { count: 'exact', head: true }),
            supabase.from('projects').select('total_investment'),
            supabase.from('capital_plans').select('project_id, amount, disbursed_amount').eq('year', year),
            supabase.from('disbursements').select('project_id, amount, date')
                .gte('date', `${year}-01-01`)
                .lte('date', `${year}-12-31`),
            (supabase as any).from('tasks').select('*', { count: 'exact', head: true })
                .neq('status', 'done').lt('due_date', today),
            supabase.from('package_issues').select('*', { count: 'exact', head: true })
                .eq('status', 'Open'),
        ]);

        const capitalData = capitalRes.data || [];
        const disbData = disbursedRes.data || [];

        const totalInvestment = (totalInvRes.data || []).reduce((acc, p) => acc + Number(p.total_investment), 0);
        const yearlyPlanned = capitalData.reduce((acc, p) => acc + Number(p.amount), 0);
        
        let yearlyDisbursed = 0;
        const projectIds = [...new Set([
            ...capitalData.map(p => p.project_id),
            ...disbData.map(d => d.project_id)
        ])];

        projectIds.forEach(pid => {
            const projectDisbs = disbData.filter(d => d.project_id === pid);
            if (projectDisbs.length > 0) {
                yearlyDisbursed += projectDisbs.reduce((s, d) => s + Number(d.amount), 0);
            } else {
                const projectPlans = capitalData.filter(p => p.project_id === pid);
                yearlyDisbursed += projectPlans.reduce((s, p) => s + Number(p.disbursed_amount || 0), 0);
            }
        });
        const yearlyDisbursementRate = yearlyPlanned > 0
            ? Math.round((yearlyDisbursed / yearlyPlanned) * 1000) / 10
            : 0;
        const riskCount = (overdueTasksRes.count || 0) + (issueRes.count || 0);

        return {
            totalProjects: projectsCountRes.count || 0,
            totalInvestment,
            yearlyPlanned,
            yearlyDisbursed,
            yearlyDisbursementRate,
            riskCount,
        };
    },

    /** Task Completion — count by status using RPC for server-side aggregation */
    getTaskCompletion: async (): Promise<{
        done: number;
        inProgress: number;
        todo: number;
        overdue: number;
        total: number;
    }> => {
        const { data, error } = await supabase.rpc('get_task_status_counts');

        if (error) {
            console.error("Error fetching task completion counts:", error);
            return { done: 0, inProgress: 0, todo: 0, overdue: 0, total: 0 };
        }

        const dataArr = Array.isArray(data) ? data : (data ? [data] : []);
        const counts = dataArr.length > 0 ? dataArr[0] : { done_count: 0, in_progress_count: 0, todo_count: 0, overdue_count: 0, total_count: 0 };

        return { 
            done: Number(counts.done_count) || 0, 
            inProgress: Number(counts.in_progress_count) || 0, 
            todo: Number(counts.todo_count) || 0, 
            overdue: Number(counts.overdue_count) || 0, 
            total: Number(counts.total_count) || 0 
        };
    },

    /** Risks — overdue tasks + open issues */
    getRisks: async () => {
        const risks: { id: string | number; type: string; msg: string; date: string; severity: 'high' | 'medium' | 'low' }[] = [];
        const today = new Date().toISOString();

        const [overdueTasks, issues] = await Promise.all([
            (supabase as any).from('tasks')
                .select('id, title, due_date, project_id')
                .neq('status', 'done').lt('due_date', today)
                .order('due_date', { ascending: true }).limit(5) as Promise<{ data: any[] | null }>,
            supabase.from('package_issues')
                .select('issue_id, title, reported_date, severity')
                .eq('status', 'Open')
                .order('reported_date', { ascending: false }).limit(5),
        ]);

        (overdueTasks.data || []).forEach(t => {
            const dueDate = new Date(t.due_date);
            const daysOverdue = Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            risks.push({
                id: t.id,
                type: 'overdue',
                msg: `Công việc "${t.title}" quá hạn ${daysOverdue} ngày`,
                date: dueDate.toLocaleDateString('vi-VN'),
                severity: daysOverdue > 14 ? 'high' : daysOverdue > 7 ? 'medium' : 'low',
            });
        });

        (issues.data || []).forEach(issue => {
            risks.push({
                id: issue.issue_id,
                type: 'issue',
                msg: `Vấn đề gói thầu: ${issue.title}`,
                date: new Date(issue.reported_date).toLocaleDateString('vi-VN'),
                severity: issue.severity === 'High' ? 'high' : issue.severity === 'Medium' ? 'medium' : 'low',
            });
        });

        return risks.slice(0, 8);
    },

    /** Material Mines */
    getMaterialMines: async (): Promise<any[]> => {
        try {
            const { data, error } = await supabase
                .from('material_mines')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) {
                console.error("Error fetching material mines:", error);
                return [];
            }
            return data || [];
        } catch (e) {
            console.error("Error in getMaterialMines:", e);
            return [];
        }
    }
};
