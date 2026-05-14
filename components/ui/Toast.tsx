
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    addToast: (options: { title?: string; message: string; type?: ToastType }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3s
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, []);

    const addToast = useCallback((options: { title?: string; message: string; type?: ToastType }) => {
        showToast(options.message, options.type || 'info');
    }, [showToast]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`
                            pointer-events-auto relative overflow-hidden flex flex-col px-4 py-3 rounded-xl shadow-xl border
                            ${toast.type === 'success' ? 'bg-white dark:bg-slate-800 border-emerald-200/50 text-emerald-800' : ''}
                            ${toast.type === 'error' ? 'bg-white dark:bg-slate-800 border-red-200/50 text-red-800' : ''}
                            ${toast.type === 'info' ? 'bg-white dark:bg-slate-800 border-blue-200/50 text-blue-800' : ''}
                            ${toast.type === 'warning' ? 'bg-white dark:bg-slate-800 border-warning-200/50 text-warning-800' : ''}
                        `}
                    >
                        <div className="flex items-center gap-3 w-full">
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-warning-500" />}

                            <p className="text-sm font-medium flex-1">{toast.message}</p>

                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors ml-2 shrink-0"
                            >
                                <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                            </button>
                        </div>
                        
                        {/* Progress bar countdown */}
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 3, ease: 'linear' }}
                            style={{ originX: 0 }}
                            className={`absolute bottom-0 left-0 right-0 h-1
                                ${toast.type === 'success' ? 'bg-emerald-500/30' : ''}
                                ${toast.type === 'error' ? 'bg-red-500/30' : ''}
                                ${toast.type === 'info' ? 'bg-blue-500/30' : ''}
                                ${toast.type === 'warning' ? 'bg-warning-500/30' : ''}
                            `}
                        />
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
