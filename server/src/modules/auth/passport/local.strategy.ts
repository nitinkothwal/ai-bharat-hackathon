import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';

import { findUserByEmail } from '../../users/user.repository';
import { User } from '../../users/user.types';

export const localStrategy = new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    session: true,
  },
  async (email: string, password: string, done: (error: unknown, user?: User | false) => void) => {
    try {
      const user = await findUserByEmail(email);
      if (!user) return done(null, false);

      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false);

      return done(null, user);
    } catch (err) {
      done(err);
    }
  },
);
