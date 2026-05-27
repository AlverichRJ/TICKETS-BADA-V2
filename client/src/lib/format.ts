export function statusLabel(status: string): string {
  return {
    pending: 'Pendiente',
    in_progress: 'En proceso',
    resolved: 'Resuelto',
    available: 'Disponible',
    assigned: 'Asignado',
    maintenance: 'Mantenimiento',
    retired: 'Retirado'
  }[status] ?? status;
}

export function priorityLabel(priority: string): string {
  return { high: 'Crítico', medium: 'Medio', low: 'Bajo' }[priority] ?? priority;
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
