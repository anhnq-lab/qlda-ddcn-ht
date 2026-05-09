// Types cho module Kế hoạch khung năm, KH tháng, Báo cáo tháng

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

export const DEPARTMENT_CODES = ['HCTH', 'KHDT', 'KTTD', 'QLDA1', 'QLDA2', 'QLDA3', 'PTDV'] as const;
export type DepartmentCode = typeof DEPARTMENT_CODES[number];

export const DEPARTMENT_NAMES: Record<DepartmentCode, string> = {
    HCTH:  'Phòng Hành chính - Tổng hợp',
    KHDT:  'Phòng Kế hoạch - Đấu thầu',
    KTTD:  'Phòng Kỹ thuật - Thẩm định',
    QLDA1: 'Phòng Quản lý dự án 1',
    QLDA2: 'Phòng Quản lý dự án 2',
    QLDA3: 'Phòng Quản lý dự án 3',
    PTDV:  'Phòng Phát triển dịch vụ',
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

    responsible_text?: string;
    collaborating_text?: string;
    responsible_ids?: string[];
    collaborating_ids?: string[];

    notes?: string;
    sort_order?: number;

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

// ─── Nhiệm vụ trong KH tháng ──────────────────────────────────

export interface MonthlyPlanItem {
    id: string;
    monthly_plan_id: string;

    // Links (cả hai nullable)
    annual_plan_item_id?: string;
    project_id?: string;

    group_name?: string;
    group_sort_order?: number;

    task_name: string;
    deliverable?: string;

    deadline_note?: string;  // "Tháng 5", "Tuần 2"
    due_date?: string;       // ISO date nếu có ngày cụ thể

    // Phân công
    staff_id?: string;
    staff_name?: string;
    dept_head_id?: string;
    dept_head_name?: string;
    ban_head_id?: string;
    ban_head_name?: string;

    // Kết quả (điền khi làm BC tháng)
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
}

export type MonthlyPlanItemInput = Omit<MonthlyPlanItem, 'id' | 'created_at' | 'updated_at' | 'annual_plan_item'>;

// ─── View models (dùng trong UI) ─────────────────────────────

// Nhóm tasks theo group_name trong 1 tháng/phòng
export interface MonthlyPlanGroup {
    group_name: string;
    group_sort_order: number;
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
