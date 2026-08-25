import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BitacoraNueva from './BitacoraNueva';
import BitacoraAdmin from './BitacoraAdmin';
import BodegaAdmin from './BodegaAdmin';
import BitacorasSelectorNav from '../components/BitacorasSelectorNav';
import { Send, ClipboardCheck, Warehouse, ChevronRight } from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { getEmployeeTheme } from '../utils/themeHelper';

export default function BitacorasHub() {
  const [activeTab, setActiveTab] = useState('hub');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme: activeTheme } = useThemeStore();
  const myTheme = getEmployeeTheme(user?.user_metadata?.cargo || 'Asesor', user?.user_metadata?.nombres || '');
  const tc = getThemeClasses(activeTheme, myTheme);

  if (activeTab === 'nueva') return <BitacoraNueva hideHeaderNav={false} />;
  if (activeTab === 'jefes') return <BitacoraAdmin hideHeaderNav={false} />;
  if (activeTab === 'bodega') return <BodegaAdmin hideHeaderNav={false} />;

  return (
    <div className="space-y-6">
      {/* Top Bar Selector */}
      <BitacorasSelectorNav activeTab="hub" />

      {/* Hero Header */}
      <div className="text-center md:text-left">
        <h1 className={`text-2xl sm:text-3xl font-title font-black uppercase tracking-wider ${tc.textPrimary}`}>
          Módulo de Bitácoras de Tienda
        </h1>
        <p className={`text-xs mt-1 max-w-2xl ${tc.textMuted}`}>
          Selecciona la acción que deseas realizar: enviar tu reporte diario de turno o auditar los registros recibidos de jefatura y bodega.
        </p>
      </div>

      {/* Grid de 3 Tarjetas Interactivas de Selección */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        
        {/* Card 1: Enviar Bitácora */}
        <button
          onClick={() => navigate('/bitacora/nueva')}
          className={`p-6 rounded-3xl border text-left shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group cursor-pointer ${
            activeTheme === 'oscuro'
              ? 'bg-slate-900/80 border-slate-800/90 hover:border-emerald-500/50'
              : 'bg-white border-slate-200/80 hover:border-emerald-500/50'
          }`}
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 mb-4 group-hover:scale-110 transition-transform">
              <Send className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Formulario de Turno
            </span>
            <h3 className={`text-lg font-title font-black mt-3 group-hover:text-emerald-400 transition-colors ${tc.textPrimary}`}>
              Enviar Bitácora de Turno
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Completa el reporte de actividades, metas de la jornada, novedades administrativas y evidencias al cierre de turno.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800/40 text-xs font-extrabold text-emerald-400">
            <span>Iniciar Reporte</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 2: Bitácora de Jefes */}
        <button
          onClick={() => navigate('/bitacora/admin')}
          className={`p-6 rounded-3xl border text-left shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group cursor-pointer ${
            activeTheme === 'oscuro'
              ? 'bg-slate-900/80 border-slate-800/90 hover:border-sky-500/50'
              : 'bg-white border-slate-200/80 hover:border-sky-500/50'
          }`}
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-500/20 mb-4 group-hover:scale-110 transition-transform">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
              Reportes de Jefatura
            </span>
            <h3 className={`text-lg font-title font-black mt-3 group-hover:text-sky-400 transition-colors ${tc.textPrimary}`}>
              Bitácora de Jefes Recibidas
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Revisa la bandeja de bitácoras enviadas por los jefes y subjefes de tienda, firma el visto bueno y audita evidencias.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800/40 text-xs font-extrabold text-sky-400">
            <span>Consultar Bandeja</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 3: Bitácora de Bodega */}
        <button
          onClick={() => navigate('/bodega/admin')}
          className={`p-6 rounded-3xl border text-left shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group cursor-pointer ${
            activeTheme === 'oscuro'
              ? 'bg-slate-900/80 border-slate-800/90 hover:border-indigo-500/50'
              : 'bg-white border-slate-200/80 hover:border-indigo-500/50'
          }`}
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 mb-4 group-hover:scale-110 transition-transform">
              <Warehouse className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              Reportes de Bodeguero
            </span>
            <h3 className={`text-lg font-title font-black mt-3 group-hover:text-indigo-400 transition-colors ${tc.textPrimary}`}>
              Bitácora de Bodega
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Supervisa las novedades diarias de bodega, recepción de camión, control de video y faltantes de mercadería.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800/40 text-xs font-extrabold text-indigo-400">
            <span>Consultar Bodega</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

      </div>
    </div>
  );
}
