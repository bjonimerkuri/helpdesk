import cors from 'cors';
import express from 'express';
import { pool } from './db';
import { requireAuth, requireStaff } from './auth';
import { errorHandler, wrap } from './http';
import { authRoutes } from './routes/auth';
import { tickets } from './routes/tickets';

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:4200' }));
  app.use(express.json());

  app.use('/auth', authRoutes);
  app.use('/tickets', tickets);
  app.get(
    '/agents',
    requireAuth,
    requireStaff,
    wrap(async (_req, res) => {
      const { rows } = await pool.query(
        `SELECT id, email FROM users WHERE role <> 'customer' ORDER BY email`,
      );
      res.json(rows);
    }),
  );

  app.use(errorHandler);
  return app;
}
