import { supabase } from '../lib/supabase';
import { ProjectStatus, MANAGEMENT_BOARDS } from '../types';
import { TaskCategory, TASK_CATEGORIES, TASK_CATEGORY_LABELS } from '../types/task.types';

export interface DashboardOverviewMetrics {
    totalProjects: number;
    totalInvestment: number;
    yearlyPlanned: number;
    yearlyDisbursed: number;
    yearlyDisbursementRate: number;
    riskCount: number;
}

export interface MonthlyBriefingStats {
    month: number;
    year: number;
    disbursedThisMonth: number;
    disbursedTarget: number;
    newProjectsStarted: number;
    projectsCompleted: number;
    docsApproved: number;
    keyAchievements: { id: string; content: string }[];
    roadblocks: { id: string; content: string; severity: 'high' | 'medium' | 'low' }[];
    upcomingPlans: { id: string; content: string }[];
}

export interface TaskBriefingItem {
    title: string;
    project_name?: string;
    assignee_name: string;
    completion_result?: string;
    incomplete_reason?: string;
    status: string;
    progress: number;
    notes?: string;
}

export interface TaskBriefingCategoryGroup {
    category: TaskCategory;
    category_label: string;
    total: number;
    completed: number;
    items: TaskBriefingItem[];
}

export interface TaskBriefingSummary {
    department_name: string;
    total_tasks: number;
    completed: number;
    in_progress: number;
    incomplete: number;
    completion_rate: number;
    by_category: TaskBriefingCategoryGroup[];
}

export interface DashboardProjectRow {
    projectId: string;
    projectName: string;
    managementBoard: number;
    boardLabel: string;
    status: number;
    statusLabel: string;
    currentStatusCode?: number;
    progress: number;
    totalInvestment: number;
    paymentProgress: number;
    startDate: string | null;
    expectedEndDate: string | null;
    locationCode?: string;
    coordinates?: { lat: number; lng: number };
    investorName?: string;
    mainContractorName?: string;
}

export const DashboardService = {
    /** Core overview metrics — year-aware */
    getOverviewMetrics: async (year: number): Promise<DashboardOverviewMetrics> => {
        const today = new Date().toISOString();

        const [projectsCountRes, totalInvRes, capitalRes, disbursedRes, overdueTasksRes, issueRes] = await Promise.all([
            // Count projects (no rows fetched)
            supabase.from('projects').select('*', { count: 'exact', head: true }),
            // Sum total_investment (only 1 column, minimal transfer)
            supabase.from('projects').select('total_investment'),
            supabase.from('capital_plans').select('project_id, amount, disbursed_amount').eq('year', year),
            supabase.from('disbursements').select('project_id, amount, date')
                .gte('date', `${year}-01-01`)
                .lte('date', `${year}-12-31`),
            (supabase as any).from('tasks').select('*', { count: 'exact', head: true })
                .neq('status', 'Done').lt('due_date', today),
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

    /** Project summary table — all projects with KPIs */
    getProjectSummary: async (): Promise<DashboardProjectRow[]> => {
        const { data: projects } = await supabase
            .from('projects')
            .select('project_id, project_name, management_board, status, current_status_code, progress, total_investment, payment_progress, start_date, expected_end_date, location_code, coordinates, investor_name, main_contractor_name')
            .order('management_board', { ascending: true });

        const statusLabels: Record<number, string> = {
            [ProjectStatus.Preparation]: 'Chuẩn bị ĐT',
            [ProjectStatus.Execution]: 'Thực hiện',
            [ProjectStatus.Completion]: 'Kết thúc XD',
        };

        return (projects || []).map(p => {
            const board = MANAGEMENT_BOARDS.find(b => b.value === p.management_board);
            return {
                projectId: p.project_id,
                projectName: p.project_name,
                managementBoard: p.management_board,
                boardLabel: board?.label || `Ban ${p.management_board}`,
                status: p.status,
                statusLabel: statusLabels[p.status as number] || 'Không rõ',
                currentStatusCode: p.current_status_code ?? undefined,
                progress: Number(p.progress) || 0,
                totalInvestment: Number(p.total_investment) || 0,
                paymentProgress: Number(p.payment_progress) || 0,
                startDate: p.start_date,
                expectedEndDate: p.expected_end_date,
                locationCode: p.location_code,
                coordinates: p.coordinates as any,
                investorName: p.investor_name,
                mainContractorName: p.main_contractor_name,
            } as DashboardProjectRow;
        });
    },

    /** Capital vs Disbursement — planned vs actual by board for a given year */
    getCapitalVsDisbursement: async (year?: number): Promise<{
        name: string;
        planned: number;
        actual: number;
        rate: number;
        color: string;
    }[]> => {
        const targetYear = year || new Date().getFullYear();

        const [plansRes, disbursedRes, projectsRes] = await Promise.all([
            supabase.from('capital_plans').select('project_id, amount, disbursed_amount').eq('year', targetYear),
            supabase.from('disbursements').select('project_id, amount')
                .gte('date', `${targetYear}-01-01`)
                .lte('date', `${targetYear}-12-31`),
            supabase.from('projects').select('project_id, management_board'),
        ]);

        return MANAGEMENT_BOARDS.map(board => {
            const boardProjectIds = (projectsRes.data || [])
                .filter(p => p.management_board === board.value)
                .map(p => p.project_id);

            const boardPlans = (plansRes.data || []).filter(p => boardProjectIds.includes(p.project_id));
            const boardDisbs = (disbursedRes.data || []).filter(d => boardProjectIds.includes(d.project_id));

            const planned = boardPlans.reduce((s, p) => s + Number(p.amount), 0);

            let actual = 0;
            boardProjectIds.forEach(pid => {
                const projectDisbs = boardDisbs.filter(d => d.project_id === pid);
                if (projectDisbs.length > 0) {
                    actual += projectDisbs.reduce((s, d) => s + Number(d.amount), 0);
                } else {
                    const projectPlans = boardPlans.filter(p => p.project_id === pid);
                    actual += projectPlans.reduce((s, p) => s + Number(p.disbursed_amount || 0), 0);
                }
            });

            return {
                name: board.label,
                planned: Math.round(planned / 1e9 * 10) / 10,
                actual: Math.round(actual / 1e9 * 10) / 10,
                rate: planned > 0 ? Math.round((actual / planned) * 100) : 0,
                color: board.hex,
            };
        });
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
                .neq('status', 'Done').lt('due_date', today)
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

    /** Monthly Briefing — real Supabase queries */
    getMonthlyBriefingStats: async (month: number, year: number): Promise<MonthlyBriefingStats> => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const [disbursedRes, capitalRes, projectsRes, issuesRes] = await Promise.all([
            supabase.from('disbursements').select('amount').gte('date', startDate).lte('date', endDate),
            supabase.from('capital_plans').select('amount').eq('year', year),
            supabase.from('projects').select('project_id, project_name, status, progress, start_date'),
            supabase.from('package_issues').select('issue_id, title, severity')
                .eq('status', 'Open')
                .order('reported_date', { ascending: false })
                .limit(5),
        ]);

        const disbursedThisMonth = (disbursedRes.data || []).reduce((s, d) => s + Number(d.amount), 0);
        const yearlyTarget = (capitalRes.data || []).reduce((s, p) => s + Number(p.amount), 0);
        const disbursedTarget = Math.round(yearlyTarget / 12);

        const allProjects = projectsRes.data || [];
        const newProjectsStarted = allProjects.filter(p => {
            if (!p.start_date) return false;
            return p.start_date >= startDate && p.start_date <= endDate;
        }).length;
        const projectsCompleted = allProjects.filter(p => p.status === 3).length;

        // Key achievements — auto-generated from data
        const keyAchievements: { id: string; content: string }[] = [];
        if (disbursedThisMonth > 0) {
            const bill = Math.round(disbursedThisMonth / 1e9 * 10) / 10;
            const rate = disbursedTarget > 0 ? Math.round((disbursedThisMonth / disbursedTarget) * 100) : 0;
            keyAchievements.push({ id: 'disbursed', content: `Giải ngân ${bill} tỷ đồng trong tháng, đạt ${rate}% kế hoạch tháng.` });
        }
        if (newProjectsStarted > 0) {
            keyAchievements.push({ id: 'new-proj', content: `Khởi công ${newProjectsStarted} dự án mới trong tháng.` });
        }
        if (projectsCompleted > 0) {
            keyAchievements.push({ id: 'completed', content: `Hoàn thành ${projectsCompleted} dự án trong kỳ báo cáo.` });
        }

        // Roadblocks — from open issues
        const roadblocks = (issuesRes.data || []).map(i => ({
            id: String(i.issue_id),
            content: i.title,
            severity: (i.severity === 'High' ? 'high' : i.severity === 'Medium' ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        }));

        // Upcoming plans — generic defaults based on data
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const upcomingPlans = [
            { id: '1', content: `Đẩy mạnh giải ngân vốn đầu tư công tháng ${nextMonth}/${nextYear}, phấn đấu đạt và vượt kế hoạch.` },
            { id: '2', content: 'Tăng cường kiểm tra, giám sát tiến độ thi công các gói thầu đang triển khai.' },
            { id: '3', content: 'Đôn đốc nhà thầu hoàn thiện hồ sơ nghiệm thu, thanh toán đúng hạn.' },
        ];

        return {
            month, year,
            disbursedThisMonth,
            disbursedTarget,
            newProjectsStarted,
            projectsCompleted,
            docsApproved: 0,
            keyAchievements: keyAchievements.slice(0, 5),
            roadblocks,
            upcomingPlans,
        };
    },

    /** Task Briefing Summary — tổng hợp công việc theo phòng ban cho báo cáo giao ban */
    getTaskBriefingSummary: async (month: number, year: number): Promise<TaskBriefingSummary[]> => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const [tasksRes, employeesRes] = await Promise.all([
            (supabase as any)
                .from('tasks')
                .select('id, title, status, progress, category, completion_result, incomplete_reason, notes, assignee_id, project_id, projects(project_name)')
                .is('parent_id', null)
                .gte('due_date', startDate)
                .lte('due_date', endDate)
                .order('category', { ascending: true })
                .order('sort_order', { ascending: true }),
            supabase.from('employees').select('employee_id, full_name, department, position'),
        ]);

        if (tasksRes.error) {
            console.error('[TaskBriefing] tasks query failed:', tasksRes.error.message || tasksRes.error);
            return [];
        }

        const empMap = new Map<string, { full_name: string; department: string | null; position: string | null }>();
        for (const e of (employeesRes.data || [])) {
            empMap.set(e.employee_id, e);
        }

        const tasks = tasksRes.data || [];
        const deptMap = new Map<string, TaskBriefingSummary>();

        for (const t of tasks) {
            const emp = empMap.get(t.assignee_id);
            const dept = emp?.department || 'Chưa xác định';
            if (!deptMap.has(dept)) {
                deptMap.set(dept, {
                    department_name: dept,
                    total_tasks: 0,
                    completed: 0,
                    in_progress: 0,
                    incomplete: 0,
                    completion_rate: 0,
                    by_category: [],
                });
            }
            const summary = deptMap.get(dept)!;
            summary.total_tasks++;
            if (t.status === 'done') summary.completed++;
            else if (t.status === 'in_progress') summary.in_progress++;
            else if (t.status === 'incomplete') summary.incomplete++;

            const cat = (t.category as TaskCategory) || 'khac';
            let catGroup = summary.by_category.find(c => c.category === cat);
            if (!catGroup) {
                catGroup = {
                    category: cat,
                    category_label: TASK_CATEGORY_LABELS[cat] || 'Khác',
                    total: 0,
                    completed: 0,
                    items: [],
                };
                summary.by_category.push(catGroup);
            }
            catGroup.total++;
            if (t.status === 'done') catGroup.completed++;
            catGroup.items.push({
                title: t.title,
                project_name: t.projects?.project_name || undefined,
                assignee_name: emp?.full_name || '',
                completion_result: t.completion_result || undefined,
                incomplete_reason: t.incomplete_reason || undefined,
                status: t.status,
                progress: t.progress || 0,
                notes: t.notes || undefined,
            });
        }

        for (const summary of deptMap.values()) {
            summary.completion_rate = summary.total_tasks > 0
                ? Math.round((summary.completed / summary.total_tasks) * 1000) / 10
                : 0;
        }

        return Array.from(deptMap.values());
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

