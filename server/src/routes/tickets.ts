import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AuthUser, requireAuth, requireStaff } from '../auth';
import { pool } from '../db';
import { HttpError, wrap } from '../http';
import {
  allowedTransitions,
  canTransition,
  canViewTicket,
  isStaff,
  PRIORITIES,
  STATUSES,
} from '../ticket.rules';

const TICKET_SELECT = `
  SELECT t.id, t.title, t.description, t.status, t.priority,
         t.created_by AS "createdBy", c.email AS "creatorEmail",
         t.assignee_id AS "assigneeId", a.email AS "assigneeEmail",
         t.created_at AS "createdAt"
  FROM tickets t
  JOIN users c ON c.id = t.created_by
  LEFT JOIN users a ON a.id = t.assignee_id`;

const COMMENTS_SQL = `
  SELECT c.id, c.body, u.email AS "authorEmail", c.created_at AS "createdAt"
  FROM comments c
  JOIN users u ON u.id = c.author_id
  WHERE c.ticket_id = $1
  ORDER BY c.created_at`;

const listQuery = z.object({
  status: z.enum(STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  priority: z.enum(PRIORITIES).default('medium'),
});

const updateSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    assigneeId: z.number().int().positive().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

const commentSchema = z.object({ body: z.string().trim().min(1).max(2000) });

const idParam = (req: Request) => z.coerce.number().int().positive().parse(req.params.id);

async function fetchDetail(id: number, user: AuthUser) {
  const { rows } = await pool.query(`${TICKET_SELECT} WHERE t.id = $1`, [id]);
  const ticket = rows[0];
  if (!ticket || !canViewTicket(user, ticket)) throw new HttpError(404, 'Ticket not found');
  const comments = (await pool.query(COMMENTS_SQL, [id])).rows;
  return {
    ...ticket,
    comments,
    allowedStatuses: isStaff(user.role) ? allowedTransitions(ticket.status) : [],
  };
}

export const tickets = Router();
tickets.use(requireAuth);

tickets.get(
  '/',
  wrap(async (req, res) => {
    const user = req.user!;
    const { status, q, page, pageSize } = listQuery.parse(req.query);
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (!isStaff(user.role)) {
      params.push(user.id);
      conditions.push(`t.created_by = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const count = await pool.query(`SELECT COUNT(*) FROM tickets t ${where}`, params);
    params.push(pageSize, (page - 1) * pageSize);
    const { rows } = await pool.query(
      `${TICKET_SELECT} ${where} ORDER BY t.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    res.json({ items: rows, total: Number(count.rows[0].count), page, pageSize });
  }),
);

tickets.post(
  '/',
  wrap(async (req, res) => {
    const user = req.user!;
    const { title, description, priority } = createSchema.parse(req.body);
    const { rows } = await pool.query(
      'INSERT INTO tickets (title, description, priority, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
      [title, description, priority, user.id],
    );
    res.status(201).json(await fetchDetail(rows[0].id, user));
  }),
);

tickets.get(
  '/:id',
  wrap(async (req, res) => {
    res.json(await fetchDetail(idParam(req), req.user!));
  }),
);

tickets.patch(
  '/:id',
  requireStaff,
  wrap(async (req, res) => {
    const user = req.user!;
    const id = idParam(req);
    const changes = updateSchema.parse(req.body);
    const current = await fetchDetail(id, user);

    if (changes.status !== undefined && !canTransition(current.status, changes.status)) {
      throw new HttpError(422, `Cannot move a ticket from ${current.status} to ${changes.status}`);
    }
    if (changes.assigneeId) {
      const found = await pool.query(`SELECT 1 FROM users WHERE id = $1 AND role <> 'customer'`, [
        changes.assigneeId,
      ]);
      if (!found.rowCount) throw new HttpError(400, 'Assignee must be an agent or admin');
    }

    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [];
    const add = (column: string, value: unknown) => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };
    if (changes.status !== undefined) add('status', changes.status);
    if (changes.priority !== undefined) add('priority', changes.priority);
    if (changes.assigneeId !== undefined) add('assignee_id', changes.assigneeId);
    params.push(id);

    await pool.query(`UPDATE tickets SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
    res.json(await fetchDetail(id, user));
  }),
);

tickets.post(
  '/:id/comments',
  wrap(async (req, res) => {
    const user = req.user!;
    const id = idParam(req);
    await fetchDetail(id, user);
    const { body } = commentSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO comments (ticket_id, author_id, body) VALUES ($1, $2, $3)
       RETURNING id, body, created_at AS "createdAt"`,
      [id, user.id, body],
    );
    res.status(201).json({ ...rows[0], authorEmail: user.email });
  }),
);
