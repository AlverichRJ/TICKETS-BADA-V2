import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  useEffect(() => {
    refresh().then(() => navigate('/tickets', { replace: true }));
  }, []);
  return <div className="boot">Validando sesión con Google...</div>;
}
