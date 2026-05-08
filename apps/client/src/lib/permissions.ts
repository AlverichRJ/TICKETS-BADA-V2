// Permisos locales del sistema: el panel de usuarios define quién opera como ADMIN.
import type { User } from '../api/client';

export function canManageInventory(user: User | null | undefined) {
  if (!user) return false;
  return user.role === 'ADMIN';
}
