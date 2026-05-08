/*
 * Diseño elegido: Brutalismo administrativo suizo.
 * Este helper concentra la identidad editable del sistema para mantener sidebar y panel ADMIN desacoplados.
 */
import { api } from '../api/client';

export type SystemSetting = {
  appName: string;
  logoUrl: string | null;
  updatedAt: string | null;
};

export const defaultSystemSetting: SystemSetting = {
  appName: 'Tickets Inventario',
  logoUrl: null,
  updatedAt: null
};

export function buildSystemLogoUrl(logoUrl: string | null) {
  if (!logoUrl) return null;
  if (/^https?:\/\//i.test(logoUrl)) return logoUrl;
  return `${api.defaults.baseURL}${logoUrl}`;
}

export async function fetchSystemSetting() {
  const response = await api.get<{ ok: boolean; data: SystemSetting }>('/api/system-settings');
  return response.data.data;
}
