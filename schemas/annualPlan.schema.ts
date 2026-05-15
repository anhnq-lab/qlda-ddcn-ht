/**
 * Annual Plan Item Zod Schema (Zod v4+)
 */
import { z } from 'zod';

export const AnnualPlanItemFormSchema = z.object({
    plan_year: z.coerce.number().int().min(2000).max(2100),
    department_code: z.string().min(1),
    department_name: z.string(),
    group_name: z.string().optional().default(''),
    group_sort_order: z.coerce.number().int().default(0),
    task_name: z.string().min(1, 'Vui lòng nhập nội dung nhiệm vụ'),
    deliverable: z.string().optional().default(''),
    start_period: z.string().optional().default(''),
    end_period: z.string().optional().default(''),
    frequency: z.enum(['one_time', 'monthly', 'quarterly', 'daily', 'as_needed']).default('one_time'),
    project_id: z.string().optional(),
    source_task_id: z.string().optional(),
    source_type: z.enum(['manual', 'from_project_task']).optional(),
    responsible_text: z.string().optional().default(''),
    collaborating_text: z.string().optional().default(''),
    responsible_ids: z.array(z.string()).optional().default([]),
    collaborating_ids: z.array(z.string()).optional().default([]),
    notes: z.string().optional().default(''),
    sort_order: z.coerce.number().int().default(0),
    created_by: z.string().optional(),
});

/** Output type (after parse/transform) */
export type AnnualPlanItemFormValues = z.infer<typeof AnnualPlanItemFormSchema>;
/** Input type (what useForm<> needs — matches the resolver's TFieldValues) */
export type AnnualPlanItemFormInput = z.input<typeof AnnualPlanItemFormSchema>;
