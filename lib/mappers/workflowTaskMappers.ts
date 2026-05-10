import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import type { DbTask } from '../../services/TaskService';

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
        case 'completed':
        case 'skipped':
            status = TaskStatus.Done;
            break;
        case 'rejected':
            status = TaskStatus.Review;
            break;
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
        Title: wt.name || wt.title || 'Không có tiêu đề',
        TaskType: wt.task_type || metadata.task_type || 'project',
        Description: wt.description || wt.comments || metadata.description || '',
        ProjectID: projectId || wt.project_id || (wt as any).instance?.reference_id || '',
        ProjectName: wt.projects?.project_name || '',
        AssigneeID: wt.assignee_id || metadata.assignee_role || '',
        DueDate: wt.due_date || '',
        StartDate: wt.start_date || wt.started_at || '',
        Status: status,
        Priority: wt.priority || metadata.priority || TaskPriority.Medium,
        ProgressPercent: wt.progress || 0,
        
        // Fields from metadata or direct columns
        DurationDays: metadata.estimatedDays || 10,
        SubTasks: metadata.sub_tasks || [],
        Attachments: metadata.attachments || [],
        Dependencies: metadata.dependencies || [],
        EstimatedCost: Number(metadata.estimated_cost) || 0,
        ActualCost: Number(metadata.actual_cost) || 0,
        
        // Actual dates
        ActualStartDate: metadata.actualStartDate || wt.started_at || '',
        ActualEndDate: metadata.actualEndDate || wt.completed_at || '',
        
        // Workflow/Step reference
        TimelineStep: wt.step_code || metadata.step_code || wt.workflow_node_id || wt.node_id || '',
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
    let dbStatus = 'pending';
    switch (task.Status) {
        case TaskStatus.Todo: dbStatus = 'pending'; break;
        case TaskStatus.InProgress: dbStatus = 'in_progress'; break;
        case TaskStatus.Review: dbStatus = 'in_progress'; break;
        case TaskStatus.Done: dbStatus = 'completed'; break;
    }

    return {
        id: task.TaskID && !task.TaskID.startsWith('NEW_') ? task.TaskID : undefined,
        name: task.Title || '',
        description: task.Description,
        project_id: projectId || task.ProjectID,
        status: dbStatus as any,
        progress: task.ProgressPercent || 0,
        priority: task.Priority as any,
        start_date: task.StartDate || null,
        due_date: task.DueDate || null,
        started_at: task.ActualStartDate || null,
        completed_at: task.ActualEndDate || null,
        assignee_id: task.AssigneeID && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.AssigneeID)
            ? task.AssigneeID : null,
        workflow_node_id: task.TimelineStep || task.StepCode || null,
        step_code: task.TimelineStep || task.StepCode || null,
        task_type: 'project' as any,
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
            assignee_role: task.AssigneeID && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.AssigneeID)
                ? task.AssigneeID : undefined,
        },
    } as any;
};
