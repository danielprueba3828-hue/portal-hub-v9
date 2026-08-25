import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';
import { useTiendaStore } from '../store/tiendaStore';
import { supabase } from '../lib/supabaseClient';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  QrCode,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Store,
  User,
  RefreshCw
} from 'lucide-react';

export default function BodegaDevolucionesScan({ onTabChange, selectedFecha, onFechaChange }) {
  const { user } = useAuthStore();
  const { tiendaSeleccionada, tiendas, fetchTiendas, seleccionarTienda } = useTiendaStore();
  const { theme: activeTheme } = useThemeStore();
  
  const cargo = user?.user_metadata?.cargo || 'Asesor de Ventas';
  const employeeTheme = getEmployeeTheme(cargo, user?.user_metadata?.nombres || '', user?.user_metadata?.cargo_anterior || '');
  const tc = getThemeClasses(activeTheme, employeeTheme);

  // Estados del Formulario
  const [alu, setAlu] = useState('');
  const [tipo, setTipo] = useState('Ingreso'); // 'Ingreso' o 'Garantía'
  const [fecha, setFecha] = useState(selectedFecha || new Date().toISOString().split('T')[0]);
  const [scannedItems, setScannedItems] = useState([]);

  // Sincronizar fecha desde prop selectedFecha
  useEffect(() => {
    if (selectedFecha) {
      setFecha(selectedFecha);
    }
  }, [selectedFecha]);
  
  // Estados UI
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Inicializar tiendas e historial
  useEffect(() => {
    if (user) {
      fetchTiendas(user);
    }
  }, [user, fetchTiendas]);

  useEffect(() => {
    if (tiendaSeleccionada) {
      fetchTodayScans();
    }
  }, [tiendaSeleccionada, fecha]);

  // Inicializar Scanner
  useEffect(() => {
    const html5Qrcode = new Html5Qrcode("reader");
    setScanner(html5Qrcode);
    return () => {
      if (html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(err => console.error("Error al apagar el escáner:", err));
      }
    };
  }, []);

  const fetchTodayScans = async () => {
    if (!tiendaSeleccionada) return;
    setFetchingHistory(true);
    try {
      const { data, error } = await supabase
        .from('registro_devoluciones')
        .select('*')
        .eq('tienda_id', tiendaSeleccionada.id)
        .eq('fecha', fecha)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScannedItems(data || []);
    } catch (err) {
      console.error("Error al obtener historial de escaneos:", err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const startCamera = async () => {
    if (!scanner) return;
    setErrorMsg('');
    try {
      setScanActive(true);
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.75);
            return { width: size, height: size };
          }
        },
        async (decodedText) => {
          // Guardar lectura
          if (decodedText) {
            await handleRegisterAlu(decodedText);
          }
        },
        () => {
          // Silencioso en errores de escaneo comunes
        }
      );
    } catch (err) {
      console.error("Error al encender cámara:", err);
      setErrorMsg("No se pudo iniciar la cámara. Verifica los permisos.");
      setScanActive(false);
    }
  };

  const stopCamera = async () => {
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.error("Error al detener escáner:", err);
    } finally {
      setScanActive(false);
    }
  };

  const handleRegisterAlu = async (barcodeVal) => {
    if (!tiendaSeleccionada) {
      setErrorMsg("Debe seleccionar una tienda primero.");
      return;
    }
    const cleanVal = String(barcodeVal).trim();
    if (!cleanVal) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const colaboradorNombre = `${user?.user_metadata?.nombres || ''} ${user?.user_metadata?.apellidos || ''}`.trim() || 'Usuario Web';
      // Registrar devolución en base de datos
      const { error } = await supabase
        .from('registro_devoluciones')
        .insert({
          tienda_id: tiendaSeleccionada.id,
          fecha: fecha,
          alu: cleanVal,
          tipo: tipo,
          colaborador: colaboradorNombre
        });

      if (error) throw error;

      setSuccessMsg(`¡ALU ${cleanVal} registrado con éxito!`);
      setAlu('');
      fetchTodayScans();
    } catch (err) {
      console.error("Error al registrar calzado:", err);
      setErrorMsg(`Error al registrar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScan = async (id) => {
    if (!confirm("¿Está seguro de eliminar este registro?")) return;
    try {
      const { error } = await supabase
        .from('registro_devoluciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTodayScans();
    } catch (err) {
      console.error("Error al eliminar registro:", err);
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* CABECERA SIMPLIFICADA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className={`text-xl font-title font-black tracking-wider flex items-center gap-2.5 ${tc.textPrimary}`}>
            <Camera className="w-6 h-6 text-amber-500" />
            REGISTRAR DEVOLUCIONES
          </h3>
          <p className={`text-xs mt-0.5 ${tc.textMuted}`}>
            Escanea o ingresa manualmente calzado devuelto o garantías por las cajeras y jefes de tienda.
          </p>
        </div>
      </div>

      {/* DETALLE TIENDA / SELECTOR */}
      {!tiendaSeleccionada ? (
        <div className={`p-6 mb-6 rounded-2xl border ${tc.cardBg} border-red-500/20`} style={tc.cardBgStyle}>
          <div className="flex items-center gap-3 text-amber-500 mb-3">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="font-extrabold text-sm">Se requiere seleccionar una tienda</h2>
          </div>
          <p className={`text-xs mb-4 ${tc.textMuted}`}>
            Selecciona la tienda donde te encuentras laborando para poder subir los registros.
          </p>
          <select
            onChange={(e) => {
              const selected = tiendas.find(t => t.id === e.target.value);
              if (selected) seleccionarTienda(selected);
            }}
            className="w-full p-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold focus:outline-none"
          >
            <option value="">-- SELECCIONAR TIENDA --</option>
            {tiendas.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className={`p-4 mb-6 rounded-2xl border ${tc.cardBg} border-slate-800/80 flex flex-wrap items-center justify-between gap-3`} style={tc.cardBgStyle}>
          <div className="flex items-center gap-2.5">
            <Store className="w-5 h-5 text-[#005cff]" />
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider block ${tc.textMuted}`}>Tienda Activa</span>
              <span className={`text-xs font-black uppercase text-white`}>{tiendaSeleccionada.nombre}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => {
                  const newFecha = e.target.value;
                  setFecha(newFecha);
                  if (onFechaChange) {
                    onFechaChange(newFecha);
                  }
                }}
                className="bg-slate-900 border border-slate-850 px-2.5 py-1 text-xs text-white rounded-xl font-bold focus:outline-none"
              />
            </div>
            {tiendas.length > 1 && (
              <select
                value={tiendaSeleccionada.id}
                onChange={(e) => {
                  const selected = tiendas.find(t => t.id === e.target.value);
                  if (selected) seleccionarTienda(selected);
                }}
                className="p-1 bg-slate-900 border border-slate-800 text-xs text-white rounded-xl font-bold focus:outline-none"
              >
                {tiendas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre.split(' ')[0]}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {tiendaSeleccionada && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SECCIÓN ESCÁNER */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* VISTA DE CÁMARA */}
            <div className={`p-5 rounded-3xl border border-slate-800/80 flex flex-col ${tc.cardBg}`} style={tc.cardBgStyle}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black tracking-wider text-slate-400 uppercase">Cámara Celular</span>
                {scanActive && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-extrabold uppercase animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Escaneando
                  </span>
                )}
              </div>

              {/* Contenedor del scanner */}
              <div className="relative aspect-square w-full max-w-sm mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/60 flex items-center justify-center">
                <div id="reader" className="w-full h-full absolute inset-0 text-white"></div>
                
                {!scanActive && (
                  <div className="z-10 text-center p-6 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-90 transition-all cursor-pointer"
                    >
                      Encender Cámara
                    </button>
                  </div>
                )}

                {scanActive && (
                  <div className="absolute bottom-4 right-4 z-10">
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-red-600/90 border border-red-500/20 text-white rounded-xl font-bold text-xs uppercase cursor-pointer hover:bg-red-700"
                    >
                      Apagar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* FORMULARIO MANUAL */}
            <div className={`p-5 rounded-3xl border border-slate-800/80 ${tc.cardBg}`} style={tc.cardBgStyle}>
              <span className="text-xs font-black tracking-wider text-slate-400 uppercase block mb-4">Registro Manual o Confirmación</span>

              {/* TIPO SELECTOR */}
              <div className="mb-4">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-2">Clasificación</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipo('Ingreso')}
                    className={`py-3 rounded-2xl font-black text-xs uppercase border transition-all cursor-pointer ${
                      tipo === 'Ingreso'
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-sm'
                        : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    Ingreso (Devolución)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('Garantía')}
                    className={`py-3 rounded-2xl font-black text-xs uppercase border transition-all cursor-pointer ${
                      tipo === 'Garantía'
                        ? 'bg-purple-950/40 border-purple-500/50 text-purple-400 shadow-sm'
                        : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    Garantía
                  </button>
                </div>
              </div>

              {/* INPUT ALU */}
              <div className="mb-5">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1.5">Código ALU del Zapato</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={alu}
                    onChange={(e) => setAlu(e.target.value)}
                    placeholder="Ej. 1028372"
                    className="flex-1 p-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleRegisterAlu(alu)}
                    disabled={loading || !alu.trim()}
                    className="px-4 bg-[#005cff] text-white rounded-xl font-bold flex items-center justify-center cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* ALERTAS */}
              {successMsg && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}
            </div>

          </div>

          {/* SECCIÓN HISTORIAL */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className={`p-5 rounded-3xl border border-slate-800/80 flex-1 flex flex-col ${tc.cardBg}`} style={tc.cardBgStyle}>
              
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-xs font-black tracking-wider text-slate-400 uppercase block">Escaneos de Hoy</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Mostrando registros subidos para la fecha seleccionada</span>
                </div>
                <button
                  onClick={fetchTodayScans}
                  className="p-2 text-slate-400 hover:text-white transition-all rounded-lg cursor-pointer"
                  title="Refrescar lista"
                >
                  <RefreshCw className={`w-4 h-4 ${fetchingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* LISTADO DE ITEMS ESCANEADOS */}
              <div className="flex-1 overflow-y-auto max-h-[460px] space-y-2.5 pr-1">
                {fetchingHistory ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                    <span className="text-xs">Cargando escaneos...</span>
                  </div>
                ) : scannedItems.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-800/60 rounded-2xl text-slate-500">
                    <QrCode className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                    <p className="text-xs font-bold">No has realizado escaneos el día de hoy.</p>
                    <p className="text-[10px] text-slate-550 mt-1">Escanea los calzados de devoluciones para verlos aquí.</p>
                  </div>
                ) : (
                  scannedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-800 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-black text-white tracking-wider font-mono">
                            {item.alu}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wide border ${
                            item.tipo === 'Garantía'
                              ? 'bg-purple-950/30 border-purple-500/20 text-purple-400'
                              : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                          }`}>
                            {item.tipo}
                          </span>
                          {item.procesado && (
                            <span className="px-2 py-0.5 rounded-full font-black text-[9px] uppercase bg-slate-800 border border-slate-700 text-slate-400">
                              Procesado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                          <span className="font-extrabold truncate max-w-[120px]">{item.colaborador}</span>
                          <span>•</span>
                          <span>{new Date(item.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      
                      {!item.procesado && (
                        <button
                          onClick={() => handleDeleteScan(item.id)}
                          className="p-2 text-red-400 hover:text-red-500 bg-red-950/20 hover:bg-red-950/40 border border-red-500/10 rounded-xl cursor-pointer transition-all"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
