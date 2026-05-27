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

function normalizeHeader(value: unknown) {
  return normalize(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function readExcelCell(row: Record<string, unknown>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);
  const entry = Object.entries(row).find(([key]) => normalizedAliases.includes(normalizeHeader(key)));
  return normalize(entry?.[1]);
}

function mapLoanStatus(value: string): LoanStatus {
  const text = normalizeHeader(value);
  return text.includes('entregado') || text.includes('devuelto') || text.includes('returned') ? 'returned' : 'active';
}

function mapDeviceState(value: string, assigned: boolean): DeviceState {
  const text = normalizeHeader(value);
  if (text.includes('mantenimiento')) return 'maintenance';
  if (text.includes('retirado') || text.includes('baja')) return 'retired';
  if (text.includes('disponible')) return 'available';
  return assigned ? 'assigned' : 'available';
}

function getImportErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? 'Error desconocido');
  if (message.includes('No "mutation"-procedure') && message.includes('inventory.bulkImportDevices')) {
    return 'El navegador ya está listo para importar, pero el backend que está corriendo en el servidor todavía no tiene activado el importador. Ejecuta git pull, compila el servidor y reinicia el proceso para que tome el procedimiento inventory.bulkImportDevices.';
  }
  return `No se pudo leer/importar el Excel: ${message}`;
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
  const [responsivaSearch, setResponsivaSearch] = useState('');
  const [responsivaDepartmentFilter, setResponsivaDepartmentFilter] = useState('');
  const [responsivaPage, setResponsivaPage] = useState(1);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newDepartmentDescription, setNewDepartmentDescription] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'devices' | 'responsivas' | 'import'>('devices');

  const isAdmin = me.data?.role === 'admin';

  const createDevice = trpc.inventory.createDevice.useMutation({ onSuccess: refreshInventory });
  const updateDevice = trpc.inventory.updateDevice.useMutation({ onSuccess: refreshInventory });
  const createResponsiva = trpc.inventory.createResponsiva.useMutation({ onSuccess: refreshInventory });
  const updateResponsiva = trpc.inventory.updateResponsiva.useMutation({ onSuccess: refreshInventory });
  const createDepartment = trpc.inventory.createDepartment.useMutation({ onSuccess: refreshInventory });
  const bulkImport = trpc.inventory.bulkImportDevices.useMutation({
    onSuccess: async (result: any) => {
      const errorText = result.errors?.length ? ` Errores: ${result.errors.map((error: any) => `${error.serialNumber}: ${error.message}`).slice(0, 3).join(' | ')}` : '';
      setMessage(`Importación completada: ${result.created} nuevos, ${result.updated} actualizados.${errorText}`);
      await refreshInventory();
    },
    onError: (error: Error) => setMessage(getImportErrorMessage(error))
  });

  async function refreshInventory() {
    await utils.inventory.invalidate();
  }

  const filteredDevices = useMemo(() => {
    const term = filter.toLowerCase();
    return (devices.data || []).filter((device: any) => [device.equipment, device.serialNumber, device.description].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [devices.data, filter]);

  const filteredResponsivas = useMemo(() => {
    const term = responsivaSearch.toLowerCase();
    return (responsivas.data || []).filter((item: any) => {
      const matchesDepartment = !responsivaDepartmentFilter || item.departmentId === responsivaDepartmentFilter;
      const matchesSearch = !term || [item.responsibleName, item.responsibleEmail, item.equipment, item.serialNumber, item.departmentName, item.notes].some((value) => String(value || '').toLowerCase().includes(term));
      return matchesDepartment && matchesSearch;
    });
  }, [responsivas.data, responsivaSearch, responsivaDepartmentFilter]);

  const responsivaPageSize = 8;
  const responsivaTotalPages = Math.max(1, Math.ceil(filteredResponsivas.length / responsivaPageSize));
  const currentResponsivaPage = Math.min(responsivaPage, responsivaTotalPages);
  const paginatedResponsivas = filteredResponsivas.slice((currentResponsivaPage - 1) * responsivaPageSize, currentResponsivaPage * responsivaPageSize);

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

  async function submitDepartment(event: FormEvent) {
    event.preventDefault();
    const name = newDepartmentName.trim();
    if (!name) {
      setMessage('Escribe el nombre del departamento que quieres crear.');
      return;
    }

    const department = await createDepartment.mutateAsync({ name, description: newDepartmentDescription.trim() });
    setResponsivaForm((current) => ({ ...current, departmentId: department.id }));
    setResponsivaDepartmentFilter(department.id);
    setResponsivaPage(1);
    setNewDepartmentName('');
    setNewDepartmentDescription('');
    setMessage(`Departamento ${department.name} listo para usarse.`);
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

    try {
      setMessage(`Leyendo ${excelFile.name}...`);
      const buffer = await excelFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const imported: any[] = [];

      workbook.SheetNames.forEach((sheetName) => {
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '', raw: false });
        rows.forEach((row) => {
          const responsibleName = readExcelCell(row, ['Nombre', 'Responsable', 'Usuario', 'Asignado a', 'Persona asignada']);
          const equipment = readExcelCell(row, ['Equipo Asignado', 'Equipo', 'Dispositivo', 'Tipo de equipo', 'Articulo', 'Artículo']);
          const serialNumber = readExcelCell(row, ['Numero de Serie', 'Número de Serie', 'No Serie', 'No. Serie', 'Serie', 'Serial', 'Serial Number']);
          if (!equipment || !serialNumber) return;

          const loanText = readExcelCell(row, ['Estado del prestamo', 'Estado del préstamo', 'Prestamo', 'Préstamo', 'Estado prestamo']);
          const equipmentStatus = readExcelCell(row, ['Estado del Equipo', 'Estado equipo', 'Descripcion', 'Descripción', 'Observaciones']);
          const assigned = Boolean(responsibleName) || normalizeHeader(loanText).includes('activo');
          imported.push({
            equipment,
            serialNumber,
            assignedUserName: responsibleName,
            state: mapDeviceState(equipmentStatus || loanText, assigned),
            loanStatus: mapLoanStatus(loanText),
            description: equipmentStatus,
            externalResponsivaUrl: readExcelCell(row, ['Responsiva', 'URL Responsiva', 'Link Responsiva', 'Documento']),
            team: readExcelCell(row, ['Team', 'Equipo de trabajo', 'Area', 'Área', 'Departamento']) || sheetName
          });
        });
      });

      if (!imported.length) {
        setMessage('No se encontraron filas válidas en el Excel. Revisa que el archivo tenga columnas de Equipo y Número de Serie.');
        return;
      }

      await bulkImport.mutateAsync({ devices: imported });
      setExcelFile(null);
      setFilter('');
      setActiveTab('devices');
    } catch (error) {
      setMessage(getImportErrorMessage(error));
    }
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
              <label>Descripción<textarea value={deviceForm.description} onChange={(e) => setDeviceForm({ ...deviceForm, description: e.target.value })} placeholder="Marca, modelo, observaciones físicas o accesorios" /></label>
              <button className="primary-button blueprint-button" disabled={!isAdmin || createDevice.isLoading || updateDevice.isLoading}>{deviceForm.id ? 'Guardar cambios' : 'Guardar equipo'}</button>
            </form>
          </aside>

          <div className="panel blueprint-surface inventory-board-panel">
            <div className="panel-title-row"><div><span className="eyebrow">LISTADO</span><h3>Equipos registrados</h3></div><div className="filter-bar"><label>Buscar<input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Serie, equipo o descripción" /></label></div></div>
            <div className="inventory-board">
              <div className="inventory-board-head"><span>Serie</span><span>Equipo</span><span>Descripción</span><span>Estado</span><span>Préstamo</span><span>Acciones</span></div>
              {filteredDevices.map((device: any) => <div className="inventory-board-row" key={device.id}><strong>{device.serialNumber}</strong><span>{device.equipment}</span><span>{device.description || '—'}</span><em className={`status-pill ${stateClass[device.state] || ''}`}>{statusLabel(device.state)}</em><em className={`status-pill ${stateClass[device.loanStatus] || ''}`}>{device.loanStatus === 'returned' ? 'Entregado' : 'Activo'}</em><button onClick={() => editDevice(device)}><Pencil size={14} /> Editar</button></div>)}
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
              <label>Departamento<select value={responsivaForm.departmentId} onChange={(e) => setResponsivaForm({ ...responsivaForm, departmentId: e.target.value })}><option value="">Sin departamento</option>{departments.data?.map((department: any) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
              <div className="department-creator">
                <div><strong>Crear departamento</strong><span>Agrega un departamento y úsalo inmediatamente en esta responsiva.</span></div>
                <div className="department-creator-grid">
                  <input value={newDepartmentName} onChange={(e) => setNewDepartmentName(e.target.value)} placeholder="Nombre del departamento" />
                  <input value={newDepartmentDescription} onChange={(e) => setNewDepartmentDescription(e.target.value)} placeholder="Descripción opcional" />
                  <button type="button" className="secondary-link department-create-button" disabled={!isAdmin || createDepartment.isLoading} onClick={submitDepartment}><Plus size={14} /> Crear</button>
                </div>
              </div>
              <label>Estado<select value={responsivaForm.status} onChange={(e) => setResponsivaForm({ ...responsivaForm, status: e.target.value as ResponsivaStatus })}><option value="active">Activa</option><option value="returned">Entregada</option><option value="cancelled">Cancelada</option></select></label>
              <label>Responsiva firmada PDF/imagen<input type="file" accept="application/pdf,image/*" onChange={(e) => setResponsivaFile(e.target.files?.[0] || null)} /></label>
              <label>INE PDF/imagen<input type="file" accept="application/pdf,image/*" onChange={(e) => setIneFile(e.target.files?.[0] || null)} /></label>
              <label>Notas<textarea value={responsivaForm.notes} onChange={(e) => setResponsivaForm({ ...responsivaForm, notes: e.target.value })} /></label>
              <button className="primary-button blueprint-button" disabled={!isAdmin || createResponsiva.isLoading || updateResponsiva.isLoading}>{responsivaForm.id ? 'Guardar responsiva' : 'Crear responsiva'}</button>
            </form>
          </aside>

          <div className="panel blueprint-surface inventory-board-panel">
            <div className="panel-title-row"><div><span className="eyebrow">DOCUMENTOS</span><h3>Responsivas creadas</h3></div><small>{filteredResponsivas.length} de {responsivas.data?.length || 0} registros</small></div>
            <div className="responsiva-filters">
              <label>Buscar<input value={responsivaSearch} onChange={(e) => { setResponsivaSearch(e.target.value); setResponsivaPage(1); }} placeholder="Responsable, equipo, serie o notas" /></label>
              <label>Departamento<select value={responsivaDepartmentFilter} onChange={(e) => { setResponsivaDepartmentFilter(e.target.value); setResponsivaPage(1); }}><option value="">Todos los departamentos</option>{departments.data?.map((department: any) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
            </div>
            <div className="responsiva-list">
              {paginatedResponsivas.map((item: any) => <article className="responsiva-card" key={item.id}><div><strong>{item.responsibleName}</strong><span>{item.equipment} · {item.serialNumber}</span><span>Departamento: {item.departmentName || 'Sin departamento'}</span><p>{item.notes || 'Sin notas'}</p></div><em className={`status-pill ${stateClass[item.status] || ''}`}>{item.status === 'returned' ? 'Entregada' : item.status === 'cancelled' ? 'Cancelada' : 'Activa'}</em><div className="document-links">{item.files?.map((file: any) => <a key={file.id} href={`/api/files/${file.id}/view`} target="_blank" rel="noreferrer" title={file.originalName}><FileText size={14} /> Ver {file.type.toUpperCase()}</a>)}{!item.files?.length && <span>Sin documentos locales</span>}</div><button onClick={() => editResponsiva(item)}><Pencil size={14} /> Editar</button></article>)}
              {!filteredResponsivas.length && <p className="empty-state">Aún no hay responsivas que coincidan con los filtros.</p>}
            </div>
            <div className="pagination-controls"><button type="button" disabled={currentResponsivaPage <= 1} onClick={() => setResponsivaPage((page) => Math.max(1, page - 1))}>Anterior</button><span>Página {currentResponsivaPage} de {responsivaTotalPages}</span><button type="button" disabled={currentResponsivaPage >= responsivaTotalPages} onClick={() => setResponsivaPage((page) => Math.min(responsivaTotalPages, page + 1))}>Siguiente</button></div>
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
