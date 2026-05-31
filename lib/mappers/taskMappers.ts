/**
 * Task Mappers — DB <-> UI mapping for unified tasks table (UUID PK)
 */
import { Task, TaskStatus, TaskPriority, TaskType, TaskCategory } from '../../types/task.types';
import type { DbTask } from '../../services/TaskService';

/** Map DB row → UI Task model */
export const dbToTask = (row: DbTask): Task => ({
    TaskID: row.id,
    Title: row.title,
    Description: row.description || '',
    TaskType: row.task_type as TaskType,
    ProjectID: row.project_id || '',
    MonthlyPlanItemID: row.monthly_plan_item_id || row.metadata?.monthly_plan_item_id || undefined,
    ProjectPlanItemID: row.project_plan_step_id || row.project_plan_item_id || undefined,
    AssigneeID: row.assignee_id || row.metadata?.assignee_role || '',
    CollaboratorIDs: row.collaborator_ids || [],
    ApproverID: row.approver_id || undefined,
    Status: row.status as TaskStatus,
    Priority: row.priority as TaskPriority,
    ProgressPercent: row.progress || 0,
    Progress: row.progress || 0,
    StartDate: row.start_date || undefined,
    DueDate: row.due_date || '',
    DurationDays: row.duration_days || undefined,
    ActualStartDate: row.actual_start_date || undefined,
    ActualEndDate: row.actual_end_date || undefined,
    Phase: row.phase || undefined,
    StepCode: row.step_code || undefined,
    SortOrder: row.sort_order,
    LegalBasis: row.legal_basis || undefined,
    OutputDocument: row.output_document || undefined,
    PredecessorTaskID: row.predecessor_task_id || undefined,
    Category: (row.category as TaskCategory) || undefined,
    CompletionResult: row.completion_result || undefined,
    IncompleteReason: row.incomplete_reason || undefined,
    Notes: row.notes || undefined,
    Obstacles: row.obstacles || row.metadata?.obstacles || undefined,
    SubTasks: row.metadata?.sub_tasks || [],
    Attachments: row.metadata?.attachments || [],
    Dependencies: row.metadata?.dependencies || [],
    Metadata: row.metadata,
    IsCritical: row.metadata?.isCritical || false,
    CreatedDate: row.created_at,
});

/** Map UI Task → DB row for insert/update */
export const taskToDb = (task: Partial<Task>): Partial<DbTask> => {
    const row: any = {};
    
    if (task.TaskID) row.id = task.TaskID;
    if (task.Title !== undefined) row.title = task.Title;
    if (task.Description !== undefined) row.description = task.Description || null;
    if (task.TaskType) row.task_type = task.TaskType;
    if (task.ProjectID !== undefined) row.project_id = task.ProjectID || null;
    if (task.Status) row.status = task.Status;
    if (task.Priority) row.priority = task.Priority;
    if (task.ProgressPercent !== undefined) row.progress = task.ProgressPercent;
    if (task.AssigneeID !== undefined) row.assignee_id = task.AssigneeID || null;
    if (task.CollaboratorIDs !== undefined) row.collaborator_ids = task.CollaboratorIDs || null;
    if (task.ApproverID !== undefined) row.approver_id = task.ApproverID || null;
    if (task.StartDate !== undefined) row.start_date = task.StartDate || null;
    if (task.DueDate !== undefined) row.due_date = task.DueDate || null;
    if (task.DurationDays !== undefined) row.duration_days = task.DurationDays;
    if (task.ActualStartDate !== undefined) row.actual_start_date = task.ActualStartDate || null;
    if (task.ActualEndDate !== undefined) row.actual_end_date = task.ActualEndDate || null;
    if (task.Phase !== undefined) row.phase = task.Phase || null;
    if (task.StepCode !== undefined) row.step_code = task.StepCode || null;
    if (task.SortOrder !== undefined) row.sort_order = task.SortOrder;
    if (task.LegalBasis !== undefined) row.legal_basis = task.LegalBasis || null;
    if (task.OutputDocument !== undefined) row.output_document = task.OutputDocument || null;
    if (task.PredecessorTaskID !== undefined) row.predecessor_task_id = task.PredecessorTaskID || null;
    if (task.Category !== undefined) row.category = task.Category || null;
    if (task.CompletionResult !== undefined) row.completion_result = task.CompletionResult || null;
    if (task.IncompleteReason !== undefined) row.incomplete_reason = task.IncompleteReason || null;
    if (task.Notes !== undefined) row.notes = task.Notes || null;
    if (task.Obstacles !== undefined) row.obstacles = task.Obstacles || null;
    if (task.MonthlyPlanItemID !== undefined) row.monthly_plan_item_id = task.MonthlyPlanItemID || null;
    if (task.ProjectPlanItemID !== undefined) {
        row.project_plan_step_id = task.ProjectPlanItemID || null;
        row.project_plan_item_id = task.ProjectPlanItemID || null;
    }
    
    // Build metadata
    row.metadata = {
        ...(task.Metadata || {}),
        sub_tasks: task.SubTasks,
        attachments: task.Attachments,
        dependencies: task.Dependencies,
        isCritical: task.IsCritical,
    };
    
    return row;
};

