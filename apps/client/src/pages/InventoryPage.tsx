/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * Inventario operativo con tabla tipo hoja de resguardo, alta solo ADMIN, catálogo de equipos de cómputo, departamentos normalizados y responsivas visibles con ruta autenticada.
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, type ComputerEquipment, type Department, type Device } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { canManageInventory } from '../lib/permissions';

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
  assignedComputerEquipmentId: string;
  departmentId: string;
  serialNumber: string;
  state: Device['state'];
  description: string;
  loanStatus: Device['loanStatus'];
};

const initialForm: InventoryForm = {
  equipment: '',
  assignedComputerEquipmentId: '',
  departmentId: '',
  serialNumber: '',
  state: 'AVAILABLE',
  description: '',
  loanStatus: 'ACTIVE'
};

type CatalogForm = {
  name: string;
  description: string;
};

const initialCatalogForm: CatalogForm = {
  name: '',
  description: ''
};

export function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = canManageInventory(user);
  const [devices, setDevices] = useState<Device[]>([]);
  const [computerEquipment, setComputerEquipment] = useState<ComputerEquipment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isDepartmentCatalogOpen, setIsDepartmentCatalogOpen] = useState(false);
  const [form, setForm] = useState<InventoryForm>(initialForm);
  const [catalogForm, setCatalogForm] = useState<CatalogForm>(initialCatalogForm);
  const [departmentForm, setDepartmentForm] = useState<CatalogForm>(initialCatalogForm);
  const [responsiva, setResponsiva] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [savingDepartment, setSavingDepartment] = useState(false);
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

  async function loadComputerEquipment() {
    try {
      const { data } = await api.get('/api/computer-equipment');
      setComputerEquipment(data.data);
    } catch {
      setComputerEquipment([]);
    }
  }

  async function loadDepartments() {
    try {
      const { data } = await api.get('/api/departments');
      setDepartments(data.data);
    } catch {
      setDepartments([]);
    }
  }

  useEffect(() => {
    loadDevices();
    loadComputerEquipment();
    loadDepartments();
  }, []);

  const visibleDevices = useMemo(() => {
    return [...devices]
      .filter((device) => departmentFilter === 'ALL' || (departmentFilter === 'NONE' ? !device.departmentId : device.departmentId === departmentFilter))
      .sort((a, b) => {
        const departmentA = a.department?.name || 'ZZZ Sin departamento';
        const departmentB = b.department?.name || 'ZZZ Sin departamento';
        return departmentA.localeCompare(departmentB, 'es') || a.equipment.localeCompare(b.equipment, 'es');
      });
  }, [departmentFilter, devices]);

  function updateField<K extends keyof InventoryForm>(key: K, value: InventoryForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function closeModal() {
    if (saving || savingCatalog || savingDepartment) return;
    setIsModalOpen(false);
    setIsCatalogOpen(false);
    setIsDepartmentCatalogOpen(false);
    setForm(initialForm);
    setCatalogForm(initialCatalogForm);
    setDepartmentForm(initialCatalogForm);
    setResponsiva(null);
    setError(null);
  }

  async function handleCatalogSubmit() {
    if (!isAdmin || !catalogForm.name.trim()) return;
    setSavingCatalog(true);
    setError(null);

    try {
      const payload = {
        name: catalogForm.name.trim(),
        description: catalogForm.description.trim() || null
      };

      const { data } = await api.post('/api/computer-equipment', payload);
      const createdEquipment: ComputerEquipment = data.data;
      await loadComputerEquipment();
      updateField('assignedComputerEquipmentId', createdEquipment.id);
      setCatalogForm(initialCatalogForm);
      setIsCatalogOpen(false);
    } catch (requestError: any) {
      const message = requestError?.response?.data?.error || 'No fue posible registrar el equipo de cómputo. Revisa que el nombre no esté vacío o duplicado.';
      setError(message);
    } finally {
      setSavingCatalog(false);
    }
  }

  async function handleDepartmentSubmit() {
    if (!isAdmin || !departmentForm.name.trim()) return;
    setSavingDepartment(true);
    setError(null);

    try {
      const payload = {
        name: departmentForm.name.trim(),
        description: departmentForm.description.trim() || null
      };

      const { data } = await api.post('/api/departments', payload);
      const createdDepartment: Department = data.data;
      await loadDepartments();
      updateField('departmentId', createdDepartment.id);
      setDepartmentForm(initialCatalogForm);
      setIsDepartmentCatalogOpen(false);
    } catch (requestError: any) {
      const message = requestError?.response?.data?.error || 'No fue posible registrar el departamento. Revisa que el nombre no esté vacío o duplicado.';
      setError(message);
    } finally {
      setSavingDepartment(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        equipment: form.equipment.trim(),
        assignedUserId: null,
        assignedComputerEquipmentId: form.assignedComputerEquipmentId || null,
        departmentId: form.departmentId || null,
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
        await api.post(`/api/devices/${createdDevice.id}/files`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      await loadDevices();
      await loadComputerEquipment();
      await loadDepartments();
      closeModal();
    } catch (requestError: any) {
      const message = requestError?.response?.data?.error || 'No fue posible guardar el registro. Revisa campos obligatorios y número de serie.';
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
          <div className="inventoryActionRow">
            {isAdmin ? (
              <button className="primaryAction compact" type="button" onClick={() => setIsModalOpen(true)}>Agregar equipo</button>
            ) : (
              <span className="readOnlyNotice">Vista de consulta · tu cuenta no tiene permisos de alta</span>
            )}
          </div>
        </div>
        <img src={image} alt="Placas técnicas de inventario" />
      </header>

      {error && <div className="alertBox">{error}</div>}

      <div className="tableToolbar">
        <label>
          Ordenar / filtrar por departamento
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option value="ALL">Todos los departamentos</option>
            <option value="NONE">Sin departamento</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
        </label>
        <span className="readOnlyNotice">{visibleDevices.length} registros visibles</span>
      </div>

      <div className="inventoryTableShell">
        <table className="inventoryTable">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Departamento</th>
              <th>Equipo asignado</th>
              <th>Número de serie</th>
              <th>Estado del equipo</th>
              <th>Descripción</th>
              <th>Estado del préstamo</th>
              <th>Responsiva</th>
            </tr>
          </thead>
          <tbody>
            {visibleDevices.map((device) => {
              const responsivaFile = device.files?.find((item) => item.type === 'RESPONSIVA');
              return (
                <tr key={device.id}>
                  <td><strong>{device.equipment}</strong></td>
                  <td>{device.department?.name || 'Sin departamento'}</td>
                  <td>{device.assignedComputerEquipment?.name || 'Sin asignar'}</td>
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
        {!loading && visibleDevices.length === 0 && <div className="emptyState">Aún no hay equipos para el filtro seleccionado.</div>}
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
              <button className="ghostAction" type="button" onClick={closeModal} disabled={saving || savingCatalog || savingDepartment}>Cerrar</button>
            </div>

            <form className="adminForm inventoryForm" onSubmit={handleSubmit}>
              <label>
                Nombre
                <input value={form.equipment} onChange={(event) => updateField('equipment', event.target.value)} required minLength={2} placeholder="Ej. Jorge Suárez" />
              </label>

              <div className="catalogSelectField">
                <label>
                  Departamento
                  <select value={form.departmentId} onChange={(event) => updateField('departmentId', event.target.value)}>
                    <option value="">Sin departamento</option>
                    {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <button className="ghostAction catalogButton" type="button" onClick={() => setIsDepartmentCatalogOpen((current) => !current)}>
                  {isDepartmentCatalogOpen ? 'Ocultar alta de departamento' : 'Agregar departamento'}
                </button>
              </div>

              <div className="catalogSelectField">
                <label>
                  Equipo asignado
                  <select value={form.assignedComputerEquipmentId} onChange={(event) => updateField('assignedComputerEquipmentId', event.target.value)}>
                    <option value="">Sin asignar</option>
                    {computerEquipment.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <button className="ghostAction catalogButton" type="button" onClick={() => setIsCatalogOpen((current) => !current)}>
                  {isCatalogOpen ? 'Ocultar alta de equipo' : 'Agregar equipo de cómputo'}
                </button>
              </div>

              {isDepartmentCatalogOpen && (
                <div className="computerCatalogPanel">
                  <label>
                    Departamento
                    <input value={departmentForm.name} onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))} required minLength={2} placeholder="Ej. Producción" />
                  </label>
                  <label>
                    Detalle opcional
                    <input value={departmentForm.description} onChange={(event) => setDepartmentForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ej. Operación y edición" />
                  </label>
                  <button className="primaryAction compact" type="button" onClick={handleDepartmentSubmit} disabled={savingDepartment || !departmentForm.name.trim()}>{savingDepartment ? 'Registrando...' : 'Guardar departamento'}</button>
                </div>
              )}

              {isCatalogOpen && (
                <div className="computerCatalogPanel">
                  <label>
                    Equipo de cómputo
                    <input value={catalogForm.name} onChange={(event) => setCatalogForm((current) => ({ ...current, name: event.target.value }))} required minLength={2} placeholder="Ej. Laptop Dell Latitude 5420" />
                  </label>
                  <label>
                    Detalle opcional
                    <input value={catalogForm.description} onChange={(event) => setCatalogForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ej. RAM 16GB, SSD 512GB, cargador incluido" />
                  </label>
                  <button className="primaryAction compact" type="button" onClick={handleCatalogSubmit} disabled={savingCatalog || !catalogForm.name.trim()}>{savingCatalog ? 'Registrando...' : 'Guardar equipo de cómputo'}</button>
                </div>
              )}

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
                <button className="ghostAction" type="button" onClick={closeModal} disabled={saving || savingCatalog || savingDepartment}>Cancelar</button>
                <button className="primaryAction compact" type="submit" disabled={saving || savingCatalog || savingDepartment}>{saving ? 'Guardando...' : 'Guardar registro'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
