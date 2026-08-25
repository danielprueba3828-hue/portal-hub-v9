import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import Navbar from '../components/layout/Navbar';
import { 
  getN8nConfig, 
  saveN8nConfig, 
  getN8nLogs, 
  sendN8nEvent, 
  testN8nConnection,
  generateN8nWorkflowTemplate
} from '../services/n8nService';
import { 
  Cpu, 
  Zap, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ExternalLink, 
  Settings, 
  RefreshCw, 
  Check, 
  Key, 
  Link as LinkIcon, 
  Sparkles, 
  Target, 
  ClipboardList, 
  Calendar, 
  ShieldCheck,
  Terminal,
  Activity
} from 'lucide-react';

export default function AutomatizacionesN8N() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const isLight = theme === 'clasico';

  const [config, setConfig] = useState(getN8nConfig());
  const [logs, setLogs] = useState(getN8nLogs());
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'simulator' | 'logs'

  const showFeedback = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveN8nConfig(config);
      showFeedback('¡Configuración de n8n guardada y sincronizada exitosamente!');
    } catch (err) {
      showFeedback('Error al guardar configuración: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.generalWebhookUrl) {
      showFeedback('Ingresa la URL del webhook principal para probar.', 'error');
      return;
    }
    setTesting(true);
    try {
      const res = await testN8nConnection(config.generalWebhookUrl, config.secretToken);
      showFeedback(`¡Conexión exitosa con n8n! (Status ${res.status})`);
      setLogs(getN8nLogs());
    } catch (err) {
      showFeedback('Prueba enviada: ' + err.message, 'error');
      setLogs(getN8nLogs());
    } finally {
      setTesting(false);
    }
  };

  const handleSimulateEvent = async (eventType) => {
    showFeedback(`Disparando evento "${eventType}" a n8n...`);
    let sampleData = {};

    if (eventType === 'METAS_SINCRONIZADAS') {
      sampleData = {
        mes: 'Agosto 2026',
        total_tienda: 326079.00,
        meta_dia_24: 5217.00,
        periodo_activo: 'Período 3 (17 - 24 Ago)',
        asesores_actualizados: 10
      };
    } else if (eventType === 'PDF_REPORTE_PUBLICADO') {
      sampleData = {
        documento_nombre: 'Reporte_Metas_Agosto_2026.pdf',
        publicado_por: user?.user_metadata?.nombres || 'Jefatura',
        url: 'https://aqknspjscmyvdabzgmwz.supabase.co/storage/v1/object/public/evidencias-jefes/metas-pdf/reporte_oficial.pdf'
      };
    } else if (eventType === 'BITACORA_INCIDENCIA') {
      sampleData = {
        tipo: 'Recepción de Mercadería & Calzado',
        titulo: 'Cuadre de Zapatos y Novedades de Bodega',
        descripcion: 'Se completó la verificación física de bodega sin faltantes.',
        fotos_evidencias: 3,
        zona: 'BODEGA'
      };
    } else if (eventType === 'HORARIO_ACTUALIZADO') {
      sampleData = {
        semana: '24 al 31 de Agosto',
        colaboradores_programados: 18,
        turnos_asignados: 126
      };
    }

    await sendN8nEvent(eventType, sampleData, user?.user_metadata);
    setLogs(getN8nLogs());
    showFeedback(`¡Evento "${eventType}" enviado con éxito a n8n!`);
  };

  const handleDownloadTemplate = () => {
    const template = generateN8nWorkflowTemplate();
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Marathon_MCP1_n8n_Workflows.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback('¡Plantilla de Flujo JSON de n8n descargada!');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isLight ? 'bg-slate-100/90 text-slate-900' : 'bg-[#060b17] text-white'
    }`}>
      
      {/* Navbar Superior */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

        {/* Header Principal */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl sm:text-3xl font-title font-black uppercase tracking-tight ${
                  isLight ? 'text-slate-950' : 'text-white'
                }`}>
                  Automatizaciones n8n
                </h1>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-400" />
                  Webhooks Activos
                </span>
              </div>
              <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Conexión y disparo de eventos en tiempo real con n8n para WhatsApp, Telegram, Correo y reportes automáticos.
              </p>
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-500/25 transition active:scale-95 cursor-pointer"
              title="Descargar archivo JSON listo para importar en tu n8n"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Template n8n (JSON)</span>
            </button>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'config'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración de Webhooks</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Simulador de Eventos</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Historial de Envíos ({logs.length})</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* PESTAÑA 1: CONFIGURACIÓN DE WEBHOOKS                      */}
        {/* ========================================================= */}
        {activeTab === 'config' && (
          <div className="space-y-6 animate-fade-in">
            <form onSubmit={handleSave} className="space-y-6">
              
              <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/80 border-slate-800 text-white'
              }`}>
                
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-purple-500" />
                      Endpoints de Webhook en n8n
                    </h2>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Introduce las URLs de tus nodos Webhook de n8n para recibir los eventos de Marathon Sports MCP1.
                    </p>
                  </div>

                  {/* Switch Habilitar */}
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-bold uppercase">Automatizaciones Activas</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Webhook General */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      🔗 URL de Webhook General (Catch-all)
                    </label>
                    <input
                      type="url"
                      placeholder="https://tu-n8n-server.com/webhook/portal-mcp1-events"
                      value={config.generalWebhookUrl}
                      onChange={(e) => setConfig({ ...config, generalWebhookUrl: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono transition ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' 
                          : 'bg-slate-950/70 border-slate-700 text-white'
                      }`}
                    />
                    <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Recibe todos los eventos unificados si no se configuran URLs específicas por módulo.
                    </span>
                  </div>

                  {/* Webhook Metas */}
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      🎯 Webhook de Metas & Ventas (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://tu-n8n.com/webhook/metas-mcp1"
                      value={config.metasWebhookUrl}
                      onChange={(e) => setConfig({ ...config, metasWebhookUrl: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono transition ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' 
                          : 'bg-slate-950/70 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  {/* Webhook Bitácoras */}
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      📋 Webhook de Bitácoras & Incidencias
                    </label>
                    <input
                      type="url"
                      placeholder="https://tu-n8n.com/webhook/bitacoras-mcp1"
                      value={config.bitacorasWebhookUrl}
                      onChange={(e) => setConfig({ ...config, bitacorasWebhookUrl: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono transition ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' 
                          : 'bg-slate-950/70 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  {/* Webhook Horarios */}
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      📅 Webhook de Horarios & Turnos
                    </label>
                    <input
                      type="url"
                      placeholder="https://tu-n8n.com/webhook/horarios-mcp1"
                      value={config.horariosWebhookUrl}
                      onChange={(e) => setConfig({ ...config, horariosWebhookUrl: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono transition ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' 
                          : 'bg-slate-950/70 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  {/* Secret Token */}
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      🔑 Token Secreto de Seguridad (Header X-Marathon-Token)
                    </label>
                    <input
                      type="password"
                      placeholder="marathon_secret_token_mcp1"
                      value={config.secretToken}
                      onChange={(e) => setConfig({ ...config, secretToken: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono transition ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' 
                          : 'bg-slate-950/70 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                </div>

                {/* Botones de Acción */}
                <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 border transition cursor-pointer disabled:opacity-50 ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                    }`}
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                        <span>Probando Conexión...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-purple-500" />
                        <span>Probar Conexión con n8n</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Guardar Configuración</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 2: SIMULADOR DE EVENTOS EN VIVO                   */}
        {/* ========================================================= */}
        {activeTab === 'simulator' && (
          <div className="space-y-6 animate-fade-in">
            
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/80 border-slate-800 text-white'
            }`}>
              <h2 className="text-base font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                Disparar Eventos de Prueba hacia n8n
              </h2>
              <p className={`text-xs mb-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Prueba en vivo cómo viaja la estructura de datos a tus nodos de n8n para WhatsApp, Telegram o correo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Evento Metas */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
                }`}>
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-3">
                      <Target className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      METAS_SINCRONIZADAS
                    </h3>
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Envía objetivos diarios y mensuales de tienda y asesores.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSimulateEvent('METAS_SINCRONIZADAS')}
                    className="mt-4 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar Evento</span>
                  </button>
                </div>

                {/* Evento PDF */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isLight ? 'bg-rose-50/60 border-rose-200' : 'bg-rose-950/20 border-rose-500/30'
                }`}>
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center mb-3">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                      PDF_REPORTE_PUBLICADO
                    </h3>
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Notifica nuevo documento PDF oficial con enlace de descarga.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSimulateEvent('PDF_REPORTE_PUBLICADO')}
                    className="mt-4 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar Evento</span>
                  </button>
                </div>

                {/* Evento Bitácora */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isLight ? 'bg-blue-50/60 border-blue-200' : 'bg-blue-950/20 border-blue-500/30'
                }`}>
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center mb-3">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-400">
                      BITACORA_INCIDENCIA
                    </h3>
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Reporta novedades operativas o cuadres de calzado con evidencias.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSimulateEvent('BITACORA_INCIDENCIA')}
                    className="mt-4 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar Evento</span>
                  </button>
                </div>

                {/* Evento Horario */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-950/20 border-purple-500/30'
                }`}>
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center mb-3">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-purple-400">
                      HORARIO_ACTUALIZADO
                    </h3>
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Envía recordatorios de turnos semanales a colaboradores.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSimulateEvent('HORARIO_ACTUALIZADO')}
                    className="mt-4 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar Evento</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 3: HISTORIAL DE ENVÍOS (LOGS)                     */}
        {/* ========================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fade-in">
            
            <div className={`p-6 rounded-3xl border shadow-xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/80 border-slate-800 text-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Registro de Actividad de Webhooks
                </h2>
                <button
                  onClick={() => {
                    localStorage.removeItem('marathon_n8n_logs');
                    setLogs([]);
                    showFeedback('Historial de logs limpiado.');
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Limpiar Historial
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No hay eventos registrados aún. Utiliza el simulador o realiza una acción en el portal para generar registros.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
                        <th className="p-3">Evento</th>
                        <th className="p-3">Fecha / Hora</th>
                        <th className="p-3">Destino</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                      {logs.map((log) => (
                        <tr key={log.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                          <td className="p-3 font-bold text-purple-400">
                            {log.event}
                          </td>
                          <td className="p-3 text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString('es-EC')}
                          </td>
                          <td className="p-3 truncate max-w-[200px] text-slate-500">
                            {log.targetUrl}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {log.status} {log.statusCode ? `(${log.statusCode})` : ''}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 font-bold text-[10px] transition cursor-pointer"
                            >
                              Ver JSON
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Modal de Detalle JSON */}
      {selectedLog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/80 animate-fade-in"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className={`w-full max-w-2xl max-h-[85vh] rounded-3xl border p-6 flex flex-col shadow-2xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black font-mono text-purple-400">
                Payload JSON: {selectedLog.event}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                ✕ Cerrar
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 leading-relaxed">
              {JSON.stringify(selectedLog.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
