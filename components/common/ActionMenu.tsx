// Reusable Action Dropdown Menu — 3-dot dropdown for document/entity actions
import React from 'react';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Eye, Download, History, Trash2, Edit2, Copy } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ActionMenuItem {
    label: string;
    icon?: React.ElementType; // Allow undefined icon
    onClick: () => void;
    variant?: 'default' | 'danger';
    dividerBefore?: boolean;
}

interface ActionMenuProps {
    items: ActionMenuItem[];
    className?: string;
    trigger?: React.ReactNode;
}

/**
 * Reusable 3-dot action menu dropdown.
 * Used in document lists, task lists, contract lists, etc.
 * Powered by Radix UI DropdownMenu.
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({ items, className = '', trigger }) => {
    return (
        <Dropdown.Root>
            <Dropdown.Trigger asChild>
                {trigger || (
                    <button
                        className={cn(
                            "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                            className
                        )}
                        aria-label="More options"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                )}
            </Dropdown.Trigger>
            <Dropdown.Portal>
                <Dropdown.Content
                    sideOffset={5}
                    align="end"
                    className={cn(
                        "z-[60] min-w-[12rem] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1",
                        "animate-in data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 duration-200"
                    )}
                >
                    {items.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {item.dividerBefore && (
                                <Dropdown.Separator className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                            )}
                            <Dropdown.Item
                                onClick={item.onClick}
                                className={cn(
                                    "relative flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors",
                                    item.variant === 'danger'
                                        ? "text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50"
                                        : "text-slate-700 dark:text-slate-300 focus:bg-slate-50 dark:focus:bg-slate-700"
                                )}
                            >
                                {item.icon && <item.icon className="w-4 h-4" />}
                                <span className="flex-1 font-medium">{item.label}</span>
                            </Dropdown.Item>
                        </React.Fragment>
                    ))}
                </Dropdown.Content>
            </Dropdown.Portal>
        </Dropdown.Root>
    );
};

// Convenience — pre-built document action menu
interface DocActionMenuProps {
    onView: () => void;
    onDownload: () => void;
    onHistory: () => void;
}

export const DocActionMenu: React.FC<DocActionMenuProps> = ({ onView, onDownload, onHistory }) => (
    <ActionMenu items={[
        { label: 'Xem tài liệu', icon: Eye, onClick: onView },
        { label: 'Tải xuống', icon: Download, onClick: onDownload },
        { label: 'Lịch sử phiên bản', icon: History, onClick: onHistory, dividerBefore: true },
    ]} />
);

export { Eye, Download, History, Trash2, Edit2, Copy };
