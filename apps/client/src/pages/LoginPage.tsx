/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * Login con composición asimétrica, imagen técnica generada y acceso Google OAuth externo.
 */
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const hero = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663544686165/ddias5Q8vyPdjBP2SBrsSn/tickets_inventory_command_wall-LjW26uSB2VNrNmNezfNPmS.webp';

export function LoginPage() {
  const { login } = useAuth();
  return (
    <div className="loginGrid">
      <section className="loginPanel">
        <p className="eyebrow">Servidor local · DDNS · Google OAuth</p>
        <h1>Sistema interno para tickets e inventario.</h1>
        <p className="lead">Acceso controlado por roles. Los usuarios crean y consultan sus tickets; administración gestiona inventario, documentos y cierre técnico.</p>
        <button className="primaryAction" onClick={login}><ShieldCheck size={18}/> Iniciar sesión con Google</button>
      </section>
      <section className="heroPanel" style={{ backgroundImage: `url(${hero})` }}>
        <div className="heroOverlay"><span>// CONTROL_BACKEND</span><strong>TK-001</strong><small>Validaciones críticas en servidor</small></div>
      </section>
    </div>
  );
}
