import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ClipboardCheck, 
  Search, 
  RefreshCw, 
  Calendar, 
  User, 
  Award, 
  ChevronRight, 
  X, 
  Send, 
  Check, 
  Paperclip, 
  Trash, 
  Loader2, 
  AlertTriangle,
  Download
} from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';
import BitacorasSelectorNav from '../components/BitacorasSelectorNav';

const CAMPOS_ADMIN = [
  { key: "adm_induccion_personal", label: "Inducción personal nuevo" },
  { key: "adm_autorizacion_horas", label: "Autorización de horas" },
  { key: "adm_baja_personal", label: "Baja de personal (renuncia)" },
  { key: "adm_solicitud_pop", label: "Solicitud de POP" },
  { key: "adm_solicitud_rollos", label: "Solicitud de rollos de impresora" },
  { key: "adm_solicitud_paco", label: "Solicitud de PA-CO" },
  { key: "adm_solicitud_fundas", label: "Solicitud de fundas" },
  { key: "adm_metas_mensuales", label: "Metas mensuales (período)" },
  { key: "adm_horarios_mes", label: "Horarios del mes (semanal)" },
  { key: "adm_solicitud_cc", label: "Autorización Centro Comercial" },
  { key: "adm_retroalimentacion", label: "Retroalimentación de personal" },
  { key: "adm_recepcion_web", label: "Recepción de ventas WEB" },
  { key: "adm_pedido_codigos", label: "Pedido de códigos (asesores)" },
  { key: "adm_instalaciones", label: "Instalaciones y mantenimientos" },
  { key: "adm_solicitud_uniformes", label: "Solicitud de uniformes" },
  { key: "adm_visitas_tienda", label: "Visita a tienda (Gtes/Sup)" },
  { key: "adm_limpieza_industrial", label: "Limpieza (Empresa Industrial)" },
];

const CAMPOS_OP = [
  { key: "op_categorizacion_pared", label: "Categorización de pared principal" },
  { key: "op_cambio_pvp_calzado", label: "Cambio de PVP calzado" },
  { key: "op_verif_pvp_ropa", label: "Verificación PVP ropa" },
  { key: "op_verif_pvp_accesorios", label: "Verificación PVP accesorios" },
  { key: "op_exhib_accesorios", label: "Exhibición producto nuevo accesorios" },
  { key: "op_exhib_ropa", label: "Exhibición producto nuevo ropa" },
  { key: "op_exhib_zapatos", label: "Exhibición producto nuevo zapatos" },
  { key: "op_cambio_paredes_ropa_marcas", label: "Cambio exhibición paredes marcas" },
  { key: "op_cambio_paredes_ropa_marathon", label: "Cambio exhibición paredes Tienda" },
  { key: "op_cambio_paredes_accesorios", label: "Cambio exhibición paredes accesorios" },
  { key: "op_cambio_muebles_ropa_marcas", label: "Cambio exhibición muebles marcas" },
  { key: "op_cambio_muebles_ropa_marathon", label: "Cambio exhibición muebles Tienda" },
  { key: "op_cambio_muebles_accesorios", label: "Cambio exhibición muebles accesorios" },
  { key: "op_cambio_mesas", label: "Cambio exhibición mesas" },
  { key: "op_maniquies_marathon", label: "Cambio maniquíes Tienda" },
  { key: "op_maniquies_marcas", label: "Cambio maniquíes marcas" },
  { key: "op_limp_muebles_marathon", label: "Limpieza muebles Tienda" },
  { key: "op_limp_muebles_marcas", label: "Limpieza muebles marcas" },
  { key: "op_limp_bases_marathon", label: "Limpieza bases Tienda" },
  { key: "op_limp_bases_marcas", label: "Limpieza bases marcas" },
  { key: "op_limp_micas", label: "Limpieza micas categorización" },
  { key: "op_tallar_muebles_marathon", label: "Tallar ropa muebles Tienda" },
  { key: "op_tallar_muebles_zonas", label: "Tallar ropa muebles marcas" },
  { key: "op_tallar_paredes_marathon", label: "Tallar ropa paredes Tienda" },
  { key: "op_tallar_paredes_marcas", label: "Tallar ropa paredes marcas" },
  { key: "op_liquidacion_mercaderia", label: "Liquidación de mercadería" },
  { key: "op_tags_promocion", label: "Colocación de tags de promoción" },
];

const ROLES_LITERAL = [
  { id: "Supervisor", label: "Supervisor" },
  { id: "Jefe de Tienda", label: "Jefe de Tienda" },
  { id: "Subjefe de Tienda", label: "Subjefe de Tienda" },
  { id: "Tercero a bordo", label: "Tercero a bordo" }
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

export default function BitacoraAdmin({ hideHeaderNav = false }) {
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

  const getSelectedStoreName = () => {
    const selectedTiendaStr = sessionStorage.getItem('portal_selected_tienda');
    if (selectedTiendaStr) {
      try {
        const tienda = JSON.parse(selectedTiendaStr);
        return tienda.nombre || tienda.tienda || 'Marathon Store';
      } catch {
        // ignore
      }
    }
    return 'Marathon Store';
  };

  const exportBitacorasToPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const storeName = getSelectedStoreName();
    
    let periodoStr = 'Todo';
    if (filterFecha === 'hoy') periodoStr = 'Hoy';
    else if (filterFecha === 'semana') periodoStr = 'Últimos 7 Días';
    else if (filterFecha === 'mes') periodoStr = 'Últimos 30 Días';

    // Título y encabezado
    doc.setFillColor(15, 23, 42); // Gris oscuro premium
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('REPORTE CONSOLIDADO DE BITÁCORAS', 15, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Tienda: ${storeName}  |  Período: ${periodoStr}`, 15, 22);

    // Preparar columnas y filas
    const tableHeaders = ['Fecha', 'Colaborador', 'Meta %', 'Tareas', 'Observaciones / Novedades'];

    const tableRows = filtrados.map(item => {
      const totalAdm = CAMPOS_ADMIN.filter(c => item[c.key] === 'Sí').length;
      const totalOp = CAMPOS_OP.filter(c => item[c.key] === 'Sí').length;
      const meta = parseFloat(item.cumplimiento_meta) || 0;
      
      const fechaFriendly = item.fecha.split('-').reverse().join('/');
      const colaborador = `${item.colaborador}\n(${item.cargo})`;
      const metaStr = `${meta.toFixed(1)}%`;
      const tareas = `Adm: ${totalAdm}\nOp: ${totalOp}`;
      const obs = item.observaciones || 'Sin novedades registradas.';

      return [fechaFriendly, colaborador, metaStr, tareas, obs];
    });

    autoTable(doc, {
      startY: 35,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 35, fontStyle: 'bold' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { fontStyle: 'normal' }
      },
      bodyStyles: {
        fontSize: 8,
        valign: 'top'
      },
      styles: {
        cellPadding: 2.5,
        overflow: 'linebreak'
      }
    });

    doc.save(`Consolidado_Bitacoras_${storeName.replace(/\s+/g, '_')}_${periodoStr.replace(/\s+/g, '_')}.pdf`);
  };

  // Marcar leído automáticamente cuando se selecciona/abre una bitácora
  const handleSelectBitacora = async (item) => {
    setSelectedBitacora(item);

    try {
      const actualObs = [...(item.observaciones_supervisor || [])];
      let lecturasIdx = actualObs.findIndex(o => o.id === "_lecturas_bitacora_");

      if (lecturasIdx === -1) {
        actualObs.push({
          id: "_lecturas_bitacora_",
          texto: "",
          autor: "_system_",
          rol: "system",
          creado_en: new Date().toISOString(),
          vistos: []
        });
        lecturasIdx = actualObs.length - 1;
      }

      const vistos = [...(actualObs[lecturasIdx].vistos || [])];
      const yaMarcado = vistos.some(v => v.usuario === miIdentidad);

      if (!yaMarcado) {
        vistos.push({
          usuario: miIdentidad,
          rol: miIdentidad === 'Supervisor' ? 'supervisor' : 'jefatura',
          fecha: new Date().toISOString(),
          marcado_por: miIdentidad
        });

        actualObs[lecturasIdx] = {
          ...actualObs[lecturasIdx],
          vistos
        };

        await saveBitacoraObservaciones(item.id, actualObs);
      }
    } catch (err) {
      console.error("Error al marcar visto automático:", err);
    }
  };

  // State
  const [bitacoras, setBitacoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros
  const [filterSearch, setFilterSearch] = useState('');
  const [filterJefe, setFilterJefe] = useState('');
  const [filterFecha, setFilterFecha] = useState('mes'); // 'hoy', 'semana', 'mes', 'todas'

  // Modal
  const [selectedBitacora, setSelectedBitacora] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);

  // Cargar bitácoras desde Supabase
  const loadBitacoras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedTiendaStr = sessionStorage.getItem('portal_selected_tienda');
      let query = supabase.from('bitacoras_jefes').select('*');
      
      if (selectedTiendaStr) {
        const tienda = JSON.parse(selectedTiendaStr);
        query = query.eq('tienda_id', tienda.id);
      }

      const { data, error: fetchErr } = await query
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      // Normalización de datos antiguos si existen
      const norm = (data || []).map(r => {
        const record = { ...r };
        
        let rawCargo = record.cargo || '';
        if (!rawCargo && record.colaborador) {
          const colabUpper = String(record.colaborador).toUpperCase();
          if (colabUpper.includes('GUSTAVO')) rawCargo = 'Jefe';
          if (colabUpper.includes('ALAIN')) rawCargo = 'Subjefe';
          if (colabUpper.includes('PERALTA') || colabUpper.includes('LUIS') || colabUpper.includes('GENESIS')) rawCargo = 'Tercero a bordo';
        }
        
        // Estandarizar cargo
        const cLower = String(rawCargo).toLowerCase();
        if (cLower.includes('tercer')) {
          record.cargo = 'Tercero a bordo';
        } else if (cLower.includes('subjefe')) {
          record.cargo = 'Subjefe';
        } else if (cLower.includes('jefe') || cLower.includes('director')) {
          record.cargo = 'Jefe';
        } else if (cLower.includes('supervisor')) {
          record.cargo = 'Supervisor';
        } else {
          record.cargo = rawCargo || 'Jefatura';
        }

        // Dejar el nombre del colaborador real intacto si existe
        if (!record.colaborador) {
          record.colaborador = record.cargo;
        }

        return record;
      });

      setBitacoras(norm);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar bitácoras.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBitacoras();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadBitacoras]);

  // Sincronización en tiempo real para bitácoras
  useEffect(() => {
    const channel = supabase
      .channel('realtime-bitacoras-admin-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bitacoras_jefes' },
        () => {
          loadBitacoras();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBitacoras]);

  // Aplicar filtros locales
  const getFiltrados = () => {
    let list = [...bitacoras];

    // El Tercero a bordo ahora puede ver todas las bitácoras de los jefes

    if (filterSearch) {
      const q = filterSearch.toLowerCase().trim();
      list = list.filter(r => {
        const colab = (r.colaborador || '').toLowerCase();
        const obs = (r.observaciones || '').toLowerCase();
        const cargo = (r.cargo || '').toLowerCase();
        return colab.includes(q) || obs.includes(q) || r.fecha.includes(q) || cargo.includes(q);
      });
    }

    if (filterJefe) {
      list = list.filter(r => r.cargo === filterJefe);
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
    const total = bitacoras.length;
    const hoyStr = getEcuadorDateStr();
    const hoyCount = bitacoras.filter(r => r.fecha === hoyStr).length;
    
    const metas = bitacoras.map(r => parseFloat(r.cumplimiento_meta)).filter(m => !isNaN(m));
    const metaProm = metas.length > 0 ? metas.reduce((a,b) => a+b, 0) / metas.length : 0;
    
    const jefesUnicos = new Set(bitacoras.map(r => r.colaborador)).size;

    return { total, hoyCount, metaProm, jefesUnicos };
  };

  const stats = getStats();

  // Extraer vistos a nivel de bitácora
  const getVistosBitacora = (r) => {
    const obs = Array.isArray(r.observaciones_supervisor) ? r.observaciones_supervisor : [];
    const lect = obs.find(o => o.id === "_lecturas_bitacora_");
    return lect?.vistos || [];
  };

  // Agregar comentario / Confirmar lectura completa
  const saveBitacoraObservaciones = async (bitacoraId, nuevasObservaciones) => {
    const { error: updErr } = await supabase
      .from('bitacoras_jefes')
      .update({ observaciones_supervisor: nuevasObservaciones })
      .eq('id', bitacoraId);

    if (updErr) throw updErr;

    // Actualizar estado local
    setBitacoras(prev => prev.map(b => b.id === bitacoraId ? { ...b, observaciones_supervisor: nuevasObservaciones } : b));
    if (selectedBitacora && selectedBitacora.id === bitacoraId) {
      setSelectedBitacora(prev => ({ ...prev, observaciones_supervisor: nuevasObservaciones }));
    }
  };

  // Marcar leído/Visto completo
  const toggleVistoBitacora = async (roleId) => {
    if (!selectedBitacora) return;
    try {
      const actualObs = [...(selectedBitacora.observaciones_supervisor || [])];
      let lecturasIdx = actualObs.findIndex(o => o.id === "_lecturas_bitacora_");

      if (lecturasIdx === -1) {
        actualObs.push({
          id: "_lecturas_bitacora_",
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
        // Quitar
        vistos.splice(yaMarcadoIdx, 1);
      } else {
        // Agregar
        vistos.push({
          usuario: roleId,
          rol: roleId === 'Supervisor' ? 'supervisor' : 'jefatura',
          fecha: new Date().toISOString(),
          marcado_por: miIdentidad
        });
      }

      actualObs[lecturasIdx] = {
        ...actualObs[lecturasIdx],
        vistos
      };

      await saveBitacoraObservaciones(selectedBitacora.id, actualObs);
    } catch (err) {
      console.error(err);
      alert('Error al confirmar lectura: ' + err.message);
    }
  };

  // Agregar comentario de observación
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedBitacora || isSavingComment) return;

    setIsSavingComment(true);
    try {
      const actualObs = [...(selectedBitacora.observaciones_supervisor || [])];
      
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
      await saveBitacoraObservaciones(selectedBitacora.id, actualObs);
      setNewComment('');
    } catch (err) {
      console.error(err);
      alert('Error al agregar comentario: ' + err.message);
    } finally {
      setIsSavingComment(false);
    }
  };

  // Confirmar visto de un comentario individual
  const toggleVistoComentario = async (commentId) => {
    if (!selectedBitacora) return;
    try {
      const actualObs = (selectedBitacora.observaciones_supervisor || []).map(o => {
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

      await saveBitacoraObservaciones(selectedBitacora.id, actualObs);
    } catch (err) {
      console.error(err);
      alert('Error al actualizar visto del comentario: ' + err.message);
    }
  };

  // Eliminar comentario
  const handleDeleteComment = async (commentId) => {
    if (!selectedBitacora) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;
    try {
      const actualObs = (selectedBitacora.observaciones_supervisor || []).filter(o => o.id !== commentId);
      await saveBitacoraObservaciones(selectedBitacora.id, actualObs);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar comentario: ' + err.message);
    }
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
      {!hideHeaderNav && <BitacorasSelectorNav activeTab="jefes" />}

      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`text-3xl font-title font-black flex items-center gap-3 ${tc.textPrimary}`}>
              <ClipboardCheck className="w-8 h-8 theme-accent-text" />
              Bandeja de Bitácoras
            </h1>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 uppercase tracking-wider">
              V8 Edition
            </span>
          </div>
          <p className={`mt-1 text-xs font-medium ${tc.textMuted}`}>
            Revisión diaria de cumplimiento de metas y novedades administrativas de jefatura.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={exportBitacorasToPDF}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-title font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar PDF
          </button>
          <button
            onClick={loadBitacoras}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-title font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas de Cristal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bitácoras', val: stats.total, icon: <ClipboardCheck className="w-5 h-5" />, color: 'theme-accent-text' },
          { label: 'Enviadas Hoy', val: stats.hoyCount, icon: <Calendar className="w-5 h-5" />, color: 'theme-accent-text' },
          { label: 'Meta Promedio', val: `${stats.metaProm.toFixed(1)}%`, icon: <Award className="w-5 h-5" />, color: 'text-green-500' },
          { label: 'Jefes Activos', val: stats.jefesUnicos, icon: <User className="w-5 h-5" />, color: 'theme-accent-text' }
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

      {/* Filtros de Cristal */}
      <div className={`p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 ${tc.cardBg}`} style={tc.cardBgStyle}>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por colaborador o novedad..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl py-2.5 pl-10 pr-4 font-bold text-xs text-slate-800 dark:text-white outline-none focus:theme-accent-border transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="relative">
          <select
            value={filterJefe}
            onChange={(e) => setFilterJefe(e.target.value)}
            className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-800 dark:text-white outline-none focus:theme-accent-border transition-all appearance-none"
          >
            <option value="">Filtrar por Cargo (Todos)...</option>
            <option value="Jefe">Jefe</option>
            <option value="Subjefe">Subjefe</option>
            <option value="Tercero a bordo">Tercero a bordo</option>
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

      {/* Lista de Registros */}
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-10 h-10 theme-accent-text animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-bold font-title">Cargando reportes diarios...</p>
        </div>
      ) : error ? (
        <div className={`p-8 rounded-3xl border shadow-sm text-center border-red-500/20 max-w-md mx-auto ${tc.cardBg}`} style={tc.cardBgStyle}>
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-title font-black text-slate-900 dark:text-white">Error al cargar datos</h3>
          <p className="text-slate-500 text-xs mt-2 mb-6">{error}</p>
          <button 
            onClick={loadBitacoras}
            className="px-6 py-2.5 theme-accent-bg text-white font-bold font-title text-xs rounded-xl shadow-md"
          >
            Reintentar
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className={`py-16 px-4 rounded-3xl border shadow-sm text-center ${tc.cardBg}`} style={tc.cardBgStyle}>
          <p className="text-slate-400 font-bold font-title text-sm">No se encontraron bitácoras en este período.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map(item => {
            const meta = parseFloat(item.cumplimiento_meta) || 0;
            const metaColor = meta >= 100 ? 'text-green-500' : meta >= 80 ? 'theme-accent-text' : 'text-red-500';
            const evidencias = Array.isArray(item.evidencias) ? item.evidencias : [];
            const vistos = getVistosBitacora(item);
            const yoYaVi = vistos.some(v => v.usuario === miIdentidad);
            const totalAdm = CAMPOS_ADMIN.filter(c => item[c.key] === 'Sí').length;
            const totalOp = CAMPOS_OP.filter(c => item[c.key] === 'Sí').length;

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
                    {evidencias.length > 0 && (
                      <span className="text-[10px] font-extrabold text-slate-400 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        {evidencias.length}
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    <h3 className={`text-lg font-title font-black truncate ${tc.textPrimary}`} title={item.colaborador}>
                      {item.colaborador}
                    </h3>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                      {item.cargo}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-3 py-2 border-y border-slate-100/50 dark:border-slate-800/40">
                    <span className="text-xs text-slate-400 font-semibold">Cumplimiento Meta</span>
                    <span className={`text-sm font-black ${metaColor}`}>{meta.toFixed(1)}%</span>
                  </div>

                  <div className="flex gap-2 flex-wrap mt-3">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-lg">
                      📋 {totalAdm} adm
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-lg">
                      🛍️ {totalOp} op
                    </span>
                    {yoYaVi && (
                      <span className="text-[9px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        Visto
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 mt-auto">
                  <span className="text-[10px] text-slate-400">
                    {item.created_at ? new Date(item.created_at).toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                  <button
                    onClick={() => handleSelectBitacora(item)}
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

      {/* MODAL DETALLE DE BITACORA DE CRISTAL */}
      {selectedBitacora && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-3xl border-white/20 premium-shadow flex flex-col overflow-hidden animate-fade-in-up">
            
            {/* Header del Modal */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest theme-accent-text theme-accent-bg/10 px-2.5 py-1 rounded-full block w-max mb-2" title={selectedBitacora.fecha}>
                  Bitácora · {formatFriendlyDate(selectedBitacora.fecha)}
                </span>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <h2 className={`text-2xl font-title font-black ${tc.textPrimary}`}>
                    {selectedBitacora.colaborador}
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg">
                    {selectedBitacora.cargo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBitacora(null)}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Sección Meta & Verificaciones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Cumplimiento Meta
                  </span>
                  <p className={`text-2xl font-title font-black mt-1 ${
                    parseFloat(selectedBitacora.cumplimiento_meta) >= 100 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {parseFloat(selectedBitacora.cumplimiento_meta).toFixed(2)}%
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Autorizaciones CC
                  </span>
                  <p className="text-lg font-title font-black mt-1 dark:text-white">
                    {selectedBitacora.autorizaciones_cc || 'No aplica'}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    ¿Revisó Horario?
                  </span>
                  <p className="text-lg font-title font-black mt-1 dark:text-white">
                    {selectedBitacora.reviso_horario || 'No'}
                  </p>
                </div>
              </div>

              {/* Observaciones del Jefe */}
              {selectedBitacora.observaciones && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest theme-accent-text">
                    Observaciones del Jefe
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {selectedBitacora.observaciones}
                  </div>
                </div>
              )}

              {/* Actividades del Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Checklist Administrativo */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    📋 Trabajo Administrativo Realizado
                  </h4>
                  <div className="max-h-[220px] overflow-y-auto border border-slate-100 dark:border-slate-800/40 rounded-2xl p-4 bg-white/40 dark:bg-slate-900/20 space-y-2">
                    {CAMPOS_ADMIN.filter(c => selectedBitacora[c.key] === 'Sí').length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4 font-semibold">Ninguna actividad marcada.</p>
                    ) : (
                      CAMPOS_ADMIN.filter(c => selectedBitacora[c.key] === 'Sí').map(c => (
                        <div key={c.key} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          {c.label}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Checklist Operativo */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    🛍️ Trabajo Operativo Realizado
                  </h4>
                  <div className="max-h-[220px] overflow-y-auto border border-slate-100 dark:border-slate-800/40 rounded-2xl p-4 bg-white/40 dark:bg-slate-900/20 space-y-2">
                    {CAMPOS_OP.filter(c => selectedBitacora[c.key] === 'Sí').length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4 font-semibold">Ninguna actividad marcada.</p>
                    ) : (
                      CAMPOS_OP.filter(c => selectedBitacora[c.key] === 'Sí').map(c => (
                        <div key={c.key} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          {c.label}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Evidencias fotográficas */}
              {Array.isArray(selectedBitacora.evidencias) && selectedBitacora.evidencias.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    📎 Evidencias Fotográficas
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedBitacora.evidencias.map((f, idx) => {
                      const isImg = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(f.url);
                      return (
                        <a 
                          key={idx}
                          href={f.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center text-center group transition-colors h-[120px] overflow-hidden relative"
                        >
                          {isImg ? (
                            <img src={f.url} alt={f.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <Paperclip className="w-6 h-6 text-slate-400 mb-2" />
                          )}
                          <span className="text-[10px] font-bold truncate max-w-full text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-950/80 px-2 py-0.5 rounded z-10">
                            {f.name}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vistos de Lectura */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  👁️ Confirmación de Lectura (Check-in)
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ROLES_LITERAL.map(role => {
                    const vistos = getVistosBitacora(selectedBitacora);
                    const yaLeido = vistos.some(v => v.usuario === role.id);
                    const puedoConfirmar = (miIdentidad === 'Supervisor' || miIdentidad === role.id);

                    return (
                      <button
                        key={role.id}
                        type="button"
                        disabled={!puedoConfirmar}
                        onClick={() => toggleVistoBitacora(role.id)}
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
                            {vistos.find(v => v.usuario === role.id)?.fecha?.slice(11, 16) || ''}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Foro / Comentarios */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest theme-accent-text">
                  💬 Observaciones e Hilo de Supervisor
                </h4>

                {/* Lista de comentarios */}
                <div className="space-y-3">
                  {(selectedBitacora.observaciones_supervisor || [])
                    .filter(c => c.id !== "_lecturas_bitacora_")
                    .length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4">No hay comentarios en este reporte diario.</p>
                    ) : (
                      (selectedBitacora.observaciones_supervisor || [])
                        .filter(c => c.id !== "_lecturas_bitacora_")
                        .map(c => {
                          const vistos = Array.isArray(c.vistos) ? c.vistos : [];
                          const yaLoVi = vistos.some(v => v.usuario === miIdentidad);
                          const esMiComentario = c.autor === miIdentidad;

                          return (
                            <div 
                              key={c.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                esMiComentario 
                                  ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/40 dark:border-slate-800/40 ml-8' 
                                  : 'bg-white/40 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900/40 mr-8'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4 mb-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                  c.rol === 'supervisor' ? 'theme-accent-text' : 'theme-accent-text'
                                }`}>
                                  {c.autor}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-slate-400">
                                    {new Date(c.creado_en).toLocaleString('es-EC', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: 'short'})}
                                  </span>
                                  {esMiComentario && (
                                    <button
                                      onClick={() => handleDeleteComment(c.id)}
                                      className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                                {c.texto}
                              </p>
                              
                              {/* Visto del comentario */}
                              <div className="mt-2.5 flex justify-end">
                                <button
                                  onClick={() => toggleVistoComentario(c.id)}
                                  className={`text-[9px] font-black uppercase tracking-widest py-1 px-2.5 rounded-lg border flex items-center gap-1 transition-all ${
                                    yaLoVi
                                      ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                      : 'border-slate-200 dark:border-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-white'
                                  }`}
                                >
                                  {yaLoVi ? <Check className="w-2.5 h-2.5" /> : null}
                                  {yaLoVi ? 'Visto por ti' : 'Marcar visto'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                </div>

                {/* Formulario para agregar comentario */}
                {/* Regla original: Supervisor y Jefe de Tienda pueden escribir */}
                {(miIdentidad === 'Supervisor' || miIdentidad === 'Jefe de Tienda') && (
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe una observación o instrucción..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl py-2.5 px-4 font-bold text-xs text-slate-800 dark:text-white outline-none focus:theme-accent-border transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSavingComment}
                      className="px-5 py-2.5 theme-accent-bg hover:theme-accent-hover text-white rounded-xl font-bold font-title text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Enviar
                    </button>
                  </form>
                )}
              </div>

            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedBitacora(null)}
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