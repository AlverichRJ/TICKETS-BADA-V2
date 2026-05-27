import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { trpc } from '../_core/trpc';

export function DashboardPage() {
  const stats = trpc.tickets.stats.useQuery();
  const tickets = trpc.tickets.list.useQuery({});
  const devices = trpc.inventory.devices.useQuery({});

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">CONTROL OPERATIVO</span>
          <h2>Dashboard</h2>
        </div>
        <p>Resumen interno de tickets, prioridades y activos técnicos.</p>
      </header>
      <div className="stats-grid">
        <article className="stat-card"><Clock3 /><span>Pendientes</span><strong>{stats.data?.pending ?? 0}</strong></article>
        <article className="stat-card"><AlertTriangle /><span>En proceso</span><strong>{stats.data?.inProgress ?? 0}</strong></article>
        <article className="stat-card"><CheckCircle2 /><span>Resueltos</span><strong>{stats.data?.resolved ?? 0}</strong></article>
        <article className="stat-card"><span>ASSETS</span><strong>{devices.data?.length ?? 0}</strong><small>Inventario registrado</small></article>
      </div>
      <div className="panel">
        <h3>Últimos tickets</h3>
        <div className="table-list">
          {tickets.data?.slice(0, 8).map((ticket: any) => <div key={ticket.id} className="table-row"><strong>{ticket.publicId}</strong><span>{ticket.reviewedEquipment || 'Equipo no especificado'}</span><em>{ticket.status}</em></div>)}
          {!tickets.data?.length && <p className="empty-state">Aún no hay tickets registrados.</p>}
        </div>
      </div>
    </section>
  );
}
