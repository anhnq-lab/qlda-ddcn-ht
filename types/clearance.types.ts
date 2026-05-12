// Site Clearance (GPMB) types

export type ClearanceStatus = 'Chưa bắt đầu' | 'Đang thực hiện' | 'Hoàn thành';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface SiteClearance {
    id: string;
    project_id: string;
    total_area: number;
    cleared_area: number;
    total_households: number;
    resettled_households: number;
    compensation_budget: number;
    disbursed_compensation: number;
    status: ClearanceStatus;
    created_at?: string;
    updated_at?: string;
}

export interface SiteClearanceMilestone {
    id: string;
    project_id: string;
    step_number: number;
    step_name: string;
    status: MilestoneStatus;
    completed_date?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

// Data Transfer Objects
export interface UpdateSiteClearanceDTO {
    total_area?: number;
    cleared_area?: number;
    total_households?: number;
    resettled_households?: number;
    compensation_budget?: number;
    disbursed_compensation?: number;
    status?: ClearanceStatus;
}

export interface UpdateClearanceMilestoneDTO {
    status?: MilestoneStatus;
    completed_date?: string | null;
    notes?: string | null;
}
