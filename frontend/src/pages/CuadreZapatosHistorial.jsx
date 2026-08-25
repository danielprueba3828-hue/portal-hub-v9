import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';
import { useTiendaStore } from '../store/tiendaStore';
import { supabase } from '../lib/supabaseClient';
import {
  History,
  Search,
  Calendar,
  Info,
  FileSpreadsheet
} from 'lucide-react';

export default function CuadreZapatosHistorial({ onTabChange }) {
  const { user } = useAuthStore();
  const { theme: activeTheme } = useThemeStore();
  const { tiendaSeleccionada } = useTiendaStore();
  const navigate = useNavigate();

  const myTheme = getEmployeeTheme(
    user?.user_metadata?.cargo || 'Asesor de Ventas',
    user?.user_metadata?.nombres || '',
    user?.user_metadata?.cargo_anterior || ''
  );
  const tc = getThemeClasses(activeTheme, myTheme);

  const [historyClosures, setHistoryClosures] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  const fetchHistoryClosures = async () => {
    if (!tiendaSeleccionada?.id) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('cuadres_zapatos')
        .select('id, fecha, colaborador, total_solicitados, total_conciliados, total_faltantes, total_ventas, total_tipeo, total_floor_devoluciones, total_ajustes_manuales, total_ingresos, total_garantias, created_at')
        .eq('tienda_id', tiendaSeleccionada.id)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setHistoryClosures(data || []);
    } catch (err) {
      console.error("Error al obtener historial de cierres:", err);
      alert("Error al cargar historial: " + err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (tiendaSeleccionada?.id) {
      fetchHistoryClosures();
    }
  }, [tiendaSeleccionada]);

  const handleLoadHistoryDetail = (closure) => {
    if (onTabChange) {
      onTabChange('cuadre', closure.fecha);
    } else {
      navigate(`/bodega/cuadre?fecha=${closure.fecha}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de Página simplificada */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className={`text-xl font-title font-black tracking-wider flex items-center gap-2.5 ${tc.textPrimary}`}>
            <History className="w-6 h-6 text-emerald-500" />
            HISTORIAL DE CIERRES
          </h3>
          <p className={`text-xs mt-0.5 ${tc.textMuted}`}>
            Consulta y filtra los cuadres diarios de zapatos guardados para la tienda {tiendaSeleccionada?.nombre || ''}.
          </p>
        </div>
      </div>
        {/* FILTROS DEL HISTORIAL */}
        <div className={`p-6 ${tc.cardBg} flex flex-col md:flex-row gap-4 items-center`} style={tc.cardBgStyle}>
          {/* Filtro Bodeguero */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de bodeguero..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#050A16]/50 border border-slate-800/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#005cff]/50 transition-all font-semibold text-sm"
            />
          </div>
          
          {/* Filtro Fecha */}
          <div className="flex items-center gap-2 bg-[#050A16]/50 border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-inner w-full md:w-auto">
            <Calendar className="w-4 h-4 text-slate-450" />
            <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider whitespace-nowrap">Fecha Cierre:</span>
            <input
              type="date"
              value={historyDateFilter}
              onChange={(e) => setHistoryDateFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-bold outline-none border-none cursor-pointer w-full md:w-auto"
            />
          </div>

          {/* Limpiar Filtros */}
          {(historySearch || historyDateFilter) && (
            <button
              onClick={() => {
                setHistorySearch('');
                setHistoryDateFilter('');
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer border border-slate-700"
            >
              Limpiar Filtros
            </button>
          )}
        </div>

        {/* LISTADO DE CIERRES */}
        <div className={`p-6 ${tc.cardBg}`} style={tc.cardBgStyle}>
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
              <span className="text-slate-400 text-xs font-semibold">Cargando historial de cierres...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-left" style={tc.tableHeaderStyle}>
                    <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Fecha Cierre</th>
                    <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Bodeguero / Responsable</th>
                    <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText} text-center`}>Eficiencia</th>
                    <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText} text-center`}>Solicitados</th>
                    <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText} text-center`}>Conciliados</th>
                    <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText} text-center`}>Faltantes</th>
                    <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Desglose</th>
                    <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText} text-center`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = historyClosures.filter((c) => {
                      const matchesSearch = c.colaborador?.toLowerCase().includes(historySearch.toLowerCase());
                      const matchesDate = historyDateFilter ? c.fecha === historyDateFilter : true;
                      return matchesSearch && matchesDate;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 font-semibold">
                            No se encontraron cierres guardados que coincidan con los filtros.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((closure) => {
                      const eficiencia = ((closure.total_conciliados / closure.total_solicitados) * 100 || 0).toFixed(1);
                      return (
                        <tr key={closure.id} className={`border-b border-slate-800/50 transition-colors ${tc.tableRowHover}`}>
                          {/* Fecha */}
                          <td className="p-4 text-xs font-bold text-white tracking-wider">
                            {new Date(closure.fecha + 'T12:00:00').toLocaleDateString('es-EC', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </td>
                          {/* Responsable */}
                          <td className="p-4 text-xs font-semibold text-slate-350">{closure.colaborador}</td>
                          {/* Eficiencia */}
                          <td className="p-4 text-xs text-center">
                            <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                              parseFloat(eficiencia) >= 95
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : parseFloat(eficiencia) >= 80
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
                                : 'bg-red-500/10 border border-red-500/30 text-red-400'
                            }`}>
                              {eficiencia}%
                            </span>
                          </td>
                          {/* Solicitados */}
                          <td className="p-4 text-xs text-center font-bold text-blue-400">{closure.total_solicitados}</td>
                          {/* Conciliados */}
                          <td className="p-4 text-xs text-center font-bold text-emerald-400">{closure.total_conciliados}</td>
                          {/* Faltantes */}
                          <td className="p-4 text-xs text-center font-bold text-red-450">{closure.total_faltantes}</td>
                          {/* Desglose */}
                          <td className="p-4 text-xs text-slate-400 font-medium">
                            <div className="flex flex-wrap gap-2 text-[10px]">
                              <span>Vta: <strong className="text-white">{closure.total_ventas || 0}</strong></span>
                              <span>Tipeo: <strong className="text-white">{closure.total_tipeo || 0}</strong></span>
                              <span>Piso: <strong className="text-white">{closure.total_floor_devoluciones || 0}</strong></span>
                              {closure.total_ajustes_manuales > 0 && (
                                <span>Aj: <strong className="text-purple-400">{closure.total_ajustes_manuales}</strong></span>
                              )}
                            </div>
                          </td>
                          {/* Acciones */}
                          <td className="p-4 text-xs text-center">
                            <button
                              onClick={() => handleLoadHistoryDetail(closure)}
                              className="px-3 py-1.5 bg-[#005cff] hover:bg-[#004BCA] text-white font-bold rounded-xl transition-all cursor-pointer text-[10px]"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* NOTA DE INFORMACIÓN */}
      <div className="mt-8 flex items-start gap-3 bg-slate-900/10 border border-slate-800/60 p-4 rounded-2xl">
        <Info className="w-5 h-5 text-[#005cff] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 font-medium">
          <p className="font-extrabold text-slate-300 mb-1">Sobre el listado:</p>
          Este historial muestra todos los cierres de calzado diarios almacenados en el sistema. Puedes hacer clic en "Ver Detalle" para analizar la conciliación específica de cualquier fecha.
        </div>
      </div>
    </div>
  );
}
