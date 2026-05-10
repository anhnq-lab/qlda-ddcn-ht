import React from 'react';
import {
    STATUS_CONFIG,
    CLASSIFICATION_CONFIG,
    getClassification,
    calcSelfTotal,
    calcManagerTotal,
    type EvaluationStatus,
    type EvaluationForm,
} from '../types/evaluation.types';

// ── Status Badge ──────────────────────────────────────────────────
interface StatusBadgeProps {
    status: EvaluationStatus;
    size?: 'sm' | 'md';
}

export const EvaluationStatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
    const cfg = STATUS_CONFIG[status];
    const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

    const dotColor: Record<EvaluationStatus, string> = {
        draft: 'bg-slate-400',
        submitted: 'bg-amber-500',
        approved: 'bg-emerald-500',
        rejected: 'bg-red-500',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${sizeClass} ${cfg.bg} ${cfg.darkBg} ${cfg.color} ${cfg.darkColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor[status]}`} />
            {cfg.label}
        </span>
    );
};

// ── Classification Badge ──────────────────────────────────────────
interface ClassificationBadgeProps {
    score: number;
    size?: 'sm' | 'md';
}

export const ClassificationBadge: React.FC<ClassificationBadgeProps> = ({ score, size = 'md' }) => {
    const cls = getClassification(score);
    const cfg = CLASSIFICATION_CONFIG[cls];
    const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
    return (
        <span className={`inline-flex items-center font-bold rounded-full border ${sizeClass} ${cfg.bg} ${cfg.darkBg} ${cfg.color} ${cfg.darkColor} ${cfg.border}`}>
            {cls}
        </span>
    );
};

// ── Score Summary Card ────────────────────────────────────────────
interface ScoreSummaryProps {
    form: EvaluationForm;
    showManager?: boolean;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({ form, showManager = false }) => {
    const selfTotal = calcSelfTotal(form);
    const managerTotal = form.manager_score_1 !== null ? calcManagerTotal(form) : null;
    const displayTotal = showManager && managerTotal !== null ? managerTotal : selfTotal;
    const classification = getClassification(displayTotal);
    const cfg = CLASSIFICATION_CONFIG[classification];

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.border} ${cfg.bg} ${cfg.darkBg}`}>
            <div className="text-center">
                <div className={`text-2xl font-black ${cfg.color} ${cfg.darkColor}`}>
                    {displayTotal.toFixed(1)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">/ 100</div>
            </div>
            <div>
                <div className={`text-sm font-bold ${cfg.color} ${cfg.darkColor}`}>{classification}</div>
                <div className="text-[11px] text-slate-400">
                    {showManager && managerTotal !== null ? 'Điểm trưởng phòng' : 'Điểm tự đánh giá'}
                </div>
            </div>
        </div>
    );
};
