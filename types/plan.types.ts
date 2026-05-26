// Types cho module Kế hoạch khung năm, KH tháng, Báo cáo tháng
import type { Task } from './task.types';

// ─── Enums (khớp với DB) ──────────────────────────────────────

export type PlanFrequency =
    | 'one_time'   // Một lần
    | 'monthly'    // Hàng tháng
    | 'quarterly'  // Hàng quý
    | 'daily'      // Hàng ngày
    | 'as_needed'; // Khi phát sinh

export type MonthlyTaskStatus =
    | 'planned'    // Đã lên kế hoạch
    | 'completed'  // Hoàn thành
    | 'incomplete' // Chưa hoàn thành
    | 'partial'    // Hoàn thành một phần
    | 'deferred';  // Chuyển sang tháng sau

export type PlanStatus = 'draft' | 'published' | 'closed';

// ─── Mã phòng ban ─────────────────────────────────────────────

export const DEPARTMENT_CODES = ['HCTH', 'KHDT', 'KTTD', 'QLDA1', 'QLDA2', 'QLDA3', 'PTDV', 'TCKT'] as const;
export type DepartmentCode = typeof DEPARTMENT_CODES[number];

export const DEPARTMENT_NAMES: Record<DepartmentCode, string> = {
    HCTH:  'Phòng Hành chính - Tổng hợp',
    KHDT:  'Phòng Kế hoạch - Đấu thầu',
    KTTD:  'Phòng Kỹ thuật - Thẩm định',
    QLDA1: 'Phòng Quản lý dự án 1',
    QLDA2: 'Phòng Quản lý dự án 2',
    QLDA3: 'Phòng Quản lý dự án 3',
    PTDV:  'Phòng Phát triển dịch vụ',
    TCKT:  'Phòng Tài chính - Kế toán',
};

export const FREQUENCY_LABELS: Record<PlanFrequency, string> = {
    one_time:  'Một lần',
    monthly:   'Hàng tháng',
    quarterly: 'Hàng quý',
    daily:     'Hàng ngày',
    as_needed: 'Khi phát sinh',
};

export const MONTHLY_STATUS_LABELS: Record<MonthlyTaskStatus, string> = {
    planned:    'Chưa báo cáo',
    completed:  'Hoàn thành',
    incomplete: 'Chưa hoàn thành',
    partial:    'Hoàn thành một phần',
    deferred:   'Chuyển tháng sau',
};

// ─── Kế hoạch khung năm ───────────────────────────────────────

export interface AnnualPlanItem {
    id: string;
    plan_year: number;

    department_code: DepartmentCode;
    department_name: string;

    group_name?: string;
    group_sort_order?: number;

    task_name: string;
    deliverable?: string;

    start_period?: string;  // "Quý I", "Tháng 4", "Hàng tháng"
    end_period?: string;
    frequency: PlanFrequency;

    // Link dự án (nullable)
    project_id?: string;

    // Link bước dự án cụ thể (nullable) — FK → project_plan_items.id
    project_step_id?: string;

    // Nguồn gốc (nếu xuất từ KHTHDA)
    source_task_id?: string;
    source_type?: 'manual' | 'from_project_task';

    collaborating_dept_codes?: DepartmentCode[];
    collaborating_text?: string;

    notes?: string;
    sort_order?: number;

    // Approval Workflow columns (Điều 7)
    approval_status?: 'draft' | 'submitted' | 'approved' | 'rejected';
    submitted_by?: string;
    submitted_at?: string;
    approved_by?: string;
    approved_at?: string;
    rejected_reason?: string;
    adjustment_reason?: string;

    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

// Dùng khi tạo/sửa (bỏ id + audit fields)
export type AnnualPlanItemInput = Omit<AnnualPlanItem, 'id' | 'created_at' | 'updated_at'>;

// ─── KH tháng (header) ────────────────────────────────────────

export interface MonthlyPlan {
    id: string;
    plan_month: number;   // 1-12
    plan_year: number;
    department_code: DepartmentCode;
    department_name: string;
    status: PlanStatus;
    notes?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;

    // Populated khi fetch chi tiết
    items?: MonthlyPlanItem[];
}

export type MonthlyPlanInput = Omit<MonthlyPlan, 'id' | 'created_at' | 'updated_at' | 'items'>;

// ─── Bước trong Kế hoạch dự án ───────────────────────────────

export type ProjectPlanStatus = 'planned' | 'completed' | 'incomplete' | 'partial' | 'deferred';

export interface ProjectPlanItem {
    id: string;
    project_id: string;

    // Nguồn gốc workflow (optional)
    workflow_id?: string;
    workflow_node_id?: string;

    // Phân loại & thứ tự
    step_code?: string;
    step_order: number;
    phase?: 'preparation' | 'execution' | 'completion';

    // Nội dung bước
    task_name: string;
    deliverable?: string;
    legal_basis?: string;
    output_document?: string;
    assignee_role?: string;
    collaborating_dept_codes?: DepartmentCode[];
    collaborating_text?: string;

    // Tiến độ
    start_date?: string;
    due_date?: string;
    duration_days?: number;

    // Trạng thái
    status: ProjectPlanStatus;
    completion_result?: string;
    incomplete_reason?: string;
    notes?: string;

    sort_order: number;
    created_by?: string;
    created_at?: string;
    updated_at?: string;

    // Computed khi join với monthly_plan_items
    is_scheduled?: boolean;
    scheduled_monthly_plan_id?: string | null;
}

// ─── Nhiệm vụ trong KH tháng ──────────────────────────────────

export interface MonthlyPlanItem {
    id: string;
    monthly_plan_id: string;

    // Links
    annual_plan_item_id?: string;
    project_id?: string;            // Tự liên kết với dự án (user-facing, không phải project step)
    project_name?: string;

    // Nguồn gốc (source tracking)
    source_task_id?: string;      // Task cấp phòng từ KHTHDA
    source_subtask_id?: string;   // Sub-task cấp cá nhân từ KHTHDA
    source_project_plan_item_id?: string; // Bước từ KH dự án → FK project_plan_items.id
    source_type?: 'manual' | 'from_annual' | 'from_project_task' | 'from_subtask' | 'project_step';

    task_name: string;
    deliverable?: string;

    deadline_note?: string;
    due_date?: string;

    collaborating_dept_codes?: DepartmentCode[];
    collaborating_text?: string;

    // Kết quả
    status: MonthlyTaskStatus;
    completion_result?: string;
    incomplete_reason?: string;
    deferred_to_plan_id?: string;

    notes?: string;
    sort_order?: number;

    created_by?: string;
    created_at?: string;
    updated_at?: string;

    // Populated khi join
    annual_plan_item?: AnnualPlanItem;
    tasks?: Task[];
}

export type MonthlyPlanItemInput = Omit<MonthlyPlanItem, 'id' | 'created_at' | 'updated_at' | 'annual_plan_item' | 'tasks'>;

// Helper: lấy danh sách phòng phối hợp để hiển thị
export function getStaffDisplay(item: MonthlyPlanItem): string {
    if (item.collaborating_dept_codes && item.collaborating_dept_codes.length > 0) {
        return item.collaborating_dept_codes.join(', ');
    }
    if (item.collaborating_text) return item.collaborating_text;
    return '—';
}

// Helper: source badge
export const SOURCE_TYPE_CONFIG = {
    manual:            { label: 'Thủ công',   color: 'text-slate-500',  bg: 'bg-slate-100',  icon: '✍️' },
    from_annual:       { label: 'KH Khung',   color: 'text-blue-600',   bg: 'bg-blue-50',    icon: '📂' },
    from_project_task: { label: 'Dự án',      color: 'text-violet-600', bg: 'bg-violet-50',  icon: '📁' },
    from_subtask:      { label: 'Dự án',      color: 'text-violet-600', bg: 'bg-violet-50',  icon: '📁' },
    project_step:      { label: 'Bước DA',    color: 'text-emerald-600',bg: 'bg-emerald-50', icon: '🗂️' },
} as const;

// Nhóm tasks theo phase trong 1 tháng/phòng
export interface MonthlyPlanGroup {
    phase: string;
    items: MonthlyPlanItem[];
}

// Tổng hợp báo cáo tháng (dùng cho dashboard & export)
export interface MonthlyReportSummary {
    plan_month: number;
    plan_year: number;
    department_code: DepartmentCode;
    department_name: string;
    total_tasks: number;
    completed: number;
    incomplete: number;
    partial: number;
    deferred: number;
    planned: number;
    completion_rate: number; // 0-100
}

// ─── DB row types (khớp với Supabase response) ───────────────

export interface DbAnnualPlanItem extends AnnualPlanItem {}

export interface DbMonthlyPlan extends Omit<MonthlyPlan, 'items'> {}

export interface DbMonthlyPlanItem extends Omit<MonthlyPlanItem, 'annual_plan_item'> {}
