import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore, getThemeClasses } from '../../store/themeStore';
import { getEmployeeTheme } from '../../utils/themeHelper';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AlertCircle, Lock, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useMetasStore } from '../../store/metasStore';
import { useHorarioStore } from '../../store/horarioStore';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function Layout() {
  const { user, session, logout, checkSession, loading, aceptarPolitica } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const politicaAceptada = user?.user_metadata?.politica_aceptada === true;
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  const handleAcceptPolicy = async () => {
    if (!checkboxChecked) return;
    setAccepting(true);
    setAcceptError('');
    const success = await aceptarPolitica();
    setAccepting(false);
    if (!success) {
      setAcceptError('Hubo un problema al registrar tu consentimiento. Por favor, intenta de nuevo.');
    }
  };

  const { theme: activeTheme } = useThemeStore();
  const cargo = user?.user_metadata?.cargo || 'Asesor de Ventas';
  const employeeTheme = getEmployeeTheme(cargo, user?.user_metadata?.nombres || '');
  const tc = getThemeClasses(activeTheme, employeeTheme);

  // Desregistrar Service Workers antiguos, preservar sw-pwa.js
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          const scriptURL = registration.active?.scriptURL || '';
          if (!scriptURL.includes('sw-pwa.js')) {
            registration.unregister().then((success) => {
              if (success) console.log('Antiguo Service Worker desregistrado.');
            });
          }
        }
      });
    }
  }, []);

  // Validar sesión al cargar
  useEffect(() => {
    const check = async () => {
      await checkSession();
      setIsCheckingSession(false);
    };
    check();
  }, [checkSession]);

  // Sincronizar clase 'dark' del DOM con el tema store
  useEffect(() => {
    if (activeTheme === 'oscuro') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [activeTheme]);

  // Auto-logout de 30 minutos por inactividad
  useEffect(() => {
    if (!session) return;
    let inactivityTimer;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        alert("🔒 Su sesión ha expirado tras 30 minutos de inactividad. Ingrese nuevamente.");
        logout();
      }, 30 * 60 * 1000);
    };
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [session, logout]);

  const [activeToast, setActiveToast] = useState(null);

  const showToast = (title, body, url) => {
    setActiveToast({ title, body, url });
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch {
      /* ignore AudioContext failure */
    }
    setTimeout(() => {
      setActiveToast(prev => prev && prev.title === title ? null : prev);
    }, 6000);
  };

  // Solicitar permiso para notificaciones locales (Web Browser y Android APK Native)
  useEffect(() => {
    if (session) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      try {
        LocalNotifications.requestPermissions().then(result => {
          if (result.display === 'granted') {
            LocalNotifications.createChannel({
              id: 'portal_hub_notifications',
              name: 'Notificaciones Portal Hub',
              description: 'Alertas de horarios, bitácoras, metas y bodega',
              importance: 5,
              visibility: 1,
              vibration: true
            });
          }
        });
      } catch (e) {
        /* ignore non-capacitor env */
      }
    }
  }, [session]);

  const fetchNotifications = useNotificationStore(state => state.fetchNotifications);

  // Cargar notificaciones al montar/loguear
  useEffect(() => {
    if (session && user?.user_metadata?.cedula) {
      fetchNotifications(user.user_metadata.cedula);
    }
  }, [session, user, fetchNotifications]);

  // Suscribirse a cambios en tiempo real para Notificaciones de la BD
  useEffect(() => {
    if (!session || !user) return;

    const myCedula = user.user_metadata?.cedula;
    if (!myCedula) return;
    const myRol = user.user_metadata?.rol || 'empleado';

    const notifChannel = supabase
      .channel(`realtime:notificaciones:${myCedula}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        (payload) => {
          const newNotif = payload.new;
          if (newNotif.usuario_cedula !== myCedula) return;

          // Añadir al store
          useNotificationStore.getState().addNotification(newNotif);

          // Disparar Notificación Nativa Android vía Capacitor LocalNotifications
          try {
            LocalNotifications.schedule({
              notifications: [
                {
                  title: newNotif.titulo || '🔔 Portal Hub',
                  body: newNotif.mensaje || '',
                  id: Math.floor(Math.random() * 1000000),
                  schedule: { at: new Date(Date.now() + 100) },
                  channelId: 'portal_hub_notifications'
                }
              ]
            });
          } catch (nativeErr) {
            console.log("LocalNotifications error in web environment:", nativeErr);
          }

          // Mostrar push local Web si tiene permisos
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(newNotif.titulo, {
              body: newNotif.mensaje,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              requireInteraction: true
            });
            notification.onclick = () => {
              window.focus();
              let redirectPath = '/';
              if (newNotif.tipo === 'horario') redirectPath = '/calendario';
              else if (newNotif.tipo === 'bitacora') redirectPath = '/bitacora/admin';
              else if (newNotif.tipo === 'bodega') redirectPath = myRol === 'admin' || myRol === 'supervisor' ? '/bodega/admin' : '/bodega/reporte';
              else if (newNotif.tipo === 'meta') redirectPath = myRol === 'admin' || myRol === 'supervisor' ? '/metas/admin' : '/metas/asesor';
              window.location.href = redirectPath;
            };
          }

          // Mostrar Toast en la página
          let toastPath = '/';
          if (newNotif.tipo === 'horario') toastPath = '/calendario';
          else if (newNotif.tipo === 'bitacora') toastPath = '/bitacora/admin';
          else if (newNotif.tipo === 'bodega') toastPath = myRol === 'admin' || myRol === 'supervisor' ? '/bodega/admin' : '/bodega/reporte';
          else if (newNotif.tipo === 'meta') toastPath = myRol === 'admin' || myRol === 'supervisor' ? '/metas/admin' : '/metas/asesor';

          showToast(newNotif.titulo, newNotif.mensaje, toastPath);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [session, user]);

  // Suscribirse a cambios en tiempo real de datos generales de la app (en vivo)
  useEffect(() => {
    if (!session || !user) return;

    const dataChannel = supabase
      .channel('realtime:app_data_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'metas' },
        () => {
          useMetasStore.getState().fetchMetas();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tienda_stats' },
        () => {
          useMetasStore.getState().fetchMetas();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'turnos' },
        () => {
          useHorarioStore.getState().fetchTurnos();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitudes_permiso' },
        () => {
          useHorarioStore.getState().fetchSolicitudes();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'empleados' },
        () => {
          useHorarioStore.getState().fetchEmpleados();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dataChannel);
    };
  }, [session, user]);

  if (loading || isCheckingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-marathon-gray space-y-4">
        <div className="w-12 h-12 border-4 border-marathon-medium border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-marathon-deep">Cargando Portal de Horarios...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!politicaAceptada) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020D20] via-[#081229] to-[#010816] p-4 relative overflow-hidden font-sans text-slate-200">
        {/* Orbes brillantes decorativos */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#004BCA]/10 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#E30613]/8 blur-[150px] pointer-events-none"></div>

        <div className="w-full max-w-2xl bg-[#0c1427]/60 backdrop-blur-xl border border-slate-800/80 rounded-[32px] p-8 md:p-10 shadow-2xl flex flex-col space-y-6 z-10 animate-fade-in max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex p-3.5 bg-[#004BCA]/15 border border-[#004BCA]/25 rounded-2xl mb-4 text-[#005cff]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase mb-2">
              ¡Te damos la bienvenida!
            </h1>
            <p className="text-xs text-slate-450 font-black uppercase tracking-widest">
              Protección e Información Personal
            </p>
          </div>

          {/* Saludo Personalizado */}
          <div className="bg-[#004BCA]/10 border border-[#004BCA]/20 p-4 rounded-2xl flex items-center space-x-3 text-slate-200 text-xs md:text-sm font-semibold">
            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 animate-pulse" />
            <span>
              Hola, <strong className="text-white uppercase">{user?.user_metadata?.nombres || 'Colaborador'}</strong>. Tu cuenta está activa. Antes de comenzar a gestionar tus horarios y metas, necesitamos alinearnos con el uso seguro de tu información.
            </span>
          </div>

          {/* Cuerpo de Políticas */}
          <div className="space-y-4 text-left overflow-y-auto pr-2 bg-[#050b18]/65 border border-slate-900 rounded-2xl p-5 md:p-6 text-xs text-slate-350 leading-relaxed max-h-[30vh]">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center space-x-2 mb-2">
              <Lock className="w-3.5 h-3.5 text-[#005cff]" />
              <span>DECLARACIÓN DE CONSENTIMIENTO Y PRIVACIDAD</span>
            </h3>
            <p className="mb-3">
              De conformidad con lo dispuesto en la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong> de la República del Ecuador, la empresa se compromete a velar por la privacidad e integridad de tu información.
            </p>
            <p className="mb-3">
              Al hacer uso de esta plataforma, tu información personal (que incluye nombres completos, cédula, correo, teléfono y asignación de local) será tratada de manera estrictamente confidencial.
            </p>
            <h4 className="font-extrabold text-slate-200 mb-1.5 uppercase text-[10px]">¿Para qué utilizamos tu información?</h4>
            <ul className="list-disc pl-4 space-y-1.5 mb-3">
              <li><strong>Gestión Operativa:</strong> Elaboración, control y visualización de horarios de trabajo diarios y semanales.</li>
              <li><strong>Metas Comerciales:</strong> Asignación, seguimiento y evaluación del cumplimiento de metas de venta e indicadores de tu local.</li>
              <li><strong>Auditoría Interna:</strong> Registro de logs de accesos y auditorías operativas internas para velar por la seguridad de la información.</li>
            </ul>
            <h4 className="font-extrabold text-slate-200 mb-1.5 uppercase text-[10px]">Tus derechos y garantías:</h4>
            <p>
              Garantizamos que tus datos no serán compartidos con terceras partes ajenas a la operación de Marathon Sports, Taff y Explorer. Cuentas con la facultad de ejercer tus derechos de acceso, rectificación y actualización de tus datos en cualquier momento.
            </p>
          </div>

          {/* Error de Aceptación */}
          {acceptError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{acceptError}</span>
            </div>
          )}

          {/* Casilla de Consentimiento */}
          <label className="flex items-start space-x-3 text-left p-3.5 bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-2xl cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={checkboxChecked}
              onChange={(e) => setCheckboxChecked(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-slate-800 bg-[#050b18]/65 text-[#004BCA] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[11px] md:text-xs font-semibold text-slate-300 leading-tight">
              He leído la declaración y otorgo mi <strong>consentimiento de forma libre y expresa</strong> para que traten mi información personal laboral según lo detallado arriba.
            </span>
          </label>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => logout()}
              className="w-full sm:w-1/3 px-5 py-3.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-350 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
            <button
              onClick={handleAcceptPolicy}
              disabled={!checkboxChecked || accepting}
              className={`w-full sm:w-2/3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                checkboxChecked && !accepting
                  ? 'bg-[#004BCA] hover:bg-[#005cff] text-white shadow-[0_0_15px_rgba(0,92,255,0.45)]'
                  : 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed'
              }`}
            >
              {accepting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <span>Aceptar y Continuar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex overflow-x-hidden transition-colors duration-300 ${tc.mainBg || 'bg-marathon-gray'}`} style={tc.mainBgStyle}>
      {/* Toast Notificación Emergente */}
      {activeToast && (
        <div 
          onClick={() => {
            window.location.href = activeToast.url;
            setActiveToast(null);
          }}
          className="fixed top-4 right-4 md:right-8 z-50 max-w-sm w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-marathon-medium/20 rounded-3xl p-5 shadow-2xl flex items-start gap-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 animate-fade-in-up border-l-4 border-l-marathon-medium"
        >
          <div className="p-2.5 bg-marathon-light dark:bg-slate-800 rounded-2xl text-marathon-medium">
            {activeToast.title.includes('Bitácora') ? '📝' : '📦'}
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-black font-title text-slate-800 dark:text-white leading-tight">
              {activeToast.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal">
              {activeToast.body}
            </p>
            <span className="text-[10px] text-marathon-medium font-bold uppercase tracking-wider block pt-1">
              Ver detalles →
            </span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveToast(null);
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ❌
          </button>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Backdrop móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-15 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Contenido Principal */}
      <div className={`flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
