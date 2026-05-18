// Project Service - Supabase CRUD operations
import { supabase } from '../lib/supabase';
import { dbToProject, projectToDb, dbToBiddingPackage, dbToCapitalAllocation, dbToProcurementPlan, procurementPlanToDb, biddingPackageToDb } from '../lib/dbMappers';
import { Project, ProjectStatus, ProjectGroup, BiddingPackage, ProcurementPlan, CapitalAllocation, Disbursement } from '../types';
import type { QueryParams } from '../types/api';
import { CapitalService } from './CapitalService';
import { ServiceError, toServiceError } from './ServiceError';

/**
 * Retry with exponential backoff for transient failures.
 * Only retries network/timeout errors (not auth/validation).
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 2,
    baseDelay = 500
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const svcError = toServiceError(error);
            // Only retry transient errors
            if (!svcError.isNetworkError && svcError.code !== 'TIMEOUT') throw svcError;
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
            }
        }
    }
    throw toServiceError(lastError);
}

export class ProjectService {
    /**
     * Default page size for paginated queries
     */
    static readonly DEFAULT_PAGE_SIZE = 50;

    /**
     * Get all projects — LEGACY (fetches everything, used by non-list consumers)
     * Prefer getPaginated() for list views with 200+ users.
     */
    static async getAll(params?: QueryParams): Promise<Project[]> {
        let query = supabase.from('projects').select('*');
        query = this._applyFilters(query, params);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw toServiceError(error, 'Không thể tải danh sách dự án');
        return (data || []).map(dbToProject);
    }

    /**
     * Get projects with server-side pagination, filtering, and sorting.
     * Returns paginated response with exact total count.
     */
    static async getPaginated(params?: QueryParams): Promise<{
        data: Project[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        return withRetry(async () => {
            const page = params?.page || 1;
            const pageSize = params?.pageSize || this.DEFAULT_PAGE_SIZE;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            // Use exact count to get total without fetching all rows
            let query = supabase.from('projects').select('*', { count: 'exact' });
            query = this._applyFilters(query, params);

            // Sort
            const sortBy = params?.sortBy || 'created_at';
            const sortOrder = params?.sortOrder || 'desc';
            const sortColumnMap: Record<string, string> = {
                name: 'project_name',
                budget: 'total_investment',
                progress: 'progress',
                created: 'created_at',
                created_at: 'created_at',
                project_name: 'project_name',
                total_investment: 'total_investment',
            };
            const dbSortColumn = sortColumnMap[sortBy] || 'created_at';
            query = query.order(dbSortColumn, { ascending: sortOrder === 'asc' });

            // Paginate
            query = query.range(from, to);

            const { data, error, count } = await query;
            if (error) throw toServiceError(error, 'Không thể tải danh sách dự án');

            const total = count || 0;
            return {
                data: (data || []).map(dbToProject),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        });
    }

    /**
     * Get aggregate statistics for projects to display badges with project counts in the UI filters.
     * Implements faceted search counting by fetching raw data and calculating counts based on active filters.
     */
    static async getStats(params?: QueryParams): Promise<{ 
        statusCounts: Record<number, number>; 
        currentStatusCounts: Record<number, number>; 
        groupCounts: Record<string, number>;
        boardCounts: Record<string, number>;
        total: number;
    }> {
        return withRetry(async () => {
            // Fetch necessary columns for stats
            let query = supabase.from('projects').select('status, current_status_code, group_code, management_board');
            
            // Apply all filters EXCEPT the ones we are counting
            const statParams = { ...params };
            if (statParams.filters) {
                statParams.filters = { ...statParams.filters };
                delete statParams.filters.status;
                delete statParams.filters.currentStatus;
                delete statParams.filters.group;
                delete statParams.filters.board;
            }
            
            query = this._applyFilters(query, statParams);
            
            const { data, error } = await query;
            if (error) throw toServiceError(error, 'Không thể tải thống kê dự án');

            const statusCounts: Record<number, number> = {};
            const currentStatusCounts: Record<number, number> = {};
            const groupCounts: Record<string, number> = {};
            const boardCounts: Record<string, number> = {};
            let total = 0;

            const activeStatus = params?.filters?.status;
            const activeCurrentStatus = params?.filters?.currentStatus;
            const activeGroup = params?.filters?.group;
            const activeBoard = params?.filters?.board;

            (data || []).forEach((row: any) => {
                const s = row.status;
                const cs = row.current_status_code;
                const g = row.group_code;
                const b = row.management_board;

                // For 'total', it should reflect the count IF all current filters were applied.
                // Wait, 'total' is used for the "Tất cả" option in the UI. 
                // "Tất cả" should just clear that specific filter. 
                // So totalUnfiltered for Status should be: count where group and board match.
                // We'll calculate totals for each category separately if needed, but for simplicity we return counts.

                // Status Counts (ignoring status/currentStatus filters, but applying group/board)
                const matchesGroup = !activeGroup || g === activeGroup;
                const matchesBoard = !activeBoard || b?.toString() === activeBoard?.toString();
                if (matchesGroup && matchesBoard) {
                    total++; // This is the total number of items when status filters are cleared
                    if (s !== null && s !== undefined) statusCounts[s] = (statusCounts[s] || 0) + 1;
                    if (cs !== null && cs !== undefined) currentStatusCounts[cs] = (currentStatusCounts[cs] || 0) + 1;
                }

                // Group Counts (ignoring group filter, but applying status/currentStatus/board)
                const matchesStatus = (!activeStatus || s?.toString() === activeStatus?.toString()) && 
                                      (!activeCurrentStatus || cs?.toString() === activeCurrentStatus?.toString());
                if (matchesStatus && matchesBoard) {
                    if (g) groupCounts[g] = (groupCounts[g] || 0) + 1;
                }

                // Board Counts (ignoring board filter, but applying status/currentStatus/group)
                if (matchesStatus && matchesGroup) {
                    if (b) boardCounts[b] = (boardCounts[b] || 0) + 1;
                }
            });

            return { statusCounts, currentStatusCounts, groupCounts, boardCounts, total };
        });
    }

    /**
     * Apply common filters to a query builder (shared between getAll and getPaginated)
     */
    private static _applyFilters(query: any, params?: QueryParams): any {
        if (!params) return query;

        if (params.search) {
            const s = params.search;
            query = query.or(`project_name.ilike.%${s}%,project_id.ilike.%${s}%,investor_name.ilike.%${s}%`);
        }

        const f = params.filters;
        if (f) {
            if (f.status !== undefined && f.status !== '' && f.status !== 'all') query = query.eq('status', f.status);
            if (f.currentStatus !== undefined && f.currentStatus !== '' && f.currentStatus !== 'all') query = query.eq('current_status_code', f.currentStatus);
            if (f.group && f.group !== 'all') query = query.eq('group_code', f.group);
            if (f.board && f.board !== 'all') query = query.eq('management_board', f.board);
            if (f.investmentType) query = query.eq('investment_type', f.investmentType);
            if (f.stage) query = query.eq('stage', f.stage);
            if (f.sector) query = query.eq('sector', f.sector);
        }

        return query;
    }

    /**
     * Get a single project by ID (supports both ProjectID and ProjectNumber)
     */
    static async getById(id: string): Promise<Project | undefined> {
        // Try by project_id first
        let { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('project_id', id)
            .maybeSingle();

        if (!data && !error) {
            // Try by project_number
            const result = await supabase
                .from('projects')
                .select('*')
                .eq('project_number', id)
                .maybeSingle();
            data = result.data;
            error = result.error;
        }

        if (error) {
            throw toServiceError(error, 'Không thể tìm thấy dự án');
        }
        return data ? dbToProject(data) : undefined;
    }

    /**
     * Get a single project by ID — with retry for transient failures
     */
    static async getByIdSafe(id: string): Promise<Project | undefined> {
        return withRetry(() => this.getById(id));
    }

    /**
     * Create a new project
     */
    static async create(projectData: Partial<Project>): Promise<Project> {
        const insertData = projectToDb({
            ProjectID: projectData.ProjectID || `DA-${Date.now()}`,
            ProjectName: projectData.ProjectName || 'Dự án mới',
            GroupCode: projectData.GroupCode || ProjectGroup.C,
            Status: projectData.Status || ProjectStatus.Preparation,
            TotalInvestment: projectData.TotalInvestment || 0,
            IsEmergency: projectData.IsEmergency || false,
            ...projectData,
        });

        const { data, error } = await supabase
            .from('projects')
            .insert(insertData as any)
            .select()
            .single();

        if (error) throw new ServiceError(
            'Không thể tạo dự án. Vui lòng thử lại.',
            'CREATE_FAILED',
            error,
            { projectName: projectData.ProjectName }
        );
        return dbToProject(data);
    }

    /**
     * Update an existing project
     */
    static async update(id: string, data: Partial<Project>): Promise<Project> {
        const updateData = projectToDb(data);

        const { data: updated, error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('project_id', id)
            .select()
            .single();

        if (error) throw new ServiceError(
            'Không thể cập nhật dự án. Vui lòng thử lại.',
            'UPDATE_FAILED',
            error,
            { projectId: id }
        );
        return dbToProject(updated);
    }

    /**
     * Delete a project
     */
    static async delete(id: string): Promise<void> {
        try {
            // Delete dependent records first to prevent FK constraint failures
            const tablesWithProjectId = [
                'project_members',
                'capital_plans',
                'disbursements',
                'tasks',
                'project_workflow_steps',
                'project_workflows',
                'bidding_packages',
                'contracts',
                'documents'
            ];

            // 1. Delete instances in workflow_instances (FK is reference_id and reference_type)
            await supabase.from('workflow_instances').delete().eq('reference_id', id).eq('reference_type', 'project');

            // 2. Delete rows in tables with project_id
            for (const table of tablesWithProjectId) {
                await supabase.from(table as any).delete().eq('project_id', id);
            }

            // 3. Delete the project itself
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('project_id', id);

            if (error) {
                console.error("Failed to delete project:", error);
                throw new ServiceError('Xóa dự án thất bại', 'DELETE_FAILED', error, { projectId: id });
            }
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            console.error("Project deletion error:", error);
            throw new ServiceError(`Xóa dự án thất bại: ${error.message}`, 'DELETE_FAILED', error, { projectId: id });
        }
    }

    /**
     * Get project statistics — single query fetching all 3 fields at once.
     * Replaces the old 3-query approach that caused 2 extra round-trips.
     */
    static async getStatistics(): Promise<{
        total: number;
        byStatus: Record<ProjectStatus, number>;
        byGroup: Record<ProjectGroup, number>;
        totalInvestment: number;
    }> {
        // Single query fetching all needed fields — reduces round-trips from 3 to 1
        const { data, error } = await supabase
            .from('projects')
            .select('status, group_code, total_investment');

        if (error) throw toServiceError(error, 'Không thể tải thống kê dự án');

        const all = data || [];
        const byStatus: Record<string, number> = {};
        const byGroup: Record<string, number> = {};
        let totalInvestment = 0;

        for (const r of all) {
            byStatus[r.status] = (byStatus[r.status] || 0) + 1;
            byGroup[r.group_code] = (byGroup[r.group_code] || 0) + 1;
            totalInvestment += Number(r.total_investment) || 0;
        }

        return {
            total: all.length,
            byStatus: {
                [ProjectStatus.Preparation]: byStatus[ProjectStatus.Preparation] || 0,
                [ProjectStatus.Execution]: byStatus[ProjectStatus.Execution] || 0,
                [ProjectStatus.Completion]: byStatus[ProjectStatus.Completion] || 0,
            },
            byGroup: {
                [ProjectGroup.QN]: byGroup[ProjectGroup.QN] || 0,
                [ProjectGroup.A]: byGroup[ProjectGroup.A] || 0,
                [ProjectGroup.B]: byGroup[ProjectGroup.B] || 0,
                [ProjectGroup.C]: byGroup[ProjectGroup.C] || 0,
            },
            totalInvestment,
        };
    }

    /**
     * Get projects by status
     */
    static async getByStatus(status: ProjectStatus): Promise<Project[]> {
        return this.getAll({ filters: { status } });
    }

    /**
     * Search projects
     */
    static async search(query: string): Promise<Project[]> {
        return this.getAll({ search: query });
    }

    /**
     * Get all bidding packages (across all projects)
     */
    static async getAllBiddingPackages(): Promise<BiddingPackage[]> {
        const { data, error } = await supabase
            .from('bidding_packages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch all packages: ${error.message}`);
        return (data || []).map(dbToBiddingPackage);
    }

    /**
     * Get bidding packages for a project
     */
    static async getPackagesByProject(projectId: string): Promise<BiddingPackage[]> {
        const { data, error } = await supabase
            .from('bidding_packages')
            .select('*')
            .eq('project_id', projectId)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw new Error(`Failed to fetch packages: ${error.message}`);
        return (data || []).map(dbToBiddingPackage);
    }

    /**
     * Create a new bidding package
     */
    static async createPackage(packageData: Partial<BiddingPackage>): Promise<BiddingPackage> {
        const insertData = biddingPackageToDb({
            PackageID: packageData.PackageID || `PKG-${Date.now()}`,
            Status: packageData.Status || 'Planning' as any,
            BidType: packageData.BidType || 'Online',
            ...packageData,
        });

        const { data, error } = await supabase
            .from('bidding_packages')
            .insert(insertData as any)
            .select()
            .single();

        if (error) throw new Error(`Failed to create package: ${error.message}`);
        // Plan total is auto-recalculated by DB trigger trg_recalculate_plan_total
        return dbToBiddingPackage(data);
    }

    /**
     * Update an existing bidding package
     */
    static async updatePackage(packageId: string, updates: Partial<BiddingPackage>): Promise<BiddingPackage> {
        const updateData = biddingPackageToDb(updates);

        const { data: updated, error } = await supabase
            .from('bidding_packages')
            .update(updateData as any)
            .eq('package_id', packageId)
            .select()
            .single();

        if (error) throw new Error(`Failed to update package: ${error.message}`);

        const result = dbToBiddingPackage(updated);
        // Plan total is auto-recalculated by DB trigger trg_recalculate_plan_total
        return result;
    }

    /**
     * Delete a bidding package (blocks if has contract or awarded status)
     */
    static async deletePackage(packageId: string): Promise<void> {
        // Safety check: don't delete packages with contracts
        const { data: contracts } = await supabase
            .from('contracts')
            .select('contract_id')
            .eq('package_id', packageId)
            .limit(1);

        if (contracts && contracts.length > 0) {
            throw new Error('Không thể xóa gói thầu đã có hợp đồng. Hãy xóa hợp đồng trước.');
        }

        // Get package to check status and get PlanID for recalculation
        const { data: pkg } = await (supabase as any)
            .from('bidding_packages')
            .select('plan_id, status')
            .eq('package_id', packageId)
            .single();

        if (pkg?.status === 'Awarded') {
            throw new Error('Không thể xóa gói thầu đã có kết quả lựa chọn nhà thầu.');
        }

        // Delete associated payments first
        const { data: pkgContracts } = await supabase
            .from('contracts')
            .select('contract_id')
            .eq('package_id', packageId);
        
        if (pkgContracts && pkgContracts.length > 0) {
            const contractIds = pkgContracts.map(c => c.contract_id);
            await supabase.from('payments').delete().in('contract_id', contractIds);
        }

        const { error } = await supabase
            .from('bidding_packages')
            .delete()
            .eq('package_id', packageId);

        if (error) throw new Error(`Failed to delete package: ${error.message}`);
        // Plan total is auto-recalculated by DB trigger trg_recalculate_plan_total
    }

    // ============================================================
    // PROCUREMENT PLANS (KHLCNT)
    // ============================================================

    /** Get all KHLCNT for a project */
    static async getPlansByProject(projectId: string): Promise<ProcurementPlan[]> {
        const { data, error } = await supabase
            .from('procurement_plans')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(`Failed to fetch plans: ${error.message}`);
        return (data || []).map(dbToProcurementPlan);
    }

    /** Create a new KHLCNT */
    static async createPlan(plan: Partial<ProcurementPlan>): Promise<ProcurementPlan> {
        const dbRow = procurementPlanToDb(plan);
        const { data, error } = await supabase
            .from('procurement_plans')
            .insert(dbRow as any)
            .select()
            .single();

        if (error) throw new Error(`Failed to create plan: ${error.message}`);
        return dbToProcurementPlan(data);
    }

    /** Update a KHLCNT */
    static async updatePlan(planId: string, updates: Partial<ProcurementPlan>): Promise<ProcurementPlan> {
        const dbRow = procurementPlanToDb(updates);
        const { data, error } = await supabase
            .from('procurement_plans')
            .update(dbRow as any)
            .eq('plan_id', planId)
            .select()
            .single();

        if (error) throw new Error(`Failed to update plan: ${error.message}`);
        return dbToProcurementPlan(data);
    }

    /** Delete a KHLCNT — with safety check for Awarded/contracted packages */
    static async deletePlan(planId: string): Promise<void> {
        // Safety: check if plan has packages with Awarded status or contracts
        const { data: packages } = await (supabase as any)
            .from('bidding_packages')
            .select('package_id, status')
            .eq('plan_id', planId);

        if (packages && packages.length > 0) {
            const awardedPkgs = packages.filter((p: any) => p.status === 'Awarded');
            if (awardedPkgs.length > 0) {
                throw new Error(
                    `Không thể xóa KHLCNT: có ${awardedPkgs.length} gói thầu đã có kết quả LCNT. Hãy hủy kết quả trước.`
                );
            }

            // Check if any package has contracts
            const pkgIds = packages.map((p: any) => p.package_id);
            const { data: contracts } = await supabase
                .from('contracts')
                .select('contract_id')
                .in('package_id', pkgIds)
                .limit(1);

            if (contracts && contracts.length > 0) {
                throw new Error(
                    'Không thể xóa KHLCNT: có gói thầu đã ký hợp đồng. Hãy xóa hợp đồng trước.'
                );
            }
        }

        // 1. Delete all bidding packages associated with this plan
        const { error: pkgError } = await (supabase as any)
            .from('bidding_packages')
            .delete()
            .eq('plan_id', planId);

        if (pkgError) throw new Error(`Failed to delete associated packages: ${pkgError.message}`);

        // 2. Then delete the plan itself
        const { error } = await supabase
            .from('procurement_plans')
            .delete()
            .eq('plan_id', planId);

        if (error) throw new Error(`Failed to delete plan: ${error.message}`);
    }

    /** Assign packages to a KHLCNT */
    static async assignPackagesToPlan(planId: string, packageIds: string[]): Promise<void> {
        const { error } = await supabase
            .from('bidding_packages')
            .update({ plan_id: planId } as any)
            .in('package_id', packageIds);

        if (error) throw new Error(`Failed to assign packages: ${error.message}`);
    }

    /** Remove a package from its KHLCNT */
    static async removePackageFromPlan(packageId: string): Promise<void> {
        const { error } = await supabase
            .from('bidding_packages')
            .update({ plan_id: null } as any)
            .eq('package_id', packageId);

        if (error) throw new Error(`Failed to remove package from plan: ${error.message}`);
    }

    // recalculatePlanTotal removed — handled by DB trigger trg_recalculate_plan_total

    /**
     * Get capital and disbursement info (NĐ 99/2021/NĐ-CP)
     */
    static async getCapitalInfo(projectId: string): Promise<{
        allocations: CapitalAllocation[];
        disbursements: Disbursement[];
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
        }
    }> {
        // Run all 3 fetches in PARALLEL — removes waterfall, saves 1-2 round-trips
        const [allocationRes, disbursementRes, projectRes] = await Promise.all([
            // Fetch annual capital allocations
            (supabase as any)
                .from('capital_plans')
                .select('*')
                .eq('project_id', projectId),

            // Fetch disbursements sorted by date
            supabase
                .from('disbursements')
                .select('*')
                .eq('project_id', projectId)
                .order('date', { ascending: true }),

            // Fetch only the total_investment field — avoids a full getById() round-trip
            supabase
                .from('projects')
                .select('total_investment')
                .eq('project_id', projectId)
                .maybeSingle(),
        ]);

        const allocations: CapitalAllocation[] = (allocationRes.data || []).map(dbToCapitalAllocation);

        // Helper: chuẩn hóa Status case-insensitive
        const normalizeStatus = (s: string): 'Pending' | 'Approved' | 'Rejected' => {
            const lower = (s || '').toLowerCase();
            if (lower === 'approved' || lower === 'completed') return 'Approved';
            if (lower === 'pending') return 'Pending';
            return 'Rejected';
        };

        const disbursements: Disbursement[] = (disbursementRes.data || []).map((row: any) => ({
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

        // Ensure allocations have accurately computed disbursement amounts, ignoring stale db column
        allocations.forEach(alloc => {
            const relatedDisbs = disbursements.filter(d => {
                const y = new Date(d.Date).getFullYear();
                return y === alloc.Year;
            });
            alloc.DisbursedAmount = CapitalService.calculateTrueDisbursed(relatedDisbs);
        });

        // Get total_investment from parallel fetch — no extra round-trip
        const totalInvestment = Number(projectRes.data?.total_investment) || 0;

        // Compute summary
        const totalAdvance = disbursements.filter(d => d.Type === 'TamUng' && d.Status === 'Approved').reduce((s, d) => s + d.Amount, 0);
        const advanceRecovered = disbursements.filter(d => d.Type === 'ThuHoiTamUng' && d.Status === 'Approved').reduce((s, d) => s + d.Amount, 0);
        const completionPayment = disbursements.filter(d => ((d.Type as string) === 'ThanhToanKLHT' || (d.Type as string) === 'ThanhToanTT') && d.Status === 'Approved').reduce((s, d) => s + d.Amount, 0);
        
        const totalDisbursed = CapitalService.calculateTrueDisbursed(disbursements);
        const totalAllocated = allocations.reduce((s, a) => s + a.Amount, 0);

        const currentYear = new Date().getFullYear();
        const yearlyTarget = allocations
            .filter(a => a.Year === currentYear)
            .reduce((s, a) => s + a.Amount, 0);
            
        const yearlyDisbursed = CapitalService.calculateTrueDisbursed(
            disbursements.filter(d => new Date(d.Date).getFullYear() === currentYear)
        );

        return {
            allocations,
            disbursements,
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
            }
        };
    }
}

export default ProjectService;
