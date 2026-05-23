import { CapitalPlan, Disbursement, DisbursementPlanItem } from '../../types';

export class CapitalMapper {
    static mapCapitalPlan(row: any): CapitalPlan {
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

    static mapDisbursementPlan(row: any): DisbursementPlanItem {
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

    static normalizeStatus(s: string): 'Pending' | 'Approved' | 'Rejected' {
        const lower = (s || '').toLowerCase();
        if (lower === 'approved' || lower === 'completed') return 'Approved';
        if (lower === 'pending') return 'Pending';
        return 'Rejected';
    }

    static mapDisbursement(row: any): Disbursement {
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
}
