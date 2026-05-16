/**
 * Unit Tests — services/ContractService.ts
 * Tests CRUD operations with mocked Supabase client
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContractService } from '../ContractService';

// ── Chainable mock builder ────────────────────────────────────────────
function createChainMock(resolvedValue: { data: unknown; error: unknown }) {
    const chain: Record<string, any> = {};
    const methods = [
        'select', 'insert', 'update', 'delete',
        'eq', 'neq', 'or', 'and', 'in', 'not', 'is',
        'like', 'ilike', 'filter', 'limit', 'range',
        'single', 'maybeSingle',
    ];

    for (const m of methods) {
        chain[m] = vi.fn().mockReturnValue(chain);
    }

    // order is the terminal call in ContractService — resolves the promise
    chain.order = vi.fn().mockResolvedValue(resolvedValue);

    // Make the chain thenable so `await chain` works too
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
    },
}));

vi.mock('../../lib/dbMappers', () => ({
    dbToContract: (row: any) => ({
        ContractID: row.contract_id,
        PackageID: row.package_id ?? '',
        ContractorID: row.contractor_id ?? '',
        ProjectID: row.project_id ?? '',
        ContractName: row.contract_name ?? '',
        Status: row.status,
        Value: Number(row.value) || 0,
        ...row,
    }),
    contractToDb: (c: any) => ({
        ...(c.ContractID !== undefined && { contract_id: c.ContractID }),
        ...(c.Status !== undefined && { status: c.Status }),
        ...(c.Value !== undefined && { value: c.Value }),
    }),
}));

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════
describe('ContractService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── getByPackageId ───────────────────────────────────────────
    describe('getByPackageId', () => {
        it('calls the correct query chain and maps results via dbToContract', async () => {
            const mockData = [
                { contract_id: 'HD-001', package_id: 'PKG-1', contract_name: 'HĐ xây lắp', status: 'executing', value: 1000000 },
                { contract_id: 'HD-002', package_id: 'PKG-1', contract_name: 'HĐ tư vấn', status: 'executing', value: 500000 },
            ];
            const chain = createChainMock({ data: mockData, error: null });
            mockFrom.mockReturnValue(chain);

            const result = await ContractService.getByPackageId('PKG-1');

            expect(mockFrom).toHaveBeenCalledWith('contracts');
            expect(chain.select).toHaveBeenCalledWith('*');
            expect(chain.eq).toHaveBeenCalledWith('package_id', 'PKG-1');
            expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });

            expect(result).toHaveLength(2);
            expect(result[0].ContractID).toBe('HD-001');
            expect(result[1].ContractID).toBe('HD-002');
        });

        it('returns empty array when no contracts found', async () => {
            const chain = createChainMock({ data: null, error: null });
            mockFrom.mockReturnValue(chain);

            const result = await ContractService.getByPackageId('PKG-EMPTY');
            expect(result).toHaveLength(0);
        });

        it('throws Error when supabase returns an error', async () => {
            const chain = createChainMock({ data: null, error: { message: 'DB timeout' } });
            mockFrom.mockReturnValue(chain);

            await expect(ContractService.getByPackageId('PKG-ERR'))
                .rejects.toThrow('Failed to fetch contracts by package: DB timeout');
        });
    });

    // ─── getAll — no params ───────────────────────────────────────
    describe('getAll — no params', () => {
        it('calls select and order without any eq/or filters', async () => {
            const chain = createChainMock({ data: [], error: null });
            mockFrom.mockReturnValue(chain);

            await ContractService.getAll();

            expect(mockFrom).toHaveBeenCalledWith('contracts');
            expect(chain.select).toHaveBeenCalledWith('*');
            expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
            // No filter methods should have been called
            expect(chain.eq).not.toHaveBeenCalled();
            expect(chain.or).not.toHaveBeenCalled();
        });

        it('returns mapped contracts', async () => {
            const mockData = [
                { contract_id: 'HD-010', package_id: 'PKG-2', status: 'liquidated', value: 2000000 },
            ];
            const chain = createChainMock({ data: mockData, error: null });
            mockFrom.mockReturnValue(chain);

            const result = await ContractService.getAll();
            expect(result).toHaveLength(1);
            expect(result[0].ContractID).toBe('HD-010');
        });
    });

    // ─── getAll — with filters ─────────────────────────────────────
    describe('getAll — with filters', () => {
        it('applies status filter via .eq when params.filters.status is provided', async () => {
            const chain = createChainMock({ data: [], error: null });
            mockFrom.mockReturnValue(chain);

            await ContractService.getAll({ filters: { status: 'executing' } });

            expect(chain.eq).toHaveBeenCalledWith('status', 'executing');
        });

        it('applies packageId filter via .eq when params.filters.packageId is provided', async () => {
            const chain = createChainMock({ data: [], error: null });
            mockFrom.mockReturnValue(chain);

            await ContractService.getAll({ filters: { packageId: 'PKG-99' } });

            expect(chain.eq).toHaveBeenCalledWith('package_id', 'PKG-99');
        });

        it('applies search filter via .or when params.search is provided', async () => {
            const chain = createChainMock({ data: [], error: null });
            mockFrom.mockReturnValue(chain);

            await ContractService.getAll({ search: 'cầu đường' });

            expect(chain.or).toHaveBeenCalledWith(
                expect.stringContaining('cầu đường')
            );
        });

        it('applies both status and search filters together', async () => {
            const chain = createChainMock({ data: [], error: null });
            mockFrom.mockReturnValue(chain);

            await ContractService.getAll({ search: 'HĐ', filters: { status: 'paused' } });

            expect(chain.or).toHaveBeenCalled();
            expect(chain.eq).toHaveBeenCalledWith('status', 'paused');
        });
    });

    // ─── error handling ────────────────────────────────────────────
    describe('error handling', () => {
        it('getAll throws Error wrapping the supabase error message', async () => {
            const chain = createChainMock({ data: null, error: { message: 'Connection refused' } });
            mockFrom.mockReturnValue(chain);

            await expect(ContractService.getAll())
                .rejects.toThrow('Failed to fetch contracts: Connection refused');
        });

        it('thrown error is an instance of Error', async () => {
            const chain = createChainMock({ data: null, error: { message: 'oops' } });
            mockFrom.mockReturnValue(chain);

            await expect(ContractService.getAll()).rejects.toBeInstanceOf(Error);
        });
    });
});
