import { desc, eq, like, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { computerEquipment, departments, devices } from '../db/schema.js';
import { createId } from '../utils/id.js';

export async function listDevices(search?: string) {
  const term = search ? `%${search}%` : undefined;
  return db.select().from(devices)
    .where(term ? or(like(devices.equipment, term), like(devices.serialNumber, term), like(devices.description, term)) : undefined)
    .orderBy(desc(devices.createdAt));
}

export async function createDevice(input: { equipment: string; serialNumber: string; state?: 'available' | 'assigned' | 'maintenance' | 'retired'; description?: string; departmentId?: string }) {
  const id = createId('dev');
  await db.insert(devices).values({
    id,
    equipment: input.equipment,
    serialNumber: input.serialNumber,
    state: input.state ?? 'available',
    description: input.description || null,
    departmentId: input.departmentId || null
  });
  const [device] = await db.select().from(devices).where(eq(devices.id, id));
  return device;
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
