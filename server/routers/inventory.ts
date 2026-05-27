import { z } from 'zod';
import { adminProcedure, protectedProcedure, router } from '../_core/trpc.js';
import { createDepartment, createDevice, createEquipmentType, listDepartments, listDevices, listEquipmentTypes } from '../services/inventory.js';

export const inventoryRouter = router({
  devices: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listDevices(input?.search)),
  createDevice: adminProcedure.input(z.object({
    equipment: z.string().trim().min(2),
    serialNumber: z.string().trim().min(2),
    state: z.enum(['available', 'assigned', 'maintenance', 'retired']).optional(),
    description: z.string().optional(),
    departmentId: z.string().optional()
  })).mutation(({ input }) => createDevice(input)),
  departments: protectedProcedure.query(() => listDepartments()),
  createDepartment: adminProcedure.input(z.object({ name: z.string().trim().min(2), description: z.string().optional() })).mutation(({ input }) => createDepartment(input)),
  equipmentTypes: protectedProcedure.query(() => listEquipmentTypes()),
  createEquipmentType: adminProcedure.input(z.object({ name: z.string().trim().min(2), description: z.string().optional() })).mutation(({ input }) => createEquipmentType(input))
});
