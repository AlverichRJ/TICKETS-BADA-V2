/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * Inventario restringido a ADMIN con asset técnico generado, placas de equipo y estados.
 */
import { useEffect, useState } from 'react';
import { api, type Device } from '../api/client';

const image = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663544686165/ddias5Q8vyPdjBP2SBrsSn/inventory_device_plate-gFy9SwkSpQ7U5vuq2b6D8m.webp';

export function InventoryPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  useEffect(() => { api.get('/api/devices').then(({ data }) => setDevices(data.data)); }, []);

  return (
    <section className="pageStack">
      <header className="inventoryHero">
        <div><p className="eyebrow">Módulo 02 · Solo ADMIN</p><h1>Inventario</h1><p>Equipos, responsivas, INE y asignaciones resguardadas en almacenamiento local.</p></div>
        <img src={image} alt="Placas técnicas de inventario" />
      </header>
      <div className="deviceGrid">
        {devices.map(device => (
          <article className="deviceCard" key={device.id}>
            <span className="folio">SN-{device.serialNumber}</span>
            <h3>{device.equipment}</h3>
            <p>{device.description || 'Sin descripción.'}</p>
            <div className="metaLine"><span>{device.state}</span><span>{device.loanStatus}</span><span>{device.assignedUser?.name || 'Sin asignar'}</span></div>
          </article>
        ))}
        {devices.length === 0 && <div className="emptyState">Aún no hay equipos registrados.</div>}
      </div>
    </section>
  );
}
