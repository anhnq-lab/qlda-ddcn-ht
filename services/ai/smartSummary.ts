// Smart Summary — Tóm tắt thông minh cho Dashboard và Project Detail
// Cache kết quả để tiết kiệm API calls

import { generateSummary, generateAIAnalysis } from '../aiService';
import { DashboardService } from '../DashboardService';
import { ProjectService } from '../ProjectService';
import { supabase } from '../../lib/supabase';
import { PERSONAL_SUMMARY_PROMPT } from './prompts';

interface CachedSummary {
    text: string;
    timestamp: number;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const summaryCache = new Map<string, CachedSummary>();

function getCached(key: string): string | null {
    const cached = summaryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.text;
    }
    summaryCache.delete(key);
    return null;
}

function setCache(key: string, text: string) {
    summaryCache.set(key, { text, timestamp: Date.now() });
}

/** Get the ISO date string for 7 days ago */
function oneWeekAgo(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
}

/** Fetch recent weekly activities from contracts, payments, tasks */
async function getWeeklyActivities() {
    const since = oneWeekAgo();
    try {
        const [
            { data: newContracts },
            { data: recentPayments },
            { data: completedTasks },
            { data: contractors },
        ] = await Promise.all([
            // Contracts created or signed this week
            supabase.from('contracts')
                .select('contract_id, contract_name, contractor_id, value, status, sign_date, created_at, project_id')
                .or(`created_at.gte.${since},sign_date.gte.${since}`)
                .order('created_at', { ascending: false })
                .limit(10),
            // Payments approved or transferred this week
            supabase.from('payments')
                .select('payment_id, contract_id, amount, status, approved_date, paid_date, description, project_id')
                .or(`approved_date.gte.${since},paid_date.gte.${since}`)
                .order('approved_date', { ascending: false })
                .limit(10),
            // Tasks completed this week
            supabase.from('tasks')
                .select('id, title, status, project_id')
                .eq('status', 'done' as any)
                .gte('updated_at', since)
                .order('updated_at', { ascending: false })
                .limit(10),
            // All contractors for name lookup
            supabase.from('contractors')
                .select('contractor_id, full_name'),
        ]);

        // Build contractor name lookup
        const contractorMap = new Map<string, string>();
        (contractors || []).forEach((c: any) => {
            contractorMap.set(c.contractor_id, c.full_name);
        });

        // Build contract name lookup from fetched contracts + payment contracts
        const contractIds = (recentPayments || []).map((p: any) => p.contract_id).filter(Boolean);
        let contractMap = new Map<string, string>();
        if (contractIds.length > 0) {
            const { data: paymentContracts } = await supabase
                .from('contracts')
                .select('contract_id, contract_name')
                .in('contract_id', contractIds);
            (paymentContracts || []).forEach((c: any) => {
                contractMap.set(c.contract_id, c.contract_name);
            });
        }

        return {
            newContracts: (newContracts || []).map((c: any) => ({
                ...c,
                contractorName: contractorMap.get(c.contractor_id) || c.contractor_id,
            })),
            recentPayments: (recentPayments || []).map((p: any) => ({
                ...p,
                contractName: contractMap.get(p.contract_id) || p.contract_id,
            })),
            completedTasks: completedTasks || [],
            since,
        };
    } catch (err) {
        console.warn('Failed to fetch weekly activities:', err);
        return { newContracts: [], recentPayments: [], completedTasks: [], since };
    }
}

/**
 * Tóm tắt dashboard tổng quan
 */
export async function getDashboardSummary(forceRefresh = false): Promise<string> {
    const cacheKey = 'dashboard';
    if (!forceRefresh) {
        const cached = getCached(cacheKey);
        if (cached) return cached;
    }

    try {
        const currentYear = new Date().getFullYear();
        const [metrics, risks, weeklyActivities] = await Promise.all([
            DashboardService.getOverviewMetrics(currentYear),
            DashboardService.getRisks(),
            getWeeklyActivities(),
        ]);

        const data = {
            metrics,
            riskCount: risks.length,
            topRisks: risks.slice(0, 3),
            weeklyActivities: {
                newContracts: weeklyActivities.newContracts.map((c: any) => ({
                    contractName: c.contract_name,
                    contractorName: c.contractorName,
                    value: c.value,
                    status: c.status,
                    signDate: c.sign_date,
                })),
                recentPayments: weeklyActivities.recentPayments.map((p: any) => ({
                    contractName: p.contractName,
                    amount: p.amount,
                    status: p.status,
                    description: p.description,
                })),
                completedTasks: weeklyActivities.completedTasks.length,
                period: `${weeklyActivities.since} → ${new Date().toISOString().split('T')[0]}`,
            },
            currentDate: new Date().toISOString(),
        };

        const summary = await generateSummary(data);
        setCache(cacheKey, summary);
        return summary;
    } catch (error) {
        console.error('Error generating dashboard summary:', error);
        return '⚠️ Không thể tạo tóm tắt. Vui lòng thử lại sau.';
    }
}

/**
 * Tóm tắt 1 dự án — bao gồm contracts, payments, tasks
 */
export async function getProjectSummary(projectId: string, forceRefresh = false): Promise<string> {
    const cacheKey = `project-${projectId}`;
    if (!forceRefresh) {
        const cached = getCached(cacheKey);
        if (cached) return cached;
    }

    try {
        const project = await ProjectService.getById(projectId);
        if (!project) return '❌ Không tìm thấy dự án';

        // Fetch enriched data in parallel
        const [capitalInfo, contractsRaw, tasksRaw] = await Promise.allSettled([
            ProjectService.getCapitalInfo(projectId),
            supabase.from('contracts').select('contract_id, contract_name, value, status, end_date').eq('project_id', projectId).limit(10),
            supabase.from('tasks').select('title, status, due_date, priority').eq('project_id', projectId).is('parent_id', null).neq('status', 'done').order('due_date', { ascending: true }).limit(5),
        ]);

        const contracts = contractsRaw.status === 'fulfilled' ? (contractsRaw.value.data || []) : [];
        const pendingTasks = tasksRaw.status === 'fulfilled' ? (tasksRaw.value.data || []) : [];

        // Upcoming contract expirations
        const today = new Date().toISOString().split('T')[0];
        const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        const expiringContracts = contracts.filter((c: any) => c.end_date && c.end_date >= today && c.end_date <= in30days);

        const data = {
            project,
            capitalInfo: capitalInfo.status === 'fulfilled' ? capitalInfo.value : null,
            contracts: contracts.map((c: any) => ({
                name: c.contract_name,
                value: c.value,
                status: c.status,
                endDate: c.end_date,
            })),
            expiringContracts: expiringContracts.map((c: any) => ({
                name: c.contract_name,
                endDate: c.end_date,
            })),
            pendingTasks: pendingTasks.map((t: any) => ({
                title: t.title,
                status: t.status,
                dueDate: t.due_date,
                priority: t.priority,
            })),
            currentDate: new Date().toISOString(),
        };

        const summary = await generateSummary(data);
        setCache(cacheKey, summary);
        return summary;
    } catch (error) {
        console.error('Error generating project summary:', error);
        return '⚠️ Không thể tạo tóm tắt dự án. Vui lòng thử lại sau.';
    }
}

export interface PersonalSummaryContext {
    role: string;
    fullName: string;
    department?: string;
    stats: {
        inProgress: number;
        todo: number;
        done: number;
        overdue: number;
        total: number;
    };
    tasks: Array<{ Title: string; Status: string; DueDate: string; Priority: string }>;
    deadlines: Array<{ Title: string; DueDate: string; daysLeft: number }>;
}

/**
 * Tóm tắt cá nhân hàng ngày cho cán bộ (Personal Assistant)
 */
export async function getPersonalSummary(context: PersonalSummaryContext, forceRefresh = false): Promise<string> {
    const cacheKey = `personal-${context.fullName}-${context.role}`;
    if (!forceRefresh) {
        const cached = getCached(cacheKey);
        if (cached) return cached;
    }

    try {
        const tasksList = context.tasks && context.tasks.length > 0
            ? context.tasks.map(t => `- ${t.Title} [Trạng thái: ${t.Status}, Hạn: ${new Date(t.DueDate).toLocaleDateString('vi-VN')}, Mức độ: ${t.Priority}]`).join('\n')
            : 'Không có công việc nào đang xử lý.';
            
        const deadlinesList = context.deadlines && context.deadlines.length > 0
            ? context.deadlines.map(d => `- ${d.Title} [Hạn: ${new Date(d.DueDate).toLocaleDateString('vi-VN')}, Còn ${d.daysLeft} ngày]`).join('\n')
            : 'Không có công việc nào sắp đến hạn.';

        const prompt = PERSONAL_SUMMARY_PROMPT
            .replace('{fullName}', context.fullName)
            .replace('{role}', context.role)
            .replace('{department}', context.department || '—')
            .replace('{stats.inProgress}', String(context.stats.inProgress))
            .replace('{stats.todo}', String(context.stats.todo))
            .replace('{stats.done}', String(context.stats.done))
            .replace('{stats.overdue}', String(context.stats.overdue))
            .replace('{stats.total}', String(context.stats.total))
            .replace('{tasksList}', tasksList)
            .replace('{deadlinesList}', deadlinesList);

        const summary = await generateAIAnalysis(prompt, { currentDate: new Date().toISOString() });
        setCache(cacheKey, summary);
        return summary;
    } catch (error) {
        console.error('Error generating personal daily summary:', error);
        return '⚠️ Không thể tạo tóm tắt cá nhân. Vui lòng thử lại sau.';
    }
}

/**
 * Xóa cache
 */
export function clearSummaryCache() {
    summaryCache.clear();
}
