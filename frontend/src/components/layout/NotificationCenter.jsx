import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { supabase } from '../../lib/supabaseClient';
import { 
  Bell, 
  Check, 
  Calendar, 
  Tag, 
  Megaphone, 
  ClipboardCheck, 
  Warehouse, 
  Target, 
  FileText, 
  ExternalLink,
  CheckCheck,
  X
} from 'lucide-react';

export default function NotificationCenter() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const isLight = theme === 'clasico';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const myCedula = String(user?.user_metadata?.cedula || user?.cedula || '');
  const myCargo = (user?.user_metadata?.cargo || user?.cargo || '').toLowerCase();
  const myRol = (user?.user_metadata?.rol || user?.rol || '').toLowerCase();
  const myZona = (user?.user_metadata?.zona || user?.zona || '').toLowerCase();

  const isDirectivo = ['jefe', 'subjefe', 'tercer', 'supervisor', 'admin'].some(r => myCargo.includes(r) || myRol.includes(r));
  const isBodeguero = ['bodega', 'bodeguero'].some(r => myCargo.includes(r) || myZona.includes('bodega'));
  const isAsesor = ['asesor', 'ventas'].some(r => myCargo.includes(r) || myRol.includes(r)) && !isDirectivo;

  // Cargar Notificaciones
  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) throw error;

      // Filtrar según el rol del usuario
      const filtered = (data || []).filter(n => {
        if (n.usuario_cedula && n.usuario_cedula === myCedula) return true;
        if (!n.rol_destino || n.rol_destino === 'todos') return true;
        if (n.rol_destino === 'jefes' && isDirectivo) return true;
        if (n.rol_destino === 'bodegueros' && isBodeguero) return true;
        if (n.rol_destino === 'bodega_y_jefes' && (isBodeguero || isDirectivo)) return true;
        if (n.rol_destino === 'asesores' && (isAsesor || isDirectivo)) return true;
        return false;
      });

      setNotifications(filtered);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Escuchar notificaciones en tiempo real desde Supabase
    const channel = supabase
      .channel('realtime_notificaciones')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        (payload) => {
          const newNotif = payload.new;
          const appliesToMe = 
            (newNotif.usuario_cedula && newNotif.usuario_cedula === myCedula) ||
            (!newNotif.rol_destino || newNotif.rol_destino === 'todos') ||
            (newNotif.rol_destino === 'jefes' && isDirectivo) ||
            (newNotif.rol_destino === 'bodegueros' && isBodeguero) ||
            (newNotif.rol_destino === 'bodega_y_jefes' && (isBodeguero || isDirectivo)) ||
            (newNotif.rol_destino === 'asesores' && (isAsesor || isDirectivo));

          if (appliesToMe) {
            setNotifications(prev => [newNotif, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, myCedula, isDirectivo, isBodeguero, isAsesor]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.leido).length;

  const handleNotificationClick = async (notif) => {
    // Marcar como leída en BD
    if (!notif.leido) {
      try {
        await supabase
          .from('notificaciones')
          .update({ leido: true })
          .eq('id', notif.id);
        
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, leido: true } : n));
      } catch (err) {
        console.error('Error al marcar leída:', err);
      }
    }

    setIsOpen(false);

    // Navegar a la ruta destino
    if (notif.ruta_destino) {
      navigate(notif.ruta_destino);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.leido).map(n => n.id);
      if (unreadIds.length === 0) return;

      await supabase
        .from('notificaciones')
        .update({ leido: true })
        .in('id', unreadIds);

      setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
    }
  };

  // Helper de Iconos según el Tipo
  const getNotifIcon = (tipo) => {
    switch (tipo) {
      case 'horario':
        return <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 shrink-0"><Calendar className="w-4 h-4" /></div>;
      case 'promocion':
        return <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 shrink-0"><Tag className="w-4 h-4" /></div>;
      case 'comunicado':
        return <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0"><Megaphone className="w-4 h-4" /></div>;
      case 'bitacora_jefe':
        return <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0"><ClipboardCheck className="w-4 h-4" /></div>;
      case 'reporte_bodega':
        return <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0"><Warehouse className="w-4 h-4" /></div>;
      case 'metas':
        return <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0"><Target className="w-4 h-4" /></div>;
      case 'pdf_avance':
        return <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 shrink-0"><FileText className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 rounded-xl bg-slate-500/15 text-slate-400 shrink-0"><Bell className="w-4 h-4" /></div>;
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return 'Ayer';
      return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de la Campanita */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
          isOpen
            ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-500/15'
            : isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
        }`}
        title="Ver notificaciones y avisos"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-blue-400 animate-wiggle' : ''}`} />
        
        {/* Badge de No Leídas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white shadow-lg shadow-rose-600/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Flotante de Notificaciones */}
      {isOpen && (
        <div 
          className={`absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh] ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80' 
              : 'bg-[#0a1120] border-slate-800 text-white shadow-2xl shadow-black'
          }`}
        >
          {/* Header del Panel */}
          <div className="p-4 border-b border-slate-800/60 flex items-center justify-between gap-2 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Centro de Notificaciones</h4>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {unreadCount > 0 ? `${unreadCount} nuevas sin leer` : 'Estás al día con todos los avisos'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition active:scale-95"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Leídas</span>
              </button>
            )}
          </div>

          {/* Listado de Notificaciones */}
          <div className="divide-y divide-slate-800/40 overflow-y-auto flex-1 p-1">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Cargando avisos...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/40 flex items-center justify-center text-slate-500 mb-2">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold">No tienes notificaciones pendientes</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Te avisaremos cuando haya nuevos horarios, bitácoras o metas.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-2xl transition cursor-pointer flex items-start gap-3 relative group ${
                    !n.leido 
                      ? isLight ? 'bg-blue-50/70 hover:bg-blue-100/80' : 'bg-blue-950/20 hover:bg-blue-900/30' 
                      : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'
                  }`}
                >
                  {/* Icono del tipo */}
                  {getNotifIcon(n.tipo)}

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-black truncate block ${
                        !n.leido ? 'text-blue-400' : isLight ? 'text-slate-900' : 'text-slate-200'
                      }`}>
                        {n.titulo}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>

                    <p className={`text-[11px] mt-0.5 line-clamp-2 leading-relaxed ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      {n.mensaje}
                    </p>

                    {/* Botón de acción rápida */}
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-blue-400 opacity-80 group-hover:opacity-100">
                      <span>Toca para ver detalle</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                  </div>

                  {/* Indicador de no leído */}
                  {!n.leido && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-sm shadow-blue-500"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className={`p-2.5 border-t text-center text-[10px] font-bold ${
            isLight ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-slate-800/60 bg-slate-950/60 text-slate-400'
          }`}>
            PORTAL HUB V9 • Notificaciones en Tiempo Real
          </div>
        </div>
      )}
    </div>
  );
}
