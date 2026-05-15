// Payment Service - Supabase CRUD + Approval Workflow
import { supabase } from '../lib/supabase';
import { dbToPayment, paymentToDb } from '../lib/dbMappers';
import { Payment, PaymentType, PaymentStatus } from '../types';
import type { QueryParams } from '../types/api';

// ============================================================
// STATUS TRANSITION MAP
// ============================================================

/**
 * Valid status transitions:
 *   Draft    → Pending | Rejected
 *   Pending  → Approved | Rejected
 *   Approved → Transferred | Rejected
 *   Rejected → Draft (revert to fix & resubmit)
 */
const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
    [PaymentStatus.Draft]: [PaymentStatus.Pending],
    [PaymentStatus.Pending]: [PaymentStatus.Approved, PaymentStatus.Rejected],
    [PaymentStatus.Approved]: [PaymentStatus.Transferred, PaymentStatus.Rejected],
    [PaymentStatus.Transferred]: [],
    [PaymentStatus.Rejected]: [PaymentStatus.Draft],
};

export class PaymentService {
    // ============================================================
    // CRUD
    // ============================================================

    /**
     * Get all payments with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Payment[]> {
        let query = supabase.from('payments').select('*');

        if (params?.filters?.contractId) {
            query = query.eq('contract_id', params.filters.contractId);
        }

        if (params?.filters?.type) {
            query = query.eq('type', params.filters.type);
        }

        if (params?.filters?.status) {
            query = query.eq('status', params.filters.status);
        }

        const { data, error } = await query.order('batch_no', { ascending: true });
        if (error) throw new Error(`Failed to fetch payments: ${error.message}`);
        return (data || []).map(dbToPayment);
    }

    /**
     * Get a single payment by ID
     */
    static async getById(id: number): Promise<Payment | undefined> {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('payment_id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined;
            throw new Error(`Failed to fetch payment: ${error.message}`);
        }
        return data ? dbToPayment(data) : undefined;
    }

    /**
     * Get payments by contract ID
     */
    static async getByContractId(contractId: string): Promise<Payment[]> {
        return this.getAll({ filters: { contractId } });
    }

    /**
     * Create a new payment — always starts as Draft
     */
    static async create(paymentData: Partial<Payment>): Promise<Payment> {
        // Get next batch number for this contract
        let nextBatch = 1;
        if (paymentData.ContractID) {
            const { data: existingPayments } = await supabase
                .from('payments')
                .select('batch_no')
                .eq('contract_id', paymentData.ContractID)
                .order('batch_no', { ascending: false })
                .limit(1);

            if (existingPayments && existingPayments.length > 0) {
                nextBatch = existingPayments[0].batch_no + 1;
            }
        }

        const insertData = paymentToDb({
            ContractID: paymentData.ContractID || '',
            BatchNo: paymentData.BatchNo || nextBatch,
            Type: paymentData.Type || PaymentType.Volume,
            Amount: paymentData.Amount || 0,
            Status: PaymentStatus.Draft, // Always start as Draft
            Description: paymentData.Description || '',
            RequestDate: paymentData.RequestDate || '',
            TreasuryRef: paymentData.TreasuryRef || '',
            ProjectID: paymentData.ProjectID || '',
        });

        const { data, error } = await supabase
            .from('payments')
            .insert(insertData as any)
            .select()
            .single();

        if (error) throw new Error(`Failed to create payment: ${error.message}`);
        return dbToPayment(data);
    }

    /**
     * Update an existing payment (only allowed for Draft/Rejected)
     */
    static async update(id: number, data: Partial<Payment>): Promise<Payment> {
        const existing = await this.getById(id);
        if (!existing) throw new Error('Payment not found');

        if (existing.Status !== PaymentStatus.Draft && existing.Status !== PaymentStatus.Rejected) {
            throw new Error(`Không thể chỉnh sửa phiếu thanh toán ở trạng thái "${this.getStatusLabel(existing.Status)}"`);
        }

        const updateData = paymentToDb(data);
        const { data: updated, error } = await supabase
            .from('payments')
            .update(updateData)
            .eq('payment_id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update payment: ${error.message}`);
        return dbToPayment(updated);
    }

    /**
     * Delete a payment (only allowed for Draft/Rejected)
     */
    static async delete(id: number): Promise<void> {
        const existing = await this.getById(id);
        if (!existing) throw new Error('Payment not found');

        if (existing.Status === PaymentStatus.Approved || existing.Status === PaymentStatus.Transferred) {
            throw new Error(`Không thể xóa phiếu thanh toán đã ${this.getStatusLabel(existing.Status).toLowerCase()}`);
        }

        const { error } = await supabase
            .from('payments')
            .delete()
            .eq('payment_id', id);

        if (error) throw new Error(`Failed to delete payment: ${error.message}`);
    }

    // ============================================================
    // APPROVAL WORKFLOW
    // ============================================================

    /**
     * Submit payment for approval: Draft → Pending
     */
    static async submitForApproval(id: number): Promise<Payment> {
        return this.transitionStatus(id, PaymentStatus.Pending, {
            RequestDate: new Date().toISOString().split('T')[0],
            // Clear previous rejection if resubmitting
            RejectedReason: '',
            RejectedBy: '',
            RejectedDate: '',
        });
    }

    /**
     * Approve payment: Pending → Approved
     */
    static async approve(id: number, approvedBy: string): Promise<Payment> {
        return this.transitionStatus(id, PaymentStatus.Approved, {
            ApprovedDate: new Date().toISOString().split('T')[0],
            ApprovedBy: approvedBy,
        });
    }

    /**
     * Mark payment as transferred: Approved → Transferred
     */
    static async markTransferred(id: number, treasuryRef?: string): Promise<Payment> {
        return this.transitionStatus(id, PaymentStatus.Transferred, {
            PaidDate: new Date().toISOString().split('T')[0],
            ...(treasuryRef && { TreasuryRef: treasuryRef }),
        });
    }

    /**
     * Reject a payment: Pending|Approved → Rejected
     */
    static async reject(id: number, rejectedBy: string, reason: string): Promise<Payment> {
        if (!reason?.trim()) throw new Error('Vui lòng nhập lý do từ chối');
        return this.transitionStatus(id, PaymentStatus.Rejected, {
            RejectedBy: rejectedBy,
            RejectedReason: reason.trim(),
            RejectedDate: new Date().toISOString().split('T')[0],
        });
    }

    /**
     * Revert rejected payment to draft: Rejected → Draft
     */
    static async revertToDraft(id: number): Promise<Payment> {
        return this.transitionStatus(id, PaymentStatus.Draft, {
            RejectedReason: '',
            RejectedBy: '',
            RejectedDate: '',
        });
    }

    // ============================================================
    // STATUS HELPERS
    // ============================================================

    /**
     * Core transition logic with validation
     */
    private static async transitionStatus(
        id: number,
        targetStatus: PaymentStatus,
        extraData: Partial<Payment> = {}
    ): Promise<Payment> {
        const existing = await this.getById(id);
        if (!existing) throw new Error('Không tìm thấy phiếu thanh toán');

        const validTargets = VALID_TRANSITIONS[existing.Status] || [];
        if (!validTargets.includes(targetStatus)) {
            throw new Error(
                `Không thể chuyển từ "${this.getStatusLabel(existing.Status)}" sang "${this.getStatusLabel(targetStatus)}"`
            );
        }

        const updateData = paymentToDb({
            Status: targetStatus,
            ...extraData,
        });

        const { data, error } = await supabase
            .from('payments')
            .update(updateData)
            .eq('payment_id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to transition payment: ${error.message}`);
        return dbToPayment(data);
    }

    /**
     * Get available next statuses for a payment
     */
    static getAvailableTransitions(status: PaymentStatus): PaymentStatus[] {
        return VALID_TRANSITIONS[status] || [];
    }

    static async getContractPaymentStats(contractId: string): Promise<{
        totalPaid: number;
        totalPending: number;
        totalApproved: number;
        paymentCount: number;
        advanceAmount: number;
        volumeAmount: number;
    }> {
        // Fetch only the necessary fields
        const { data: payments, error } = await supabase
            .from('payments')
            .select('amount, status, type')
            .eq('contract_id', contractId);
            
        if (error) throw new Error(`Failed to fetch payment stats: ${error.message}`);

        let totalPaid = 0;
        let totalPending = 0;
        let totalApproved = 0;
        let advanceAmount = 0;
        let volumeAmount = 0;

        (payments || []).forEach(p => {
            const amt = Number(p.amount) || 0;
            const status = this.normalizeStatusForStats(p.status);
            const type = this.normalizeTypeForStats(p.type);

            if (status === PaymentStatus.Transferred) {
                totalPaid += amt;
            } else if (status === PaymentStatus.Approved) {
                totalApproved += amt;
            } else if (status === PaymentStatus.Pending || status === PaymentStatus.Draft) {
                totalPending += amt;
            }

            if (type === PaymentType.Advance) {
                advanceAmount += amt;
            } else {
                volumeAmount += amt;
            }
        });

        return {
            totalPaid,
            totalPending,
            totalApproved,
            paymentCount: (payments || []).length,
            advanceAmount,
            volumeAmount,
        };
    }

    private static normalizeStatusForStats(dbStatus: string | number): PaymentStatus {
        if (typeof dbStatus === 'number') return dbStatus as unknown as PaymentStatus;
        if (!dbStatus) return PaymentStatus.Draft;
        const normalized = dbStatus.toString().toLowerCase();
        if (normalized.includes('draft') || normalized === 'nháp') return PaymentStatus.Draft;
        if (normalized.includes('pending') || normalized === 'chờ duyệt') return PaymentStatus.Pending;
        if (normalized.includes('approve') || normalized === 'đã duyệt') return PaymentStatus.Approved;
        if (normalized.includes('transfer') || normalized === 'đã chuyển tiền') return PaymentStatus.Transferred;
        if (normalized.includes('reject') || normalized === 'từ chối') return PaymentStatus.Rejected;
        
        switch (dbStatus) {
            case PaymentStatus.Draft: return PaymentStatus.Draft;
            case PaymentStatus.Pending: return PaymentStatus.Pending;
            case PaymentStatus.Approved: return PaymentStatus.Approved;
            case PaymentStatus.Transferred: return PaymentStatus.Transferred;
            case PaymentStatus.Rejected: return PaymentStatus.Rejected;
        }
        return PaymentStatus.Draft;
    }

    private static normalizeTypeForStats(dbType: string | number): PaymentType {
        if (typeof dbType === 'number') return dbType as unknown as PaymentType;
        if (!dbType) return PaymentType.Volume;
        const normalized = dbType.toString().toLowerCase();
        if (normalized.includes('advance') || normalized === 'tạm ứng') return PaymentType.Advance;
        if (normalized.includes('volume') || normalized === 'thanh toán khối lượng') return PaymentType.Volume;

        return dbType === PaymentType.Advance || dbType === 'TamUng' ? PaymentType.Advance : PaymentType.Volume;
    }

    // ============================================================
    // LABEL HELPERS
    // ============================================================

    static getTypeLabel(type: PaymentType): string {
        return type === PaymentType.Advance ? 'Tạm ứng' : 'Thanh toán khối lượng';
    }

    static getStatusLabel(status: PaymentStatus): string {
        const labels: Record<PaymentStatus, string> = {
            [PaymentStatus.Draft]: 'Nháp',
            [PaymentStatus.Pending]: 'Chờ duyệt',
            [PaymentStatus.Approved]: 'Đã duyệt',
            [PaymentStatus.Transferred]: 'Đã chuyển tiền',
            [PaymentStatus.Rejected]: 'Từ chối',
        };
        return labels[status] || status;
    }

    static getStatusColor(status: PaymentStatus): { bg: string; text: string; ring: string; darkBg: string; darkText: string; darkRing: string } {
        const colors: Record<PaymentStatus, { bg: string; text: string; ring: string; darkBg: string; darkText: string; darkRing: string }> = {
            [PaymentStatus.Draft]: { bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-200', darkBg: 'dark:bg-slate-800', darkText: 'dark:text-slate-400', darkRing: 'dark:ring-slate-600' },
            [PaymentStatus.Pending]: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-300', darkRing: 'dark:ring-amber-900' },
            [PaymentStatus.Approved]: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-100', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-300', darkRing: 'dark:ring-blue-900' },
            [PaymentStatus.Transferred]: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-300', darkRing: 'dark:ring-emerald-900' },
            [PaymentStatus.Rejected]: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-100', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-300', darkRing: 'dark:ring-red-900' },
        };
        return colors[status] || colors[PaymentStatus.Draft];
    }
}

export default PaymentService;
