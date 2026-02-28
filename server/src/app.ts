import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';

import { corsConfig } from './config/cors';
import { apiRateLimiter } from './common/middleware/rateLimiter';
import { errorHandler } from './common/middleware/errorHandler';
import { notFound } from './common/middleware/notFound';
import { requestId } from './common/middleware/requestId';
import { requestLogger } from './common/middleware/requestLogger';
import { getSessionStore } from './config/session';
import healthModule from './modules/health';
import authModule from './modules/auth';
import usersModule from './modules/users';
import patientsModule from './modules/patients';
import referralsModule from './modules/referrals';
import { API_PREFIX } from './config/api';
import { initPassport } from './modules/auth/passport';

export const app = express();

// Hide Express fingerprint
app.disable('x-powered-by');

// --------------------
// Security middleware
// --------------------
app.use(helmet());
app.use(corsConfig);

// --------------------
// Session (cookie-based)
// MUST come before passport
// --------------------
app.use(async (req, res, next) => {
  const sessionStore = await getSessionStore();
  if (!sessionStore) {
    return next(new Error('Session store not initialized'));
  }

  session({
    name: 'sid',
    store: sessionStore,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true behind HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })(req, res, next);
});

// --------------------
// Passport
// --------------------
initPassport();
app.use(passport.initialize());
app.use(passport.session());

// --------------------
// Request-level middleware
// --------------------
app.use(apiRateLimiter);
app.use(requestId);
app.use(requestLogger);

// Body limits (prevent payload abuse)
app.use(express.json({ limit: '10kb' }));

// --------------------
// Routes
// --------------------
app.use(API_PREFIX, healthModule);
app.use(API_PREFIX + '/auth', authModule);
app.use(API_PREFIX + '/users', usersModule);
app.use(API_PREFIX + '/patients', patientsModule);
app.use(API_PREFIX + '/referrals', referralsModule);

// --------------------
// Error handling
// --------------------
app.use(notFound);
app.use(errorHandler);
