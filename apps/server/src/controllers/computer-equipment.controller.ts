import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendOk } from '../utils/http.js';

export async function index(_req: Request, res: Response) {
  const equipment = await prisma.computerEquipment.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  return sendOk(res, equipment);
}

export async function create(req: Request, res: Response) {
  const name = String(req.body.name).trim();
  const description = req.body.description ? String(req.body.description).trim() : null;

  const equipment = await prisma.computerEquipment.upsert({
    where: { name },
    update: { description, isActive: true },
    create: { name, description }
  });

  return sendOk(res, equipment, 201);
}
