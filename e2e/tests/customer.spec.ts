import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createTicketAs, signIn, uniqueTitle } from './helpers';

test.describe('as a customer', () => {
  test('opens a ticket and replies on it', async ({ page }) => {
    const title = uniqueTitle('Checkout page freezes');
    await signIn(page, 'customer@example.com');

    await page.getByRole('link', { name: 'New ticket' }).click();
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('What is going wrong?').fill('Clicking pay does nothing after the spinner appears.');
    await page.getByLabel('Priority').selectOption('high');
    await page.getByRole('button', { name: 'Create ticket' }).click();

    await expect(page.getByRole('heading', { level: 1 })).toContainText(title);
    await expect(page.getByLabel('Ticket details')).toContainText('Open');

    await page.getByLabel('Add a reply').fill('It happens on Safari only.');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'It happens on Safari only.' })).toBeVisible();

    // Customers cannot triage their own tickets.
    await expect(page.getByLabel('Change status')).toHaveCount(0);

    await page.getByRole('link', { name: 'Back to tickets' }).click();
    await expect(page.getByRole('link', { name: title })).toBeVisible();
  });

  test('sees inline errors instead of submitting an invalid ticket', async ({ page }) => {
    await signIn(page, 'customer@example.com');
    await page.goto('/tickets/new');
    await page.getByRole('button', { name: 'Create ticket' }).click();
    await expect(page.getByText('Enter a title of at least 3 characters.')).toBeVisible();
    await expect(page.getByText('Describe the problem in at least 10 characters.')).toBeVisible();
    await expect(page).toHaveURL(/\/tickets\/new$/);
  });

  test("cannot open another user's ticket, and gets no hint that it exists", async ({ page, request }) => {
    const id = await createTicketAs(request, 'agent@example.com', uniqueTitle('Agent-only ticket'));
    await signIn(page, 'customer@example.com');
    await page.goto(`/tickets/${id}`);
    await expect(page.getByRole('alert')).toHaveText('Ticket not found');
  });

  test('the ticket list has no detectable accessibility violations', async ({ page }) => {
    await signIn(page, 'customer@example.com');
    await expect(page.getByRole('table')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
