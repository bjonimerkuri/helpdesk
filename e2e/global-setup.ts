import { spawnSync } from 'node:child_process';

// Start every run from the same known data: migrated schema, demo users, sample tickets.
export default function globalSetup() {
  const result = spawnSync('npm', ['run', 'db:reset', '-w', '@helpdesk/api'], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) throw new Error('db:reset failed. Is PostgreSQL running (docker compose up -d)?');
}
