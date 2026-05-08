/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * El layout concentra navegación lateral, identidad de sistema local y jerarquía operativa.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { Boxes, LogOut, PlusCircle, Ticket, UsersRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { canManageAdminModules } from '../lib/permissions';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const canSeeAdminModules = canManageAdminModules(user);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">SYS</span><strong>Tickets<br />Inventario</strong></div>
        <nav>
          <NavLink to="/tickets"><Ticket size={18}/> Tickets</NavLink>
          <NavLink to="/tickets/new"><PlusCircle size={18}/> Nuevo ticket</NavLink>
          {canSeeAdminModules && <NavLink to="/inventory"><Boxes size={18}/> Inventario</NavLink>}
          {canSeeAdminModules && <NavLink to="/admin/users"><UsersRound size={18}/> Usuarios</NavLink>}
        </nav>
        <div className="sessionCard">
          <span>{user?.role}</span>
          <strong>{user?.name}</strong>
          <small>{user?.email}</small>
          <button onClick={logout}><LogOut size={16}/> Salir</button>
        </div>
      </aside>
      <main className="workspace"><Outlet /></main>
    </div>
  );
}
