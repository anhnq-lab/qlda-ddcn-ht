/**
 * Monthly Plan Item Zod Schema (Zod v4+)
 */
import { z } from 'zod';

export const MonthlyPlanItemFormSchema = z.object({
    monthly_plan_id: z.string().min(1),
    annual_plan_item_id: z.string().optional(),
    project_id: z.string().optional(),
    source_task_id: z.string().optional(),
    source_subtask_id: z.string().optional(),
    source_type: z.enum(['manual', 'from_annual', 'from_project_task', 'from_subtask']).optional(),
    group_name: z.string().optional().default(''),
    group_sort_order: z.coerce.number().int().default(0),
    task_name: z.string().min(1, 'Vui lòng nhập nội dung nhiệm vụ'),
    deliverable: z.string().optional().default(''),
    deadline_note: z.string().optional().default(''),
    due_date: z.string().optional(),
    staff_ids: z.array(z.string()).optional().default([]),
    staff_names: z.array(z.string()).optional().default([]),
    executor_ids: z.array(z.string()).optional(),
    executor_names: z.array(z.string()).optional(),
    staff_id: z.string().optional(),
    staff_name: z.string().optional().default(''),
    dept_head_id: z.string().optional(),
    dept_head_name: z.string().optional().default(''),
    ban_head_id: z.string().optional(),
    ban_head_name: z.string().optional().default(''),
    status: z.enum(['planned', 'completed', 'incomplete', 'partial', 'deferred']).default('planned'),
    completion_result: z.string().optional().default(''),
    incomplete_reason: z.string().optional().default(''),
    deferred_to_plan_id: z.string().optional(),
    notes: z.string().optional().default(''),
    sort_order: z.coerce.number().int().default(0),
    created_by: z.string().optional(),
});

/** Output type (after parse/transform) */
export type MonthlyPlanItemFormValues = z.infer<typeof MonthlyPlanItemFormSchema>;
/** Input type (what useForm<> needs — matches the resolver's TFieldValues) */
export type MonthlyPlanItemFormInput = z.input<typeof MonthlyPlanItemFormSchema>;
