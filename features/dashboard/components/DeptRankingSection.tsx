import React, { useMemo } from 'react';
import { Target } from 'lucide-react';
import { DEPARTMENT_NAMES } from '../../../types/plan.types';
import type { DepartmentMonthlyScore } from '../../regulation-scoring/services/scoringService';

interface DeptRankingSectionProps {
    deptScores: DepartmentMonthlyScore[];
}

const CLASSIFICATION_CONFIG = {
    xuat_sac:         { label: 'Xuất sắc',   variant: 'warning' as const },
    tot:              { label: 'Tốt',          variant: 'success' as const },
    hoan_thanh:       { label: 'Hoàn thành',  variant: 'info' as const },
    khong_hoan_thanh: { label: 'Chưa xong',   variant: 'danger' as const },
} as const;

const VARIANT_CLASSES = {
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
    info:    'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
    danger:  'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
} as const;

const RANK_BADGE_CLASSES = [
    'bg-amber-500 text-white',    // #1
    'bg-slate-400 text-white',    // #2
    'bg-amber-700 text-white',    // #3
];

/**
 * QCKHCV Department Ranking section.
 * Shows departments ranked by total_score with classification badges and score breakdown.
 * Extracted from MonthlyBriefingTab as a separate memoized component.
 */
export const DeptRankingSection: React.FC<DeptRankingSectionProps> = React.memo(({ deptScores }) => {
    const sortedScores = useMemo(
        () => [...deptScores].sort((a, b) => (b.total_score || 0) - (a.total_score || 0)),
        [deptScores]
    );

    if (sortedScores.length === 0) return null;

    return (
        <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                        <Target className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-txt-primary uppercase tracking-tight">
                        Bảng xếp hạng Đánh giá Phòng ban (QCKHCV)
                    </h3>
                </div>
            </div>
            <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedScores.map((score, index) => {
                        const deptName = DEPARTMENT_NAMES[score.department_code as keyof typeof DEPARTMENT_NAMES] || score.department_code;
                        const classification = score.classification as keyof typeof CLASSIFICATION_CONFIG;
                        const config = CLASSIFICATION_CONFIG[classification];
                        const badgeVariant = config?.variant || 'neutral';
                        const label = config?.label || 'Chưa có';

                        const rankClass = index < 3
                            ? RANK_BADGE_CLASSES[index]
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-350';

                        const groupA = (Number(score.a1_score || 0) + Number(score.a2_score || 0) + Number(score.a3_score || 0));
                        const groupB = (Number(score.b1_score || 0) + Number(score.b2_score || 0));
                        const groupC = (Number(score.c1_score || 0) + Number(score.c2_score || 0));

                        return (
                            <div
                                key={score.department_code}
                                className="relative flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 shadow-sm"
                                role="article"
                                aria-label={`${deptName}: Hạng ${index + 1}, ${score.total_score}/100 điểm, ${label}`}
                            >
                                {/* Rank badge */}
                                <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${rankClass}`}
                                    aria-hidden="true">
                                    {index + 1}
                                </div>

                                <div className="ml-3 flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">
                                        {deptName}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className="text-[10px] text-slate-400 font-bold">
                                            Điểm: <span className="text-primary-600 dark:text-primary-400 font-black font-mono">{score.total_score}</span>/100
                                        </span>
                                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${VARIANT_CLASSES[badgeVariant]}`}>
                                            {label}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-450 mt-2 font-medium">
                                        Hoàn thành: {groupA}đ · Giải ngân: {groupB}đ · Chung: {groupC}đ
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

DeptRankingSection.displayName = 'DeptRankingSection';
