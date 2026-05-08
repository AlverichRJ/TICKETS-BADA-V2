/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * Listado de tickets como tablero operativo con folios, estados y prioridades legibles.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Ticket } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { canManageAdminModules } from '../lib/permissions';

const statusLabels = { PENDING: 'Pendiente', IN_PROGRESS: 'En proceso', RESOLVED: 'Resuelto' };
const priorityLabels = { HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' };

export function TicketsPage() {
  const { user } = useAuth();
  const canResolveTickets = canManageAdminModules(user);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);

  useEffect(() => { api.get('/api/tickets').then(({ data }) => setTickets(data.data)); }, []);

  async function markAsResolved(ticket: Ticket) {
    if (!canResolveTickets || ticket.status === 'RESOLVED') return;
    setResolvingTicketId(ticket.id);
    try {
      const { data } = await api.patch(`/api/tickets/${ticket.id}`, { status: 'RESOLVED' });
      setTickets(current => current.map(item => item.id === ticket.id ? data.data : item));
    } finally {
      setResolvingTicketId(null);
    }
  }

  return (
    <section className="pageStack">
      <header className="pageHeader"><div><p className="eyebrow">Módulo 01</p><h1>Tickets</h1></div><Link className="primaryAction compact" to="/tickets/new">Crear ticket</Link></header>
      <div className="ticketBoard">
        {tickets.map(ticket => (
          <article className="ticketCard" key={ticket.id}>
            <div className="cardTop"><span className="folio">{ticket.publicId}</span><span className={`status ${ticket.status}`}>{statusLabels[ticket.status]}</span></div>
            <h3>{ticket.failureDescription}</h3>
            <p>{ticket.deviceSpecs || 'Sin especificaciones capturadas.'}</p>
            <div className="metaLine"><span>Prioridad {priorityLabels[ticket.priority]}</span><span>{ticket.creator?.name}</span><span>{new Date(ticket.reportedAt).toLocaleDateString()}</span></div>
            {canResolveTickets && ticket.status !== 'RESOLVED' && (
              <div className="ticketActions">
                <button className="resolveAction" type="button" onClick={() => markAsResolved(ticket)} disabled={resolvingTicketId === ticket.id}>
                  {resolvingTicketId === ticket.id ? 'Actualizando...' : 'Marcar como resuelto'}
                </button>
              </div>
            )}
          </article>
        ))}
        {tickets.length === 0 && <div className="emptyState">No hay tickets visibles para tu usuario.</div>}
      </div>
    </section>
  );
}
