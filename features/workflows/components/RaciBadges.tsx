// ═══════════════════════════════════════════════════════════════
// RaciBadges — Hiển thị RACI badges cho 1 workflow node
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import type { NodeRaciSummary } from '../services/WorkflowRaciService';
import { StakeholderService } from '../services/StakeholderService';

interface RaciBadgesProps {
    summary: NodeRaciSummary | undefined;
    /** Compact mode: chỉ hiện stakeholder codes */
    compact?: boolean;
    /** Stakeholder name lookup: code → name */
    getStakeholderName?: (code: string) => string;
    className?: string;
}

const RACI_ORDER = ['R', 'A', 'C', 'I'] as const;

const RACI_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    R: { label: 'R', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    A: { label: 'A', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    C: { label: 'C', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    I: { label: 'I', bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
};

export const RaciBadges: React.FC<RaciBadgesProps> = ({
    summary,
    compact = false,
    getStakeholderName,
    className = '',
}) => {
    if (!summary) return null;

    const getName = getStakeholderName || ((code: string) => code);

    if (compact) {
        // Compact: inline badges R: BQL, TVTK | A: UBND
        return (
            <div className={`flex items-center gap-1 flex-wrap ${className}`}>
                {RACI_ORDER.map(type => {
                    const codes = summary[type];
                    if (codes.length === 0) return null;
                    const style = RACI_STYLES[type];
                    return (
                        <span
                            key={type}
                            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${style.bg} ${style.text} border border-current/10`}
                            title={`${StakeholderService.getRaciLabel(type)}: ${codes.map(getName).join(', ')}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {type}: {codes.join(', ')}
                        </span>
                    );
                })}
            </div>
        );
    }

    // Full mode: cards per RACI type
    return (
        <div className={`grid grid-cols-4 gap-2 ${className}`}>
            {RACI_ORDER.map(type => {
                const codes = summary[type];
                const style = RACI_STYLES[type];
                return (
                    <div key={type} className={`rounded-lg p-2 ${style.bg} border border-current/5`}>
                        <div className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${style.text} flex items-center gap-1`}>
                            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                            {StakeholderService.getRaciLabel(type)} ({type})
                        </div>
                        {codes.length > 0 ? (
                            <div className="space-y-0.5">
                                {codes.map(code => (
                                    <div key={code} className={`text-xs font-medium ${style.text}`}>
                                        {getName(code)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[10px] text-gray-400 dark:text-gray-600 italic">—</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

/** Inline single-line RACI display — for table cells */
export const RaciInline: React.FC<{
    summary: NodeRaciSummary | undefined;
    type: 'R' | 'A' | 'C' | 'I';
    getStakeholderName?: (code: string) => string;
}> = ({ summary, type, getStakeholderName }) => {
    if (!summary) return <span className="text-gray-300 dark:text-gray-600 text-[8px]">—</span>;
    const codes = summary[type];
    if (codes.length === 0) return <span className="text-gray-300 dark:text-gray-600 text-[8px]">—</span>;

    const getName = getStakeholderName || ((code: string) => code);
    const style = RACI_STYLES[type];

    return (
        <div className="flex flex-wrap gap-0.5 justify-center">
            {codes.map(code => (
                <span
                    key={code}
                    className={`inline-flex items-center text-[8px] px-0.5 py-0 rounded font-semibold ${style.bg} ${style.text}`}
                    title={getName(code)}
                >
                    {code}
                </span>
            ))}
        </div>
    );
};

export default RaciBadges;
