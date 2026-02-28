import passport from 'passport';

import { findUserById } from '../../users/user.repository';
import { User, PublicUser } from '../../users/user.types';

import { localStrategy } from './local.strategy';

export function initPassport(): void {
  passport.use(localStrategy);

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as PublicUser).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user: PublicUser | null = await findUserById(id);

      if (!user) {
        done(null, false);
        return;
      }

      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
