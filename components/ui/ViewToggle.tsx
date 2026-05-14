import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

// ========================================
// VIEW TOGGLE — Design System v2
// Grid/List view switcher
// ========================================

export type ViewMode = 'grid' | 'list';

export interface ViewToggleProps {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
    className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
    value,
    onChange,
    className = '',
}) => {
    const activeClass = 'bg-white dark:bg-slate-800 dark:bg-slate-600 shadow-lg text-primary-600 dark:text-primary-400';
    const inactiveClass = 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300';

    return (
        <div className={`flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1 ${className}`}>
            <button
                type="button"
                onClick={() => onChange('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${value === 'list' ? activeClass : inactiveClass}`}
                aria-label="Hiển thị dạng danh sách"
            >
                <List className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => onChange('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${value === 'grid' ? activeClass : inactiveClass}`}
                aria-label="Hiển thị dạng lưới"
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
        </div>
    );
};

export default ViewToggle;
