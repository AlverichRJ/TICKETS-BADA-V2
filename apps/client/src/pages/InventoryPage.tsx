/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * Inventario operativo con tabla tipo hoja de resguardo, alta solo ADMIN y responsivas visibles con ruta autenticada.
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, type Device, type User } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const image = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663544686165/ddias5Q8vyPdjBP2SBrsSn/inventory_device_plate-gFy9SwkSpQ7U5vuq2b6D8m.webp';

const stateLabels: Record<Device['state'], string> = {
  AVAILABLE: 'Disponible',
  ASSIGNED: 'Asignado',
  MAINTENANCE: 'Mantenimiento',
  RETIRED: 'Retirado'
};

const loanStatusLabels: Record<Device['loanStatus'], string> = {
  ACTIVE: 'Activo',
  RETURNED: 'Devuelto'
};

type InventoryForm = {
  equipment: string;
  assignedUserId: string;
  serialNumber: string;
  state: Device['state'];
  description: string;
  loanStatus: Device['loanStatus'];
};

const initialForm: InventoryForm = {
  equipment: '',
  assignedUserId: '',
  serialNumber: '',
  state: 'AVAILABLE',
  description: '',
  loanStatus: 'ACTIVE'
};

export function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<InventoryForm>(initialForm);
  const [responsiva, setResponsiva] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDevices() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/devices');
      setDevices(data.data);
    } catch {
      setError('No fue posible cargar el inventario. Verifica la sesión y el backend local.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/api/users')
      .then(({ data }) => setUsers(data.data))
      .catch(() => setUsers([]));
  }, [isAdmin]);

  const assignableUsers = useMemo(() => {
    const seen = new Set<string>();
    return users.filter((item) => {
      const email = item.email.toLowerCase();
      if (item.isActive === false || seen.has(email)) return false;
      seen.add(email);
      return true;
    });
  }, [users]);

  function updateField<K extends keyof InventoryForm>(key: K, value: InventoryForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
    setForm(initialForm);
    setResponsiva(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        equipment: form.equipment.trim(),
        assignedUserId: form.assignedUserId || null,
        serialNumber: form.serialNumber.trim(),
        state: form.state,
        description: form.description.trim() || null,
        loanStatus: form.loanStatus
      };

      const { data } = await api.post('/api/devices', payload);
      const createdDevice: Device = data.data;

      if (responsiva) {
        const formData = new FormData();
        formData.append('file', responsiva);
        formData.append('type', 'RESPONSIVA');
        if (form.assignedUserId) formData.append('userId', form.assignedUserId);
        await api.post(`/api/devices/${createdDevice.id}/files`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      await loadDevices();
      closeModal();
    } catch (requestError: any) {
      const message = requestError?.response?.data?.error || 'No fue posible guardar el equipo. Revisa campos obligatorios y número de serie.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function openResponsiva(device: Device) {
    const file = device.files?.find((item) => item.type === 'RESPONSIVA');
    if (!file) return;
    window.open(`${api.defaults.baseURL}/api/files/${file.id}/download?inline=true`, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="pageStack">
      <header className="inventoryHero inventoryHero--actions">
        <div>
          <p className="eyebrow">Módulo 02 · Inventario</p>
          <h1>Inventario</h1>
          <p>Equipos, responsivas y asignaciones resguardadas en almacenamiento local. Los usuarios pueden consultar; solo ADMIN puede registrar o modificar equipos.</p>
          {isAdmin && <button className="primaryAction compact" type="button" onClick={() => setIsModalOpen(true)}>Agregar equipo</button>}
        </div>
        <img src={image} alt="Placas técnicas de inventario" />
      </header>

      {error && <div className="alertBox">{error}</div>}

      <div className="inventoryTableShell">
        <table className="inventoryTable">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Equipo asignado</th>
              <th>Número de serie</th>
              <th>Estado del equipo</th>
              <th>Descripción</th>
              <th>Estado del préstamo</th>
              <th>Responsiva</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => {
              const responsivaFile = device.files?.find((item) => item.type === 'RESPONSIVA');
              return (
                <tr key={device.id}>
                  <td><strong>{device.equipment}</strong></td>
                  <td>{device.assignedUser?.name || 'Sin asignar'}</td>
                  <td><span className="folio">{device.serialNumber}</span></td>
                  <td><span className={`status deviceState ${device.state}`}>{stateLabels[device.state]}</span></td>
                  <td>{device.description || 'Sin descripción'}</td>
                  <td>{loanStatusLabels[device.loanStatus]}</td>
                  <td>
                    {responsivaFile ? (
                      <button className="linkAction" type="button" onClick={() => openResponsiva(device)}>Visualizar</button>
                    ) : (
                      <span className="mutedText">Sin archivo</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && devices.length === 0 && <div className="emptyState">Aún no hay equipos registrados.</div>}
        {loading && <div className="emptyState">Cargando inventario...</div>}
      </div>

      {isModalOpen && (
        <div className="modalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <section className="modalPanel" role="dialog" aria-modal="true" aria-labelledby="inventory-create-title">
            <div className="modalHeader">
              <div>
                <p className="eyebrow">Alta administrativa</p>
                <h2 id="inventory-create-title">Agregar equipo</h2>
              </div>
              <button className="ghostAction" type="button" onClick={closeModal} disabled={saving}>Cerrar</button>
            </div>

            <form className="adminForm inventoryForm" onSubmit={handleSubmit}>
              <label>
                Nombre
                <input value={form.equipment} onChange={(event) => updateField('equipment', event.target.value)} required minLength={2} placeholder="Ej. Laptop Dell Latitude" />
              </label>

              <label>
                Equipo asignado
                <select value={form.assignedUserId} onChange={(event) => updateField('assignedUserId', event.target.value)}>
                  <option value="">Sin asignar</option>
                  {assignableUsers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.email}</option>)}
                </select>
              </label>

              <label>
                Número de serie
                <input value={form.serialNumber} onChange={(event) => updateField('serialNumber', event.target.value)} required minLength={3} placeholder="Ej. MX-123456" />
              </label>

              <label>
                Estado del equipo
                <select value={form.state} onChange={(event) => updateField('state', event.target.value as Device['state'])}>
                  <option value="AVAILABLE">Disponible</option>
                  <option value="ASSIGNED">Asignado</option>
                  <option value="MAINTENANCE">Mantenimiento</option>
                  <option value="RETIRED">Retirado</option>
                </select>
              </label>

              <label>
                Estado del préstamo
                <select value={form.loanStatus} onChange={(event) => updateField('loanStatus', event.target.value as Device['loanStatus'])}>
                  <option value="ACTIVE">Activo</option>
                  <option value="RETURNED">Devuelto</option>
                </select>
              </label>

              <label className="wideField">
                Descripción
                <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Condiciones, accesorios entregados o notas de préstamo." />
              </label>

              <label className="wideField fileField">
                Responsiva PDF o imagen
                <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setResponsiva(event.target.files?.[0] || null)} />
                <span>{responsiva ? responsiva.name : 'Formatos permitidos: PDF, JPG o PNG.'}</span>
              </label>

              <div className="formActions wideField">
                <button className="ghostAction" type="button" onClick={closeModal} disabled={saving}>Cancelar</button>
                <button className="primaryAction compact" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar equipo'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
