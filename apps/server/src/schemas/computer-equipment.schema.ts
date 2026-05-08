import { z } from 'zod';

export const createComputerEquipmentSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable()
});

export const updateComputerEquipmentSchema = createComputerEquipmentSchema.partial().extend({
  isActive: z.boolean().optional()
});
