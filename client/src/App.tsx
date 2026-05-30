import { Navigate, Route, Routes } from 'react-router-dom';
import { trpc } from './_core/trpc';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { DigitalServicesPage } from './pages/DigitalServicesPage';
import { InventoryPage } from './pages/InventoryPage';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { TicketsPage } from './pages/TicketsPage';
import { UsersPage } from './pages/UsersPage';

function ProtectedApp() {
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  if (me.isLoading) return <div className="loading-screen">Verificando sesión...</div>;
  if (me.isError || !me.data) return <Navigate to="/login" replace />;
  return <Layout user={me.data} />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedApp />}>
        <Route index element={<DashboardPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="inventario" element={<InventoryPage />} />
        <Route path="servicios-digitales" element={<DigitalServicesPage />} />
        <Route path="usuarios" element={<UsersPage />} />
        <Route path="configuracion" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
