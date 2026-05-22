// Static lookup tables + status configs used by BiddingPackageDetail.
// Extracted so the main component file no longer carries 50+ lines of
// pure data and so other components can reuse these labels.
import { PackageStatus } from '../../../types';

export type TabType = 'overview' | 'contractor' | 'contract' | 'settlement';

export interface StatusConfig {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
}

export const STATUS_CONFIGS: Record<PackageStatus, StatusConfig> = {
    [PackageStatus.Selection]: {
        label: 'Lựa chọn nhà thầu',
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-700',
        dot: 'bg-blue-500',
    },
    [PackageStatus.Execution]: {
        label: 'Đang thực hiện',
        bg: 'bg-green-100 dark:bg-green-900/40',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-700',
        dot: 'bg-green-500',
    },
    [PackageStatus.Completed]: {
        label: 'Kết thúc',
        bg: 'bg-gray-100 dark:bg-slate-700',
        text: 'text-gray-600 dark:text-slate-300',
        border: 'border-gray-200 dark:border-slate-600',
        dot: 'bg-gray-400',
    },
};

export const getStatusConfig = (status: PackageStatus): StatusConfig =>
    STATUS_CONFIGS[status] || STATUS_CONFIGS[PackageStatus.Selection];

export const FIELD_LABELS: Record<string, string> = {
    Construction: 'Xây lắp',
    Consultancy: 'Tư vấn',
    NonConsultancy: 'Phi tư vấn',
    Goods: 'Hàng hóa',
    Mixed: 'Hỗn hợp',
};

export const METHOD_LABELS: Record<string, string> = {
    OpenBidding: 'Đấu thầu rộng rãi',
    LimitedBidding: 'Đấu thầu hạn chế',
    Appointed: 'Chỉ định thầu thông thường',
    AppointedSimplified: 'Chỉ định thầu rút gọn',
    CompetitiveShopping: 'Chào hàng cạnh tranh',
    DirectProcurement: 'Mua sắm trực tiếp',
    SelfExecution: 'Tự thực hiện',
    CommunityParticipation: 'Cộng đồng tham gia',
};

export const PROCEDURE_LABELS: Record<string, string> = {
    OneStageOneEnvelope: '1 giai đoạn 1 túi hồ sơ',
    OneStageTwoEnvelope: '1 giai đoạn 2 túi hồ sơ',
    TwoStageOneEnvelope: '2 giai đoạn 1 túi hồ sơ',
    TwoStageTwoEnvelope: '2 giai đoạn 2 túi hồ sơ',
    Reduced: 'Rút gọn',
    Normal: 'Thông thường',
};

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
    LumpSum: 'Trọn gói',
    UnitPrice: 'Đơn giá cố định',
    AdjustableUnitPrice: 'Đơn giá điều chỉnh',
    TimeBased: 'Theo thời gian',
    Percentage: 'Theo tỷ lệ phần trăm',
    Mixed: 'Hỗn hợp',
};
