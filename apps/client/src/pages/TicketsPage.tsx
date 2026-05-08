/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * Listado de tickets como tablero operativo con folios, estados y prioridades legibles.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Ticket } from '../api/client';

const statusLabels = { PENDING: 'Pendiente', IN_PROGRESS: 'En proceso', RESOLVED: 'Resuelto' };
const priorityLabels = { HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' };

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  useEffect(() => { api.get('/api/tickets').then(({ data }) => setTickets(data.data)); }, []);

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
          </article>
        ))}
        {tickets.length === 0 && <div className="emptyState">No hay tickets visibles para tu usuario.</div>}
      </div>
    </section>
  );
}
