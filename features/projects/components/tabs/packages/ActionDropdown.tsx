import React from 'react';
import { MoreVertical, Eye, Edit, ExternalLink, Copy, Trash2 } from 'lucide-react';
import { BiddingPackage } from '../../../../../types';
import { getMSCPackageLink } from '../../../../../utils/mscCompliance';

export interface ActionDropdownProps {
    pkg: BiddingPackage;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onView: (pkg: BiddingPackage) => void;
    onEdit: (pkg: BiddingPackage) => void;
    onDelete: (pkg: BiddingPackage) => void;
    onCopyTBMT: (code: string) => void;
}

/**
 * Row-level action menu cho từng gói thầu.
 * Đóng lại khi click ra ngoài.
 */
export const ActionDropdown: React.FC<ActionDropdownProps> = ({
    pkg, isOpen, onToggle, onClose, onView, onEdit, onDelete, onCopyTBMT
}) => {
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={e => { e.stopPropagation(); onToggle(); }}
                className="p-1.5 hover:bg-bg-muted rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
            >
                <MoreVertical size={14} />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-bg-surface rounded-lg shadow-sm border border-border z-30 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button onClick={() => onView(pkg)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-txt-secondary hover:bg-bg-hover-row">
                        <Eye className="w-4 h-4" /> Xem chi tiết
                    </button>
                    <button onClick={() => onEdit(pkg)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-txt-secondary hover:bg-bg-hover-row">
                        <Edit className="w-4 h-4" /> Chỉnh sửa
                    </button>
                    {pkg.NotificationCode && (
                        <>
                            <hr className="my-1 border-border" />
                            <a href={getMSCPackageLink(pkg.NotificationCode)} target="_blank" rel="noopener noreferrer"
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700">
                                <ExternalLink className="w-4 h-4" /> Xem trên MSC
                            </a>
                            <button onClick={() => onCopyTBMT(pkg.NotificationCode!)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-txt-secondary hover:bg-bg-hover-row">
                                <Copy className="w-4 h-4" /> Sao chép link TBMT
                            </button>
                        </>
                    )}
                    <hr className="my-1 border-border" />
                    <button onClick={() => onDelete(pkg)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4" /> Xóa
                    </button>
                </div>
            )}
        </div>
    );
};
