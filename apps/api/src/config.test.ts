import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('falls back to development defaults outside production', () => {
    const cfg = loadConfig({ NODE_ENV: 'development' });
    expect(cfg.databaseUrl).toContain('localhost');
    expect(cfg.port).toBe(3001);
  });

  it('refuses to start in production without a database or secret', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgres://u:p@h/db' })).toThrow(/JWT_SECRET/);
  });

  it('rejects a short JWT secret', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgres://u:p@h/db', JWT_SECRET: 'short' })).toThrow();
  });

  it('accepts a complete production configuration', () => {
    const cfg = loadConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://u:p@h/db',
      JWT_SECRET: 'x'.repeat(40),
    });
    expect(cfg.isProd).toBe(true);
  });
});
