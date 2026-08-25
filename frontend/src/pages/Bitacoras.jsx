import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/layout/Navbar';
import { sendN8nEvent } from '../services/n8nService';
import { 
  ClipboardList, 
  Send, 
  BookOpen, 
  Package, 
  Calendar, 
  Plus, 
  Search, 
  Sparkles, 
  RefreshCw, 
  User, 
  ChevronRight, 
  X,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Users,
  Eye,
  Upload,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  Download,
  ExternalLink,
  Trash2,
  Boxes,
  Video
} from 'lucide-react';

const CHECKLIST_ADMINISTRATIVO = [
  { key: "adm_induccion_personal", label: "Inducción personal nuevo" },
  { key: "adm_autorizacion_horas", label: "Autorización de horas (compensar y adicionales)" },
  { key: "adm_baja_personal", label: "Baja de personal (renuncia)" },
  { key: "adm_solicitud_pop", label: "Solicitud de POP" },
  { key: "adm_solicitud_rollos", label: "Solicitud de rollos de impresora de precios" },
  { key: "adm_solicitud_paco", label: "Solicitud de PA-CO" },
  { key: "adm_solicitud_fundas", label: "Solicitud de fundas" },
  { key: "adm_metas_mensuales", label: "Metas mensuales (período)" },
  { key: "adm_horarios_mes", label: "Horarios del mes (semanal)" },
  { key: "adm_solicitud_cc", label: "Solicitud de autorización Centro Comercial" },
  { key: "adm_retroalimentacion", label: "Retroalimentación (personal nuevo o antiguo)" },
  { key: "adm_recepcion_web", label: "Recepción de ventas WEB" },
  { key: "adm_pedido_codigos", label: "Pedido de códigos (asesores)" },
  { key: "adm_instalaciones", label: "Instalaciones, mantenimientos y trabajos generales" },
  { key: "adm_solicitud_uniformes", label: "Solicitud de uniformes" },
  { key: "adm_visitas_tienda", label: "Visita a la tienda de gerentes, supervisor, marcas" },
  { key: "adm_limpieza_industrial", label: "Limpieza de tienda (Empresa Industrial Clear)" }
];

const CATEGORIAS_OP = [
  {
    titulo: "📋 CATEGORIZACIÓN Y PRECIOS",
    campos: [
      { key: "op_categorizacion_pared", label: "Categorización pared principal, zonas marcas" },
      { key: "op_cambio_pvp_calzado", label: "Cambio de PVP, descuento calzado" },
      { key: "op_verif_pvp_ropa", label: "Verificación de PVP, descuentos por zonas o marcas (ropa)" },
      { key: "op_verif_pvp_accesorios", label: "Verificación de PVP, descuentos por zonas o marcas (accesorios)" },
    ]
  },
  {
    titulo: "🛍️ EXHIBICIÓN DE PRODUCTOS",
    campos: [
      { key: "op_exhib_accesorios", label: "Exhibición de producto nuevo accesorios" },
      { key: "op_exhib_ropa", label: "Exhibición de producto nuevo ropa" },
      { key: "op_exhib_zapatos", label: "Exhibición de producto nuevo zapatos" },
    ]
  },
  {
    titulo: "🧱 CAMBIO DE PAREDES Y MUEBLES",
    campos: [
      { key: "op_cambio_paredes_ropa_marcas", label: "Cambio de exhibición de paredes (ropa) zonas marcas" },
      { key: "op_cambio_paredes_accesorios", label: "Cambio de exhibición de paredes (accesorios)" },
      { key: "op_cambio_muebles_ropa_marcas", label: "Cambio de exhibición de muebles de ropa zonas marcas" },
      { key: "op_cambio_muebles_accesorios", label: "Cambio de exhibición de muebles de accesorios" },
      { key: "op_cambio_mesas", label: "Cambio de exhibición de mesas" },
    ]
  },
  {
    titulo: "🧍 MANIQUÍES",
    campos: [
      { key: "op_maniquies_marcas", label: "Cambio de maniquíes zonas marcas" },
    ]
  },
  {
    titulo: "🧹 LIMPIEZA",
    campos: [
      { key: "op_limp_muebles_marcas", label: "Limpieza de muebles zonas (marcas)" },
      { key: "op_limp_bases_marcas", label: "Limpieza de bases zonas (marcas)" },
      { key: "op_limp_micas", label: "Limpieza de micas categorización" },
    ]
  },
  {
    titulo: "📐 TALLAJE DE ROPA",
    campos: [
      { key: "op_tallar_muebles_zonas", label: "Tallar ropa muebles zonas" },
      { key: "op_tallar_paredes_marcas", label: "Tallar ropa paredes marcas" },
    ]
  },
  {
    titulo: "🏷️ LIQUIDACIONES Y PROMOCIONES",
    campos: [
      { key: "op_liquidacion_mercaderia", label: "Liquidación de mercadería (ropa, zapatos, accesorios)" },
      { key: "op_tags_promocion", label: "Colocación de tags de promoción" },
    ]
  }
];

function getFileMetadata(file) {
  const name = file.name || '';
  const type = file.type || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    return { label: 'Foto / Imagen', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', Icon: ImageIcon, isImg: true };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext) || type.includes('spreadsheet') || type.includes('excel')) {
    return { label: 'Excel', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', Icon: FileSpreadsheet, isImg: false };
  }
  if (['doc', 'docx'].includes(ext) || type.includes('word')) {
    return { label: 'Word', color: 'text-indigo-400', bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', Icon: FileText, isImg: false };
  }
  if (ext === 'pdf' || type.includes('pdf')) {
    return { label: 'PDF', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', Icon: FileText, isImg: false };
  }
  return { label: 'Documento', color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30', Icon: File, isImg: false };
}

const getDisplayName = (nombres = '', apellidos = '') => {
  const cleanN = (nombres || '').trim();
  const cleanA = (apellidos || '').trim();
  if (!cleanN && !cleanA) return 'Colaborador';

  const nWords = cleanN.split(/\s+/).filter(Boolean);
  const aWords = cleanA.split(/\s+/).filter(Boolean);

  const firstN = nWords[0] ? nWords[0].charAt(0).toUpperCase() + nWords[0].slice(1).toLowerCase() : '';
  const secondN = nWords[1] ? nWords[1].charAt(0).toUpperCase() + nWords[1].slice(1).toLowerCase() : '';
  const firstA = aWords[0] ? aWords[0].charAt(0).toUpperCase() + aWords[0].slice(1).toLowerCase() : '';

  if (firstN.toLowerCase() === 'jose' && secondN) {
    return `${secondN} ${firstA}`;
  }
  if (firstN.toLowerCase() === 'segundo' && secondN) {
    return `${secondN} ${firstA}`;
  }
  if (firstN && firstA) {
    return `${firstN} ${firstA}`;
  }
  return cleanN || cleanA;
};

export default function Bitacoras() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const isLight = theme === 'clasico';

  const myNombres = user?.user_metadata?.nombres || 'Colaborador';
  const myApellidos = user?.user_metadata?.apellidos || '';
  const myCargo = user?.user_metadata?.cargo || 'Jefe de Tienda';
  const myCedula = String(user?.user_metadata?.cedula || user?.cedula || '');
  const myFullName = `${myNombres} ${myApellidos}`.trim();
  const myNombreCompleto = getDisplayName(myNombres, myApellidos);

  // Roles y Permisos
  const isDirectivo = ['jefe', 'subjefe', 'tercer', 'supervisor', 'admin'].some(r => 
    (myCargo || '').toLowerCase().includes(r)
  );

  const isBodeguero = ['bodega', 'bodeguero', 'asistente de bodega'].some(r => 
    (myCargo || '').toLowerCase().includes(r) || (user?.user_metadata?.zona || '').toLowerCase().includes('bodega')
  );

  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Tab activo sincronizado con URL y estado
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get('tab') || location.state?.tab;
    if (tabFromUrl) return tabFromUrl;
    return isBodeguero && !isDirectivo ? 'enviar_bodega' : 'bitacora_jefatura';
  });

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || location.state?.tab;
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, location.state]);

  // Fecha actual en Ecuador
  const todayStr = (() => {
    try {
      return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  })();

  // Estados de datos
  const [bitacorasTurnos, setBitacorasTurnos] = useState([]);
  const [reportesBodega, setReportesBodega] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [jefesRoster, setJefesRoster] = useState([]);
  const [bodeguerosRoster, setBodeguerosRoster] = useState([]);
  const [modalCheckinTab, setModalCheckinTab] = useState('enterados'); // 'enterados' | 'pendientes'
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedReporteBodega, setSelectedReporteBodega] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [notice, setNotice] = useState(null);

  // Filtros de Historial
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBodegaQuery, setSearchBodegaQuery] = useState('');

  // Modal de Detalle y Visor de Imagen Completa
  const [selectedBitacora, setSelectedBitacora] = useState(null);
  const [fullScreenImg, setFullScreenImg] = useState(null);

  // Formulario Bitácora de Jefatura - Parte 1
  const [colaboradorName, setColaboradorName] = useState(myFullName);
  const [cargoName, setCargoName] = useState(myCargo);
  const [fechaReporte, setFechaReporte] = useState(todayStr);
  const [cumplimientoMeta, setCumplimientoMeta] = useState('95.50');
  const [autorizacionesCC, setAutorizacionesCC] = useState('No aplica');
  const [revisoHorario, setRevisoHorario] = useState('No');
  const [observacionesTurno, setObservacionesTurno] = useState('');
  
  // Checklist Items Seleccionados
  const [selectedChecklist, setSelectedChecklist] = useState({});

  // Archivos de Evidencias
  const [archivos, setArchivos] = useState([]);
  const fileInputRef = useRef(null);

  // Archivos de Evidencias para Bodega
  const [archivosBodega, setArchivosBodega] = useState([]);
  const fileInputBodegaRef = useRef(null);

  // Formulario Reporte de Bodega
  const [showBodegaModal, setShowBodegaModal] = useState(false);
  const [formBodega, setFormBodega] = useState({
    fecha: todayStr,
    turno: 'Intermedio',
    actividades: '',
    guias_realizadas: 'SI',
    guias_descripcion: '',
    video_confirmado: 'SI',
    novedades: '',
    pendientes: ''
  });

  const toggleCheckItem = (key) => {
    setSelectedChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => f.size <= 30 * 1024 * 1024);
    if (valid.length < newFiles.length) {
      alert('Algunos archivos superan el límite de 30 MB y fueron omitidos.');
    }
    setArchivos(prev => [...prev, ...valid]);
  };

  const handleRemoveFile = (idx) => {
    setArchivos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddFilesBodega = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => f.size <= 15 * 1024 * 1024);
    if (valid.length < newFiles.length) {
      alert('Algunos archivos superan el límite de 15 MB y fueron omitidos.');
    }
    setArchivosBodega(prev => [...prev, ...valid].slice(0, 10));
  };

  const handleRemoveFileBodega = (idx) => {
    setArchivosBodega(prev => prev.filter((_, i) => i !== idx));
  };

  const showFeedback = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, bodRes, cRes, eRes] = await Promise.all([
        supabase.from('bitacoras_jefes').select('*').order('created_at', { ascending: false }),
        supabase.from('reportes_bodega').select('*').order('created_at', { ascending: false }),
        supabase.from('tienda_lecturas_checkin').select('*').in('tipo', ['bitacora_jefe', 'reporte_bodega']),
        supabase.from('empleados').select('cedula, nombres, apellidos, cargo, rol, zona').eq('activo', true)
      ]);

      if (bRes.data) setBitacorasTurnos(bRes.data);
      if (bodRes.data) setReportesBodega(bodRes.data);
      if (cRes.data) setCheckins(cRes.data);

      if (eRes.data) {
        const jefes = eRes.data
          .filter(e => {
            const c = (e.cargo || '').toLowerCase();
            const r = (e.rol || '').toLowerCase();
            return r === 'admin' || r === 'supervisor' || c.includes('jefe') || c.includes('subjefe') || c.includes('tercer');
          })
          .map(e => ({
            cedula: String(e.cedula),
            nombres: getDisplayName(e.nombres, e.apellidos),
            cargo: e.cargo || 'Jefatura'
          }));

        const bodegueros = eRes.data
          .filter(e => {
            const c = (e.cargo || '').toLowerCase();
            const z = (e.zona || '').toLowerCase();
            return (c.includes('bodega') || z.includes('bodega')) && !c.includes('operativo') && !c.includes('asistente');
          })
          .map(e => ({
            cedula: String(e.cedula),
            nombres: getDisplayName(e.nombres, e.apellidos),
            cargo: 'Bodeguero'
          }));

        setJefesRoster(jefes);
        setBodeguerosRoster(bodegueros);
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckin = async (tipo, referenciaId, tituloItem, creatorName) => {
    if (!myCedula) return;
    setActionInProgress(true);
    try {
      const { error } = await supabase
        .from('tienda_lecturas_checkin')
        .insert([{
          tipo,
          referencia_id: String(referenciaId),
          usuario_cedula: myCedula,
          usuario_nombre: myNombreCompleto,
          usuario_cargo: myCargo
        }]);

      if (error && !error.message?.includes('duplicate')) throw error;

      sendN8nEvent('CHECKIN_BITACORA_CONFIRMADO', {
        tipo,
        referencia_id: referenciaId,
        titulo: tituloItem,
        creador: creatorName,
        revisado_por: myNombreCompleto,
        cedula: myCedula,
        cargo: myCargo
      }, user?.user_metadata);

      showFeedback('¡Check-in confirmado con éxito!');
      fetchData();
    } catch (err) {
      console.error('Error in checkin:', err);
      showFeedback('Error al confirmar check-in', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  // Subir archivos a Supabase Storage
  const uploadEvidencias = async () => {
    if (archivos.length === 0) return [];
    const urls = [];

    for (let i = 0; i < archivos.length; i++) {
      const file = archivos[i];
      setUploadMsg(`Subiendo evidencia ${i + 1} de ${archivos.length}: ${file.name}...`);
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 60);
      const filePath = `bitacoras/${fechaReporte}/${timestamp}_${safeName}`;

      try {
        const { data, error } = await supabase.storage
          .from('evidencias-jefes')
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type || 'application/octet-stream'
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('evidencias-jefes')
          .getPublicUrl(filePath);

        urls.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl,
          uploaded_at: new Date().toISOString()
        });
      } catch (uploadErr) {
        console.error('Error uploading file:', file.name, uploadErr);
      }
    }
    return urls;
  };

  // Subir evidencias de bodega a Supabase Storage
  const uploadEvidenciasBodega = async () => {
    if (archivosBodega.length === 0) return [];
    const urls = [];

    for (let i = 0; i < archivosBodega.length; i++) {
      const file = archivosBodega[i];
      setUploadMsg(`Subiendo evidencia ${i + 1} de ${archivosBodega.length}: ${file.name}...`);
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 60);
      const filePath = `bodega/${formBodega.fecha}/${timestamp}_${safeName}`;

      try {
        const { data, error } = await supabase.storage
          .from('evidencias-jefes')
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type || 'application/octet-stream'
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('evidencias-jefes')
          .getPublicUrl(filePath);

        urls.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl,
          uploaded_at: new Date().toISOString()
        });
      } catch (uploadErr) {
        console.error('Error uploading bodega file:', file.name, uploadErr);
      }
    }
    return urls;
  };

  // Enviar Bitácora de Jefatura Completa
  const handleSubmitBitacora = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadMsg('Procesando evidencias...');

    try {
      const numCumplimiento = parseFloat(cumplimientoMeta) || 0;
      const evidenciasSubidas = await uploadEvidencias();

      const payload = {
        fecha: fechaReporte,
        cedula_jefe: myCedula,
        nombre_jefe: colaboradorName,
        colaborador: colaboradorName,
        cargo: cargoName,
        turno: 'Jefatura',
        apertura_cierre: 'Jefatura',
        cumplimiento: `${numCumplimiento}%`,
        cumplimiento_meta: numCumplimiento,
        autorizaciones_cc: autorizacionesCC,
        reviso_horario: revisoHorario,
        observaciones: observacionesTurno,
        novedades: observacionesTurno || 'Sin observaciones adicionales.',
        pendientes: 'Sin pendientes.',
        checklist_data: selectedChecklist,
        evidencias: evidenciasSubidas,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bitacoras_jefes')
        .insert([payload])
        .select();

      if (error) throw error;

      // Registrar notificación en el centro de avisos
      await supabase.from('notificaciones').insert([{
        rol_destino: 'jefes',
        tipo: 'bitacora_jefe',
        titulo: `📋 Nueva Bitácora de Jefatura (${colaboradorName})`,
        mensaje: `Se ha registrado la bitácora de tienda para el turno del ${fechaReporte}.`,
        ruta_destino: '/bitacoras?tab=historial_bitacoras'
      }]);

      // Disparar Webhook Automático hacia n8n
      sendN8nEvent('BITACORA_INCIDENCIA', {
        tipo: 'Bitácora de Jefatura',
        fecha: fechaReporte,
        cumplimiento: `${numCumplimiento}%`,
        observaciones: observacionesTurno,
        total_evidencias: evidenciasSubidas.length,
        evidencias: evidenciasSubidas.map(e => e.url)
      }, user?.user_metadata);

      showFeedback('¡Bitácora de Jefatura registrada exitosamente!');
      setObservacionesTurno('');
      setSelectedChecklist({});
      setArchivos([]);
      fetchData();
      setActiveTab('historial_bitacoras');
    } catch (err) {
      console.error('Error submitting bitacora:', err);
      showFeedback('Error al guardar bitácora: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
      setUploadMsg('');
    }
  };

  // Enviar Reporte de Bodega
  const handleSubmitBodega = async (e) => {
    e.preventDefault();
    if (!formBodega.actividades) {
      alert('Por favor describe las actividades de bodega.');
      return;
    }
    setSubmitting(true);
    setUploadMsg('Procesando evidencias de bodega...');

    try {
      const evidenciasBodegaSubidas = await uploadEvidenciasBodega();

      const payload = {
        fecha: formBodega.fecha,
        colaborador: myFullName,
        turno: formBodega.turno || 'Intermedio',
        actividades: formBodega.actividades,
        guias_realizadas: formBodega.guias_realizadas,
        guias_descripcion: formBodega.guias_descripcion,
        video_confirmado: formBodega.video_confirmado,
        novedades: formBodega.novedades || 'Sin novedades en bodega.',
        pendientes: formBodega.pendientes || 'Sin pendientes en bodega.',
        evidencias: evidenciasBodegaSubidas,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('reportes_bodega')
        .insert([payload])
        .select();

      if (error) throw error;

      // Registrar notificación en el centro de avisos para bodega y jefes
      await supabase.from('notificaciones').insert([{
        rol_destino: 'bodega_y_jefes',
        tipo: 'reporte_bodega',
        titulo: `📦 Nuevo Reporte de Bodega (${myFullName})`,
        mensaje: `Se han registrado las actividades y novedades de bodega para el ${formBodega.fecha}.`,
        ruta_destino: '/bitacoras?tab=reportes_bodega'
      }]);

      // Disparar Webhook Automático hacia n8n
      sendN8nEvent('BITACORA_INCIDENCIA', {
        tipo: 'Reporte de Bodega & Mercadería',
        fecha: formBodega.fecha,
        actividades: formBodega.actividades,
        novedades: formBodega.novedades,
        total_evidencias: evidenciasBodegaSubidas.length,
        evidencias: evidenciasBodegaSubidas.map(e => e.url)
      }, user?.user_metadata);

      showFeedback('¡Reporte de bodega registrado con éxito!');
      setShowBodegaModal(false);
      setArchivosBodega([]);
      setFormBodega({
        fecha: todayStr,
        turno: 'Intermedio',
        actividades: '',
        guias_realizadas: 'SI',
        guias_descripcion: '',
        video_confirmado: 'SI',
        novedades: '',
        pendientes: ''
      });
      fetchData();
      setActiveTab('reportes_bodega');
    } catch (err) {
      console.error('Error submitting bodega report:', err);
      showFeedback('Error al guardar reporte de bodega: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
      setUploadMsg('');
    }
  };

  // Filtrado de Bitácoras de Jefes
  const filteredBitacoras = bitacorasTurnos.filter(b => {
    const matchSearch = !searchQuery || 
      (b.colaborador || b.nombre_jefe || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.observaciones || b.novedades || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  // Filtrado de Reportes de Bodega
  const filteredReportesBodega = reportesBodega.filter(rb => {
    const matchSearch = !searchBodegaQuery ||
      (rb.colaborador || '').toLowerCase().includes(searchBodegaQuery.toLowerCase()) ||
      (rb.actividades || '').toLowerCase().includes(searchBodegaQuery.toLowerCase()) ||
      (rb.guias_descripcion || '').toLowerCase().includes(searchBodegaQuery.toLowerCase()) ||
      (rb.novedades || '').toLowerCase().includes(searchBodegaQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isLight ? 'bg-slate-100/90 text-slate-900' : 'bg-[#060b17] text-white'
    }`}>
      
      {/* Navbar Compartida */}
      <Navbar />

      {/* Toast Feedback */}
      {notice && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-fade-in ${
          notice.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          <Sparkles className="w-4 h-4" />
          <span>{notice.msg}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">

        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Título e Icono según Rol */}
          <div className="flex items-center gap-3">
            {isBodeguero && !isDirectivo ? (
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
                <Package className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-indigo-600 text-white shadow-lg shadow-red-500/25">
                <ClipboardList className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className={`text-2xl sm:text-3xl font-title font-black uppercase tracking-tight ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                {isBodeguero && !isDirectivo ? 'Reportes de Bodega & Movimientos' : 'Bitácora de Jefatura'}
              </h1>
              <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isBodeguero && !isDirectivo
                  ? 'Registro de transferencias, guías de remisión, conteos y novedades de bodega de Marathon Sports MCP1.'
                  : 'Reporte oficial de control operativo, novedades, checklist y evidencias de Marathon Sports MCP1.'}
              </p>
            </div>
          </div>

          {/* Selector de Pestañas adaptado por Rol (Scrollable en móvil) */}
          <div className={`flex items-center gap-1 p-1 rounded-2xl border overflow-x-auto scrollbar-none w-full md:w-auto max-w-full ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            
            {/* VISTA PARA BODEGUERO */}
            {isBodeguero && !isDirectivo ? (
              <>
                <button
                  onClick={() => setActiveTab('enviar_bodega')}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                    activeTab === 'enviar_bodega'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30'
                      : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enviar Reporte</span>
                </button>

                <button
                  onClick={() => setActiveTab('reportes_bodega')}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                    activeTab === 'reportes_bodega'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30'
                      : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Ver Reportes Bodega</span>
                </button>
              </>
            ) : (
              /* VISTA PARA JEFATURA */
              <>
                <button
                  onClick={() => setActiveTab('bitacora_jefatura')}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                    activeTab === 'bitacora_jefatura'
                      ? 'bg-red-600 text-white shadow-md shadow-red-500/30'
                      : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Llenar Bitácora</span>
                </button>

                <button
                  onClick={() => setActiveTab('historial_bitacoras')}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                    activeTab === 'historial_bitacoras'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Ver Bitácoras</span>
                </button>

                <button
                  onClick={() => setActiveTab('reportes_bodega')}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                    activeTab === 'reportes_bodega'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30'
                      : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Supervisión Bodega</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* TAB BODEGA 1: FORMULARIO DIRECTO PARA BODEGUEROS */}
        {activeTab === 'enviar_bodega' && isBodeguero && (
          <form onSubmit={handleSubmitBodega} className="space-y-6 animate-fade-in">
            
            {/* FASE 01: DATOS GENERALES DE TURNO */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden space-y-6 transition-all ${
              isLight 
                ? 'bg-white border-slate-200 shadow-slate-200/50' 
                : 'bg-gradient-to-b from-[#0b1329] to-[#070c18] border-cyan-500/20 shadow-2xl shadow-cyan-950/20'
            }`}>
              
              <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0">
                  01
                </div>
                <div>
                  <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Datos Generales de Turno
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Información del colaborador y horario del día
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* COLABORADOR (AUTO) */}
                <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060b17]/80 border-slate-800/80'
                }`}>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                    {(myFullName || 'B').charAt(0)}
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Colaborador Oficial
                    </span>
                    <span className={`text-xs font-black block truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {myFullName}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-bold">Bodeguero / Operativo</span>
                  </div>
                </div>

                {/* FECHA * */}
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Fecha del Reporte *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={formBodega.fecha}
                      onChange={(e) => setFormBodega({ ...formBodega, fecha: e.target.value })}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-xs font-bold font-mono outline-none focus:border-cyan-500 transition ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#060b17] border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* TURNO * */}
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Turno de Trabajo *
                  </label>
                  <select
                    required
                    value={formBodega.turno}
                    onChange={(e) => setFormBodega({ ...formBodega, turno: e.target.value })}
                    className={`w-full px-4 py-3.5 rounded-2xl border text-xs font-bold outline-none focus:border-cyan-500 transition ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#060b17] border-slate-700 text-white'
                    }`}
                  >
                    <option value="Apertura">Apertura (Mañana)</option>
                    <option value="Intermedio">Intermedio (Tarde)</option>
                    <option value="Cierre">Cierre</option>
                    <option value="Completo">Turno Completo</option>
                  </select>
                </div>
              </div>

            </div>

            {/* FASE 02: ACTIVIDADES Y GUÍAS DE BODEGA */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden space-y-6 transition-all ${
              isLight 
                ? 'bg-white border-slate-200 shadow-slate-200/50' 
                : 'bg-gradient-to-b from-[#0b1329] to-[#070c18] border-cyan-500/20 shadow-2xl shadow-cyan-950/20'
            }`}>
              
              <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0">
                  02
                </div>
                <div>
                  <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Actividades y Guías de Bodega
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Control de mercadería recibida, guías y novedades operativas
                  </p>
                </div>
              </div>

              {/* ¿QUÉ ACTIVIDADES REALIZASTE HOY? * */}
              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  ¿Qué actividades realizaste hoy? *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formBodega.actividades}
                  onChange={(e) => setFormBodega({ ...formBodega, actividades: e.target.value })}
                  placeholder="Describe ingresos, egresos, conteo de mercadería de calzado o ropa, recepciones o despachos completados..."
                  className={`w-full p-4 rounded-2xl border text-xs font-medium outline-none focus:border-cyan-500 transition resize-none leading-relaxed ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-[#060b17] border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              {/* ¿REALIZASTE GUÍAS HOY? + DETALLE DE GUÍAS REALIZADAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    ¿Realizaste guías hoy? *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['SI', 'NO'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormBodega({ 
                          ...formBodega, 
                          guias_realizadas: opt,
                          guias_descripcion: opt === 'NO' ? '' : formBodega.guias_descripcion
                        })}
                        className={`py-3.5 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                          formBodega.guias_realizadas === opt
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-[#060b17] hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {opt === 'SI' ? 'Sí' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Detalle de guías realizadas
                  </label>
                  <input
                    type="text"
                    disabled={formBodega.guias_realizadas === 'NO'}
                    value={formBodega.guias_descripcion}
                    onChange={(e) => setFormBodega({ ...formBodega, guias_descripcion: e.target.value })}
                    placeholder={formBodega.guias_realizadas === 'NO' ? "Solo disponible si marcaste 'Sí'" : "Ej. Guías #48102, #48103 recibidas sin novedad"}
                    className={`w-full px-4 py-3.5 rounded-2xl border text-xs font-medium outline-none focus:border-cyan-500 transition ${
                      formBodega.guias_realizadas === 'NO'
                        ? isLight ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#060b17]/50 border-slate-800 text-slate-500 cursor-not-allowed'
                        : isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-[#060b17] border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* NOVEDADES O INCIDENTES DEL TURNO + PENDIENTES PARA EL SIGUIENTE TURNO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Novedades o incidentes del turno
                  </label>
                  <textarea
                    rows={3}
                    value={formBodega.novedades}
                    onChange={(e) => setFormBodega({ ...formBodega, novedades: e.target.value })}
                    placeholder="Inconvenientes con transportadoras, faltantes notables, rotura de cajas..."
                    className={`w-full p-4 rounded-2xl border text-xs font-medium outline-none focus:border-cyan-500 transition resize-none leading-relaxed ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-[#060b17] border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Pendientes para el siguiente turno
                  </label>
                  <textarea
                    rows={3}
                    value={formBodega.pendientes}
                    onChange={(e) => setFormBodega({ ...formBodega, pendientes: e.target.value })}
                    placeholder="Cajas por perchar, mercadería por codificar, etc..."
                    className={`w-full p-4 rounded-2xl border text-xs font-medium outline-none focus:border-cyan-500 transition resize-none leading-relaxed ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-[#060b17] border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

            </div>

            {/* FASE 03: VIDEO DEL DÍA (SUBIDA OBLIGATORIA) */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden space-y-6 transition-all ${
              isLight 
                ? 'bg-white border-slate-200 shadow-slate-200/50' 
                : 'bg-gradient-to-b from-[#0b1329] to-[#070c18] border-cyan-500/20 shadow-2xl shadow-cyan-950/20'
            }`}>
              
              <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0">
                  03
                </div>
                <div>
                  <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Video del Día (Subida obligatoria)
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Evidencia audiovisual de cierre de bodega
                  </p>
                </div>
              </div>

              {/* Box de Instrucciones */}
              <div className={`p-5 rounded-2xl border flex items-start gap-3.5 ${
                isLight ? 'bg-cyan-50/70 border-cyan-200 text-slate-800' : 'bg-[#060b17]/90 border-cyan-500/30 text-slate-200'
              }`}>
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0 mt-0.5">
                  <Video className="w-5 h-5" />
                </div>
                <div className="text-xs space-y-1">
                  <span className="font-black text-sm text-cyan-400 block">
                    📹 Instrucciones de subida del video de cierre
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Por favor, sube el video de cierre de bodega dentro del recuadro de Google Forms a continuación. Una vez subido exitosamente, haz clic en <strong>"Enviar"</strong> dentro del recuadro e inmediatamente marca la casilla de confirmación de abajo.
                  </p>
                </div>
              </div>

              {/* Iframe Embebido de Google Forms */}
              <div className="rounded-3xl border border-slate-800 overflow-hidden bg-white shadow-2xl relative">
                <iframe
                  src="https://docs.google.com/forms/d/e/1FAIpQLSfeUm6CwH9lne9GHT35Opy5TTyaGIfY0BXYW7-BRaw0ekh7hw/viewform?embedded=true"
                  title="Formulario de Videos de Bodega"
                  className="w-full h-[520px] sm:h-[600px] border-0"
                >
                  Cargando formulario de Google...
                </iframe>
              </div>

              {/* Casilla de Confirmación Verde */}
              <div
                onClick={() => setFormBodega({
                  ...formBodega,
                  video_confirmado: formBodega.video_confirmado === 'SI' ? 'NO' : 'SI'
                })}
                className={`p-4 sm:p-5 rounded-2xl border flex items-center gap-3.5 cursor-pointer select-none transition-all duration-200 ${
                  formBodega.video_confirmado === 'SI'
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300 shadow-md shadow-emerald-950/50'
                    : isLight ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                  formBodega.video_confirmado === 'SI'
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm scale-105'
                    : isLight ? 'border-slate-400 bg-white' : 'border-slate-600 bg-slate-900'
                }`}>
                  {formBodega.video_confirmado === 'SI' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <span className="text-xs sm:text-sm font-black leading-snug">
                  ✓ Confirmo que ya subí y envié el video del día mediante el formulario de arriba
                </span>
              </div>

            </div>

            {/* FASE 04: EVIDENCIAS DEL TURNO */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden space-y-6 transition-all ${
              isLight 
                ? 'bg-white border-slate-200 shadow-slate-200/50' 
                : 'bg-gradient-to-b from-[#0b1329] to-[#070c18] border-cyan-500/20 shadow-2xl shadow-cyan-950/20'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0">
                    04
                  </div>
                  <div>
                    <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Evidencias del Turno
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Sube fotos, PDFs o cualquier archivo de evidencia. Máximo 10 archivos, 15 MB cada uno.
                    </p>
                  </div>
                </div>

                {archivosBodega.length > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    {archivosBodega.length} {archivosBodega.length === 1 ? 'archivo cargado' : 'archivos cargados'}
                  </span>
                )}
              </div>

              {/* Zona Drag & Drop de Bodega */}
              <div
                onClick={() => fileInputBodegaRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.length) {
                    handleAddFilesBodega(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:scale-[1.005] ${
                  isLight 
                    ? 'border-slate-300 hover:border-cyan-500 bg-slate-50/70' 
                    : 'border-slate-700 hover:border-cyan-500/80 bg-[#060b17]/70'
                }`}
              >
                <input
                  ref={fileInputBodegaRef}
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleAddFilesBodega(e.target.files);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />

                <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-3">
                  <Upload className="w-8 h-8 animate-pulse" />
                </div>

                <span className={`text-sm font-black uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Arrastra o haz clic para subir
                </span>
                <p className="text-xs text-slate-400 max-w-md mb-4">
                  Fotos, PDFs, Excel, Word y más · Máx. 10 archivos · 15 MB cada uno
                </p>

                {/* Badges de Formatos */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    FOTO
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                    PDF
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    EXCEL
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                    WORD
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-500/20 text-slate-400 border border-slate-500/40">
                    OTROS
                  </span>
                </div>
              </div>

              {/* Grid de Archivos Cargados en Bodega */}
              {archivosBodega.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
                  {archivosBodega.map((file, idx) => {
                    const meta = getFileMetadata(file);
                    const isImg = meta.isImg;
                    const previewUrl = isImg ? URL.createObjectURL(file) : null;
                    const sizeKB = (file.size / 1024).toFixed(0);
                    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                    const sizeLabel = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

                    return (
                      <div 
                        key={idx}
                        className={`relative rounded-2xl border overflow-hidden flex flex-col group transition-all ${
                          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#060b17] border-slate-800'
                        }`}
                      >
                        {isImg && previewUrl ? (
                          <div className="h-32 w-full overflow-hidden bg-black/40 relative">
                            <img 
                              src={previewUrl} 
                              alt={file.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          </div>
                        ) : (
                          <div className={`h-32 w-full flex flex-col items-center justify-center gap-1.5 ${meta.bg}`}>
                            <meta.Icon className={`w-10 h-10 ${meta.color}`} />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${meta.color}`}>
                              {meta.label}
                            </span>
                          </div>
                        )}

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`} title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                            <span className={`font-bold ${meta.color}`}>{meta.label}</span>
                            <span>{sizeLabel}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFileBodega(idx);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg transition active:scale-90 cursor-pointer"
                          title="Quitar archivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* BOTÓN ENVIAR REPORTE DE BODEGA */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              {uploadMsg ? (
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{uploadMsg}</span>
                </div>
              ) : <div></div>}

              <button
                type="submit"
                disabled={submitting}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando Reporte de Bodega...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Guardar y Enviar Reporte de Bodega</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB JEFATURA 1: FORMULARIO BITÁCORA DE JEFATURA (SOLO PARA JEFES) */}
        {activeTab === 'bitacora_jefatura' && isDirectivo && (
          <form onSubmit={handleSubmitBitacora} className="space-y-6 animate-fade-in">
            
            {/* SECCIÓN 01: INFORMACIÓN GENERAL DEL REPORTE */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden space-y-6 transition-all ${
              isLight 
                ? 'bg-white border-slate-200 shadow-slate-200/50' 
                : 'bg-gradient-to-b from-[#18090f] to-[#070c18] border-red-500/20 shadow-2xl shadow-red-950/20'
            }`}>
              
              <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
                  01
                </div>
                <div>
                  <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Información General del Reporte
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Ingresa tus datos y los indicadores principales de la jornada
                  </p>
                </div>
              </div>

              {/* Nombre del Colaborador y Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060b17]/80 border-slate-800/80'
                }`}>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-red-500/25">
                    {(colaboradorName || 'J').charAt(0)}
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Responsable de Jefatura
                    </span>
                    <span className={`text-xs font-black block truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {colaboradorName}
                    </span>
                    <span className="text-[10px] text-red-400 font-bold">{cargoName}</span>
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    Cargo Oficial *
                  </label>
                  <input
                    type="text"
                    required
                    value={cargoName}
                    onChange={(e) => setCargoName(e.target.value)}
                    placeholder="Ej. Jefe de Tienda / Subjefe..."
                    className={`w-full px-4 py-3.5 rounded-2xl border text-xs font-bold outline-none focus:border-red-500 transition ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#060b17] border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Fecha del Reporte y Cumplimiento de Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    Fecha del Reporte *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={fechaReporte}
                      onChange={(e) => setFechaReporte(e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-xs font-bold font-mono outline-none focus:border-red-500 transition ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#060b17] border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    Cumplimiento de Meta (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={cumplimientoMeta}
                      onChange={(e) => setCumplimientoMeta(e.target.value)}
                      placeholder="Ej: 95.50"
                      className={`w-full px-4 py-3.5 rounded-2xl border text-xs font-bold font-mono outline-none focus:border-red-500 transition ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#060b17] border-slate-700 text-white'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-red-400 pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones Segmentados: Autorizaciones CC y Horario General */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    ¿Subiste autorizaciones del Centro Comercial?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Sí', 'No', 'No aplica'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAutorizacionesCC(opt)}
                        className={`py-3.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                          autorizacionesCC === opt
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-lg shadow-red-500/25 scale-[1.02]'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-[#060b17] hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    ¿Revisaste el horario general?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Sí', 'No'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setRevisoHorario(opt)}
                        className={`py-3.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                          revisoHorario === opt
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-lg shadow-red-500/25 scale-[1.02]'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-[#060b17] hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Observaciones del Turno / Novedades */}
              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Observaciones del Turno / Novedades
                </label>
                <textarea
                  rows={3}
                  value={observacionesTurno}
                  onChange={(e) => setObservacionesTurno(e.target.value)}
                  placeholder="Escribe comentarios, novedades con el personal, incidentes o cualquier detalle del día..."
                  className={`w-full p-4 rounded-2xl border text-xs font-medium outline-none focus:border-red-500 transition resize-none leading-relaxed ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-[#060b17] border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>

            </div>

            {/* SECCIÓN 02: CHECKLIST ADMINISTRATIVO */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden space-y-6 transition-all ${
              isLight 
                ? 'bg-white border-slate-200 shadow-slate-200/50' 
                : 'bg-gradient-to-b from-[#18090f] to-[#070c18] border-red-500/20 shadow-2xl shadow-red-950/20'
            }`}>
              <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
                  02
                </div>
                <div>
                  <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Checklist Administrativo
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Marca todas las actividades que completaste el día de hoy
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {CHECKLIST_ADMINISTRATIVO.map(item => {
                  const isChecked = !!selectedChecklist[item.key];

                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleCheckItem(item.key)}
                      className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200 ${
                        isChecked
                          ? (isLight ? 'bg-red-50/90 border-red-300 text-red-950 shadow-xs' : 'bg-red-950/25 border-red-500/50 text-red-100 shadow-xs')
                          : (isLight ? 'bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-slate-100' : 'bg-[#060b17]/80 border-slate-800 text-slate-300 hover:border-slate-700')
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isChecked 
                          ? 'bg-[#E30613] border-[#E30613] text-white shadow-sm scale-105' 
                          : isLight ? 'border-slate-400 bg-white' : 'border-slate-600 bg-slate-900'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <span className="text-xs font-semibold leading-snug">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 03: CHECKLIST OPERATIVO (PISO DE VENTAS) */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden space-y-6 transition-all ${
              isLight 
                ? 'bg-white border-slate-200 shadow-slate-200/50' 
                : 'bg-gradient-to-b from-[#18090f] to-[#070c18] border-red-500/20 shadow-2xl shadow-red-950/20'
            }`}>
              <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
                  03
                </div>
                <div>
                  <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Checklist Operativo (Piso de Ventas)
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Tareas operativas realizadas hoy agrupadas por zonas de tienda
                  </p>
                </div>
              </div>

              {CATEGORIAS_OP.map(cat => (
                <div key={cat.titulo} className="pt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full bg-[#E30613]"></div>
                    <span className={`text-[11px] font-black uppercase tracking-wider text-[#E30613]`}>
                      {cat.titulo}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cat.campos.map(item => {
                      const isChecked = !!selectedChecklist[item.key];

                      return (
                        <div
                          key={item.key}
                          onClick={() => toggleCheckItem(item.key)}
                          className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200 ${
                            isChecked
                              ? (isLight ? 'bg-red-50/90 border-red-300 text-red-950 shadow-xs' : 'bg-red-950/25 border-red-500/50 text-red-100 shadow-xs')
                              : (isLight ? 'bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-slate-100' : 'bg-[#060b17]/80 border-slate-800 text-slate-300 hover:border-slate-700')
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isChecked 
                              ? 'bg-[#E30613] border-[#E30613] text-white shadow-sm scale-105' 
                              : isLight ? 'border-slate-400 bg-white' : 'border-slate-600 bg-slate-900'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-semibold leading-snug">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* SECCIÓN 04: EVIDENCIAS & ARCHIVOS ADJUNTOS */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden space-y-6 transition-all ${
              isLight 
                ? 'bg-white border-slate-200 shadow-slate-200/50' 
                : 'bg-gradient-to-b from-[#18090f] to-[#070c18] border-red-500/20 shadow-2xl shadow-red-950/20'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
                    04
                  </div>
                  <div>
                    <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Evidencias & Archivos Adjuntos
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Carga fotografías de exhibición, archivos Excel, Word, PDFs o cualquier respaldo
                    </p>
                  </div>
                </div>

                {archivos.length > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                    {archivos.length} {archivos.length === 1 ? 'archivo cargado' : 'archivos cargados'}
                  </span>
                )}
              </div>

              {/* Zona Drag & Drop */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.length) {
                    handleAddFiles(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:scale-[1.005] ${
                  isLight 
                    ? 'border-slate-300 hover:border-red-500 bg-slate-50/70' 
                    : 'border-slate-700 hover:border-red-500/80 bg-[#060b17]/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleAddFiles(e.target.files);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />

                <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 mb-3">
                  <Upload className="w-8 h-8 animate-pulse" />
                </div>

                <span className={`text-sm font-black uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Arrastra o haz clic para subir
                </span>
                <p className="text-xs text-slate-400 max-w-md mb-4">
                  Soporta fotografías (JPG, PNG), hojas de cálculo (Excel / CSV), documentos (Word), PDFs y más (hasta 30 MB por archivo).
                </p>

                {/* Badges de Formatos */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    FOTO
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                    PDF
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    EXCEL
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                    WORD
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-500/20 text-slate-400 border border-slate-500/40">
                    OTROS
                  </span>
                </div>
              </div>

              {/* Grid de Archivos Cargados */}
              {archivos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
                  {archivos.map((file, idx) => {
                    const meta = getFileMetadata(file);
                    const isImg = meta.isImg;
                    const previewUrl = isImg ? URL.createObjectURL(file) : null;
                    const sizeKB = (file.size / 1024).toFixed(0);
                    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                    const sizeLabel = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

                    return (
                      <div 
                        key={idx}
                        className={`relative rounded-2xl border overflow-hidden flex flex-col group transition-all ${
                          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#060b17] border-slate-800'
                        }`}
                      >
                        {isImg && previewUrl ? (
                          <div className="h-32 w-full overflow-hidden bg-black/40 relative">
                            <img 
                              src={previewUrl} 
                              alt={file.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          </div>
                        ) : (
                          <div className={`h-32 w-full flex flex-col items-center justify-center gap-1.5 ${meta.bg}`}>
                            <meta.Icon className={`w-10 h-10 ${meta.color}`} />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${meta.color}`}>
                              {meta.label}
                            </span>
                          </div>
                        )}

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`} title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                            <span className={`font-bold ${meta.color}`}>{meta.label}</span>
                            <span>{sizeLabel}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg transition active:scale-90 cursor-pointer"
                          title="Quitar archivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* BOTÓN REGISTRAR BITÁCORA */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              {uploadMsg ? (
                <div className="flex items-center gap-2 text-xs font-bold text-red-500 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{uploadMsg}</span>
                </div>
              ) : <div></div>}

              <button
                type="submit"
                disabled={submitting}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-500/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando Bitácora de Jefatura...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Guardar y Registrar Bitácora de Jefatura</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* TAB JEFATURA 2: HISTORIAL DE BITÁCORAS DE JEFATURA (SOLO PARA JEFES) */}
        {activeTab === 'historial_bitacoras' && isDirectivo && (
          <div className="space-y-4 animate-fade-in">
            
            <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por colaborador u observaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-xs font-bold outline-none focus:border-red-500 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#060b17] border-slate-700 text-white'
                  }`}
                />
              </div>

              <button
                onClick={fetchData}
                className={`p-2 rounded-xl border transition ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Refrescar bitácoras"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {filteredBitacoras.length === 0 ? (
              <div className={`p-12 text-center rounded-3xl border ${
                isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}>
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30 text-red-500" />
                <h4 className="font-bold text-sm">No se encontraron bitácoras de jefatura</h4>
                <p className="text-xs mt-1">Registra una nueva bitácora desde la pestaña "Llenar Bitácora Jefes".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBitacoras.map((b) => {
                  const evList = Array.isArray(b.evidencias) ? b.evidencias : [];

                  return (
                    <div 
                      key={b.id}
                      className={`p-6 rounded-3xl border shadow-lg transition-all space-y-3.5 ${
                        isLight 
                          ? 'bg-white border-slate-200' 
                          : 'bg-gradient-to-b from-[#18090f] to-[#070c18] border-red-500/20 shadow-xl shadow-red-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
                          👑 Jefatura • {b.cumplimiento || `${b.cumplimiento_meta || 0}%`}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {b.fecha}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-red-500/25">
                          {(b.colaborador || b.nombre_jefe || 'J').charAt(0)}
                        </div>
                        <div className="truncate">
                          <span className={`text-xs font-black block leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {(() => {
                              const raw = b.colaborador || b.nombre_jefe || '';
                              const lower = raw.toLowerCase();
                              if (lower.includes('valenzuela')) return 'José Valenzuela';
                              if (lower.includes('cruz')) return 'Alain Cruz';
                              if (lower.includes('chiscuet') || lower.includes('genesis')) return 'Génesis Chiscuet';
                              const parts = raw.trim().split(/\s+/).filter(Boolean);
                              return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : (parts[0] || 'Jefatura');
                            })()}
                          </span>
                          <span className="text-[10px] text-red-400 font-semibold">
                            {b.cargo || 'Jefe de Tienda'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060b17] border-slate-800'}`}>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Autorizaciones CC:</span>
                          <span className="font-black text-red-400">{b.autorizaciones_cc || 'No aplica'}</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060b17] border-slate-800'}`}>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Revisó Horario:</span>
                          <span className="font-black text-blue-400">{b.reviso_horario || 'Sí'}</span>
                        </div>
                      </div>

                      {b.observaciones && (
                        <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                          isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#060b17] border-slate-800 text-slate-200'
                        }`}>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Observaciones del Turno:
                          </span>
                          <p className="leading-relaxed">{b.observaciones}</p>
                        </div>
                      )}

                      {/* Evidencias Adjuntas con Miniaturas Interactivas */}
                      {evList.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-red-400 block">
                            Evidencias ({evList.length}):
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {evList.map((ev, idx) => {
                              const meta = getFileMetadata(ev);
                              return meta.isImg ? (
                                <div
                                  key={idx}
                                  onClick={() => setFullScreenImg(ev)}
                                  className="relative h-20 rounded-xl overflow-hidden border border-slate-700/80 bg-black/40 group cursor-pointer"
                                >
                                  <img 
                                    src={ev.url} 
                                    alt={ev.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                                      Ver
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  key={idx}
                                  href={ev.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={ev.name}
                                  className="p-2 rounded-xl border border-slate-700/80 bg-slate-900/90 flex items-center gap-2 hover:border-red-500 transition"
                                >
                                  <div className={`p-1.5 rounded-lg ${meta.bg} ${meta.color} shrink-0`}>
                                    <meta.Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="truncate min-w-0">
                                    <span className="text-[10px] font-bold text-white truncate block">{ev.name}</span>
                                    <span className={`text-[8px] font-bold ${meta.color}`}>{meta.label}</span>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Control y Check-in Rápido de Jefatura */}
                      {(() => {
                        const creatorName = b.colaborador || b.nombre_jefe || 'Jefe de Tienda';
                        const creatorCedula = String(b.cedula_jefe || '');
                        const isCreator = (creatorCedula && creatorCedula === myCedula) || 
                          creatorName.toLowerCase().includes(myNombreCompleto.toLowerCase()) ||
                          myNombreCompleto.toLowerCase().includes(creatorName.toLowerCase());

                        const itemCheckins = checkins.filter(c => c.tipo === 'bitacora_jefe' && String(c.referencia_id) === String(b.id));
                        const hasMyCheckin = itemCheckins.some(c => String(c.usuario_cedula) === myCedula);

                        return (
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            {isCreator ? (
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                                <Crown className="w-3.5 h-3.5 text-amber-500" />
                                <span>Creado por ti</span>
                              </span>
                            ) : hasMyCheckin ? (
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Enterado</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleCheckin('bitacora_jefe', b.id, `Bitácora ${b.fecha}`, creatorName)}
                                disabled={actionInProgress}
                                className="flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Marcar Enterado</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedBitacora(b)}
                              className="px-3 py-1.5 rounded-xl border border-red-500/30 hover:bg-red-500/15 text-red-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <span>Ver detalle</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: REPORTES DE BODEGA (DISPONIBLE PARA BODEGUEROS Y JEFES) */}
        {activeTab === 'reportes_bodega' && (
          <div className="space-y-4 animate-fade-in">
            <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              <div>
                <h3 className={`text-base font-black uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isBodeguero && !isDirectivo ? 'Historial de Reportes de Bodega' : 'Supervisión de Reportes de Bodega'}
                </h3>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isBodeguero && !isDirectivo
                    ? 'Consulta tus reportes y los de tus otros compañeros del equipo de bodega.'
                    : 'Auditoría y control de recepción de transferencias y guías de bodega.'}
                </p>
              </div>

              {isBodeguero && !isDirectivo ? (
                <button
                  onClick={() => setActiveTab('enviar_bodega')}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Reporte de Bodega</span>
                </button>
              ) : (
                <div className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                }`}>
                  <span>👑 Modo Supervisión Jefatura</span>
                </div>
              )}
            </div>

            {/* Buscador de Reportes de Bodega */}
            <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por bodeguero, actividades o guías..."
                  value={searchBodegaQuery}
                  onChange={(e) => setSearchBodegaQuery(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-xs font-bold outline-none focus:border-cyan-500 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#060b17] border-slate-700 text-white'
                  }`}
                />
              </div>

              <button
                onClick={fetchData}
                className={`p-2 rounded-xl border transition ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Refrescar reportes"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {filteredReportesBodega.length === 0 ? (
              <div className={`p-12 text-center rounded-3xl border ${
                isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}>
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-500" />
                <h4 className="font-bold text-sm">No hay reportes de bodega registrados</h4>
                <p className="text-xs mt-1">Los reportes enviados por el equipo de bodega aparecerán aquí.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReportesBodega.map((rb) => (
                  <div 
                    key={rb.id}
                    className={`p-5 rounded-3xl border shadow-lg space-y-3.5 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        Bodega • Turno {rb.turno}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {rb.fecha}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                        {(rb.colaborador || 'B').charAt(0)}
                      </div>
                      <div>
                        <span className={`text-xs font-black block leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {rb.colaborador}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">Bodeguero / Operativo</span>
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#060b17] border-slate-800 text-slate-200'
                    }`}>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                          Actividades Realizadas:
                        </span>
                        <p className="leading-relaxed">{rb.actividades}</p>
                      </div>

                      {rb.guias_descripcion && (
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                            Guías & Transferencias:
                          </span>
                          <p className="font-mono text-cyan-400">{rb.guias_descripcion}</p>
                        </div>
                      )}

                      {rb.novedades && (
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
                            Novedades / Pendientes:
                          </span>
                          <p className="text-amber-300">{rb.novedades}</p>
                        </div>
                      )}

                      {/* Evidencias de Bodega */}
                      {Array.isArray(rb.evidencias) && rb.evidencias.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                            Evidencias ({rb.evidencias.length}):
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {rb.evidencias.map((ev, idx) => {
                              const meta = getFileMetadata(ev);
                              return meta.isImg ? (
                                <div
                                  key={idx}
                                  onClick={() => setFullScreenImg(ev)}
                                  className="relative h-20 rounded-xl overflow-hidden border border-slate-700/80 bg-black/40 group cursor-pointer"
                                >
                                  <img 
                                    src={ev.url} 
                                    alt={ev.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                                      Ver
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  key={idx}
                                  href={ev.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={ev.name}
                                  className="p-2 rounded-xl border border-slate-700/80 bg-slate-900/90 flex items-center gap-2 hover:border-cyan-500 transition"
                                >
                                  <div className={`p-1.5 rounded-lg ${meta.bg} ${meta.color} shrink-0`}>
                                    <meta.Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="truncate min-w-0">
                                    <span className="text-[10px] font-bold text-white truncate block">{ev.name}</span>
                                    <span className={`text-[8px] font-bold ${meta.color}`}>{meta.label}</span>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Check-in y Control de Lectura de Bodega */}
                      {(() => {
                        const creatorName = rb.colaborador || 'Bodeguero';
                        const isCreator = creatorName.toLowerCase().includes(myNombreCompleto.toLowerCase()) ||
                          myNombreCompleto.toLowerCase().includes(creatorName.toLowerCase());

                        const itemCheckins = checkins.filter(c => c.tipo === 'reporte_bodega' && String(c.referencia_id) === String(rb.id));
                        const hasMyCheckin = itemCheckins.some(c => String(c.usuario_cedula) === myCedula);
                        const readCedulas = new Set(itemCheckins.map(c => String(c.usuario_cedula || '')));

                        const pendingList = bodeguerosRoster.filter(emp => {
                          const isCreatorEmp = emp.nombres.toLowerCase().includes(creatorName.toLowerCase()) ||
                            creatorName.toLowerCase().includes(emp.nombres.toLowerCase());
                          return !isCreatorEmp && !readCedulas.has(String(emp.cedula));
                        });

                        return (
                          <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              {isCreator ? (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Creado por ti</span>
                                </span>
                              ) : hasMyCheckin ? (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Enterado</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleCheckin('reporte_bodega', rb.id, `Reporte Bodega ${rb.fecha}`, creatorName)}
                                  disabled={actionInProgress}
                                  className="flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Marcar Enterado</span>
                                </button>
                              )}

                              <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Users className="w-3 h-3 text-cyan-400" />
                                <span>{itemCheckins.length + 1}/{bodeguerosRoster.length || 3} Enterados</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL DETALLE DE BITÁCORA */}
      {selectedBitacora && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${
          isLight ? 'bg-slate-900/50' : 'bg-slate-950/85'
        }`}>
          <div className={`border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`p-6 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-md shadow-red-500/25">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Detalle de Bitácora de Jefatura
                  </h3>
                  <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Fecha: {selectedBitacora.fecha}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBitacora(null)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060b17] border-slate-800'
              }`}>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Colaborador</span>
                  <span className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedBitacora.colaborador || selectedBitacora.nombre_jefe}
                  </span>
                  <span className="text-xs text-red-500 font-bold block mt-0.5">{selectedBitacora.cargo}</span>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-red-500/15 text-red-500 border border-red-500/30 font-mono font-black text-sm">
                  {selectedBitacora.cumplimiento || `${selectedBitacora.cumplimiento_meta || 0}%`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3.5 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060b17] border-slate-800'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Autorizaciones CC</span>
                  <span className="text-xs font-black text-red-500">{selectedBitacora.autorizaciones_cc || 'No aplica'}</span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060b17] border-slate-800'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Revisó Horario General</span>
                  <span className="text-xs font-black text-blue-500">{selectedBitacora.reviso_horario || 'Sí'}</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060b17] border-slate-800'
              }`}>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Observaciones / Novedades:</span>
                  <p className={`leading-relaxed ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {selectedBitacora.observaciones || selectedBitacora.novedades || 'Sin observaciones.'}
                  </p>
                </div>
              </div>

              {selectedBitacora.checklist_data && Object.keys(selectedBitacora.checklist_data).length > 0 && (
                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060b17] border-slate-800'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Checklist Realizado:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(selectedBitacora.checklist_data).map(([k, val]) => (
                      val ? (
                        <span key={k} className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-600 border border-red-500/30 text-[10px] font-bold">
                          ✓ {k.replace('adm_', '').replace('op_', '').replace(/_/g, ' ')}
                        </span>
                      ) : null
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* SECCIÓN DE CHECK-IN Y AUDITORÍA DE LECTURAS ENTRE JEFES */}
              {/* ========================================================= */}
              {(() => {
                const creatorName = selectedBitacora.colaborador || selectedBitacora.nombre_jefe || 'Jefe de Tienda';
                const creatorCedula = String(selectedBitacora.cedula_jefe || '');
                const isCreator = (creatorCedula && creatorCedula === myCedula) || 
                  creatorName.toLowerCase().includes(myNombreCompleto.toLowerCase()) ||
                  myNombreCompleto.toLowerCase().includes(creatorName.toLowerCase());

                const itemCheckins = checkins.filter(c => c.tipo === 'bitacora_jefe' && String(c.referencia_id) === String(selectedBitacora.id));
                const hasMyCheckin = itemCheckins.some(c => String(c.usuario_cedula) === myCedula);
                const readCedulas = new Set(itemCheckins.map(c => String(c.usuario_cedula || '')));

                const pendingList = jefesRoster.filter(emp => {
                  const isCreatorEmp = emp.nombres.toLowerCase().includes(creatorName.toLowerCase()) ||
                    creatorName.toLowerCase().includes(emp.nombres.toLowerCase());
                  return !isCreatorEmp && !readCedulas.has(String(emp.cedula));
                });

                return (
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#060b17] border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between gap-2 border-b pb-2.5 border-slate-800/40">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-black uppercase tracking-wider">
                          Control de Lectura y Check-in de Jefatura
                        </span>
                      </div>

                      {/* Estado del usuario activo */}
                      {isCreator ? (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>Creado por ti (Autor)</span>
                        </span>
                      ) : hasMyCheckin ? (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Confirmado por ti</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCheckin('bitacora_jefe', selectedBitacora.id, `Bitácora ${selectedBitacora.fecha}`, creatorName)}
                          disabled={actionInProgress}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-blue-600 hover:bg-blue-500 text-white shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Confirmar Check-in</span>
                        </button>
                      )}
                    </div>

                    {/* Tabs: Enterados vs Faltan */}
                    <div className={`p-1 rounded-xl border flex items-center gap-1 ${
                      isLight ? 'bg-slate-200/60 border-slate-300' : 'bg-slate-900 border-slate-800'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setModalCheckinTab('enterados')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          modalCheckinTab === 'enterados'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Enterados ({itemCheckins.length + 1})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalCheckinTab('pendientes')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          modalCheckinTab === 'pendientes'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>Faltan ({pendingList.length})</span>
                      </button>
                    </div>

                    {/* Contenido: Enterados */}
                    {modalCheckinTab === 'enterados' && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {/* Creador */}
                        <div className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                          isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-950/20 border-amber-500/30 text-amber-100'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold block truncate">{creatorName}</span>
                              <span className="text-[9px] text-slate-400">Autor / Creador</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-amber-400 font-bold">Emitido</span>
                        </div>

                        {/* Pares */}
                        {itemCheckins.map((c, i) => (
                          <div key={i} className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                          }`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div className="truncate">
                                <span className="font-bold block truncate">{c.usuario_nombre}</span>
                                <span className="text-[9px] text-slate-400">{c.usuario_cargo}</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono text-emerald-400">
                              {new Date(c.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contenido: Pendientes */}
                    {modalCheckinTab === 'pendientes' && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {pendingList.length === 0 ? (
                          <div className="py-3 text-center text-emerald-400 text-xs font-bold">
                            🎉 ¡Todos los jefes han confirmado la lectura de esta bitácora!
                          </div>
                        ) : (
                          pendingList.map((emp, i) => (
                            <div key={i} className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800 text-slate-300'
                            }`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                <div className="truncate">
                                  <span className="font-bold block truncate">{emp.nombres}</span>
                                  <span className="text-[9px] text-slate-400">{emp.cargo}</span>
                                </div>
                              </div>
                              <span className="text-[9px] text-amber-400 font-bold">Sin revisar</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Evidencias Adjuntas */}
              {Array.isArray(selectedBitacora.evidencias) && selectedBitacora.evidencias.length > 0 && (
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060b17] border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Evidencias y Archivos Adjuntos ({selectedBitacora.evidencias.length}):
                    </span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Haz clic en una imagen para verla en grande
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedBitacora.evidencias.map((ev, i) => {
                      const meta = getFileMetadata(ev);
                      const isImg = meta.isImg;

                      return isImg ? (
                        <div 
                          key={i}
                          className={`group relative rounded-2xl border overflow-hidden flex flex-col transition shadow-sm ${
                            isLight 
                              ? 'bg-white border-slate-200 hover:border-red-400' 
                              : 'bg-slate-900/80 border-slate-800 hover:border-red-500/50'
                          }`}
                        >
                          <div 
                            onClick={() => setFullScreenImg(ev)}
                            className="h-32 w-full overflow-hidden bg-black/5 relative cursor-pointer"
                          >
                            <img 
                              src={ev.url} 
                              alt={ev.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                                🔍 Ver grande
                              </span>
                            </div>
                          </div>

                          <div className={`p-2.5 flex items-center justify-between gap-2 border-t ${
                            isLight ? 'border-slate-200 bg-slate-100/80' : 'border-slate-800/80 bg-slate-950/60'
                          }`}>
                            <div className="truncate">
                              <span className={`text-[11px] font-bold block truncate ${isLight ? 'text-slate-900' : 'text-white'}`} title={ev.name}>
                                {ev.name}
                              </span>
                              <span className={`text-[9px] font-bold uppercase ${meta.color}`}>{meta.label}</span>
                            </div>
                            <a
                              href={ev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={ev.name}
                              className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition shrink-0"
                              title="Descargar imagen completa"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div 
                          key={i}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition ${
                            isLight ? 'border-slate-200 bg-white hover:border-slate-300' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.color} shrink-0`}>
                              <meta.Icon className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <span className={`text-xs font-bold block truncate ${isLight ? 'text-slate-900' : 'text-white'}`} title={ev.name}>
                                {ev.name}
                              </span>
                              <span className={`text-[9px] font-bold ${meta.color}`}>{meta.label}</span>
                            </div>
                          </div>

                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={ev.name}
                            className={`p-2 rounded-xl transition shrink-0 flex items-center gap-1 text-[10px] font-bold ${
                              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                            title="Descargar archivo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={`p-4 border-t flex justify-end ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <button
                onClick={() => setSelectedBitacora(null)}
                className={`px-5 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                  isLight ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISOR DE IMAGEN EN PANTALLA COMPLETA (LIGHTBOX) */}
      {fullScreenImg && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
            isLight ? 'bg-slate-900/60' : 'bg-black/90'
          }`}
          onClick={() => setFullScreenImg(null)}
        >
          <div 
            className={`relative max-w-4xl w-full max-h-[90vh] border rounded-3xl overflow-hidden shadow-2xl flex flex-col ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 border-b flex items-center justify-between gap-4 ${
              isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950/90 border-slate-800'
            }`}>
              <div className="truncate">
                <h4 className={`text-sm font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {fullScreenImg.name}
                </h4>
                <span className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Fotografía de Evidencia
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={fullScreenImg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={fullScreenImg.name}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </a>
                <button
                  onClick={() => setFullScreenImg(null)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className={`p-3 overflow-auto flex items-center justify-center max-h-[75vh] ${
              isLight ? 'bg-slate-100/90' : 'bg-black/60'
            }`}>
              <img 
                src={fullScreenImg.url} 
                alt={fullScreenImg.name} 
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg border border-slate-300/40 dark:border-slate-800"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
