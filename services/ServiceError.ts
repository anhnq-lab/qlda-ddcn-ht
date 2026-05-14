/**
 * ServiceError — Unified error class for all service operations.
 * 
 * Provides structured error information for UI display and logging.
 * Wraps Supabase/API errors into a consistent format.
 * 
 * Usage:
 * ```ts
 * throw new ServiceError('Không thể tạo dự án', 'CREATE_FAILED', originalError);
 * ```
 */
export class ServiceError extends Error {
    /** Machine-readable error code */
    readonly code: string;
    /** HTTP status code (if from API) */
    readonly status?: number;
    /** Original error (for debugging) */
    readonly cause?: unknown;
    /** Additional context */
    readonly context?: Record<string, unknown>;

    constructor(
        message: string,
        code: string = 'UNKNOWN_ERROR',
        cause?: unknown,
        context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.cause = cause;
        this.context = context;

        // Extract status from Supabase/fetch errors
        if (cause && typeof cause === 'object') {
            const errObj = cause as Record<string, any>;
            this.status = errObj.status || errObj.statusCode;
        }
    }

    /** Check if this is a network/timeout error */
    get isNetworkError(): boolean {
        return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
    }

    /** Check if this is an auth error (401/403) */
    get isAuthError(): boolean {
        return this.status === 401 || this.status === 403;
    }

    /** Check if this is a not-found error (404) */
    get isNotFound(): boolean {
        return this.status === 404 || this.code === 'NOT_FOUND';
    }

    /** Check if this is a validation error (400/422) */
    get isValidationError(): boolean {
        return this.status === 400 || this.status === 422 || this.code === 'VALIDATION_ERROR';
    }

    /** User-friendly message for toast display */
    get userMessage(): string {
        if (this.isNetworkError) return 'Mất kết nối mạng. Vui lòng kiểm tra internet.';
        if (this.isAuthError) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        if (this.isNotFound) return 'Không tìm thấy dữ liệu yêu cầu.';
        return this.message;
    }
}

/**
 * Wrap any thrown error into a ServiceError.
 * Safe to use in catch blocks.
 */
export function toServiceError(error: unknown, defaultMessage?: string): ServiceError {
    if (error instanceof ServiceError) return error;

    if (error instanceof Error) {
        // Supabase PostgREST errors
        const pgError = error as any;
        if (pgError.code && pgError.details) {
            return new ServiceError(
                pgError.message || defaultMessage || 'Lỗi cơ sở dữ liệu',
                `PG_${pgError.code}`,
                error
            );
        }

        // Network errors
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            return new ServiceError(
                'Yêu cầu đã quá thời gian chờ',
                'TIMEOUT',
                error
            );
        }
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return new ServiceError(
                'Không thể kết nối đến máy chủ',
                'NETWORK_ERROR',
                error
            );
        }

        return new ServiceError(
            error.message || defaultMessage || 'Đã xảy ra lỗi',
            'UNKNOWN_ERROR',
            error
        );
    }

    if (error && typeof error === 'object') {
        const errObj = error as Record<string, any>;
        if (errObj.message) {
            return new ServiceError(
                errObj.message || defaultMessage || 'Đã xảy ra lỗi',
                errObj.code ? `PG_${errObj.code}` : 'UNKNOWN_ERROR',
                error
            );
        }
    }

    return new ServiceError(
        defaultMessage || 'Đã xảy ra lỗi không xác định',
        'UNKNOWN_ERROR',
        error
    );
}

/** Standard paginated response type */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/** Standard service query params */
export interface ServiceQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, unknown>;
}
