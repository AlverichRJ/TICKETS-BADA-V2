import { FormEvent, useMemo, useState } from 'react';
import { FileText, Pencil, Plus, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import { trpc } from '../_core/trpc';
import { statusLabel } from '../lib/format';

type DeviceState = 'available' | 'assigned' | 'maintenance' | 'retired';
type LoanStatus = 'active' | 'returned';
type ResponsivaStatus = 'active' | 'returned' | 'cancelled';

type DeviceForm = {
  id?: string;
  equipment: string;
  serialNumber: string;
  state: DeviceState;
  loanStatus: LoanStatus;
  description: string;
  assignedUserId: string;
  assignedUserName: string;
  assignedUserEmail: string;
  departmentId: string;
  team: string;
  externalResponsivaUrl: string;
};

type ResponsivaForm = {
  id?: string;
  deviceId: string;
  responsibleUserId: string;
  responsibleName: string;
  responsibleEmail: string;
  departmentId: string;
  status: ResponsivaStatus;
  notes: string;
};

const emptyDevice: DeviceForm = {
  equipment: '',
  serialNumber: '',
  state: 'available',
  loanStatus: 'active',
  description: '',
  assignedUserId: '',
  assignedUserName: '',
  assignedUserEmail: '',
  departmentId: '',
  team: '',
  externalResponsivaUrl: ''
};

const emptyResponsiva: ResponsivaForm = {
  deviceId: '',
  responsibleUserId: '',
  responsibleName: '',
  responsibleEmail: '',
  departmentId: '',
  status: 'active',
  notes: ''
};

const stateClass: Record<string, string> = {
  available: 'status-resolved',
  assigned: 'status-pending',
  maintenance: 'status-in_progress',
  retired: 'status-cancelled',
  active: 'status-pending',
  returned: 'status-resolved',
  cancelled: 'status-cancelled'
};

function normalize(value: unknown) {
  return String(value ?? '').trim();
}

function uploadInventoryFile(file: File, type: 'responsiva' | 'ine' | 'other', deviceId: string, userId?: string) {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  form.append('deviceId', deviceId);
  if (userId) form.append('userId', userId);
  return fetch('/api/files/upload', { method: 'POST', body: form, credentials: 'include' }).then(async (response) => {
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'No fue posible subir el documento.');
    }
    return response.json();
  });
}

export function InventoryPage() {
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery();
  const devices = trpc.inventory.devices.useQuery({});
  const availableDevices = trpc.inventory.availableDevices.useQuery({});
  const responsivas = trpc.inventory.responsivas.useQuery();
  const departments = trpc.inventory.departments.useQuery();
  const assignableUsers = trpc.users.assignable.useQuery();

  const [deviceForm, setDeviceForm] = useState<DeviceForm>(emptyDevice);
  const [responsivaForm, setResponsivaForm] = useState<ResponsivaForm>(emptyResponsiva);
  const [responsivaFile, setResponsivaFile] = useState<File | null>(null);
  const [ineFile, setIneFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'devices' | 'responsivas' | 'import'>('devices');

  const isAdmin = me.data?.role === 'admin';

  const createDevice = trpc.inventory.createDevice.useMutation({ onSuccess: refreshInventory });
  const updateDevice = trpc.inventory.updateDevice.useMutation({ onSuccess: refreshInventory });
  const createResponsiva = trpc.inventory.createResponsiva.useMutation({ onSuccess: refreshInventory });
  const updateResponsiva = trpc.inventory.updateResponsiva.useMutation({ onSuccess: refreshInventory });
  const bulkImport = trpc.inventory.bulkImportDevices.useMutation({ onSuccess: async (result: any) => { setMessage(`Importación completada: ${result.created} nuevos, ${result.updated} actualizados, ${result.errors?.length || 0} errores.`); await refreshInventory(); } });

  async function refreshInventory() {
    await utils.inventory.invalidate();
  }

  const filteredDevices = useMemo(() => {
    const term = filter.toLowerCase();
    return (devices.data || []).filter((device: any) => [device.equipment, device.serialNumber, device.description, device.assignedUserName, device.team].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [devices.data, filter]);

  function resetDeviceForm() {
    setDeviceForm(emptyDevice);
  }

  function resetResponsivaForm() {
    setResponsivaForm(emptyResponsiva);
    setResponsivaFile(null);
    setIneFile(null);
  }

  function editDevice(device: any) {
    setActiveTab('devices');
    setDeviceForm({
      id: device.id,
      equipment: device.equipment || '',
      serialNumber: device.serialNumber || '',
      state: device.state || 'available',
      loanStatus: device.loanStatus || 'active',
      description: device.description || '',
      assignedUserId: device.assignedUserId || '',
      assignedUserName: device.assignedUserName || '',
      assignedUserEmail: device.assignedUserEmail || '',
      departmentId: device.departmentId || '',
      team: device.team || '',
      externalResponsivaUrl: device.externalResponsivaUrl || ''
    });
  }

  function editResponsiva(item: any) {
    setActiveTab('responsivas');
    setResponsivaForm({
      id: item.id,
      deviceId: item.deviceId || '',
      responsibleUserId: item.responsibleUserId || '',
      responsibleName: item.responsibleName || '',
      responsibleEmail: item.responsibleEmail || '',
      departmentId: item.departmentId || '',
      status: item.status || 'active',
      notes: item.notes || ''
    });
  }

  function selectResponsible(userId: string) {
    const user = (assignableUsers.data || []).find((candidate: any) => candidate.id === userId);
    setResponsivaForm((current) => ({
      ...current,
      responsibleUserId: userId,
      responsibleName: user?.name || current.responsibleName,
      responsibleEmail: user?.email || current.responsibleEmail,
      departmentId: user?.departmentId || current.departmentId
    }));
  }

  async function submitDevice(event: FormEvent) {
    event.preventDefault();
    const payload = { ...deviceForm };
    if (deviceForm.id) {
      await updateDevice.mutateAsync({ ...payload, id: deviceForm.id });
      setMessage('Equipo actualizado correctamente.');
    } else {
      await createDevice.mutateAsync(payload);
      setMessage('Equipo agregado correctamente.');
    }
    resetDeviceForm();
  }

  async function submitResponsiva(event: FormEvent) {
    event.preventDefault();
    const payload = { ...responsivaForm };
    const result = responsivaForm.id ? await updateResponsiva.mutateAsync({ ...payload, id: responsivaForm.id }) : await createResponsiva.mutateAsync(payload);
    const deviceId = payload.deviceId || result?.deviceId;
    if (deviceId && responsivaFile) await uploadInventoryFile(responsivaFile, 'responsiva', deviceId, payload.responsibleUserId);
    if (deviceId && ineFile) await uploadInventoryFile(ineFile, 'ine', deviceId, payload.responsibleUserId);
    setMessage(responsivaForm.id ? 'Responsiva actualizada correctamente.' : 'Responsiva creada y equipo marcado como asignado.');
    resetResponsivaForm();
    await refreshInventory();
  }

  async function importExcel() {
    if (!excelFile) {
      setMessage('Primero selecciona un archivo Excel para cargar.');
      return;
    }
    const buffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const imported: any[] = [];

    workbook.SheetNames.forEach((sheetName) => {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' });
      rows.forEach((row) => {
        const name = normalize(row.Nombre);
        const equipment = normalize(row['Equipo Asignado'] || row.Equipo || row.Dispositivo);
        const serialNumber = normalize(row['Numero de Serie'] || row['Número de Serie'] || row.Serie);
        if (!equipment || !serialNumber) return;
        const loanText = normalize(row['Estado del prestamo'] || row['Estado del préstamo']).toUpperCase();
        const assigned = Boolean(name) || loanText === 'ACTIVO';
        imported.push({
          equipment,
          serialNumber,
          assignedUserName: name,
          state: assigned ? 'assigned' : 'available',
          loanStatus: loanText === 'ENTREGADO' ? 'returned' : 'active',
          description: normalize(row['Estado del Equipo'] || row.Descripcion || row.Descripción),
          externalResponsivaUrl: normalize(row.Responsiva),
          team: normalize(row.Team || sheetName)
        });
      });
    });

    if (!imported.length) {
      setMessage('No se encontraron filas válidas en el Excel.');
      return;
    }
    await bulkImport.mutateAsync({ devices: imported });
    setExcelFile(null);
  }

  return (
    <section className="page-stack inventory-module">
      <header className="page-header blueprint-heading">
        <div><span className="eyebrow">ASSET_REGISTRY</span><h2>Inventario</h2></div>
        <p>Control de equipos, responsivas firmadas, INE del responsable e importación masiva basada en la plantilla de Google Sheets.</p>
      </header>

      {message && <div className="status-feedback visible">{message}</div>}

      <div className="inventory-tabs">
        <button className={activeTab === 'devices' ? 'active' : ''} onClick={() => setActiveTab('devices')}>Equipos</button>
        <button className={activeTab === 'responsivas' ? 'active' : ''} onClick={() => setActiveTab('responsivas')}>Responsivas</button>
        <button className={activeTab === 'import' ? 'active' : ''} onClick={() => setActiveTab('import')}>Carga Excel</button>
      </div>

      {activeTab === 'devices' && (
        <div className="inventory-workspace">
          <aside className="panel blueprint-surface form-panel">
            <div className="panel-title-row"><div><span className="eyebrow">EQUIPO</span><h3>{deviceForm.id ? 'Editar equipo' : 'Agregar equipo'}</h3></div>{deviceForm.id && <button className="secondary-link" onClick={resetDeviceForm}>Nuevo</button>}</div>
            <form className="form-stack blueprint-form" onSubmit={submitDevice}>
              <label>Equipo<input required value={deviceForm.equipment} onChange={(e) => setDeviceForm({ ...deviceForm, equipment: e.target.value })} /></label>
              <label>Número de serie<input required value={deviceForm.serialNumber} onChange={(e) => setDeviceForm({ ...deviceForm, serialNumber: e.target.value })} /></label>
              <div className="form-grid-two"><label>Estado<select value={deviceForm.state} onChange={(e) => setDeviceForm({ ...deviceForm, state: e.target.value as DeviceState })}><option value="available">Disponible</option><option value="assigned">Asignado</option><option value="maintenance">Mantenimiento</option><option value="retired">Retirado</option></select></label><label>Préstamo<select value={deviceForm.loanStatus} onChange={(e) => setDeviceForm({ ...deviceForm, loanStatus: e.target.value as LoanStatus })}><option value="active">Activo</option><option value="returned">Entregado</option></select></label></div>
              <label>Responsable<input value={deviceForm.assignedUserName} onChange={(e) => setDeviceForm({ ...deviceForm, assignedUserName: e.target.value })} placeholder="Nombre del responsable" /></label>
              <label>Team<input value={deviceForm.team} onChange={(e) => setDeviceForm({ ...deviceForm, team: e.target.value })} /></label>
              <label>URL responsiva externa<input value={deviceForm.externalResponsivaUrl} onChange={(e) => setDeviceForm({ ...deviceForm, externalResponsivaUrl: e.target.value })} placeholder="Google Drive opcional" /></label>
              <label>Descripción<textarea value={deviceForm.description} onChange={(e) => setDeviceForm({ ...deviceForm, description: e.target.value })} /></label>
              <button className="primary-button blueprint-button" disabled={!isAdmin || createDevice.isLoading || updateDevice.isLoading}>{deviceForm.id ? 'Guardar cambios' : 'Guardar equipo'}</button>
            </form>
          </aside>

          <div className="panel blueprint-surface inventory-board-panel">
            <div className="panel-title-row"><div><span className="eyebrow">LISTADO</span><h3>Equipos registrados</h3></div><div className="filter-bar"><label>Buscar<input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Serie, equipo, responsable" /></label></div></div>
            <div className="inventory-board">
              <div className="inventory-board-head"><span>Serie</span><span>Equipo</span><span>Responsable</span><span>Team</span><span>Estado</span><span>Préstamo</span><span>Acciones</span></div>
              {filteredDevices.map((device: any) => <div className="inventory-board-row" key={device.id}><strong>{device.serialNumber}</strong><span>{device.equipment}</span><span>{device.assignedUserName || 'Sin asignar'}</span><span>{device.team || '—'}</span><em className={`status-pill ${stateClass[device.state] || ''}`}>{statusLabel(device.state)}</em><em className={`status-pill ${stateClass[device.loanStatus] || ''}`}>{device.loanStatus === 'returned' ? 'Entregado' : 'Activo'}</em><button onClick={() => editDevice(device)}><Pencil size={14} /> Editar</button></div>)}
              {!filteredDevices.length && <p className="empty-state">No hay equipos registrados.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'responsivas' && (
        <div className="inventory-workspace">
          <aside className="panel blueprint-surface form-panel">
            <div className="panel-title-row"><div><span className="eyebrow">RESPONSIVA</span><h3>{responsivaForm.id ? 'Editar responsiva' : 'Nueva responsiva'}</h3></div>{responsivaForm.id && <button className="secondary-link" onClick={resetResponsivaForm}>Nueva</button>}</div>
            <form className="form-stack blueprint-form" onSubmit={submitResponsiva}>
              <label>Equipo disponible<select required value={responsivaForm.deviceId} onChange={(e) => setResponsivaForm({ ...responsivaForm, deviceId: e.target.value })}><option value="">Seleccionar equipo</option>{availableDevices.data?.map((device: any) => <option key={device.id} value={device.id}>{device.equipment} · {device.serialNumber}</option>)}{responsivaForm.deviceId && !availableDevices.data?.some((device: any) => device.id === responsivaForm.deviceId) && <option value={responsivaForm.deviceId}>Equipo actualmente asignado</option>}</select></label>
              <label>Responsable del sistema<select value={responsivaForm.responsibleUserId} onChange={(e) => selectResponsible(e.target.value)}><option value="">Captura manual</option>{assignableUsers.data?.map((user: any) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></label>
              <label>Nombre responsable<input required value={responsivaForm.responsibleName} onChange={(e) => setResponsivaForm({ ...responsivaForm, responsibleName: e.target.value })} /></label>
              <label>Correo responsable<input value={responsivaForm.responsibleEmail} onChange={(e) => setResponsivaForm({ ...responsivaForm, responsibleEmail: e.target.value })} /></label>
              <label>Estado<select value={responsivaForm.status} onChange={(e) => setResponsivaForm({ ...responsivaForm, status: e.target.value as ResponsivaStatus })}><option value="active">Activa</option><option value="returned">Entregada</option><option value="cancelled">Cancelada</option></select></label>
              <label>Responsiva firmada PDF/imagen<input type="file" accept="application/pdf,image/*" onChange={(e) => setResponsivaFile(e.target.files?.[0] || null)} /></label>
              <label>INE PDF/imagen<input type="file" accept="application/pdf,image/*" onChange={(e) => setIneFile(e.target.files?.[0] || null)} /></label>
              <label>Notas<textarea value={responsivaForm.notes} onChange={(e) => setResponsivaForm({ ...responsivaForm, notes: e.target.value })} /></label>
              <button className="primary-button blueprint-button" disabled={!isAdmin || createResponsiva.isLoading || updateResponsiva.isLoading}>{responsivaForm.id ? 'Guardar responsiva' : 'Crear responsiva'}</button>
            </form>
          </aside>

          <div className="panel blueprint-surface inventory-board-panel">
            <div className="panel-title-row"><div><span className="eyebrow">DOCUMENTOS</span><h3>Responsivas creadas</h3></div><small>{responsivas.data?.length || 0} registros</small></div>
            <div className="responsiva-list">
              {responsivas.data?.map((item: any) => <article className="responsiva-card" key={item.id}><div><strong>{item.responsibleName}</strong><span>{item.equipment} · {item.serialNumber}</span><p>{item.notes || 'Sin notas'}</p></div><em className={`status-pill ${stateClass[item.status] || ''}`}>{item.status === 'returned' ? 'Entregada' : item.status === 'cancelled' ? 'Cancelada' : 'Activa'}</em><div className="document-links">{item.files?.map((file: any) => <a key={file.id} href={`/api/files/${file.id}/download`}><FileText size={14} /> {file.type.toUpperCase()}</a>)}{!item.files?.length && <span>Sin documentos locales</span>}</div><button onClick={() => editResponsiva(item)}><Pencil size={14} /> Editar</button></article>)}
              {!responsivas.data?.length && <p className="empty-state">Aún no hay responsivas creadas.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="panel blueprint-surface import-panel">
          <span className="eyebrow">BULK_IMPORT</span><h3>Carga masiva desde Excel</h3>
          <p>Sube la plantilla INVENTARIOVERTIKAL.xlsx. Se leerán todas las hojas y se mapearán las columnas: Nombre, Equipo Asignado, Numero de Serie, Estado del Equipo, Estado del prestamo, Responsiva y Team.</p>
          <label className="excel-drop"><UploadCloud /><strong>Seleccionar archivo Excel</strong><input type="file" accept=".xlsx,.xls" onChange={(event) => setExcelFile(event.target.files?.[0] || null)} disabled={!isAdmin || bulkImport.isLoading} /></label>
          {excelFile && <div className="import-summary"><FileText size={16} /> Archivo listo: <strong>{excelFile.name}</strong></div>}
          <button className="primary-button blueprint-button import-action" type="button" onClick={importExcel} disabled={!isAdmin || !excelFile || bulkImport.isLoading}>{bulkImport.isLoading ? 'Cargando inventario...' : 'Cargar / importar archivo'}</button>
          <div className="import-summary"><Plus size={16} /> Los equipos existentes se actualizan por número de serie; los nuevos se crean automáticamente.</div>
        </div>
      )}
    </section>
  );
}
