// Capital Service - Supabase CRUD operations
import { supabase } from '../lib/supabase';
import { CapitalPlan, Disbursement, CapitalPlanRow, DisbursementPlanRow, DisbursementRow } from '../types';
import { normalizeSource } from '../utils/capitalConstants';

export interface DisbursementAlert {
    ProjectID: string;
    AlertLevel: 'Low' | 'Medium' | 'High';
    Message: string;
    Deadline?: string;
}

export interface DisbursementPlanItem {
    Id: string;
    ProjectID: string;
    Year: number;
    Month: number;
    PlannedAmount: number;
    ActualAmount: number;
    Notes: string;
}

export class CapitalService {

    // ═══════════════════════════════════════════════════════════
    // MONTHLY DISBURSEMENT PLANS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get Monthly Disbursement Plans for Project
     */
    static async getDisbursementPlans(projectId: string): Promise<DisbursementPlanItem[]> {
        const { data, error } = await (supabase as any)
            .from('disbursement_plans')
            .select('*')
            .eq('project_id', projectId)
            .order('year', { ascending: true })
            .order('month', { ascending: true });

        if (error) throw new Error(`Failed to fetch disbursement plans: ${error.message}`);
        return (data || []).map(this.mapDisbursementPlan);
    }

    /**
     * Create a new Monthly Disbursement Plan
     */
    static async createDisbursementPlan(plan: Omit<DisbursementPlanItem, 'Id'>): Promise<DisbursementPlanItem> {
        const { data, error } = await (supabase as any)
            .from('disbursement_plans')
            .insert({
                id: `DP-${Date.now()}`,
                project_id: plan.ProjectID,
                year: plan.Year,
                month: plan.Month,
                planned_amount: plan.PlannedAmount || 0,
                actual_amount: plan.ActualAmount || 0,
                notes: plan.Notes || null,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create plan: ${error.message}`);
        return this.mapDisbursementPlan(data);
    }

    /**
     * Save Monthly Disbursement Plans in bulk
     */
    static async bulkSaveDisbursementPlans(projectId: string, year: number, plans: { id?: string, month: number, plannedAmount: number, actualAmount: number, notes: string }[]): Promise<void> {
        // First delete all plans for this project and year
        const { error: deleteError } = await (supabase as any)
            .from('disbursement_plans')
            .delete()
            .eq('project_id', projectId)
            .eq('year', year);
            
        if (deleteError) throw new Error(`Failed to delete old plans: ${deleteError.message}`);

        const newPlans = plans
            .filter(p => p.plannedAmount > 0 || p.actualAmount > 0 || p.notes)
            .map(p => ({
                id: p.id || `DP-${Date.now()}-${p.month}`,
                project_id: projectId,
                year: year,
                month: p.month,
                planned_amount: p.plannedAmount,
                actual_amount: p.actualAmount,
                notes: p.notes || null,
            }));

        if (newPlans.length > 0) {
            const { error: insertError } = await (supabase as any)
                .from('disbursement_plans')
                .insert(newPlans);
            if (insertError) throw new Error(`Failed to insert new plans: ${insertError.message}`);
        }
    }

    /**
     * Update an existing Monthly Disbursement Plan
     */
    static async updateDisbursementPlan(id: string, updates: Partial<DisbursementPlanItem>): Promise<DisbursementPlanItem> {
        const updateData: Record<string, any> = {};
        if (updates.Year !== undefined) updateData.year = updates.Year;
        if (updates.Month !== undefined) updateData.month = updates.Month;
        if (updates.PlannedAmount !== undefined) updateData.planned_amount = updates.PlannedAmount;
        if (updates.ActualAmount !== undefined) updateData.actual_amount = updates.ActualAmount;
        if (updates.Notes !== undefined) updateData.notes = updates.Notes;

        const { data, error } = await supabase
            .from('disbursement_plans')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update disbursement plan: ${error.message}`);
        return this.mapDisbursementPlan(data);
    }

    /**
     * Delete a Monthly Disbursement Plan
     */
    static async deleteDisbursementPlan(id: string): Promise<void> {
        const { error } = await supabase
            .from('disbursement_plans')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Failed to delete disbursement plan: ${error.message}`);
    }

    // ═══════════════════════════════════════════════════════════
    // CAPITAL PLANS — CRUD
    // ═══════════════════════════════════════════════════════════

    /**
     * Get Capital Plans for Project
     */
    static async getCapitalPlans(projectId: string): Promise<CapitalPlan[]> {
        const { data, error } = await supabase
            .from('capital_plans')
            .select('*')
            .eq('project_id', projectId)
            .order('year', { ascending: false });

        if (error) throw new Error(`Failed to fetch capital plans: ${error.message}`);
        return (data || []).map(this.mapCapitalPlan);
    }

    /**
     * Create a new Capital Plan
     */
    static async createCapitalPlan(plan: Omit<CapitalPlan, 'PlanID'>): Promise<CapitalPlan> {
        const prefix = plan.PlanType === 'mid_term' ? 'MT' : 'CP';
        const { data, error } = await supabase
            .from('capital_plans')
            .insert({
                plan_id: `${prefix}-${Date.now()}`,
                project_id: plan.ProjectID,
                year: plan.Year,
                amount: plan.Amount,
                source: plan.Source,
                decision_number: plan.DecisionNumber || null,
                date_assigned: plan.DateAssigned || null,
                disbursed_amount: plan.DisbursedAmount || 0,
                status: plan.Status || 'Approved',
                plan_type: plan.PlanType || 'annual',
                period_start: plan.PeriodStart || null,
                period_end: plan.PeriodEnd || null,
                approval_status: plan.ApprovalStatus || 'draft',
                approved_by: plan.ApprovedBy || null,
                approved_date: plan.ApprovedDate || null,
                notes: plan.Notes || null,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create capital plan: ${error.message}`);
        return this.mapCapitalPlan(data);
    }

    /**
     * Update an existing Capital Plan
     */
    static async updateCapitalPlan(planId: string, updates: Partial<CapitalPlan>): Promise<CapitalPlan> {
        const updateData: Record<string, any> = {};
        if (updates.Year !== undefined) updateData.year = updates.Year;
        if (updates.Amount !== undefined) updateData.amount = updates.Amount;
        if (updates.Source !== undefined) updateData.source = updates.Source;
        if (updates.DecisionNumber !== undefined) updateData.decision_number = updates.DecisionNumber;
        if (updates.DateAssigned !== undefined) updateData.date_assigned = updates.DateAssigned;
        if (updates.DisbursedAmount !== undefined) updateData.disbursed_amount = updates.DisbursedAmount;
        if (updates.Status !== undefined) updateData.status = updates.Status;
        if (updates.PlanType !== undefined) updateData.plan_type = updates.PlanType;
        if (updates.PeriodStart !== undefined) updateData.period_start = updates.PeriodStart;
        if (updates.PeriodEnd !== undefined) updateData.period_end = updates.PeriodEnd;
        if (updates.ApprovalStatus !== undefined) updateData.approval_status = updates.ApprovalStatus;
        if (updates.ApprovedBy !== undefined) updateData.approved_by = updates.ApprovedBy;
        if (updates.ApprovedDate !== undefined) updateData.approved_date = updates.ApprovedDate;
        if (updates.Notes !== undefined) updateData.notes = updates.Notes;

        const { data, error } = await supabase
            .from('capital_plans')
            .update(updateData)
            .eq('plan_id', planId)
            .select()
            .single();

        if (error) throw new Error(`Failed to update capital plan: ${error.message}`);
        return this.mapCapitalPlan(data);
    }

    /**
     * Delete a Capital Plan
     */
    static async deleteCapitalPlan(planId: string): Promise<void> {
        const { error } = await supabase
            .from('capital_plans')
            .delete()
            .eq('plan_id', planId);

        if (error) throw new Error(`Failed to delete capital plan: ${error.message}`);
    }

    // ═══════════════════════════════════════════════════════════
    // DISBURSEMENTS — CRUD
    // ═══════════════════════════════════════════════════════════

    /**
     * Get Disbursements for Project
     */
    static async getDisbursements(projectId: string): Promise<Disbursement[]> {
        const { data, error } = await supabase
            .from('disbursements')
            .select('*')
            .eq('project_id', projectId)
            .order('date', { ascending: false });

        if (error) throw new Error(`Failed to fetch disbursements: ${error.message}`);
        return (data || []).map(this.mapDisbursement);
    }

    /**
     * Create a new Disbursement
     */
    static async createDisbursement(d: Omit<Disbursement, 'DisbursementID'>): Promise<Disbursement> {
        const { data, error } = await supabase
            .from('disbursements')
            .insert({
                disbursement_id: `GN-${Date.now()}`,
                project_id: d.ProjectID,
                capital_plan_id: d.CapitalPlanID || null,
                payment_id: d.PaymentID || null,
                amount: d.Amount,
                date: d.Date,
                treasury_code: d.TreasuryCode || null,
                form_type: d.FormType || null,
                status: d.Status || 'Pending',
                type: d.Type || 'ThanhToanKLHT',
                description: d.Description || null,
                contract_number: d.ContractNumber || null,
                cumulative_before: d.CumulativeBefore || 0,
                advance_balance: d.AdvanceBalance || 0,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create disbursement: ${error.message}`);
        return this.mapDisbursement(data);
    }

    /**
     * Update an existing Disbursement
     */
    static async updateDisbursement(id: string, updates: Partial<Disbursement>): Promise<Disbursement> {
        const updateData: Record<string, any> = {};
        if (updates.Amount !== undefined) updateData.amount = updates.Amount;
        if (updates.Date !== undefined) updateData.date = updates.Date;
        if (updates.TreasuryCode !== undefined) updateData.treasury_code = updates.TreasuryCode;
        if (updates.FormType !== undefined) updateData.form_type = updates.FormType;
        if (updates.Status !== undefined) updateData.status = updates.Status;
        if (updates.Type !== undefined) updateData.type = updates.Type;
        if (updates.Description !== undefined) updateData.description = updates.Description;
        if (updates.ContractNumber !== undefined) updateData.contract_number = updates.ContractNumber;
        if (updates.CapitalPlanID !== undefined) updateData.capital_plan_id = updates.CapitalPlanID;
        if (updates.CumulativeBefore !== undefined) updateData.cumulative_before = updates.CumulativeBefore;
        if (updates.AdvanceBalance !== undefined) updateData.advance_balance = updates.AdvanceBalance;

        const { data, error } = await supabase
            .from('disbursements')
            .update(updateData)
            .eq('disbursement_id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update disbursement: ${error.message}`);
        return this.mapDisbursement(data);
    }

    /**
     * Delete a Disbursement
     */
    static async deleteDisbursement(id: string): Promise<void> {
        const { error } = await supabase
            .from('disbursements')
            .delete()
            .eq('disbursement_id', id);

        if (error) throw new Error(`Failed to delete disbursement: ${error.message}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STATISTICS & ALERTS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get Total Planned vs Disbursed
     */
    static async getFinancialStats(projectId: string) {
        const [plans, disbursed] = await Promise.all([
            this.getCapitalPlans(projectId),
            this.getDisbursements(projectId)
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

    // ═══════════════════════════════════════════════════════════
    // MAPPERS
    // ═══════════════════════════════════════════════════════════

    private static mapCapitalPlan(row: any): CapitalPlan {
        return {
            PlanID: row.plan_id,
            ProjectID: row.project_id,
            Year: row.year,
            Amount: Number(row.amount) || 0,
            Source: row.source || '',
            DecisionNumber: row.decision_number || '',
            DateAssigned: row.date_assigned || '',
            DisbursedAmount: Number(row.disbursed_amount) || 0,
            Status: row.status || 'Approved',
            PlanType: row.plan_type || 'annual',
            PeriodStart: row.period_start || undefined,
            PeriodEnd: row.period_end || undefined,
            ApprovalStatus: row.approval_status || 'draft',
            ApprovedBy: row.approved_by || undefined,
            ApprovedDate: row.approved_date || undefined,
            Notes: row.notes || undefined,
        };
    }

    private static mapDisbursementPlan(row: any): DisbursementPlanItem {
        return {
            Id: row.id,
            ProjectID: row.project_id,
            Year: row.year,
            Month: row.month,
            PlannedAmount: Number(row.planned_amount) || 0,
            ActualAmount: Number(row.actual_amount) || 0,
            Notes: row.notes || '',
        };
    }

    private static normalizeStatus(s: string): 'Pending' | 'Approved' | 'Rejected' {
        const lower = (s || '').toLowerCase();
        if (lower === 'approved' || lower === 'completed') return 'Approved';
        if (lower === 'pending') return 'Pending';
        return 'Rejected';
    }

    private static mapDisbursement(row: any): Disbursement {
        return {
            DisbursementID: row.disbursement_id,
            ProjectID: row.project_id,
            CapitalPlanID: row.capital_plan_id || undefined,
            AllocationID: row.capital_plan_id || undefined,
            PaymentID: row.payment_id || undefined,
            Amount: Number(row.amount) || 0,
            Date: row.date,
            TreasuryCode: row.treasury_code || '',
            FormType: row.form_type || '',
            Description: row.description || '',
            Status: this.normalizeStatus(row.status),
            Type: row.type || 'ThanhToanKLHT',
            ContractNumber: row.contract_number || '',
            CumulativeBefore: Number(row.cumulative_before) || 0,
            AdvanceBalance: Number(row.advance_balance) || 0,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // GLOBAL FETCHERS (Summary page)
    // ═══════════════════════════════════════════════════════════

    /**
     * Compute real disbursed amount (Advanced - Recovered + Completion)
     */
    static calculateTrueDisbursed(disbursements: any[]): number {
        const valid = disbursements.filter(d => {
            const status = (d.status || d.Status || '').toLowerCase();
            return status === 'approved' || status === 'completed';
        });
        
        const advance = valid.filter(d => (d.type || d.Type) === 'TamUng').reduce((s, d) => s + Number(d.amount || d.Amount || 0), 0);
        const recovered = valid.filter(d => (d.type || d.Type) === 'ThuHoiTamUng').reduce((s, d) => s + Number(d.amount || d.Amount || 0), 0);
        const completion = valid.filter(d => ['ThanhToanKLHT', 'ThanhToanTT'].includes(d.type || d.Type)).reduce((s, d) => s + Number(d.amount || d.Amount || 0), 0);
        
        return advance + completion - recovered;
    }

    /**
     * [SINGLE SOURCE OF TRUTH] Get project capital summary — used by both
     * ProjectCapitalTab and MidTermCapitalPage to avoid dual data model.
     * 
     * Logic ưu tiên:
     * 1. Nếu có disbursements records → tính từ disbursements (chính xác nhất)
     * 2. Nếu không có disbursements → dùng capital_plans.disbursed_amount (dữ liệu import)
     * 
     * Điều này đảm bảo dữ liệu import từ Excel vẫn hiển thị đúng ngay cả khi
     * chưa có giao dịch giải ngân chi tiết nào.
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
            (supabase as any).from('disbursement_plans').select('*').eq('project_id', projectId).order('year').order('month'),
            supabase.from('projects').select('total_investment').eq('project_id', projectId).maybeSingle(),
        ]);

        const capitalPlans: CapitalPlan[] = (plansRes.data || []).map(this.mapCapitalPlan.bind(this));
        const rawDisbs = disbRes.data || [];

        const normalizeStatus = (s: string): 'Pending' | 'Approved' | 'Rejected' => {
            const lower = (s || '').toLowerCase();
            if (lower === 'approved' || lower === 'completed') return 'Approved';
            if (lower === 'pending') return 'Pending';
            return 'Rejected';
        };

        const disbursements: Disbursement[] = rawDisbs.map((row: any) => ({
            DisbursementID: row.disbursement_id,
            ProjectID: row.project_id,
            CapitalPlanID: row.capital_plan_id || undefined,
            AllocationID: row.capital_plan_id || undefined,
            PaymentID: row.payment_id || undefined,
            Amount: Number(row.amount) || 0,
            Date: row.date,
            TreasuryCode: row.treasury_code || '',
            FormType: row.form_type || '',
            Description: row.description || '',
            Status: normalizeStatus(row.status),
            Type: row.type || 'ThanhToanKLHT',
            ContractNumber: row.contract_number || '',
            CumulativeBefore: Number(row.cumulative_before) || 0,
            AdvanceBalance: Number(row.advance_balance) || 0,
        }));

        const disbursementPlans: DisbursementPlanItem[] = (disbPlanRes.data || []).map(this.mapDisbursementPlan.bind(this));

        // === CORE LOGIC: Tính disbursed_amount cho từng capital plan ===
        // Ưu tiên 1: disbursements table (giao dịch chi tiết)
        // Ưu tiên 2: capital_plans.disbursed_amount (dữ liệu import tổng hợp)
        const hasDetailedDisbursements = disbursements.length > 0;

        capitalPlans.forEach(plan => {
            if (hasDetailedDisbursements) {
                // Tính từ disbursements chi tiết
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
                    plan.DisbursedAmount = this.calculateTrueDisbursed(relatedDisbs);
                }
                // Nếu không có disbursements cho plan này → giữ nguyên DB value (import snapshot)
            }
            // Nếu không có disbursements table data → dùng capital_plans.disbursed_amount (đã được map sẵn)
        });

        // Compute actual amount for monthly disbursement plans based on true disbursements
        if (hasDetailedDisbursements) {
            // Cập nhật các plan đã có
            disbursementPlans.forEach(dPlan => {
                const monthlyDisbs = disbursements.filter(d => {
                    if (!d.Date) return false;
                    const date = new Date(d.Date);
                    return date.getFullYear() === dPlan.Year && (date.getMonth() + 1) === dPlan.Month;
                });
                if (monthlyDisbs.length > 0) {
                    dPlan.ActualAmount = this.calculateTrueDisbursed(monthlyDisbs);
                } else {
                    dPlan.ActualAmount = 0; // Override DB value nếu không có giải ngân thực tế trong tháng này
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
                    const actual = this.calculateTrueDisbursed(monthlyDisbs);
                    if (actual !== 0) { // Tạo record ảo nếu có thay đổi thực tế
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
            totalDisbursed = this.calculateTrueDisbursed(disbursements);
            totalAdvance = disbursements.filter(d => d.Type === 'TamUng' && d.Status === 'Approved').reduce((s, d) => s + d.Amount, 0);
            advanceRecovered = disbursements.filter(d => d.Type === 'ThuHoiTamUng' && d.Status === 'Approved').reduce((s, d) => s + d.Amount, 0);
            completionPayment = disbursements.filter(d => (d.Type === 'ThanhToanKLHT' || (d.Type as any) === 'ThanhToanTT') && d.Status === 'Approved').reduce((s, d) => s + d.Amount, 0);
        } else {
            // Dùng tổng hợp từ capital_plans.disbursed_amount
            totalDisbursed = annualPlans.reduce((s, p) => s + (p.DisbursedAmount || 0), 0);
            totalAdvance = 0;
            advanceRecovered = 0;
            completionPayment = totalDisbursed;
        }

        const currentYear = new Date().getFullYear();
        const yearlyTarget = annualPlans.filter(p => p.Year === currentYear).reduce((s, p) => s + (p.Amount || 0), 0);
        const yearlyDisbursed = hasDetailedDisbursements
            ? this.calculateTrueDisbursed(disbursements.filter(d => new Date(d.Date).getFullYear() === currentYear))
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
            // Find related disbursements for this plan
            // For annual plans, match by year. For mid-term, match by period_start/period_end.
            let relatedDisbs = [];
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
                disbursed_amount: relatedDisbs.length > 0 ? this.calculateTrueDisbursed(relatedDisbs) : (Number(p.disbursed_amount) || 0)
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
