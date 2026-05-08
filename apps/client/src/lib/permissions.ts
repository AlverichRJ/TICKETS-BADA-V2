// Permisos locales del sistema: solo ADMIN y correos administrativos explícitos pueden modificar inventario.
import type { User } from '../api/client';

const LOCAL_ADMIN_EMAILS = ['suarez@badabun.com'];

export function canManageInventory(user: User | null | undefined) {
  if (!user) return false;
  return user.role === 'ADMIN' || LOCAL_ADMIN_EMAILS.includes(user.email.toLowerCase());
}
