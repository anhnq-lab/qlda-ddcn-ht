// Settlement & Acceptance Service - Supabase CRUD operations
import { supabase } from '../lib/supabase';

// ============================================================
// TYPES
// ============================================================

export interface AcceptanceRecord {
    id: string;
    contractId: string;
    acceptanceType: 'partial' | 'final';
    acceptanceDate: string;
    description: string;
    qualityRating: 'passed' | 'conditional' | 'failed';
    inspector: string;
    notes: string;
    createdAt?: string;
}

export interface SettlementRecord {
    id: string;
    contractId: string;
    settlementValue: number;
    settlementDate: string;
    decisionNumber: string;
    retentionAmount: number;
    warrantyMonths: number;
    warrantyStartDate: string;
    warrantyEndDate: string;
    warrantyStatus: 'pending' | 'active' | 'expired' | 'released';
    status: 'pending' | 'approved' | 'completed';
    notes: string;
    createdAt?: string;
}

// ============================================================
// DB MAPPERS
// ============================================================

const dbToAcceptance = (row: any): AcceptanceRecord => ({
    id: row.id,
    contractId: row.contract_id,
    acceptanceType: row.acceptance_type || 'partial',
    acceptanceDate: row.acceptance_date || '',
    description: row.description || '',
    qualityRating: row.quality_rating || 'passed',
    inspector: row.inspector || '',
    notes: row.notes || '',
    createdAt: row.created_at,
});

const acceptanceToDb = (r: Partial<AcceptanceRecord>) => ({
    ...(r.contractId !== undefined && { contract_id: r.contractId }),
    ...(r.acceptanceType !== undefined && { acceptance_type: r.acceptanceType }),
    ...(r.acceptanceDate !== undefined && { acceptance_date: r.acceptanceDate }),
    ...(r.description !== undefined && { description: r.description }),
    ...(r.qualityRating !== undefined && { quality_rating: r.qualityRating }),
    ...(r.inspector !== undefined && { inspector: r.inspector }),
    ...(r.notes !== undefined && { notes: r.notes }),
});

const dbToSettlement = (row: any): SettlementRecord => ({
    id: row.id,
    contractId: row.contract_id,
    settlementValue: Number(row.settlement_value) || 0,
    settlementDate: row.settlement_date || '',
    decisionNumber: row.decision_number || '',
    retentionAmount: Number(row.retention_amount) || 0,
    warrantyMonths: row.warranty_months || 12,
    warrantyStartDate: row.warranty_start_date || '',
    warrantyEndDate: row.warranty_end_date || '',
    warrantyStatus: row.warranty_status || 'pending',
    status: row.status || 'pending',
    notes: row.notes || '',
    createdAt: row.created_at,
});

const settlementToDb = (r: Partial<SettlementRecord>) => ({
    ...(r.contractId !== undefined && { contract_id: r.contractId }),
    ...(r.settlementValue !== undefined && { settlement_value: r.settlementValue }),
    ...(r.settlementDate !== undefined && { settlement_date: r.settlementDate }),
    ...(r.decisionNumber !== undefined && { decision_number: r.decisionNumber }),
    ...(r.retentionAmount !== undefined && { retention_amount: r.retentionAmount }),
    ...(r.warrantyMonths !== undefined && { warranty_months: r.warrantyMonths }),
    ...(r.warrantyStartDate !== undefined && { warranty_start_date: r.warrantyStartDate }),
    ...(r.warrantyEndDate !== undefined && { warranty_end_date: r.warrantyEndDate }),
    ...(r.warrantyStatus !== undefined && { warranty_status: r.warrantyStatus }),
    ...(r.status !== undefined && { status: r.status }),
    ...(r.notes !== undefined && { notes: r.notes }),
});

// ============================================================
// ACCEPTANCE SERVICE
// ============================================================

export class AcceptanceService {
    static async getByContractId(contractId: string): Promise<AcceptanceRecord[]> {
        const { data, error } = await (supabase as any)
            .from('acceptance_records')
            .select('*')
            .eq('contract_id', contractId)
            .order('acceptance_date', { ascending: true });
        if (error) throw new Error(`Failed to fetch acceptance records: ${error.message}`);
        return (data || []).map(dbToAcceptance);
    }

    static async create(record: Partial<AcceptanceRecord>): Promise<AcceptanceRecord> {
        const { data, error } = await (supabase as any)
            .from('acceptance_records')
            .insert(acceptanceToDb(record))
            .select()
            .single();
        if (error) throw new Error(`Failed to create acceptance record: ${error.message}`);
        return dbToAcceptance(data);
    }

    static async update(id: string, record: Partial<AcceptanceRecord>): Promise<AcceptanceRecord> {
        const { data, error } = await (supabase as any)
            .from('acceptance_records')
            .update(acceptanceToDb(record))
            .eq('id', id)
            .select()
            .single();
        if (error) throw new Error(`Failed to update acceptance record: ${error.message}`);
        return dbToAcceptance(data);
    }

    static async delete(id: string): Promise<void> {
        const { error } = await (supabase as any)
            .from('acceptance_records')
            .delete()
            .eq('id', id);
        if (error) throw new Error(`Failed to delete acceptance record: ${error.message}`);
    }
}

// ============================================================
// SETTLEMENT SERVICE
// ============================================================

export class SettlementService {
    static async getByContractId(contractId: string): Promise<SettlementRecord | null> {
        const { data, error } = await (supabase as any)
            .from('settlement_records')
            .select('*')
            .eq('contract_id', contractId)
            .maybeSingle();
        if (error) throw new Error(`Failed to fetch settlement record: ${error.message}`);
        return data ? dbToSettlement(data) : null;
    }

    static async upsert(record: Partial<SettlementRecord>): Promise<SettlementRecord> {
        // Check if exists
        if (record.contractId) {
            const existing = await this.getByContractId(record.contractId);
            if (existing) {
                return this.update(existing.id, record);
            }
        }
        return this.create(record);
    }

    static async create(record: Partial<SettlementRecord>): Promise<SettlementRecord> {
        const { data, error } = await (supabase as any)
            .from('settlement_records')
            .insert(settlementToDb(record))
            .select()
            .single();
        if (error) throw new Error(`Failed to create settlement record: ${error.message}`);
        return dbToSettlement(data);
    }

    static async update(id: string, record: Partial<SettlementRecord>): Promise<SettlementRecord> {
        const { data, error } = await (supabase as any)
            .from('settlement_records')
            .update(settlementToDb(record))
            .eq('id', id)
            .select()
            .single();
        if (error) throw new Error(`Failed to update settlement record: ${error.message}`);
        return dbToSettlement(data);
    }

    static async delete(id: string): Promise<void> {
        const { error } = await (supabase as any)
            .from('settlement_records')
            .delete()
            .eq('id', id);
        if (error) throw new Error(`Failed to delete settlement record: ${error.message}`);
    }
}
