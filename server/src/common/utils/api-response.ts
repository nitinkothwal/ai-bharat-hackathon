import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
  errors?: Record<string, unknown>;
}

/**
 * Send success response (200 by default)
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  statusCode = 200,
  message?: string,
  meta?: Record<string, unknown>,
) => {
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send created (201) response
 */
export const sendCreated = <T>(res: Response, data?: T, message?: string) =>
  sendSuccess(res, data, 201, message);

/**
 * Send no content (204) response
 */
export const sendNoContent = (res: Response) => res.status(204).send();

/**
 * Send error response directly
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Record<string, unknown>,
) => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errors && { errors }),
  };

  return res.status(statusCode).json(response);
};
