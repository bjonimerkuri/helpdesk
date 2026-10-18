import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/db';
import { app, bearer, createUser, login, resetDatabase } from './helpers';

let customerToken: string;
let otherCustomerToken: string;
let agentToken: string;
let agentId: number;

async function createTicket(token: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/tickets')
    .set(bearer(token))
    .send({ title: 'Printer is on fire', description: 'Smoke is coming out of the printer.', ...overrides });
  expect(res.status).toBe(201);
  return res.body as { id: number; status: string; allowedStatuses: string[] };
}

beforeEach(async () => {
  await resetDatabase();
  await createUser('customer@example.com', 'customer');
  await createUser('other@example.com', 'customer');
  agentId = await createUser('agent@example.com', 'agent');
  customerToken = await login('customer@example.com');
  otherCustomerToken = await login('other@example.com');
  agentToken = await login('agent@example.com');
});
afterAll(() => pool.end());

describe('visibility', () => {
  it('lets customers see only their own tickets in the list', async () => {
    await createTicket(customerToken, { title: 'Mine' });
    await createTicket(otherCustomerToken, { title: 'Theirs' });

    const mine = await request(app).get('/api/tickets').set(bearer(customerToken));
    expect(mine.body.items.map((t: { title: string }) => t.title)).toEqual(['Mine']);

    const staff = await request(app).get('/api/tickets').set(bearer(agentToken));
    expect(staff.body.total).toBe(2);
  });

  it("returns 404, not 403, for someone else's ticket so its existence is not leaked", async () => {
    const ticket = await createTicket(otherCustomerToken);
    const res = await request(app).get(`/api/tickets/${ticket.id}`).set(bearer(customerToken));
    expect(res.status).toBe(404);
    expect((await request(app).post(`/api/tickets/${ticket.id}/comments`).set(bearer(customerToken)).send({ body: 'hi' })).status).toBe(404);
  });

  it('only exposes allowed status transitions to staff', async () => {
    const ticket = await createTicket(customerToken);
    const asCustomer = await request(app).get(`/api/tickets/${ticket.id}`).set(bearer(customerToken));
    const asAgent = await request(app).get(`/api/tickets/${ticket.id}`).set(bearer(agentToken));
    expect(asCustomer.body.allowedStatuses).toEqual([]);
    expect(asAgent.body.allowedStatuses).toEqual(['in_progress', 'closed']);
  });
});

describe('staff actions', () => {
  it('forbids customers from changing a ticket', async () => {
    const ticket = await createTicket(customerToken);
    const res = await request(app).patch(`/api/tickets/${ticket.id}`).set(bearer(customerToken)).send({ status: 'closed' });
    expect(res.status).toBe(403);
  });

  it('enforces the status state machine', async () => {
    const ticket = await createTicket(customerToken);
    const skip = await request(app).patch(`/api/tickets/${ticket.id}`).set(bearer(agentToken)).send({ status: 'resolved' });
    expect(skip.status).toBe(422);

    const ok = await request(app).patch(`/api/tickets/${ticket.id}`).set(bearer(agentToken)).send({ status: 'in_progress' });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('in_progress');
    expect(ok.body.allowedStatuses).toEqual(['resolved', 'open']);
  });

  it('assigns only to staff', async () => {
    const ticket = await createTicket(customerToken);
    const toCustomer = await request(app).patch(`/api/tickets/${ticket.id}`).set(bearer(agentToken)).send({ assigneeId: 1 });
    expect(toCustomer.status).toBe(400);

    const toAgent = await request(app).patch(`/api/tickets/${ticket.id}`).set(bearer(agentToken)).send({ assigneeId: agentId });
    expect(toAgent.status).toBe(200);
    expect(toAgent.body.assigneeEmail).toBe('agent@example.com');
  });

  it('rejects an empty update', async () => {
    const ticket = await createTicket(customerToken);
    const res = await request(app).patch(`/api/tickets/${ticket.id}`).set(bearer(agentToken)).send({});
    expect(res.status).toBe(400);
  });
});

describe('comments', () => {
  it('lets the owner and staff converse on a ticket', async () => {
    const ticket = await createTicket(customerToken);
    await request(app).post(`/api/tickets/${ticket.id}/comments`).set(bearer(agentToken)).send({ body: 'On it.' }).expect(201);
    await request(app).post(`/api/tickets/${ticket.id}/comments`).set(bearer(customerToken)).send({ body: 'Thanks!' }).expect(201);

    const detail = await request(app).get(`/api/tickets/${ticket.id}`).set(bearer(customerToken));
    expect(detail.body.comments.map((c: { body: string }) => c.body)).toEqual(['On it.', 'Thanks!']);
  });
});

describe('listing', () => {
  it('filters by status and paginates', async () => {
    for (let i = 1; i <= 12; i++) await createTicket(customerToken, { title: `Ticket number ${i}` });
    const first = await request(app).get('/api/tickets?pageSize=5').set(bearer(agentToken));
    expect(first.body).toMatchObject({ total: 12, page: 1, pageSize: 5 });
    expect(first.body.items).toHaveLength(5);

    const last = await request(app).get('/api/tickets?pageSize=5&page=3').set(bearer(agentToken));
    expect(last.body.items).toHaveLength(2);

    const none = await request(app).get('/api/tickets?status=closed').set(bearer(agentToken));
    expect(none.body.total).toBe(0);
  });

  it('treats search wildcards literally', async () => {
    await createTicket(customerToken, { title: 'Discount 100% off', description: 'A ticket that mentions a percent sign.' });
    await createTicket(customerToken, { title: 'Something else', description: 'Nothing to see in this description.' });

    const literal = await request(app).get('/api/tickets').query({ q: '100%' }).set(bearer(agentToken));
    expect(literal.body.total).toBe(1);

    const wildcard = await request(app).get('/api/tickets').query({ q: '%' }).set(bearer(agentToken));
    expect(wildcard.body.total).toBe(1);
  });

  it('validates query parameters', async () => {
    const res = await request(app).get('/api/tickets?status=bogus').set(bearer(agentToken));
    expect(res.status).toBe(400);
  });
});
