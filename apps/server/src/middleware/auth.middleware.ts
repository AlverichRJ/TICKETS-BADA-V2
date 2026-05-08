import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role, User as PrismaUser } from '@prisma/client';
import { adminEmails, env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/http.js';

type JwtPayload = { sub: string; email: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      authUser?: PrismaUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const bearerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;
    const token = bearerToken || req.cookies?.[env.COOKIE_NAME];

    if (!token) throw new AppError(401, 'Sesión requerida.');

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

    if (!user || !user.isActive) throw new AppError(401, 'Usuario no autorizado o inactivo.');

    req.authUser = user;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Sesión inválida.'));
  }
}

function hasRequiredRole(user: PrismaUser, roles: Role[]) {
  if (roles.includes(user.role)) return true;
  if (!roles.includes('ADMIN' as Role)) return false;

  const email = user.email.toLowerCase();
  return adminEmails.includes(email);
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) return next(new AppError(401, 'Sesión requerida.'));
    if (!hasRequiredRole(req.authUser, roles)) return next(new AppError(403, 'No tienes permisos para esta acción.'));
    return next();
  };
}
