import React from 'react';

interface EmptyStateProps {
    icon: React.ElementType;
    text: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, text }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-12 text-center">
        <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
        <p className="text-sm font-bold text-gray-400 dark:text-slate-400">{text}</p>
    </div>
);

export default EmptyState;
