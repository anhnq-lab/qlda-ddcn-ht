import React from 'react';
import { getDesignState } from '../constants/designWorkflowStates';

interface DesignWorkflowStatusBadgeProps {
    stateCode: string;
    size?: 'sm' | 'md';
}

const DesignWorkflowStatusBadge: React.FC<DesignWorkflowStatusBadgeProps> = ({ stateCode, size = 'md' }) => {
    const state = getDesignState(stateCode);
    const sizeClass = size === 'sm'
        ? 'text-[10px] px-1.5 py-0.5'
        : 'text-xs px-2.5 py-1';

    return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${sizeClass} ${state.bgClass} ${state.textClass} ${state.borderClass}`}>
            <span className="font-mono opacity-70">{stateCode}</span>
            {state.label}
        </span>
    );
};

export default DesignWorkflowStatusBadge;
