// Vercel build: migrate the database, optionally seed demo data, then build the Angular app.
// Preview deployments get their own database branch from the Neon integration, so migrating on
// every build is safe. Migrations are idempotent and guarded by an advisory lock.
import { execSync } from 'node:child_process';

const run = (cmd) => {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
};

if (process.env.DATABASE_URL) {
  run('npm run db:migrate');
  if (process.env.SEED_DEMO_DATA === 'true') run('npm run db:seed');
} else {
  console.warn('DATABASE_URL is not set: skipping migrations. The API will not work until it is configured.');
}

run('npm run build');
