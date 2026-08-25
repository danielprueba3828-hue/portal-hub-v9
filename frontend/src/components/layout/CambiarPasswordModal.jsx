import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Lock, Key, CheckCircle2, AlertCircle, X, Eye, EyeOff } from 'lucide-react';

export default function CambiarPasswordModal({ isOpen, onClose, isForceChange = false }) {
  const { user, changePassword } = useAuthStore();
  const { theme } = useThemeStore();
  const isLight = theme === 'clasico';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const nombreUsuario = user?.user_metadata?.nombres 
    ? `${user.user_metadata.nombres} ${user.user_metadata.apellidos || ''}`.trim()
    : 'Colaborador';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanNew = newPassword.trim();
    const cleanConf = confirmPassword.trim();

    if (!cleanNew) {
      setError('Por favor ingresa tu nueva contraseña.');
      return;
    }

    if (cleanNew.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (cleanNew !== cleanConf) {
      setError('Las contraseñas no coinciden. Verifícalas por favor.');
      return;
    }

    setLoading(true);
    try {
      const ok = await changePassword(cleanNew);
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setNewPassword('');
          setConfirmPassword('');
          if (onClose) onClose();
        }, 1800);
      } else {
        setError('No se pudo actualizar la contraseña. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('Error cambiando contraseña:', err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleOmitir = () => {
    sessionStorage.setItem(`omit_password_change_${user?.user_metadata?.cedula}`, 'true');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overscroll-none touch-none">
      <div 
        className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0a1120] border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b pb-3.5 border-slate-800/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                {isForceChange ? 'Personalizar tu Contraseña' : 'Cambiar mi Contraseña'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {user?.user_metadata?.cedula ? `Usuario: ${user.user_metadata.cedula}` : 'Seguridad de la Cuenta'}
              </p>
            </div>
          </div>

          {!isForceChange && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
                isLight ? 'hover:bg-slate-100 border-slate-200 text-slate-600' : 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mensaje descriptivo */}
        <div className={`p-3 rounded-2xl border text-xs leading-relaxed ${
          isLight ? 'bg-purple-50/70 border-purple-200 text-purple-950' : 'bg-purple-950/30 border-purple-500/30 text-purple-200'
        }`}>
          {isForceChange ? (
            <span>
              👋 <strong>{nombreUsuario}</strong>, puedes crear una contraseña personal para acceder más fácil y seguro. Si prefieres hacerlo más tarde, puedes omitir este paso.
            </span>
          ) : (
            <span>
              Ingresa tu nueva contraseña para actualizar el acceso de tu cuenta.
            </span>
          )}
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Alerta de Éxito */}
        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>¡Contraseña actualizada exitosamente!</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva clave"
                className={`w-full pl-10 pr-10 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500 focus:bg-white'
                    : 'bg-slate-950/70 border-slate-700 text-white focus:border-purple-500 focus:bg-slate-950'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu nueva clave"
                className={`w-full pl-10 pr-10 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500 focus:bg-white'
                    : 'bg-slate-950/70 border-slate-700 text-white focus:border-purple-500 focus:bg-slate-950'
                }`}
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Contraseña</span>
                </>
              )}
            </button>

            {isForceChange ? (
              <button
                type="button"
                onClick={handleOmitir}
                className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isLight 
                    ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Omitir por ahora
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isLight 
                    ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
