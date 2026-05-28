// Capital Service - Supabase CRUD operations (Facade Pattern)
import { CapitalPlan, Disbursement, CapitalPlanRow, DisbursementPlanRow, DisbursementRow } from '../types';
import { CapitalMapper } from './capital/CapitalMapper';
import { CapitalPlanService } from './capital/CapitalPlanService';
import { DisbursementService } from './capital/DisbursementService';
import { CapitalOverviewService, DisbursementAlert } from './capital/CapitalOverviewService';

export type { DisbursementAlert };

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
    static getDisbursementPlans(projectId: string): Promise<DisbursementPlanItem[]> {
        return DisbursementService.getDisbursementPlans(projectId);
    }

    static createDisbursementPlan(plan: Omit<DisbursementPlanItem, 'Id'>): Promise<DisbursementPlanItem> {
        return DisbursementService.createDisbursementPlan(plan);
    }

    static bulkSaveDisbursementPlans(projectId: string, year: number, plans: { id?: string, month: number, plannedAmount: number, actualAmount: number, notes: string }[]): Promise<void> {
        return DisbursementService.bulkSaveDisbursementPlans(projectId, year, plans);
    }

    static updateDisbursementPlan(id: string, updates: Partial<DisbursementPlanItem>): Promise<DisbursementPlanItem> {
        return DisbursementService.updateDisbursementPlan(id, updates);
    }

    static deleteDisbursementPlan(id: string): Promise<void> {
        return DisbursementService.deleteDisbursementPlan(id);
    }

    // ═══════════════════════════════════════════════════════════
    // CAPITAL PLANS — CRUD
    // ═══════════════════════════════════════════════════════════
    static getCapitalPlans(projectId: string): Promise<CapitalPlan[]> {
        return CapitalPlanService.getCapitalPlans(projectId);
    }

    static createCapitalPlan(plan: Omit<CapitalPlan, 'PlanID'>): Promise<CapitalPlan> {
        return CapitalPlanService.createCapitalPlan(plan);
    }

    static updateCapitalPlan(planId: string, updates: Partial<CapitalPlan>): Promise<CapitalPlan> {
        return CapitalPlanService.updateCapitalPlan(planId, updates);
    }

    static deleteCapitalPlan(planId: string): Promise<void> {
        return CapitalPlanService.deleteCapitalPlan(planId);
    }

    // ═══════════════════════════════════════════════════════════
    // DISBURSEMENTS — CRUD
    // ═══════════════════════════════════════════════════════════
    static getDisbursements(projectId: string): Promise<Disbursement[]> {
        return DisbursementService.getDisbursements(projectId);
    }

    static createDisbursement(d: Omit<Disbursement, 'DisbursementID'>): Promise<Disbursement> {
        return DisbursementService.createDisbursement(d);
    }

    static updateDisbursement(id: string, updates: Partial<Disbursement>): Promise<Disbursement> {
        return DisbursementService.updateDisbursement(id, updates);
    }

    static deleteDisbursement(id: string): Promise<void> {
        return DisbursementService.deleteDisbursement(id);
    }

    // ═══════════════════════════════════════════════════════════
    // STATISTICS & ALERTS
    // ═══════════════════════════════════════════════════════════
    static getFinancialStats(projectId: string) {
        return CapitalOverviewService.getFinancialStats(projectId);
    }

    static getAlerts(projectId: string): Promise<DisbursementAlert[]> {
        return CapitalOverviewService.getAlerts(projectId);
    }

    // ═══════════════════════════════════════════════════════════
    // GLOBAL FETCHERS & CALCULATIONS
    // ═══════════════════════════════════════════════════════════
    static calculateTrueDisbursed(disbursements: any[]): number {
        return CapitalMapper.calculateTrueDisbursed(disbursements);
    }

    static getProjectCapitalSummary(projectId: string): Promise<{
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
            totalLuyKeNghiemThu: number;
        };
    }> {
        return CapitalOverviewService.getProjectCapitalSummary(projectId);
    }

    static fetchAllCapitalPlans(): Promise<CapitalPlanRow[]> {
        return CapitalOverviewService.fetchAllCapitalPlans();
    }

    static fetchAllDisbursementPlans(): Promise<DisbursementPlanRow[]> {
        return CapitalOverviewService.fetchAllDisbursementPlans();
    }

    static fetchAllDisbursements(): Promise<DisbursementRow[]> {
        return CapitalOverviewService.fetchAllDisbursements();
    }
}
