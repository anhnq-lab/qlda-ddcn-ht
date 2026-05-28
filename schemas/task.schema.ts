/**
 * Task Zod Schemas (Zod v4+)
 */
import { z } from 'zod';

import { TaskStatus, TaskPriority, type TaskType, TASK_CATEGORIES } from '../types/task.types';

// ─── Task Category ────────────────────────────────────
export const TaskCategorySchema = z.enum(TASK_CATEGORIES, {
    error: 'Phân loại công việc không hợp lệ',
});

// ─── Task Type ─────────────────────────────────────────
export const TaskTypeSchema = z.enum(['project', 'management', 'internal'], {
    error: 'Loại công việc không hợp lệ',
});

// ─── Task Status ───────────────────────────────────────
export const TaskStatusSchema = z.nativeEnum(TaskStatus, {
    error: 'Trạng thái công việc không hợp lệ',
});

// ─── Task Priority ─────────────────────────────────────
export const TaskPrioritySchema = z.nativeEnum(TaskPriority, {
    error: 'Mức độ ưu tiên không hợp lệ',
});

// ─── Task Create ───────────────────────────────────────
export const TaskCreateSchema = z.object({
    Title: z.string()
        .min(2, 'Tên công việc phải có ít nhất 2 ký tự')
        .max(500, 'Tên công việc không quá 500 ký tự'),

    Description: z.string().optional(),

    TaskType: TaskTypeSchema.default('project'),

    ProjectID: z.string().uuid('Dự án không hợp lệ'),

    AssigneeID: z.string().uuid('Người thực hiện không hợp lệ'),

    Status: TaskStatusSchema.default(TaskStatus.Todo),

    Priority: TaskPrioritySchema.default(TaskPriority.Medium),

    ProgressPercent: z.coerce.number()
        .min(0, 'Tiến độ phải ≥ 0%')
        .max(100, 'Tiến độ không quá 100%')
        .default(0),

    StartDate: z.string().optional(),

    DueDate: z.string().min(1, 'Vui lòng nhập ngày hạn'),

    DurationDays: z.coerce.number().int().min(0, 'Số ngày phải ≥ 0').optional(),

    ActualStartDate: z.string().optional(),
    ActualEndDate: z.string().optional(),

    Phase: z.string().optional(),
    StepCode: z.string().optional(),
    SortOrder: z.coerce.number().int().optional(),

    LegalBasis: z.string().optional(),
    OutputDocument: z.string().optional(),

    PredecessorTaskID: z.string().uuid().optional(),

    IsCritical: z.boolean().default(false),

    MonthlyPlanItemID: z.string().uuid().optional(),
    WorkflowID: z.string().uuid().optional(),
    WorkflowNodeID: z.string().optional(),
    CollaboratorIDs: z.array(z.string().uuid()).optional(),
    ApproverID: z.string().uuid().optional(),

    Category: TaskCategorySchema.optional(),
    CompletionResult: z.string().max(2000, 'Kết quả thực hiện không quá 2000 ký tự').optional(),
    IncompleteReason: z.string().max(2000, 'Lý do chưa hoàn thành không quá 2000 ký tự').optional(),
    Notes: z.string().max(2000, 'Ghi chú không quá 2000 ký tự').optional(),
});

export const TaskUpdateSchema = TaskCreateSchema.partial().extend({
    TaskID: z.string().uuid('ID công việc không hợp lệ'),
});

// ─── Types ─────────────────────────────────────────────
export type TaskCreateInput = z.infer<typeof TaskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;
