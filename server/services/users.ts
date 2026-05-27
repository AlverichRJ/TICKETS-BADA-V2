import { and, count, eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { createId } from '../utils/id.js';
import { env } from '../config.js';

export type GoogleUserProfile = {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
};

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return user ?? null;
}

export async function upsertGoogleUser(profile: GoogleUserProfile) {
  const normalizedEmail = profile.email.toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);
  const [{ value: totalAdmins }] = await db.select({ value: count() }).from(users).where(eq(users.role, 'admin'));
  const shouldBeAdmin = env.bootstrapAdminEmails.includes(normalizedEmail) || totalAdmins === 0;

  if (existing) {
    await db.update(users).set({
      googleId: profile.googleId,
      name: profile.name,
      avatarUrl: profile.avatarUrl ?? null,
      lastLoginAt: new Date(),
      loginCount: existing.loginCount + 1,
      role: shouldBeAdmin ? 'admin' : existing.role
    }).where(eq(users.id, existing.id));
    return { ...existing, googleId: profile.googleId, name: profile.name, avatarUrl: profile.avatarUrl ?? null, role: shouldBeAdmin ? 'admin' as const : existing.role };
  }

  const userId = createId('usr');
  await db.insert(users).values({
    id: userId,
    email: normalizedEmail,
    googleId: profile.googleId,
    name: profile.name,
    avatarUrl: profile.avatarUrl ?? null,
    role: shouldBeAdmin ? 'admin' : 'user',
    lastLoginAt: new Date(),
    loginCount: 1
  });

  return getUserById(userId);
}

export async function listUsers() {
  return db.select().from(users).orderBy(users.name);
}

export async function setUserRole(userId: string, role: 'admin' | 'user') {
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return getUserById(userId);
}

export async function setUserActive(userId: string, isActive: boolean) {
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
  return getUserById(userId);
}

export async function getAssignableUsers() {
  return db.select().from(users).where(and(eq(users.isActive, true), inArray(users.role, ['admin', 'user']))).orderBy(users.name);
}
