import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { CalendarClock, ChevronDown, ChevronRight, CreditCard, DollarSign, Search, SlidersHorizontal, Upload } from 'lucide-react';
import { trpc } from '../_core/trpc';
import { formatDate } from '../lib/format';

type Category = 'ai' | 'editing' | 'hosting' | 'security' | 'productivity' | 'business' | 'design' | 'other';
type BillingCycle = 'monthly' | 'quarterly' | 'annual' | 'one_time';
type ServiceStatus = 'active' | 'paused' | 'cancelled' | 'expired';
type Priority = 'high' | 'medium' | 'low';

type ServiceMode = 'existing' | 'new';
type PaymentMode = 'existing' | 'new';

type ImportRow = {
  serviceName: string;
  category: Category;
  responsibleName?: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  paymentMethodName?: string;
  renewalDate?: string;
  renewalDay?: number;
  status: ServiceStatus;
  priority: Priority;
  usageDescription?: string;
  notes?: string;
  sourceRow?: number;
  sourceSheet?: string;
};

const categoryLabels: Record<Category, string> = {
  ai: 'Inteligencia artificial',
  editing: 'Edición / Contenido',
  hosting: 'Hosting / Dominios',
  security: 'Seguridad',
  productivity: 'Productividad',
  business: 'Negocio',
  design: 'Diseño',
  other: 'Otro'
};

const cycleLabels: Record<BillingCycle, string> = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  annual: 'Anual',
  one_time: 'Pago único'
};

const statusLabels: Record<ServiceStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  cancelled: 'Cancelado',
  expired: 'Vencido'
};

const priorityLabels: Record<Priority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja'
};

function formatMoney(value: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value || 0));
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeText(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function parseAmount(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const clean = String(value || '').replace(/\$/g, '').replace(/\s/g, '').replace(/,/g, '.');
  const pieces = clean.split('.');
  const normalized = pieces.length > 2 ? `${pieces.slice(0, -1).join('')}.${pieces.at(-1)}` : clean;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function parseBillingCycle(value: unknown): BillingCycle {
  const normalized = normalizeText(value);
  if (normalized.includes('TRIM')) return 'quarterly';
  if (normalized.includes('ANUAL') || normalized.includes('ANIO') || normalized.includes('AÑO')) return 'annual';
  if (normalized.includes('UNICO') || normalized.includes('ONE')) return 'one_time';
  return 'monthly';
}

function parseStatus(value: unknown): ServiceStatus {
  const normalized = normalizeText(value);
  if (normalized.includes('CANCEL')) return 'cancelled';
  if (normalized.includes('PAUS')) return 'paused';
  if (normalized.includes('VENC') || normalized.includes('EXPIR')) return 'expired';
  return 'active';
}

function parseCategory(serviceName: string, department?: string): Category {
  const text = normalizeText(`${serviceName} ${department || ''}`);
  if (/CHATGPT|CLAUDE|GROK|MIDJ|GOOGLE IA|KLING|IA/.test(text)) return 'ai';
  if (/HOSTING|SSL|DOMINIO|WEB/.test(text)) return 'hosting';
  if (/MALCARE|ANTIVIRUS|SEGUR/.test(text)) return 'security';
  if (/FREEPIK|ADOBE|PHOTOSHOP|CAPCUT|ENVATO|SHUTTER|EPIDEMIC|ELEVEN|EDICION|PDF|VIDEO|AUDIO/.test(text)) return 'editing';
  if (/GSUITE|GOOGLE|TRANSFER|PRODUCT/.test(text)) return 'productivity';
  if (/ILUSTRACION|DISENO|DISEÑO/.test(text)) return 'design';
  if (/EMPRESARIAL|NEGOCIO/.test(text)) return 'business';
  return 'other';
}

function parseRenewal(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return { renewalDate: value.toISOString().slice(0, 10) };
  const raw = String(value || '').trim();
  if (!raw) return {};
  const dateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) return { renewalDate: `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` };
  const slashMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
    return { renewalDate: `${year}-${month}-${day}` };
  }
  const dayMatch = normalizeText(raw).match(/(\d{1,2})/);
  if (dayMatch) return { renewalDay: Math.min(31, Math.max(1, Number(dayMatch[1]))) };
  return { notes: `Fecha de renovación importada sin normalizar: ${raw}` };
}

function extractImportRows(workbook: XLSX.WorkBook): ImportRow[] {
  const preferredSheet = workbook.SheetNames.find((name) => normalizeText(name).includes('RESUMEN')) || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[preferredSheet];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '', raw: false });
  const importRows: ImportRow[] = [];
  let header: Record<string, number> | null = null;

  const findHeaderIndex = (labels: string[], keys: string[]) => labels.findIndex((label) => keys.some((key) => label.includes(key)));

  matrix.forEach((row, index) => {
    const labels = row.map((cell) => normalizeText(cell));
    const serviceIndex = findHeaderIndex(labels, ['SERVICIO', 'PLATAFORMA']);
    const priceIndex = findHeaderIndex(labels, ['PRECIO', 'COSTO', 'MONTO']);

    if (serviceIndex >= 0 && priceIndex >= 0) {
      header = {
        service: serviceIndex,
        department: findHeaderIndex(labels, ['DEPARTAMENTO', 'AREA', 'RESPONSABLE']),
        cycle: findHeaderIndex(labels, ['COBRO', 'CICLO', 'FRECUENCIA']),
        amount: priceIndex,
        status: findHeaderIndex(labels, ['STATUS', 'ESTADO']),
        payment: findHeaderIndex(labels, ['METODO', 'PAGO', 'TARJETA']),
        renewal: findHeaderIndex(labels, ['RENOVACION', 'COMPRA', 'FECHA'])
      };
      return;
    }

    if (!header) return;
    const serviceName = String(row[header.service] || '').trim().replace(/\s+/g, ' ');
    const normalizedService = normalizeText(serviceName);
    if (!serviceName || normalizedService === 'TOTAL' || normalizedService.includes('TODOS LOS PRECIOS')) return;

    const amount = parseAmount(row[header.amount]);
    if (!amount) return;

    const department = header.department >= 0 ? String(row[header.department] || '').trim().replace(/\s+/g, ' ') : '';
    const cycle = header.cycle >= 0 ? row[header.cycle] : '';
    const status = header.status >= 0 ? row[header.status] : '';
    const paymentMethodName = header.payment >= 0 ? String(row[header.payment] || '').trim().replace(/\s+/g, ' ') : '';
    const renewal = header.renewal >= 0 ? parseRenewal(row[header.renewal]) : {};

    importRows.push({
      serviceName,
      category: parseCategory(serviceName, department),
      responsibleName: department || undefined,
      billingCycle: parseBillingCycle(cycle),
      amount,
      currency: 'MXN',
      paymentMethodName: paymentMethodName || undefined,
      status: parseStatus(status),
      priority: parseStatus(status) === 'active' ? 'medium' : 'low',
      usageDescription: department ? `Importado desde Excel · Área/departamento: ${department}` : 'Importado desde Excel',
      notes: renewal.notes,
      renewalDate: renewal.renewalDate,
      renewalDay: renewal.renewalDay,
      sourceRow: index + 1,
      sourceSheet: preferredSheet
    });
  });

  const seen = new Set<string>();
  return importRows.filter((row) => {
    const key = [normalizeText(row.serviceName), normalizeText(row.responsibleName), row.billingCycle, row.amount.toFixed(2), normalizeText(row.paymentMethodName), row.renewalDate || row.renewalDay || '', row.status].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function DigitalServicesPage() {
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery();
  const services = trpc.digitalServices.list.useQuery({ status: 'all' });
  const stats = trpc.digitalServices.stats.useQuery();
  const catalog = trpc.digitalServices.catalog.useQuery();
  const paymentMethods = trpc.digitalServices.paymentMethods.useQuery();
  const departments = trpc.inventory.departments.useQuery();
  const users = trpc.users.assignable.useQuery();

  const [serviceMode, setServiceMode] = useState<ServiceMode>('existing');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('existing');
  const [serviceId, setServiceId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState<Category>('ai');
  const [provider, setProvider] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('MXN');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentMethodName, setPaymentMethodName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [renewalDay, setRenewalDay] = useState('');
  const [status, setStatus] = useState<ServiceStatus>('active');
  const [priority, setPriority] = useState<Priority>('medium');
  const [usageDescription, setUsageDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (services.data || []).filter((service: any) => {
      const byStatus = statusFilter === 'all' || service.subscriptions.some((subscription: any) => subscription.status === statusFilter);
      const byCategory = categoryFilter === 'all' || service.category === categoryFilter;
      const bySearch = !term || [service.name, service.provider, service.description].some((value) => String(value || '').toLowerCase().includes(term)) || service.subscriptions.some((subscription: any) => [subscription.responsibleName, subscription.usageDescription, subscription.paymentMethodName, subscription.notes].some((value) => String(value || '').toLowerCase().includes(term)));
      return byStatus && byCategory && bySearch;
    });
  }, [services.data, search, statusFilter, categoryFilter]);

  const createSubscription = trpc.digitalServices.createSubscription.useMutation({
    onSuccess: async (_created: any) => {
      const label = serviceMode === 'existing' ? catalog.data?.find((service: any) => service.id === serviceId)?.name : serviceName;
      setFeedback(`Suscripción agregada correctamente${label ? ` a ${label}` : ''}.`);
      setServiceId('');
      setServiceName('');
      setProvider('');
      setDepartmentId('');
      setResponsibleUserId('');
      setResponsibleName('');
      setAmount('');
      setPaymentMethodId('');
      setPaymentMethodName('');
      setPurchaseDate('');
      setRenewalDate('');
      setRenewalDay('');
      setUsageDescription('');
      setNotes('');
      await utils.digitalServices.invalidate();
    }
  });

  const importSubscriptions = trpc.digitalServices.importSubscriptions.useMutation({
    onSuccess: async (result: any) => {
      setImportResult(result);
      setFeedback(`Importación terminada: ${result.created} creadas, ${result.skippedDuplicates} duplicadas omitidas.`);
      await utils.digitalServices.invalidate();
    }
  });

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4800);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    const selectedUser = users.data?.find((user: any) => user.id === responsibleUserId);
    if (selectedUser) setResponsibleName(selectedUser.name || '');
  }, [responsibleUserId, users.data]);

  function submit(event: FormEvent) {
    event.preventDefault();
    createSubscription.mutate({
      serviceId: serviceMode === 'existing' ? serviceId || undefined : undefined,
      serviceName: serviceMode === 'new' ? serviceName.trim() : undefined,
      category,
      provider: provider.trim() || undefined,
      departmentId: departmentId || undefined,
      responsibleUserId: responsibleUserId || undefined,
      responsibleName: responsibleName.trim() || undefined,
      billingCycle,
      amount: Number(amount || 0),
      currency,
      paymentMethodId: paymentMode === 'existing' ? paymentMethodId || undefined : undefined,
      paymentMethodName: paymentMode === 'new' ? paymentMethodName.trim() : undefined,
      purchaseDate: purchaseDate || undefined,
      renewalDate: renewalDate || undefined,
      renewalDay: renewalDay ? Number(renewalDay) : undefined,
      status,
      priority,
      usageDescription: usageDescription.trim() || undefined,
      notes: notes.trim() || undefined
    });
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImportError(null);
    setImportResult(null);
    setImportRows([]);
    if (!file) return;

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const rows = extractImportRows(workbook);
      setImportFileName(file.name);
      setImportRows(rows);
      if (!rows.length) setImportError('No encontré filas válidas para importar. Verifica que el Excel tenga columnas de servicio, cobro, precio, estado y método de pago.');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'No se pudo leer el archivo Excel.');
    } finally {
      event.target.value = '';
    }
  }

  function executeImport() {
    if (!importRows.length) return;
    importSubscriptions.mutate({ rows: importRows });
  }

  return (
    <section className="page-stack digital-services-shell">
      <header className="page-header blueprint-heading">
        <div>
          <span className="eyebrow">CONTROL DE GASTOS · SERVICIOS</span>
          <h2>Servicios Digitales</h2>
        </div>
        <p>Administra plataformas, licencias, renovaciones, métodos de pago y gasto mensual equivalente sin mezclarlo con inventario físico.</p>
      </header>

      <div className="metrics-grid digital-metrics-grid">
        <article className="panel blueprint-surface metric-card"><DollarSign size={18} /><span>Gasto mensual</span><strong>{formatMoney(stats.data?.monthlyCost || 0)}</strong></article>
        <article className="panel blueprint-surface metric-card"><DollarSign size={18} /><span>Gasto anual</span><strong>{formatMoney(stats.data?.annualCost || 0)}</strong></article>
        <article className="panel blueprint-surface metric-card"><CreditCard size={18} /><span>Suscripciones activas</span><strong>{stats.data?.activeSubscriptions || 0}</strong></article>
        <article className="panel blueprint-surface metric-card"><CalendarClock size={18} /><span>Servicios registrados</span><strong>{stats.data?.totalServices || 0}</strong></article>
      </div>

      {me.data?.role === 'admin' && <article className="panel blueprint-surface digital-import-panel">
        <div className="panel-title-row">
          <div>
            <span className="eyebrow">IMPORTACIÓN XLSX</span>
            <h3>Importar servicios desde Excel</h3>
          </div>
          <label className="secondary-button import-file-button"><Upload size={15} /> Seleccionar XLSX<input type="file" accept=".xlsx,.xls" onChange={handleImportFile} /></label>
        </div>
        <p className="muted-copy">Primero se previsualizan los registros detectados. Al importar, el backend omite duplicados equivalentes por servicio, responsable/área, ciclo, monto, método de pago y renovación.</p>
        {importFileName && <p className="status-feedback">Archivo preparado: <strong>{importFileName}</strong> · {importRows.length} registros únicos detectados en la previsualización.</p>}
        {importError && <p className="error-feedback" role="alert">{importError}</p>}
        {!!importRows.length && <div className="import-preview-box">
          <div className="import-preview-actions">
            <strong>Previsualización</strong>
            <button className="primary-button blueprint-button" onClick={executeImport} disabled={importSubscriptions.isLoading || importSubscriptions.isPending}>{importSubscriptions.isLoading || importSubscriptions.isPending ? 'Importando...' : `Importar ${importRows.length} registros`}</button>
          </div>
          <div className="import-preview-table">
            <table>
              <thead><tr><th>Servicio</th><th>Área</th><th>Ciclo</th><th>Monto</th><th>Método</th><th>Renovación</th></tr></thead>
              <tbody>{importRows.slice(0, 12).map((row, index) => <tr key={`${row.sourceRow}-${index}`}><td>{row.serviceName}</td><td>{row.responsibleName || 'Sin área'}</td><td>{cycleLabels[row.billingCycle]}</td><td>{formatMoney(row.amount, row.currency)}</td><td>{row.paymentMethodName || 'Sin método'}</td><td>{row.renewalDate || (row.renewalDay ? `Día ${row.renewalDay}` : 'Sin fecha')}</td></tr>)}</tbody>
            </table>
          </div>
          {importRows.length > 12 && <small>Se muestran 12 de {importRows.length} registros. El resto también se importará.</small>}
        </div>}
        {importResult && <div className="import-result-box">
          <strong>Resultado:</strong> {importResult.created} creadas · {importResult.skippedDuplicates} duplicadas omitidas · {importResult.skippedInvalid} inválidas.
          {!!importResult.issues?.length && <details><summary>Ver incidencias</summary><ul>{importResult.issues.slice(0, 20).map((issue: any, index: number) => <li key={index}>Fila {issue.sourceRow || '?'}: {issue.serviceName || 'Sin servicio'} · {issue.reason}</li>)}</ul></details>}
        </div>}
      </article>}

      <div className="ticket-workspace digital-workspace">
        {me.data?.role === 'admin' && <aside className="panel blueprint-surface form-panel digital-create-panel">
          <div className="panel-title-row">
            <div>
              <span className="eyebrow">NUEVA SUSCRIPCIÓN</span>
              <h3>Agregar servicio</h3>
            </div>
          </div>
          <form onSubmit={submit} className="form-stack blueprint-form">
            <div className="segmented-control">
              <button type="button" className={serviceMode === 'existing' ? 'is-active' : ''} onClick={() => setServiceMode('existing')}>Servicio existente</button>
              <button type="button" className={serviceMode === 'new' ? 'is-active' : ''} onClick={() => setServiceMode('new')}>Nuevo servicio</button>
            </div>
            {serviceMode === 'existing' ? <label>Servicio<select required value={serviceId} onChange={(event) => setServiceId(event.target.value)}><option value="">Seleccionar servicio</option>{catalog.data?.map((service: any) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label> : <>
              <label>Nombre del servicio<input required value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder="CHATGPT, FREEPIK, HOSTINGER..." /></label>
              <label>Proveedor<input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="OpenAI, Adobe, Google, GoDaddy..." /></label>
            </>}
            <label>Categoría<select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <div className="form-grid-two">
              <label>Ciclo<select value={billingCycle} onChange={(event) => setBillingCycle(event.target.value as BillingCycle)}>{Object.entries(cycleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Monto<input required type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label>
            </div>
            <div className="form-grid-two">
              <label>Moneda<input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} maxLength={8} /></label>
              <label>Estado<select value={status} onChange={(event) => setStatus(event.target.value as ServiceStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            <div className="segmented-control compact">
              <button type="button" className={paymentMode === 'existing' ? 'is-active' : ''} onClick={() => setPaymentMode('existing')}>Método existente</button>
              <button type="button" className={paymentMode === 'new' ? 'is-active' : ''} onClick={() => setPaymentMode('new')}>Nuevo método</button>
            </div>
            {paymentMode === 'existing' ? <label>Método de pago<select value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}><option value="">Sin método</option>{paymentMethods.data?.map((method: any) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label> : <label>Nuevo método de pago<input value={paymentMethodName} onChange={(event) => setPaymentMethodName(event.target.value)} placeholder="TARJETA FLOR, TRANSFERENCIA..." /></label>}
            <label>Departamento<select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}><option value="">Sin departamento</option>{departments.data?.map((department: any) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
            <label>Responsable<select value={responsibleUserId} onChange={(event) => setResponsibleUserId(event.target.value)}><option value="">Captura manual</option>{users.data?.map((user: any) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
            <label>Nombre responsable<input value={responsibleName} onChange={(event) => setResponsibleName(event.target.value)} placeholder="Responsable interno o externo" /></label>
            <div className="form-grid-two">
              <label>Compra<input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} max={todayInput()} /></label>
              <label>Renovación<input type="date" value={renewalDate} onChange={(event) => setRenewalDate(event.target.value)} /></label>
            </div>
            <div className="form-grid-two">
              <label>Día de cobro<input type="number" min="1" max="31" value={renewalDay} onChange={(event) => setRenewalDay(event.target.value)} placeholder="1-31" /></label>
              <label>Prioridad<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            <label>Uso<textarea value={usageDescription} onChange={(event) => setUsageDescription(event.target.value)} placeholder="Área, cuenta, licencia o finalidad del gasto." /></label>
            <label>Notas<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observaciones, condiciones, renovaciones o cancelación." /></label>
            <button className="primary-button blueprint-button" disabled={createSubscription.isLoading || createSubscription.isPending}>{createSubscription.isLoading || createSubscription.isPending ? 'Guardando...' : 'Guardar suscripción'}</button>
          </form>
        </aside>}

        <article className="panel blueprint-surface digital-board-panel">
          <div className="panel-title-row ticket-toolbar">
            <div>
              <span className="eyebrow">REGISTRO GENERAL</span>
              <h3>Servicios agrupados</h3>
            </div>
            <div className="filter-bar">
              <label className="search-field"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar servicio, responsable o método" /></label>
              <label><SlidersHorizontal size={15} /><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)}><option value="all">Todas las categorías</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
          </div>
          {feedback && <p className="status-feedback" role="status">{feedback}</p>}
          <div className="digital-service-list">
            {filteredServices.map((service: any) => {
              const isExpanded = expandedService === service.id;
              return <article key={service.id} className={`digital-service-card ${isExpanded ? 'is-expanded' : ''}`}>
                <button className="digital-service-summary" type="button" onClick={() => setExpandedService(isExpanded ? null : service.id)}>
                  <span className="expand-button">{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                  <span><strong>{service.name}</strong><small>{categoryLabels[service.category as Category] || 'Otro'} · {service.subscriptionCount} suscripción(es)</small></span>
                  <em>{formatMoney(service.monthlyCost)} / mes</em>
                  <em>{formatMoney(service.annualCost)} / año</em>
                  <span className="digital-badges"><i>{service.activeCount} activas</i><i>{service.cancelledCount} canceladas</i></span>
                </button>
                {isExpanded && <div className="digital-subscription-list">
                  {service.subscriptions.map((subscription: any) => <div key={subscription.id} className="digital-subscription-row">
                    <div><strong>{cycleLabels[subscription.billingCycle as BillingCycle]}</strong><small>{formatMoney(subscription.amount, subscription.currency)} · {subscription.currency}</small></div>
                    <div><strong>{statusLabels[subscription.status as ServiceStatus]}</strong><small>Prioridad {priorityLabels[subscription.priority as Priority]}</small></div>
                    <div><strong>{subscription.responsibleName || 'Sin responsable'}</strong><small>{subscription.departmentName || 'Sin departamento'}</small></div>
                    <div><strong>{subscription.paymentMethodName || 'Sin método'}</strong><small>Renueva: {subscription.renewalDate ? formatDate(subscription.renewalDate) : subscription.renewalDay ? `Día ${subscription.renewalDay}` : 'Sin fecha'}</small></div>
                    <p>{subscription.usageDescription || subscription.notes || 'Sin observaciones capturadas.'}</p>
                  </div>)}
                </div>}
              </article>;
            })}
            {!filteredServices.length && <p className="empty-state">No hay servicios digitales con los filtros seleccionados.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
