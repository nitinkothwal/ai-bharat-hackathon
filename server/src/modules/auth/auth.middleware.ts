import { Request, Response, NextFunction } from 'express';

import { sendError } from '../../common/utils/api-response';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    sendError(res, 'Unauthorized', 401);
    return;
  }
  next();
}
