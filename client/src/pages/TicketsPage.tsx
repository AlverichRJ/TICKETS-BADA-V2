import { FormEvent, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { trpc } from '../_core/trpc';
import { formatDate, priorityLabel, statusLabel } from '../lib/format';

type TicketPriority = 'high' | 'medium' | 'low';
type TicketStatus = 'pending' | 'in_progress' | 'resolved';

type TicketFilters = {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
};

function nextStatus(status: TicketStatus): TicketStatus {
  if (status === 'pending') return 'in_progress';
  if (status === 'in_progress') return 'resolved';
  return 'resolved';
}

export function TicketsPage() {
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery();
  const [leaderName, setLeaderName] = useState('');
  const [failureDescription, setFailureDescription] = useState('');
  const [reviewedEquipment, setReviewedEquipment] = useState('');
  const [deviceSpecs, setDeviceSpecs] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | TicketStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TicketPriority>('all');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [technicalNotes, setTechnicalNotes] = useState<Record<string, string>>({});
  const [localStatuses, setLocalStatuses] = useState<Record<string, TicketStatus>>({});
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const filters: TicketFilters = {
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {})
  };

  const tickets = trpc.tickets.list.useQuery(filters);
  const create = trpc.tickets.create.useMutation({
    onSuccess: async () => {
      setLeaderName('');
      setFailureDescription('');
      setReviewedEquipment('');
      setDeviceSpecs('');
      setPriority('medium');
      await utils.tickets.invalidate();
    }
  });
  const updateStatus = trpc.tickets.updateStatus.useMutation();

  useEffect(() => {
    if (!statusFeedback) return;
    const timeout = window.setTimeout(() => setStatusFeedback(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [statusFeedback]);

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

  function changeTicketStatus(ticket: any, targetStatus: TicketStatus) {
    const previousStatus = (localStatuses[ticket.id] || ticket.status) as TicketStatus;
    setStatusFeedback(null);
    setLocalStatuses((current) => ({ ...current, [ticket.id]: targetStatus }));
    updateStatus.mutate({
      id: ticket.id,
      status: targetStatus,
      technicalNotes: technicalNotes[ticket.id] || ticket.technicalNotes || undefined
    }, {
      onSuccess: async () => {
        setStatusFeedback(`Estatus de ${ticket.publicId} actualizado a ${statusLabel(targetStatus)}.`);
        await utils.tickets.invalidate();
      },
      onError: (error: any) => {
        setLocalStatuses((current) => ({ ...current, [ticket.id]: previousStatus }));
        setStatusFeedback(error?.message || 'No se pudo actualizar el estatus. Revisa permisos o conexión e intenta nuevamente.');
      }
    });
  }

  function advanceTicket(ticket: any) {
    changeTicketStatus(ticket, nextStatus(ticket.status));
  }

  return (
    <section className="page-stack tickets-shell">
      <header className="page-header blueprint-heading">
        <div>
          <span className="eyebrow">TK_CONTROL · BLUEPRINT</span>
          <h2>Tickets</h2>
        </div>
        <p>{me.data?.role === 'admin' ? 'Vista administrativa para revisar, filtrar, documentar y cerrar reportes técnicos.' : 'Crea tickets de soporte y consulta el avance de tus reportes registrados.'}</p>
      </header>

      <div className="ticket-workspace">
        <aside className="panel blueprint-surface form-panel ticket-create-panel">
          <div className="panel-title-row">
            <div>
              <span className="eyebrow">NUEVO REPORTE</span>
              <h3>Crear ticket</h3>
            </div>
          </div>
          <form onSubmit={submit} className="form-stack blueprint-form">
            <label>ID de Ticket<input className="readonly-input" value="Automático al crear" readOnly aria-label="ID de Ticket automático" /></label>
            <label>Líder/Usuario<input required value={leaderName} onChange={(event) => setLeaderName(event.target.value)} placeholder={me.data?.name || 'Nombre del líder o usuario que reporta'} /></label>
            <label>Equipo a revisar<input required value={reviewedEquipment} onChange={(event) => setReviewedEquipment(event.target.value)} placeholder="PC, monitor, teclado, red, software..." /></label>
            <label>Descripción del fallo<textarea required minLength={8} value={failureDescription} onChange={(event) => setFailureDescription(event.target.value)} placeholder="Ejemplo: la PC se traba, no enciende, pierde red o aparece error." /></label>
            <label>Especificaciones PC<textarea value={deviceSpecs} onChange={(event) => setDeviceSpecs(event.target.value)} placeholder="Procesador, RAM, disco, usuario, correo, serie o notas de contexto." /></label>
            <label>Prioridad<select value={priority} onChange={(event) => setPriority(event.target.value as TicketPriority)}><option value="high">Crítico</option><option value="medium">Medio</option><option value="low">Bajo</option></select></label>
            <button className="primary-button blueprint-button" disabled={create.isLoading}>{create.isLoading ? 'Creando...' : 'Crear ticket'}</button>
          </form>
        </aside>

        <article className="panel blueprint-surface tickets-board-panel">
          <div className="panel-title-row ticket-toolbar">
            <div>
              <span className="eyebrow">REGISTRO GENERAL</span>
              <h3>{me.data?.role === 'admin' ? 'Tickets creados por usuarios' : 'Mis tickets creados'}</h3>
            </div>
            <div className="filter-bar">
              <label className="search-field"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ticket, equipo o usuario" /></label>
              <label><SlidersHorizontal size={15} /><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}><option value="all">Todas las prioridades</option><option value="high">Crítico</option><option value="medium">Medio</option><option value="low">Bajo</option></select></label>
              <label><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">Todos los estatus</option><option value="pending">Pendiente</option><option value="in_progress">En proceso</option><option value="resolved">Resuelto</option></select></label>
            </div>
          </div>
          {statusFeedback && <p className="status-feedback" role="status">{statusFeedback}</p>}

          <div className="ticket-board full-board">
            <div className="ticket-board-head">
              <span>ID de Ticket</span><span>Líder/Usuario</span><span>Equipo a Revisar</span><span>Descripción del Fallo</span><span>Especificaciones PC</span><span>Fecha de Reporte</span><span>Prioridad</span><span>Estatus</span><span>Fecha de Resolución</span>
            </div>
            {tickets.data?.map((ticket: any) => {
              const isExpanded = expandedTicket === ticket.id;
              const canExpand = me.data?.role === 'admin';
              const currentStatus = (localStatuses[ticket.id] || ticket.status) as TicketStatus;
              return <article key={ticket.id} className={`ticket-board-row detailed-ticket-row ${isExpanded ? 'is-expanded' : ''}`}>
                <strong className="ticket-id-cell">{canExpand && <button className="expand-button" onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}>{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>}{ticket.publicId}</strong>
                <span>{ticket.leaderName || ticket.creatorName || 'Usuario'}</span>
                <span>{ticket.reviewedEquipment || 'No especificado'}</span>
                <p>{ticket.failureDescription}</p>
                <span className="spec-cell">{ticket.deviceSpecs || '—'}</span>
                <small>{formatDate(ticket.reportedAt || ticket.createdAt)}</small>
                <span className="table-badge-cell"><em className={`priority-pill priority-${ticket.priority}`}>{priorityLabel(ticket.priority)}</em></span>
                {canExpand ? <label className="status-admin-cell" aria-label={`Cambiar estatus de ${ticket.publicId}`}>
                  <select className={`status-admin-control status-select status-${currentStatus}`} value={currentStatus} disabled={updateStatus.isLoading || updateStatus.isPending} onChange={(event) => changeTicketStatus(ticket, event.target.value as TicketStatus)}>
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En proceso</option>
                    <option value="resolved">Resuelto</option>
                  </select>
                </label> : <span className="table-badge-cell"><em className={`status-pill status-${ticket.status}`}>{statusLabel(ticket.status)}</em></span>}
                <small>{currentStatus === 'resolved' && !ticket.resolvedAt ? 'Ahora' : formatDate(ticket.resolvedAt)}</small>
                {canExpand && isExpanded && <div className="admin-ticket-detail">
                  <div><strong>Correo del usuario</strong><span>{ticket.creatorEmail || 'No disponible'}</span></div>
                  <label>Notas técnicas<textarea value={technicalNotes[ticket.id] ?? ticket.technicalNotes ?? ''} onChange={(event) => setTechnicalNotes((current) => ({ ...current, [ticket.id]: event.target.value }))} placeholder="Diagnóstico, acciones realizadas, piezas o seguimiento." /></label>
                  <div className="row-actions">
                    {currentStatus !== 'resolved' && <button type="button" disabled={updateStatus.isLoading || updateStatus.isPending} onClick={() => advanceTicket({ ...ticket, status: currentStatus })}>{currentStatus === 'pending' ? 'Pasar a En proceso' : 'Marcar Resuelto'}</button>}
                    {currentStatus === 'resolved' && <button type="button" disabled={updateStatus.isLoading || updateStatus.isPending} onClick={() => changeTicketStatus(ticket, 'in_progress')}>Reabrir en proceso</button>}
                  </div>
                </div>}
              </article>;
            })}
            {!tickets.data?.length && <p className="empty-state">No hay tickets con los filtros seleccionados.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
