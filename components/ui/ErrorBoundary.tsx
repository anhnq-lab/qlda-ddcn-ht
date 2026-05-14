// @ts-nocheck
import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component for catching React errors
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // Report to centralized service
        import('../../lib/errorReporting').then(({ reportError }) => {
            reportError(error, {
                componentStack: errorInfo.componentStack
            });
        });

        this.props.onError?.(error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
        window.location.reload(); // Hard reload to clear dirty state
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl w-full">
                    <div className="text-center max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm mx-auto">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                            Đã xảy ra lỗi hệ thống
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">
                            {this.state.error?.message || 'Có lỗi không mong muốn xảy ra. Vui lòng thử lại hoặc liên hệ quản trị viên.'}
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 dark:bg-primary-500 text-white rounded-xl hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors font-medium"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Tải lại trang
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
