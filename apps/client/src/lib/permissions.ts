// Permisos locales del sistema: el panel de usuarios define quién opera como ADMIN; el correo principal conserva acceso bootstrap.
import type { User } from '../api/client';

const BOOTSTRAP_ADMIN_EMAILS = ['suarez@badabun.com'];

export function canManageAdminModules(user: User | null | undefined) {
  if (!user) return false;
  return user.role === 'ADMIN' || BOOTSTRAP_ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export function canManageInventory(user: User | null | undefined) {
  return canManageAdminModules(user);
}
