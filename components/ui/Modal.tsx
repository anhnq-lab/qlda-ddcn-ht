import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

// ========================================
// MODAL COMPONENT - Design System v2 (Radix UI Powered)
// ========================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    description?: string;
    size?: ModalSize;
    showCloseButton?: boolean;
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

const sizeStyles: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    showCloseButton = true,
    closeOnOverlay = true,
    closeOnEscape = true,
    children,
    footer,
    className = '',
}) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => {
            // Only fire onClose if going from open -> closed
            // and we didn't block it (Radix handles ESC/Overlay internally)
            if (!open) onClose();
        }}>
            <Dialog.Portal>
                <Dialog.Overlay 
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in data-[state=closed]:animate-fade-out" 
                    onClick={(e) => {
                        // Prevent overlay close if disabled
                        if (!closeOnOverlay) {
                            e.preventDefault();
                        }
                    }}
                />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                    <Dialog.Content
                        onPointerDownOutside={(e) => {
                            if (!closeOnOverlay) e.preventDefault();
                        }}
                        onEscapeKeyDown={(e) => {
                            if (!closeOnEscape) e.preventDefault();
                        }}
                        className={cn(
                            "pointer-events-auto relative w-full bg-bg-surface rounded-2xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden",
                            "animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 duration-200",
                            sizeStyles[size],
                            className
                        )}
                        aria-describedby={description ? 'modal-description' : undefined}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-start justify-between p-6 pb-0">
                                <div>
                                    {title && (
                                        <Dialog.Title id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                                            {title}
                                        </Dialog.Title>
                                    )}
                                    {description && (
                                        <Dialog.Description id="modal-description" className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            {description}
                                        </Dialog.Description>
                                    )}
                                </div>
                                {showCloseButton && (
                                    <Dialog.Close asChild>
                                        <button
                                            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                            aria-label="Đóng"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </Dialog.Close>
                                )}
                            </div>
                        )}

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="p-6 pt-0 border-t border-slate-200 dark:border-slate-800 mt-4">
                                <div className="flex items-center justify-end gap-3 pt-4">
                                    {footer}
                                </div>
                            </div>
                        )}
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

// ========================================
// CONFIRM DIALOG
// ========================================

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Xác nhận',
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    variant = 'danger',
    loading = false,
}) => {
    const variantStyles = {
        danger: 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-500',
        warning: 'bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-500',
        info: 'bg-primary-500 hover:bg-primary-600 focus-visible:ring-primary-500',
    };

    const iconStyles = {
        danger: 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400',
        warning: 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400',
        info: 'bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400',
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            showCloseButton={false}
        >
            <div className="text-center">
                <div className={cn("w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center", iconStyles[variant])}>
                    {variant === 'danger' && (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    {variant === 'warning' && (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {variant === 'info' && (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
            </div>

            <div className="flex gap-3 mt-6">
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-bg-surface border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-bg-subtle dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className={cn("flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-colors disabled:opacity-50", variantStyles[variant])}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Đang xử lý...
                        </span>
                    ) : confirmText}
                </button>
            </div>
        </Modal>
    );
};

export default Modal;
