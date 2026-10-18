import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/helpdesk';

export default defineConfig({
  testDir: './e2e/tests',
  globalSetup: './e2e/global-setup.ts',
  grepInvert: /@screenshots/,
  // The suite shares one database, so run serially.
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  forbidOnly: isCI,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev -w @helpdesk/api',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !isCI,
      env: { DATABASE_URL, LOG_LEVEL: 'warn' },
      timeout: 60_000,
    },
    {
      command: 'npm run start -w @helpdesk/web',
      url: 'http://localhost:4200',
      reuseExistingServer: !isCI,
      timeout: 180_000,
    },
  ],
});
