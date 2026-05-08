import type { Request, Response } from 'express';
import { DeviceState, LoanStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError, sendOk } from '../utils/http.js';

const include = {
  assignedUser: { select: { id: true, name: true, email: true, departmentId: true, department: { select: { id: true, name: true } } } },
  assignedComputerEquipment: { select: { id: true, name: true, description: true } },
  department: { select: { id: true, name: true, description: true } },
  files: true
};

const deliveryHistoryInclude = {
  device: {
    select: {
      id: true,
      equipment: true,
      serialNumber: true,
      state: true,
      loanStatus: true,
      assignedComputerEquipment: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } }
    }
  },
  deliveredBy: { select: { id: true, name: true, email: true } }
};

export async function index(_req: Request, res: Response) {
  const devices = await prisma.device.findMany({ include, orderBy: [{ department: { name: 'asc' } }, { createdAt: 'desc' }] });
  return sendOk(res, devices);
}

export async function deliveredHistory(_req: Request, res: Response) {
  const history = await prisma.deviceDeliveryHistory.findMany({
    include: deliveryHistoryInclude,
    orderBy: [{ deliveredAt: 'desc' }, { createdAt: 'desc' }]
  });
  return sendOk(res, history);
}

export async function create(req: Request, res: Response) {
  const device = await prisma.device.create({ data: req.body, include });
  return sendOk(res, device, 201);
}

export async function update(req: Request, res: Response) {
  const device = await prisma.device.update({ where: { id: String(req.params.id) }, data: req.body, include });
  return sendOk(res, device);
}

export async function markReturned(req: Request, res: Response) {
  const id = String(req.params.id);
  const notes = typeof req.body.notes === 'string' && req.body.notes.trim() ? req.body.notes.trim() : null;

  const result = await prisma.$transaction(async (tx) => {
    const device = await tx.device.findUnique({ where: { id }, include });
    if (!device) throw new AppError(404, 'Equipo no encontrado.');
    if (device.loanStatus === LoanStatus.RETURNED) throw new AppError(400, 'Este equipo ya está marcado como entregado.');

    const history = await tx.deviceDeliveryHistory.create({
      data: {
        deviceId: device.id,
        deliveredById: req.authUser?.id || null,
        previousAssignedUserId: device.assignedUserId || null,
        previousAssignedUserName: device.assignedUser?.name || device.equipment,
        previousAssignedUserEmail: device.assignedUser?.email || null,
        previousDepartmentId: device.departmentId || null,
        previousDepartmentName: device.department?.name || null,
        previousComputerEquipmentId: device.assignedComputerEquipmentId || null,
        previousComputerEquipmentName: device.assignedComputerEquipment?.name || null,
        equipment: device.equipment,
        serialNumber: device.serialNumber,
        state: device.state,
        description: device.description || null,
        notes
      },
      include: deliveryHistoryInclude
    });

    const updated = await tx.device.update({
      where: { id: device.id },
      data: {
        loanStatus: LoanStatus.RETURNED,
        state: DeviceState.AVAILABLE
      },
      include
    });

    return { device: updated, history };
  });

  return sendOk(res, result);
}
