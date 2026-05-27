import { z } from 'zod';
import { adminProcedure, protectedProcedure, router } from '../_core/trpc.js';
import {
  assignDevice,
  bulkImportDevices,
  createDepartment,
  createDevice,
  createEquipmentType,
  createResponsiva,
  getResponsiva,
  listAvailableDevices,
  listDepartments,
  listDevices,
  listEquipmentTypes,
  listResponsivas,
  updateDevice,
  updateResponsiva
} from '../services/inventory.js';

const deviceInput = z.object({
  equipment: z.string().trim().min(2),
  serialNumber: z.string().trim().min(2),
  state: z.enum(['available', 'assigned', 'maintenance', 'retired']).optional(),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  assignedUserId: z.string().optional(),
  assignedUserName: z.string().optional(),
  assignedUserEmail: z.string().email().optional().or(z.literal('')),
  loanStatus: z.enum(['active', 'returned']).optional(),
  team: z.string().optional(),
  externalResponsivaUrl: z.string().trim().max(700).optional().or(z.literal(''))
});

const responsivaInput = z.object({
  deviceId: z.string().min(2),
  responsibleUserId: z.string().optional(),
  responsibleName: z.string().trim().min(2),
  responsibleEmail: z.string().email().optional().or(z.literal('')),
  departmentId: z.string().optional(),
  notes: z.string().optional()
});

export const inventoryRouter = router({
  devices: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listDevices(input?.search)),
  availableDevices: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listAvailableDevices(input?.search)),
  createDevice: adminProcedure.input(deviceInput).mutation(({ input }) => createDevice(input)),
  updateDevice: adminProcedure.input(deviceInput.extend({ id: z.string().min(2) })).mutation(({ input }) => updateDevice(input)),
  assignDevice: adminProcedure.input(responsivaInput).mutation(({ input, ctx }) => assignDevice({ ...input, actorId: ctx.user.id })),
  responsivas: protectedProcedure.query(() => listResponsivas()),
  getResponsiva: protectedProcedure.input(z.object({ id: z.string().min(2) })).query(({ input }) => getResponsiva(input.id)),
  createResponsiva: adminProcedure.input(responsivaInput).mutation(({ input, ctx }) => createResponsiva({ ...input, createdById: ctx.user.id })),
  updateResponsiva: adminProcedure.input(responsivaInput.extend({ id: z.string().min(2), status: z.enum(['active', 'returned', 'cancelled']) })).mutation(({ input }) => updateResponsiva(input)),
  bulkImportDevices: adminProcedure.input(z.object({ devices: z.array(deviceInput).min(1).max(5000) })).mutation(({ input }) => bulkImportDevices(input.devices)),
  departments: protectedProcedure.query(() => listDepartments()),
  createDepartment: adminProcedure.input(z.object({ name: z.string().trim().min(2), description: z.string().optional() })).mutation(({ input }) => createDepartment(input)),
  equipmentTypes: protectedProcedure.query(() => listEquipmentTypes()),
  createEquipmentType: adminProcedure.input(z.object({ name: z.string().trim().min(2), description: z.string().optional() })).mutation(({ input }) => createEquipmentType(input))
});
