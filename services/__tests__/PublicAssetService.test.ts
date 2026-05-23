import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicAssetService } from '../PublicAssetService';
import { supabase } from '../../lib/supabase';

// Helper mock chain
function createChainMock(resolvedValue: { data: unknown; error: unknown }) {
    const chain: Record<string, any> = {};
    const methods = [
        'select', 'eq', 'neq', 'or', 'insert', 'update', 'delete', 'single', 'order', 'limit'
    ];
    for (const m of methods) {
        chain[m] = vi.fn().mockReturnValue(chain);
    }
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

describe('PublicAssetService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCategories', () => {
        it('returns asset categories ordered by code', async () => {
            const categories = [
                { id: '1', name: 'Nhà cửa', code: 'N1' },
                { id: '2', name: 'Máy móc', code: 'M1' }
            ];
            mockFrom.mockReturnValue(createChainMock({ data: categories, error: null }));

            const result = await PublicAssetService.getCategories();
            expect(result).toHaveLength(2);
            expect(mockFrom).toHaveBeenCalledWith('public_asset_categories');
        });
    });

    describe('getAll', () => {
        it('fetches assets and maps custodian profile fields correctly', async () => {
            const assets = [
                {
                    id: 'asset-1',
                    asset_code: 'TS-001',
                    asset_name: 'Máy tính xách tay',
                    original_cost: 15000000,
                    accumulated_depreciation: 3000000,
                    custodian: {
                        employee_id: 'EMP-01',
                        full_name: 'Nguyễn Văn A',
                        position: 'Chuyên viên',
                        email: 'a.nv@cic.com.vn'
                    }
                }
            ];
            mockFrom.mockReturnValue(createChainMock({ data: assets, error: null }));

            const result = await PublicAssetService.getAll();
            expect(result).toHaveLength(1);
            expect(result[0].custodian?.name).toBe('Nguyễn Văn A');
            expect(result[0].custodian?.position).toBe('Chuyên viên');
            expect(mockFrom).toHaveBeenCalledWith('public_assets');
        });
    });

    describe('create', () => {
        it('creates asset, computes remaining_value, and logs initial transaction', async () => {
            const newAsset = {
                asset_code: 'TS-002',
                asset_name: 'Bàn làm việc',
                original_cost: 2000000,
                accumulated_depreciation: 200000,
                use_date: '2026-01-01',
                status: 'active',
                department: 'Hành chính'
            } as any;

            const dbReturn = { id: 'new-id-123', ...newAsset, remaining_value: 1800000 };

            // Mock public_assets insert
            const assetChain = createChainMock({ data: dbReturn, error: null });
            // Mock transaction log insert
            const txChain = createChainMock({ data: {}, error: null });

            mockFrom.mockImplementation((table) => {
                if (table === 'public_assets') return assetChain;
                if (table === 'public_asset_transactions') return txChain;
                return createChainMock({ data: null, error: null });
            });

            // Spy on createTransaction to verify it gets called
            const txSpy = vi.spyOn(PublicAssetService, 'createTransaction').mockResolvedValueOnce({} as any);

            const result = await PublicAssetService.create(newAsset);

            expect(result.id).toBe('new-id-123');
            expect(result.remaining_value).toBe(1800000);
            expect(mockFrom).toHaveBeenCalledWith('public_assets');
            expect(txSpy).toHaveBeenCalledWith(expect.objectContaining({
                asset_id: 'new-id-123',
                transaction_type: 'increase',
                reason: 'purchase'
            }));
        });
    });

    describe('delete', () => {
        it('calls delete query on supabase public_assets', async () => {
            mockFrom.mockReturnValue(createChainMock({ data: null, error: null }));
            await PublicAssetService.delete('asset-id');
            expect(mockFrom).toHaveBeenCalledWith('public_assets');
        });
    });
});
