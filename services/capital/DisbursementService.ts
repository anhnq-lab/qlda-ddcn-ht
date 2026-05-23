import { supabase } from '../../lib/supabase';
import { Disbursement, DisbursementPlanItem } from '../../types';
import { toServiceError } from '../ServiceError';
import { CapitalMapper } from './CapitalMapper';

export class DisbursementService {
    // ═══════════════════════════════════════════════════════════
    // MONTHLY DISBURSEMENT PLANS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get Monthly Disbursement Plans for Project
     */
    static async getDisbursementPlans(projectId: string): Promise<DisbursementPlanItem[]> {
        const { data, error } = await supabase
            .from('disbursement_plans')
            .select('*')
            .eq('project_id', projectId)
            .order('year', { ascending: true })
            .order('month', { ascending: true });

        if (error) throw toServiceError(error, 'Không thể tải kế hoạch giải ngân');
        return (data || []).map(CapitalMapper.mapDisbursementPlan);
    }

    /**
     * Create a new Monthly Disbursement Plan
     */
    static async createDisbursementPlan(plan: Omit<DisbursementPlanItem, 'Id'>): Promise<DisbursementPlanItem> {
        const { data, error } = await supabase
            .from('disbursement_plans')
            .insert({
                id: `DP-${crypto.randomUUID().slice(0, 8)}`,
                project_id: plan.ProjectID,
                year: plan.Year,
                month: plan.Month,
                planned_amount: plan.PlannedAmount || 0,
                actual_amount: plan.ActualAmount || 0,
                notes: plan.Notes || null,
            })
            .select()
            .single();

        if (error) throw toServiceError(error, 'Không thể tạo kế hoạch giải ngân');
        return CapitalMapper.mapDisbursementPlan(data);
    }

    /**
     * Save Monthly Disbursement Plans in bulk
     */
    static async bulkSaveDisbursementPlans(projectId: string, year: number, plans: { id?: string, month: number, plannedAmount: number, actualAmount: number, notes: string }[]): Promise<void> {
        // First delete all plans for this project and year
        const { error: deleteError } = await supabase
            .from('disbursement_plans')
            .delete()
            .eq('project_id', projectId)
            .eq('year', year);
            
        if (deleteError) throw toServiceError(deleteError, 'Không thể xóa kế hoạch cũ');

        const newPlans = plans
            .filter(p => p.plannedAmount > 0 || p.actualAmount > 0 || p.notes)
            .map(p => ({
                id: p.id || `DP-${crypto.randomUUID().slice(0, 8)}-${p.month}`,
                project_id: projectId,
                year: year,
                month: p.month,
                planned_amount: p.plannedAmount,
                actual_amount: p.actualAmount,
                notes: p.notes || null,
            }));

        if (newPlans.length > 0) {
            const { error: insertError } = await supabase
                .from('disbursement_plans')
                .insert(newPlans);
            if (insertError) throw toServiceError(insertError, 'Không thể lưu kế hoạch giải ngân');
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

        if (error) throw toServiceError(error, 'Không thể cập nhật kế hoạch giải ngân');
        return CapitalMapper.mapDisbursementPlan(data);
    }

    /**
     * Delete a Monthly Disbursement Plan
     */
    static async deleteDisbursementPlan(id: string): Promise<void> {
        const { error } = await supabase
            .from('disbursement_plans')
            .delete()
            .eq('id', id);

        if (error) throw toServiceError(error, 'Không thể xóa kế hoạch giải ngân');
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

        if (error) throw toServiceError(error, 'Không thể tải giải ngân');
        return (data || []).map(CapitalMapper.mapDisbursement);
    }

    /**
     * Create a new Disbursement
     */
    static async createDisbursement(d: Omit<Disbursement, 'DisbursementID'>): Promise<Disbursement> {
        const { data, error } = await supabase
            .from('disbursements')
            .insert({
                disbursement_id: `GN-${crypto.randomUUID().slice(0, 8)}`,
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

        if (error) throw toServiceError(error, 'Không thể tạo giải ngân');
        return CapitalMapper.mapDisbursement(data);
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

        if (error) throw toServiceError(error, 'Không thể cập nhật giải ngân');
        return CapitalMapper.mapDisbursement(data);
    }

    /**
     * Delete a Disbursement
     */
    static async deleteDisbursement(id: string): Promise<void> {
        const { error } = await supabase
            .from('disbursements')
            .delete()
            .eq('disbursement_id', id);

        if (error) throw toServiceError(error, 'Không thể xóa giải ngân');
    }
}
