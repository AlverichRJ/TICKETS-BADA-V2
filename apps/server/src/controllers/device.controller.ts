import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendOk } from '../utils/http.js';

const include = {
  assignedUser: { select: { id: true, name: true, email: true, departmentId: true, department: { select: { id: true, name: true } } } },
  assignedComputerEquipment: { select: { id: true, name: true, description: true } },
  department: { select: { id: true, name: true, description: true } },
  files: true
};

export async function index(_req: Request, res: Response) {
  const devices = await prisma.device.findMany({ include, orderBy: [{ department: { name: 'asc' } }, { createdAt: 'desc' }] });
  return sendOk(res, devices);
}

export async function create(req: Request, res: Response) {
  const device = await prisma.device.create({ data: req.body, include });
  return sendOk(res, device, 201);
}

export async function update(req: Request, res: Response) {
  const device = await prisma.device.update({ where: { id: String(String(req.params.id)) }, data: req.body, include });
  return sendOk(res, device);
}
