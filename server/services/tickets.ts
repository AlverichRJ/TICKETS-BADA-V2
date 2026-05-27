import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import { db, pool } from '../db/index.js';
import { ticketAudits, ticketSequences, tickets } from '../db/schema.js';
import { createId } from '../utils/id.js';

export type TicketStatus = 'pending' | 'in_progress' | 'resolved';
export type TicketPriority = 'high' | 'medium' | 'low';

async function nextPublicId(): Promise<string> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('insert into ticket_sequences (id, value) values (1, 0) on duplicate key update id = id');
    const [rows] = await connection.query('select value from ticket_sequences where id = 1 for update');
    const current = Array.isArray(rows) && rows[0] && typeof (rows[0] as { value: number }).value === 'number' ? (rows[0] as { value: number }).value : 0;
    const next = current + 1;
    await connection.query('update ticket_sequences set value = ? where id = 1', [next]);
    await connection.commit();
    return `TK-${String(next).padStart(4, '0')}`;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listTickets(filters?: { status?: TicketStatus; search?: string }) {
  const conditions = [];
  if (filters?.status) conditions.push(eq(tickets.status, filters.status));
  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(like(tickets.publicId, term), like(tickets.failureDescription, term), like(tickets.reviewedEquipment, term))!);
  }
  return db.select().from(tickets).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(tickets.createdAt));
}

export async function createTicket(input: { creatorId: string; deviceId?: string; reviewedEquipment?: string; failureDescription: string; deviceSpecs?: string; priority: TicketPriority }) {
  const id = createId('tkt');
  const publicId = await nextPublicId();
  await db.insert(tickets).values({
    id,
    publicId,
    creatorId: input.creatorId,
    deviceId: input.deviceId || null,
    reviewedEquipment: input.reviewedEquipment || null,
    failureDescription: input.failureDescription,
    deviceSpecs: input.deviceSpecs || null,
    priority: input.priority
  });
  await db.insert(ticketAudits).values({ id: createId('aud'), ticketId: id, actorId: input.creatorId, action: 'created' });
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
  return ticket;
}

export async function updateTicketStatus(input: { id: string; actorId: string; status: TicketStatus; technicalNotes?: string }) {
  const [current] = await db.select().from(tickets).where(eq(tickets.id, input.id)).limit(1);
  if (!current) return null;
  await db.update(tickets).set({
    status: input.status,
    technicalNotes: input.technicalNotes ?? current.technicalNotes,
    resolvedAt: input.status === 'resolved' ? new Date() : null
  }).where(eq(tickets.id, input.id));
  await db.insert(ticketAudits).values({
    id: createId('aud'),
    ticketId: input.id,
    actorId: input.actorId,
    action: input.status === 'resolved' ? 'closed' : 'status_changed',
    fromStatus: current.status,
    toStatus: input.status,
    notes: input.technicalNotes ?? null
  });
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.id));
  return ticket;
}

export async function ticketStats() {
  const rows = await db.select({ status: tickets.status, total: sql<number>`count(*)` }).from(tickets).groupBy(tickets.status);
  return {
    pending: Number(rows.find((row) => row.status === 'pending')?.total ?? 0),
    inProgress: Number(rows.find((row) => row.status === 'in_progress')?.total ?? 0),
    resolved: Number(rows.find((row) => row.status === 'resolved')?.total ?? 0)
  };
}
