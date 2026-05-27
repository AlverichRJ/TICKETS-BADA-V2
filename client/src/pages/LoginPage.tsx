import { ShieldCheck } from 'lucide-react';
import { BlueprintPanel } from '../components/BlueprintPanel';

export function LoginPage() {
  return (
    <main className="login-screen">
      <section className="login-copy">
        <p className="eyebrow">SERVIDOR LOCAL · DDNS · GOOGLE OAUTH</p>
        <h1>Sistema interno para tickets e inventario.</h1>
        <p className="login-description">Acceso controlado por roles. Los usuarios crean y consultan tickets; administración gestiona inventario, usuarios, documentos y cierre técnico.</p>
        <a className="google-button" href="/api/auth/google">
          <ShieldCheck size={19} />
          Iniciar sesión con Google
        </a>
        <p className="access-note">Acceso exclusivo para personal autorizado de BADABUN.</p>
      </section>
      <BlueprintPanel />
    </main>
  );
}
