import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/db';
import { app, bearer, createUser, PASSWORD, resetDatabase } from './helpers';

beforeEach(resetDatabase);
afterAll(() => pool.end());

describe('auth', () => {
  it('registers a customer and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'New@Example.com', password: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'new@example.com', role: 'customer' });
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejects a duplicate email', async () => {
    await createUser('dup@example.com', 'customer');
    const res = await request(app).post('/api/auth/register').send({ email: 'dup@example.com', password: PASSWORD });
    expect(res.status).toBe(409);
  });

  it('rejects a weak password with a readable message', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@example.com', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/);
  });

  it('logs in with valid credentials and rejects wrong ones identically', async () => {
    await createUser('a@example.com', 'customer');
    const ok = await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: PASSWORD });
    expect(ok.status).toBe(200);

    const wrongPassword = await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'nope-nope' });
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: PASSWORD });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it('requires a valid bearer token on protected routes', async () => {
    expect((await request(app).get('/api/tickets')).status).toBe(401);
    expect((await request(app).get('/api/tickets').set(bearer('garbage'))).status).toBe(401);
  });

  it('answers the health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns JSON for unknown routes and malformed bodies', async () => {
    expect((await request(app).get('/api/nope')).status).toBe(404);
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{oops');
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe('Malformed JSON body');
  });
});
