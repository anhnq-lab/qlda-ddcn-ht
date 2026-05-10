// ============================================================
// Evaluation Module Types — Phiếu Đánh Giá, Xếp Loại
// ============================================================

export type EvaluationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface EvaluationForm {
    id: string;
    employee_id: string;
    employee_name: string;
    department_code: string;
    department_name: string;
    eval_month: number;
    eval_year: number;

    // Tự đánh giá
    self_score_1: number;  // Thực hiện nhiệm vụ (max 60)
    self_score_2: number;  // Kỷ luật (max 10)
    self_score_3: number;  // Trách nhiệm / thái độ (max 10)
    self_score_4: number;  // Hợp tác đồng nghiệp (max 5)
    self_score_5: number;  // Tự học tập (max 5)
    self_score_6: number;  // Quy định nội bộ (max 5)
    self_score_7: number;  // Thưởng/phạt đặc biệt (±5)
    self_notes: string | null;
    self_submitted_at: string | null;

    // Đánh giá trưởng phòng
    manager_score_1: number | null;
    manager_score_2: number | null;
    manager_score_3: number | null;
    manager_score_4: number | null;
    manager_score_5: number | null;
    manager_score_6: number | null;
    manager_score_7: number | null;
    manager_notes: string | null;
    manager_id: string | null;
    manager_name: string | null;
    reviewed_at: string | null;

    status: EvaluationStatus;
    created_at: string;
    updated_at: string;
}

// Tiêu chí đánh giá
export interface EvaluationCriteria {
    key: keyof Pick<EvaluationForm,
        'self_score_1'|'self_score_2'|'self_score_3'|
        'self_score_4'|'self_score_5'|'self_score_6'|'self_score_7'
    >;
    managerKey: keyof Pick<EvaluationForm,
        'manager_score_1'|'manager_score_2'|'manager_score_3'|
        'manager_score_4'|'manager_score_5'|'manager_score_6'|'manager_score_7'
    >;
    label: string;
    maxScore: number;
    description: string;
}

export const EVALUATION_CRITERIA: EvaluationCriteria[] = [
    {
        key: 'self_score_1',
        managerKey: 'manager_score_1',
        label: 'Kết quả thực hiện nhiệm vụ',
        maxScore: 60,
        description: 'Mức độ hoàn thành nhiệm vụ được giao, tiến độ, chất lượng sản phẩm/công việc',
    },
    {
        key: 'self_score_2',
        managerKey: 'manager_score_2',
        label: 'Ý thức tổ chức kỷ luật',
        maxScore: 10,
        description: 'Chấp hành giờ giấc, nội quy cơ quan, quy định về báo cáo',
    },
    {
        key: 'self_score_3',
        managerKey: 'manager_score_3',
        label: 'Tinh thần trách nhiệm & thái độ',
        maxScore: 10,
        description: 'Tích cực, chủ động trong công việc; thái độ phục vụ nhân dân và đồng nghiệp',
    },
    {
        key: 'self_score_4',
        managerKey: 'manager_score_4',
        label: 'Tinh thần hợp tác, hỗ trợ đồng nghiệp',
        maxScore: 5,
        description: 'Sẵn sàng phối hợp, chia sẻ, hỗ trợ đồng nghiệp hoàn thành công việc',
    },
    {
        key: 'self_score_5',
        managerKey: 'manager_score_5',
        label: 'Tự học tập, nâng cao trình độ',
        maxScore: 5,
        description: 'Tham gia đào tạo, tự nghiên cứu nâng cao năng lực chuyên môn, kỹ năng',
    },
    {
        key: 'self_score_6',
        managerKey: 'manager_score_6',
        label: 'Chấp hành quy định nội bộ',
        maxScore: 5,
        description: 'Tuân thủ quy chế, quy định của cơ quan; sử dụng tài sản công đúng mục đích',
    },
    {
        key: 'self_score_7',
        managerKey: 'manager_score_7',
        label: 'Điểm thưởng/phạt đặc biệt',
        maxScore: 5,
        description: 'Thưởng khi có thành tích xuất sắc; trừ khi vi phạm kỷ luật (±5 điểm)',
    },
];

// Xếp loại theo điểm tổng
export type EvaluationClassification =
    | 'Hoàn thành xuất sắc'
    | 'Hoàn thành tốt'
    | 'Hoàn thành'
    | 'Không hoàn thành';

export function getClassification(total: number): EvaluationClassification {
    if (total >= 90) return 'Hoàn thành xuất sắc';
    if (total >= 80) return 'Hoàn thành tốt';
    if (total >= 70) return 'Hoàn thành';
    return 'Không hoàn thành';
}

export function calcSelfTotal(form: Partial<EvaluationForm>): number {
    return (
        (form.self_score_1 ?? 0) +
        (form.self_score_2 ?? 0) +
        (form.self_score_3 ?? 0) +
        (form.self_score_4 ?? 0) +
        (form.self_score_5 ?? 0) +
        (form.self_score_6 ?? 0) +
        (form.self_score_7 ?? 0)
    );
}

export function calcManagerTotal(form: Partial<EvaluationForm>): number {
    return (
        (form.manager_score_1 ?? 0) +
        (form.manager_score_2 ?? 0) +
        (form.manager_score_3 ?? 0) +
        (form.manager_score_4 ?? 0) +
        (form.manager_score_5 ?? 0) +
        (form.manager_score_6 ?? 0) +
        (form.manager_score_7 ?? 0)
    );
}

export const STATUS_CONFIG: Record<EvaluationStatus, {
    label: string;
    color: string;
    bg: string;
    darkBg: string;
    darkColor: string;
}> = {
    draft: {
        label: 'Nháp',
        color: 'text-slate-600',
        bg: 'bg-slate-100',
        darkBg: 'dark:bg-slate-800',
        darkColor: 'dark:text-slate-300',
    },
    submitted: {
        label: 'Chờ duyệt',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        darkBg: 'dark:bg-amber-900/30',
        darkColor: 'dark:text-amber-300',
    },
    approved: {
        label: 'Đã duyệt',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        darkBg: 'dark:bg-emerald-900/30',
        darkColor: 'dark:text-emerald-300',
    },
    rejected: {
        label: 'Từ chối',
        color: 'text-red-700',
        bg: 'bg-red-50',
        darkBg: 'dark:bg-red-900/30',
        darkColor: 'dark:text-red-300',
    },
};

export const CLASSIFICATION_CONFIG: Record<EvaluationClassification, {
    color: string;
    bg: string;
    darkBg: string;
    darkColor: string;
    border: string;
}> = {
    'Hoàn thành xuất sắc': {
        color: 'text-violet-700',
        bg: 'bg-violet-50',
        darkBg: 'dark:bg-violet-900/30',
        darkColor: 'dark:text-violet-300',
        border: 'border-violet-200 dark:border-violet-700',
    },
    'Hoàn thành tốt': {
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        darkBg: 'dark:bg-emerald-900/30',
        darkColor: 'dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-700',
    },
    'Hoàn thành': {
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        darkBg: 'dark:bg-blue-900/30',
        darkColor: 'dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-700',
    },
    'Không hoàn thành': {
        color: 'text-red-700',
        bg: 'bg-red-50',
        darkBg: 'dark:bg-red-900/30',
        darkColor: 'dark:text-red-300',
        border: 'border-red-200 dark:border-red-700',
    },
};

export const MONTHS_VI = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];
