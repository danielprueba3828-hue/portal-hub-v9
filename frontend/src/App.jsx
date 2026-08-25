import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import MobileBottomNav from './components/layout/MobileBottomNav';
import PoliticaPrivacidadModal from './components/layout/PoliticaPrivacidadModal';
import CambiarPasswordModal from './components/layout/CambiarPasswordModal';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Personal from './pages/Personal';
import Calendario from './pages/Calendario';
import Bitacoras from './pages/Bitacoras';
import GestionMetas from './pages/GestionMetas';
import AutomatizacionesN8N from './pages/AutomatizacionesN8N';

function AuthGuard({ children }) {
  const { session, user } = useAuthStore();

  if (!session && !user) {
    return <Navigate to="/login" replace />;
  }

  const isDirectivo = ['jefe', 'subjefe', 'tercer', 'supervisor', 'admin'].some(r => 
    (user?.user_metadata?.cargo || '').toLowerCase().includes(r) || (user?.user_metadata?.rol || '').toLowerCase().includes(r)
  );
  const isOmitted = sessionStorage.getItem(`omit_password_change_${user?.user_metadata?.cedula}`) === 'true';
  const shouldPromptPassword = isDirectivo && !isOmitted && user?.user_metadata?.debe_cambiar_password === true;

  return (
    <>
      <div className="pb-20 md:pb-0">
        {children}
      </div>
      <MobileBottomNav />
      <PoliticaPrivacidadModal />
      {shouldPromptPassword && (
        <CambiarPasswordModal
          isOpen={true}
          isForceChange={true}
          onClose={() => {}}
        />
      )}
    </>
  );
}

export default function App() {
  const { checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta de Login */}
        <Route path="/login" element={<Login />} />

        {/* Ruta Principal Protegida */}
        <Route 
          path="/" 
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } 
        />

        {/* Sección Dedicada de Horarios */}
        <Route 
          path="/horarios" 
          element={
            <AuthGuard>
              <Calendario />
            </AuthGuard>
          } 
        />
        <Route 
          path="/calendario" 
          element={
            <AuthGuard>
              <Calendario />
            </AuthGuard>
          } 
        />

        {/* Sección Dedicada de Gestión de Metas */}
        <Route 
          path="/metas" 
          element={
            <AuthGuard>
              <GestionMetas />
            </AuthGuard>
          } 
        />

        {/* Sección Dedicada de Bitácoras & Bodega */}
        <Route 
          path="/bitacoras" 
          element={
            <AuthGuard>
              <Bitacoras />
            </AuthGuard>
          } 
        />
        <Route 
          path="/bodega" 
          element={
            <AuthGuard>
              <Bitacoras />
            </AuthGuard>
          } 
        />
        <Route 
          path="/bodega-admin" 
          element={
            <AuthGuard>
              <Bitacoras />
            </AuthGuard>
          } 
        />

        {/* Sección Dedicada de Gestión de Personal */}
        <Route 
          path="/personal" 
          element={
            <AuthGuard>
              <Personal />
            </AuthGuard>
          } 
        />

        {/* Sección de Automatizaciones & Webhooks n8n */}
        <Route 
          path="/automatizaciones" 
          element={
            <AuthGuard>
              <AutomatizacionesN8N />
            </AuthGuard>
          } 
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
