import { defineConfig } from 'vitest/config';

// Integration tests talk to a real PostgreSQL (docker compose locally, a service container in CI).
export default defineConfig({
  test: {
    include: ['test/**/*.int.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 15_000,
    env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
  },
});
