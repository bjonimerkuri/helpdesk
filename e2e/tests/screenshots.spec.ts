import { test } from '@playwright/test';
import { signIn } from './helpers';

// Regenerates the README images: npm run screenshots
test.use({ viewport: { width: 1280, height: 800 } });

test('@screenshots sign-in', async ({ page }) => {
  await page.goto('/login');
  await page.screenshot({ path: 'docs/screenshots/sign-in.png' });
});

test('@screenshots agent queue', async ({ page }) => {
  await signIn(page, 'agent@example.com');
  await page.getByRole('table').waitFor();
  await page.screenshot({ path: 'docs/screenshots/queue.png' });
});

test('@screenshots ticket detail', async ({ page }) => {
  await signIn(page, 'agent@example.com');
  await page.getByRole('link', { name: 'Invoice shows the wrong amount' }).click();
  await page.getByRole('heading', { name: 'Conversation' }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/ticket.png' });
});
