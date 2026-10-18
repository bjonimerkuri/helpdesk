import { z } from 'zod';

const DEV_DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/helpdesk';
const DEV_JWT_SECRET = 'dev-only-secret-do-not-use-in-production-0000';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = schema.parse(env);
  const isProd = parsed.NODE_ENV === 'production';

  // Fail fast in production instead of silently falling back to a development default.
  if (isProd && !parsed.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
  if (isProd && !parsed.JWT_SECRET) throw new Error('JWT_SECRET is required in production');

  return {
    nodeEnv: parsed.NODE_ENV,
    isProd,
    port: parsed.PORT,
    logLevel: parsed.LOG_LEVEL,
    databaseUrl: parsed.DATABASE_URL ?? DEV_DATABASE_URL,
    jwtSecret: parsed.JWT_SECRET ?? DEV_JWT_SECRET,
  };
}

export type Config = ReturnType<typeof loadConfig>;
export const config = loadConfig();
