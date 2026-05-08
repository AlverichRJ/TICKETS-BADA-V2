import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendOk } from '../utils/http.js';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  departmentId: true,
  department: { select: { id: true, name: true, description: true } },
  createdAt: true,
  updatedAt: true
};

export async function index(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }]
  });
  return sendOk(res, users);
}

export async function update(req: Request, res: Response) {
  const data: {
    name?: string;
    role?: 'ADMIN' | 'USER';
    isActive?: boolean;
    departmentId?: string | null;
  } = {};

  if (typeof req.body.name === 'string') data.name = req.body.name.trim();
  if (req.body.role === 'ADMIN' || req.body.role === 'USER') data.role = req.body.role;
  if (typeof req.body.isActive === 'boolean') data.isActive = req.body.isActive;
  if ('departmentId' in req.body) data.departmentId = req.body.departmentId || null;

  const user = await prisma.user.update({
    where: { id: String(req.params.id) },
    data,
    select: userSelect
  });

  return sendOk(res, user);
}
