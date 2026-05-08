/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * Esta aplicación usa sidebar persistente, folios monoespaciados, superficies tipo expediente
 * y acentos azul acero para reforzar una consola interna precisa.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { TicketsPage } from './pages/TicketsPage';
import { NewTicketPage } from './pages/NewTicketPage';
import { InventoryPage } from './pages/InventoryPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';

function Protected({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot">Cargando sesión...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/tickets" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/" element={<Protected><DashboardLayout /></Protected>}>
        <Route index element={<Navigate to="/tickets" replace />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/new" element={<NewTicketPage />} />
        <Route path="inventory" element={<Protected adminOnly><InventoryPage /></Protected>} />
      </Route>
    </Routes>
  );
}
