import { Request, Response, NextFunction } from 'express';

import { getHealthStatus } from './health.service';

export function healthCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const result = getHealthStatus();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
