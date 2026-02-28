import { Request, Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError';

export function notFound(req: Request, res: Response, next: NextFunction) {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
}
