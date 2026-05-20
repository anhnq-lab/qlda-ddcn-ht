// Task management types — Unified schema (UUID PK)

// Status & Priority enums (matching DB enums)
export enum TaskStatus {
    Todo = 'todo',          // Công việc mới
    InProgress = 'in_progress', // Đang thực hiện
    Done = 'done',          // Hoàn thành
    Incomplete = 'incomplete',  // Chưa hoàn thành
    Review = 'review',      // Legacy – ẩn trên UI, giữ backward-compat
}

export enum TaskPriority {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    Urgent = 'urgent'
}

export type TaskType = 'project' | 'management' | 'internal';

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
    project:    'Công việc dự án',
    management: 'Công việc điều hành',
    internal:   'Công việc nội bộ',
};

export const TASK_TYPE_COLORS: Record<TaskType, { bg: string; text: string; border: string }> = {
    project:    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    management: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
    internal:   { bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200'  },
};

export type ResponsibilityLevel = 'team' | 'individual';

// Main Task interface (maps directly to DB `tasks` table)
export interface Task {
    TaskID: string;          // UUID
    Title: string;
    Description?: string;
    TaskType: TaskType;
    
    // Responsibility level (team = cấp phòng, individual = cá nhân)
    ResponsibilityLevel?: ResponsibilityLevel;

    // Project link (null for internal/management)
    ProjectID: string;
    ProjectName?: string; // Tên dự án từ DB join
    
    // Monthly plan item link (công việc con của KH tháng)
    MonthlyPlanItemID?: string;
    
    // Workflow reference (null if created manually)
    WorkflowID?: string;
    WorkflowNodeID?: string;
    
    // Core fields
    AssigneeID: string;
    CollaboratorIDs?: string[];
    ApproverID?: string;
    Status: TaskStatus;
    Priority: TaskPriority;
    ProgressPercent?: number;
    
    // Plan dates
    StartDate?: string;
    DueDate: string;
    DurationDays?: number;
    
    // Actual dates
    ActualStartDate?: string;
    ActualEndDate?: string;
    
    // Phase/Step (for project plan tab)
    Phase?: string;
    StepCode?: string;
    TimelineStep?: string;     // alias for StepCode (backward compat)
    SortOrder?: number;
    
    // Cost
    EstimatedCost?: number;
    ActualCost?: number;
    
    // Legal
    LegalBasis?: string;
    OutputDocument?: string;
    
    // Relations
    PredecessorTaskID?: string;
    SubTasks?: SubTask[];
    Dependencies?: TaskDependency[];
    Attachments?: TaskAttachment[];
    
    // Metadata (JSONB catch-all)
    Metadata?: Record<string, any>;
    
    // Flags
    IsCritical?: boolean;
    
    // Audit
    CreatedDate?: string;
    Progress?: number;         // alias for ProgressPercent (backward compat)
    BoardColumn?: string;
    Slack?: number;
    PlannedStartDate?: string;
    PlannedEndDate?: string;
    Assignees?: TaskAssignment[];
    SyncStatus?: {
        IsSynced: boolean;
        LastSyncDate?: string;
        NationalProjectCode?: string;
        SyncError?: string;
    };
}

export interface TaskAttachment {
    id: string;
    name: string;
    url: string;
    size: string;
    uploadDate: string;
    type: 'template' | 'uploaded';
}

// Task Dependency Types
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface TaskDependency {
    TaskID: string;
    Type: DependencyType;
    LagDays?: number;
}

// Resource Assignment
export interface TaskAssignment {
    EmployeeID: string;
    AllocationPercent: number;
    Role?: string;
}

export interface SubTask {
    SubTaskID: string;
    Title: string;
    AssigneeID: string;
    Status: 'todo' | 'done';
    DueDate?: string;
}
