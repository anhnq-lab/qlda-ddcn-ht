import { supabase } from '../../lib/supabase';
import { CapitalPlan } from '../../types';
import { toServiceError } from '../ServiceError';
import { CapitalMapper } from './CapitalMapper';

export class CapitalPlanService {
    /**
     * Get Capital Plans for Project
     */
    static async getCapitalPlans(projectId: string): Promise<CapitalPlan[]> {
        const { data, error } = await supabase
            .from('capital_plans')
            .select('*')
            .eq('project_id', projectId)
            .order('year', { ascending: false });

        if (error) throw toServiceError(error, 'Không thể tải kế hoạch vốn');
        return (data || []).map(CapitalMapper.mapCapitalPlan);
    }

    /**
     * Create a new Capital Plan
     */
    static async createCapitalPlan(plan: Omit<CapitalPlan, 'PlanID'>): Promise<CapitalPlan> {
        const prefix = plan.PlanType === 'mid_term' ? 'MT' : 'CP';
        const { data, error } = await supabase
            .from('capital_plans')
            .insert({
                plan_id: `${prefix}-${crypto.randomUUID().slice(0, 8)}`,
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

        if (error) throw toServiceError(error, 'Không thể tạo kế hoạch vốn');
        return CapitalMapper.mapCapitalPlan(data);
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

        if (error) throw toServiceError(error, 'Không thể cập nhật kế hoạch vốn');
        return CapitalMapper.mapCapitalPlan(data);
    }

    /**
     * Delete a Capital Plan
     */
    static async deleteCapitalPlan(planId: string): Promise<void> {
        const { error } = await supabase
            .from('capital_plans')
            .delete()
            .eq('plan_id', planId);

        if (error) throw toServiceError(error, 'Không thể xóa kế hoạch vốn');
    }
}
