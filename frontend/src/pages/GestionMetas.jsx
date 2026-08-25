import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/layout/Navbar';
import { parseMetasExcel, syncMetasToSupabase, PERIOD_COLORS, getCollaboratorMeta } from '../services/metasExcelParser';
import { sendN8nEvent } from '../services/n8nService';
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Upload, 
  Search, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  User, 
  FileSpreadsheet, 
  ChevronRight, 
  Layers, 
  BarChart3, 
  ShieldCheck,
  Check,
  AlertCircle,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ExternalLink,
  X,
  RotateCcw,
  Award,
  Zap,
  MessageSquare
} from 'lucide-react';
import CoachingModal from '../components/metas/CoachingModal';

export default function GestionMetas() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const isLight = theme === 'clasico';

  const myCedula = String(user?.user_metadata?.cedula || '').trim();
  const myNombres = user?.user_metadata?.nombres || 'Colaborador';
  const myApellidos = user?.user_metadata?.apellidos || '';
  const myFullName = `${myNombres} ${myApellidos}`.trim();
  const myCargo = user?.user_metadata?.cargo || 'Asesor de Ventas';

  const isDirectivo = ['jefe', 'subjefe', 'supervisor', 'admin'].some(r => 
    (myCargo || '').toLowerCase().includes(r)
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Datos de Metas
  const [allMetas, setAllMetas] = useState([]);
  const [tiendaMeta, setTiendaMeta] = useState(null);
  const [periodos, setPeriodos] = useState([
    { id: 1, nombre: 'Período 1 (1 - 8 Ago)', color: '#666699', dias: [1,2,3,4,5,6,7,8] },
    { id: 2, nombre: 'Período 2 (9 - 16 Ago)', color: '#339966', dias: [9,10,11,12,13,14,15,16] },
    { id: 3, nombre: 'Período 3 (17 - 24 Ago)', color: '#993366', dias: [17,18,19,20,21,22,23,24] },
    { id: 4, nombre: 'Período 4 (25 - 31 Ago)', color: '#FFCC99', dias: [25,26,27,28,29,30,31] }
  ]);

  const getTodayDayEcuador = () => {
    try {
      const now = new Date();
      const ecuadorStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const parts = ecuadorStr.split('-');
      return parseInt(parts[2], 10) || now.getDate();
    } catch (e) {
      return new Date().getDate();
    }
  };

  const getPeriodForDay = (day) => {
    if (day <= 8) return 1;
    if (day <= 16) return 2;
    if (day <= 24) return 3;
    return 4;
  };

  const initialTodayDay = getTodayDayEcuador();
  const initialPeriodId = getPeriodForDay(initialTodayDay);

  const [selectedPeriodId, setSelectedPeriodId] = useState(initialPeriodId);
  const [selectedDay, setSelectedDay] = useState(initialTodayDay);

  // Estado de Coaching
  const [coachingModalOpen, setCoachingModalOpen] = useState(false);
  const [coachingAdvisorSelected, setCoachingAdvisorSelected] = useState(null);
  const [myLatestCoaching, setMyLatestCoaching] = useState(null);
  const [advisorCommitmentText, setAdvisorCommitmentText] = useState('');
  const [isEditingAdvisorCommitment, setIsEditingAdvisorCommitment] = useState(false);
  const [savingAdvisorCommitment, setSavingAdvisorCommitment] = useState(false);

  // Estado del Reporte PDF Oficial
  const [pdfUrl, setPdfUrl] = useState(() => localStorage.getItem('marathon_metas_pdf_url') || null);
  const [pdfName, setPdfName] = useState(() => localStorage.getItem('marathon_metas_pdf_name') || 'Reporte_Metas_Agosto_2026.pdf');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfUploading, setPdfUploading] = useState(false);

  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const showFeedback = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const fetchMetasData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .order('cargo', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setAllMetas(data);
        const storeRec = data.find(m => m.cedula === '0000000000' || m.cargo === 'TOTAL TIENDA');
        if (storeRec) {
          setTiendaMeta(storeRec);
          if (Array.isArray(storeRec.periodos) && storeRec.periodos.length > 0) {
            setPeriodos(storeRec.periodos);
          }
        }
      }

      // Cargar PDF de tienda_stats
      const { data: statsData } = await supabase
        .from('tienda_stats')
        .select('pdf_url, pdf_name')
        .maybeSingle();

      if (statsData?.pdf_url) {
        setPdfUrl(statsData.pdf_url);
        if (statsData.pdf_name) setPdfName(statsData.pdf_name);
        localStorage.setItem('marathon_metas_pdf_url', statsData.pdf_url);
        localStorage.setItem('marathon_metas_pdf_name', statsData.pdf_name || 'Reporte_Metas_Agosto_2026.pdf');
      }

      // Cargar último coaching del usuario conectado
      if (myCedula) {
        const { data: cData } = await supabase
          .from('coaching_asesores')
          .select('*')
          .eq('asesor_cedula', myCedula)
          .order('created_at', { ascending: false })
          .limit(1);

        if (cData && cData.length > 0) {
          setMyLatestCoaching(cData[0]);
          setAdvisorCommitmentText(cData[0].compromiso_asesor || '');
        }
      }
    } catch (err) {
      console.error('Error fetching metas:', err);
      showFeedback('Error al cargar datos de metas: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdvisorCommitment = async () => {
    if (!myLatestCoaching?.id || !advisorCommitmentText.trim()) return;
    setSavingAdvisorCommitment(true);
    try {
      const { error } = await supabase
        .from('coaching_asesores')
        .update({
          compromiso_asesor: advisorCommitmentText.trim(),
          fecha_compromiso_asesor: new Date().toISOString(),
          estado_acuerdo: 'Aceptado por Asesor'
        })
        .eq('id', myLatestCoaching.id);

      if (error) throw error;

      sendN8nEvent('COMPROMISO_ASESOR_REGISTRADO', {
        coaching_id: myLatestCoaching.id,
        asesor: myFullName,
        cedula: myCedula,
        compromiso_asesor: advisorCommitmentText.trim(),
        jefe_notificado: myLatestCoaching.jefe_nombre
      }, user?.user_metadata);

      showFeedback('¡Tu compromiso ha sido guardado y sellado exitosamente!');
      setIsEditingAdvisorCommitment(false);
      fetchMetasData();
    } catch (err) {
      console.error('Error saving advisor commitment:', err);
      showFeedback('Error al guardar compromiso: ' + err.message, 'error');
    } finally {
      setSavingAdvisorCommitment(false);
    }
  };

  useEffect(() => {
    fetchMetasData();
  }, []);

  // Manejar Carga de Archivo Excel
  const handleFileUpload = async (file) => {
    if (!file) return;
    setSubmitting(true);
    try {
      const parsed = await parseMetasExcel(file);
      await syncMetasToSupabase(parsed);
      
      // Disparar Webhook Automático hacia n8n
      sendN8nEvent('METAS_SINCRONIZADAS', {
        mes: 'Agosto 2026',
        total_tienda: parsed.tiendaMeta?.meta_mensual,
        meta_dia_24: parsed.tiendaMeta?.metas_diarias?.[24],
        asesores_actualizados: parsed.asesores?.length || 0,
        archivo_nombre: file.name
      }, user?.user_metadata);

      showFeedback(`¡Metas procesadas y sincronizadas con éxito! (${parsed.asesores.length} colaboradores actualizados).`);
      fetchMetasData();
    } catch (err) {
      console.error('Error parsing excel:', err);
      showFeedback('Error al procesar el archivo Excel: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar Carga de Archivo PDF
  const handlePdfUpload = async (file) => {
    if (!file) return;

    const fileName = file.name || 'reporte_metas.pdf';
    const fileNameLower = fileName.toLowerCase();
    const isPdfExt = fileNameLower.endsWith('.pdf') || fileNameLower.includes('pdf') || fileNameLower.includes('reporte') || fileNameLower.includes('venta');
    const isPdfMime = !file.type || file.type.includes('pdf') || file.type.includes('octet-stream');

    if (!isPdfExt && !isPdfMime) {
      showFeedback('Por favor selecciona un archivo PDF válido.', 'error');
      return;
    }

    setPdfUploading(true);
    try {
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const finalFileName = sanitizedName.toLowerCase().endsWith('.pdf') ? sanitizedName : `${sanitizedName}.pdf`;
      const filePath = `metas-pdf/reporte_metas_${Date.now()}_${finalFileName}`;

      let uploadPayload = file;
      try {
        if (file.arrayBuffer) {
          uploadPayload = await file.arrayBuffer();
        }
      } catch (bufErr) {
        console.warn("No se pudo convertir a ArrayBuffer, usando file directamente:", bufErr);
      }

      const { error: uploadError } = await supabase
        .storage
        .from('evidencias-jefes')
        .upload(filePath, uploadPayload, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase
        .storage
        .from('evidencias-jefes')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;

      // Actualizar en tienda_stats usando upsert para asegurar persistencia en BD
      await supabase
        .from('tienda_stats')
        .upsert({
          id: 1,
          pdf_url: publicUrl,
          pdf_name: fileName,
          updated_at: new Date().toISOString()
        });

      setPdfUrl(publicUrl);
      setPdfName(fileName);
      localStorage.setItem('marathon_metas_pdf_url', publicUrl);
      localStorage.setItem('marathon_metas_pdf_name', fileName);

      // Disparar Notificación para todo el equipo en la campanita
      try {
        await supabase.from('notificaciones').insert({
          rol_destino: 'todos',
          tipo: 'avance_pdf',
          titulo: '📄 Nuevo PDF de Avances de Ventas',
          mensaje: `Jefatura ha publicado el reporte de avances: ${fileName}`,
          ruta_destino: '/metas',
          leido: false
        });
      } catch (e) {
        console.warn("No se pudo registrar la notificación push:", e);
      }

      showFeedback('¡Reporte PDF de metas subido y publicado con éxito para todo el equipo!');
    } catch (err) {
      console.error('Error subiendo PDF:', err);
      showFeedback('Error al subir PDF: ' + err.message, 'error');
    } finally {
      setPdfUploading(false);
    }
  };

  // Asesor actual conectado y cálculo de metas
  const selectedDayManana = selectedDay + 1 > 31 ? 1 : selectedDay + 1;

  const {
    metaRecord: myMetaRecord,
    storeRecord: storeMetaRecord,
    miMetaHoy,
    miMetaPeriodo,
    miMetaMes
  } = getCollaboratorMeta(allMetas, user, [], selectedDay);

  // Período activo
  const activePeriod = periodos.find(p => p.id === selectedPeriodId) || periodos[0];
  const activeDays = selectedPeriodId === 'all' 
    ? Array.from({ length: 31 }, (_, i) => i + 1)
    : (activePeriod?.dias || []);

  // Lista filtrada de asesores para la matriz de Jefatura
  const filteredAdvisors = allMetas
    .filter(m => m.cedula !== '0000000000' && m.cargo !== 'TOTAL TIENDA')
    .filter(m => {
      if (!searchQuery) return true;
      const term = searchQuery.toLowerCase();
      const name = `${m.nombres || ''} ${m.apellidos || ''}`.toLowerCase();
      const ced = String(m.cedula || '').toLowerCase();
      const cargo = String(m.cargo || '').toLowerCase();
      return name.includes(term) || ced.includes(term) || cargo.includes(term);
    });

  // Formateador inteligente de nombres amigables para Asesores (por Cédula y Nombre)
  const formatAdvisorNameFriendly = (nombres = '', apellidos = '', cedula = '') => {
    const cleanCed = String(cedula || '').trim();
    const CEDULA_NAME_MAP = {
      '1714768486': 'Wilson Armijos',
      '1727839142': 'Paola Bravo',
      '0803422948': 'Luis Carrión',
      '1753997376': 'Eliane Herrera',
      '1729461796': 'Layla Montaño',
      '1755859038': 'José Posligua',
      '1724158850': 'Julexi Robinzon',
      '0803695311': 'Kerly Rosado',
      '0931982136': 'Ángel Velásquez',
      '1310559917': 'Michael Guevara',
      '1750148155': 'Génesis Chiscuet',
      '1726057274': 'Alain Cruz',
      '1726880014': 'José Valenzuela',
      '1727654321': 'Shania Felix',
      '1729876543': 'Samantha Vera',
      '1721234567': 'Antony Gaona',
      '1723456789': 'José Luna',
      '1725678901': 'Santiago Morocho'
    };

    if (cleanCed && CEDULA_NAME_MAP[cleanCed]) {
      return CEDULA_NAME_MAP[cleanCed];
    }

    const full = `${nombres || ''} ${apellidos || ''}`.trim();
    if (!full) return 'Asesor de Ventas';
    if (full.toUpperCase().includes('TOTAL TIENDA') || full.toUpperCase().includes('PORTAL SHOPPING')) {
      return 'TOTAL TIENDA (MCP1)';
    }

    const lower = full.toLowerCase();
    if (lower.includes('valenzuela') || lower.includes('tarapues')) return 'José Valenzuela';
    if (lower.includes('armijos') || lower.includes('wilson')) return 'Wilson Armijos';
    if (lower.includes('bravo') || lower.includes('paola')) return 'Paola Bravo';
    if (lower.includes('carrion') || lower.includes('carrión') || lower.includes('luis')) return 'Luis Carrión';
    if (lower.includes('herrera') || lower.includes('eliane')) return 'Eliane Herrera';
    if (lower.includes('montano') || lower.includes('montaño') || lower.includes('layla')) return 'Layla Montaño';
    if (lower.includes('posligua') || lower.includes('leonardo')) return 'José Posligua';
    if (lower.includes('robinzon') || lower.includes('julexi')) return 'Julexi Robinzon';
    if (lower.includes('rosado') || lower.includes('kerly')) return 'Kerly Rosado';
    if (lower.includes('velasquez') || lower.includes('velásquez') || lower.includes('angel') || lower.includes('ángel')) return 'Ángel Velásquez';
    if (lower.includes('guevara') || lower.includes('michael')) return 'Michael Guevara';
    if (lower.includes('chiscuet') || lower.includes('genesis') || lower.includes('génesis')) return 'Génesis Chiscuet';
    if (lower.includes('cruz') || lower.includes('alain')) return 'Alain Cruz';
    if (lower.includes('felix') || lower.includes('shania')) return 'Shania Felix';
    if (lower.includes('vera') || lower.includes('samantha')) return 'Samantha Vera';
    if (lower.includes('gaona') || lower.includes('antony')) return 'Antony Gaona';
    if (lower.includes('luna') || lower.includes('daniel')) return 'José Luna';
    if (lower.includes('morocho') || lower.includes('santiago')) return 'Santiago Morocho';

    const words = full.split(/\s+/).filter(Boolean);
    if (words.length >= 2) return `${words[0]} ${words[1]}`;
    return words[0] || 'Asesor de Ventas';
  };

  // Formateador de Moneda
  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

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
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

        {/* Header Principal de Metas */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/25">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl sm:text-3xl font-title font-black uppercase tracking-tight ${
                  isLight ? 'text-slate-950' : 'text-white'
                }`}>
                  Gestión de Metas
                </h1>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Agosto 2026
                </span>
              </div>
              <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isDirectivo 
                  ? 'Matriz de asignación, control y seguimiento de metas por período y diarias de Marathon Sports MCP1.'
                  : 'Consulta tus metas diarias, semanales por período y tu objetivo mensual de ventas.'}
              </p>
            </div>
          </div>

          {/* Acciones de Cabecera: Ver PDF, Subir PDF y Subir Excel */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Botón Ver PDF Oficial (Disponible para TODOS los Roles) */}
            <button
              onClick={() => {
                if (pdfUrl) {
                  setPdfModalOpen(true);
                } else {
                  showFeedback('Aún no se ha cargado el documento PDF oficial para este período.', 'error');
                }
              }}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md ${
                isLight 
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                  : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700/50'
              }`}
              title="Abrir visor interactivo del reporte PDF"
            >
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Ver Reporte PDF</span>
            </button>

            {/* Acciones exclusivas de Jefatura */}
            {isDirectivo && (
              <>
                {/* Input oculto de PDF */}
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf,*/*"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handlePdfUpload(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />

                <button
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={pdfUploading}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 shadow-md'
                  }`}
                  title="Subir nuevo documento PDF de metas"
                >
                  {pdfUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                      <span>Subiendo PDF...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-rose-500" />
                      <span>Subir PDF</span>
                    </>
                  )}
                </button>

                {/* Input oculto de Excel */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleFileUpload(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Cargando Metas...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Subir Plantilla Excel</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VISTA 1: EXPERIENCIA PARA ASESORES DE VENTAS */}
        {/* ========================================================================= */}
        {!isDirectivo && (
          <div className="space-y-6 animate-fade-in">
            
            {/* KPI Cards Personales del Asesor (Incluye Meta de Hoy y Meta de Mañana) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Meta Diaria de Hoy */}
              <div className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' 
                  : 'bg-gradient-to-b from-[#091523] to-[#070c18] border-blue-500/20 shadow-2xl shadow-blue-950/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                    🎯 Meta Hoy (d{selectedDay})
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-blue-400">
                  {formatMoney(myMetaRecord?.metas_diarias?.[selectedDay] || myMetaRecord?.meta_diaria || 0)}
                </div>
                <p className={`text-[11px] mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Objetivo para tu turno de hoy.
                </p>
              </div>

              {/* Meta Diaria de Mañana (Día Siguiente) */}
              <div className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' 
                  : 'bg-gradient-to-b from-[#1f1709] to-[#070c18] border-amber-500/20 shadow-2xl shadow-amber-950/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    🌅 Meta Mañana (d{selectedDayManana})
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-400">
                  {(myMetaRecord?.metas_diarias?.[selectedDayManana] || 0) > 0 
                    ? formatMoney(myMetaRecord.metas_diarias[selectedDayManana]) 
                    : 'Libre / $0'}
                </div>
                <p className={`text-[11px] mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Tu meta para la jornada de mañana.
                </p>
              </div>

              {/* Meta Semanal / Período Actual */}
              <div className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' 
                  : 'bg-gradient-to-b from-[#091f1a] to-[#070c18] border-emerald-500/20 shadow-2xl shadow-emerald-950/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 truncate">
                    📅 {activePeriod?.nombre || 'Período Activo'}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
                  {formatMoney(
                    myMetaRecord?.periodos?.find(p => p.id === selectedPeriodId)?.meta_periodo ||
                    activeDays.reduce((acc, d) => acc + (myMetaRecord?.metas_diarias?.[d] || 0), 0)
                  )}
                </div>
                <p className={`text-[11px] mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Días {activePeriod?.dias?.[0]} al {activePeriod?.dias?.[activePeriod?.dias?.length - 1]} de Agosto.
                </p>
              </div>

              {/* Meta Mensual Total */}
              <div className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' 
                  : 'bg-gradient-to-b from-[#18091f] to-[#070c18] border-purple-500/20 shadow-2xl shadow-purple-950/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                    ⭐ Meta Mensual Agosto
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-purple-400">
                  {formatMoney(myMetaRecord?.meta_mensual || 0)}
                </div>
                <p className={`text-[11px] mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Objetivo global del mes.
                </p>
              </div>

            </div>

            {/* TARJETA DE COACHING Y PLAN DE ACCIÓN DEL ASESOR (Visible si tiene coaching) */}
            {myLatestCoaching && (
              <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl transition-all animate-fade-in ${
                isLight 
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-orange-200 text-slate-900' 
                  : 'bg-gradient-to-r from-[#1c1308] via-[#140e06] to-[#0a1120] border-orange-500/30 text-white shadow-2xl shadow-orange-950/20'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/30 shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-title font-black uppercase tracking-tight text-orange-400">
                          Tu Último Coaching Comercial
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          myLatestCoaching.estado === 'Excelente' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                          myLatestCoaching.estado === 'En Progreso' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                          'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        }`}>
                          {myLatestCoaching.estado}
                        </span>
                      </div>
                      <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Impartido por: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{myLatestCoaching.jefe_nombre}</strong> ({myLatestCoaching.jefe_cargo}) el {myLatestCoaching.fecha}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-orange-400 px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30 self-start sm:self-auto">
                    🎯 {myLatestCoaching.tipo_coaching}
                  </span>
                </div>

                {/* Contenido del Coaching */}
                <div className="pt-3.5 space-y-3">
                  {myLatestCoaching.fortalezas && (
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-400 block mb-0.5">🌟 Tus Fortalezas Destacadas:</span>
                      <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{myLatestCoaching.fortalezas}</p>
                    </div>
                  )}

                  {myLatestCoaching.diagnostico && (
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-400 block mb-0.5">💡 Observaciones de Jefatura:</span>
                      <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{myLatestCoaching.diagnostico}</p>
                    </div>
                  )}

                  {/* Compromisos de Jefatura */}
                  <div className={`p-3.5 rounded-2xl border ${
                    isLight ? 'bg-white border-orange-200' : 'bg-[#0a1120] border-orange-500/40'
                  }`}>
                    <span className="text-[10px] font-black uppercase text-amber-500 block mb-1 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>1. Compromisos Sugeridos por Jefatura:</span>
                    </span>
                    <p className={`text-xs font-bold whitespace-pre-line leading-relaxed ${isLight ? 'text-slate-900' : 'text-amber-200'}`}>
                      {myLatestCoaching.compromisos}
                    </p>
                  </div>

                  {/* 2. Compromiso y Aporte del Asesor (Acuerdo Mutuo) */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    isLight 
                      ? 'bg-emerald-50/70 border-emerald-300 text-slate-900' 
                      : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>2. Tu Compromiso y Aporte como Asesor:</span>
                      </span>

                      {myLatestCoaching.compromiso_asesor && !isEditingAdvisorCommitment && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          ✅ Acuerdo Sellado
                        </span>
                      )}
                    </div>

                    {myLatestCoaching.compromiso_asesor && !isEditingAdvisorCommitment ? (
                      <div className="space-y-2">
                        <p className={`text-xs font-bold whitespace-pre-line leading-relaxed ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
                          {myLatestCoaching.compromiso_asesor}
                        </p>
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 italic">
                            Respondido el {myLatestCoaching.fecha_compromiso_asesor ? new Date(myLatestCoaching.fecha_compromiso_asesor).toLocaleDateString('es-EC') : myLatestCoaching.fecha}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAdvisorCommitmentText(myLatestCoaching.compromiso_asesor || '');
                              setIsEditingAdvisorCommitment(true);
                            }}
                            className="text-[11px] font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
                          >
                            ✏️ Modificar Mi Compromiso
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          rows={2.5}
                          value={advisorCommitmentText}
                          onChange={(e) => setAdvisorCommitmentText(e.target.value)}
                          placeholder="Escribe aquí tu compromiso personal para cumplir la meta y ponerte de acuerdo con la Jefatura..."
                          className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none transition resize-none ${
                            isLight ? 'bg-white border-emerald-300 text-slate-900' : 'bg-[#060b17] border-emerald-500/50 text-white placeholder-slate-500'
                          }`}
                        />

                        {/* Sugerencias Rápidas para el Asesor */}
                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                          {[
                            'Me comprometo a ofrecer 1 producto complementario en cada venta',
                            'Abordaré a 15 clientes mínimo en las horas pico',
                            'Revisaré mi avance de meta cada 2 horas',
                            'Mantendré mi zona ordenada y con tallas completas'
                          ].map((sug, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setAdvisorCommitmentText(prev => prev ? `${prev}\n• ${sug}` : `• ${sug}`)}
                              className={`text-[9px] px-2 py-0.5 rounded-lg border font-bold whitespace-nowrap shrink-0 transition cursor-pointer active:scale-95 ${
                                isLight 
                                  ? 'bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300' 
                                  : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
                              }`}
                            >
                              + {sug}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          {isEditingAdvisorCommitment && (
                            <button
                              type="button"
                              onClick={() => setIsEditingAdvisorCommitment(false)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                            >
                              Cancelar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleSaveAdvisorCommitment}
                            disabled={savingAdvisorCommitment || !advisorCommitmentText.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-md shadow-emerald-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{savingAdvisorCommitment ? 'Guardando...' : '🤝 Guardar y Sellar Acuerdo'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Selector de Períodos Interactivos */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 ${
              isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800 text-white'
            }`}>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/25">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight">
                      Desglose de Metas por Período
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Selecciona un período para consultar el detalle día por día
                    </p>
                  </div>
                </div>

                {/* Botones de Períodos con sus colores característicos */}
                <div className="flex flex-wrap items-center gap-2">
                  {periodos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPeriodId(p.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        selectedPeriodId === p.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/30 scale-105'
                          : isLight 
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                          : 'bg-[#060b17] hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: p.color }}></span>
                      <span>{p.nombre}</span>
                    </button>
                  ))}

                  <button
                    onClick={() => setSelectedPeriodId('all')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      selectedPeriodId === 'all'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30 scale-105'
                        : isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                        : 'bg-[#060b17] hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>Todo el Mes (1-31)</span>
                  </button>
                </div>
              </div>

              {/* Grid de Días del Período Seleccionado */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {activeDays.map(day => {
                  const dayMeta = myMetaRecord?.metas_diarias?.[day] || 0;
                  const isDayToday = day === 24; // Hoy

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                        selectedDay === day
                          ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-500/15 shadow-md'
                          : isDayToday
                          ? 'border-emerald-500/80 bg-emerald-500/10'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          : 'bg-[#060b17] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase ${
                          isDayToday ? 'text-emerald-400 font-extrabold' : isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          Día {day}
                        </span>
                        {isDayToday && (
                          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-emerald-500 text-white">
                            HOY
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        {dayMeta > 0 ? (
                          <span className={`text-xs sm:text-sm font-black font-mono block ${
                            selectedDay === day ? 'text-blue-400' : isDayToday ? 'text-emerald-400' : isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            {formatMoney(dayMeta)}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-500 italic block">
                            Libre / $0
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: MATRIZ COMPLETA PARA JEFATURA */}
        {/* ========================================================================= */}
        {isDirectivo && (
          <div className="space-y-6 animate-fade-in">
            
            {/* KPI Cards de Tienda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className={`p-5 rounded-3xl border shadow-lg ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-white'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  🏪 Meta Total Tienda (Mes)
                </span>
                <span className="text-2xl font-black font-mono text-purple-400">
                  {formatMoney(tiendaMeta?.meta_mensual || 296878)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">31 Días de Operación</span>
              </div>

              <div className={`p-5 rounded-3xl border shadow-lg ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-white'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  📅 Meta Período Activo
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatMoney(
                    tiendaMeta?.periodos?.find(p => p.id === selectedPeriodId)?.meta_periodo ||
                    activeDays.reduce((acc, d) => acc + (tiendaMeta?.metas_diarias?.[d] || 0), 0)
                  )}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold block mt-1">{activePeriod?.nombre}</span>
              </div>

              <div className={`p-5 rounded-3xl border shadow-lg ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-white'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  🎯 Meta Diaria Tienda (Día {selectedDay})
                </span>
                <span className="text-2xl font-black font-mono text-blue-400">
                  {formatMoney(tiendaMeta?.metas_diarias?.[selectedDay] || tiendaMeta?.meta_diaria || 6848)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Objetivo del Día</span>
              </div>

              <div className={`p-5 rounded-3xl border shadow-lg ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-white'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  👥 Equipo Asignado
                </span>
                <span className="text-2xl font-black font-mono text-amber-400">
                  {filteredAdvisors.length} Asesores
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">100% Sincronizados</span>
              </div>

            </div>

            {/* Matriz y Filtros */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 ${
              isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800 text-white'
            }`}>
              
              {/* Barra Superior: Períodos y Buscador */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800/60">
                <div className="flex flex-wrap items-center gap-2">
                  {periodos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPeriodId(p.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        selectedPeriodId === p.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/30 scale-105'
                          : isLight 
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                          : 'bg-[#060b17] hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: p.color }}></span>
                      <span>{p.nombre}</span>
                    </button>
                  ))}

                  <button
                    onClick={() => setSelectedPeriodId('all')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      selectedPeriodId === 'all'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30 scale-105'
                        : isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                        : 'bg-[#060b17] hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>Mes Completo (1 - 31)</span>
                  </button>

                  {/* Botón de Coaching Asesores */}
                  <button
                    onClick={() => {
                      setCoachingAdvisorSelected(null);
                      setCoachingModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white shadow-lg shadow-orange-500/25 transition-all active:scale-95 cursor-pointer shrink-0"
                    title="Dar o consultar coaching comercial para asesores"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>💬 Coaching Asesores</span>
                  </button>
                </div>

                {/* Buscador */}
                <div className="relative w-full lg:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar asesor o cédula..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-xs font-bold outline-none focus:border-emerald-500 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#060b17] border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Tabla Matriz de Metas */}
              <div className={`overflow-x-auto rounded-2xl border shadow-inner ${
                isLight ? 'border-slate-300 bg-white' : 'border-slate-800 bg-[#060b17]'
              }`}>
                <table className="w-full text-xs text-left border-collapse min-w-max">
                  <thead>
                    <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#09101f] text-slate-300'}>
                      <th className={`p-2.5 sm:p-3.5 font-black uppercase sticky left-0 z-30 w-[130px] min-w-[130px] max-w-[135px] sm:w-[180px] sm:min-w-[180px] md:w-[240px] md:min-w-[240px] border-r shadow-[4px_0_10px_rgba(0,0,0,0.15)] ${
                        isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#09101f] border-slate-700/80 text-white'
                      }`}>
                        Asesor de Ventas
                      </th>
                      <th className="p-2.5 sm:p-3.5 font-black uppercase text-right border-r border-slate-700/60 text-blue-400">
                        Meta Hoy (d{selectedDay})
                      </th>
                      <th className="p-2.5 sm:p-3.5 font-black uppercase text-right border-r border-slate-700/60 text-emerald-400">
                        Meta Período
                      </th>
                      <th className="p-2.5 sm:p-3.5 font-black uppercase text-right border-r border-slate-700/60 text-purple-400">
                        Meta Mensual
                      </th>
                      {activeDays.map(d => (
                        <th 
                          key={d} 
                          className={`p-2 sm:p-2.5 font-mono text-center font-bold border-r border-slate-700/40 text-[10px] sm:text-xs min-w-[50px] ${
                            d === 24 ? 'bg-blue-600/30 text-blue-300 font-black' : 'text-slate-300'
                          }`}
                        >
                          Día {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                    
                    {/* Fila Especial: TOTAL TIENDA */}
                    {tiendaMeta && (
                      <tr className={`font-black ${
                        isLight ? 'bg-emerald-50/80 text-slate-900' : 'bg-emerald-950/20 text-white'
                      }`}>
                        <td className={`p-2 sm:p-3.5 sticky left-0 z-20 w-[130px] min-w-[130px] max-w-[135px] sm:w-[180px] sm:min-w-[180px] md:w-[240px] md:min-w-[240px] border-r shadow-[4px_0_10px_rgba(0,0,0,0.15)] ${
                          isLight ? 'bg-emerald-100/90 border-slate-300 text-emerald-950' : 'bg-[#081f14] border-emerald-500/30 text-emerald-300'
                        }`}>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-base sm:text-lg">🏪</span>
                            <div className="truncate">
                              <div className="text-xs sm:text-sm font-black truncate">TOTAL TIENDA</div>
                              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold block">Meta Global</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-2 sm:p-3.5 text-right font-mono font-black text-blue-400 border-r border-slate-800/40 text-xs sm:text-sm">
                          {formatMoney(tiendaMeta.metas_diarias?.[selectedDay] || tiendaMeta.meta_diaria || 0)}
                        </td>

                        <td className="p-2 sm:p-3.5 text-right font-mono font-black text-emerald-400 border-r border-slate-800/40 text-xs sm:text-sm">
                          {formatMoney(
                            tiendaMeta.periodos?.find(p => p.id === selectedPeriodId)?.meta_periodo ||
                            activeDays.reduce((acc, d) => acc + (tiendaMeta.metas_diarias?.[d] || 0), 0)
                          )}
                        </td>

                        <td className="p-2 sm:p-3.5 text-right font-mono font-black text-purple-400 border-r border-slate-800/40 text-xs sm:text-sm">
                          {formatMoney(tiendaMeta.meta_mensual)}
                        </td>

                        {activeDays.map(d => (
                          <td 
                            key={d} 
                            className={`p-2 sm:p-2.5 text-center font-mono font-bold border-r border-slate-800/30 text-[10px] sm:text-xs ${
                              d === 24 ? 'text-emerald-300 bg-emerald-500/20' : 'text-emerald-400/90'
                            }`}
                          >
                            {formatMoney(tiendaMeta.metas_diarias?.[d] || 0)}
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* Filas de Asesores */}
                    {filteredAdvisors.map(adv => {
                      const periodMeta = adv.periodos?.find(p => p.id === selectedPeriodId)?.meta_periodo ||
                        activeDays.reduce((acc, d) => acc + (adv.metas_diarias?.[d] || 0), 0);

                      const friendlyName = formatAdvisorNameFriendly(adv.nombres, adv.apellidos, adv.cedula);

                      return (
                        <tr 
                          key={adv.cedula}
                          className={`group transition-colors ${
                            isLight ? 'hover:bg-slate-50/80 bg-white' : 'hover:bg-[#0c1629] bg-[#060b17]'
                          }`}
                        >
                          <td className={`p-2 sm:p-3.5 sticky left-0 z-10 w-[130px] min-w-[130px] max-w-[135px] sm:w-[180px] sm:min-w-[180px] md:w-[240px] md:min-w-[240px] border-r shadow-[4px_0_10px_rgba(0,0,0,0.15)] transition-colors ${
                            isLight 
                              ? 'bg-white group-hover:bg-slate-100 border-slate-300 text-slate-900' 
                              : 'bg-[#080f1d] group-hover:bg-[#0e1b33] border-slate-800 text-white'
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <div className={`font-black truncate text-[11px] sm:text-xs ${isLight ? 'text-slate-900' : 'text-white'}`} title={`${adv.nombres} ${adv.apellidos}`}>
                                {friendlyName}
                              </div>
                              <button
                                onClick={() => {
                                  setCoachingAdvisorSelected(adv);
                                  setCoachingModalOpen(true);
                                }}
                                className="p-1 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white transition cursor-pointer shrink-0"
                                title={`Dar Coaching Comercial a ${friendlyName}`}
                              >
                                <Award className="w-3 h-3" />
                              </button>
                            </div>
                            <span className={`text-[9px] sm:text-[10px] font-mono block truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              CI: {adv.cedula}
                            </span>
                          </td>

                          <td className={`p-2 sm:p-3.5 text-right font-mono font-bold text-blue-400 border-r text-[11px] sm:text-xs ${
                            isLight ? 'border-slate-200' : 'border-slate-800/80'
                          }`}>
                            {formatMoney(adv.metas_diarias?.[selectedDay] || adv.meta_diaria || 0)}
                          </td>

                          <td className={`p-2 sm:p-3.5 text-right font-mono font-bold text-emerald-400 border-r text-[11px] sm:text-xs ${
                            isLight ? 'border-slate-200' : 'border-slate-800/80'
                          }`}>
                            {formatMoney(periodMeta)}
                          </td>

                          <td className={`p-2 sm:p-3.5 text-right font-mono font-bold text-purple-400 border-r text-[11px] sm:text-xs ${
                            isLight ? 'border-slate-200' : 'border-slate-800/80'
                          }`}>
                            {formatMoney(adv.meta_mensual)}
                          </td>

                          {activeDays.map(d => {
                            const val = adv.metas_diarias?.[d] || 0;
                            return (
                              <td 
                                key={d} 
                                className={`p-2 sm:p-2.5 text-center font-mono border-r border-slate-800/20 text-[10px] sm:text-xs ${
                                  d === 24 ? (isLight ? 'bg-emerald-50' : 'bg-emerald-950/20') : ''
                                }`}
                              >
                                {val > 0 ? (
                                  <span className={`font-bold ${
                                    d === 24 
                                      ? 'text-emerald-400 font-extrabold' 
                                      : isLight ? 'text-slate-800' : 'text-slate-200'
                                  }`}>
                                    {formatMoney(val)}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-600 font-semibold">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* MODAL VISOR INTERACTIVO DE PDF DE METAS */}
      {pdfModalOpen && pdfUrl && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md animate-fade-in ${
            isLight ? 'bg-slate-900/60' : 'bg-black/90'
          }`}
          onClick={() => setPdfModalOpen(false)}
        >
          <div 
            className={`relative w-full max-w-5xl h-[92vh] border rounded-3xl overflow-hidden shadow-2xl flex flex-col ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Visor */}
            <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950/90 border-slate-800'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h3 className={`text-sm font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {pdfName || 'Reporte Oficial de Metas'}
                  </h3>
                  <span className={`text-[10px] font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Documento Oficial • Marathon Sports MCP1
                  </span>
                </div>
              </div>

              {/* Controles de Zoom y Acciones */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                
                {/* Control Zoom Out */}
                <button
                  onClick={() => setPdfZoom(prev => Math.max(50, prev - 20))}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title="Reducir Zoom (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                {/* Nivel de Zoom */}
                <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold ${
                  isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-white'
                }`}>
                  {pdfZoom}%
                </span>

                {/* Control Zoom In */}
                <button
                  onClick={() => setPdfZoom(prev => Math.min(250, prev + 20))}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title="Aumentar Zoom (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {/* Reset Zoom */}
                <button
                  onClick={() => setPdfZoom(100)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title="Restablecer tamaño (100%)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Botón Descargar PDF */}
                <a
                  href={pdfUrl}
                  download={pdfName || 'Reporte_Metas.pdf'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition cursor-pointer"
                  title="Descargar archivo PDF"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Descargar</span>
                </a>

                {/* Abrir en Pestaña Externa */}
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title="Abrir en ventana completa"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* Botón Cerrar */}
                <button
                  onClick={() => setPdfModalOpen(false)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isLight 
                      ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenedor del Documento con Soporte de Zoom y Scroll */}
            <div className={`flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center ${
              isLight ? 'bg-slate-100/90' : 'bg-black/60'
            }`}>
              <div 
                className="w-full h-full transition-transform duration-200 origin-top flex justify-center"
                style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top center' }}
              >
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=${pdfZoom}`}
                  title="Visor de Reporte de Metas PDF"
                  className="w-full h-full min-h-[70vh] rounded-2xl border border-slate-300/40 dark:border-slate-800 bg-white shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Coaching Comercial */}
      <CoachingModal
        isOpen={coachingModalOpen}
        onClose={() => setCoachingModalOpen(false)}
        asesores={filteredAdvisors}
        currentAdvisor={coachingAdvisorSelected}
        jefeUser={user}
        isLight={isLight}
        onCoachingSaved={fetchMetasData}
      />

    </div>
  );
}
