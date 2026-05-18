import React from 'react';
import {
    ChevronDown, ChevronRight, Layers, Globe, Trash2, Loader2
} from 'lucide-react';
import { BiddingPackage, ProcurementPlan } from '../../../../../types';
import { formatCurrency } from '../../../../../utils/format';
import { getMSCPlanLink } from '../../../../../utils/mscCompliance';

export interface PlanGroup {
    key: string;
    name: string;
    decisionNumber?: string;
    decisionDate?: string;
    mscPlanCode?: string;
    packages: BiddingPackage[];
}

interface PlanGroupHeaderProps {
    group: PlanGroup;
    plan?: ProcurementPlan;
    isExpanded: boolean;
    onToggle: () => void;
    onDeletePlan: (planId: string, planName: string, packageCount: number) => void;
    deletingPlanId: string | null;
}

/**
 * Header bar cho mỗi nhóm KHLCNT — hiển thị tên kế hoạch, QĐ, MSC link,
 * số gói, tổng tiền và nút xóa KHLCNT.
 */
export const PlanGroupHeader: React.FC<PlanGroupHeaderProps> = ({
    group,
    plan,
    isExpanded,
    onToggle,
    onDeletePlan,
    deletingPlanId,
}) => {
    const isUngrouped = group.key === '__ungrouped__';
    const planTotal = group.packages.reduce((sum, p) => sum + (p.Price || 0), 0);

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onToggle}
            onKeyDown={e => e.key === 'Enter' && onToggle()}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-primary-50 to-warning-50 dark:from-transparent dark:to-transparent border-b border-primary-200 dark:border-slate-700 hover:from-primary-100 hover:to-warning-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer select-none"
        >
            {/* Left: chevron + icon + name info */}
            <div className="flex items-center gap-3">
                {isExpanded
                    ? <ChevronDown className="w-5 h-5 text-primary-600 dark:text-slate-400 flex-shrink-0" />
                    : <ChevronRight className="w-5 h-5 text-primary-600 dark:text-slate-400 flex-shrink-0" />
                }
                <Layers className="w-4 h-4 text-primary-600 dark:text-slate-400 flex-shrink-0" />
                <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-primary-900 dark:text-slate-100">
                            {isUngrouped ? 'Gói thầu độc lập (Chưa thuộc KHLCNT)' : group.name}
                        </span>
                        {plan?.PlanCode && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-primary-200/60 text-primary-800 dark:bg-slate-700 dark:text-slate-300 rounded border border-transparent dark:border-slate-600">
                                {plan.PlanCode}
                            </span>
                        )}
                        {!isUngrouped && plan && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded border border-transparent dark:border-blue-800/50">
                                {plan.PlanType === 'EGP' ? 'EGP mới' : 'Hệ thống cũ'}
                            </span>
                        )}
                    </div>
                    {group.decisionNumber && (
                        <span className="text-xs text-primary-700/80 dark:text-primary-400/80">
                            QĐ: {group.decisionNumber}
                            {group.decisionDate && ` (${new Date(group.decisionDate).toLocaleDateString('vi-VN')})`}
                        </span>
                    )}
                </div>
            </div>

            {/* Right: MSC link, package count, total, delete button */}
            <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                {group.mscPlanCode && (
                    <a
                        href={getMSCPlanLink(group.mscPlanCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 rounded hover:bg-blue-200 transition-colors"
                    >
                        <Globe className="w-3 h-3" />{group.mscPlanCode}
                    </a>
                )}
                <span className="px-2 py-1 text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                    {group.packages.length} gói
                </span>
                <span className="text-xs font-bold text-primary-800 dark:text-primary-200 tabular-nums">
                    {formatCurrency(planTotal)}
                </span>
                {!isUngrouped && plan && (
                    <button
                        onClick={() => onDeletePlan(plan.PlanID, plan.PlanName, group.packages.length)}
                        disabled={deletingPlanId === plan.PlanID}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Xóa KHLCNT"
                    >
                        {deletingPlanId === plan.PlanID
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />
                        }
                    </button>
                )}
            </div>
        </div>
    );
};
