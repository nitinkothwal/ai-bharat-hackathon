import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

type ValidationSchemas = {
  body?: ZodType<unknown>;
  params?: ZodType<unknown>;
  query?: ZodType<unknown>;
};

export const validate =
  (schemas: ValidationSchemas) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request['params'];
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request['query'];
      }

      next();
    } catch (error) {
      next(error);
    }
  };
