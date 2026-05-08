import { AuditAction, TicketStatus, type Prisma, type User } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/http.js';

async function nextTicketPublicId(tx: Prisma.TransactionClient) {
  await tx.ticketSequence.upsert({ where: { id: 1 }, update: {}, create: { id: 1, value: 0 } });
  const sequence = await tx.ticketSequence.update({ where: { id: 1 }, data: { value: { increment: 1 } } });
  return `TK-${String(sequence.value).padStart(3, '0')}`;
}

const ticketInclude = {
  creator: { select: { id: true, name: true, email: true, role: true } },
  leader: { select: { id: true, name: true, email: true, role: true } },
  device: true,
  auditLogs: { include: { actor: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' as const } }
};

export async function createTicket(user: User, input: any) {
  return prisma.$transaction(async (tx) => {
    const publicId = await nextTicketPublicId(tx);
    const ticket = await tx.ticket.create({
      data: {
        publicId,
        creatorId: user.id,
        leaderId: input.leaderId || null,
        leaderName: input.leaderName || null,
        deviceId: input.deviceId || null,
        reviewedEquipment: input.reviewedEquipment || null,
        failureDescription: input.failureDescription,
        deviceSpecs: input.deviceSpecs || null,
        priority: input.priority,
        technicalNotes: input.technicalNotes || null
      }
    });

    await tx.ticketAudit.create({
      data: { ticketId: ticket.id, actorId: user.id, action: AuditAction.CREATED, toStatus: TicketStatus.PENDING }
    });

    return tx.ticket.findUniqueOrThrow({ where: { id: ticket.id }, include: ticketInclude });
  });
}

export async function listTickets(user: User) {
  return prisma.ticket.findMany({
    where: user.role === 'ADMIN' ? {} : { creatorId: user.id },
    include: ticketInclude,
    orderBy: { createdAt: 'desc' }
  });
}

export async function getTicket(user: User, id: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude });
  if (!ticket) throw new AppError(404, 'Ticket no encontrado.');
  if (user.role !== 'ADMIN' && ticket.creatorId !== user.id) throw new AppError(403, 'No puedes ver tickets de otros usuarios.');
  return ticket;
}

export async function updateTicket(user: User, id: string, input: any) {
  const current = await prisma.ticket.findUnique({ where: { id } });
  if (!current) throw new AppError(404, 'Ticket no encontrado.');

  const resolvedAt = input.status === 'RESOLVED' && current.status !== 'RESOLVED' ? new Date() : current.resolvedAt;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id },
      data: {
        leaderId: input.leaderId === undefined ? undefined : input.leaderId,
        leaderName: input.leaderName,
        deviceId: input.deviceId === undefined ? undefined : input.deviceId,
        reviewedEquipment: input.reviewedEquipment,
        failureDescription: input.failureDescription,
        deviceSpecs: input.deviceSpecs,
        priority: input.priority,
        status: input.status,
        resolvedAt,
        technicalNotes: input.technicalNotes
      }
    });

    await tx.ticketAudit.create({
      data: {
        ticketId: id,
        actorId: user.id,
        action: input.status && input.status !== current.status ? AuditAction.STATUS_CHANGED : AuditAction.UPDATED,
        fromStatus: input.status && input.status !== current.status ? current.status : undefined,
        toStatus: input.status && input.status !== current.status ? input.status : undefined,
        notes: input.technicalNotes
      }
    });

    return tx.ticket.findUniqueOrThrow({ where: { id: updated.id }, include: ticketInclude });
  });
}
