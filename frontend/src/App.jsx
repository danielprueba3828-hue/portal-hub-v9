import React, { useEffect, Component } from 'react';
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

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060b17] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-4 rounded-3xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight">Ocurrió un inconveniente al cargar esta sección</h2>
          <p className="text-xs text-slate-400 max-w-md">
            {this.state.error?.message || 'Error inesperado de renderizado'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/25 transition active:scale-95 cursor-pointer"
          >
            Recargar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
    </ErrorBoundary>
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
