import { z } from 'zod';
import { adminProcedure, protectedProcedure, router } from '../_core/trpc.js';
import { createTicket, listTickets, ticketStats, updateTicketStatus } from '../services/tickets.js';

const prioritySchema = z.enum(['high', 'medium', 'low']);
const statusSchema = z.enum(['pending', 'in_progress', 'resolved']);

export const ticketsRouter = router({
  list: protectedProcedure.input(z.object({
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    search: z.string().trim().optional()
  }).optional()).query(({ ctx, input }) => listTickets(input, { id: ctx.user.id, role: ctx.user.role })),
  stats: protectedProcedure.query(({ ctx }) => ticketStats({ id: ctx.user.id, role: ctx.user.role })),
  create: protectedProcedure.input(z.object({
    deviceId: z.string().optional(),
    reviewedEquipment: z.string().trim().optional(),
    failureDescription: z.string().trim().min(8),
    deviceSpecs: z.string().trim().optional(),
    priority: prioritySchema.default('medium')
  })).mutation(({ ctx, input }) => createTicket({ ...input, creatorId: ctx.user.id })),
  updateStatus: adminProcedure.input(z.object({
    id: z.string(),
    status: statusSchema,
    technicalNotes: z.string().trim().optional()
  })).mutation(({ ctx, input }) => updateTicketStatus({ ...input, actorId: ctx.user.id }))
});
