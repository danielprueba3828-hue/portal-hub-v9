import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PoliticaPrivacidadModal() {
  const { user, acceptPolicy } = useAuthStore();
  const { theme } = useThemeStore();
  const isLight = theme === 'clasico';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Si el usuario ya acepto la politica o no ha iniciado sesion, no mostrar el modal
  if (!user || user.user_metadata?.politica_aceptada === true) {
    return null;
  }

  const nombreUsuario = user.user_metadata?.nombres 
    ? `${user.user_metadata.nombres} ${user.user_metadata.apellidos || ''}`.trim()
    : 'Colaborador';

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      const ok = await acceptPolicy();
      if (!ok) {
        setError('Ocurrió un inconveniente al guardar tu consentimiento. Inténtalo nuevamente.');
      }
    } catch (err) {
      console.error('Error al aceptar políticas:', err);
      setError('Error de conexión al registrar las políticas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overscroll-none touch-none">
      <div 
        className={`w-full max-w-lg rounded-3xl border p-6 sm:p-7 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0a1120] border-slate-800 text-white'
        }`}
      >
        {/* Header con Icono de Seguridad */}
        <div className="flex items-center gap-3 border-b pb-4 border-slate-800/60">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
              Bienvenido a PORTAL HUB V9
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
              Políticas de Privacidad y Tratamiento de Datos
            </h2>
          </div>
        </div>

        {/* Saludo Personalizado */}
        <div className={`p-3 rounded-2xl border text-xs font-semibold ${
          isLight ? 'bg-blue-50/80 border-blue-200 text-blue-900' : 'bg-blue-950/30 border-blue-500/30 text-blue-200'
        }`}>
          👋 Hola, <strong className="font-black">{nombreUsuario}</strong>. Para continuar utilizando la plataforma, por favor revisa y acepta nuestras políticas de confidencialidad y uso de datos institucionales.
        </div>

        {/* Términos y Cláusulas Claras */}
        <div className={`p-4 rounded-2xl border text-xs space-y-3.5 leading-relaxed max-h-56 overflow-y-auto ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-lg bg-blue-500/15 text-blue-400 shrink-0 mt-0.5">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className={`block text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                1. Uso Exclusivo Laboral e Informativo
              </strong>
              <p className="text-[11px] mt-0.5 text-slate-400 leading-relaxed">
                Tus datos de usuario, cédula, horarios, registros de actividades, reportes y métricas se utilizan únicamente con fines operativos, informativos y de coordinación interna de la tienda.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className={`block text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                2. Confidencialidad y Seguridad
              </strong>
              <p className="text-[11px] mt-0.5 text-slate-400 leading-relaxed">
                Toda la información contenida en este portal es estrictamente confidencial. La empresa garantiza la custodia y privacidad de tus datos, los cuales no serán transferidos ni compartidos con terceros ajenos a la operación.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-lg bg-purple-500/15 text-purple-400 shrink-0 mt-0.5">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className={`block text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                3. Compromiso y Responsabilidad
              </strong>
              <p className="text-[11px] mt-0.5 text-slate-400 leading-relaxed">
                Al ingresar con tu credencial personal, te comprometes a hacer un uso responsable de las bitácoras, comunicados, reportes y registros que emitas en la plataforma.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Botón de Aceptación */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>He leído y Acepto las Políticas de Privacidad</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            Al hacer clic confirmas tu conformidad para el uso de PORTAL HUB V9.
          </p>
        </div>

      </div>
    </div>
  );
}
