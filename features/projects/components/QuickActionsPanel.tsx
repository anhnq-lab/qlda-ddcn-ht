import React from 'react';
import {
    FileText, Send, Download, CalendarPlus, RefreshCw,
    Settings, Loader2, Zap
} from 'lucide-react';

interface QuickAction {
    id: string;
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
    disabled?: boolean;
}

interface QuickActionsPanelProps {
    actions?: QuickAction[];
    onGenerateMonthlyReport?: () => void;
    onExportKhoiCong?: () => void;
    onSendReminder?: () => void;
    onExportExcel?: () => void;
    onScheduleMeeting?: () => void;
    onSync?: () => void;
    isSyncing?: boolean;
    compact?: boolean;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
    actions,
    onGenerateMonthlyReport,
    onExportKhoiCong,
    onSendReminder,
    onExportExcel,
    onScheduleMeeting,
    onSync,
    isSyncing = false,
    compact = false
}) => {
    const defaultActions: QuickAction[] = [
        {
            id: 'monthly-report',
            label: 'Tạo BC tháng',
            icon: FileText,
            onClick: onGenerateMonthlyReport || (() => { }),
            variant: 'primary'
        },
        {
            id: 'export-khoi-cong',
            label: 'TB khởi công',
            icon: FileText,
            onClick: onExportKhoiCong || (() => { }),
            variant: 'secondary'
        },
        {
            id: 'send-reminder',
            label: 'Gửi nhắc nhở',
            icon: Send,
            onClick: onSendReminder || (() => { }),
            variant: 'secondary'
        },
        {
            id: 'export-excel',
            label: 'Xuất Excel',
            icon: Download,
            onClick: onExportExcel || (() => { }),
            variant: 'secondary'
        },
        {
            id: 'schedule-meeting',
            label: 'Lên lịch họp',
            icon: CalendarPlus,
            onClick: onScheduleMeeting || (() => { }),
            variant: 'secondary'
        },
        {
            id: 'sync',
            label: isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ CSDLQG',
            icon: RefreshCw,
            onClick: onSync || (() => { }),
            variant: 'secondary',
            loading: isSyncing,
            disabled: isSyncing
        }
    ];

    const actionsToRender = actions || defaultActions;

    const getButtonStyle = (variant: QuickAction['variant'] = 'secondary', disabled?: boolean) => {
        if (disabled) return 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400 cursor-not-allowed';
        switch (variant) {
            case 'primary':
                return 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-sm shadow-primary-200/50 dark:shadow-primary-900/30';
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200';
            default:
                return 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate- text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600';
        }
    };

    if (compact) {
        return (
            <div className="flex flex-wrap gap-2">
                {actionsToRender.slice(0, 4).map(action => (
                    <button
                        key={action.id}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${getButtonStyle(action.variant, action.disabled)}`}
                    >
                        {action.loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <action.icon className="w-3.5 h-3.5" />
                        )}
                        {action.label}
                    </button>
                ))}
            </div>
        );
    }

    // Split: first action = primary hero, rest = small grid
    const [primary, ...rest] = actionsToRender;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><Zap className="w-3.5 h-3.5" /></div>
                    <span>Thao tác nhanh</span>
                </div>
            </div>

            <div className="p-3 space-y-2">
                {/* Primary action — full width */}
                <button
                    onClick={primary.onClick}
                    disabled={primary.disabled}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-[0.98] ${getButtonStyle(primary.variant, primary.disabled)}`}
                >
                    {primary.loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <primary.icon className="w-4 h-4" />
                    )}
                    {primary.label}
                </button>

                {/* Secondary actions — compact 2-col grid */}
                <div className="grid grid-cols-2 gap-2">
                    {rest.map(action => (
                        <button
                            key={action.id}
                            onClick={action.onClick}
                            disabled={action.disabled}
                            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all active:scale-[0.97] ${getButtonStyle(action.variant, action.disabled)}`}
                        >
                            {action.loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <action.icon className="w-3.5 h-3.5" />
                            )}
                            <span className="truncate">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickActionsPanel;
