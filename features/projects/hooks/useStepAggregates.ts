/**
 * useStepAggregates — Tính status, date range, tiến độ cho từng bước.
 *
 * Sau refactor 24/05/2026:
 *   - Dùng isTaskInStep() từ lib/progressCalculator — ưu tiên FK match (MonthlyPlanItemID)
 *     trước, fallback sang stepCode (semantic string)
 *   - Dùng calcStepAggregate() thay inline logic — single source of truth
 */
import { useMemo } from 'react';
import { Task, TaskStatus } from '@/types';
import { calcStepAggregate, isTaskInStep } from '@/lib/progressCalculator';
import type { StepLikeAggregate } from '@/lib/progressCalculator';

export type StepAggregate = StepLikeAggregate;

interface PhaseItem {
    id: string;
    code: string;       // MPI step ID (useProjectSteps) hoặc workflow_node_id (useWorkflowPhases)
    title: string;
    stepCode?: string | null;  // Semantic step_code — dùng làm fallback trong isTaskInStep
}

interface Phase {
    id: string;
    title: string;
    items: PhaseItem[];
}

/**
 * Tính aggregate cho tất cả steps trong tất cả phases.
 * Trả về Map<stepCode, StepAggregate> — key = item.code.
 *
 * Matching priority (theo isTaskInStep):
 *  1. task.MonthlyPlanItemID === item.code (FK — chính xác, tasks mới)
 *  2. compareStepCode(task.StepCode, item.stepCode) (semantic — tasks cũ / legacy)
 */
export function useStepAggregates(filteredTasks: Task[], phases: Phase[]) {
    return useMemo(() => {
        const map = new Map<string, StepAggregate>();
        const allItems = phases.flatMap(p => p.items);

        allItems.forEach(item => {
            // item.stepCode is set by useProjectSteps (semantic string).
            // When item.stepCode is absent (useWorkflowPhases, template-based), fall back to
            // item.code itself as the legacy TimelineStep/StepCode match target so that
            // the old workflow_node_id comparison still works during the Phase 4 transition.
            const stepDef = {
                id: item.code,
                code: item.stepCode ?? item.code,
            };
            const children = filteredTasks.filter(t => isTaskInStep(t, stepDef));

            if (children.length === 0) {
                map.set(item.code, {
                    status: TaskStatus.Todo,
                    startDate: null,
                    dueDate: null,
                    childCount: 0,
                    progress: 0,
                    completionPercent: 0,
                });
                return;
            }

            map.set(item.code, calcStepAggregate(children));
        });

        return map;
    }, [filteredTasks, phases]);
}
