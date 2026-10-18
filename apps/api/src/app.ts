import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import { requireAuth, requireStaff } from './auth';
import { config } from './config';
import { pool } from './db';
import { errorHandler, notFound, wrap } from './http';
import { logger } from './logger';
import { authRoutes } from './routes/auth';
import { tickets } from './routes/tickets';

export function createApp() {
  const app = express();
  // Vercel (and most hosts) terminate TLS in front of the app; trust one proxy hop for client IPs.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = (req.headers['x-request-id'] as string) ?? randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  const api = express.Router();

  // Credential endpoints get a stricter limit. The in-memory store is per instance, which is a
  // known limitation on serverless; see docs/adr/0004-jwt-bearer-auth.md.
  api.use(
    '/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: config.nodeEnv === 'test' ? 10_000 : 30,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Too many attempts. Try again in a few minutes.' },
    }),
    authRoutes,
  );

  api.get(
    '/health',
    wrap(async (_req, res) => {
      try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok' });
      } catch {
        res.status(503).json({ status: 'unavailable' });
      }
    }),
  );

  api.use('/tickets', tickets);
  api.get(
    '/agents',
    requireAuth,
    requireStaff,
    wrap(async (_req, res) => {
      const { rows } = await pool.query(`SELECT id, email FROM users WHERE role <> 'customer' ORDER BY email`);
      res.json(rows);
    }),
  );

  app.use('/api', api);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
