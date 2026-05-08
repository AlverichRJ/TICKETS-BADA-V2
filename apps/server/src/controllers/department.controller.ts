import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendOk } from '../utils/http.js';

export async function index(_req: Request, res: Response) {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });
  return sendOk(res, departments);
}

export async function create(req: Request, res: Response) {
  const name = String(req.body.name).trim();
  const description = req.body.description ? String(req.body.description).trim() : null;

  const department = await prisma.department.upsert({
    where: { name },
    update: { description, isActive: true },
    create: { name, description }
  });

  return sendOk(res, department, 201);
}

export async function update(req: Request, res: Response) {
  const data: { name?: string; description?: string | null; isActive?: boolean } = {};

  if (typeof req.body.name === 'string') data.name = req.body.name.trim();
  if ('description' in req.body) data.description = req.body.description ? String(req.body.description).trim() : null;
  if (typeof req.body.isActive === 'boolean') data.isActive = req.body.isActive;

  const department = await prisma.department.update({
    where: { id: String(req.params.id) },
    data
  });

  return sendOk(res, department);
}
