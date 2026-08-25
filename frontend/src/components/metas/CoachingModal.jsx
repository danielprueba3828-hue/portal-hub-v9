import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { sendN8nEvent } from '../../services/n8nService';
import { 
  Award, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  User, 
  Calendar, 
  Target, 
  Save, 
  History, 
  PlusCircle, 
  ChevronRight,
  Flame,
  MessageSquare,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';

const TIPOS_COACHING = [
  'Cumplimiento de Meta Diaria / Período',
  'Venta Cruzada (Calzado + Textil + Accesorios)',
  'Estrategia de Abordaje & Cierre Comercial',
  'Manejo de Objeciones & Fidelización',
  'Reconocimiento por Alto Rendimiento',
  'Plan de Acción & Compromiso de Mejora'
];

const SUGERENCIAS_FORTALEZAS = [
  'Excelente abordaje inicial',
  'Gran carisma y empatía con el cliente',
  'Buena técnica de calzado y tallaje',
  'Proactividad en el piso de venta',
  'Alta tasa de venta cruzada',
  'Excelente manejo de caja y rapidez',
  'Puntualidad y compromiso operativo'
];

const SUGERENCIAS_COMPROMISOS = [
  'Ofrecer 1 producto complementario en cada venta (medias, plantillas o limpiador)',
  'Abordar mínimo a 15 clientes en las horas pico',
  'Revisar el avance de meta a las 14:00 y a las 18:00',
  'Promocionar las ofertas activas de liquidación',
  'Mantener ordenada la zona asignada durante el turno'
];

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
};

const getAdvisorFriendlyName = (advisor) => {
  if (!advisor) return 'Asesor';
  if (advisor.cedula && CEDULA_NAME_MAP[advisor.cedula]) {
    return CEDULA_NAME_MAP[advisor.cedula];
  }
  const cleanFirst = (advisor.nombres || '').split(' ')[0] || '';
  const cleanLast = (advisor.apellidos || '').split(' ')[0] || '';
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  return `${cap(cleanFirst)} ${cap(cleanLast)}`.trim() || 'Asesor';
};

export default function CoachingModal({ 
  isOpen, 
  onClose, 
  asesores = [], 
  currentAdvisor = null,
  jefeUser,
  isLight,
  onCoachingSaved
}) {
  const [activeTab, setActiveTab] = useState('nuevo'); // 'nuevo' | 'historial'
  const [selectedAsesorCedula, setSelectedAsesorCedula] = useState(currentAdvisor?.cedula || '');
  const [tipoCoaching, setTipoCoaching] = useState('Cumplimiento de Meta Diaria / Período');
  const [estado, setEstado] = useState('En Progreso');
  const [diagnostico, setDiagnostico] = useState('');
  const [fortalezas, setFortalezas] = useState('');
  const [compromisos, setCompromisos] = useState('');
  const [saving, setSaving] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [filtroAsesorHistorial, setFiltroAsesorHistorial] = useState('todos');

  // Inicializar asesor seleccionado
  useEffect(() => {
    if (currentAdvisor?.cedula) {
      setSelectedAsesorCedula(currentAdvisor.cedula);
    } else if (asesores.length > 0 && !selectedAsesorCedula) {
      setSelectedAsesorCedula(asesores[0].cedula);
    }
  }, [currentAdvisor, asesores]);

  // Cargar historial de coachings
  const fetchHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const { data, error } = await supabase
        .from('coaching_asesores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistorial(data || []);
    } catch (err) {
      console.error('Error fetching historial coaching:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistorial();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const asesorActivo = asesores.find(a => a.cedula === selectedAsesorCedula) || asesores[0] || {};
  const metaDiariaRef = asesorActivo?.metas_diarias?.[24] || asesorActivo?.meta_diaria || 0;
  const metaMensualRef = asesorActivo?.meta_mensual || 0;

  const handleAddSugerenciaFortaleza = (sug) => {
    setFortalezas(prev => prev ? `${prev} • ${sug}` : `• ${sug}`);
  };

  const handleAddSugerenciaCompromiso = (sug) => {
    setCompromisos(prev => prev ? `${prev}\n• ${sug}` : `• ${sug}`);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedAsesorCedula || !compromisos.trim()) {
      alert('Por favor selecciona un asesor y define al menos un compromiso comercial.');
      return;
    }

    setSaving(true);
    try {
      const jefeNombre = `${jefeUser?.user_metadata?.nombres || 'Jefatura'} ${jefeUser?.user_metadata?.apellidos || ''}`.trim();
      const jefeCargo = jefeUser?.user_metadata?.cargo || 'Jefe de Tienda';

      const payload = {
        asesor_cedula: selectedAsesorCedula,
        asesor_nombre: `${asesorActivo.nombres || ''} ${asesorActivo.apellidos || ''}`.trim() || 'Asesor',
        asesor_cargo: asesorActivo.cargo || 'Asesor de Ventas',
        jefe_cedula: jefeUser?.user_metadata?.cedula || '',
        jefe_nombre: jefeNombre,
        jefe_cargo: jefeCargo,
        fecha: new Date().toISOString().split('T')[0],
        tipo_coaching: tipoCoaching,
        estado: estado,
        diagnostico: diagnostico.trim(),
        fortalezas: fortalezas.trim(),
        compromisos: compromisos.trim(),
        meta_diaria_referencia: metaDiariaRef,
        venta_actual_referencia: 0,
        cumplimiento_porcentaje: 0
      };

      const { data, error } = await supabase
        .from('coaching_asesores')
        .insert([payload])
        .select();

      if (error) throw error;

      // Disparar Webhook Automático hacia n8n para registro y notificaciones
      sendN8nEvent('COACHING_REGISTRADO', {
        asesor: payload.asesor_nombre,
        asesor_cedula: payload.asesor_cedula,
        tipo: payload.tipo_coaching,
        estado: payload.estado,
        compromisos: payload.compromisos,
        jefe: payload.jefe_nombre
      }, jefeUser?.user_metadata);

      // Limpiar formulario y refrescar
      setDiagnostico('');
      setFortalezas('');
      setCompromisos('');
      if (onCoachingSaved) onCoachingSaved();
      fetchHistorial();
      setActiveTab('historial');
    } catch (err) {
      console.error('Error guardando coaching:', err);
      alert('Error al registrar el coaching: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredHistorial = historial.filter(item => {
    if (filtroAsesorHistorial === 'todos') return true;
    return item.asesor_cedula === filtroAsesorHistorial;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 pb-24 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overscroll-none touch-none">
      <div className={`relative w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden my-auto max-h-[70vh] sm:max-h-[82vh] flex flex-col transition-all overscroll-contain touch-pan-y ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' 
          : 'bg-[#0a1120] border-slate-800 text-white shadow-2xl'
      }`}>
        
        {/* Header Compacto del Modal */}
        <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-xl text-white shadow-md shadow-orange-500/30 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-title font-black uppercase tracking-tight">
                  Coaching Comercial & Feedback
                </h2>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  MCP1
                </span>
              </div>
              <p className={`text-[10px] hidden sm:block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Alineación estratégica de metas y compromisos comerciales con asesores
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de Pestañas Compacto */}
        <div className={`px-3.5 sm:px-4 py-2 flex items-center gap-1.5 border-b shrink-0 ${
          isLight ? 'bg-slate-100/60 border-slate-200' : 'bg-[#080d1a] border-slate-800/80'
        }`}>
          <button
            onClick={() => setActiveTab('nuevo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'nuevo'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nuevo Coaching</span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({historial.length})</span>
          </button>
        </div>

        {/* Contenido Scrolleable del Modal (Aislado del fondo) */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-3.5 overscroll-contain scrollbar-thin">
          
          {/* ========================================================================= */}
          {/* TAB 1: FORMULARIO DE NUEVO COACHING */}
          {/* ========================================================================= */}
          {activeTab === 'nuevo' && (
            <div className="space-y-3.5">
              
              {/* Selección de Asesor & KPI Referencial */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-orange-400" />
                    <span>Seleccionar Asesor de Ventas:</span>
                  </label>
                  <span className="text-[10px] text-orange-400 font-bold">
                    {getAdvisorFriendlyName(asesorActivo)}
                  </span>
                </div>

                {/* Carrusel Horizontal Táctil de Asesores (No invasivo) */}
                <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar touch-pan-x">
                  {asesores.map(a => {
                    const isSelected = a.cedula === selectedAsesorCedula;
                    const friendlyName = getAdvisorFriendlyName(a);
                    const initials = friendlyName
                      .split(' ')
                      .map(w => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <button
                        key={a.cedula}
                        type="button"
                        onClick={() => setSelectedAsesorCedula(a.cedula)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs transition-all shrink-0 cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black border-orange-400 shadow-md shadow-orange-500/30 ring-2 ring-orange-400/50'
                            : isLight 
                              ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-bold' 
                              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 font-bold'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isSelected 
                            ? 'bg-white/25 text-white' 
                            : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {initials}
                        </div>
                        <span className="whitespace-nowrap">{friendlyName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* KPI Card Referencial del Asesor Seleccionado */}
                <div className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Meta Asignada:</span>
                    <span className="text-xs font-black text-white">{getAdvisorFriendlyName(asesorActivo)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Hoy (d24):</span>
                      <span className="text-xs font-black font-mono text-blue-400">
                        ${Number(metaDiariaRef).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Mes:</span>
                      <span className="text-xs font-black font-mono text-purple-400">
                        ${Number(metaMensualRef).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Tipo de Coaching & Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Tipo de Coaching */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Target className="w-3 h-3 text-emerald-400" />
                    <span>Tipo de Coaching *</span>
                  </label>
                  <select
                    value={tipoCoaching}
                    onChange={(e) => setTipoCoaching(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none transition cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    {TIPOS_COACHING.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Estado / Evaluación Actual */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                    <span>Evaluación Actual *</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'Excelente', label: '🌟 Excelente', color: 'border-emerald-500 bg-emerald-500/20 text-emerald-400' },
                      { id: 'En Progreso', label: '📈 En Progreso', color: 'border-blue-500 bg-blue-500/20 text-blue-400' },
                      { id: 'Requiere Enfoque', label: '⚠️ Enfoque', color: 'border-amber-500 bg-amber-500/20 text-amber-400' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setEstado(st.id)}
                        className={`py-2 px-1 rounded-xl border text-[10px] font-black text-center transition cursor-pointer truncate ${
                          estado === st.id
                            ? `${st.color} shadow-sm font-black`
                            : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Fortalezas Observadas */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Fortalezas Destacadas</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Empatía, rapidez en caja, excelente venta cruzada..."
                  value={fortalezas}
                  onChange={(e) => setFortalezas(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none transition ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                {/* Sugerencias Rápidas Horizontales */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                  {SUGERENCIAS_FORTALEZAS.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddSugerenciaFortaleza(sug)}
                      className={`text-[9px] px-2 py-0.5 rounded-lg border font-bold whitespace-nowrap shrink-0 transition cursor-pointer active:scale-95 ${
                        isLight 
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diagnóstico & Observaciones */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-indigo-400" />
                  <span>Diagnóstico y Retroalimentación de Jefatura</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Oportunidades de mejora y análisis de venta..."
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium outline-none transition resize-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              {/* Compromisos Acordados */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    <span>Compromisos Acordados (Visible al Asesor) *</span>
                  </label>
                </div>
                <textarea
                  rows={2.5}
                  placeholder="Ej: &#10;• Ofrecer 1 producto complementario en cada venta.&#10;• Mantener ticket promedio sobre $45."
                  value={compromisos}
                  onChange={(e) => setCompromisos(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none transition resize-none ${
                    isLight 
                      ? 'bg-emerald-50/50 border-emerald-300 text-slate-900' 
                      : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 placeholder-emerald-700'
                  }`}
                  required
                />
                {/* Sugerencias Rápidas Horizontales */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                  {SUGERENCIAS_COMPROMISOS.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddSugerenciaCompromiso(sug)}
                      className={`text-[9px] px-2 py-0.5 rounded-lg border font-bold whitespace-nowrap shrink-0 transition cursor-pointer active:scale-95 ${
                        isLight 
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                      }`}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: HISTORIAL DE COACHINGS REGISTRADOS */}
          {/* ========================================================================= */}
          {activeTab === 'historial' && (
            <div className="space-y-4">
              
              {/* Filtro por Asesor en Historial (Chips Horizontales) */}
              <div className="space-y-1.5 pb-2 border-b border-slate-800/60">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Filtrar por Asesor:</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
                  <button
                    type="button"
                    onClick={() => setFiltroAsesorHistorial('todos')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer ${
                      filtroAsesorHistorial === 'todos'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Todos ({historial.length})
                  </button>
                  {asesores.map(a => {
                    const isSelected = filtroAsesorHistorial === a.cedula;
                    const friendlyName = getAdvisorFriendlyName(a);
                    return (
                      <button
                        key={a.cedula}
                        type="button"
                        onClick={() => setFiltroAsesorHistorial(a.cedula)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 text-white font-black shadow-sm'
                            : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {friendlyName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {loadingHistorial ? (
                <div className="py-12 text-center text-slate-400">
                  <Sparkles className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-400" />
                  <p className="text-xs font-bold">Cargando historial de coachings...</p>
                </div>
              ) : filteredHistorial.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Award className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-bold">No hay sesiones de coaching registradas aún.</p>
                  <p className="text-xs text-slate-500 mt-1">Haz clic en "Dar Nuevo Coaching" para registrar el primero.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistorial.map(c => (
                    <div
                      key={c.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isLight 
                          ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' 
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800/40">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white">{c.asesor_nombre}</span>
                            <span className="text-[10px] text-slate-400 font-mono">CI: {c.asesor_cedula}</span>
                          </div>
                          <div className="text-xs text-orange-400 font-bold mt-0.5 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" />
                            <span>{c.tipo_coaching}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
                            c.estado === 'Excelente' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                            c.estado === 'En Progreso' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                            'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          }`}>
                            {c.estado}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {c.fecha}
                          </span>
                        </div>
                      </div>

                      {/* Compromisos & Observaciones */}
                      <div className="pt-3 space-y-2.5">
                        {c.fortalezas && (
                          <div>
                            <span className="text-[10px] font-black uppercase text-amber-400 block">Fortalezas:</span>
                            <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{c.fortalezas}</p>
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-500 block mb-0.5">1. Compromiso Sugerido por Jefatura:</span>
                          <p className={`text-xs font-bold whitespace-pre-line p-2.5 rounded-xl border ${
                            isLight ? 'bg-amber-50/60 border-amber-200 text-slate-900' : 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                          }`}>
                            {c.compromisos}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-black uppercase text-emerald-500 block">2. Compromiso y Respuesta del Asesor:</span>
                            {c.compromiso_asesor ? (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                ✅ Acuerdo Sellado
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                ⏳ Pendiente
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-bold whitespace-pre-line p-2.5 rounded-xl border ${
                            c.compromiso_asesor
                              ? isLight ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                              : isLight ? 'bg-slate-50 border-slate-200 text-slate-400 italic' : 'bg-slate-950/40 border-slate-800 text-slate-500 italic'
                          }`}>
                            {c.compromiso_asesor || 'El asesor aún no ha respondido su compromiso en su portal.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                          <span>Impartido por: <strong className={isLight ? 'text-slate-900' : 'text-slate-300'}>{c.jefe_nombre}</strong> ({c.jefe_cargo})</span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Fijo con Botones de Acción (Siempre visible) */}
        {activeTab === 'nuevo' && (
          <div className={`p-3 sm:p-4 border-t flex items-center justify-end gap-2 shrink-0 z-30 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#080d1a] border-slate-800'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider border transition cursor-pointer ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Guardando...' : 'Guardar Coaching'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
