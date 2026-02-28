export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
  meta?: Record<string, T>;
}
