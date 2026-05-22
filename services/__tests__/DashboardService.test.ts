/**
 * Unit Tests — services/DashboardService.ts
 *
 * Focuses on the mathematical / aggregation logic. Each test seeds the
 * results of all Promise.all'd Supabase queries (in declaration order)
 * and asserts the derived metrics.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '../DashboardService';

// ── Chainable mock with per-call queued results ───────────────────
const queue: Array<{ data?: unknown; error?: unknown; count?: number }> = [];

function nextResult() {
    return queue.shift() ?? { data: [], error: null, count: 0 };
}

function createChain() {
    const chain: Record<string, any> = {};
    const passthrough = [
        'select', 'insert', 'upsert', 'update', 'delete',
        'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
        'in', 'not', 'is', 'like', 'ilike', 'or', 'and',
        'filter', 'order', 'limit', 'range',
    ];
    for (const m of passthrough) {
        chain[m] = vi.fn().mockReturnValue(chain);
    }
    chain.single = vi.fn().mockReturnValue(chain);
    chain.maybeSingle = vi.fn().mockReturnValue(chain);

    chain.then = (resolve: Function) => {
        const v = nextResult();
        resolve(v);
        return Promise.resolve(v);
    };
    return chain;
}

const rpcMock = vi.fn();

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: () => createChain(),
        rpc: (...args: any[]) => rpcMock(...args),
    },
    supabaseExt: {
        from: () => createChain(),
    },
}));

beforeEach(() => {
    queue.length = 0;
    rpcMock.mockReset();
});

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════
describe('DashboardService', () => {
    // ─── getOverviewMetrics ────────────────────────────────────────
    describe('getOverviewMetrics', () => {
        it('aggregates totals + disbursement rate + risk count', async () => {
            // Order matches Promise.all in the source:
            // 1) projects count, 2) projects total_investment, 3) capital_plans,
            // 4) disbursements, 5) tasks overdue count, 6) package_issues count
            queue.push({ data: null, error: null, count: 12 });                              // 1
            queue.push({                                                                      // 2
                data: [{ total_investment: 1_000_000_000 }, { total_investment: 500_000_000 }],
                error: null,
            });
            queue.push({                                                                      // 3
                data: [
                    { project_id: 'P1', amount: 100_000_000, disbursed_amount: 30_000_000 },
                    { project_id: 'P2', amount: 200_000_000, disbursed_amount: 50_000_000 },
                ],
                error: null,
            });
            queue.push({                                                                      // 4
                data: [
                    // P1 has actual disbursements (use actual = 40M)
                    { project_id: 'P1', amount: 40_000_000, date: '2026-04-10' },
                ],
                error: null,
            });
            queue.push({ data: null, error: null, count: 3 });                                // 5
            queue.push({ data: null, error: null, count: 2 });                                // 6

            const m = await DashboardService.getOverviewMetrics(2026);

            expect(m.totalProjects).toBe(12);
            expect(m.totalInvestment).toBe(1_500_000_000);
            expect(m.yearlyPlanned).toBe(300_000_000);
            // P1 → 40M (from disbursements), P2 → 50M (fallback to disbursed_amount)
            expect(m.yearlyDisbursed).toBe(90_000_000);
            expect(m.yearlyDisbursementRate).toBe(30); // 90M / 300M = 30.0
            expect(m.riskCount).toBe(5);               // 3 overdue + 2 issues
        });

        it('handles zero planned without dividing by zero', async () => {
            queue.push({ data: null, error: null, count: 0 });
            queue.push({ data: [], error: null });
            queue.push({ data: [], error: null });
            queue.push({ data: [], error: null });
            queue.push({ data: null, error: null, count: 0 });
            queue.push({ data: null, error: null, count: 0 });

            const m = await DashboardService.getOverviewMetrics(2026);
            expect(m.yearlyDisbursementRate).toBe(0);
            expect(m.yearlyDisbursed).toBe(0);
            expect(m.riskCount).toBe(0);
        });
    });

    // ─── getProjectSummary ─────────────────────────────────────────
    describe('getProjectSummary', () => {
        it('maps DB rows to dashboard rows with status labels', async () => {
            queue.push({
                data: [
                    {
                        project_id: 'P1',
                        project_name: 'DA test',
                        management_board: 1,
                        status: 2,
                        progress: 35,
                        total_investment: 1_000_000_000,
                        payment_progress: 20,
                        start_date: '2026-01-01',
                        expected_end_date: '2026-12-31',
                        location_code: '01',
                        coordinates: null,
                        investor_name: 'CDT A',
                        main_contractor_name: 'NT X',
                    },
                ],
                error: null,
            });

            const rows = await DashboardService.getProjectSummary();
            expect(rows).toHaveLength(1);
            expect(rows[0].projectId).toBe('P1');
            expect(rows[0].statusLabel).toBe('Thực hiện');
            expect(rows[0].totalInvestment).toBe(1_000_000_000);
            expect(rows[0].progress).toBe(35);
        });

        it('falls back to "Không rõ" for unknown status codes', async () => {
            queue.push({
                data: [
                    {
                        project_id: 'P1', project_name: 'X', management_board: 1,
                        status: 99, progress: 0, total_investment: 0, payment_progress: 0,
                        start_date: null, expected_end_date: null,
                    },
                ],
                error: null,
            });

            const rows = await DashboardService.getProjectSummary();
            expect(rows[0].statusLabel).toBe('Không rõ');
        });

        it('returns [] when no projects', async () => {
            queue.push({ data: null, error: null });
            const rows = await DashboardService.getProjectSummary();
            expect(rows).toEqual([]);
        });
    });

    // ─── getCapitalVsDisbursement ──────────────────────────────────
    describe('getCapitalVsDisbursement', () => {
        it('uses current year when called without argument', async () => {
            queue.push({ data: [], error: null }); // capital_plans
            queue.push({ data: [], error: null }); // disbursements
            queue.push({ data: [], error: null }); // projects

            const rows = await DashboardService.getCapitalVsDisbursement();
            // Every management board appears (even with zero data)
            expect(rows.length).toBeGreaterThan(0);
            for (const r of rows) {
                expect(r.planned).toBe(0);
                expect(r.actual).toBe(0);
                expect(r.rate).toBe(0);
            }
        });

        it('computes planned + actual per board (billions, rounded 1dp)', async () => {
            // Two projects, board 1 has both
            queue.push({                                                  // capital_plans
                data: [
                    { project_id: 'P1', amount: 2_000_000_000, disbursed_amount: 0 },
                    { project_id: 'P2', amount: 1_000_000_000, disbursed_amount: 500_000_000 },
                ],
                error: null,
            });
            queue.push({                                                  // disbursements
                data: [
                    { project_id: 'P1', amount: 800_000_000 },
                    { project_id: 'P1', amount: 200_000_000 },
                    // P2 has no actuals — falls back to disbursed_amount = 500M
                ],
                error: null,
            });
            queue.push({                                                  // projects
                data: [
                    { project_id: 'P1', management_board: 1 },
                    { project_id: 'P2', management_board: 1 },
                ],
                error: null,
            });

            const rows = await DashboardService.getCapitalVsDisbursement(2026);
            const board1 = rows.find((r) => r.name.includes('1'));
            expect(board1).toBeDefined();
            // planned = 3B → 3.0; actual = 1B (P1) + 0.5B (P2) = 1.5B → rate 50
            expect(board1!.planned).toBe(3);
            expect(board1!.actual).toBe(1.5);
            expect(board1!.rate).toBe(50);
        });
    });

    // ─── getTaskCompletion ─────────────────────────────────────────
    describe('getTaskCompletion', () => {
        it('parses RPC result into typed counts', async () => {
            rpcMock.mockResolvedValueOnce({
                data: [{ done_count: 10, in_progress_count: 5, todo_count: 8, overdue_count: 2, total_count: 25 }],
                error: null,
            });

            const c = await DashboardService.getTaskCompletion();
            expect(c).toEqual({ done: 10, inProgress: 5, todo: 8, overdue: 2, total: 25 });
            expect(rpcMock).toHaveBeenCalledWith('get_task_status_counts');
        });

        it('handles single-object (non-array) RPC response', async () => {
            rpcMock.mockResolvedValueOnce({
                data: { done_count: 3, in_progress_count: 1, todo_count: 0, overdue_count: 0, total_count: 4 },
                error: null,
            });

            const c = await DashboardService.getTaskCompletion();
            expect(c.done).toBe(3);
            expect(c.total).toBe(4);
        });

        it('returns zeroed counts on RPC error', async () => {
            rpcMock.mockResolvedValueOnce({ data: null, error: new Error('rpc not found') });
            const c = await DashboardService.getTaskCompletion();
            expect(c).toEqual({ done: 0, inProgress: 0, todo: 0, overdue: 0, total: 0 });
        });
    });

    // ─── getRisks ──────────────────────────────────────────────────
    describe('getRisks', () => {
        it('combines overdue tasks and open issues, computes severity from days overdue', async () => {
            const longAgo = new Date(Date.now() - 20 * 86400_000).toISOString(); // 20d ago
            const recent  = new Date(Date.now() - 3 * 86400_000).toISOString();  // 3d ago

            queue.push({                                                  // tasks
                data: [
                    { task_id: 't1', title: 'Quá hạn lâu', due_date: longAgo, project_id: 'P1' },
                    { task_id: 't2', title: 'Quá hạn ngắn', due_date: recent, project_id: 'P1' },
                ],
                error: null,
            });
            queue.push({                                                  // issues
                data: [
                    { issue_id: 'i1', title: 'Vấn đề nghiêm trọng', reported_date: '2026-04-01', severity: 'High' },
                ],
                error: null,
            });

            const risks = await DashboardService.getRisks();
            expect(risks).toHaveLength(3);

            const longTask = risks.find((r) => r.id === 't1');
            const shortTask = risks.find((r) => r.id === 't2');
            const issue = risks.find((r) => r.id === 'i1');

            expect(longTask?.severity).toBe('high');     // > 14 days
            expect(shortTask?.severity).toBe('low');     // < 7 days
            expect(issue?.severity).toBe('high');        // mapped from 'High'
            expect(issue?.msg).toContain('Vấn đề gói thầu');
        });

        it('caps the risk list at 8 entries', async () => {
            const tasks = Array.from({ length: 5 }, (_, i) => ({
                task_id: `t${i}`, title: `T${i}`,
                due_date: new Date(Date.now() - 10 * 86400_000).toISOString(),
                project_id: 'P1',
            }));
            const issues = Array.from({ length: 5 }, (_, i) => ({
                issue_id: `i${i}`, title: `I${i}`, reported_date: '2026-04-01', severity: 'Low',
            }));
            queue.push({ data: tasks, error: null });
            queue.push({ data: issues, error: null });

            const risks = await DashboardService.getRisks();
            expect(risks.length).toBeLessThanOrEqual(8);
        });
    });

    // ─── getMonthlyBriefingStats ──────────────────────────────────
    describe('getMonthlyBriefingStats', () => {
        it('aggregates monthly disbursement + new/completed projects + roadblocks', async () => {
            queue.push({                                                  // disbursements
                data: [{ amount: 300_000_000 }, { amount: 200_000_000 }],
                error: null,
            });
            queue.push({                                                  // capital_plans
                data: [{ amount: 6_000_000_000 }],
                error: null,
            });
            queue.push({                                                  // projects
                data: [
                    { project_id: 'P1', project_name: 'A', status: 3, progress: 100, start_date: '2026-04-10' },
                    { project_id: 'P2', project_name: 'B', status: 2, progress: 50,  start_date: '2026-04-20' },
                    { project_id: 'P3', project_name: 'C', status: 1, progress: 10,  start_date: '2026-01-05' },
                ],
                error: null,
            });
            queue.push({                                                  // issues
                data: [{ issue_id: 'i1', title: 'Chậm bàn giao', severity: 'High' }],
                error: null,
            });

            const stats = await DashboardService.getMonthlyBriefingStats(4, 2026);
            expect(stats.month).toBe(4);
            expect(stats.year).toBe(2026);
            expect(stats.disbursedThisMonth).toBe(500_000_000);
            expect(stats.disbursedTarget).toBe(500_000_000);          // 6B / 12
            expect(stats.newProjectsStarted).toBe(2);                  // P1 + P2 in April
            expect(stats.projectsCompleted).toBe(1);                   // P1 status==3
            expect(stats.roadblocks).toHaveLength(1);
            expect(stats.roadblocks[0].severity).toBe('high');
            expect(stats.upcomingPlans.length).toBeGreaterThan(0);
            expect(stats.keyAchievements.length).toBeGreaterThan(0);
        });
    });
});
