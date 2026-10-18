import { config } from './config';
import { pool } from './db';
import { runMigrations } from './migrate';
import { seed } from './seed';

// Wipes every table and re-seeds the demo data. Used by the e2e suite. Never runs in production.
async function main() {
  if (config.isProd) throw new Error('db:reset is disabled in production');
  await runMigrations(pool, () => undefined);
  await pool.query('TRUNCATE comments, tickets, users RESTART IDENTITY CASCADE');
  await seed(pool);
  console.log('Database reset and seeded');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
