import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { HttpError } from './http';
import { isStaff, Role } from './ticket.rules';

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const signToken = (user: AuthUser) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '8h',
  });

export const requireAuth: RequestHandler = (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'Authentication required'));
  try {
    // Pin the algorithm so a forged token cannot choose its own.
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as AuthUser;
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
};

export const requireStaff: RequestHandler = (req, _res, next) => {
  if (!req.user || !isStaff(req.user.role)) return next(new HttpError(403, 'Staff only'));
  next();
};
