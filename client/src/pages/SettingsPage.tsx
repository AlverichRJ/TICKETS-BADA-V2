export function SettingsPage() {
  return (
    <section className="page-stack">
      <header className="page-header"><div><span className="eyebrow">SYSTEM_CONFIG</span><h2>Sistema</h2></div><p>Configuración operativa para despliegue local.</p></header>
      <div className="panel doc-panel">
        <h3>Entorno esperado</h3>
        <p>Esta instancia está preparada para Ubuntu local, DDNS, Nginx, PM2, MySQL y Google OAuth en HTTP.</p>
        <code>PUBLIC_APP_URL=http://ticketsbd.ddns.net</code>
      </div>
    </section>
  );
}
