export function BlueprintPanel() {
  return (
    <aside className="blueprint-panel" aria-hidden="true">
      <div className="blueprint-grid" />
      <div className="blueprint-card ticket-card">
        <span>// CONTROL_BACKEND</span>
        <strong>TK-0001</strong>
        <small>STATUS · IN_PROGRESS</small>
      </div>
      <div className="blueprint-card asset-card">
        <span>AS-1192</span>
        <small>TYPE · SWITCH</small>
        <small>LOCATION · RACK-B7</small>
        <small>STATE · AVAILABLE</small>
      </div>
      <div className="blueprint-card folio-card">
        <span>TICKET_FOLIO</span>
        <strong>TK-001</strong>
        <small>PRIORITY · HIGH</small>
        <small>CATEGORY · HARDWARE</small>
      </div>
      <div className="blueprint-node n1" />
      <div className="blueprint-node n2" />
      <div className="blueprint-node n3" />
    </aside>
  );
}
