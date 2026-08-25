import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Send, ClipboardCheck, Store, ChevronRight } from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';
import { useAuthStore } from '../store/authStore';

export default function BitacoraHub() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme: activeTheme } = useThemeStore();
  const myTheme = getEmployeeTheme(user?.user_metadata?.cargo || 'Asesor de Ventas', user?.user_metadata?.nombres || '');
  const tc = getThemeClasses(activeTheme, myTheme);

  const isDark = activeTheme === 'oscuro';

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-10 animate-fade-in">
      
      {/* 1. Header Banner Superior (Centro de Bitácoras de Tienda) */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 ${
        isDark 
          ? 'bg-[#0f172a]/90 border-slate-800/80 shadow-slate-950/50' 
          : 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/90 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl md:text-2xl font-title font-black uppercase tracking-wider text-white">
                Centro de Bitácoras de Tienda
              </h1>
              <span className="bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Módulo Único
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-1">
              Elige si deseas enviar un reporte de turno, consultar bitácoras de jefes o revisar bodega
            </p>
          </div>
        </div>

        {/* Las opciones redundantes superiores fueron eliminadas según la indicación del usuario */}
      </div>

      {/* 2. Sección Principal de Selección */}
      <div className="space-y-6">
        <div className="text-left space-y-1">
          <h2 className={`text-2xl md:text-3xl font-title font-black uppercase tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Módulo de Bitácoras de Tienda
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-semibold">
            Selecciona la acción que deseas realizar: enviar tu reporte diario de turno o auditar los registros recibidos de jefatura y bodega.
          </p>
        </div>

        {/* 3 Grid de las 3 Opciones de Tarjeta Gran Formato */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Card 1: Enviar Bitácora de Turno */}
          <div 
            onClick={() => navigate('/bitacora/nueva')}
            className={`group cursor-pointer p-6 md:p-8 rounded-3xl border transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] ${
              isDark 
                ? 'bg-[#0f172a]/70 border-slate-800 hover:border-emerald-500/50 hover:bg-[#0f172a]/90 hover:shadow-2xl hover:shadow-emerald-500/10' 
                : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-xl'
            }`}
          >
            <div className="space-y-6 text-left">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform">
                <Send className="w-7 h-7 text-emerald-400" />
              </div>

              <div>
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider inline-block">
                  Formulario de Turno
                </span>
                <h3 className={`text-xl font-title font-black mt-3 transition-colors ${
                  isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
                }`}>
                  Enviar Bitácora de Turno
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">
                  Completa el reporte de actividades, metas de la jornada, novedades administrativas y evidencias al cierre de turno.
                </p>
              </div>
            </div>

            <div className="pt-8 flex items-center justify-between text-emerald-400 font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Iniciar Reporte</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Bitácora de Jefes Recibidas */}
          <div 
            onClick={() => navigate('/bitacora/admin')}
            className={`group cursor-pointer p-6 md:p-8 rounded-3xl border transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] ${
              isDark 
                ? 'bg-[#0f172a]/70 border-slate-800 hover:border-blue-500/50 hover:bg-[#0f172a]/90 hover:shadow-2xl hover:shadow-blue-500/10' 
                : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-xl'
            }`}
          >
            <div className="space-y-6 text-left">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-7 h-7 text-blue-400" />
              </div>

              <div>
                <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider inline-block">
                  Reportes de Jefatura
                </span>
                <h3 className={`text-xl font-title font-black mt-3 transition-colors ${
                  isDark ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                }`}>
                  Bitácora de Jefes Recibidas
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">
                  Revisa la bandeja de bitácoras enviadas por los jefes y subjefes de tienda, firma el visto bueno y audita evidencias.
                </p>
              </div>
            </div>

            <div className="pt-8 flex items-center justify-between text-blue-400 font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Consultar Bandeja</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Bitácora de Bodega */}
          <div 
            onClick={() => navigate('/bodega/admin')}
            className={`group cursor-pointer p-6 md:p-8 rounded-3xl border transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] ${
              isDark 
                ? 'bg-[#0f172a]/70 border-slate-800 hover:border-purple-500/50 hover:bg-[#0f172a]/90 hover:shadow-2xl hover:shadow-purple-500/10' 
                : 'bg-white border-slate-200 hover:border-purple-500 hover:shadow-xl'
            }`}
          >
            <div className="space-y-6 text-left">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10 group-hover:scale-110 transition-transform">
                <Store className="w-7 h-7 text-purple-400" />
              </div>

              <div>
                <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider inline-block">
                  Reportes de Bodeguero
                </span>
                <h3 className={`text-xl font-title font-black mt-3 transition-colors ${
                  isDark ? 'text-white group-hover:text-purple-400' : 'text-slate-900 group-hover:text-purple-600'
                }`}>
                  Bitácora de Bodega
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">
                  Supervisa las novedades diarias de bodega, recepción de camión, control de video y faltantes de mercadería.
                </p>
              </div>
            </div>

            <div className="pt-8 flex items-center justify-between text-purple-400 font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Consultar Bodega</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
