import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, Gauge, PlusCircle, TicketCheck } from 'lucide-react';
import { trpc } from '../_core/trpc';
import { formatDate, priorityLabel, statusLabel } from '../lib/format';

export function DashboardPage() {
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery();
  const stats = trpc.tickets.stats.useQuery();
  const tickets = trpc.tickets.list.useQuery({});
  const [leaderName, setLeaderName] = useState('');
  const [failureDescription, setFailureDescription] = useState('');
  const [reviewedEquipment, setReviewedEquipment] = useState('');
  const [deviceSpecs, setDeviceSpecs] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const create = trpc.tickets.create.useMutation({
    onSuccess: async () => {
      setLeaderName('');
      setFailureDescription('');
      setReviewedEquipment('');
      setDeviceSpecs('');
      await utils.tickets.invalidate();
    }
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate({
      leaderName: leaderName.trim(),
      reviewedEquipment: reviewedEquipment.trim(),
      failureDescription: failureDescription.trim(),
      deviceSpecs: deviceSpecs.trim(),
      priority
    });
  }

  return (
    <section className="page-stack dashboard-shell">
      <header className="page-header blueprint-heading">
        <div>
          <span className="eyebrow">CONTROL OPERATIVO · TICKETS</span>
          <h2>Dashboard</h2>
        </div>
        <p>{me.data?.role === 'admin' ? 'Panel general para supervisar todos los tickets reportados y su avance técnico.' : 'Panel personal para crear tickets y consultar el seguimiento de tus reportes.'}</p>
      </header>

      <div className="stats-grid dashboard-stats">
        <article className="stat-card stat-blueprint"><Clock3 /><span>Pendientes</span><strong>{stats.data?.pending ?? 0}</strong><small>Reportes abiertos</small></article>
        <article className="stat-card stat-blueprint"><Gauge /><span>En proceso</span><strong>{stats.data?.inProgress ?? 0}</strong><small>Atención técnica</small></article>
        <article className="stat-card stat-blueprint"><CheckCircle2 /><span>Resueltos</span><strong>{stats.data?.resolved ?? 0}</strong><small>Cierre documentado</small></article>
        <article className="stat-card stat-blueprint critical-card"><AlertTriangle /><span>Críticos</span><strong>{stats.data?.critical ?? 0}</strong><small>Prioridad alta</small></article>
      </div>

      <div className="dashboard-grid">
        <article className="panel blueprint-surface quick-ticket-panel">
          <div className="panel-title-row">
            <div>
              <span className="eyebrow">TK_CREATE</span>
              <h3>Crear ticket</h3>
            </div>
            <PlusCircle size={24} />
          </div>
          <form onSubmit={submit} className="form-stack blueprint-form">
            <label>ID de Ticket<input className="readonly-input" value="Automático al crear" readOnly aria-label="ID de Ticket automático" /></label>
            <label>Líder/Usuario<input required value={leaderName} onChange={(event) => setLeaderName(event.target.value)} placeholder={me.data?.name || 'Nombre del líder o usuario que reporta'} /></label>
            <label>Equipo a revisar<input required value={reviewedEquipment} onChange={(event) => setReviewedEquipment(event.target.value)} placeholder="PC, monitor, teclado, red, software..." /></label>
            <label>Descripción del fallo<textarea required minLength={8} value={failureDescription} onChange={(event) => setFailureDescription(event.target.value)} placeholder="Ejemplo: la PC se traba, no enciende, pierde red o aparece error." /></label>
            <label>Especificaciones PC<textarea value={deviceSpecs} onChange={(event) => setDeviceSpecs(event.target.value)} placeholder="Procesador, RAM, disco, usuario, correo, serie o notas de contexto." /></label>
            <label>Prioridad<select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="high">Crítico</option><option value="medium">Medio</option><option value="low">Bajo</option></select></label>
            <button className="primary-button blueprint-button" disabled={create.isLoading}>{create.isLoading ? 'Creando ticket...' : 'Crear ticket'}</button>
          </form>
        </article>

        <article className="panel blueprint-surface recent-ticket-panel">
          <div className="panel-title-row">
            <div>
              <span className="eyebrow">TK_BOARD</span>
              <h3>{me.data?.role === 'admin' ? 'Tickets recientes del sistema' : 'Mis tickets recientes'}</h3>
            </div>
            <Link className="secondary-link" to="/tickets"><TicketCheck size={16} /> Ver todos</Link>
          </div>
          <div className="ticket-board compact-board">
            <div className="ticket-board-head">
              <span>ID de Ticket</span><span>Líder/Usuario</span><span>Equipo a Revisar</span><span>Descripción del Fallo</span><span>Especificaciones PC</span><span>Prioridad</span><span>Estatus</span><span>Fecha de Reporte</span>
            </div>
            {tickets.data?.slice(0, 7).map((ticket: any) => <article key={ticket.id} className="ticket-board-row">
              <strong>{ticket.publicId}</strong>
              <span>{ticket.leaderName || ticket.creatorName || 'Usuario'}</span>
              <span>{ticket.reviewedEquipment || 'No especificado'}</span>
              <p>{ticket.failureDescription}</p>
              <span className="spec-cell">{ticket.deviceSpecs || '—'}</span>
              <em className={`priority-pill priority-${ticket.priority}`}>{priorityLabel(ticket.priority)}</em>
              <em className={`status-pill status-${ticket.status}`}>{statusLabel(ticket.status)}</em>
              <small>{formatDate(ticket.reportedAt || ticket.createdAt)}</small>
            </article>)}
            {!tickets.data?.length && <p className="empty-state">Aún no hay tickets registrados para mostrar.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
