/**
 * Unit Tests — services/ProjectService.ts
 * Tests CRUD operations with mocked Supabase client
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectService } from '../ProjectService';

// ── Mock Supabase ─────────────────────────────────────────────────
// Build a chainable mock that simulates Supabase's PostgREST query builder
function createChainMock(resolvedValue: { data: unknown; error: unknown }) {
    const chain: Record<string, any> = {};
    const methods = [
        'select', 'insert', 'update', 'delete', 'upsert',
        'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
        'in', 'not', 'is', 'like', 'ilike', 'or', 'and',
        'filter', 'order', 'limit', 'range',
        'single', 'maybeSingle',
    ];

    for (const m of methods) {
        chain[m] = vi.fn().mockReturnValue(chain);
    }

    // Make the chain thenable (Supabase queries are PromiseLike)
    chain.then = (resolve: Function) => {
        resolve(resolvedValue);
        return Promise.resolve(resolvedValue);
    };

    return chain;
}

const mockFrom = vi.fn();
vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: (...args: any[]) => mockFrom(...args),
        rpc: vi.fn(),
    },
}));

// ── Mock dbMappers ────────────────────────────────────────────────
vi.mock('../../lib/dbMappers', () => ({
    dbToProject: (row: any) => ({
        ProjectID: row.project_id,
        ProjectName: row.project_name,
        Status: row.status,
        TotalInvestment: row.total_investment,
        GroupCode: row.group_code,
        ...row,
    }),
    projectToDb: (data: any) => ({
        project_id: data.ProjectID,
        project_name: data.ProjectName,
        status: data.Status,
        total_investment: data.TotalInvestment,
        group_code: data.GroupCode,
    }),
    dbToBiddingPackage: (row: any) => ({ PackageID: row.package_id, ...row }),
    dbToCapitalAllocation: (row: any) => row,
    dbToProcurementPlan: (row: any) => row,
    procurementPlanToDb: (data: any) => data,
    biddingPackageToDb: (data: any) => data,
}));

// ── Mock CapitalService ────────────────────────────────────────────
vi.mock('../CapitalService', () => ({
    CapitalService: {
        calculateTrueDisbursed: vi.fn().mockReturnValue(0),
    },
}));

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════
describe('ProjectService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── getAll ───────────────────────────────────────────────────
    describe('getAll', () => {
        it('returns mapped projects on success', async () => {
            const mockData = [
                { project_id: 'P1', project_name: 'Dự án A', status: 1, total_investment: 1000000 },
                { project_id: 'P2', project_name: 'Dự án B', status: 2, total_investment: 2000000 },
            ];
            mockFrom.mockReturnValue(
                createChainMock({ data: mockData, error: null })
            );

            const projects = await ProjectService.getAll();

            expect(mockFrom).toHaveBeenCalledWith('projects');
            expect(projects).toHaveLength(2);
            expect(projects[0].ProjectID).toBe('P1');
            expect(projects[1].ProjectName).toBe('Dự án B');
        });

        it('returns empty array when no data', async () => {
            mockFrom.mockReturnValue(
                createChainMock({ data: null, error: null })
            );

            const projects = await ProjectService.getAll();
            expect(projects).toHaveLength(0);
        });

        it('throws on database error', async () => {
            mockFrom.mockReturnValue(
                createChainMock({ data: null, error: { message: 'Connection refused' } })
            );

            // Service wraps DB error message in ServiceError — just verify it rejects
            await expect(ProjectService.getAll()).rejects.toBeDefined();
        });

        it('applies search filter', async () => {
            const chain = createChainMock({ data: [], error: null });
            mockFrom.mockReturnValue(chain);

            await ProjectService.getAll({ search: 'Cầu' });

            expect(chain.or).toHaveBeenCalled();
        });

        it('applies status filter', async () => {
            const chain = createChainMock({ data: [], error: null });
            mockFrom.mockReturnValue(chain);

            await ProjectService.getAll({ filters: { status: 1 } });

            expect(chain.eq).toHaveBeenCalledWith('status', 1);
        });
    });

    // ─── getById ──────────────────────────────────────────────────
    describe('getById', () => {
        it('returns project when found by project_id', async () => {
            const mockRow = { project_id: 'P1', project_name: 'Dự án Test', status: 1 };
            mockFrom.mockReturnValue(
                createChainMock({ data: mockRow, error: null })
            );

            const project = await ProjectService.getById('P1');
            expect(project).toBeDefined();
            expect(project?.ProjectID).toBe('P1');
        });

        it('returns undefined when not found', async () => {
            mockFrom.mockReturnValue(
                createChainMock({ data: null, error: null })
            );

            const project = await ProjectService.getById('NONEXISTENT');
            expect(project).toBeUndefined();
        });

        it('throws on error', async () => {
            // First call (by project_id) returns not found
            const chain1 = createChainMock({ data: null, error: null });
            // Second call (by project_number) returns error
            const chain2 = createChainMock({ data: null, error: { message: 'DB error' } });

            let callCount = 0;
            mockFrom.mockImplementation(() => {
                callCount++;
                return callCount === 1 ? chain1 : chain2;
            });

            // Service uses ServiceError with Vietnamese messages
            await expect(ProjectService.getById('P-ERR')).rejects.toBeDefined();
        });
    });

    // ─── create ───────────────────────────────────────────────────
    describe('create', () => {
        it('creates project with defaults', async () => {
            const mockRow = { project_id: 'DA-123', project_name: 'Dự án mới', status: 1 };
            mockFrom.mockReturnValue(
                createChainMock({ data: mockRow, error: null })
            );

            const project = await ProjectService.create({
                ProjectName: 'Dự án mới',
            });

            expect(mockFrom).toHaveBeenCalledWith('projects');
            expect(project.ProjectName).toBe('Dự án mới');
        });

        it('throws on duplicate or constraint error', async () => {
            mockFrom.mockReturnValue(
                createChainMock({ data: null, error: { message: 'duplicate key value' } })
            );

            // Service throws ServiceError with Vietnamese message on constraint failure
            await expect(ProjectService.create({ ProjectName: 'Dup' }))
                .rejects.toBeDefined();
        });
    });

    // ─── update ───────────────────────────────────────────────────
    describe('update', () => {
        it('updates project and returns mapped result', async () => {
            const mockUpdated = { project_id: 'P1', project_name: 'Updated Name', status: 2 };
            mockFrom.mockReturnValue(
                createChainMock({ data: mockUpdated, error: null })
            );

            const result = await ProjectService.update('P1', { ProjectName: 'Updated Name' });
            expect(result.ProjectName).toBe('Updated Name');
        });
    });

    // ─── delete ───────────────────────────────────────────────────
    describe('delete', () => {
        it('deletes project without error', async () => {
            mockFrom.mockReturnValue(
                createChainMock({ data: null, error: null })
            );

            await expect(ProjectService.delete('P1')).resolves.toBeUndefined();
        });

        it('throws on delete failure', async () => {
            mockFrom.mockReturnValue(
                createChainMock({ data: null, error: { message: 'FK constraint' } })
            );

            // Service throws ServiceError('Xóa dự án thất bại', ...) on delete failure
            await expect(ProjectService.delete('P1')).rejects.toBeDefined();
        });
    });

    // ─── search (delegates to getAll) ─────────────────────────────
    describe('search', () => {
        it('calls getAll with search param', async () => {
            mockFrom.mockReturnValue(
                createChainMock({ data: [], error: null })
            );

            const results = await ProjectService.search('cầu');
            expect(results).toHaveLength(0);
            expect(mockFrom).toHaveBeenCalledWith('projects');
        });
    });

    // ─── deletePackage (safety checks) ────────────────────────────
    describe('deletePackage', () => {
        it('blocks deletion when package has contracts', async () => {
            // First call: contracts check returns existing contract
            const contractChain = createChainMock({
                data: [{ contract_id: 'C1' }],
                error: null,
            });
            mockFrom.mockReturnValue(contractChain);

            await expect(ProjectService.deletePackage('PKG-1'))
                .rejects.toThrow('Không thể xóa gói thầu đã có hợp đồng');
        });
    });
});
