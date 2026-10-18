import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/db';

export const app = createApp();
export const PASSWORD = 'password123';

export async function resetDatabase() {
  await pool.query('TRUNCATE comments, tickets, users RESTART IDENTITY CASCADE');
}

export async function createUser(email: string, role: 'customer' | 'agent' | 'admin') {
  const hash = await bcrypt.hash(PASSWORD, 4); // low cost: tests only
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
    [email, hash, role],
  );
  return rows[0].id as number;
}

export async function login(email: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status}`);
  return res.body.token;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
