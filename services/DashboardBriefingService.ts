import { supabase } from '../lib/supabase';
import { TaskCategory, TASK_CATEGORY_LABELS } from '../types/task.types';

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

export interface ProjectBriefingData {
    projectId: string;
    projectName: string;
    progress: number;
    statusLabel: string;
    disbursedAmount: number;
    completedTasks: { id: string; title: string; assigneeName: string; completionResult?: string }[];
    incompleteTasks: { id: string; title: string; assigneeName: string; incompleteReason?: string; incompleteReasonType?: string; obstacles?: string }[];
    inProgressTasks: { id: string; title: string; assigneeName: string; progress: number; obstacles?: string }[];
    nextMonthTasks: { id: string; title: string; assigneeName: string }[];
    issues: { id: string; title: string; severity: string }[];
    leaderComment?: string;
    managementBoard?: number;
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

export const DashboardBriefingService = {
    /** Monthly Briefing — real Supabase queries */
    getMonthlyBriefingStats: async (month: number, year: number): Promise<MonthlyBriefingStats> => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const nextStartDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
        const nextLastDay = new Date(nextYear, nextMonth, 0).getDate();
        const nextEndDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextLastDay).padStart(2, '0')}`;

        const [disbursedRes, capitalRes, projectsRes, issuesRes, docsRes, upcomingTasksRes, disbursementPlansRes] = await Promise.all([
            supabase.from('disbursements').select('amount').gte('date', startDate).lte('date', endDate),
            supabase.from('capital_plans').select('amount').eq('year', year),
            supabase.from('projects').select('project_id, project_name, status, progress, start_date, actual_end_date, acceptance_date'),
            supabase.from('package_issues').select('issue_id, title, severity')
                .eq('status', 'Open')
                .order('reported_date', { ascending: false })
                .limit(5),
            supabase.from('documents')
                .select('doc_id')
                .eq('legal_status', 'active')
                .gte('upload_date', startDate)
                .lte('upload_date', endDate + 'T23:59:59.999Z'),
            supabase.from('tasks')
                .select('category')
                .is('parent_id', null)
                .gte('due_date', nextStartDate)
                .lte('due_date', nextEndDate),
            supabase.from('disbursement_plans')
                .select('planned_amount')
                .eq('month', month)
                .eq('year', year),
        ]);

        const disbursedThisMonth = (disbursedRes.data || []).reduce((s, d) => s + Number(d.amount), 0);
        const yearlyTarget = (capitalRes.data || []).reduce((s, p) => s + Number(p.amount), 0);
        
        const monthlyTargetFromDB = (disbursementPlansRes.data || []).reduce((s, d) => s + Number(d.planned_amount), 0);
        const disbursedTarget = monthlyTargetFromDB > 0 ? monthlyTargetFromDB : Math.round(yearlyTarget / 12);

        const allProjects = projectsRes.data || [];
        const newProjectsStarted = allProjects.filter(p => {
            if (!p.start_date) return false;
            return p.start_date >= startDate && p.start_date <= endDate;
        }).length;
        
        const projectsCompleted = allProjects.filter(p => {
            if (p.status !== 3) return false;
            const dateStr = p.actual_end_date || p.acceptance_date;
            if (!dateStr) return false;
            const match = dateStr.match(/^(\d{4})-(\d{2})/);
            if (match) {
                const y = parseInt(match[1], 10);
                const m = parseInt(match[2], 10);
                return y === year && m === month;
            }
            return false;
        }).length;

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

        // Upcoming plans — group by category
        const nextTasks = upcomingTasksRes.data || [];
        const categoryCounts: Record<string, number> = {};
        nextTasks.forEach((t: any) => {
            const cat = t.category || 'khac';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        const categoryLabels: Record<string, string> = {
            dieu_hanh: 'Điều hành, quản lý',
            tham_dinh: 'Thẩm định hồ sơ, thiết kế',
            thi_cong: 'Thi công, giám sát hiện trường',
            quyet_toan: 'Quyết toán dự án hoàn thành',
            thanh_toan: 'Thanh toán, giải ngân vốn',
            gpmb: 'Giải phóng mặt bằng, bồi thường',
            dau_thau: 'Đấu thầu, lựa chọn nhà thầu',
            dieu_chinh: 'Điều chỉnh thiết kế, dự toán',
            gop_y: 'Góp ý văn bản, quy chuẩn',
            bao_cao: 'Lập báo cáo định kỳ/chuyên đề',
            kiem_tra: 'Kiểm tra công tác nghiệm thu',
            ban_giao: 'Bàn giao đưa vào sử dụng',
            khac: 'Công việc khác'
        };

        const upcomingPlans: { id: string; content: string }[] = [];
        let planId = 1;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
            const label = categoryLabels[cat] || categoryLabels.khac;
            upcomingPlans.push({
                id: String(planId++),
                content: `Triển khai ${count} nhiệm vụ thuộc nhóm "${label}" trong kế hoạch tháng ${nextMonth}/${nextYear}.`
            });
        });

        if (upcomingPlans.length === 0) {
            upcomingPlans.push(
                { id: '1', content: `Đẩy mạnh giải ngân vốn đầu tư công tháng ${nextMonth}/${nextYear}, phấn đấu đạt và vượt kế hoạch.` },
                { id: '2', content: 'Tăng cường kiểm tra, giám sát tiến độ thi công các gói thầu đang triển khai.' },
                { id: '3', content: 'Đôn đốc nhà thầu hoàn thiện hồ sơ nghiệm thu, thanh toán đúng hạn.' }
            );
        }

        const docsApproved = docsRes.data ? docsRes.data.length : 0;

        return {
            month, year,
            disbursedThisMonth,
            disbursedTarget,
            newProjectsStarted,
            projectsCompleted,
            docsApproved,
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

    /** Lấy dữ liệu báo cáo giao ban phân nhóm theo dự án */
    getProjectBriefingData: async (month: number, year: number): Promise<ProjectBriefingData[]> => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        // Lấy tháng tiếp theo để làm kế hoạch tháng tới
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const nextStartDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
        const nextLastDay = new Date(nextYear, nextMonth, 0).getDate();
        const nextEndDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextLastDay).padStart(2, '0')}`;

        const [projectsRes, tasksRes, nextTasksRes, disbursementsRes, issuesRes, employeesRes, packagesRes, commentsRes] = await Promise.all([
            (supabase.from('projects') as any).select('project_id, project_name, progress, status, management_board'),
            (supabase as any).from('tasks')
                .select('id, title, status, progress, completion_result, incomplete_reason, incomplete_reason_type, obstacles, assignee_id, project_id')
                .is('parent_id', null)
                .gte('due_date', startDate)
                .lte('due_date', endDate),
            (supabase as any).from('tasks')
                .select('id, title, assignee_id, project_id')
                .is('parent_id', null)
                .gte('due_date', nextStartDate)
                .lte('due_date', nextEndDate),
            supabase.from('disbursements').select('project_id, amount').gte('date', startDate).lte('date', endDate),
            supabase.from('package_issues').select('issue_id, title, severity, package_id').eq('status', 'Open'),
            supabase.from('employees').select('employee_id, full_name'),
            supabase.from('bidding_packages').select('package_id, project_id'),
            (supabase as any).from('view_comments')
                .select('reference_id, content')
                .eq('view_type', 'briefing')
                .eq('comment_month', month)
                .eq('comment_year', year),
        ]);

        const employees = employeesRes.data || [];
        const empMap = new Map(employees.map(e => [e.employee_id, e.full_name]));

        const projects = projectsRes.data || [];
        const tasks = tasksRes.data || [];
        const nextTasks = nextTasksRes.data || [];
        const disbursements = disbursementsRes.data || [];
        const issues = issuesRes.data || [];
        const packages = packagesRes.data || [];
        const packageToProjectMap = new Map(packages.map(p => [p.package_id, p.project_id]));
        const comments = commentsRes.data || [];
        const commentMap = new Map<string, string>(
            (comments || []).map((c: any) => [c.reference_id as string, c.content as string])
        );

        const projectMap = new Map<string, ProjectBriefingData>();

        // Init project map
        for (const p of projects) {
            let statusLabel = 'Không rõ';
            if (p.status === 1) statusLabel = 'Chuẩn bị ĐT';
            else if (p.status === 2) statusLabel = 'Thực hiện';
            else if (p.status === 3) statusLabel = 'Kết thúc XD';

            projectMap.set(p.project_id, {
                projectId: p.project_id,
                projectName: p.project_name,
                progress: p.progress || 0,
                statusLabel: statusLabel,
                disbursedAmount: 0,
                completedTasks: [],
                incompleteTasks: [],
                inProgressTasks: [],
                nextMonthTasks: [],
                issues: [],
                leaderComment: commentMap.get(p.project_id) || undefined,
                managementBoard: p.management_board || undefined,
            });
        }

        // Khởi tạo nhóm nghiệp vụ nội bộ
        const INTERNAL_ID = 'internal_admin';
        projectMap.set(INTERNAL_ID, {
            projectId: INTERNAL_ID,
            projectName: 'Công tác quản lý, điều hành nội bộ',
            progress: 100,
            statusLabel: 'Thường xuyên',
            disbursedAmount: 0,
            completedTasks: [],
            incompleteTasks: [],
            inProgressTasks: [],
            nextMonthTasks: [],
            issues: [],
        });

        // Phân phối giải ngân
        for (const d of disbursements) {
            if (!d.project_id) continue;
            const pBrief = projectMap.get(d.project_id);
            if (pBrief) {
                pBrief.disbursedAmount += Number(d.amount) || 0;
            }
        }

        // Phân phối vấn đề gói thầu
        for (const i of issues) {
            const pId = packageToProjectMap.get(i.package_id);
            if (!pId) continue;
            const pBrief = projectMap.get(pId);
            if (pBrief) {
                pBrief.issues.push({
                    id: String(i.issue_id),
                    title: i.title,
                    severity: String(i.severity).toLowerCase(),
                });
            }
        }

        // Phân phối công việc tháng hiện tại
        for (const t of tasks) {
            const pId = t.project_id || INTERNAL_ID;
            const pBrief = projectMap.get(pId);
            if (!pBrief) continue;

            const assigneeName = empMap.get(t.assignee_id) || 'Cán bộ';

            if (t.status === 'done') {
                pBrief.completedTasks.push({
                    id: t.id,
                    title: t.title,
                    assigneeName,
                    completionResult: t.completion_result || undefined,
                });
            } else if (t.status === 'incomplete') {
                pBrief.incompleteTasks.push({
                    id: t.id,
                    title: t.title,
                    assigneeName,
                    incompleteReason: t.incomplete_reason || undefined,
                    incompleteReasonType: t.incomplete_reason_type || undefined,
                    obstacles: t.obstacles || undefined,
                });
            } else {
                pBrief.inProgressTasks.push({
                    id: t.id,
                    title: t.title,
                    assigneeName,
                    progress: t.progress || 0,
                    obstacles: t.obstacles || undefined,
                });
            }
        }

        // Phân phối công việc tháng tiếp theo (kế hoạch tháng tới)
        for (const t of nextTasks) {
            const pId = t.project_id || INTERNAL_ID;
            const pBrief = projectMap.get(pId);
            if (!pBrief) continue;

            const assigneeName = empMap.get(t.assignee_id) || 'Cán bộ';
            pBrief.nextMonthTasks.push({
                id: t.id,
                title: t.title,
                assigneeName,
            });
        }

        // Lọc bỏ những dự án không có hoạt động nào trong tháng báo cáo hoặc tháng tiếp theo
        const briefingList = Array.from(projectMap.values()).filter(p => {
            if (p.projectId === INTERNAL_ID) {
                return (
                    p.completedTasks.length > 0 ||
                    p.incompleteTasks.length > 0 ||
                    p.inProgressTasks.length > 0 ||
                    p.nextMonthTasks.length > 0
                );
            }
            return (
                p.disbursedAmount > 0 ||
                p.completedTasks.length > 0 ||
                p.incompleteTasks.length > 0 ||
                p.inProgressTasks.length > 0 ||
                p.nextMonthTasks.length > 0 ||
                p.issues.length > 0
            );
        });

        // Sắp xếp: Dự án có giải ngân hoặc nhiều việc lên trước, nghiệp vụ nội bộ xuống cuối
        return briefingList.sort((a, b) => {
            if (a.projectId === INTERNAL_ID) return 1;
            if (b.projectId === INTERNAL_ID) return -1;
            
            // Xếp theo tiền giải ngân giảm dần
            if (b.disbursedAmount !== a.disbursedAmount) {
                return b.disbursedAmount - a.disbursedAmount;
            }

            // Xếp theo số lượng công việc hoàn thành + tồn tại giảm dần
            const aTasks = a.completedTasks.length + a.incompleteTasks.length + a.inProgressTasks.length;
            const bTasks = b.completedTasks.length + b.incompleteTasks.length + b.inProgressTasks.length;
            return bTasks - aTasks;
        });
    },

    /** Cập nhật ý kiến lãnh đạo cho dự án trong giao ban */
    updateProjectLeaderComment: async (projectId: string, comment: string, month?: number, year?: number): Promise<boolean> => {
        try {
            const commentMonth = month || (new Date().getMonth() + 1);
            const commentYear = year || new Date().getFullYear();
            
            const { error } = await (supabase as any)
                .from('view_comments')
                .upsert({
                    view_type: 'briefing',
                    reference_id: projectId,
                    comment_month: commentMonth,
                    comment_year: commentYear,
                    content: comment
                }, {
                    onConflict: 'view_type,reference_id,comment_month,comment_year'
                });
            
            if (error) {
                console.error("Error updating leader comment:", error);
                return false;
            }
            return true;
        } catch (e) {
            console.error("Error in updateProjectLeaderComment:", e);
            return false;
        }
    }
};
