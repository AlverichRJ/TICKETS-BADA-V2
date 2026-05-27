import { and, desc, eq, inArray, like, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { computerEquipment, departments, deviceDeliveryHistory, devices, files, responsivas, users } from '../db/schema.js';
import { createId } from '../utils/id.js';

export type DeviceState = 'available' | 'assigned' | 'maintenance' | 'retired';
export type LoanStatus = 'active' | 'returned';
export type ResponsivaStatus = 'active' | 'returned' | 'cancelled';
export type FileType = 'responsiva' | 'ine' | 'other';

export type DeviceInput = {
  equipment: string;
  serialNumber: string;
  state?: DeviceState;
  description?: string;
  departmentId?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUserEmail?: string;
  loanStatus?: LoanStatus;
  team?: string;
  externalResponsivaUrl?: string;
};

export async function listDevices(search?: string) {
  const term = search ? `%${search}%` : undefined;
  return db.select().from(devices)
    .where(term ? or(
      like(devices.equipment, term),
      like(devices.serialNumber, term),
      like(devices.description, term),
      like(devices.assignedUserName, term),
      like(devices.team, term)
    ) : undefined)
    .orderBy(desc(devices.createdAt));
}

export async function listAvailableDevices(search?: string) {
  const term = search ? `%${search}%` : undefined;
  return db.select().from(devices)
    .where(and(
      eq(devices.state, 'available'),
      term ? or(like(devices.equipment, term), like(devices.serialNumber, term), like(devices.description, term)) : undefined
    ))
    .orderBy(devices.equipment);
}

export async function createDevice(input: DeviceInput) {
  const id = createId('dev');
  await db.insert(devices).values({
    id,
    equipment: input.equipment,
    serialNumber: input.serialNumber,
    state: input.state ?? (input.assignedUserId || input.assignedUserName ? 'assigned' : 'available'),
    description: input.description || null,
    departmentId: input.departmentId || null,
    assignedUserId: input.assignedUserId || null,
    assignedUserName: input.assignedUserName || null,
    assignedUserEmail: input.assignedUserEmail || null,
    loanStatus: input.loanStatus ?? 'active',
    team: input.team || null,
    externalResponsivaUrl: input.externalResponsivaUrl || null
  });
  const [device] = await db.select().from(devices).where(eq(devices.id, id));
  return device;
}

export async function updateDevice(input: DeviceInput & { id: string }) {
  const updates: Partial<typeof devices.$inferInsert> = {
    equipment: input.equipment,
    serialNumber: input.serialNumber,
    state: input.state ?? 'available',
    description: input.description || null,
    departmentId: input.departmentId || null,
    assignedUserId: input.assignedUserId || null,
    assignedUserName: input.assignedUserName || null,
    assignedUserEmail: input.assignedUserEmail || null,
    loanStatus: input.loanStatus ?? 'active',
    team: input.team || null,
    externalResponsivaUrl: input.externalResponsivaUrl || null
  };
  await db.update(devices).set(updates).where(eq(devices.id, input.id));
  const [device] = await db.select().from(devices).where(eq(devices.id, input.id));
  return device;
}

export async function assignDevice(input: {
  deviceId: string;
  responsibleUserId?: string;
  responsibleName: string;
  responsibleEmail?: string;
  departmentId?: string;
  notes?: string;
  actorId?: string;
}) {
  const [device] = await db.select().from(devices).where(eq(devices.id, input.deviceId));
  if (!device) throw new Error('Equipo no encontrado.');

  await db.insert(responsivas).values({
    id: createId('rsp'),
    deviceId: input.deviceId,
    responsibleUserId: input.responsibleUserId || null,
    responsibleName: input.responsibleName,
    responsibleEmail: input.responsibleEmail || null,
    departmentId: input.departmentId || null,
    notes: input.notes || null,
    createdById: input.actorId || null,
    status: 'active'
  });

  await db.update(devices).set({
    state: 'assigned',
    loanStatus: 'active',
    assignedUserId: input.responsibleUserId || null,
    assignedUserName: input.responsibleName,
    assignedUserEmail: input.responsibleEmail || null,
    departmentId: input.departmentId || null
  }).where(eq(devices.id, input.deviceId));

  const [updated] = await db.select().from(devices).where(eq(devices.id, input.deviceId));
  return updated;
}

export async function createResponsiva(input: {
  deviceId: string;
  responsibleUserId?: string;
  responsibleName: string;
  responsibleEmail?: string;
  departmentId?: string;
  notes?: string;
  createdById?: string;
}) {
  await assignDevice({
    deviceId: input.deviceId,
    responsibleUserId: input.responsibleUserId,
    responsibleName: input.responsibleName,
    responsibleEmail: input.responsibleEmail,
    departmentId: input.departmentId,
    notes: input.notes,
    actorId: input.createdById
  });
  const [responsiva] = await db.select().from(responsivas).where(and(eq(responsivas.deviceId, input.deviceId), eq(responsivas.status, 'active'))).orderBy(desc(responsivas.createdAt));
  return responsiva;
}

export async function updateResponsiva(input: {
  id: string;
  deviceId: string;
  responsibleUserId?: string;
  responsibleName: string;
  responsibleEmail?: string;
  departmentId?: string;
  status: ResponsivaStatus;
  notes?: string;
}) {
  const [current] = await db.select().from(responsivas).where(eq(responsivas.id, input.id));
  if (!current) throw new Error('Responsiva no encontrada.');

  await db.update(responsivas).set({
    deviceId: input.deviceId,
    responsibleUserId: input.responsibleUserId || null,
    responsibleName: input.responsibleName,
    responsibleEmail: input.responsibleEmail || null,
    departmentId: input.departmentId || null,
    status: input.status,
    notes: input.notes || null
  }).where(eq(responsivas.id, input.id));

  if (input.status === 'active') {
    await db.update(devices).set({
      state: 'assigned',
      loanStatus: 'active',
      assignedUserId: input.responsibleUserId || null,
      assignedUserName: input.responsibleName,
      assignedUserEmail: input.responsibleEmail || null,
      departmentId: input.departmentId || null
    }).where(eq(devices.id, input.deviceId));
  } else if (current.status === 'active') {
    const [device] = await db.select().from(devices).where(eq(devices.id, current.deviceId));
    await db.insert(deviceDeliveryHistory).values({
      id: createId('del'),
      deviceId: current.deviceId,
      deliveredById: null,
      previousAssignedUserId: current.responsibleUserId,
      previousAssignedUserName: current.responsibleName,
      previousAssignedUserEmail: current.responsibleEmail,
      previousDepartmentId: current.departmentId,
      equipment: device?.equipment || current.deviceId,
      serialNumber: device?.serialNumber || current.deviceId,
      state: 'available',
      notes: input.notes || null
    }).catch(() => undefined);

    await db.update(devices).set({
      state: 'available',
      loanStatus: 'returned',
      assignedUserId: null,
      assignedUserName: null,
      assignedUserEmail: null
    }).where(eq(devices.id, current.deviceId));
  }

  return getResponsiva(input.id);
}

export async function listResponsivas() {
  const rows = await db.select({
    id: responsivas.id,
    status: responsivas.status,
    notes: responsivas.notes,
    createdAt: responsivas.createdAt,
    updatedAt: responsivas.updatedAt,
    responsibleUserId: responsivas.responsibleUserId,
    responsibleName: responsivas.responsibleName,
    responsibleEmail: responsivas.responsibleEmail,
    deviceId: devices.id,
    equipment: devices.equipment,
    serialNumber: devices.serialNumber,
    deviceState: devices.state,
    deviceDescription: devices.description,
    departmentId: departments.id,
    departmentName: departments.name
  }).from(responsivas)
    .leftJoin(devices, eq(responsivas.deviceId, devices.id))
    .leftJoin(departments, eq(responsivas.departmentId, departments.id))
    .orderBy(desc(responsivas.createdAt));

  const deviceIds = rows.map((row) => row.deviceId).filter(Boolean) as string[];
  const attached = deviceIds.length ? await db.select().from(files).where(inArray(files.deviceId, deviceIds)) : [];
  return rows.map((row) => ({
    ...row,
    files: attached.filter((file) => file.deviceId === row.deviceId)
  }));
}

export async function getResponsiva(id: string) {
  const [row] = await db.select({
    id: responsivas.id,
    status: responsivas.status,
    notes: responsivas.notes,
    createdAt: responsivas.createdAt,
    updatedAt: responsivas.updatedAt,
    responsibleUserId: responsivas.responsibleUserId,
    responsibleName: responsivas.responsibleName,
    responsibleEmail: responsivas.responsibleEmail,
    deviceId: devices.id,
    equipment: devices.equipment,
    serialNumber: devices.serialNumber,
    deviceState: devices.state,
    deviceDescription: devices.description,
    departmentId: departments.id,
    departmentName: departments.name
  }).from(responsivas)
    .leftJoin(devices, eq(responsivas.deviceId, devices.id))
    .leftJoin(departments, eq(responsivas.departmentId, departments.id))
    .where(eq(responsivas.id, id));
  if (!row) throw new Error('Responsiva no encontrada.');
  const attached = row.deviceId ? await db.select().from(files).where(eq(files.deviceId, row.deviceId)) : [];
  return { ...row, files: attached };
}

export async function registerFileAttachment(input: {
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
  type: FileType;
  userId?: string;
  deviceId?: string;
  uploadedById?: string;
}) {
  const id = createId('fil');
  await db.insert(files).values({
    id,
    originalName: input.originalName,
    storedName: input.storedName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    path: input.path,
    type: input.type,
    userId: input.userId || null,
    deviceId: input.deviceId || null,
    uploadedById: input.uploadedById || null
  });
  const [file] = await db.select().from(files).where(eq(files.id, id));
  return file;
}

export async function getFileAttachment(id: string) {
  const [file] = await db.select().from(files).where(eq(files.id, id));
  return file;
}

export async function bulkImportDevices(input: DeviceInput[]) {
  let created = 0;
  let updated = 0;
  const errors: Array<{ serialNumber: string; message: string }> = [];

  for (const item of input) {
    try {
      const state = item.state ?? (item.assignedUserName || item.assignedUserId ? 'assigned' : 'available');
      const payload = {
        equipment: item.equipment,
        serialNumber: item.serialNumber,
        state,
        description: item.description || null,
        departmentId: item.departmentId || null,
        assignedUserId: item.assignedUserId || null,
        assignedUserName: item.assignedUserName || null,
        assignedUserEmail: item.assignedUserEmail || null,
        loanStatus: item.loanStatus ?? (state === 'available' ? 'returned' : 'active'),
        team: item.team || null,
        externalResponsivaUrl: item.externalResponsivaUrl || null
      };
      const [existing] = await db.select({ id: devices.id }).from(devices).where(eq(devices.serialNumber, item.serialNumber));
      if (existing) {
        await db.update(devices).set(payload).where(eq(devices.id, existing.id));
        updated += 1;
      } else {
        await db.insert(devices).values({ id: createId('dev'), ...payload });
        created += 1;
      }
    } catch (error) {
      errors.push({ serialNumber: item.serialNumber, message: error instanceof Error ? error.message : 'Error desconocido' });
    }
  }

  return { created, updated, errors };
}

export async function listDepartments() {
  return db.select().from(departments).where(eq(departments.isActive, true)).orderBy(departments.name);
}

export async function createDepartment(input: { name: string; description?: string }) {
  const id = createId('dep');
  await db.insert(departments).values({ id, name: input.name, description: input.description || null });
  const [department] = await db.select().from(departments).where(eq(departments.id, id));
  return department;
}

export async function listEquipmentTypes() {
  return db.select().from(computerEquipment).where(eq(computerEquipment.isActive, true)).orderBy(computerEquipment.name);
}

export async function createEquipmentType(input: { name: string; description?: string }) {
  const id = createId('eqp');
  await db.insert(computerEquipment).values({ id, name: input.name, description: input.description || null });
  const [equipment] = await db.select().from(computerEquipment).where(eq(computerEquipment.id, id));
  return equipment;
}
