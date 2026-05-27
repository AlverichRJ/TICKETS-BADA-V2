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
    { to: '/inventario', label: 'Inventario', icon: Wrench },
    ...(user.role === 'admin' ? [{ to: '/usuarios', label: 'Usuarios', icon: Users }, { to: '/configuracion', label: 'Sistema', icon: Settings }] : [])
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="eyebrow">BADABUN · LOCAL</span>
          <strong>Tickets</strong>
          <small>Inventario y soporte interno</small>
        </div>
        <nav className="nav-list">
          {items.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'}><item.icon size={18} />{item.label}</NavLink>)}
        </nav>
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
