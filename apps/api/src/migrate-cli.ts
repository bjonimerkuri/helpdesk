import { pool } from './db';
import { runMigrations } from './migrate';

runMigrations(pool)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
