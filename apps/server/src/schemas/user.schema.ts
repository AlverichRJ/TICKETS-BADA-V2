import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  isActive: z.boolean().optional(),
  departmentId: z.string().trim().min(1).nullable().optional()
});
