import bcrypt from 'bcryptjs';
import { pool } from './db';

const PASSWORD = 'password123';

async function upsertUser(email: string, role: string) {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
     RETURNING id`,
    [email, hash, role],
  );
  return rows[0].id as number;
}

async function main() {
  await upsertUser('admin@example.com', 'admin');
  const agent = await upsertUser('agent@example.com', 'agent');
  const customer = await upsertUser('customer@example.com', 'customer');

  const { rows } = await pool.query('SELECT COUNT(*) FROM tickets');
  if (Number(rows[0].count) === 0) {
    const samples = [
      ['Cannot reset my password', 'The reset email never arrives, even after several attempts.', 'high', 'open'],
      ['Invoice shows the wrong amount', 'My March invoice is higher than the agreed plan price.', 'medium', 'in_progress'],
      ['Feature request: dark mode', 'It would be great to have a dark theme in the dashboard.', 'low', 'open'],
    ];
    for (const [title, description, priority, status] of samples) {
      await pool.query(
        `INSERT INTO tickets (title, description, priority, status, created_by, assignee_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [title, description, priority, status, customer, status === 'in_progress' ? agent : null],
      );
    }
  }

  console.log(`Seeded. Log in with admin@example.com, agent@example.com or customer@example.com / ${PASSWORD}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
