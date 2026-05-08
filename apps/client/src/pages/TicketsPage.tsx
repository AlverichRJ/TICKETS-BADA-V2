/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * Listado de tickets con acordeón administrativo: el administrador despliega detalles; el usuario operativo solo ve la descripción del fallo.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Ticket } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { canManageAdminModules } from '../lib/permissions';

const statusLabels = { PENDING: 'Pendiente', IN_PROGRESS: 'En proceso', RESOLVED: 'Resuelto' };
const priorityLabels = { HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' };

function formatDateTime(value?: string | null) {
  if (!value) return 'Pendiente';
  return new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

function getTicketLeader(ticket: Ticket) {
  return ticket.leaderName || ticket.leader?.name || ticket.creator?.name || 'Sin líder';
}

function getTicketEquipment(ticket: Ticket) {
  return ticket.reviewedEquipment || ticket.device?.assignedComputerEquipment?.name || ticket.device?.equipment || 'Sin equipo capturado';
}

export function TicketsPage() {
  const { user } = useAuth();
  const canResolveTickets = canManageAdminModules(user);
  const canExpandTickets = canManageAdminModules(user);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [expandedTicketIds, setExpandedTicketIds] = useState<Set<string>>(() => new Set());

  useEffect(() => { api.get('/api/tickets').then(({ data }) => setTickets(data.data)); }, []);

  function toggleTicket(ticketId: string) {
    if (!canExpandTickets) return;
    setExpandedTicketIds(current => {
      const next = new Set(current);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  }

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
      <div className="ticketBoard ticketBoard--matrix">
        {tickets.map(ticket => {
          const isExpanded = canExpandTickets && expandedTicketIds.has(ticket.id);
          return (
            <article className={`ticketCard ticketRecord ${canExpandTickets ? 'ticketRecord--admin' : 'ticketRecord--locked'} ${isExpanded ? 'isExpanded' : 'isCollapsed'}`} key={ticket.id}>
              <div className="ticketCollapseHeader">
                <div className="ticketFailureOnly">
                  <span>Descripción del fallo</span>
                  <p>{ticket.failureDescription}</p>
                </div>
                {canExpandTickets && (
                  <button className="ticketToggleAction" type="button" onClick={() => toggleTicket(ticket.id)} aria-expanded={isExpanded} aria-controls={`ticket-details-${ticket.id}`}>
                    {isExpanded ? 'Ocultar ticket' : 'Ver ticket'}
                  </button>
                )}
              </div>
              {isExpanded && (
                <div className="ticketDetailsPanel" id={`ticket-details-${ticket.id}`}>
                  <div className="cardTop"><span className="folio">{ticket.publicId}</span><span className={`status ${ticket.status}`}>{statusLabels[ticket.status]}</span></div>
                  <div className="ticketFieldGrid">
                    <div><span>Líder</span><strong>{getTicketLeader(ticket)}</strong></div>
                    <div><span>Equipo a revisar</span><strong>{getTicketEquipment(ticket)}</strong></div>
                    <div><span>Fecha de reporte</span><strong>{formatDateTime(ticket.reportedAt)}</strong></div>
                    <div><span>Prioridad</span><strong>{priorityLabels[ticket.priority]}</strong></div>
                    <div><span>Fecha de resolución</span><strong>{formatDateTime(ticket.resolvedAt)}</strong></div>
                  </div>
                  <div className="ticketNarrative">
                    <span>Especificaciones PC</span>
                    <p>{ticket.deviceSpecs || 'Sin especificaciones capturadas.'}</p>
                  </div>
                  <div className="ticketNarrative ticketNarrative--notes">
                    <span>Notas técnicas</span>
                    <p>{ticket.technicalNotes || 'Sin notas técnicas capturadas.'}</p>
                  </div>
                  <div className="metaLine"><span>Reportó {ticket.creator?.name}</span><span>{ticket.creator?.email}</span></div>
                  {canResolveTickets && ticket.status !== 'RESOLVED' && (
                    <div className="ticketActions">
                      <button className="resolveAction" type="button" onClick={() => markAsResolved(ticket)} disabled={resolvingTicketId === ticket.id}>
                        {resolvingTicketId === ticket.id ? 'Actualizando...' : 'Marcar como resuelto'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {tickets.length === 0 && <div className="emptyState">No hay tickets visibles para tu usuario.</div>}
      </div>
    </section>
  );
}
