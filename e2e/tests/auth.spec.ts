import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('authentication', () => {
  test('sends signed-out visitors to the sign-in page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('shows a clear error for a wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('customer@example.com');
    await page.getByLabel('Password').fill('definitely-wrong');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('signs in with a demo account and signs out again', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Customer' }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your tickets');

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your tickets'); // session survives a reload

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('the sign-in page has no detectable accessibility violations', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
