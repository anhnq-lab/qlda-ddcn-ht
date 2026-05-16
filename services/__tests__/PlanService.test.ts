/**
 * Unit Tests — services/PlanService.ts
 * Tests AnnualPlanService with mocked Supabase client
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnnualPlanService } from '../PlanService';
import type { AnnualPlanItem } from '../../types/plan.types';

// ── Chainable mock builder ────────────────────────────────────────────
// PlanService chains: .from → .select → .eq → .eq? → .order → .order? → .order?
// The LAST .order call in getByDepartment resolves the promise.
// We build a single chain where every method returns `this`, and the
// final `then` handler makes the whole chain awaitable.
function createChainMock(resolvedValue: { data: unknown; error: unknown }) {
    const chain: Record<string, any> = {};
    const methods = [
        'select', 'insert', 'update', 'delete',
        'eq', 'neq', 'or', 'in', 'not', 'is',
        'single', 'maybeSingle',
    ];

    for (const m of methods) {
        chain[m] = vi.fn().mockReturnValue(chain);
    }

    // .order returns `this` so multiple .order() calls chain, and the last
    // await on the chain resolves via `then`.
    chain.order = vi.fn().mockReturnValue(chain);

    chain.then = (resolve: Function, reject?: Function) => {
        try {
            resolve(resolvedValue);
        } catch (e) {
            if (reject) reject(e);
        }
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

// ═══════════════════════════════════════════════════════════════════
// AnnualPlanService tests
// ═══════════════════════════════════════════════════════════════════
describe('AnnualPlanService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── getByDepartment ──────────────────────────────────────────
    describe('getByDepartment', () => {
        it('calls the correct query chain with year and deptCode', async () => {
            const mockData: Partial<AnnualPlanItem>[] = [
                { id: 'item-1', plan_year: 2026, department_code: 'KHDT', task_name: 'Lập KH đầu tư' },
                { id: 'item-2', plan_year: 2026, department_code: 'KHDT', task_name: 'Báo cáo tiến độ' },
            ];
            const chain = createChainMock({ data: mockData, error: null });
            mockFrom.mockReturnValue(chain);

            const result = await AnnualPlanService.getByDepartment(2026, 'KHDT');

            expect(mockFrom).toHaveBeenCalledWith('annual_plan_items');
            expect(chain.select).toHaveBeenCalledWith('*');
            expect(chain.eq).toHaveBeenCalledWith('plan_year', 2026);
            expect(chain.eq).toHaveBeenCalledWith('department_code', 'KHDT');
            expect(chain.order).toHaveBeenCalledWith('group_sort_order');
            expect(chain.order).toHaveBeenCalledWith('sort_order');
        });

        it('returns result typed as AnnualPlanItem[]', async () => {
            const mockData = [
                {
                    id: 'item-1',
                    plan_year: 2025,
                    department_code: 'PHONG_TC',
                    task_name: 'Quyết toán năm',
                    frequency: 'one_time',
                    group_name: 'Tài chính',
                    group_sort_order: 1,
                    sort_order: 0,
                },
            ];
            const chain = createChainMock({ data: mockData, error: null });
            mockFrom.mockReturnValue(chain);

            const result = await AnnualPlanService.getByDepartment(2025, 'TCKT');

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('item-1');
            expect(result[0].task_name).toBe('Quyết toán năm');
            expect(result[0].plan_year).toBe(2025);
        });

        it('returns empty array when no items found', async () => {
            const chain = createChainMock({ data: [], error: null });
            mockFrom.mockReturnValue(chain);

            const result = await AnnualPlanService.getByDepartment(2026, 'KTTD');
            expect(result).toHaveLength(0);
            expect(Array.isArray(result)).toBe(true);
        });

        it('throws when supabase returns an error', async () => {
            const chain = createChainMock({ data: null, error: { message: 'permission denied' } });
            mockFrom.mockReturnValue(chain);

            await expect(AnnualPlanService.getByDepartment(2026, 'KHDT'))
                .rejects.toMatchObject({ message: 'permission denied' });
        });
    });

    // ─── getByYear ────────────────────────────────────────────────
    describe('getByYear', () => {
        it('queries annual_plan_items filtered by plan_year only', async () => {
            const chain = createChainMock({ data: [], error: null });
            mockFrom.mockReturnValue(chain);

            await AnnualPlanService.getByYear(2026);

            expect(mockFrom).toHaveBeenCalledWith('annual_plan_items');
            expect(chain.eq).toHaveBeenCalledWith('plan_year', 2026);
            // department_code should NOT be filtered
            expect(chain.eq).not.toHaveBeenCalledWith('department_code', expect.anything());
        });

        it('returns all items for the year across departments', async () => {
            const mockData = [
                { id: 'a', plan_year: 2026, department_code: 'PHONG_KH', task_name: 'Task A' },
                { id: 'b', plan_year: 2026, department_code: 'PHONG_TC', task_name: 'Task B' },
            ];
            const chain = createChainMock({ data: mockData, error: null });
            mockFrom.mockReturnValue(chain);

            const result = await AnnualPlanService.getByYear(2026);
            expect(result).toHaveLength(2);
        });
    });
});
