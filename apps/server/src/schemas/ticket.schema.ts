import { z } from 'zod';

export const createTicketSchema = z.object({
  leaderId: z.string().optional().nullable(),
  leaderName: z.string().trim().min(2),
  deviceId: z.string().optional().nullable(),
  reviewedEquipment: z.string().trim().min(2),
  failureDescription: z.string().min(10),
  deviceSpecs: z.string().optional().nullable(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  technicalNotes: z.string().optional().nullable()
});

export const updateTicketSchema = z.object({
  leaderId: z.string().optional().nullable(),
  leaderName: z.string().trim().min(2).optional().nullable(),
  deviceId: z.string().optional().nullable(),
  reviewedEquipment: z.string().trim().min(2).optional().nullable(),
  failureDescription: z.string().min(10).optional(),
  deviceSpecs: z.string().optional().nullable(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED']).optional(),
  technicalNotes: z.string().optional().nullable()
});
