import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, LogOut, Settings, Ticket, Users, Wrench } from 'lucide-react';
import { trpc } from '../_core/trpc';

type LayoutProps = {
  user: { name: string; email: string; role: 'admin' | 'user'; avatarUrl?: string | null };
};

export function Layout({ user }: LayoutProps) {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate('/login');
    }
  });

  const items = [
    { to: '/', label: 'Dashboard', icon: Boxes },
    { to: '/tickets', label: 'Tickets', icon: Ticket },
    ...(user.role === 'admin' ? [
      { to: '/inventario', label: 'Inventario', icon: Wrench },
      { to: '/usuarios', label: 'Usuarios', icon: Users },
      { to: '/configuracion', label: 'Sistema', icon: Settings }
    ] : [])
  ];

  return (
    <div className="app-shell blueprint-app-shell">
      <aside className="sidebar blueprint-sidebar">
        <div className="brand-block">
          <span className="eyebrow">BADABUN · LOCAL</span>
          <strong>Tickets</strong>
          <small>Soporte técnico interno</small>
        </div>
        <nav className="nav-list">
          {items.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'}><item.icon size={18} />{item.label}</NavLink>)}
        </nav>
        <div className="sidebar-blueprint-note">
          <span>TK-BADA</span>
          <strong>{user.role === 'admin' ? 'CONTROL TOTAL' : 'VISTA PERSONAL'}</strong>
          <small>{user.role === 'admin' ? 'Todos los tickets y módulos administrativos.' : 'Creación y consulta de tickets propios.'}</small>
        </div>
        <div className="user-card">
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <em>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</em>
          </div>
          <button onClick={() => logout.mutate()} className="icon-button" title="Cerrar sesión"><LogOut size={18} /></button>
        </div>
      </aside>
      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  );
}
