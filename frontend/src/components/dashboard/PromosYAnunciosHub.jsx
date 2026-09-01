import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { sendN8nEvent } from '../../services/n8nService';
import { 
  Tag, 
  Megaphone, 
  Plus, 
  Flame, 
  Sparkles, 
  Calendar, 
  User, 
  CheckCircle2, 
  X, 
  Trash2, 
  Pin,
  Clock,
  Zap,
  Image as ImageIcon,
  Check,
  Eye,
  Users,
  Upload,
  ChevronDown,
  ChevronUp,
  Maximize2
} from 'lucide-react';

const getDisplayName = (nombres = '', apellidos = '') => {
  const cleanN = (nombres || '').trim();
  const cleanA = (apellidos || '').trim();
  if (!cleanN && !cleanA) return 'Colaborador';

  const nWords = cleanN.split(/\s+/).filter(Boolean);
  const aWords = cleanA.split(/\s+/).filter(Boolean);

  const firstN = nWords[0] ? nWords[0].charAt(0).toUpperCase() + nWords[0].slice(1).toLowerCase() : '';
  const secondN = nWords[1] ? nWords[1].charAt(0).toUpperCase() + nWords[1].slice(1).toLowerCase() : '';
  const firstA = aWords[0] ? aWords[0].charAt(0).toUpperCase() + aWords[0].slice(1).toLowerCase() : '';

  // Casos especiales elegantes (Ej: Jose Gustavo -> Gustavo Valenzuela)
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

const getRemainingTime12h = (createdAt) => {
  if (!createdAt) return { isExpired: false, text: '12h restantes', hoursLeft: 12, urgent: false };
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return { isExpired: false, text: '12h restantes', hoursLeft: 12, urgent: false };
  
  const limitTime = createdTime + (12 * 60 * 60 * 1000); // 12 horas
  const now = Date.now();
  const diffMs = limitTime - now;

  if (diffMs <= 0) {
    return { isExpired: true, text: 'Tiempo agotado (>12h)', hoursLeft: 0, urgent: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    isExpired: false,
    text: hours > 0 ? `${hours}h ${minutes}m restantes` : `${minutes}m restantes`,
    hoursLeft: hours,
    urgent: hours < 3
  };
};

export default function PromosYAnunciosHub({ isDirectivo, isLight, user }) {
  const [activeTab, setActiveTab] = useState('promos'); // 'promos' | 'anuncios'
  const [promos, setPromos] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [checkins, setCheckins] = useState([]); // [{ tipo, referencia_id, usuario_cedula, usuario_nombre }]
  const [empleadosRoster, setEmpleadosRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showAnuncioModal, setShowAnuncioModal] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [showReadersModal, setShowReadersModal] = useState(null); // { title, list }

  // Formulario Promo
  const [promoForm, setPromoForm] = useState({
    titulo: '',
    descripcion: '',
    descuento: '',
    categoria: 'Venta Cruzada'
  });
  const [promoImageFile, setPromoImageFile] = useState(null);
  const [promoImagePreview, setPromoImagePreview] = useState(null);

  // Formulario Anuncio
  const [anuncioForm, setAnuncioForm] = useState({
    titulo: '',
    contenido: '',
    prioridad: 'Importante',
    fijado: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  const myCedula = String(user?.user_metadata?.cedula || user?.cedula || '');
  const myCargo = user?.user_metadata?.cargo || user?.cargo || 'Asesor de Ventas';
  const myNombreCompleto = getDisplayName(
    user?.user_metadata?.nombres || '',
    user?.user_metadata?.apellidos || ''
  );

  const fetchHubData = async () => {
    try {
      const [pRes, aRes, cRes, eRes] = await Promise.all([
        supabase.from('tienda_promociones').select('*').eq('activo', true).order('created_at', { ascending: false }),
        supabase.from('tienda_anuncios').select('*').order('fijado', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('tienda_lecturas_checkin').select('*'),
        supabase.from('empleados').select('cedula, nombres, apellidos, cargo, rol').eq('activo', true)
      ]);

      if (pRes.data) setPromos(pRes.data);
      if (aRes.data) setAnuncios(aRes.data);
      if (cRes.data) setCheckins(cRes.data);
      if (eRes.data && eRes.data.length > 0) {
        const formatted = eRes.data.map(emp => ({
          cedula: String(emp.cedula),
          nombres: getDisplayName(emp.nombres, emp.apellidos),
          cargo: emp.cargo || 'Colaborador'
        }));
        setEmpleadosRoster(formatted);
      }
    } catch (e) {
      console.error('Error fetching hub data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  // Manejar Check-in / Visto
  const handleCheckin = async (tipo, referenciaId, tituloItem) => {
    if (!myCedula) {
      alert('Debes tener tu cédula registrada para confirmar lectura.');
      return;
    }
    setActionInProgress(true);
    try {
      const { error } = await supabase
        .from('tienda_lecturas_checkin')
        .insert([{
          tipo,
          referencia_id: referenciaId,
          usuario_cedula: myCedula,
          usuario_nombre: myNombreCompleto,
          usuario_cargo: myCargo
        }]);

      if (error && !error.message?.includes('duplicate')) throw error;

      sendN8nEvent('CHECKIN_LECTURA_CONFIRMADO', {
        tipo,
        referencia_id: referenciaId,
        titulo: tituloItem,
        colaborador: myNombreCompleto,
        cedula: myCedula,
        cargo: myCargo
      }, user?.user_metadata);

      fetchHubData();
    } catch (err) {
      console.error('Error checkin:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  // Crear Promo con subida opcional de PNG/JPG
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!promoForm.titulo.trim()) return;
    setSubmitting(true);
    try {
      let imageUrl = null;

      if (promoImageFile) {
        const fileExt = promoImageFile.name.split('.').pop();
        const filePath = `promociones/promo_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase
          .storage
          .from('evidencias-jefes')
          .upload(filePath, promoImageFile, { upsert: true });

        if (!uploadError) {
          const { data: pubData } = supabase.storage.from('evidencias-jefes').getPublicUrl(filePath);
          imageUrl = pubData?.publicUrl || null;
        }
      }

      const payload = {
        ...promoForm,
        imagen_url: imageUrl,
        activo: true,
        creado_por: myNombreCompleto
      };

      const { data, error } = await supabase.from('tienda_promociones').insert([payload]).select();
      if (error) throw error;

      // Auto check-in del creador
      if (data?.[0]?.id) {
        await supabase.from('tienda_lecturas_checkin').insert([{
          tipo: 'promo',
          referencia_id: data[0].id,
          usuario_cedula: myCedula,
          usuario_nombre: myNombreCompleto,
          usuario_cargo: myCargo
        }]);
      }

      sendN8nEvent('NUEVA_PROMOCION_PUBLICADA', {
        ...payload,
        autor: myNombreCompleto
      }, user?.user_metadata);

      setPromoForm({ titulo: '', descripcion: '', descuento: '', categoria: 'Venta Cruzada' });
      setPromoImageFile(null);
      setPromoImagePreview(null);
      setShowPromoModal(false);
      fetchHubData();
    } catch (err) {
      alert('Error al publicar promoción: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Crear Anuncio
  const handleCreateAnuncio = async (e) => {
    e.preventDefault();
    if (!anuncioForm.titulo.trim() || !anuncioForm.contenido.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...anuncioForm,
        autor_nombre: myNombreCompleto,
        autor_cargo: myCargo
      };

      const { data, error } = await supabase.from('tienda_anuncios').insert([payload]).select();
      if (error) throw error;

      // Auto check-in del creador
      if (data?.[0]?.id) {
        await supabase.from('tienda_lecturas_checkin').insert([{
          tipo: 'anuncio',
          referencia_id: data[0].id,
          usuario_cedula: myCedula,
          usuario_nombre: myNombreCompleto,
          usuario_cargo: myCargo
        }]);
      }

      sendN8nEvent('NUEVO_ANUNCIO_PUBLICADO', {
        ...payload,
        autor: myNombreCompleto
      }, user?.user_metadata);

      setAnuncioForm({ titulo: '', contenido: '', prioridad: 'Importante', fijado: false });
      setShowAnuncioModal(false);
      fetchHubData();
    } catch (err) {
      alert('Error al publicar comunicado: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm('¿Deseas retirar esta promoción de la tienda?')) return;
    await supabase.from('tienda_promociones').delete().eq('id', id);
    fetchHubData();
  };

  const handleDeleteAnuncio = async (id) => {
    if (!window.confirm('¿Deseas eliminar este comunicado?')) return;
    await supabase.from('tienda_anuncios').delete().eq('id', id);
    fetchHubData();
  };

  return (
    <section className={`p-4 sm:p-6 rounded-3xl border shadow-xl transition-all ${
      isLight 
        ? 'bg-white border-slate-200 shadow-slate-200/50 text-slate-900' 
        : 'bg-[#0a1120] border-slate-800 text-white shadow-2xl'
    }`}>
      
      {/* Header con Selector de Pestañas Unificadas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-800/60">
        
        {/* Pestañas: Promos vs Anuncios */}
        <div className={`p-1 rounded-2xl border flex items-center gap-1 self-start ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('promos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'promos'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Promos en Tienda ({promos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('anuncios')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'anuncios'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Anuncios Jefatura ({anuncios.length})</span>
          </button>
        </div>

        {/* Botón de Acción para Jefatura */}
        {isDirectivo && (
          <div>
            {activeTab === 'promos' ? (
              <button
                onClick={() => setShowPromoModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Promoción</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAnuncioModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-500/25 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publicar Anuncio</span>
              </button>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROMOCIONES ACTIVAS EN TIENDA */}
      {/* ========================================================================= */}
      {activeTab === 'promos' && (
        <div className="pt-4">
          {promos.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Tag className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs font-bold">No hay promociones activas registradas en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {promos.map(p => {
                const itemCheckins = checkins.filter(c => c.tipo === 'promo' && Number(c.referencia_id) === Number(p.id));
                const hasMyCheckin = itemCheckins.some(c => c.usuario_cedula === myCedula);

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isLight 
                        ? 'bg-slate-50/80 border-slate-200 hover:border-emerald-500/50 shadow-xs' 
                        : 'bg-[#060b17] border-slate-800/80 hover:border-emerald-500/40 shadow-md'
                    }`}
                  >
                    {/* Imagen de la Promo (si existe) */}
                    {p.imagen_url ? (
                      <div 
                        onClick={() => setPreviewImageModal(p.imagen_url)}
                        className="relative w-full h-36 bg-slate-950 overflow-hidden cursor-pointer group"
                      >
                        <img 
                          src={p.imagen_url} 
                          alt={p.titulo} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Maximize2 className="w-4 h-4" />
                          <span>Ver Imagen</span>
                        </div>
                        <div className="absolute top-2 left-2">
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-600 text-white shadow-md">
                            {p.descuento || 'Oferta'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 pb-0 flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {p.descuento || 'Oferta'}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${
                          isLight ? 'bg-slate-200/70 text-slate-700' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {p.categoria || 'Tienda'}
                        </span>
                      </div>
                    )}

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {p.imagen_url && (
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${
                              isLight ? 'bg-slate-200/70 text-slate-700' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {p.categoria || 'Tienda'}
                            </span>
                          </div>
                        )}

                        <h4 className={`text-sm font-black tracking-tight leading-snug mb-1 ${
                          isLight ? 'text-slate-950' : 'text-white'
                        }`}>
                          {p.titulo}
                        </h4>

                        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {p.descripcion}
                        </p>
                      </div>

                      {/* Sección de Check-in y Visto con Límite de 12 Horas */}
                      <div className="mt-3.5 pt-3 border-t border-slate-800/40 space-y-2">
                        {/* Temporizador de 12h */}
                        {(() => {
                          const timeInfo = getRemainingTime12h(p.created_at);
                          return (
                            <div className="flex items-center justify-between text-[10px]">
                              <span className={`flex items-center gap-1 font-bold ${
                                hasMyCheckin 
                                  ? 'text-emerald-400' 
                                  : timeInfo.isExpired 
                                    ? 'text-rose-400 font-black' 
                                    : timeInfo.urgent 
                                      ? 'text-amber-400 font-black animate-pulse' 
                                      : isLight ? 'text-slate-500' : 'text-slate-400'
                              }`}>
                                <Clock className="w-3 h-3" />
                                <span>
                                  {hasMyCheckin 
                                    ? 'Completado dentro del plazo' 
                                    : timeInfo.isExpired 
                                      ? '⚠️ Límite de 12h vencido' 
                                      : `⏳ Límite: ${timeInfo.text}`}
                                </span>
                              </span>
                            </div>
                          );
                        })()}

                        <div className="flex items-center justify-between">
                          {hasMyCheckin ? (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Visto por ti</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckin('promo', p.id, p.titulo)}
                              disabled={actionInProgress}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Marcar Visto</span>
                            </button>
                          )}

                          {/* Contador y Lista de Lectores (Exclusivo para Jefes/Directivos) */}
                          {isDirectivo && (
                            <button
                              type="button"
                              onClick={() => setShowReadersModal({ 
                                title: `Visto en: ${p.titulo}`, 
                                list: itemCheckins,
                                itemData: { tipo: 'promo', id: p.id, titulo: p.titulo, createdAt: p.created_at }
                              })}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-black tracking-tight flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer shadow-xs ${
                                isLight
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 hover:border-emerald-400'
                                  : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
                              }`}
                              title="Toca para auditar quién ya lo vio y quién falta"
                            >
                              <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{itemCheckins.length}/{empleadosRoster.length || 18} Vistos</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ml-0.5 ${
                                isLight ? 'bg-emerald-200/80 text-emerald-900' : 'bg-emerald-500/20 text-emerald-300'
                              }`}>
                                Ver Lista 👁️
                              </span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                          <span>Publicado por: <strong className={isLight ? 'text-slate-700' : 'text-slate-300'}>{p.creado_por || 'Jefatura'}</strong></span>
                          {isDirectivo && (
                            <button
                              onClick={() => handleDeletePromo(p.id)}
                              className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                              title="Eliminar promo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
      {/* TAB 2: ANUNCIOS Y COMUNICADOS DE JEFATURA */}
      {/* ========================================================================= */}
      {activeTab === 'anuncios' && (
        <div className="pt-4">
          {anuncios.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Megaphone className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs font-bold">No hay anuncios ni comunicados oficiales en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anuncios.map(a => {
                const isUrgente = a.prioridad === 'Urgente';
                const itemCheckins = checkins.filter(c => c.tipo === 'anuncio' && Number(c.referencia_id) === Number(a.id));
                const hasMyCheckin = itemCheckins.some(c => c.usuario_cedula === myCedula);

                return (
                  <div
                    key={a.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isUrgente
                        ? isLight 
                          ? 'bg-rose-50/70 border-rose-300 text-slate-900' 
                          : 'bg-gradient-to-br from-[#1a0c0f] to-[#0a1120] border-rose-500/40 text-white shadow-lg shadow-rose-950/20'
                        : isLight 
                          ? 'bg-slate-50/80 border-slate-200 text-slate-900' 
                          : 'bg-[#060b17] border-slate-800/80 text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          {isUrgente ? (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                              <Flame className="w-3 h-3 text-rose-500" />
                              Urgente
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              <Pin className="w-3 h-3 text-amber-500" />
                              Comunicado
                            </span>
                          )}

                          {a.fijado && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              📌 Fijado
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(a.created_at).toLocaleDateString('es-EC')}
                        </span>
                      </div>

                      <h4 className={`text-sm font-black tracking-tight mb-1.5 ${
                        isLight ? 'text-slate-950' : 'text-white'
                      }`}>
                        {a.titulo}
                      </h4>

                      <p className={`text-xs leading-relaxed whitespace-pre-line ${
                        isLight ? 'text-slate-700' : 'text-slate-300'
                      }`}>
                        {a.contenido}
                      </p>
                    </div>

                    {/* Sección de Check-in y Visto con Límite de 12 Horas */}
                    <div className="mt-4 pt-3 border-t border-slate-800/40 space-y-2">
                      {/* Temporizador de 12h */}
                      {(() => {
                        const timeInfo = getRemainingTime12h(a.created_at);
                        return (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={`flex items-center gap-1 font-bold ${
                              hasMyCheckin 
                                ? 'text-emerald-400' 
                                : timeInfo.isExpired 
                                  ? 'text-rose-400 font-black' 
                                  : timeInfo.urgent 
                                    ? 'text-amber-400 font-black animate-pulse' 
                                    : isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>
                                {hasMyCheckin 
                                  ? 'Lectura confirmada a tiempo' 
                                  : timeInfo.isExpired 
                                    ? '⚠️ Límite de 12h vencido' 
                                    : `⏳ Límite de lectura: ${timeInfo.text}`}
                              </span>
                            </span>
                          </div>
                        );
                      })()}

                      <div className="flex items-center justify-between">
                        {hasMyCheckin ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Leído por ti</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCheckin('anuncio', a.id, a.titulo)}
                            disabled={actionInProgress}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Confirmar Lectura</span>
                          </button>
                        )}

                        {/* Contador y Lista de Lectores (Exclusivo para Jefes/Directivos) */}
                        {isDirectivo && (
                          <button
                            type="button"
                            onClick={() => setShowReadersModal({ 
                              title: `Lecturas: ${a.titulo}`, 
                              list: itemCheckins,
                              itemData: { tipo: 'anuncio', id: a.id, titulo: a.titulo, createdAt: a.created_at }
                            })}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black tracking-tight flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer shadow-xs ${
                              isLight
                                ? 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-300 hover:border-orange-400'
                                : 'bg-orange-950/40 hover:bg-orange-900/60 text-orange-300 border-orange-500/40 hover:border-orange-400'
                            }`}
                            title="Toca para auditar quién ya lo leyó y quién falta"
                          >
                            <Users className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>{itemCheckins.length}/{empleadosRoster.length || 18} Leídos</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ml-0.5 ${
                              isLight ? 'bg-orange-200/80 text-orange-900' : 'bg-orange-500/20 text-orange-300'
                            }`}>
                              Ver Lista 👁️
                            </span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-orange-400" />
                          <span><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>{a.autor_nombre}</strong> ({a.autor_cargo || 'Jefatura'})</span>
                        </div>

                        {isDirectivo && (
                          <button
                            onClick={() => handleDeleteAnuncio(a.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                            title="Eliminar comunicado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      {/* MODAL CREAR PROMOCIÓN CON IMAGEN PNG */}
      {/* ========================================================================= */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-24 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overscroll-none touch-none">
          <div className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl flex flex-col gap-4 max-h-[82vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0a1120] border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black uppercase">Nueva Promoción de Tienda</h3>
              </div>
              <button onClick={() => setShowPromoModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-3">
              
              {/* Carga de Imagen PNG / JPG */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Imagen de la Promoción (PNG / JPG)
                </label>
                <div className={`p-3 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  isLight ? 'border-slate-300 hover:border-emerald-500 bg-slate-50' : 'border-slate-700 hover:border-emerald-500 bg-slate-900/50'
                }`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPromoImageFile(file);
                        setPromoImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                    id="promoImgInput"
                  />
                  <label htmlFor="promoImgInput" className="cursor-pointer w-full flex flex-col items-center">
                    {promoImagePreview ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden mb-2">
                        <img src={promoImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 text-[9px] bg-black/75 px-2 py-0.5 rounded text-white font-bold">Cambiar imagen</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-emerald-500 mb-1" />
                        <span className="text-xs font-bold">Toca para seleccionar imagen PNG</span>
                        <span className="text-[9px] text-slate-400">Opcional para banners visuales</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Título de la Promoción *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Combo Medias + Calzado Running"
                  value={promoForm.titulo}
                  onChange={(e) => setPromoForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Badge de Descuento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 30% OFF / 3x2"
                    value={promoForm.descuento}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, descuento: e.target.value }))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Categoría</label>
                  <select
                    value={promoForm.categoria}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, categoria: e.target.value }))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Venta Cruzada">Venta Cruzada</option>
                    <option value="Calzado">Calzado</option>
                    <option value="Textil">Textil</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Liquidación">Liquidación</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Descripción / Argumento de Venta</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de la oferta y cómo ofrecerla al cliente..."
                  value={promoForm.descripcion}
                  onChange={(e) => setPromoForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium outline-none resize-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase shadow-md shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Publicar Promoción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR ANUNCIO (SOLO TEXTO) */}
      {/* ========================================================================= */}
      {showAnuncioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-24 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overscroll-none touch-none">
          <div className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl flex flex-col gap-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0a1120] border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black uppercase">Nuevo Anuncio de Jefatura</h3>
              </div>
              <button onClick={() => setShowAnuncioModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAnuncio} className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Título del Anuncio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Enfoque en Venta Cruzada Hoy"
                  value={anuncioForm.titulo}
                  onChange={(e) => setAnuncioForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nivel de Prioridad</label>
                  <select
                    value={anuncioForm.prioridad}
                    onChange={(e) => setAnuncioForm(prev => ({ ...prev, prioridad: e.target.value }))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Importante">⭐ Importante</option>
                    <option value="Urgente">🔥 Urgente</option>
                    <option value="General">ℹ️ General</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="fijadoCheck2"
                    checked={anuncioForm.fijado}
                    onChange={(e) => setAnuncioForm(prev => ({ ...prev, fijado: e.target.checked }))}
                    className="w-4 h-4 rounded text-orange-500 cursor-pointer"
                  />
                  <label htmlFor="fijadoCheck2" className="text-xs font-bold cursor-pointer select-none">
                    📌 Fijar arriba
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Contenido del Comunicado *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Escribe el mensaje o directriz para el equipo..."
                  value={anuncioForm.contenido}
                  onChange={(e) => setAnuncioForm(prev => ({ ...prev, contenido: e.target.value }))}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium outline-none resize-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnuncioModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase shadow-md shadow-orange-500/25 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Publicando...' : 'Publicar Comunicado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL ZOOM IMAGEN DE PROMO */}
      {/* ========================================================================= */}
      {previewImageModal && (
        <div 
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl">
            <img src={previewImageModal} alt="Preview Promo" className="w-full h-full object-contain" />
            <button 
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-3 right-3 p-2 bg-black/70 rounded-full text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LISTA DE LECTORES: EXCLUSIVO PARA JEFES/DIRECTIVOS */}
      {/* ========================================================================= */}
      {isDirectivo && showReadersModal && (() => {
        const readCedulas = new Set(showReadersModal.list.map(c => String(c.usuario_cedula || '')));
        const fullRoster = empleadosRoster.length > 0 ? empleadosRoster : [];

        const pendingList = fullRoster.filter(emp => !readCedulas.has(String(emp.cedula)));
        const isCurrentPending = pendingList.some(emp => String(emp.cedula) === String(myCedula));

        return (
          <div 
            onClick={() => setShowReadersModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-24 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overscroll-none touch-none"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-3xl border p-4 sm:p-5 shadow-2xl flex flex-col gap-3 max-h-[78vh] overscroll-contain ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0a1120] border-slate-800 text-white'
              }`}
            >
              {/* Header del Modal con Botón X */}
              <div className="flex items-start justify-between gap-3 border-b pb-3 border-slate-800/60 shrink-0">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black tracking-tight leading-tight truncate">
                      Control de Lecturas en Tienda
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                      {showReadersModal.title}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReadersModal(null)} 
                  className={`p-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
                    isLight ? 'hover:bg-slate-100 border-slate-200 text-slate-600' : 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Segmented Tabs: Solo los JEFES/DIRECTIVOS pueden ver la pestaña de Faltan por Leer */}
              {isDirectivo ? (
                <div className={`p-1 rounded-2xl border flex items-center gap-1 shrink-0 ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <button
                    onClick={() => setShowReadersModal(prev => ({ ...prev, currentTab: 'confirmados' }))}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      (!showReadersModal.currentTab || showReadersModal.currentTab === 'confirmados')
                        ? 'bg-emerald-600 text-white shadow-md'
                        : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Leídos ({showReadersModal.list.length})</span>
                  </button>

                  <button
                    onClick={() => setShowReadersModal(prev => ({ ...prev, currentTab: 'pendientes' }))}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      showReadersModal.currentTab === 'pendientes'
                        ? 'bg-amber-600 text-white shadow-md'
                        : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Faltan ({pendingList.length})</span>
                  </button>
                </div>
              ) : (
                <div className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-between border ${
                  isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Compañeros que han leído</span>
                  </span>
                  <span className="font-mono text-xs">{showReadersModal.list.length} confirmados</span>
                </div>
              )}

              {/* Si el usuario actual no ha marcado check-in, aviso directo */}
              {isCurrentPending && (
                <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 shrink-0">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-amber-300 block truncate">
                      👋 {myNombreCompleto}, aún no has confirmado tu lectura
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      if (showReadersModal.itemData) {
                        await handleCheckin(
                          showReadersModal.itemData.tipo,
                          showReadersModal.itemData.id,
                          showReadersModal.itemData.titulo
                        );
                        setShowReadersModal(null);
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase shrink-0 cursor-pointer shadow-md"
                  >
                    Marcar Visto
                  </button>
                </div>
              )}

              {/* ================= CONTENIDO TAB: LEÍDOS ================= */}
              {(!showReadersModal.currentTab || showReadersModal.currentTab === 'confirmados') && (
                <div className="overflow-y-auto flex-1 space-y-2 pr-1 scrollbar-thin">
                  {showReadersModal.list.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <Clock className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                      <p className="text-xs font-bold">Aún ningún compañero ha confirmado lectura.</p>
                      <p className="text-[10px] text-slate-500">Sé el primero en marcar tu check-in.</p>
                    </div>
                  ) : (
                    showReadersModal.list.map((c, idx) => {
                      const isMe = String(c.usuario_cedula) === String(myCedula);
                      const empInfo = empleadosRoster.find(e => String(e.cedula) === String(c.usuario_cedula));
                      const finalName = empInfo ? empInfo.nombres : (c.usuario_nombre || 'Colaborador');
                      const finalCargo = empInfo ? empInfo.cargo : (c.usuario_cargo || 'Asesor');
                      const initials = finalName
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
                              ? isLight ? 'bg-emerald-50 border-emerald-300 shadow-xs' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                              : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg text-white font-black text-[10px] flex items-center justify-center shrink-0 ${
                              isMe ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-sm' : 'bg-slate-700'
                            }`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold block leading-tight truncate">
                                  {finalName}
                                </span>
                                {isMe && (
                                  <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 block truncate">{finalCargo}</span>
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

              {/* ================= CONTENIDO TAB: FALTAN POR LEER ================= */}
              {showReadersModal.currentTab === 'pendientes' && (
                <div className="overflow-y-auto flex-1 space-y-2 pr-1 scrollbar-thin">
                  {pendingList.length === 0 ? (
                    <div className="py-8 text-center text-emerald-400 space-y-1">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1 animate-bounce" />
                      <p className="text-xs font-black">¡Excelente! Todo el equipo ha confirmado lectura.</p>
                      <p className="text-[10px] text-slate-400">100% de cumplimiento en tienda.</p>
                    </div>
                  ) : (
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

                          {(() => {
                            const timeInfo = getRemainingTime12h(showReadersModal.itemData?.createdAt);
                            return (
                              <span className={`text-[9px] font-bold flex items-center gap-1 shrink-0 ml-2 px-2 py-0.5 rounded-lg border ${
                                timeInfo.isExpired 
                                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-black' 
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {timeInfo.isExpired ? '12h Vencido' : 'Pendiente'}
                              </span>
                            );
                          })()}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Footer con resumen */}
              <div className={`pt-2.5 border-t flex items-center justify-between text-[10px] font-bold shrink-0 ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
              }`}>
                <span>
                  {isDirectivo ? (
                    <>🟢 <strong>{showReadersModal.list.length}</strong> leídos • ⏳ <strong>{pendingList.length}</strong> pendientes</>
                  ) : (
                    <>Total de lecturas: <strong>{showReadersModal.list.length}</strong> de {empleadosRoster.length || 18}</>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setShowReadersModal(null)}
                  className="text-xs font-bold text-orange-400 hover:text-orange-300 cursor-pointer"
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
