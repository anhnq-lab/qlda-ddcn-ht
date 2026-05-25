/**
 * useProjectSteps — Hook chính cho Tab Kế hoạch dự án (sau refactor tách bảng 24/05/2026)
 *
 * Đọc từ project_plan_items (bảng riêng cho KH dự án):
 *   - item.code = project_plan_item.id (UUID) → FK target cho tasks.project_plan_item_id
 *   - item.stepCode = step_code ngắn (semantic) → fallback matching & milestone
 *   - item.isScheduled = true nếu đã có MPI row với source_project_plan_item_id = step.id
 *
 * Return shape tương thích với useWorkflowPhases để ProjectPlanTab dễ chuyển đổi.
 */

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProjectStepsService } from '@/services/ProjectStepsService';
import type { ProjectStep } from '@/services/ProjectStepsService';
import type { ProjectPhase, PhaseItem, SubProcessGroup } from './useWorkflowPhases';

// Re-export for convenience
export type { ProjectPhase, PhaseItem, SubProcessGroup, ProjectStep };

// ─── Constants ─────────────────────────────────────────────────

const PHASE_TITLES: Record<string, string> = {
    preparation: 'GIAI ĐOẠN CHUẨN BỊ DỰ ÁN',
    execution: 'GIAI ĐOẠN THỰC HIỆN DỰ ÁN',
    completion: 'GIAI ĐOẠN KẾT THÚC XÂY DỰNG',
};

const PHASE_IDS: Record<string, string> = {
    preparation: 'PHASE_1',
    execution: 'PHASE_2',
    completion: 'PHASE_3',
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
    preparation: 'Chuẩn bị đầu tư, lập dự án, phê duyệt chủ trương',
    execution: 'Thiết kế, đấu thầu, thi công, giám sát',
    completion: 'Nghiệm thu, bàn giao, quyết toán',
};

const PHASE_ORDER = ['preparation', 'execution', 'completion'];

// ─── Query key factory ─────────────────────────────────────────

export const projectStepsKey = (projectId: string) =>
    ['project-steps', projectId] as const;

// ─── Hook ──────────────────────────────────────────────────────

export function useProjectSteps(projectId: string | undefined) {
    const queryClient = useQueryClient();

    const { data: steps = [], isLoading } = useQuery({
        queryKey: projectStepsKey(projectId ?? ''),
        queryFn: () => ProjectStepsService.getByProject(projectId!),
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000,
    });

    /**
     * Build ProjectPhase[] từ project_plan_items — tương thích shape của useWorkflowPhases.
     * - item.code = project_plan_item.id (UUID) — FK chính xác cho task matching
     * - item.stepCode = semantic step_code — fallback matching & milestone detection
     * - item.isScheduled = đã lên KH tháng chưa
     */
    const phases = useMemo<ProjectPhase[]>(() => {
        if (steps.length === 0) return [];

        const phaseMap: Record<string, Record<string, PhaseItem[]>> = {};
        const flatPhaseItems: Record<string, PhaseItem[]> = {};

        steps.forEach((step: ProjectStep) => {
            const phase = step.phase || 'preparation';
            const subProcess = 'Các bước thực hiện';

            if (!phaseMap[phase]) phaseMap[phase] = {};
            if (!phaseMap[phase][subProcess]) phaseMap[phase][subProcess] = [];
            if (!flatPhaseItems[phase]) flatPhaseItems[phase] = [];

            // Số thứ tự trong phase (1-based)
            const stepNumInPhase = flatPhaseItems[phase].length + 1;
            const stepNum = `${stepNumInPhase}`;

            const rRaci = step.raci?.find((r: any) => r.raci_type === 'R');
            const assigneeRole = rRaci ? rRaci.stakeholder_code : undefined;

            const item: PhaseItem = {
                id: stepNum,
                title: step.task_name,
                code: step.id,                          // ← project_plan_item.id (FK target)
                stepCode: step.step_code || null,        // ← semantic step_code (fallback)
                assigneeRole: assigneeRole || step.assignee_role || undefined,
                estimatedDays: step.duration_days ?? undefined,
                startDate: step.start_date ?? null,
                dueDate: step.due_date ?? null,
                isScheduled: step.is_scheduled,
                scheduledMonthlyPlanId: step.scheduled_monthly_plan_id ?? null,
                raci: step.raci || [],
            };

            phaseMap[phase][subProcess].push(item);
            flatPhaseItems[phase].push(item);
        });

        return PHASE_ORDER
            .filter(phase => (flatPhaseItems[phase]?.length ?? 0) > 0)
            .map((phase, phaseIdx) => {
                const spMap = phaseMap[phase] || {};
                const subProcesses: SubProcessGroup[] = Object.entries(spMap).map(([fullTitle, items]) => {
                    const spMatch = fullTitle.match(/^([IVX]+\.\d+)\.\s*(.*)/);
                    const spId = spMatch ? spMatch[1] : `${phaseIdx + 1}.0`;
                    const spTitle = spMatch ? spMatch[2] : fullTitle;
                    return { id: spId, title: spTitle, fullTitle, items };
                });

                return {
                    id: PHASE_IDS[phase] ?? `PHASE_${phaseIdx + 1}`,
                    title: PHASE_TITLES[phase] ?? phase.toUpperCase(),
                    description: PHASE_DESCRIPTIONS[phase] ?? '',
                    items: flatPhaseItems[phase],
                    subProcesses,
                };
            });
    }, [steps]);

    /** Invalidate cache — gọi sau khi tạo/xóa kế hoạch tổng thể */
    const invalidate = () => {
        if (projectId) {
            queryClient.invalidateQueries({ queryKey: projectStepsKey(projectId) });
        }
    };

    /** Số steps chưa lên KH tháng (để hiện badge trên nút "Sinh KH tháng") */
    const unscheduledCount = useMemo(
        () => steps.filter(s => !s.is_scheduled).length,
        [steps]
    );

    /** Steps đã lên KH tháng */
    const scheduledSteps = useMemo(
        () => steps.filter(s => s.is_scheduled),
        [steps]
    );

    return {
        steps,
        phases,
        isLoading,
        invalidate,
        unscheduledCount,
        scheduledSteps,
    };
}
