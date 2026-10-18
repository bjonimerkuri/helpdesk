import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { signToken } from '../auth';
import { pool } from '../db';
import { HttpError, wrap } from '../http';

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  // bcrypt only uses the first 72 bytes, so longer passwords add no security.
  password: z.string().min(8).max(72),
});

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export const authRoutes = Router();

authRoutes.post(
  '/register',
  wrap(async (req, res) => {
    const { email, password } = credentials.parse(req.body);
    const hash = await bcrypt.hash(password, 10);
    try {
      const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'customer') RETURNING id, email, role`,
        [email, hash],
      );
      res.status(201).json({ token: signToken(rows[0]), user: rows[0] });
    } catch (e) {
      if ((e as { code?: string }).code === '23505') throw new HttpError(409, 'Email already registered');
      throw e;
    }
  }),
);

authRoutes.post(
  '/login',
  wrap(async (req, res) => {
    const { email, password } = credentials.parse(req.body);
    const { rows } = await pool.query('SELECT id, email, role, password_hash FROM users WHERE email = $1', [email]);
    const row = rows[0];
    const valid = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
    if (!row || !valid) throw new HttpError(401, 'Invalid credentials');
    const user = { id: row.id, email: row.email, role: row.role };
    res.json({ token: signToken(user), user });
  }),
);
