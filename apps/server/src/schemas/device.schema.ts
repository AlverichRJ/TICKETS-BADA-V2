import { z } from 'zod';

export const createDeviceSchema = z.object({
  assignedUserId: z.string().optional().nullable(),
  assignedComputerEquipmentId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  equipment: z.string().min(2),
  serialNumber: z.string().min(3),
  state: z.enum(['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED']).default('AVAILABLE'),
  description: z.string().optional().nullable(),
  loanStatus: z.enum(['ACTIVE', 'RETURNED']).default('ACTIVE')
});

export const updateDeviceSchema = createDeviceSchema.partial();

export const returnDeviceSchema = z.object({
  notes: z.string().max(500).optional().nullable()
});
