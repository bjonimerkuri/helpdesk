import { Pool } from 'pg';
import { config } from './config';

// Serverless functions can fan out into many instances, so keep each instance's pool small.
// On Vercel, use the pooled (pgbouncer) connection string from Neon.
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: process.env.VERCEL ? 3 : 10,
  idleTimeoutMillis: 10_000,
});
