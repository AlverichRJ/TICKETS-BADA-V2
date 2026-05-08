import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendOk } from '../utils/http.js';

export async function index(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { name: 'asc' }
  });
  return sendOk(res, users);
}
