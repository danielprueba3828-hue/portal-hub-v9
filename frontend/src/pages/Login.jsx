import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, session, error: authError, loading } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const isLight = theme === 'clasico';

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = cedula.trim();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setError('Por favor, ingresa tu cédula o correo.');
      return;
    }

    if (!cleanPass) {
      setError('Por favor, ingresa tu contraseña.');
      return;
    }

    await login(cleanUser, cleanPass);
  };

  const handleQuickLogin = (quickCedula) => {
    setCedula(quickCedula);
    setPassword(quickCedula);
    login(quickCedula, quickCedula);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${
      isLight 
        ? 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 text-slate-900' 
        : 'bg-gradient-to-br from-[#060b17] via-[#0b1426] to-[#040812] text-white'
    }`}>
      {/* Background Decorative Glow Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none"></div>

      {/* Top Controls: Theme Switch */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold shadow-md ${
            isLight
              ? 'bg-white/80 border-slate-300 text-slate-700 hover:bg-white'
              : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Cambiar tema"
        >
          {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          <span className="hidden sm:inline">{isLight ? 'Modo Oscuro' : 'Modo Claro'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl backdrop-blur-2xl relative z-10 animate-fade-in transition-all ${
        isLight
          ? 'bg-white/90 border-slate-200/80 shadow-slate-300/60'
          : 'bg-slate-900/85 border-slate-800/90 shadow-black/80'
      }`}>
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <img 
              src="/logo.png" 
              alt="Logo Portal Marathon" 
              className="w-18 h-18 sm:w-20 sm:h-20 object-contain drop-shadow-2xl hover:scale-105 transition-transform" 
            />
          </div>
          <h1 className={`text-2xl font-title font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            PORTAL HUB V9
          </h1>
          <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Portal Shopping Carapungo • MCP1
          </p>
        </div>

        {/* Error Alert */}
        {(error || authError) && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-start gap-3 animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">No se pudo ingresar</p>
              <p className="mt-0.5 font-normal opacity-90">{error || authError}</p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Cédula o Correo Electrónico
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Ej: 1714768486"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-semibold outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white'
                    : 'bg-slate-950/70 border-slate-700 text-white focus:border-blue-500 focus:bg-slate-950'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className={`w-full pl-10 pr-11 py-3 rounded-2xl border text-sm font-semibold outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white'
                    : 'bg-slate-950/70 border-slate-700 text-white focus:border-blue-500 focus:bg-slate-950'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-blue-500/25 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Informativo */}
        <div className="mt-8 pt-4 border-t border-slate-800/40 text-center">
          <p className={`text-[11px] font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Acceso seguro institucional con cédula de identidad
          </p>
        </div>

      </div>
    </div>
  );
}
