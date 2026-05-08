/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * Formulario tipo expediente con campos operativos alineados a la referencia: líder, equipo, fallo, specs, prioridad y notas.
 */
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export function NewTicketPage() {
  const navigate = useNavigate();
  const [leaderName, setLeaderName] = useState('');
  const [reviewedEquipment, setReviewedEquipment] = useState('');
  const [failureDescription, setFailureDescription] = useState('');
  const [deviceSpecs, setDeviceSpecs] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [technicalNotes, setTechnicalNotes] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.post('/api/tickets', {
      leaderName,
      reviewedEquipment,
      failureDescription,
      deviceSpecs,
      priority,
      technicalNotes
    });
    navigate('/tickets');
  }

  return (
    <section className="formShell ticketCaptureShell">
      <p className="eyebrow">Captura controlada</p>
      <h1>Crear ticket</h1>
      <p className="formLead">Completa la información operativa del reporte. El ID, fecha de reporte, estatus inicial y fecha de resolución se calculan automáticamente por el sistema.</p>
      <form onSubmit={submit} className="adminForm ticketCaptureForm">
        <label>Líder<input required value={leaderName} onChange={e => setLeaderName(e.target.value)} placeholder="Ej. Braulio" /></label>
        <label>Equipo a revisar<input required value={reviewedEquipment} onChange={e => setReviewedEquipment(e.target.value)} placeholder="Ej. PC de Oscar Cervantes" /></label>
        <label className="wideField">Descripción del fallo<textarea required minLength={10} value={failureDescription} onChange={e => setFailureDescription(e.target.value)} placeholder="Describe el problema observado por el usuario." /></label>
        <label className="wideField">Especificaciones PC<textarea value={deviceSpecs} onChange={e => setDeviceSpecs(e.target.value)} placeholder="Procesador, RAM, almacenamiento, tarjeta gráfica u otros datos relevantes." /></label>
        <label>Prioridad<select value={priority} onChange={e => setPriority(e.target.value)}><option value="HIGH">Alta</option><option value="MEDIUM">Media</option><option value="LOW">Baja</option></select></label>
        <label className="wideField">Notas técnicas<textarea value={technicalNotes} onChange={e => setTechnicalNotes(e.target.value)} placeholder="Observaciones, pruebas realizadas o indicaciones para soporte." /></label>
        <button className="primaryAction">Registrar ticket</button>
      </form>
    </section>
  );
}
