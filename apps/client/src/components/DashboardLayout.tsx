/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * El layout concentra navegación lateral, identidad de sistema local y jerarquía operativa.
 */
import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Boxes, LogOut, PlusCircle, Settings, Ticket, UsersRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { canManageAdminModules } from '../lib/permissions';
import { buildSystemLogoUrl, defaultSystemSetting, fetchSystemSetting, type SystemSetting } from '../lib/system-settings';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const canSeeAdminModules = canManageAdminModules(user);
  const [systemSetting, setSystemSetting] = useState<SystemSetting>(defaultSystemSetting);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const logoUrl = buildSystemLogoUrl(systemSetting.logoUrl);

  useEffect(() => {
    let mounted = true;
    const refreshSystemSetting = async () => {
      try {
        const nextSetting = await fetchSystemSetting();
        if (mounted) {
          setSystemSetting(nextSetting);
          setLogoLoadFailed(false);
        }
      } catch {
        if (mounted) setSystemSetting(defaultSystemSetting);
      }
    };

    refreshSystemSetting();
    window.addEventListener('system-settings-updated', refreshSystemSetting);
    return () => {
      mounted = false;
      window.removeEventListener('system-settings-updated', refreshSystemSetting);
    };
  }, []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">
            {logoUrl && !logoLoadFailed ? <img src={logoUrl} alt="Logo del sistema" onError={() => setLogoLoadFailed(true)} /> : 'SYS'}
          </span>
          <strong>{systemSetting.appName}</strong>
        </div>
        <nav>
          <NavLink to="/tickets"><Ticket size={18}/> Tickets</NavLink>
          <NavLink to="/tickets/new"><PlusCircle size={18}/> Nuevo ticket</NavLink>
          {canSeeAdminModules && <NavLink to="/inventory"><Boxes size={18}/> Inventario</NavLink>}
          {canSeeAdminModules && <NavLink to="/admin/users"><UsersRound size={18}/> Usuarios</NavLink>}
          {canSeeAdminModules && <NavLink to="/admin/settings"><Settings size={18}/> Sistema</NavLink>}
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
