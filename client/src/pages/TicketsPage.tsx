import { FormEvent, useState } from 'react';
import { trpc } from '../_core/trpc';
import { formatDate, priorityLabel, statusLabel } from '../lib/format';

export function TicketsPage() {
  const utils = trpc.useUtils();
  const [failureDescription, setFailureDescription] = useState('');
  const [reviewedEquipment, setReviewedEquipment] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const tickets = trpc.tickets.list.useQuery({});
  const create = trpc.tickets.create.useMutation({ onSuccess: async () => { setFailureDescription(''); setReviewedEquipment(''); await utils.tickets.invalidate(); } });
  const updateStatus = trpc.tickets.updateStatus.useMutation({ onSuccess: async () => utils.tickets.invalidate() });
  const me = trpc.auth.me.useQuery();

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate({ failureDescription, reviewedEquipment, priority });
  }

  return (
    <section className="page-grid">
      <div className="page-stack">
        <header className="page-header"><div><span className="eyebrow">TK_CONTROL</span><h2>Tickets</h2></div><p>Alta, seguimiento y cierre técnico.</p></header>
        <div className="panel">
          <h3>Registro de tickets</h3>
          <div className="table-list">
            {tickets.data?.map((ticket: any) => <article key={ticket.id} className="ticket-row">
              <div><strong>{ticket.publicId}</strong><span>{ticket.reviewedEquipment || 'Equipo no especificado'}</span><small>{formatDate(ticket.createdAt)}</small></div>
              <p>{ticket.failureDescription}</p>
              <div className="row-actions"><em>{priorityLabel(ticket.priority)}</em><em>{statusLabel(ticket.status)}</em>{me.data?.role === 'admin' && ticket.status !== 'resolved' && <button onClick={() => updateStatus.mutate({ id: ticket.id, status: ticket.status === 'pending' ? 'in_progress' : 'resolved' })}>Avanzar estado</button>}</div>
            </article>)}
            {!tickets.data?.length && <p className="empty-state">No hay tickets todavía.</p>}
          </div>
        </div>
      </div>
      <aside className="panel form-panel">
        <h3>Nuevo ticket</h3>
        <form onSubmit={submit} className="form-stack">
          <label>Equipo revisado<input value={reviewedEquipment} onChange={(e) => setReviewedEquipment(e.target.value)} placeholder="Laptop, switch, monitor..." /></label>
          <label>Prioridad<select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></label>
          <label>Descripción de la falla<textarea required minLength={8} value={failureDescription} onChange={(e) => setFailureDescription(e.target.value)} placeholder="Describe el problema técnico..." /></label>
          <button className="primary-button" disabled={create.isPending}>{create.isPending ? 'Creando...' : 'Crear ticket'}</button>
        </form>
      </aside>
    </section>
  );
}
