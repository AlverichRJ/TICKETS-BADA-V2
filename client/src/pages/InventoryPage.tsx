import { FormEvent, useState } from 'react';
import { trpc } from '../_core/trpc';
import { statusLabel } from '../lib/format';

export function InventoryPage() {
  const utils = trpc.useUtils();
  const [equipment, setEquipment] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [description, setDescription] = useState('');
  const devices = trpc.inventory.devices.useQuery({});
  const me = trpc.auth.me.useQuery();
  const create = trpc.inventory.createDevice.useMutation({ onSuccess: async () => { setEquipment(''); setSerialNumber(''); setDescription(''); await utils.inventory.invalidate(); } });

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate({ equipment, serialNumber, description });
  }

  return (
    <section className="page-grid">
      <div className="page-stack">
        <header className="page-header"><div><span className="eyebrow">ASSET_REGISTRY</span><h2>Inventario</h2></div><p>Activos técnicos asociados al soporte interno.</p></header>
        <div className="asset-grid">
          {devices.data?.map((device: any) => <article className="asset-tile" key={device.id}><span>{device.serialNumber}</span><strong>{device.equipment}</strong><p>{device.description || 'Sin descripción'}</p><em>{statusLabel(device.state)}</em></article>)}
          {!devices.data?.length && <p className="empty-state">No hay activos registrados.</p>}
        </div>
      </div>
      {me.data?.role === 'admin' && <aside className="panel form-panel"><h3>Registrar activo</h3><form className="form-stack" onSubmit={submit}><label>Equipo<input required value={equipment} onChange={(e) => setEquipment(e.target.value)} /></label><label>Serie<input required value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} /></label><label>Descripción<textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label><button className="primary-button" disabled={create.isPending}>Guardar activo</button></form></aside>}
    </section>
  );
}
