import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../errors/AppError';
import logger from '../../config/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Zod validation errors -> 400 Bad Request
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // Custom application errors -> use status code from error
  if (err instanceof AppError) {
    logger.warn({ err: err?.message, requestId: req.requestId }, err.message);

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && typeof err.errors === 'object' ? { errors: err.errors } : {}),
    });
  }

  logger.error({ err: err?.message, requestId: req.requestId }, 'Unhandled error');

  // Generic server error -> 500 Internal Server Error
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
