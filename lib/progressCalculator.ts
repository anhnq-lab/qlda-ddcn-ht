// ═══════════════════════════════════════════════════════════════
// Progress Calculator — Single source of truth
// ═══════════════════════════════════════════════════════════════
// Mọi view (Plan tab, Info tab, Gantt, Phase card, ...) ĐỀU dùng
// các hàm trong file này để tính tiến độ, đảm bảo số liệu khớp
// nhau trên toàn ứng dụng.
//
// Triết lý:
//   - "Progress %" = trung bình ProgressPercent của tất cả tasks
//     (mỗi task có thanh tiến độ riêng — 0-100%)
//   - "Completion %" = % tasks ở trạng thái Done
//     (đếm, không dùng progress slider)
//   - Step / Phase progress = trung bình của tasks con
//
// QUY ƯỚC THỐNG NHẤT:
//   - Mặc định hiển thị "Progress %" (avg ProgressPercent)
//   - Đối với widget cần đơn giản (Phase Card) → dùng "Completion %"
// ═══════════════════════════════════════════════════════════════

import { Task, TaskStatus } from '../types/task.types';

// ─── Types ─────────────────────────────────────────────────────

export interface ProgressStats {
    total: number;
    done: number;
    inProgress: number;
    review: number;
    todo: number;
    incomplete: number;
    overdue: number;
    /** % tasks done = done/total × 100 */
    completionPercent: number;
    /** Trung bình ProgressPercent của tất cả tasks */
    avgProgress: number;
}

export interface StepLikeAggregate {
    childCount: number;
    progress: number;       // avg ProgressPercent (0-100)
    completionPercent: number; // done / total × 100
    status: TaskStatus;
    startDate: string | null;
    dueDate: string | null;
}

// ─── Core: count tasks by status ───────────────────────────────

const isOverdue = (t: Task): boolean => {
    if (t.Status === TaskStatus.Done) return false;
    if (!t.DueDate) return false;
    const due = new Date(t.DueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
};

const safeProgress = (t: Task): number => {
    const p = Number(t.ProgressPercent);
    if (Number.isFinite(p)) return Math.max(0, Math.min(100, p));
    return t.Status === TaskStatus.Done ? 100 : 0;
};

/** Tính thống kê tiến độ cho 1 mảng tasks */
export function calcProgress(tasks: Task[] | undefined | null): ProgressStats {
    const list = tasks || [];
    const total = list.length;

    if (total === 0) {
        return {
            total: 0,
            done: 0,
            inProgress: 0,
            review: 0,
            todo: 0,
            incomplete: 0,
            overdue: 0,
            completionPercent: 0,
            avgProgress: 0,
        };
    }

    let done = 0, inProgress = 0, review = 0, todo = 0, incomplete = 0, overdue = 0;
    let totalProgress = 0;

    for (const t of list) {
        switch (t.Status) {
            case TaskStatus.Done: done++; break;
            case TaskStatus.InProgress: inProgress++; break;
            case TaskStatus.Review: review++; break;
            case TaskStatus.Incomplete: incomplete++; break;
            case TaskStatus.Todo:
            default: todo++; break;
        }
        if (isOverdue(t)) overdue++;
        totalProgress += safeProgress(t);
    }

    return {
        total,
        done,
        inProgress,
        review,
        todo,
        incomplete,
        overdue,
        completionPercent: Math.round((done / total) * 100),
        avgProgress: Math.round(totalProgress / total),
    };
}

// ─── Step aggregate (tasks → step status) ─────────────────────

/** Tính aggregate cho 1 step dựa trên các tasks con */
export function calcStepAggregate(stepTasks: Task[]): StepLikeAggregate {
    const stats = calcProgress(stepTasks);

    let status = TaskStatus.Todo;
    if (stats.total > 0) {
        if (stats.done === stats.total) status = TaskStatus.Done;
        else if (stats.inProgress > 0 || stats.review > 0 || stats.done > 0) status = TaskStatus.InProgress;
        else if (stats.incomplete > 0) status = TaskStatus.Incomplete;
    }

    // Date range
    const starts = stepTasks
        .map(t => t.StartDate ? new Date(t.StartDate).getTime() : NaN)
        .filter(n => !isNaN(n));
    const dues = stepTasks
        .map(t => t.DueDate ? new Date(t.DueDate).getTime() : NaN)
        .filter(n => !isNaN(n));

    return {
        childCount: stats.total,
        progress: stats.avgProgress,
        completionPercent: stats.completionPercent,
        status,
        startDate: starts.length > 0 ? new Date(Math.min(...starts)).toISOString() : null,
        dueDate: dues.length > 0 ? new Date(Math.max(...dues)).toISOString() : null,
    };
}

// ─── Phase aggregate (steps → phase progress) ─────────────────

export interface PhaseProgressInput {
    /** Số bước đã hoàn thành (tất cả tasks con done) */
    completedSteps: number;
    /** Tổng số bước */
    totalSteps: number;
    /** Tổng tasks trong phase */
    totalTasks: number;
    /** Tasks done trong phase */
    doneTasks: number;
}

/** Tính progress cho phase — trung bình aggregate của các steps con */
export function calcPhaseProgress(
    phaseTasks: Task[],
    stepCount: number,
    completedStepCount: number
): { progressPercent: number; completionPercent: number; stepCompletion: number } {
    const stats = calcProgress(phaseTasks);
    const stepCompletion = stepCount > 0 ? Math.round((completedStepCount / stepCount) * 100) : 0;
    return {
        progressPercent: stats.avgProgress,
        completionPercent: stats.completionPercent,
        stepCompletion,
    };
}

// ─── Project-level progress ───────────────────────────────────

/** Tính progress cho cả dự án */
export function calcProjectProgress(allTasks: Task[]): ProgressStats {
    return calcProgress(allTasks);
}

// ─── Step code comparison helper ──────────────────────────────

/** So sánh step code an toàn (case-insensitive, trimmed) */
export function compareStepCode(a: string | null | undefined, b: string | null | undefined): boolean {
    if (!a || !b) return false;
    return a.toLowerCase().trim() === b.toLowerCase().trim();
}

/**
 * Match task vào step (project_plan_item).
 * Ưu tiên 1: ProjectPlanItemID (FK trực tiếp vào project_plan_items — mới nhất)
 * Ưu tiên 2: MonthlyPlanItemID (legacy — tasks tạo trước migration)
 * Ưu tiên 3: StepCode fallback (semantic code — fallback cuối)
 */
export function isTaskInStep(
    task: Task,
    step: { id?: string; code?: string | null }
): boolean {
    if (step.id && task.ProjectPlanItemID === step.id) return true;
    if (step.id && task.MonthlyPlanItemID === step.id) return true;
    if (step.code && compareStepCode(task.StepCode, step.code)) return true;
    return false;
}
