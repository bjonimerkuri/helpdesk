import { APIRequestContext, expect, Page } from '@playwright/test';

export const PASSWORD = 'password123';

export async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/tickets/i);
}

/** Creates a ticket through the API (fast setup) and returns its id. */
export async function createTicketAs(request: APIRequestContext, email: string, title: string): Promise<number> {
  const login = await request.post('/api/auth/login', { data: { email, password: PASSWORD } });
  expect(login.ok()).toBeTruthy();
  const { token } = await login.json();
  const created = await request.post('/api/tickets', {
    headers: { Authorization: `Bearer ${token}` },
    data: { title, description: 'Created by the end-to-end test suite.', priority: 'medium' },
  });
  expect(created.status()).toBe(201);
  return (await created.json()).id;
}

export const uniqueTitle = (prefix: string) => `${prefix} ${Date.now().toString(36)}`;
