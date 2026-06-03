import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from '../TaskService';
import { supabase } from '../../lib/supabase';

// Helper mock chain
function createChainMock(resolvedValue: { data: unknown; error: unknown; count?: number }) {
    const chain: Record<string, any> = {};
    const methods = [
        'select', 'eq', 'neq', 'or', 'insert', 'update', 'delete', 'single', 'maybeSingle', 'order', 'limit', 'is', 'in'
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
        rpc: vi.fn()
    },
}));

describe('TaskService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAllTasks', () => {
        it('fetches all tasks without filtering monthly plan item', async () => {
            const mockTasks = [
                { id: '1', title: 'Task 1', task_type: 'internal', sort_order: 1 },
                { id: '2', title: 'Task 2', task_type: 'project', monthly_plan_item_id: 'item-1', sort_order: 2 },
                { id: '3', title: 'Task 3', task_type: 'project', monthly_plan_item_id: null, sort_order: 3 }
            ];
            mockFrom.mockReturnValue(createChainMock({ data: mockTasks, error: null }));

            const result = await TaskService.getAllTasks();
            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('1');
            expect(result[1].id).toBe('2');
            expect(result[2].id).toBe('3');
            expect(mockFrom).toHaveBeenCalledWith('tasks');
        });
    });

    describe('getProjectTasks', () => {
        it('fetches project tasks with parent_id as null', async () => {
            const mockTasks = [
                { id: 'parent-1', title: 'Parent Task', parent_id: null, sort_order: 1 }
            ];
            mockFrom.mockReturnValue(createChainMock({ data: mockTasks, error: null }));

            const result = await TaskService.getProjectTasks('project-123');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('parent-1');
            expect(mockFrom).toHaveBeenCalledWith('tasks');
        });
    });

    describe('getTasksByEmployeeAndMonth', () => {
        it('returns tasks matching filter', async () => {
            const mockTasks = [
                { id: '1', title: 'Employee Task', assignee_id: 'EMP-01' }
            ];
            mockFrom.mockReturnValue(createChainMock({ data: mockTasks, error: null }));

            const result = await TaskService.getTasksByEmployeeAndMonth('EMP-01', 5, 2026);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
        });
    });

    describe('createTask', () => {
        it('inserts new task payload', async () => {
            const mockNew = { title: 'New Task', task_type: 'internal' };
            mockFrom.mockReturnValue(createChainMock({ data: { id: 'created-id', ...mockNew }, error: null }));

            const result = await TaskService.createTask(mockNew as any);
            expect(result.id).toBe('created-id');
            expect(mockFrom).toHaveBeenCalledWith('tasks');
        });
    });

    describe('deleteTask', () => {
        it('calls delete query', async () => {
            mockFrom.mockReturnValue(createChainMock({ data: { id: 'task-id', is_self_proposed: false }, error: null }));
            await TaskService.deleteTask('task-id');
            expect(mockFrom).toHaveBeenCalledWith('tasks');
        });
    });
});
