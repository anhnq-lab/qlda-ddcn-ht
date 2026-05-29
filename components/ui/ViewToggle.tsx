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
    const activeClass = 'bg-bg-surface shadow-card text-primary-600 dark:text-primary-400';
    const inactiveClass = 'text-txt-muted hover:text-txt-secondary';

    return (
        <div className={`flex items-center bg-bg-muted rounded-xl p-1 ${className}`}>
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
