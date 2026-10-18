import { expect, test } from '@playwright/test';
import { createTicketAs, signIn, uniqueTitle } from './helpers';

test.describe('as an agent', () => {
  test('moves a ticket through the allowed statuses only', async ({ page, request }) => {
    const title = uniqueTitle('Cannot export report');
    const id = await createTicketAs(request, 'customer@example.com', title);

    await signIn(page, 'agent@example.com');
    await page.goto(`/tickets/${id}`);

    const status = page.getByLabel('Change status');
    // From "open" an agent can start work or close, but cannot jump to "resolved".
    await expect(status.locator('option')).toHaveText(['Open', 'In progress', 'Closed']);

    await status.selectOption('in_progress');
    await expect(page.locator('.aside .badge', { hasText: 'In progress' }).first()).toBeVisible();
    await expect(status.locator('option')).toHaveText(['In progress', 'Resolved', 'Open']);
  });

  test('assigns a ticket and keeps the assignment after a reload', async ({ page, request }) => {
    const id = await createTicketAs(request, 'customer@example.com', uniqueTitle('Wrong invoice total'));

    await signIn(page, 'agent@example.com');
    await page.goto(`/tickets/${id}`);
    await page.getByLabel('Assignee').selectOption({ label: 'agent@example.com' });
    await expect(page.getByLabel('Assignee').locator('option:checked')).toHaveText('agent@example.com');

    await page.reload();
    await expect(page.getByLabel('Assignee').locator('option:checked')).toHaveText('agent@example.com');
  });

  test('searches the whole queue', async ({ page, request }) => {
    const title = uniqueTitle('Zebra-striped dashboard glitch');
    await createTicketAs(request, 'customer@example.com', title);

    await signIn(page, 'agent@example.com');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('All tickets');
    await page.getByLabel('Search').fill(title);
    await expect(page.getByRole('row')).toHaveCount(2); // header + the one match
    await expect(page.getByRole('link', { name: title })).toBeVisible();

    await page.getByLabel('Search').fill('no-ticket-will-ever-match-this');
    await expect(page.getByRole('heading', { name: 'No tickets match these filters' })).toBeVisible();
  });
});
