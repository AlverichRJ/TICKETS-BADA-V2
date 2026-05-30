import { and, asc, desc, eq, like, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { departments, digitalServiceSubscriptions, digitalServices, paymentMethods, users } from '../db/schema.js';
import { createId } from '../utils/id.js';

export type DigitalServiceCategory = 'ai' | 'editing' | 'hosting' | 'security' | 'productivity' | 'business' | 'design' | 'other';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual' | 'one_time';
export type DigitalServiceStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type DigitalServicePriority = 'high' | 'medium' | 'low';
export type PaymentMethodType = 'card' | 'cash' | 'transfer' | 'account' | 'other';

export type DigitalServiceInput = {
  name: string;
  category?: DigitalServiceCategory;
  provider?: string;
  websiteUrl?: string;
  description?: string;
  isActive?: boolean;
};

export type SubscriptionInput = {
  serviceId?: string;
  serviceName?: string;
  category?: DigitalServiceCategory;
  provider?: string;
  departmentId?: string;
  responsibleUserId?: string;
  responsibleName?: string;
  billingCycle?: BillingCycle;
  amount: number;
  currency?: string;
  paymentMethodId?: string;
  paymentMethodName?: string;
  purchaseDate?: string;
  renewalDate?: string;
  renewalDay?: number;
  status?: DigitalServiceStatus;
  priority?: DigitalServicePriority;
  usageDescription?: string;
  notes?: string;
};

export type ImportSubscriptionInput = SubscriptionInput & {
  sourceRow?: number;
  sourceSheet?: string;
};

export type PaymentMethodInput = {
  name: string;
  type?: PaymentMethodType;
  ownerName?: string;
  lastFour?: string;
  isActive?: boolean;
};

export type DigitalServiceFilters = {
  search?: string;
  status?: DigitalServiceStatus | 'all';
  category?: DigitalServiceCategory | 'all';
};

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

function normalizeKeyPart(value?: string | null) {
  return normalizeName(String(value || ''));
}

function cleanOptional(value?: string) {
  const clean = value?.trim();
  return clean ? clean : null;
}

function toAmount(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0.00';
  return value.toFixed(2);
}

function toMysqlDate(value?: string) {
  const clean = value?.trim();
  return clean ? new Date(`${clean}T00:00:00`) : null;
}

function monthlyEquivalent(amount: number, cycle: BillingCycle) {
  if (cycle === 'annual') return amount / 12;
  if (cycle === 'quarterly') return amount / 3;
  if (cycle === 'one_time') return 0;
  return amount;
}

function buildImportDuplicateKey(input: {
  serviceName?: string | null;
  responsibleName?: string | null;
  billingCycle?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  paymentMethodName?: string | null;
  renewalDate?: string | Date | null;
  renewalDay?: number | null;
  status?: string | null;
}) {
  const amount = Number(input.amount || 0).toFixed(2);
  const renewalDate = input.renewalDate instanceof Date
    ? input.renewalDate.toISOString().slice(0, 10)
    : String(input.renewalDate || '').slice(0, 10);

  return [
    normalizeKeyPart(input.serviceName),
    normalizeKeyPart(input.responsibleName),
    normalizeKeyPart(input.billingCycle || 'monthly'),
    amount,
    normalizeKeyPart(input.currency || 'MXN'),
    normalizeKeyPart(input.paymentMethodName),
    renewalDate,
    input.renewalDay || '',
    normalizeKeyPart(input.status || 'active')
  ].join('|');
}

async function resolveService(input: SubscriptionInput) {
  if (input.serviceId) {
    const [service] = await db.select().from(digitalServices).where(eq(digitalServices.id, input.serviceId));
    if (!service) throw new Error('Servicio digital no encontrado.');
    return service;
  }

  if (!input.serviceName?.trim()) throw new Error('Selecciona un servicio existente o captura un servicio nuevo.');
  const normalizedName = normalizeName(input.serviceName);
  const [existing] = await db.select().from(digitalServices).where(eq(digitalServices.normalizedName, normalizedName));
  if (existing) return existing;

  const id = createId('dsv');
  await db.insert(digitalServices).values({
    id,
    name: input.serviceName.trim().replace(/\s+/g, ' '),
    normalizedName,
    category: input.category ?? 'other',
    provider: cleanOptional(input.provider),
    websiteUrl: null,
    description: null,
    isActive: true
  });
  const [created] = await db.select().from(digitalServices).where(eq(digitalServices.id, id));
  return created;
}

async function resolvePaymentMethod(input: SubscriptionInput) {
  if (input.paymentMethodId) return input.paymentMethodId;
  if (!input.paymentMethodName?.trim()) return null;

  const normalized = normalizeName(input.paymentMethodName);
  const [existing] = await db.select().from(paymentMethods).where(eq(paymentMethods.name, normalized));
  if (existing) return existing.id;

  const id = createId('pay');
  await db.insert(paymentMethods).values({ id, name: normalized, type: 'other', isActive: true });
  return id;
}

export async function listDigitalServices(filters?: DigitalServiceFilters) {
  const term = filters?.search?.trim() ? `%${filters.search.trim()}%` : undefined;
  const status = filters?.status && filters.status !== 'all' ? filters.status : undefined;
  const category = filters?.category && filters.category !== 'all' ? filters.category : undefined;

  const rows = await db.select({
    serviceId: digitalServices.id,
    serviceName: digitalServices.name,
    normalizedName: digitalServices.normalizedName,
    category: digitalServices.category,
    provider: digitalServices.provider,
    websiteUrl: digitalServices.websiteUrl,
    description: digitalServices.description,
    serviceActive: digitalServices.isActive,
    serviceCreatedAt: digitalServices.createdAt,
    subscriptionId: digitalServiceSubscriptions.id,
    departmentId: digitalServiceSubscriptions.departmentId,
    departmentName: departments.name,
    responsibleUserId: digitalServiceSubscriptions.responsibleUserId,
    responsibleUserName: users.name,
    responsibleName: digitalServiceSubscriptions.responsibleName,
    billingCycle: digitalServiceSubscriptions.billingCycle,
    amount: digitalServiceSubscriptions.amount,
    currency: digitalServiceSubscriptions.currency,
    paymentMethodId: digitalServiceSubscriptions.paymentMethodId,
    paymentMethodName: paymentMethods.name,
    purchaseDate: digitalServiceSubscriptions.purchaseDate,
    renewalDate: digitalServiceSubscriptions.renewalDate,
    renewalDay: digitalServiceSubscriptions.renewalDay,
    status: digitalServiceSubscriptions.status,
    priority: digitalServiceSubscriptions.priority,
    usageDescription: digitalServiceSubscriptions.usageDescription,
    notes: digitalServiceSubscriptions.notes,
    subscriptionCreatedAt: digitalServiceSubscriptions.createdAt,
    subscriptionUpdatedAt: digitalServiceSubscriptions.updatedAt
  }).from(digitalServiceSubscriptions)
    .leftJoin(digitalServices, eq(digitalServiceSubscriptions.serviceId, digitalServices.id))
    .leftJoin(departments, eq(digitalServiceSubscriptions.departmentId, departments.id))
    .leftJoin(users, eq(digitalServiceSubscriptions.responsibleUserId, users.id))
    .leftJoin(paymentMethods, eq(digitalServiceSubscriptions.paymentMethodId, paymentMethods.id))
    .where(and(
      term ? or(
        like(digitalServices.name, term),
        like(digitalServices.provider, term),
        like(digitalServiceSubscriptions.responsibleName, term),
        like(digitalServiceSubscriptions.usageDescription, term),
        like(paymentMethods.name, term)
      ) : undefined,
      status ? eq(digitalServiceSubscriptions.status, status) : undefined,
      category ? eq(digitalServices.category, category) : undefined
    ))
    .orderBy(asc(digitalServices.name), desc(digitalServiceSubscriptions.createdAt));

  const grouped = new Map<string, any>();
  for (const row of rows) {
    const amount = Number(row.amount || 0);
    const cycle = row.billingCycle as BillingCycle;
    const monthly = row.status === 'active' ? monthlyEquivalent(amount, cycle) : 0;
    const annual = monthly * 12;
    const serviceId = row.serviceId || 'sin-servicio';

    if (!grouped.has(serviceId)) {
      grouped.set(serviceId, {
        id: serviceId,
        name: row.serviceName || 'Servicio sin nombre',
        normalizedName: row.normalizedName,
        category: row.category || 'other',
        provider: row.provider,
        websiteUrl: row.websiteUrl,
        description: row.description,
        isActive: Boolean(row.serviceActive),
        createdAt: row.serviceCreatedAt,
        subscriptionCount: 0,
        activeCount: 0,
        pausedCount: 0,
        cancelledCount: 0,
        expiredCount: 0,
        monthlyCost: 0,
        annualCost: 0,
        nearestRenewalDate: null as string | null,
        subscriptions: [] as any[]
      });
    }

    const service = grouped.get(serviceId);
    service.subscriptionCount += 1;
    service[`${row.status}Count`] = (service[`${row.status}Count`] || 0) + 1;
    service.monthlyCost += monthly;
    service.annualCost += annual;
    if (row.renewalDate && (!service.nearestRenewalDate || String(row.renewalDate) < service.nearestRenewalDate)) {
      service.nearestRenewalDate = String(row.renewalDate);
    }
    service.subscriptions.push({
      id: row.subscriptionId,
      serviceId: row.serviceId,
      departmentId: row.departmentId,
      departmentName: row.departmentName,
      responsibleUserId: row.responsibleUserId,
      responsibleName: row.responsibleUserName || row.responsibleName,
      manualResponsibleName: row.responsibleName,
      billingCycle: row.billingCycle,
      amount,
      currency: row.currency,
      paymentMethodId: row.paymentMethodId,
      paymentMethodName: row.paymentMethodName,
      purchaseDate: row.purchaseDate,
      renewalDate: row.renewalDate,
      renewalDay: row.renewalDay,
      status: row.status,
      priority: row.priority,
      usageDescription: row.usageDescription,
      notes: row.notes,
      monthlyCost: monthly,
      annualCost: annual,
      createdAt: row.subscriptionCreatedAt,
      updatedAt: row.subscriptionUpdatedAt
    });
  }

  return Array.from(grouped.values()).map((service) => ({
    ...service,
    monthlyCost: Number(service.monthlyCost.toFixed(2)),
    annualCost: Number(service.annualCost.toFixed(2))
  }));
}

export async function createDigitalService(input: DigitalServiceInput) {
  const normalizedName = normalizeName(input.name);
  const [existing] = await db.select().from(digitalServices).where(eq(digitalServices.normalizedName, normalizedName));
  if (existing) return existing;

  const id = createId('dsv');
  await db.insert(digitalServices).values({
    id,
    name: input.name.trim().replace(/\s+/g, ' '),
    normalizedName,
    category: input.category ?? 'other',
    provider: cleanOptional(input.provider),
    websiteUrl: cleanOptional(input.websiteUrl),
    description: cleanOptional(input.description),
    isActive: input.isActive ?? true
  });
  const [service] = await db.select().from(digitalServices).where(eq(digitalServices.id, id));
  return service;
}

export async function updateDigitalService(input: DigitalServiceInput & { id: string }) {
  const normalizedName = normalizeName(input.name);
  await db.update(digitalServices).set({
    name: input.name.trim().replace(/\s+/g, ' '),
    normalizedName,
    category: input.category ?? 'other',
    provider: cleanOptional(input.provider),
    websiteUrl: cleanOptional(input.websiteUrl),
    description: cleanOptional(input.description),
    isActive: input.isActive ?? true
  }).where(eq(digitalServices.id, input.id));
  const [service] = await db.select().from(digitalServices).where(eq(digitalServices.id, input.id));
  return service;
}

export async function createSubscription(input: SubscriptionInput) {
  const service = await resolveService(input);
  const paymentMethodId = await resolvePaymentMethod(input);
  const id = createId('dss');
  await db.insert(digitalServiceSubscriptions).values({
    id,
    serviceId: service.id,
    departmentId: input.departmentId || null,
    responsibleUserId: input.responsibleUserId || null,
    responsibleName: cleanOptional(input.responsibleName),
    billingCycle: input.billingCycle ?? 'monthly',
    amount: toAmount(input.amount),
    currency: (input.currency || 'MXN').trim().toUpperCase(),
    paymentMethodId,
    purchaseDate: toMysqlDate(input.purchaseDate),
    renewalDate: toMysqlDate(input.renewalDate),
    renewalDay: input.renewalDay || null,
    status: input.status ?? 'active',
    priority: input.priority ?? 'medium',
    usageDescription: cleanOptional(input.usageDescription),
    notes: cleanOptional(input.notes)
  });
  const [subscription] = await db.select().from(digitalServiceSubscriptions).where(eq(digitalServiceSubscriptions.id, id));
  return subscription;
}

export async function updateSubscription(input: SubscriptionInput & { id: string }) {
  const service = await resolveService(input);
  const paymentMethodId = await resolvePaymentMethod(input);
  await db.update(digitalServiceSubscriptions).set({
    serviceId: service.id,
    departmentId: input.departmentId || null,
    responsibleUserId: input.responsibleUserId || null,
    responsibleName: cleanOptional(input.responsibleName),
    billingCycle: input.billingCycle ?? 'monthly',
    amount: toAmount(input.amount),
    currency: (input.currency || 'MXN').trim().toUpperCase(),
    paymentMethodId,
    purchaseDate: toMysqlDate(input.purchaseDate),
    renewalDate: toMysqlDate(input.renewalDate),
    renewalDay: input.renewalDay || null,
    status: input.status ?? 'active',
    priority: input.priority ?? 'medium',
    usageDescription: cleanOptional(input.usageDescription),
    notes: cleanOptional(input.notes)
  }).where(eq(digitalServiceSubscriptions.id, input.id));
  const [subscription] = await db.select().from(digitalServiceSubscriptions).where(eq(digitalServiceSubscriptions.id, input.id));
  return subscription;
}

export async function importSubscriptions(rows: ImportSubscriptionInput[]) {
  const existingServices = await listDigitalServices({ status: 'all' });
  const knownKeys = new Set<string>();

  for (const service of existingServices) {
    for (const subscription of service.subscriptions) {
      knownKeys.add(buildImportDuplicateKey({
        serviceName: service.name,
        responsibleName: subscription.manualResponsibleName || subscription.responsibleName,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        currency: subscription.currency,
        paymentMethodName: subscription.paymentMethodName,
        renewalDate: subscription.renewalDate,
        renewalDay: subscription.renewalDay,
        status: subscription.status
      }));
    }
  }

  let created = 0;
  let skippedDuplicates = 0;
  let skippedInvalid = 0;
  const issues: Array<{ sourceRow?: number; sourceSheet?: string; serviceName?: string; reason: string }> = [];

  for (const row of rows) {
    if (!row.serviceName?.trim() || !Number.isFinite(Number(row.amount))) {
      skippedInvalid += 1;
      issues.push({ sourceRow: row.sourceRow, sourceSheet: row.sourceSheet, serviceName: row.serviceName, reason: 'Fila incompleta: falta servicio o monto válido.' });
      continue;
    }

    const key = buildImportDuplicateKey({
      serviceName: row.serviceName,
      responsibleName: row.responsibleName,
      billingCycle: row.billingCycle ?? 'monthly',
      amount: row.amount,
      currency: row.currency ?? 'MXN',
      paymentMethodName: row.paymentMethodName,
      renewalDate: row.renewalDate,
      renewalDay: row.renewalDay,
      status: row.status ?? 'active'
    });

    if (knownKeys.has(key)) {
      skippedDuplicates += 1;
      issues.push({ sourceRow: row.sourceRow, sourceSheet: row.sourceSheet, serviceName: row.serviceName, reason: 'Duplicado detectado: ya existe una suscripción equivalente.' });
      continue;
    }

    await createSubscription({
      ...row,
      serviceName: row.serviceName.trim().replace(/\s+/g, ' '),
      category: row.category ?? 'other',
      billingCycle: row.billingCycle ?? 'monthly',
      amount: Number(row.amount),
      currency: row.currency ?? 'MXN',
      status: row.status ?? 'active',
      priority: row.priority ?? 'medium'
    });
    knownKeys.add(key);
    created += 1;
  }

  return {
    received: rows.length,
    created,
    skippedDuplicates,
    skippedInvalid,
    issues: issues.slice(0, 80)
  };
}

export async function listServiceCatalog() {
  return db.select().from(digitalServices).where(eq(digitalServices.isActive, true)).orderBy(asc(digitalServices.name));
}

export async function listPaymentMethods() {
  return db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true)).orderBy(asc(paymentMethods.name));
}

export async function createPaymentMethod(input: PaymentMethodInput) {
  const name = normalizeName(input.name);
  const [existing] = await db.select().from(paymentMethods).where(eq(paymentMethods.name, name));
  if (existing) return existing;

  const id = createId('pay');
  await db.insert(paymentMethods).values({
    id,
    name,
    type: input.type ?? 'other',
    ownerName: cleanOptional(input.ownerName),
    lastFour: cleanOptional(input.lastFour),
    isActive: input.isActive ?? true
  });
  const [method] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
  return method;
}

export async function digitalServicesStats() {
  const services = await listDigitalServices({ status: 'all' });
  const activeSubscriptions = services.flatMap((service) => service.subscriptions).filter((subscription) => subscription.status === 'active');
  const renewals = activeSubscriptions
    .filter((subscription) => subscription.renewalDate)
    .sort((a, b) => String(a.renewalDate).localeCompare(String(b.renewalDate)))
    .slice(0, 5);

  return {
    totalServices: services.length,
    activeSubscriptions: activeSubscriptions.length,
    monthlyCost: Number(services.reduce((total, service) => total + service.monthlyCost, 0).toFixed(2)),
    annualCost: Number(services.reduce((total, service) => total + service.annualCost, 0).toFixed(2)),
    upcomingRenewals: renewals
  };
}
