import bcrypt from 'bcryptjs';
import type { Pool } from 'pg';
import { pool } from './db';

export const DEMO_PASSWORD = 'password123';

async function upsertUser(db: Pool, email: string, role: string, hash: string) {
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
     RETURNING id`,
    [email, hash, role],
  );
  return rows[0].id as number;
}

/** Idempotent: safe to run on every deploy. */
export async function seed(db: Pool) {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await upsertUser(db, 'admin@example.com', 'admin', hash);
  const agent = await upsertUser(db, 'agent@example.com', 'agent', hash);
  const customer = await upsertUser(db, 'customer@example.com', 'customer', hash);

  const { rows } = await db.query('SELECT COUNT(*) FROM tickets');
  if (Number(rows[0].count) > 0) return;

  const samples = [
    ['Cannot reset my password', 'The reset email never arrives, even after several attempts.', 'high', 'open'],
    ['Invoice shows the wrong amount', 'My March invoice is higher than the agreed plan price.', 'medium', 'in_progress'],
    ['Feature request: dark mode', 'It would be great to have a dark theme in the dashboard.', 'low', 'open'],
    ['Export to CSV times out', 'Exporting more than 5,000 rows fails with a gateway error.', 'high', 'resolved'],
  ];
  for (const [title, description, priority, status] of samples) {
    const assigned = status === 'in_progress' || status === 'resolved' ? agent : null;
    const { rows: created } = await db.query(
      `INSERT INTO tickets (title, description, priority, status, created_by, assignee_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [title, description, priority, status, customer, assigned],
    );
    if (assigned) {
      await db.query('INSERT INTO comments (ticket_id, author_id, body) VALUES ($1, $2, $3)', [
        created[0].id,
        agent,
        'Thanks for the report. I am looking into this now.',
      ]);
    }
  }
}

if (require.main === module) {
  seed(pool)
    .then(() => console.log(`Seeded. Log in with admin@, agent@ or customer@example.com / ${DEMO_PASSWORD}`))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
