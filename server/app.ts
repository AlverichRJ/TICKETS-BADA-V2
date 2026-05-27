import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { env } from './config.js';
import { passport } from './auth/google.js';
import { setSessionCookie } from './auth/session.js';
import { createContext } from './_core/trpc.js';
import { appRouter } from './routers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(rateLimit({ windowMs: 60_000, limit: 240 }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(passport.initialize());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'tickets-bada', stack: 'express-trpc-drizzle-mysql' });
  });

  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
  app.get('/api/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }), (req, res) => {
    const user = req.user as { id: string; email: string; role: 'admin' | 'user' };
    setSessionCookie(res, { sub: user.id, email: user.email, role: user.role });
    res.redirect('/');
  });

  app.use('/api/trpc', createExpressMiddleware({ router: appRouter, createContext }));

  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return app;
}
