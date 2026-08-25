import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import CambiarPasswordModal from './CambiarPasswordModal';
import NotificationCenter from './NotificationCenter';
import { 
  LogOut, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Clock, 
  LayoutDashboard, 
  Users,
  Calendar,
  ClipboardList,
  Package,
  Target,
  Menu,
  X,
  UserCheck,
  Key
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [time, setTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const isLight = theme === 'clasico';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const myNombres = user?.user_metadata?.nombres || 'Colaborador';
  const myApellidos = user?.user_metadata?.apellidos || '';
  const myCargo = user?.user_metadata?.cargo || 'Asesor de Ventas';
  const isDirectivo = ['jefe', 'subjefe', 'tercer', 'supervisor', 'admin'].some(r => 
    (myCargo || '').toLowerCase().includes(r)
  );
  const isBodeguero = ['bodega', 'bodeguero', 'asistente de bodega'].some(r => 
    (myCargo || '').toLowerCase().includes(r) || (user?.user_metadata?.zona || '').toLowerCase().includes('bodega')
  );
  const formattedTime = time.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  // Iniciales
  const initials = `${(myNombres || '').charAt(0)}${(myApellidos || '').charAt(0)}` || 'MP';

  return (
    <header className={`sticky top-0 z-50 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b backdrop-blur-xl transition-colors ${
      isLight ? 'bg-white/95 border-slate-200 shadow-xs' : 'bg-slate-950/95 border-slate-800/80 shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Logo & Store Identity */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <NavLink to="/" className="flex items-center gap-2 sm:gap-3 group">
            <img 
              src="/logo.png" 
              alt="Logo Portal Marathon" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform" 
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-title font-black text-sm sm:text-base tracking-tight uppercase">PORTAL HUB V9</span>
                <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  MCP1
                </span>
              </div>
              <p className={`text-[10px] sm:text-[11px] font-semibold truncate max-w-[120px] sm:max-w-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Portal Shopping Carapungo
              </p>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 pl-4 border-l border-slate-700/50">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Inicio</span>
            </NavLink>

            <NavLink
              to="/horarios"
              className={({ isActive }) => `px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Horarios</span>
            </NavLink>

            {/* Metas para Jefatura y Asesores de Ventas */}
            {(!isBodeguero || isDirectivo) && (
              <NavLink
                to="/metas"
                className={({ isActive }) => `px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                    : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Metas</span>
              </NavLink>
            )}

            {/* Opciones exclusivas de Jefatura */}
            {isDirectivo && (
              <>
                <NavLink
                  to="/bitacoras"
                  className={({ isActive }) => `px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Bitácoras</span>
                </NavLink>

                <NavLink
                  to="/personal"
                  className={({ isActive }) => `px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Personal</span>
                </NavLink>
              </>
            )}

            {/* Opción exclusiva de Bodega para Bodegueros */}
            {isBodeguero && !isDirectivo && (
              <NavLink
                to="/bitacoras"
                className={({ isActive }) => `px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/25'
                    : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Reportes Bodega</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 relative">
          
          {/* Live Clock Badge (Desktop) */}
          <div className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
            isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{formattedTime}</span>
          </div>

          {/* Centro de Notificaciones con Campanita */}
          <NotificationCenter />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title="Cambiar tema"
          >
            {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* User Profile Avatar Pill (Clickeable para abrir menú de usuario / Cerrar sesión) */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-2xl border transition-all cursor-pointer active:scale-95 select-none ${
              mobileMenuOpen 
                ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-500/10' 
                : isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200' : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800'
            }`}
            title="Ver perfil / Cerrar Sesión"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-md">
              {initials}
            </div>
            <div className="hidden sm:block text-left pr-1">
              <span className="text-xs font-extrabold block leading-tight">{myNombres.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{myCargo}</span>
            </div>
          </button>

          {/* Dropdown de Usuario / Cerrar Sesión (Aparece al presionar las iniciales) */}
          {mobileMenuOpen && (
            <div 
              className={`absolute right-0 top-12 z-50 w-64 p-3.5 rounded-2xl border shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60' 
                  : 'bg-slate-900 border-slate-800 text-white shadow-black/80'
              }`}
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800/60">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black truncate">{myNombres} {myApellidos}</div>
                  <div className="text-[10px] text-slate-400 font-semibold truncate">{myCargo}</div>
                  <div className="text-[9px] text-blue-400 font-bold mt-0.5">Portal Carapungo (MCP1)</div>
                </div>
              </div>

              <div className="pt-3 space-y-2">
                {isDirectivo && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowPasswordModal(true);
                    }}
                    className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                      isLight 
                        ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700' 
                        : 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Cambiar mi Contraseña</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Modal para cambio de contraseña */}
      <CambiarPasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        isForceChange={false}
      />
    </header>
  );
}
