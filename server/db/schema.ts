import { relations, sql } from 'drizzle-orm';
import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';

export const roleEnum = mysqlEnum('role', ['admin', 'user']);
export const ticketPriorityEnum = mysqlEnum('ticket_priority', ['high', 'medium', 'low']);
export const ticketStatusEnum = mysqlEnum('ticket_status', ['pending', 'in_progress', 'resolved']);
export const deviceStateEnum = mysqlEnum('device_state', ['available', 'assigned', 'maintenance', 'retired']);
export const loanStatusEnum = mysqlEnum('loan_status', ['active', 'returned']);
export const fileTypeEnum = mysqlEnum('file_type', ['responsiva', 'ine', 'other']);
export const responsivaStatusEnum = mysqlEnum('responsiva_status', ['active', 'returned', 'cancelled']);
export const auditActionEnum = mysqlEnum('audit_action', ['created', 'updated', 'status_changed', 'assigned', 'closed', 'file_attached']);

export const departments = mysqlTable('departments', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
}, (table) => ({
  nameIdx: uniqueIndex('departments_name_idx').on(table.name)
}));

export const users = mysqlTable('users', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 180 }).notNull(),
  email: varchar('email', { length: 220 }).notNull(),
  googleId: varchar('google_id', { length: 128 }),
  role: roleEnum.notNull().default('user'),
  avatarUrl: varchar('avatar_url', { length: 600 }),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  loginCount: int('login_count').notNull().default(0),
  departmentId: varchar('department_id', { length: 32 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  googleIdx: uniqueIndex('users_google_id_idx').on(table.googleId),
  departmentIdx: index('users_department_id_idx').on(table.departmentId)
}));

export const computerEquipment = mysqlTable('computer_equipment', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 180 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
}, (table) => ({
  nameIdx: uniqueIndex('computer_equipment_name_idx').on(table.name)
}));

export const devices = mysqlTable('devices', {
  id: varchar('id', { length: 32 }).primaryKey(),
  assignedUserId: varchar('assigned_user_id', { length: 32 }),
  assignedUserName: varchar('assigned_user_name', { length: 180 }),
  assignedUserEmail: varchar('assigned_user_email', { length: 220 }),
  assignedComputerEquipmentId: varchar('assigned_computer_equipment_id', { length: 32 }),
  departmentId: varchar('department_id', { length: 32 }),
  equipment: varchar('equipment', { length: 180 }).notNull(),
  serialNumber: varchar('serial_number', { length: 180 }).notNull(),
  state: deviceStateEnum.notNull().default('available'),
  description: text('description'),
  loanStatus: loanStatusEnum.notNull().default('active'),
  team: varchar('team', { length: 160 }),
  externalResponsivaUrl: varchar('external_responsiva_url', { length: 700 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
}, (table) => ({
  assignedUserIdx: index('devices_assigned_user_id_idx').on(table.assignedUserId),
  equipmentIdx: index('devices_equipment_id_idx').on(table.assignedComputerEquipmentId),
  departmentIdx: index('devices_department_id_idx').on(table.departmentId),
  serialIdx: uniqueIndex('devices_serial_number_idx').on(table.serialNumber)
}));

export const tickets = mysqlTable('tickets', {
  id: varchar('id', { length: 32 }).primaryKey(),
  publicId: varchar('public_id', { length: 24 }).notNull(),
  creatorId: varchar('creator_id', { length: 32 }).notNull(),
  leaderId: varchar('leader_id', { length: 32 }),
  leaderName: varchar('leader_name', { length: 180 }),
  deviceId: varchar('device_id', { length: 32 }),
  reviewedEquipment: varchar('reviewed_equipment', { length: 220 }),
  failureDescription: text('failure_description').notNull(),
  deviceSpecs: text('device_specs'),
  reportedAt: timestamp('reported_at').notNull().defaultNow(),
  priority: ticketPriorityEnum.notNull().default('medium'),
  status: ticketStatusEnum.notNull().default('pending'),
  resolvedAt: timestamp('resolved_at'),
  technicalNotes: text('technical_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
}, (table) => ({
  publicIdx: uniqueIndex('tickets_public_id_idx').on(table.publicId),
  creatorIdx: index('tickets_creator_id_idx').on(table.creatorId),
  leaderIdx: index('tickets_leader_id_idx').on(table.leaderId),
  deviceIdx: index('tickets_device_id_idx').on(table.deviceId),
  statusIdx: index('tickets_status_idx').on(table.status),
  priorityIdx: index('tickets_priority_idx').on(table.priority)
}));

export const ticketAudits = mysqlTable('ticket_audits', {
  id: varchar('id', { length: 32 }).primaryKey(),
  ticketId: varchar('ticket_id', { length: 32 }).notNull(),
  actorId: varchar('actor_id', { length: 32 }),
  action: auditActionEnum.notNull(),
  status: ticketStatusEnum.notNull().default('pending'),
  notes: text('notes'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  ticketIdx: index('ticket_audits_ticket_id_idx').on(table.ticketId),
  actorIdx: index('ticket_audits_actor_id_idx').on(table.actorId)
}));

export const files = mysqlTable('files', {
  id: varchar('id', { length: 32 }).primaryKey(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  storedName: varchar('stored_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 120 }).notNull(),
  sizeBytes: int('size_bytes').notNull(),
  path: varchar('path', { length: 700 }).notNull(),
  type: fileTypeEnum.notNull().default('other'),
  userId: varchar('user_id', { length: 32 }),
  deviceId: varchar('device_id', { length: 32 }),
  uploadedById: varchar('uploaded_by_id', { length: 32 }),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow()
}, (table) => ({
  storedIdx: uniqueIndex('files_stored_name_idx').on(table.storedName),
  userIdx: index('files_user_id_idx').on(table.userId),
  deviceIdx: index('files_device_id_idx').on(table.deviceId)
}));

export const responsivas = mysqlTable('responsivas', {
  id: varchar('id', { length: 32 }).primaryKey(),
  deviceId: varchar('device_id', { length: 32 }).notNull(),
  responsibleUserId: varchar('responsible_user_id', { length: 32 }),
  responsibleName: varchar('responsible_name', { length: 180 }).notNull(),
  responsibleEmail: varchar('responsible_email', { length: 220 }),
  departmentId: varchar('department_id', { length: 32 }),
  status: responsivaStatusEnum.notNull().default('active'),
  notes: text('notes'),
  createdById: varchar('created_by_id', { length: 32 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
}, (table) => ({
  deviceIdx: index('responsivas_device_id_idx').on(table.deviceId),
  responsibleIdx: index('responsivas_responsible_user_id_idx').on(table.responsibleUserId),
  statusIdx: index('responsivas_status_idx').on(table.status)
}));

export const ticketSequences = mysqlTable('ticket_sequences', {
  id: int('id').primaryKey().default(1),
  value: int('value').notNull().default(0)
});

export const systemSettings = mysqlTable('system_settings', {
  id: int('id').primaryKey().default(1),
  appName: varchar('app_name', { length: 180 }).notNull().default('Tickets BADABUN'),
  logoPath: varchar('logo_path', { length: 700 }),
  logoOriginalName: varchar('logo_original_name', { length: 255 }),
  logoMimeType: varchar('logo_mime_type', { length: 120 }),
  updatedById: varchar('updated_by_id', { length: 32 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

export const deviceDeliveryHistory = mysqlTable('device_delivery_history', {
  id: varchar('id', { length: 32 }).primaryKey(),
  deviceId: varchar('device_id', { length: 32 }).notNull(),
  deliveredById: varchar('delivered_by_id', { length: 32 }),
  previousAssignedUserId: varchar('previous_assigned_user_id', { length: 32 }),
  previousAssignedUserName: varchar('previous_assigned_user_name', { length: 180 }).notNull(),
  previousAssignedUserEmail: varchar('previous_assigned_user_email', { length: 220 }),
  previousDepartmentId: varchar('previous_department_id', { length: 32 }),
  previousDepartmentName: varchar('previous_department_name', { length: 180 }),
  previousComputerEquipmentId: varchar('previous_computer_equipment_id', { length: 32 }),
  previousComputerEquipmentName: varchar('previous_computer_equipment_name', { length: 180 }),
  equipment: varchar('equipment', { length: 180 }).notNull(),
  serialNumber: varchar('serial_number', { length: 180 }).notNull(),
  state: deviceStateEnum.notNull(),
  description: text('description'),
  notes: text('notes'),
  deliveredAt: timestamp('delivered_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  deviceIdx: index('delivery_device_id_idx').on(table.deviceId),
  deliveredByIdx: index('delivery_delivered_by_id_idx').on(table.deliveredById),
  deliveredAtIdx: index('delivery_delivered_at_idx').on(table.deliveredAt)
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, { fields: [users.departmentId], references: [departments.id] }),
  createdTickets: many(tickets, { relationName: 'ticket_creator' })
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  creator: one(users, { fields: [tickets.creatorId], references: [users.id], relationName: 'ticket_creator' }),
  device: one(devices, { fields: [tickets.deviceId], references: [devices.id] }),
  audits: many(ticketAudits)
}));

export const seedSql = sql`insert into ticket_sequences (id, value) values (1, 0) on duplicate key update id = id`;
