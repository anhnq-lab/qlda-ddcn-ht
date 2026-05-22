import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import type { DbTask } from '../../services/TaskService';
import { DEPARTMENT_CODES } from '../../types/plan.types';

const isDepartmentCode = (id: string | null | undefined): boolean => {
    if (!id) return false;
    return (DEPARTMENT_CODES as readonly string[]).includes(id.toUpperCase());
};

/**
 * Maps a DbTask (unified tasks table) to the UI Task model.
 * Also supports legacy WorkflowTask shape for backward compat.
 */
export const workflowTaskToTask = (wt: DbTask | any, projectId?: string): Task => {
    const metadata = wt.metadata || {};
    
    // Map status
    let status: TaskStatus = TaskStatus.Todo;
    switch (wt.status) {
        case 'in_progress':
            status = TaskStatus.InProgress;
            break;
        case 'done':
        case 'completed':
        case 'skipped':
            status = TaskStatus.Done;
            break;
        case 'review':
        case 'rejected':
            status = TaskStatus.Review;
            break;
        case 'incomplete':
            status = TaskStatus.Incomplete;
            break;
        case 'todo':
        case 'pending':
        default:
            status = TaskStatus.Todo;
            break;
    }

    // Restore exact UI status if saved in metadata
    if (metadata.ui_status) {
        status = metadata.ui_status;
    }

    return {
        TaskID: wt.id,
        Title: wt.title || wt.name || 'Không có tiêu đề',
        TaskType: wt.task_type || metadata.task_type || 'project',
        Description: wt.description || wt.comments || metadata.description || '',
        ProjectID: projectId || wt.project_id || (wt as any).instance?.reference_id || '',
        ProjectName: wt.projects?.project_name || '',
        AssigneeID: wt.assignee_id || metadata.assignee_role || '',
        DueDate: wt.due_date || '',
        StartDate: wt.start_date || '',
        Status: status,
        Priority: wt.priority || metadata.priority || TaskPriority.Medium,
        ProgressPercent: wt.progress || 0,
        Metadata: metadata,
        
        // Fields from metadata or direct columns
        DurationDays: metadata.estimatedDays || 10,
        SubTasks: metadata.sub_tasks || [],
        Attachments: metadata.attachments || [],
        Dependencies: metadata.dependencies || [],
        EstimatedCost: Number(metadata.estimated_cost) || 0,
        ActualCost: Number(metadata.actual_cost) || 0,
        MonthlyPlanItemID: wt.monthly_plan_item_id || metadata.monthly_plan_item_id || undefined,
        ResponsibilityLevel: wt.responsibility_level || 'individual',
        
        // Actual dates
        ActualStartDate: metadata.actualStartDate || wt.actual_start_date || '',
        ActualEndDate: metadata.actualEndDate || wt.actual_end_date || '',
        
        // Workflow/Step reference
        TimelineStep: wt.workflow_node_id || wt.node_id || wt.step_code || metadata.step_code || '',
        StepCode: wt.step_code || metadata.step_code || wt.workflow_node_id || wt.node_id || '',
        Phase: metadata.phase || (wt as any).workflow_nodes?.metadata?.phase || '',
        LegalBasis: metadata.legalBasis || (wt as any).workflow_nodes?.metadata?.legalBasis || '',
        IsCritical: metadata.isCritical || false,
    };
};

/**
 * Maps UI Task back to DbTask for saving.
 */
export const taskToDbTask = (task: Partial<Task>, projectId?: string): Partial<DbTask> => {
    let dbStatus = 'todo';
    switch (task.Status) {
        case TaskStatus.Todo: dbStatus = 'todo'; break;
        case TaskStatus.InProgress: dbStatus = 'in_progress'; break;
        case TaskStatus.Review: dbStatus = 'review'; break;
        case TaskStatus.Done: dbStatus = 'done'; break;
        case TaskStatus.Incomplete: dbStatus = 'incomplete'; break;
    }

    const rawProjectId = projectId || task.ProjectID;
    const cleanProjectId = rawProjectId && rawProjectId.trim() !== ''
        ? rawProjectId
        : null;

    return {
        id: task.TaskID && !task.TaskID.startsWith('NEW_') ? task.TaskID : undefined,
        title: task.Title || '',
        description: task.Description,
        project_id: cleanProjectId,
        status: dbStatus as any,
        progress: task.ProgressPercent || 0,
        priority: task.Priority as any,
        start_date: task.StartDate || null,
        due_date: task.DueDate || null,
        actual_start_date: task.ActualStartDate || null,
        actual_end_date: task.ActualEndDate || null,
        assignee_id: task.AssigneeID && !isDepartmentCode(task.AssigneeID)
            ? task.AssigneeID : null,
        workflow_node_id: task.TimelineStep || task.StepCode || null,
        step_code: task.TimelineStep || task.StepCode || null,
        task_type: (cleanProjectId ? 'project' : 'internal') as any,
        monthly_plan_item_id: task.MonthlyPlanItemID || null,
        responsibility_level: task.ResponsibilityLevel || 'individual',
        metadata: {
            ui_status: task.Status,
            step_code: task.TimelineStep || task.StepCode,
            priority: task.Priority,
            description: task.Description,
            sub_tasks: task.SubTasks,
            attachments: task.Attachments,
            dependencies: task.Dependencies,
            estimated_cost: (task as any).EstimatedCost,
            actual_cost: (task as any).ActualCost,
            estimatedDays: task.DurationDays,
            assignee_role: task.AssigneeID && isDepartmentCode(task.AssigneeID)
                ? task.AssigneeID : undefined,
        },
    } as any;
};
