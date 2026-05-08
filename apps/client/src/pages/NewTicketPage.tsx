/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * Formulario tipo expediente con campos claros y envío al backend protegido.
 */
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export function NewTicketPage() {
  const navigate = useNavigate();
  const [failureDescription, setFailureDescription] = useState('');
  const [deviceSpecs, setDeviceSpecs] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.post('/api/tickets', { failureDescription, deviceSpecs, priority });
    navigate('/tickets');
  }

  return (
    <section className="formShell">
      <p className="eyebrow">Captura controlada</p>
      <h1>Crear ticket</h1>
      <form onSubmit={submit} className="adminForm">
        <label>Descripción del fallo<textarea required minLength={10} value={failureDescription} onChange={e => setFailureDescription(e.target.value)} /></label>
        <label>Especificaciones del equipo<textarea value={deviceSpecs} onChange={e => setDeviceSpecs(e.target.value)} /></label>
        <label>Prioridad<select value={priority} onChange={e => setPriority(e.target.value)}><option value="HIGH">Alta</option><option value="MEDIUM">Media</option><option value="LOW">Baja</option></select></label>
        <button className="primaryAction">Registrar ticket</button>
      </form>
    </section>
  );
}
