import React from 'react';

interface EmptyStateProps {
    icon: React.ElementType;
    text: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, text }) => (
    <div className="bg-bg-surface rounded-2xl border border-border p-12 text-center">
        <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
        <p className="text-sm font-bold text-txt-placeholder">{text}</p>
    </div>
);

export default EmptyState;
