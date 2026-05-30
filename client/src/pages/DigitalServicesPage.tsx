import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChevronDown, ChevronRight, CreditCard, DollarSign, Search, SlidersHorizontal } from 'lucide-react';
import { trpc } from '../_core/trpc';
import { formatDate } from '../lib/format';

type Category = 'ai' | 'editing' | 'hosting' | 'security' | 'productivity' | 'business' | 'design' | 'other';
type BillingCycle = 'monthly' | 'quarterly' | 'annual' | 'one_time';
type ServiceStatus = 'active' | 'paused' | 'cancelled' | 'expired';
type Priority = 'high' | 'medium' | 'low';

type ServiceMode = 'existing' | 'new';
type PaymentMode = 'existing' | 'new';

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

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3800);
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
                    <div><strong>{subscription.paymentMethodName || 'Sin método'}</strong><small>Renueva: {subscription.renewalDate ? formatDate(subscription.renewalDate) : 'Sin fecha'}</small></div>
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
