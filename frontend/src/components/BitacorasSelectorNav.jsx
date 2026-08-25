import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ClipboardCheck, Warehouse, Send } from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { getEmployeeTheme } from '../utils/themeHelper';

export default function BitacorasSelectorNav({ activeTab = 'jefes' }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme: activeTheme } = useThemeStore();
  const myTheme = getEmployeeTheme(user?.user_metadata?.cargo || 'Asesor', user?.user_metadata?.nombres || '');
  const tc = getThemeClasses(activeTheme, myTheme);

  return (
    <div className={`p-4 rounded-3xl border mb-6 shadow-xl transition-all duration-300 ${
      activeTheme === 'oscuro' 
        ? 'bg-slate-900/90 border-slate-800/90 shadow-slate-950/40 backdrop-blur-md' 
        : 'bg-white border-slate-200/80 shadow-slate-200/50'
    }`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Título e Icono del Centro de Bitácoras */}
        <div className="flex items-start sm:items-center space-x-3.5 min-w-0 w-full lg:w-auto">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-sky-500/20 flex-shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-base font-extrabold uppercase tracking-wider ${tc.textPrimary}`}>
                Centro de Bitácoras de Tienda
              </h2>
              <span className="text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
                Módulo Único
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5 leading-snug">
              Elige si deseas enviar un reporte de turno, consultar bitácoras de jefes o revisar bodega
            </p>
          </div>
        </div>

        {/* Opciones redundantes superiores eliminadas */}
      </div>
    </div>
  );
}
