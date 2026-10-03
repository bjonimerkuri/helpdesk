import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from './http';
import { isStaff, Role } from './ticket.rules';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const signToken = (user: AuthUser) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '8h' });

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new HttpError(401, 'Authentication required'));
  try {
    req.user = jwt.verify(token, SECRET) as AuthUser;
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
};

export const requireStaff: RequestHandler = (req, _res, next) => {
  if (!req.user || !isStaff(req.user.role)) return next(new HttpError(403, 'Staff only'));
  next();
};
