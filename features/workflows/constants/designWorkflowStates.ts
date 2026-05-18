export interface DesignWorkflowState {
    code: string;
    label: string;
    color: 'gray' | 'blue' | 'indigo' | 'amber' | 'cyan' | 'violet' | 'orange' | 'purple' | 'teal' | 'yellow' | 'green' | 'emerald' | 'slate';
    bgClass: string;
    textClass: string;
    borderClass: string;
}

export const DESIGN_WORKFLOW_STATES: DesignWorkflowState[] = [
    { code: '01', label: 'Khởi tạo quy trình',          color: 'gray',    bgClass: 'bg-gray-100 dark:bg-gray-800',       textClass: 'text-gray-700 dark:text-gray-300',     borderClass: 'border-gray-300 dark:border-gray-600' },
    { code: '02', label: 'Rà soát điều kiện',            color: 'blue',    bgClass: 'bg-blue-100 dark:bg-blue-900/40',    textClass: 'text-blue-700 dark:text-blue-300',     borderClass: 'border-blue-300 dark:border-blue-700' },
    { code: '03', label: 'Giao tư vấn',                  color: 'indigo',  bgClass: 'bg-indigo-100 dark:bg-indigo-900/40',textClass: 'text-indigo-700 dark:text-indigo-300', borderClass: 'border-indigo-300 dark:border-indigo-700' },
    { code: '04', label: 'Tư vấn đang thực hiện',        color: 'amber',   bgClass: 'bg-amber-100 dark:bg-amber-900/40',  textClass: 'text-amber-700 dark:text-amber-300',   borderClass: 'border-amber-300 dark:border-amber-700' },
    { code: '05', label: 'Tiếp nhận hồ sơ',              color: 'cyan',    bgClass: 'bg-cyan-100 dark:bg-cyan-900/40',    textClass: 'text-cyan-700 dark:text-cyan-300',     borderClass: 'border-cyan-300 dark:border-cyan-700' },
    { code: '06', label: 'QLDA kiểm tra',                color: 'violet',  bgClass: 'bg-violet-100 dark:bg-violet-900/40',textClass: 'text-violet-700 dark:text-violet-300', borderClass: 'border-violet-300 dark:border-violet-700' },
    { code: '07', label: 'Yêu cầu chỉnh sửa',            color: 'orange',  bgClass: 'bg-orange-100 dark:bg-orange-900/40',textClass: 'text-orange-700 dark:text-orange-300', borderClass: 'border-orange-300 dark:border-orange-700' },
    { code: '08', label: 'Thẩm tra / thẩm định',         color: 'purple',  bgClass: 'bg-purple-100 dark:bg-purple-900/40',textClass: 'text-purple-700 dark:text-purple-300', borderClass: 'border-purple-300 dark:border-purple-700' },
    { code: '09', label: 'Hoàn thiện sau thẩm định',     color: 'teal',    bgClass: 'bg-teal-100 dark:bg-teal-900/40',    textClass: 'text-teal-700 dark:text-teal-300',     borderClass: 'border-teal-300 dark:border-teal-700' },
    { code: '10', label: 'Trình phê duyệt',              color: 'yellow',  bgClass: 'bg-yellow-100 dark:bg-yellow-900/40',textClass: 'text-yellow-700 dark:text-yellow-300', borderClass: 'border-yellow-300 dark:border-yellow-700' },
    { code: '11', label: 'Đã phê duyệt',                 color: 'green',   bgClass: 'bg-green-100 dark:bg-green-900/40',  textClass: 'text-green-700 dark:text-green-300',   borderClass: 'border-green-300 dark:border-green-700' },
    { code: '12', label: 'Bàn giao và chuyển bước',      color: 'emerald', bgClass: 'bg-emerald-100 dark:bg-emerald-900/40', textClass: 'text-emerald-700 dark:text-emerald-300', borderClass: 'border-emerald-300 dark:border-emerald-700' },
    { code: '13', label: 'Hoàn tất',                     color: 'slate',   bgClass: 'bg-slate-100 dark:bg-slate-700',     textClass: 'text-slate-700 dark:text-slate-300',   borderClass: 'border-slate-300 dark:border-slate-600' },
] as const;

export const DESIGN_STATE_MAP = Object.fromEntries(
    DESIGN_WORKFLOW_STATES.map(s => [s.code, s])
) as Record<string, DesignWorkflowState>;

export function getDesignState(code: string): DesignWorkflowState {
    return DESIGN_STATE_MAP[code] ?? DESIGN_WORKFLOW_STATES[0];
}

export const DESIGN_WORKFLOW_CODES = ['QT-TK1B', 'QT-TK2B', 'QT-TK3B'] as const;
export type DesignWorkflowCode = typeof DESIGN_WORKFLOW_CODES[number];

export function isDesignWorkflow(code: string): code is DesignWorkflowCode {
    return DESIGN_WORKFLOW_CODES.includes(code as DesignWorkflowCode);
}
