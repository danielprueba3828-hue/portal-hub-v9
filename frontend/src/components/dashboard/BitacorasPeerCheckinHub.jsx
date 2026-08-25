import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { sendN8nEvent } from '../../services/n8nService';
import { 
  ClipboardCheck, 
  Warehouse, 
  CheckCircle2, 
  Clock, 
  Users, 
  Eye, 
  Crown, 
  X, 
  Calendar, 
  User, 
  Award, 
  FileText, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function BitacorasPeerCheckinHub({ isDirectivo, isBodeguero, isLight, user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(isBodeguero && !isDirectivo ? 'bodega' : 'jefes'); // 'jefes' | 'bodega'
  const [bitacorasJefes, setBitacorasJefes] = useState([]);
  const [reportesBodega, setReportesBodega] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [jefesRoster, setJefesRoster] = useState([]);
  const [bodeguerosRoster, setBodeguerosRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Modal de Auditoría de Lectura
  const [showAuditModal, setShowAuditModal] = useState(null); // { title, creatorName, list, roster, tipo }

  const myCedula = String(user?.user_metadata?.cedula || user?.cedula || '');
  const myCargo = user?.user_metadata?.cargo || user?.cargo || 'Colaborador';
  const myNombreCompleto = getDisplayName(
    user?.user_metadata?.nombres || '',
    user?.user_metadata?.apellidos || ''
  );

  const fetchData = async () => {
    try {
      const [bRes, rRes, cRes, eRes] = await Promise.all([
        supabase.from('bitacoras_jefes').select('*').order('fecha', { ascending: false }).order('created_at', { ascending: false }).limit(6),
        supabase.from('reportes_bodega').select('*').order('fecha', { ascending: false }).order('created_at', { ascending: false }).limit(6),
        supabase.from('tienda_lecturas_checkin').select('*').in('tipo', ['bitacora_jefe', 'reporte_bodega']),
        supabase.from('empleados').select('cedula, nombres, apellidos, cargo, rol, zona').eq('activo', true)
      ]);

      if (bRes.data) setBitacorasJefes(bRes.data);
      if (rRes.data) setReportesBodega(rRes.data);
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
            cargo: e.cargo || 'Jefatura',
            rawNombres: `${e.nombres} ${e.apellidos || ''}`
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
            cargo: 'Bodeguero',
            rawNombres: `${e.nombres} ${e.apellidos || ''}`
          }));

        setJefesRoster(jefes);
        setBodeguerosRoster(bodegueros);
      }
    } catch (err) {
      console.error('Error loading bitacoras peer hub:', err);
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

      fetchData();
    } catch (err) {
      console.error('Error in bitacora checkin:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  // Solo renderizar si el usuario es directivo o bodeguero
  if (!isDirectivo && !isBodeguero) {
    return null;
  }

  return (
    <section className={`p-4 sm:p-6 rounded-3xl border shadow-xl transition-all ${
      isLight 
        ? 'bg-white border-slate-200 shadow-slate-200/50 text-slate-900' 
        : 'bg-[#0a1120] border-slate-800 text-white shadow-2xl'
    }`}>
      
      {/* Header con Selector de Pestañas Unificadas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-800/60">
        
        {/* Pestañas: Bitácoras de Jefes vs Reportes de Bodega */}
        <div className={`p-1 rounded-2xl border flex items-center gap-1 self-start ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          {isDirectivo && (
            <button
              onClick={() => setActiveTab('jefes')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'jefes'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Bitácoras de Jefatura ({bitacorasJefes.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('bodega')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'bodega'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-500/20'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>Reportes de Bodega ({reportesBodega.length})</span>
          </button>
        </div>

        {/* Enlace rápido a la vista completa */}
        <button
          type="button"
          onClick={() => navigate(activeTab === 'jefes' ? '/bitacoras?tab=historial_bitacoras' : '/bitacoras?tab=reportes_bodega')}
          className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition active:scale-95"
        >
          <span>Ir al Módulo Completo</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BITÁCORAS DE JEFATURA */}
      {/* ========================================================================= */}
      {activeTab === 'jefes' && (
        <div className="pt-4">
          {bitacorasJefes.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs font-bold">No hay bitácoras de jefatura registradas recientemente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bitacorasJefes.map(b => {
                const creatorName = b.colaborador || b.nombre_jefe || 'Jefe de Tienda';
                const creatorCedula = String(b.cedula_jefe || '');
                
                // ¿El usuario actual es el creador de esta bitácora?
                const isCreator = (creatorCedula && creatorCedula === myCedula) || 
                  creatorName.toLowerCase().includes(myNombreCompleto.toLowerCase()) ||
                  myNombreCompleto.toLowerCase().includes(creatorName.toLowerCase());

                const itemCheckins = checkins.filter(c => c.tipo === 'bitacora_jefe' && String(c.referencia_id) === String(b.id));
                const hasMyCheckin = itemCheckins.some(c => String(c.usuario_cedula) === myCedula);

                // Total de jefes enterados (el creador + los check-ins de los demás)
                const totalJefesCount = jefesRoster.length || 4;
                const enteradosCount = itemCheckins.length + (isCreator ? 0 : (creatorCedula ? 1 : 1));

                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                      isLight 
                        ? 'bg-slate-50/80 border-slate-200 hover:border-blue-500/50 shadow-xs' 
                        : 'bg-[#060b17] border-slate-800/80 hover:border-blue-500/40 shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {b.turno || 'Turno Activo'}
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {b.fecha}
                        </span>
                      </div>

                      <h4 className={`text-sm font-black tracking-tight mb-1 ${
                        isLight ? 'text-slate-950' : 'text-white'
                      }`}>
                        Bitácora: {creatorName}
                      </h4>

                      <p className={`text-xs leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {b.observaciones || b.novedades || 'Revisión y tareas administrativas/operativas del turno completadas.'}
                      </p>

                      {b.cumplimiento_meta && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Venta / Meta: {parseFloat(b.cumplimiento_meta).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones y Peer Check-in */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800/40 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        
                        {/* Estado del usuario conectado */}
                        {isCreator ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30 shadow-xs">
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

                        {/* Botón Auditoría de Jefes Enterados */}
                        {isDirectivo && (
                          <button
                            type="button"
                            onClick={() => setShowAuditModal({
                              title: `Bitácora de ${creatorName} (${b.fecha})`,
                              creatorName,
                              creatorCedula,
                              list: itemCheckins,
                              roster: jefesRoster,
                              tipo: 'bitacora_jefe',
                              itemData: { tipo: 'bitacora_jefe', id: b.id, titulo: `Bitácora ${b.fecha}` }
                            })}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-tight flex items-center gap-1 border transition-all active:scale-95 cursor-pointer shadow-xs ${
                              isLight
                                ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border-blue-500/40'
                            }`}
                            title="Ver qué jefes ya revisaron esta bitácora"
                          >
                            <Users className="w-3 h-3 text-blue-400" />
                            <span>{itemCheckins.length + 1}/{totalJefesCount} Jefes</span>
                            <span className="text-[8px] font-bold opacity-75">· Ver 👁️</span>
                          </button>
                        )}

                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REPORTES DE BODEGA */}
      {/* ========================================================================= */}
      {activeTab === 'bodega' && (
        <div className="pt-4">
          {reportesBodega.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Warehouse className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs font-bold">No hay reportes de bodega registrados recientemente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportesBodega.map(r => {
                const creatorName = r.colaborador || 'Bodeguero';
                
                // ¿El usuario actual es el creador de este reporte?
                const isCreator = creatorName.toLowerCase().includes(myNombreCompleto.toLowerCase()) ||
                  myNombreCompleto.toLowerCase().includes(creatorName.toLowerCase());

                const itemCheckins = checkins.filter(c => c.tipo === 'reporte_bodega' && String(c.referencia_id) === String(r.id));
                const hasMyCheckin = itemCheckins.some(c => String(c.usuario_cedula) === myCedula);

                const totalBodegaCount = bodeguerosRoster.length || 3;

                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                      isLight 
                        ? 'bg-slate-50/80 border-slate-200 hover:border-cyan-500/50 shadow-xs' 
                        : 'bg-[#060b17] border-slate-800/80 hover:border-cyan-500/40 shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          {r.turno || 'Turno Bodega'}
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {r.fecha}
                        </span>
                      </div>

                      <h4 className={`text-sm font-black tracking-tight mb-1 ${
                        isLight ? 'text-slate-950' : 'text-white'
                      }`}>
                        Reporte: {creatorName}
                      </h4>

                      <p className={`text-xs leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {r.actividades || r.guias_descripcion || r.novedades || 'Operaciones de recepción, etiquetado y despacho en bodega completadas.'}
                      </p>

                      {r.guias_realizadas && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-400">
                          <span>📦 Guías Realizadas: {r.guias_realizadas}</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones y Peer Check-in */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800/40 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        
                        {/* Estado del usuario conectado */}
                        {isCreator ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30 shadow-xs">
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
                            onClick={() => handleCheckin('reporte_bodega', r.id, `Reporte Bodega ${r.fecha}`, creatorName)}
                            disabled={actionInProgress}
                            className="flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Marcar Enterado</span>
                          </button>
                        )}

                        {/* Botón Auditoría de Bodegueros y Jefes Enterados */}
                        {(isDirectivo || isBodeguero) && (() => {
                          const itemCheckinCedulas = new Set(itemCheckins.map(c => String(c.usuario_cedula || '')));
                          const bodegaReadCount = bodeguerosRoster.filter(emp => 
                            creatorName.toLowerCase().includes(emp.nombres.toLowerCase()) || 
                            itemCheckinCedulas.has(String(emp.cedula))
                          ).length;
                          const jefesReadCount = jefesRoster.filter(emp => 
                            itemCheckinCedulas.has(String(emp.cedula))
                          ).length;

                          return (
                            <button
                              type="button"
                              onClick={() => setShowAuditModal({
                                title: `Reporte de Bodega (${creatorName} - ${r.fecha})`,
                                creatorName,
                                list: itemCheckins,
                                roster: bodeguerosRoster,
                                jefesRosterList: jefesRoster,
                                tipo: 'reporte_bodega',
                                itemData: { tipo: 'reporte_bodega', id: r.id, titulo: `Reporte Bodega ${r.fecha}` }
                              })}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-tight flex items-center gap-1 border transition-all active:scale-95 cursor-pointer shadow-xs ${
                                isLight
                                  ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200'
                                  : 'bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/40'
                              }`}
                              title="Ver qué compañeros de bodega y qué jefes ya revisaron este reporte"
                            >
                              <Users className="w-3 h-3 text-cyan-400" />
                              <span>{bodegaReadCount}/{bodeguerosRoster.length || 3} Bodega • {jefesReadCount}/{jefesRoster.length || 3} Jefes</span>
                              <span className="text-[8px] font-bold opacity-75">· Ver 👁️</span>
                            </button>
                          );
                        })()}

                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL AUDITORÍA DE LECTURAS ENTRE PARES Y JEFATURA */}
      {/* ========================================================================= */}
      {showAuditModal && (() => {
        const readCedulas = new Set(showAuditModal.list.map(c => String(c.usuario_cedula || '')));
        const isBodegaReport = showAuditModal.tipo === 'reporte_bodega';

        const isCreatorEmp = (emp) => {
          const cLower = (showAuditModal.creatorName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const nLower = (emp.nombres || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const rawLower = (emp.rawNombres || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
          const words = cLower.split(/\s+/).filter(w => w.length > 2);
          const matched = words.filter(w => nLower.includes(w) || rawLower.includes(w));
          return matched.length >= 2 || (words.length === 1 && matched.length === 1);
        };

        const fullRoster = isBodegaReport 
          ? [...(showAuditModal.roster || []), ...(showAuditModal.jefesRosterList || [])]
          : (showAuditModal.roster.length > 0 ? showAuditModal.roster : []);

        const pendingList = fullRoster.filter(emp => !isCreatorEmp(emp) && !readCedulas.has(String(emp.cedula)));
        const isCurrentPending = pendingList.some(emp => String(emp.cedula) === String(myCedula));

        const pendingBodega = isBodegaReport 
          ? (showAuditModal.roster || []).filter(emp => !isCreatorEmp(emp) && !readCedulas.has(String(emp.cedula)))
          : [];
        const pendingJefes = isBodegaReport 
          ? (showAuditModal.jefesRosterList || []).filter(emp => !isCreatorEmp(emp) && !readCedulas.has(String(emp.cedula)))
          : [];

        const readBodega = isBodegaReport
          ? showAuditModal.list.filter(c => (showAuditModal.roster || []).some(emp => String(emp.cedula) === String(c.usuario_cedula)))
          : [];
        const readJefes = isBodegaReport
          ? showAuditModal.list.filter(c => (showAuditModal.jefesRosterList || []).some(emp => String(emp.cedula) === String(c.usuario_cedula)))
          : [];

        return (
          <div 
            onClick={() => setShowAuditModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-24 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overscroll-none touch-none"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-3xl border p-4 sm:p-5 shadow-2xl flex flex-col gap-3 max-h-[78vh] overscroll-contain ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0a1120] border-slate-800 text-white'
              }`}
            >
              {/* Header del Modal */}
              <div className="flex items-start justify-between gap-3 border-b pb-3 border-slate-800/60 shrink-0">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    isBodegaReport ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black tracking-tight leading-tight truncate">
                      {isBodegaReport ? 'Auditoría: Bodega & Supervisión Jefatura' : 'Auditoría de Lecturas Entre Jefes'}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                      {showAuditModal.title}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAuditModal(null)} 
                  className={`p-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
                    isLight ? 'hover:bg-slate-100 border-slate-200 text-slate-600' : 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Segmented Tabs: Enterados vs Faltan */}
              <div className={`p-1 rounded-2xl border flex items-center gap-1 shrink-0 ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <button
                  onClick={() => setShowAuditModal(prev => ({ ...prev, currentTab: 'enterados' }))}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    (!showAuditModal.currentTab || showAuditModal.currentTab === 'enterados')
                      ? (isBodegaReport ? 'bg-cyan-600 text-white shadow-md' : 'bg-blue-600 text-white shadow-md')
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enterados ({showAuditModal.list.length + 1})</span>
                </button>

                <button
                  onClick={() => setShowAuditModal(prev => ({ ...prev, currentTab: 'pendientes' }))}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    showAuditModal.currentTab === 'pendientes'
                      ? 'bg-amber-600 text-white shadow-md'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Faltan ({pendingList.length})</span>
                </button>
              </div>

              {/* Si el usuario actual está pendiente */}
              {isCurrentPending && (
                <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 shrink-0">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-amber-300 block truncate">
                      👋 {myNombreCompleto}, aún no has confirmado enterado
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      if (showAuditModal.itemData) {
                        await handleCheckin(
                          showAuditModal.itemData.tipo,
                          showAuditModal.itemData.id,
                          showAuditModal.itemData.titulo,
                          showAuditModal.creatorName
                        );
                        setShowAuditModal(null);
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase shrink-0 cursor-pointer shadow-md"
                  >
                    Marcar Enterado
                  </button>
                </div>
              )}

              {/* ================= CONTENIDO: ENTERADOS ================= */}
              {(!showAuditModal.currentTab || showAuditModal.currentTab === 'enterados') && (
                <div className="overflow-y-auto flex-1 space-y-3 pr-1 scrollbar-thin">
                  
                  {/* Tarjeta del Creador (Siempre primero) */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    isLight ? 'bg-amber-50/80 border-amber-300 text-slate-900' : 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold block leading-tight truncate">
                            {showAuditModal.creatorName}
                          </span>
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            Autor / Creador
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 block truncate">
                          {isBodegaReport ? 'Emisor de Bodega' : 'Jefe Emisor del Reporte'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[9px] text-amber-400 font-mono flex items-center gap-1 shrink-0 ml-2">
                      <CheckCircle2 className="w-3 h-3 text-amber-400" />
                      Emitido
                    </span>
                  </div>

                  {/* Caso Reporte de Bodega: Agrupación Bodega vs Jefes */}
                  {isBodegaReport ? (
                    <>
                      {/* Grupo 1: Bodegueros que lo vieron */}
                      {readBodega.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                            <Warehouse className="w-3 h-3 text-cyan-400" />
                            <span>Compañeros de Bodega ({readBodega.length}):</span>
                          </span>
                          {readBodega.map((c, idx) => {
                            const isMe = String(c.usuario_cedula) === String(myCedula);
                            return (
                              <div 
                                key={idx}
                                className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                  isMe
                                    ? isLight ? 'bg-cyan-50 border-cyan-300' : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-100'
                                    : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-cyan-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">
                                    {(c.usuario_nombre || 'B').charAt(0)}
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold block truncate">{c.usuario_nombre}</span>
                                      {isMe && <span className="text-[8px] font-black uppercase px-1 rounded bg-cyan-500/20 text-cyan-400">Tú</span>}
                                    </div>
                                    <span className="text-[9px] text-slate-400 block truncate">{c.usuario_cargo || 'Bodeguero'}</span>
                                  </div>
                                </div>
                                <span className="text-[9px] text-cyan-400 font-mono flex items-center gap-1 shrink-0 ml-2">
                                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                                  {new Date(c.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Grupo 2: Jefes que supervisaron */}
                      {readJefes.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                            <ClipboardCheck className="w-3 h-3 text-blue-400" />
                            <span>Supervisión de Jefatura ({readJefes.length}):</span>
                          </span>
                          {readJefes.map((c, idx) => {
                            const isMe = String(c.usuario_cedula) === String(myCedula);
                            return (
                              <div 
                                key={idx}
                                className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                  isMe
                                    ? isLight ? 'bg-blue-50 border-blue-300' : 'bg-blue-950/30 border-blue-500/40 text-blue-100'
                                    : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">
                                    {(c.usuario_nombre || 'J').charAt(0)}
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold block truncate">{c.usuario_nombre}</span>
                                      {isMe && <span className="text-[8px] font-black uppercase px-1 rounded bg-blue-500/20 text-blue-400">Tú</span>}
                                    </div>
                                    <span className="text-[9px] text-slate-400 block truncate">{c.usuario_cargo || 'Jefe de Tienda'}</span>
                                  </div>
                                </div>
                                <span className="text-[9px] text-blue-400 font-mono flex items-center gap-1 shrink-0 ml-2">
                                  <CheckCircle2 className="w-3 h-3 text-blue-400" />
                                  {new Date(c.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Caso Bitácora de Jefes */
                    showAuditModal.list.map((c, idx) => {
                      const isMe = String(c.usuario_cedula) === String(myCedula);
                      const initials = (c.usuario_nombre || 'CO')
                        .split(' ')
                        .map(w => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <div 
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                            isMe
                              ? isLight ? 'bg-blue-50 border-blue-300 shadow-xs' : 'bg-blue-950/30 border-blue-500/40 text-blue-100'
                              : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg text-white font-black text-[10px] flex items-center justify-center shrink-0 ${
                              isMe ? 'bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-sm' : 'bg-slate-700'
                            }`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold block leading-tight truncate">
                                  {c.usuario_nombre}
                                </span>
                                {isMe && (
                                  <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 block truncate">{c.usuario_cargo || 'Jefe de Tienda'}</span>
                            </div>
                          </div>

                          <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 shrink-0 ml-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {new Date(c.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ================= CONTENIDO: FALTAN ================= */}
              {showAuditModal.currentTab === 'pendientes' && (
                <div className="overflow-y-auto flex-1 space-y-3 pr-1 scrollbar-thin">
                  {pendingList.length === 0 ? (
                    <div className="py-8 text-center text-emerald-400 space-y-1">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1 animate-bounce" />
                      <p className="text-xs font-black">¡Excelente! Todo el equipo está enterado.</p>
                      <p className="text-[10px] text-slate-400">100% de cumplimiento en revisión.</p>
                    </div>
                  ) : isBodegaReport ? (
                    <>
                      {/* Faltan de Bodega */}
                      {pendingBodega.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                            <Warehouse className="w-3 h-3 text-cyan-400" />
                            <span>Compañeros de Bodega Pendientes ({pendingBodega.length}):</span>
                          </span>
                          {pendingBodega.map((emp, idx) => {
                            const isMe = String(emp.cedula) === String(myCedula);
                            return (
                              <div 
                                key={idx}
                                className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                                  isMe
                                    ? isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-950/25 border-amber-500/40 text-amber-100'
                                    : isLight ? 'bg-slate-50 border-slate-200 opacity-90' : 'bg-slate-900/80 border-slate-800 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-black text-[9px] flex items-center justify-center shrink-0 border border-amber-500/30">
                                    {(emp.nombres || 'B').charAt(0)}
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold block truncate">{emp.nombres}</span>
                                      {isMe && <span className="text-[8px] font-black uppercase px-1 rounded bg-amber-500/20 text-amber-400">Tú</span>}
                                    </div>
                                    <span className="text-[9px] text-slate-400 block truncate">{emp.cargo}</span>
                                  </div>
                                </div>
                                <span className="text-[9px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                                  Sin leer
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Faltan de Jefatura */}
                      {pendingJefes.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                            <ClipboardCheck className="w-3 h-3 text-blue-400" />
                            <span>Jefes Pendientes de Revisar ({pendingJefes.length}):</span>
                          </span>
                          {pendingJefes.map((emp, idx) => {
                            const isMe = String(emp.cedula) === String(myCedula);
                            return (
                              <div 
                                key={idx}
                                className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                                  isMe
                                    ? isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-950/25 border-amber-500/40 text-amber-100'
                                    : isLight ? 'bg-slate-50 border-slate-200 opacity-90' : 'bg-slate-900/80 border-slate-800 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-black text-[9px] flex items-center justify-center shrink-0 border border-blue-500/30">
                                    {(emp.nombres || 'J').charAt(0)}
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold block truncate">{emp.nombres}</span>
                                      {isMe && <span className="text-[8px] font-black uppercase px-1 rounded bg-amber-500/20 text-amber-400">Tú</span>}
                                    </div>
                                    <span className="text-[9px] text-slate-400 block truncate">{emp.cargo}</span>
                                  </div>
                                </div>
                                <span className="text-[9px] text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30">
                                  Por supervisar
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Caso Bitácora de Jefes */
                    pendingList.map((emp, idx) => {
                      const isMe = String(emp.cedula) === String(myCedula);
                      const initials = (emp.nombres || 'CO')
                        .split(' ')
                        .map(w => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <div 
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                            isMe
                              ? isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-950/25 border-amber-500/40 text-amber-100'
                              : isLight ? 'bg-slate-50 border-slate-200 opacity-90' : 'bg-slate-900/80 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black text-[10px] flex items-center justify-center shrink-0 border border-amber-500/30">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold block leading-tight truncate">
                                  {emp.nombres}
                                </span>
                                {isMe && (
                                  <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 block truncate">{emp.cargo}</span>
                            </div>
                          </div>

                          <span className="text-[9px] text-amber-400 font-bold flex items-center gap-1 shrink-0 ml-2 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Sin revisar
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Footer */}
              <div className={`pt-2.5 border-t flex items-center justify-between text-[10px] font-bold shrink-0 ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
              }`}>
                <span>
                  🟢 <strong>{showAuditModal.list.length + 1}</strong> enterados • ⏳ <strong>{pendingList.length}</strong> pendientes
                </span>
                <button
                  type="button"
                  onClick={() => setShowAuditModal(null)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </section>
  );
}
