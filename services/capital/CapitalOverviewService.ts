import { supabase } from '../../lib/supabase';
import { CapitalPlan, Disbursement, DisbursementPlanItem, CapitalPlanRow, DisbursementPlanRow, DisbursementRow } from '../../types';
import { normalizeSource } from '../../utils/capitalConstants';
import { CapitalMapper } from './CapitalMapper';
import { CapitalPlanService } from './CapitalPlanService';
import { DisbursementService } from './DisbursementService';

export interface DisbursementAlert {
    ProjectID: string;
    AlertLevel: 'Low' | 'Medium' | 'High';
    Message: string;
    Deadline?: string;
}

export class CapitalOverviewService {
    /**
     * Get Total Planned vs Disbursed
     */
    static async getFinancialStats(projectId: string) {
        const [plans, disbursed] = await Promise.all([
            CapitalPlanService.getCapitalPlans(projectId),
            DisbursementService.getDisbursements(projectId)
        ]);

        const totalPlanned = plans.reduce((sum, p) => sum + p.Amount, 0);
        const totalDisbursed = disbursed.reduce((sum, d) => sum + d.Amount, 0);

        return {
            totalPlanned,
            totalDisbursed,
            rate: totalPlanned > 0 ? (totalDisbursed / totalPlanned) * 100 : 0
        };
    }

    /**
     * Check for Disbursement Alerts (Rule-based)
     */
    static async getAlerts(projectId: string): Promise<DisbursementAlert[]> {
        const stats = await this.getFinancialStats(projectId);
        const alerts: DisbursementAlert[] = [];
        const currentMonth = new Date().getMonth() + 1;

        // Rule 1: High risk if rate < 50% by October
        if (currentMonth >= 10 && stats.rate < 50) {
            alerts.push({
                ProjectID: projectId,
                AlertLevel: 'High',
                Message: 'Tỷ lệ giải ngân thấp (< 50%) trong Quý 4. Cần đẩy nhanh tiến độ hồ sơ thanh toán.',
                Deadline: `31/12/${new Date().getFullYear()}`
            });
        }

        return alerts;
    }

    /**
     * [SINGLE SOURCE OF TRUTH] Get project capital summary — used by both
     * ProjectCapitalTab and MidTermCapitalPage to avoid dual data model.
     */
    static async getProjectCapitalSummary(projectId: string): Promise<{
        capitalPlans: CapitalPlan[];
        disbursements: Disbursement[];
        disbursementPlans: DisbursementPlanItem[];
        summary: {
            totalInvestment: number;
            totalAllocated: number;
            totalDisbursed: number;
            totalAdvance: number;
            advanceRecovered: number;
            advanceBalance: number;
            completionPayment: number;
            disbursementRate: number;
            yearlyTarget: number;
            yearlyDisbursed: number;
        };
    }> {
        const [plansRes, disbRes, disbPlanRes, projectRes] = await Promise.all([
            supabase.from('capital_plans').select('*').eq('project_id', projectId).order('year', { ascending: true }),
            supabase.from('disbursements').select('*').eq('project_id', projectId).order('date', { ascending: true }),
            supabase.from('disbursement_plans').select('*').eq('project_id', projectId).order('year').order('month'),
            supabase.from('projects').select('total_investment').eq('project_id', projectId).maybeSingle(),
        ]);

        const capitalPlans: CapitalPlan[] = (plansRes.data || []).map(CapitalMapper.mapCapitalPlan);
        const rawDisbs = disbRes.data || [];

        const disbursements: Disbursement[] = rawDisbs.map(CapitalMapper.mapDisbursement.bind(CapitalMapper));
        const disbursementPlans: DisbursementPlanItem[] = (disbPlanRes.data || []).map(CapitalMapper.mapDisbursementPlan);

        // === CORE LOGIC: Tính disbursed_amount cho từng capital plan ===
        const hasDetailedDisbursements = disbursements.length > 0;

        capitalPlans.forEach(plan => {
            if (hasDetailedDisbursements) {
                const relatedDisbs = disbursements.filter(d => {
                    if (plan.PlanType === 'annual') {
                        return new Date(d.Date).getFullYear() === plan.Year;
                    } else if (plan.PlanType === 'mid_term') {
                        const y = new Date(d.Date).getFullYear();
                        return y >= (plan.PeriodStart || 0) && y <= (plan.PeriodEnd || 9999);
                    }
                    return false;
                });
                if (relatedDisbs.length > 0) {
                    plan.DisbursedAmount = CapitalMapper.calculateTrueDisbursed(relatedDisbs);
                }
            }
        });

        // Compute actual amount for monthly disbursement plans based on true disbursements
        if (hasDetailedDisbursements) {
            disbursementPlans.forEach(dPlan => {
                const monthlyDisbs = disbursements.filter(d => {
                    if (!d.Date) return false;
                    const date = new Date(d.Date);
                    return date.getFullYear() === dPlan.Year && (date.getMonth() + 1) === dPlan.Month;
                });
                if (monthlyDisbs.length > 0) {
                    dPlan.ActualAmount = CapitalMapper.calculateTrueDisbursed(monthlyDisbs);
                } else {
                    dPlan.ActualAmount = 0;
                }
            });

            // Tự động tạo các plan ảo cho các tháng có giải ngân nhưng chưa lập kế hoạch
            const disbMapByYearMonth = new Map<string, Disbursement[]>();
            disbursements.forEach(d => {
                if (!d.Date) return;
                const date = new Date(d.Date);
                const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
                if (!disbMapByYearMonth.has(key)) disbMapByYearMonth.set(key, []);
                disbMapByYearMonth.get(key)!.push(d);
            });

            disbMapByYearMonth.forEach((monthlyDisbs, key) => {
                const [y, m] = key.split('-').map(Number);
                const existingPlan = disbursementPlans.find(p => p.Year === y && p.Month === m);
                
                if (!existingPlan) {
                    const actual = CapitalMapper.calculateTrueDisbursed(monthlyDisbs);
                    if (actual !== 0) {
                        disbursementPlans.push({
                            Id: `auto-${y}-${m}`,
                            ProjectID: projectId,
                            Year: y,
                            Month: m,
                            PlannedAmount: 0,
                            ActualAmount: actual,
                            Notes: 'Dữ liệu tự động tổng hợp từ giải ngân thực tế',
                        });
                    }
                }
            });
        }

        // Summary calculations
        const totalInvestment = Number(projectRes.data?.total_investment) || 0;
        const annualPlans = capitalPlans.filter(p => p.PlanType === 'annual');
        const totalAllocated = annualPlans.reduce((s, p) => s + (p.Amount || 0), 0);

        let totalDisbursed: number;
        let totalAdvance: number;
        let advanceRecovered: number;
        let completionPayment: number;

        if (hasDetailedDisbursements) {
            totalDisbursed = CapitalMapper.calculateTrueDisbursed(disbursements);
            totalAdvance = disbursements.filter(d => d.Type === 'TamUng' && d.Status === 'Approved').reduce((s, d) => s + d.Amount, 0);
            advanceRecovered = disbursements.filter(d => d.Type === 'ThuHoiTamUng' && d.Status === 'Approved').reduce((s, d) => s + d.Amount, 0);
            completionPayment = disbursements.filter(d => (d.Type === 'ThanhToanKLHT' || (d.Type as any) === 'ThanhToanTT') && d.Status === 'Approved').reduce((s, d) => s + d.Amount, 0);
        } else {
            totalDisbursed = annualPlans.reduce((s, p) => s + (p.DisbursedAmount || 0), 0);
            totalAdvance = 0;
            advanceRecovered = 0;
            completionPayment = totalDisbursed;
        }

        const currentYear = new Date().getFullYear();
        const yearlyTarget = annualPlans.filter(p => p.Year === currentYear).reduce((s, p) => s + (p.Amount || 0), 0);
        const yearlyDisbursed = hasDetailedDisbursements
            ? CapitalMapper.calculateTrueDisbursed(disbursements.filter(d => new Date(d.Date).getFullYear() === currentYear))
            : (annualPlans.find(p => p.Year === currentYear)?.DisbursedAmount || 0);

        return {
            capitalPlans,
            disbursements,
            disbursementPlans,
            summary: {
                totalInvestment,
                totalAllocated,
                totalDisbursed,
                totalAdvance,
                advanceRecovered,
                advanceBalance: totalAdvance - advanceRecovered,
                completionPayment,
                disbursementRate: totalAllocated > 0 ? Math.round((totalDisbursed / totalAllocated) * 100) : 0,
                yearlyTarget,
                yearlyDisbursed,
            },
        };
    }

    /** Fetch all capital plans with project names joined and actual disbursements computed */
    static async fetchAllCapitalPlans(): Promise<CapitalPlanRow[]> {
        const [
            { data: plans },
            { data: projects },
            { data: disbs }
        ] = await Promise.all([
            supabase.from('capital_plans').select('*').order('year', { ascending: false }),
            supabase.from('projects').select('project_id, project_name'),
            supabase.from('disbursements').select('*')
        ]);
        
        const pm = new Map((projects || []).map((p: any) => [p.project_id, p.project_name]));
        
        return (plans || []).map((p: any) => {
            let relatedDisbs: any[] = [];
            const projectDisbs = (disbs || []).filter((d: any) => d.project_id === p.project_id);
            
            if (p.plan_type === 'annual' && p.year) {
                relatedDisbs = projectDisbs.filter((d: any) => new Date(d.date).getFullYear() === p.year);
            } else if (p.plan_type === 'mid_term') {
                relatedDisbs = projectDisbs.filter((d: any) => {
                    const y = new Date(d.date).getFullYear();
                    return y >= (p.period_start || 0) && y <= (p.period_end || 9999);
                });
            }
            
            return {
                ...p,
                plan_type: p.plan_type || 'annual',
                project_name: pm.get(p.project_id) || p.project_id,
                source: normalizeSource(p.source),
                disbursed_amount: relatedDisbs.length > 0 ? CapitalMapper.calculateTrueDisbursed(relatedDisbs) : (Number(p.disbursed_amount) || 0)
            };
        });
    }

    /** Fetch all monthly disbursement plans with project names */
    static async fetchAllDisbursementPlans(): Promise<DisbursementPlanRow[]> {
        const [
            { data: plans },
            { data: projects }
        ] = await Promise.all([
            supabase.from('disbursement_plans').select('*').order('year').order('month'),
            supabase.from('projects').select('project_id, project_name')
        ]);
        const pm = new Map((projects || []).map((p: any) => [p.project_id, p.project_name]));
        return (plans || []).map((p: any) => ({ ...p, project_name: pm.get(p.project_id) || p.project_id }));
    }

    /** Fetch all actual disbursements with project names */
    static async fetchAllDisbursements(): Promise<DisbursementRow[]> {
        const [
            { data: disbs },
            { data: projects }
        ] = await Promise.all([
            supabase.from('disbursements').select('*').order('date', { ascending: true }),
            supabase.from('projects').select('project_id, project_name')
        ]);
        const pm = new Map((projects || []).map((p: any) => [p.project_id, p.project_name]));
        return (disbs || []).map((d: any) => ({ ...d, project_name: pm.get(d.project_id) || d.project_id }));
    }
}
