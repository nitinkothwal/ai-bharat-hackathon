import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

import { sendError, sendSuccess } from '../../common/utils/api-response';

import { AuthResult } from './auth.types';

export function login(req: Request, res: Response<AuthResult>, next: NextFunction): void {
  passport.authenticate('local', (err: unknown, user: Express.User | false) => {
    if (err) return next(err);
    if (!user) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      sendSuccess(res, { user });
    });
  })(req, res, next);
}

export function logout(req: Request, res: Response): void {
  req.logout(() => {
    res.clearCookie('sid');
    sendSuccess(res, {}, 200, 'Logged out successfully');
  });
}

export function me(req: Request, res: Response): void {
  sendSuccess(res, { user: req.user });
}
