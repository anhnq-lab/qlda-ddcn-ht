// Task management types — Unified schema (UUID PK)

// ─── Task Category (13 phân loại cố định cho báo cáo tháng) ──────────
export const TASK_CATEGORIES = [
    'dieu_hanh', 'tham_dinh', 'thi_cong', 'quyet_toan', 'thanh_toan',
    'gpmb', 'dau_thau', 'dieu_chinh', 'gop_y', 'bao_cao',
    'kiem_tra', 'ban_giao', 'khac'
] as const;
export type TaskCategory = typeof TASK_CATEGORIES[number];

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
    dieu_hanh: 'Điều hành',
    tham_dinh: 'Thẩm định/Phê duyệt',
    thi_cong: 'Thi công/Giám sát',
    quyet_toan: 'Quyết toán',
    thanh_toan: 'Thanh toán',
    gpmb: 'GPMB',
    dau_thau: 'Đấu thầu',
    dieu_chinh: 'Điều chỉnh',
    gop_y: 'Góp ý/Văn bản',
    bao_cao: 'Báo cáo',
    kiem_tra: 'Kiểm tra/QLCL',
    ban_giao: 'Bàn giao/Nghiệm thu',
    khac: 'Khác',
};

export const TASK_CATEGORY_COLORS: Record<TaskCategory, { bg: string; text: string; border: string }> = {
    dieu_hanh: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    tham_dinh: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    thi_cong: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    quyet_toan: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    thanh_toan: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    gpmb: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    dau_thau: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    dieu_chinh: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    gop_y: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    bao_cao: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    kiem_tra: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    ban_giao: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
    khac: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

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

    // Project plan item link (công việc thuộc bước trong KH dự án)
    ProjectPlanItemID?: string;

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
    SortOrder?: number;
    
    // Legal
    LegalBasis?: string;
    OutputDocument?: string;
    
    // Relations
    PredecessorTaskID?: string;
    SubTasks?: SubTask[];
    Dependencies?: TaskDependency[];
    Attachments?: TaskAttachment[];
    
    // Report fields (báo cáo tháng)
    Category?: TaskCategory;
    CompletionResult?: string;
    IncompleteReason?: string;
    IncompleteReasonType?: 'objective' | 'subjective';
    Notes?: string;
    Obstacles?: string;

    // Self-proposal fields (Điều 9.3)
    IsSelfProposed?: boolean;
    ProposalStatus?: 'pending' | 'approved' | 'rejected';
    ProposalApprovedBy?: string;
    ProposalApprovedAt?: string;

    // Metadata (JSONB catch-all)
    Metadata?: Record<string, any>;

    // Flags
    IsCritical?: boolean;
    DepartmentCode?: string;
    
    // Audit
    CreatedDate?: string;
    UpdatedAt?: string;
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
