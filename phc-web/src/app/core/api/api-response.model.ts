export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    meta?: Record<string, unknown>;
    errors?: Record<string, unknown>;
}
