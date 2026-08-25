import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import {
  Warehouse, 
  Search, 
  RefreshCw, 
  Calendar, 
  User, 
  Paperclip, 
  ChevronRight, 
  X, 
  FileSpreadsheet, 
  AlertTriangle, 
  Clock, 
  Video, 
  FileText, 
  Check,
  CheckSquare,
  Send,
  Trash2,
  Loader2
} from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';
import BitacorasSelectorNav from '../components/BitacorasSelectorNav';

const ROLES_LITERAL = [
  { id: "Supervisor", label: "Supervisor" },
  { id: "Jefe de Tienda", label: "Jefe de Tienda" },
  { id: "Subjefe de Tienda", label: "Subjefe de Tienda" },
  { id: "Tercero a bordo", label: "Tercer a bordo" }
];

const BODEGUEROS_LITERAL = [
  { id: "JOSE DANIEL LUNA ENRIQUEZ", label: "Jose Luna" },
  { id: "ANTONY STIVEN GAONA JIMENEZ", label: "Antony Gaona" },
  { id: "BRAYAN STIK NIETO RAMIREZ", label: "Brayan Nieto" }
];

const getEcuadorDateStr = () => {
  try {
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Guayaquil',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toLocaleDateString('sv-SE');
  }
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
};

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const month = months[monthIdx] || '';
  return `${day} de ${month}.`;
};

const generateCommentId = () => `obs-${Math.random().toString(36).substring(2, 9)}`;

export default function BodegaAdmin({ hideHeaderNav = false }) {
  const { user } = useAuthStore();
  const { theme: activeTheme } = useThemeStore();
  const myTheme = getEmployeeTheme(user?.user_metadata?.cargo || 'Asesor de Ventas', user?.user_metadata?.nombres || '');
  const tc = getThemeClasses(activeTheme, myTheme);

  const miRolReal = user?.user_metadata?.rol || 'empleado';
  const miCargoReal = user?.user_metadata?.cargo || 'Asesor';

  // Mapear identidad del usuario activo de forma robusta
  const getMiIdentidad = () => {
    const cargoLower = miCargoReal.toLowerCase();
    const rolLower = miRolReal.toLowerCase();
    
    // 1. Roles de supervisión regional explícita
    if (
      rolLower === 'superadmin' || 
      rolLower === 'regional_supervisor' || 
      rolLower === 'store_supervisor' ||
      rolLower === 'supervisor' ||
      cargoLower.includes('supervisor')
    ) {
      return 'Supervisor';
    }
    
    // 2. Cargos de tienda específicos
    if (cargoLower.includes('tercer') || cargoLower.includes('tercero')) return 'Tercero a bordo';
    if (cargoLower.includes('subjefe')) return 'Subjefe de Tienda';
    if (cargoLower.includes('jefe') || cargoLower.includes('director')) return 'Jefe de Tienda';
    
    // 3. Fallback para rol de administración general (si no es cargo de tienda, es Supervisor)
    if (rolLower === 'admin' || cargoLower.includes('admin')) {
      return 'Supervisor';
    }
    
    return 'Tercero a bordo';
  };

  const miIdentidad = getMiIdentidad();

  // Marcar leído automáticamente cuando se selecciona/abre un reporte de bodega
  const handleSelectReporte = async (item) => {
    setSelectedReporte(item);

    try {
      const actualObs = [...(item.comentarios_jefes || [])];
      let lecturasIdx = actualObs.findIndex(o => o.id === "_lecturas_reporte_");

      if (lecturasIdx === -1) {
        actualObs.push({
          id: "_lecturas_reporte_",
          texto: "",
          autor: "_system_",
          rol: "system",
          creado_en: new Date().toISOString(),
          vistos: []
        });
        lecturasIdx = actualObs.length - 1;
      }

      const vistos = [...(actualObs[lecturasIdx].vistos || [])];
      
      const colaboradorNombreCompleto = `${user?.user_metadata?.nombres || ''} ${user?.user_metadata?.apellidos || ''}`.trim();
      const esBodeguero = BODEGUEROS_LITERAL.some(b => b.id === colaboradorNombreCompleto);
      const targetIdentity = esBodeguero ? colaboradorNombreCompleto : miIdentidad;

      const yaMarcado = vistos.some(v => v.usuario === targetIdentity);

      if (!yaMarcado) {
        vistos.push({
          usuario: targetIdentity,
          rol: esBodeguero ? 'bodeguero' : (miIdentidad === 'Supervisor' ? 'supervisor' : 'jefatura'),
          fecha: new Date().toISOString(),
          marcado_por: colaboradorNombreCompleto
        });

        actualObs[lecturasIdx] = {
          ...actualObs[lecturasIdx],
          vistos
        };

        await saveReporteComentarios(item.id, actualObs);
      }
    } catch (err) {
      console.error("Error al marcar visto de bodega automático:", err);
    }
  };

  // States
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comentarios
  const [newComment, setNewComment] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);

  // Filtros
  const [filterSearch, setFilterSearch] = useState('');
  const [filterTurno, setFilterTurno] = useState('');
  const [filterFecha, setFilterFecha] = useState('mes'); // 'hoy', 'semana', 'mes', 'todas'

  // Modal
  const [selectedReporte, setSelectedReporte] = useState(null);

  // Cargar reportes desde Supabase
  const loadReportes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedTiendaStr = sessionStorage.getItem('portal_selected_tienda');
      let query = supabase.from('reportes_bodega').select('*');
      
      if (selectedTiendaStr) {
        const tienda = JSON.parse(selectedTiendaStr);
        query = query.eq('tienda_id', tienda.id);
      }

      const { data, error: fetchErr } = await query
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      setReportes(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar reportes de bodega.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReportes();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadReportes]);

  // Sincronización en tiempo real para reportes de bodega
  useEffect(() => {
    const channel = supabase
      .channel('realtime-bodega-admin-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reportes_bodega' },
        () => {
          loadReportes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadReportes]);

  // --- LÓGICA DE COMENTARIOS Y CHECK-IN DE BODEGA ---
  const getVistosReporte = (r) => {
    const obs = Array.isArray(r.comentarios_jefes) ? r.comentarios_jefes : [];
    const lect = obs.find(o => o.id === "_lecturas_reporte_");
    return lect?.vistos || [];
  };

  const saveReporteComentarios = async (reporteId, nuevosComentarios) => {
    const { error: updErr } = await supabase
      .from('reportes_bodega')
      .update({ comentarios_jefes: nuevosComentarios })
      .eq('id', reporteId);

    if (updErr) throw updErr;

    // Actualizar estado local
    setReportes(prev => prev.map(r => r.id === reporteId ? { ...r, comentarios_jefes: nuevosComentarios } : r));
    if (selectedReporte && selectedReporte.id === reporteId) {
      setSelectedReporte(prev => ({ ...prev, comentarios_jefes: nuevosComentarios }));
    }
  };

  const toggleVistoReporte = async (roleId) => {
    if (!selectedReporte) return;
    try {
      const actualObs = [...(selectedReporte.comentarios_jefes || [])];
      let lecturasIdx = actualObs.findIndex(o => o.id === "_lecturas_reporte_");

      if (lecturasIdx === -1) {
        actualObs.push({
          id: "_lecturas_reporte_",
          texto: "",
          autor: "_system_",
          rol: "system",
          creado_en: new Date().toISOString(),
          vistos: []
        });
        lecturasIdx = actualObs.length - 1;
      }

      const vistos = [...(actualObs[lecturasIdx].vistos || [])];
      const yaMarcadoIdx = vistos.findIndex(v => v.usuario === roleId);

      if (yaMarcadoIdx > -1) {
        vistos.splice(yaMarcadoIdx, 1);
      } else {
        const esBodeguero = BODEGUEROS_LITERAL.some(b => b.id === roleId);
        vistos.push({
          usuario: roleId,
          rol: esBodeguero ? 'bodeguero' : (roleId === 'Supervisor' ? 'supervisor' : 'jefatura'),
          fecha: new Date().toISOString(),
          marcado_por: miIdentidad
        });
      }

      actualObs[lecturasIdx] = {
        ...actualObs[lecturasIdx],
        vistos
      };

      await saveReporteComentarios(selectedReporte.id, actualObs);
    } catch (err) {
      console.error(err);
      alert('Error al confirmar lectura: ' + err.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedReporte || isSavingComment) return;

    setIsSavingComment(true);
    try {
      const actualObs = [...(selectedReporte.comentarios_jefes || [])];
      
      const nuevoComentarioObj = {
        id: generateCommentId(),
        texto: newComment.trim(),
        autor: miIdentidad,
        rol: miIdentidad === 'Supervisor' ? 'supervisor' : 'jefatura',
        creado_en: new Date().toISOString(),
        vistos: [
          {
            usuario: miIdentidad,
            rol: miIdentidad === 'Supervisor' ? 'supervisor' : 'jefatura',
            fecha: new Date().toISOString(),
            marcado_por: miIdentidad
          }
        ]
      };

      actualObs.push(nuevoComentarioObj);
      await saveReporteComentarios(selectedReporte.id, actualObs);
      setNewComment('');
    } catch (err) {
      console.error(err);
      alert('Error al agregar comentario: ' + err.message);
    } finally {
      setIsSavingComment(false);
    }
  };

  const toggleVistoComentario = async (commentId) => {
    if (!selectedReporte) return;
    try {
      const actualObs = (selectedReporte.comentarios_jefes || []).map(o => {
        if (o.id === commentId) {
          const vistos = [...(o.vistos || [])];
          const yaVistoIdx = vistos.findIndex(v => v.usuario === miIdentidad);

          if (yaVistoIdx > -1) {
            vistos.splice(yaVistoIdx, 1);
          } else {
            vistos.push({
              usuario: miIdentidad,
              rol: miIdentidad === 'Supervisor' ? 'supervisor' : 'jefatura',
              fecha: new Date().toISOString(),
              marcado_por: miIdentidad
            });
          }
          return { ...o, vistos };
        }
        return o;
      });

      await saveReporteComentarios(selectedReporte.id, actualObs);
    } catch (err) {
      console.error(err);
      alert('Error al actualizar visto del comentario: ' + err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedReporte) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;
    try {
      const actualObs = (selectedReporte.comentarios_jefes || []).filter(o => o.id !== commentId);
      await saveReporteComentarios(selectedReporte.id, actualObs);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar comentario: ' + err.message);
    }
  };

  // Filtrado local
  const getFiltrados = () => {
    let list = [...reportes];

    if (filterSearch) {
      const q = filterSearch.toLowerCase().trim();
      list = list.filter(r => {
        const colab = (r.colaborador || '').toLowerCase();
        const act = (r.actividades || '').toLowerCase();
        const nov = (r.novedades || '').toLowerCase();
        return colab.includes(q) || act.includes(q) || nov.includes(q) || r.fecha.includes(q);
      });
    }

    if (filterTurno) {
      list = list.filter(r => r.turno === filterTurno);
    }

    if (filterFecha && filterFecha !== 'todas') {
      const hoyStr = getEcuadorDateStr();
      const hoyMs = parseLocalDate(hoyStr).getTime();
      list = list.filter(r => {
        const recordMs = parseLocalDate(r.fecha).getTime();
        if (filterFecha === 'hoy') {
          return r.fecha === hoyStr;
        } else if (filterFecha === 'semana') {
          const diffDays = Math.round((hoyMs - recordMs) / 86400000);
          return diffDays >= 0 && diffDays < 7;
        } else if (filterFecha === 'mes') {
          const diffDays = Math.round((hoyMs - recordMs) / 86400000);
          return diffDays >= 0 && diffDays < 30;
        }
        return true;
      });
    }

    return list;
  };

  const filtrados = getFiltrados();

  // Estadísticas rápidas
  const getStats = () => {
    const total = reportes.length;
    const hoyStr = getEcuadorDateStr();
    const hoyCount = reportes.filter(r => r.fecha === hoyStr).length;

    const conEvidencia = reportes.filter(r => 
      (Array.isArray(r.ev_operativa) && r.ev_operativa.length > 0) || 
      (Array.isArray(r.ev_jigsaw_filezilla) && r.ev_jigsaw_filezilla.length > 0)
    ).length;

    const colaboradoresUnicos = new Set(reportes.map(r => r.colaborador)).size;

    return { total, hoyCount, conEvidencia, colaboradoresUnicos };
  };

  const stats = getStats();

  // Exportar a CSV/Excel
  const handleExportCSV = () => {
    if (filtrados.length === 0) return;
    
    // Encabezados
    const headers = [
      'Fecha', 
      'Colaborador', 
      'Turno', 
      'Actividades', 
      'Guias Realizadas', 
      'Detalle Guias', 
      'Video Confirmado', 
      'Novedades', 
      'Pendientes', 
      'Fecha de Registro'
    ];

    const escapeCSV = (str) => {
      if (!str) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    // Filas
    const rows = filtrados.map(r => [
      r.fecha,
      r.colaborador,
      r.turno,
      r.actividades,
      r.guias_realizadas,
      r.guias_descripcion,
      r.video_confirmado,
      r.novedades,
      r.pendientes,
      r.created_at ? new Date(r.created_at).toLocaleString() : ''
    ]);

    // Unir todo con formato CSV de excel en español (separador punto y coma, UTF-8 BOM)
    const BOM = '\\uFEFF';
    const csvContent = BOM + [
      headers.join(';'),
      ...rows.map(row => row.map(escapeCSV).join(';'))
    ].join('\\r\
');

    // Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reportes_bodega_${new Date().toLocaleDateString('sv-SE')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-accent-bg { background-color: ${myTheme.primary} !important; }
        .theme-accent-text { color: ${myTheme.primary} !important; }
        .theme-accent-border { border-color: ${myTheme.primary} !important; }
        .theme-accent-border-soft { border-color: ${myTheme.primary}30 !important; }
        .theme-accent-ring-focus:focus { border-color: ${myTheme.primary} !important; box-shadow: 0 0 0 3px ${myTheme.primary}20 !important; }
        .theme-accent-hover:hover { background-color: ${myTheme.primary}dd !important; }
        .theme-accent-border-hover:hover { border-color: ${myTheme.primary} !important; }
        .theme-accent-bg-hover:hover { background-color: ${myTheme.primary}20 !important; }
        .theme-accent-bg-soft { background-color: ${myTheme.primary}10 !important; }
        .theme-accent-bg-medium { background-color: ${myTheme.primary}20 !important; }
        .theme-tab-active { border-color: ${myTheme.primary}80 !important; background-color: ${myTheme.primary}15 !important; }
        .theme-gradient-bg { background: linear-gradient(135deg, ${myTheme.primary} 0%, ${myTheme.primary}dd 100%) !important; }
        .theme-accent-shadow { box-shadow: 0 4px 20px -2px ${myTheme.primary}30 !important; }
      ` }} />
      
      {/* Selector Nav de Bitácoras */}
      {!hideHeaderNav && <BitacorasSelectorNav activeTab="bodega" />}

      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`text-3xl font-title font-black flex items-center gap-3 ${tc.textPrimary}`}>
              <Warehouse className="w-8 h-8 theme-accent-text" />
              Bandeja de Bodega
            </h1>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
              V8 Edition
            </span>
          </div>
          <p className={`mt-1 text-xs font-medium ${tc.textMuted}`}>
            Visualización y control de reportes diarios de bodega, recepción de camión y control de video.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filtrados.length === 0}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-title font-bold text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={loadReportes}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-title font-bold text-xs flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Estadísticas de Cristal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reportes', val: stats.total, icon: <Warehouse className="w-5 h-5" />, color: 'theme-accent-text' },
          { label: 'Recibidos Hoy', val: stats.hoyCount, icon: <Calendar className="w-5 h-5" />, color: 'theme-accent-text' },
          { label: 'Con Evidencia', val: stats.conEvidencia, icon: <Paperclip className="w-5 h-5" />, color: 'text-green-500' },
          { label: 'Bodegueros Activos', val: stats.colaboradoresUnicos, icon: <User className="w-5 h-5" />, color: 'theme-accent-text' }
        ].map((stat, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border shadow-sm ${tc.cardBg}`} style={tc.cardBgStyle}>
            <div className="flex justify-between items-start">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                {stat.label}
              </span>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </div>
            <p className={`text-2xl md:text-3xl font-title font-black mt-2 ${tc.textPrimary}`}>
              {stat.val}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className={`p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 ${tc.cardBg}`} style={tc.cardBgStyle}>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por bodeguero o actividad..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl py-2.5 pl-10 pr-4 font-bold text-xs text-slate-800 dark:text-white outline-none focus:theme-accent-border transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="relative">
          <select
            value={filterTurno}
            onChange={(e) => setFilterTurno(e.target.value)}
            className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-800 dark:text-white outline-none focus:theme-accent-border transition-all appearance-none"
          >
            <option value="">Todos los Turnos...</option>
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
            <option value="Noche">Noche</option>
            <option value="Completo">Completo</option>
          </select>
        </div>

        <div className="flex gap-2">
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: 'semana', label: '7D' },
            { id: 'mes', label: '30D' },
            { id: 'todas', label: 'Todo' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilterFecha(opt.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                filterFecha === opt.id
                  ? 'theme-accent-bg text-white shadow-md'
                  : 'bg-slate-100/50 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200/40 dark:border-slate-800/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de reportes */}
      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-10 h-10 theme-accent-text animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-bold font-title">Cargando reportes diarios de bodega...</p>
        </div>
      ) : error ? (
        <div className={`p-8 rounded-3xl border shadow-sm text-center border-red-500/20 max-w-md mx-auto ${tc.cardBg}`} style={tc.cardBgStyle}>
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-title font-black text-slate-900 dark:text-white">Error al cargar reportes</h3>
          <p className="text-slate-500 text-xs mt-2 mb-6">{error}</p>
          <button 
            onClick={loadReportes}
            className="px-6 py-2.5 theme-accent-bg text-white font-bold font-title text-xs rounded-xl shadow-md"
          >
            Reintentar
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className={`py-16 px-4 rounded-3xl border shadow-sm text-center ${tc.cardBg}`} style={tc.cardBgStyle}>
          <p className="text-slate-400 font-bold font-title text-sm">No se encontraron reportes de bodega en este período.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map(item => {
            const evOp = Array.isArray(item.ev_operativa) ? item.ev_operativa : [];
            const evJig = Array.isArray(item.ev_jigsaw_filezilla) ? item.ev_jigsaw_filezilla : [];
            const totalEv = evOp.length + evJig.length;

            return (
              <div 
                key={item.id}
                className={`p-6 rounded-3xl border shadow-sm premium-shadow-hover relative flex flex-col justify-between h-[230px] ${tc.cardBg}`} style={tc.cardBgStyle}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest theme-accent-text theme-accent-bg/10 px-2.5 py-1 rounded-full" title={item.fecha}>
                      {formatFriendlyDate(item.fecha)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.turno}
                    </span>
                  </div>

                  <h3 className={`text-lg font-title font-black truncate ${tc.textPrimary}`}>
                    {item.colaborador}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                    {item.actividades}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100/50 dark:border-slate-800/40 mt-auto">
                  <div className="flex items-center gap-2">
                    {totalEv > 0 && (
                      <span className="text-[10px] font-extrabold text-slate-400 flex items-center gap-0.5">
                        <Paperclip className="w-3.5 h-3.5" />
                        {totalEv}
                      </span>
                    )}
                    {item.video_confirmado === 'Sí' && (
                      <span className="text-[10px] font-extrabold text-green-500 flex items-center gap-0.5 bg-green-500/10 px-2 py-0.5 rounded-lg">
                        <Video className="w-3 h-3" />
                        Video
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSelectReporte(item)}
                    className="text-xs font-bold font-title theme-accent-text hover:theme-accent-text/85 flex items-center gap-1"
                  >
                    Ver detalle
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETALLE DE REPORTE BODEGA */}
      {selectedReporte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-3xl border-white/20 premium-shadow flex flex-col overflow-hidden animate-fade-in-up">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest theme-accent-text theme-accent-bg/10 px-2.5 py-1 rounded-full block w-max mb-2" title={selectedReporte.fecha}>
                  Reporte Bodega · {formatFriendlyDate(selectedReporte.fecha)}
                </span>
                <h2 className={`text-2xl font-title font-black ${tc.textPrimary}`}>
                  {selectedReporte.colaborador}
                </h2>
              </div>
              <button
                onClick={() => setSelectedReporte(null)}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Bloque Turno & Video */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Turno Reportado
                  </span>
                  <p className="text-lg font-title font-black mt-1 dark:text-white">
                    {selectedReporte.turno}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Video de Cierre
                  </span>
                  {selectedReporte.video_confirmado === 'Sí' ? (
                    <div className="flex flex-col items-center gap-2 mt-1.5">
                      <span className="text-xs font-black text-green-500 flex items-center gap-1 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Confirmado & Enviado
                      </span>
                      <a 
                        href="https://drive.google.com/drive/folders/1BZtYHIZPS0xbanGuxB-OwnKi0SS7VEIeicz_7GRmKOLILHvFfg-UysHLFqCXx2FwYzi4WilN" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 87.3 78">
                          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"/>
                          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"/>
                          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"/>
                          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"/>
                          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"/>
                          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"/>
                        </svg>
                        Abrir carpeta
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs font-black text-red-500 flex items-center gap-1 mt-1.5 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                      <X className="w-3.5 h-3.5" />
                      Sin video reportado
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Guías del Día
                  </span>
                  <span className={`text-xs font-black flex items-center gap-1 mt-1.5 px-3 py-1 rounded-full border ${
                    selectedReporte.guias_realizadas === 'Sí'
                      ? 'bg-blue-500/10 border-blue-500/20 theme-accent-text'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}>
                    {selectedReporte.guias_realizadas === 'Sí' ? '✓ Sí se hicieron' : 'No se hicieron'}
                  </span>
                </div>
              </div>

              {/* Actividades realizadas */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest theme-accent-text flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Actividades Operativas de Bodega
                </h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  {selectedReporte.actividades}
                </div>
              </div>

              {/* Detalle de guías */}
              {selectedReporte.guias_realizadas === 'Sí' && selectedReporte.guias_descripcion && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    📋 Detalle de Guías de Traslado & FileZilla
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {selectedReporte.guias_descripcion}
                  </div>
                </div>
              )}

              {/* Novedades y pendientes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    ⚠️ Novedades del Turno
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl text-sm text-slate-600 dark:text-slate-300 min-h-[80px]">
                    {selectedReporte.novedades || <span className="text-slate-400 italic">Sin novedades reportadas.</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    📌 Pendientes para Próximo Turno
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl text-sm text-slate-600 dark:text-slate-300 min-h-[80px]">
                    {selectedReporte.pendientes || <span className="text-slate-400 italic">Sin pendientes reportados.</span>}
                  </div>
                </div>
              </div>

              {/* EVIDENCIAS DE CRISTAL POR ZONA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                
                {/* Zona 1: Operativa */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    📎 Evidencias Operativas (Zona 1)
                  </h4>
                  {(!Array.isArray(selectedReporte.ev_operativa) || selectedReporte.ev_operativa.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-2">Sin evidencias en esta zona.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedReporte.ev_operativa.map((f, idx) => {
                        const isImg = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(f.url);
                        return (
                          <a 
                            key={idx}
                            href={f.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center group h-[100px] overflow-hidden relative"
                          >
                            {isImg ? (
                              <img src={f.url} alt={f.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <Paperclip className="w-5 h-5 text-slate-400 mb-1" />
                            )}
                            <span className="text-[9px] font-bold truncate max-w-full text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-950/80 px-2 py-0.5 rounded z-10">
                              {f.name}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Zona 2: Jigsaw */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    📎 Evidencias Jigsaw & FileZilla (Zona 2)
                  </h4>
                  {(!Array.isArray(selectedReporte.ev_jigsaw_filezilla) || selectedReporte.ev_jigsaw_filezilla.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-2">Sin evidencias en esta zona.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedReporte.ev_jigsaw_filezilla.map((f, idx) => {
                        const isImg = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(f.url);
                        return (
                          <a 
                            key={idx}
                            href={f.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center group h-[100px] overflow-hidden relative"
                          >
                            {isImg ? (
                              <img src={f.url} alt={f.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <Paperclip className="w-5 h-5 text-slate-400 mb-1" />
                            )}
                            <span className="text-[9px] font-bold truncate max-w-full text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-950/80 px-2 py-0.5 rounded z-10">
                              {f.name}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Vistos de Lectura */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  👁️ Confirmación de Lectura (Check-in)
                </h4>
                
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400/70 block">
                    Jefatura:
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ROLES_LITERAL.map(role => {
                      const vistos = getVistosReporte(selectedReporte);
                      const yaLeido = vistos.some(v => v.usuario === role.id);
                      const puedoConfirmar = (miIdentidad === 'Supervisor' || miIdentidad === role.id);

                      return (
                        <button
                          key={role.id}
                          type="button"
                          disabled={!puedoConfirmar}
                          onClick={() => toggleVistoReporte(role.id)}
                          className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                            yaLeido
                              ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-500'
                              : 'border-slate-200 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/10 text-slate-400'
                          } ${puedoConfirmar ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'opacity-65 cursor-not-allowed'}`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            yaLeido ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {yaLeido && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                          </div>
                          <span>{role.label}</span>
                          {yaLeido && (
                            <span className="text-[8px] text-slate-400 block font-normal">
                              {vistos.find(v => v.usuario === role.id)?.fecha ? new Date(vistos.find(v => v.usuario === role.id).fecha).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400/70 block">
                    Bodega:
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {BODEGUEROS_LITERAL.map(bod => {
                      const vistos = getVistosReporte(selectedReporte);
                      const yaLeido = vistos.some(v => v.usuario === bod.id);
                      const colaboradorNombreCompleto = `${user?.user_metadata?.nombres || ''} ${user?.user_metadata?.apellidos || ''}`.trim();
                      const puedoConfirmar = colaboradorNombreCompleto === bod.id;

                      return (
                        <button
                          key={bod.id}
                          type="button"
                          disabled={!puedoConfirmar}
                          onClick={() => toggleVistoReporte(bod.id)}
                          className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                            yaLeido
                              ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-500'
                              : 'border-slate-200 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/10 text-slate-400'
                          } ${puedoConfirmar ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'opacity-65 cursor-not-allowed'}`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            yaLeido ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {yaLeido && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                          </div>
                          <span>{bod.label}</span>
                          {yaLeido && (
                            <span className="text-[8px] text-slate-400 block font-normal">
                              {vistos.find(v => v.usuario === bod.id)?.fecha ? new Date(vistos.find(v => v.usuario === bod.id).fecha).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Foro / Comentarios */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest theme-accent-text">
                  💬 Observaciones e Hilo de Supervisor / Jefatura
                </h4>

                {/* Lista de comentarios */}
                <div className="space-y-3">
                  {(selectedReporte.comentarios_jefes || [])
                    .filter(c => c.id !== "_lecturas_reporte_")
                    .length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4">No hay comentarios en este reporte diario.</p>
                    ) : (
                      (selectedReporte.comentarios_jefes || [])
                        .filter(c => c.id !== "_lecturas_reporte_")
                        .map(c => {
                          const vistos = Array.isArray(c.vistos) ? c.vistos : [];
                          const yaLoVi = vistos.some(v => v.usuario === miIdentidad);
                          const esMiComentario = c.autor === miIdentidad;

                          const autorBadgeColor = 
                            c.rol === 'supervisor' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            c.rol === 'jefatura' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            c.rol === 'bodeguero' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            'bg-slate-500/10 text-slate-500 border-slate-500/20';

                          return (
                            <div 
                              key={c.id} 
                              className={`p-4 rounded-2xl border transition-all ${
                                esMiComentario 
                                  ? 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800' 
                                  : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-900'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                    {c.autor}
                                  </span>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${autorBadgeColor}`}>
                                    {c.rol || 'colaborador'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-slate-400">
                                    {new Date(c.creado_en).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                  {esMiComentario && (
                                    <button 
                                      type="button"
                                      onClick={() => handleDeleteComment(c.id)}
                                      className="text-red-500 hover:text-red-650 p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                                      title="Eliminar Comentario"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                                {c.texto}
                              </p>
                              
                              <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100/50 dark:border-slate-900/50">
                                <button
                                  type="button"
                                  onClick={() => toggleVistoComentario(c.id)}
                                  className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors ${
                                    yaLoVi ? 'text-green-500' : 'text-slate-450 hover:text-slate-750'
                                  }`}
                                >
                                  <CheckSquare className="w-3 h-3" />
                                  {yaLoVi ? 'Leído' : 'Marcar Leído'}
                                </button>
                                {vistos.length > 0 && (
                                  <span className="text-[8px] text-slate-400">
                                    Leído por: {vistos.map(v => v.usuario).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                </div>

                {/* Formulario de comentario */}
                <form onSubmit={handleAddComment} className="flex gap-2 items-end pt-2">
                  <textarea
                    rows="2"
                    required
                    placeholder="Escribe una observación, instrucción o felicitación sobre este turno de bodega..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className={`flex-1 rounded-2xl border py-2.5 px-4 font-sans text-xs outline-none focus:ring-1 transition-all resize-none ${
                      activeTheme === 'oscuro' 
                        ? 'bg-slate-900 border-slate-800 text-white focus:border-marathon-medium focus:ring-marathon-medium/10' 
                        : 'bg-white border-slate-200 text-slate-800 focus:border-marathon-medium focus:ring-marathon-medium/10'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isSavingComment || !newComment.trim()}
                    className="p-3 theme-accent-bg hover:theme-accent-hover disabled:opacity-50 text-white rounded-2xl shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    {isSavingComment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedReporte(null)}
                className="px-6 py-2.5 rounded-xl font-bold font-title text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}