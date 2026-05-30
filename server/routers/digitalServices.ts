import { z } from 'zod';
import { adminProcedure, protectedProcedure, router } from '../_core/trpc.js';
import {
  createDigitalService,
  createPaymentMethod,
  createSubscription,
  digitalServicesStats,
  listDigitalServices,
  listPaymentMethods,
  listServiceCatalog,
  updateDigitalService,
  updateSubscription
} from '../services/digitalServices.js';

const categoryEnum = z.enum(['ai', 'editing', 'hosting', 'security', 'productivity', 'business', 'design', 'other']);
const billingCycleEnum = z.enum(['monthly', 'quarterly', 'annual', 'one_time']);
const statusEnum = z.enum(['active', 'paused', 'cancelled', 'expired']);
const priorityEnum = z.enum(['high', 'medium', 'low']);
const paymentTypeEnum = z.enum(['card', 'cash', 'transfer', 'account', 'other']);

const digitalServiceInput = z.object({
  name: z.string().trim().min(2),
  category: categoryEnum.optional(),
  provider: z.string().trim().optional().or(z.literal('')),
  websiteUrl: z.string().trim().max(700).optional().or(z.literal('')),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

const subscriptionInput = z.object({
  serviceId: z.string().optional(),
  serviceName: z.string().trim().optional().or(z.literal('')),
  category: categoryEnum.optional(),
  provider: z.string().trim().optional().or(z.literal('')),
  departmentId: z.string().optional(),
  responsibleUserId: z.string().optional(),
  responsibleName: z.string().trim().optional().or(z.literal('')),
  billingCycle: billingCycleEnum.optional(),
  amount: z.coerce.number().min(0),
  currency: z.string().trim().min(3).max(8).optional(),
  paymentMethodId: z.string().optional(),
  paymentMethodName: z.string().trim().optional().or(z.literal('')),
  purchaseDate: z.string().optional().or(z.literal('')),
  renewalDate: z.string().optional().or(z.literal('')),
  renewalDay: z.coerce.number().int().min(1).max(31).optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  usageDescription: z.string().optional(),
  notes: z.string().optional()
});

const paymentMethodInput = z.object({
  name: z.string().trim().min(2),
  type: paymentTypeEnum.optional(),
  ownerName: z.string().trim().optional().or(z.literal('')),
  lastFour: z.string().trim().max(8).optional().or(z.literal('')),
  isActive: z.boolean().optional()
});

export const digitalServicesRouter = router({
  list: protectedProcedure.input(z.object({
    search: z.string().optional(),
    status: statusEnum.or(z.literal('all')).optional(),
    category: categoryEnum.or(z.literal('all')).optional()
  }).optional()).query(({ input }) => listDigitalServices(input)),
  stats: protectedProcedure.query(() => digitalServicesStats()),
  catalog: protectedProcedure.query(() => listServiceCatalog()),
  paymentMethods: protectedProcedure.query(() => listPaymentMethods()),
  createService: adminProcedure.input(digitalServiceInput).mutation(({ input }) => createDigitalService(input)),
  updateService: adminProcedure.input(digitalServiceInput.extend({ id: z.string().min(2) })).mutation(({ input }) => updateDigitalService(input)),
  createSubscription: adminProcedure.input(subscriptionInput).mutation(({ input }) => createSubscription(input)),
  updateSubscription: adminProcedure.input(subscriptionInput.extend({ id: z.string().min(2) })).mutation(({ input }) => updateSubscription(input)),
  createPaymentMethod: adminProcedure.input(paymentMethodInput).mutation(({ input }) => createPaymentMethod(input))
});
