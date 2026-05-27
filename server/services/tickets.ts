import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import { db, pool } from '../db/index.js';
import { ticketAudits, ticketSequences, tickets, users } from '../db/schema.js';
import { createId } from '../utils/id.js';

export type TicketStatus = 'pending' | 'in_progress' | 'resolved';
export type TicketPriority = 'high' | 'medium' | 'low';
export type TicketViewer = { id: string; role: 'admin' | 'user' };

export type TicketFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
};

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

function ticketVisibilityConditions(filters: TicketFilters | undefined, viewer: TicketViewer) {
  const conditions = [];

  if (viewer.role !== 'admin') {
    conditions.push(eq(tickets.creatorId, viewer.id));
  }

  if (filters?.status) {
    conditions.push(eq(tickets.status, filters.status));
  }

  if (filters?.priority) {
    conditions.push(eq(tickets.priority, filters.priority));
  }

  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(
      like(tickets.publicId, term),
      like(tickets.failureDescription, term),
      like(tickets.reviewedEquipment, term),
      like(tickets.deviceSpecs, term),
      like(tickets.leaderName, term),
      like(users.name, term),
      like(users.email, term)
    )!);
  }

  return conditions.length ? and(...conditions) : undefined;
}

export async function listTickets(filters: TicketFilters | undefined, viewer: TicketViewer) {
  return db.select({
    id: tickets.id,
    publicId: tickets.publicId,
    creatorId: tickets.creatorId,
    creatorName: users.name,
    creatorEmail: users.email,
    leaderId: tickets.leaderId,
    leaderName: tickets.leaderName,
    deviceId: tickets.deviceId,
    reviewedEquipment: tickets.reviewedEquipment,
    failureDescription: tickets.failureDescription,
    deviceSpecs: tickets.deviceSpecs,
    reportedAt: tickets.reportedAt,
    priority: tickets.priority,
    status: tickets.status,
    resolvedAt: tickets.resolvedAt,
    technicalNotes: tickets.technicalNotes,
    createdAt: tickets.createdAt,
    updatedAt: tickets.updatedAt
  })
    .from(tickets)
    .leftJoin(users, eq(tickets.creatorId, users.id))
    .where(ticketVisibilityConditions(filters, viewer))
    .orderBy(desc(tickets.createdAt));
}

export async function createTicket(input: { creatorId: string; deviceId?: string; leaderName?: string; reviewedEquipment?: string; failureDescription: string; deviceSpecs?: string; priority: TicketPriority }) {
  const id = createId('tkt');
  const publicId = await nextPublicId();
  await db.insert(tickets).values({
    id,
    publicId,
    creatorId: input.creatorId,
    leaderName: input.leaderName || null,
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
    status: input.status,
    notes: input.technicalNotes ?? null
  });
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.id));
  return ticket;
}

export async function ticketStats(viewer: TicketViewer) {
  const where = viewer.role !== 'admin' ? eq(tickets.creatorId, viewer.id) : undefined;
  const rows = await db.select({ status: tickets.status, total: sql<number>`count(*)` }).from(tickets).where(where).groupBy(tickets.status);
  const priorityRows = await db.select({ priority: tickets.priority, total: sql<number>`count(*)` }).from(tickets).where(where).groupBy(tickets.priority);

  const pending = Number(rows.find((row) => row.status === 'pending')?.total ?? 0);
  const inProgress = Number(rows.find((row) => row.status === 'in_progress')?.total ?? 0);
  const resolved = Number(rows.find((row) => row.status === 'resolved')?.total ?? 0);
  const critical = Number(priorityRows.find((row) => row.priority === 'high')?.total ?? 0);
  const medium = Number(priorityRows.find((row) => row.priority === 'medium')?.total ?? 0);
  const low = Number(priorityRows.find((row) => row.priority === 'low')?.total ?? 0);

  return {
    pending,
    inProgress,
    resolved,
    total: pending + inProgress + resolved,
    critical,
    medium,
    low
  };
}
