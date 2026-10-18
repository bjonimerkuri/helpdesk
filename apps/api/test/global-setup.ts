import { Pool } from 'pg';
import { runMigrations } from '../src/migrate';

// Runs once before the integration suite: bring the schema up to date on the test database.
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/helpdesk_test';
  process.env.DATABASE_URL = url;
  const pool = new Pool({ connectionString: url });
  try {
    await runMigrations(pool, () => undefined);
  } finally {
    await pool.end();
  }
}
