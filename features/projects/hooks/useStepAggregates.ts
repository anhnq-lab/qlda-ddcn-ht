import { useMemo } from 'react';
import { Task, TaskStatus } from '@/types';

export interface StepAggregate {
    status: TaskStatus;
    startDate: string | null;
    dueDate: string | null;
    childCount: number;
    progress: number;
}

interface PhaseItem {
    id: string;
    code: string;
    title: string;
}

interface Phase {
    id: string;
    title: string;
    items: PhaseItem[];
}

/**
 * Hook tách logic tính toán step aggregates từ ProjectPlanTab.
 * Tính status, date range, progress trung bình cho mỗi bước.
 */
export function useStepAggregates(filteredTasks: Task[], phases: Phase[]) {
    return useMemo(() => {
        const map = new Map<string, StepAggregate>();
        const allItems = phases.flatMap(p => p.items);

        allItems.forEach(item => {
            const children = filteredTasks.filter(t => {
                const tTimelineStep = (t.TimelineStep || '').toLowerCase().trim();
                const iCode = (item.code || '').toLowerCase().trim();
                return tTimelineStep === iCode;
            });
            if (children.length === 0) {
                map.set(item.code, { status: TaskStatus.Todo, startDate: null, dueDate: null, childCount: 0, progress: 0 });
                return;
            }

            const allDone = children.every(t => t.Status === TaskStatus.Done);
            const anyActive = children.some(t =>
                t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Done || t.Status === TaskStatus.Review
            );

            let status = TaskStatus.Todo;
            if (allDone) status = TaskStatus.Done;
            else if (anyActive) status = TaskStatus.InProgress;

            const startDates = children.map(t => new Date(t.StartDate || t.DueDate).getTime()).filter(t => !isNaN(t));
            const dueDates = children.map(t => new Date(t.DueDate).getTime()).filter(t => !isNaN(t));

            const minStart = startDates.length > 0 ? new Date(Math.min(...startDates)).toISOString() : null;
            const maxDue = dueDates.length > 0 ? new Date(Math.max(...dueDates)).toISOString() : null;

            const totalProgress = children.reduce((sum, t) => sum + (t.ProgressPercent || (t.Status === TaskStatus.Done ? 100 : 0)), 0);
            const avgProgress = Math.round(totalProgress / children.length);

            map.set(item.code, { status, startDate: minStart, dueDate: maxDue, childCount: children.length, progress: avgProgress });
        });

        return map;
    }, [filteredTasks, phases]);
}
