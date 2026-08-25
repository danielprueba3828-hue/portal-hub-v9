import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useHorarioStore } from '../store/horarioStore';
import { useMetasStore } from '../store/metasStore';
import Navbar from '../components/layout/Navbar';
import PromosYAnunciosHub from '../components/dashboard/PromosYAnunciosHub';
import BitacorasPeerCheckinHub from '../components/dashboard/BitacorasPeerCheckinHub';
import { supabase } from '../lib/supabaseClient';
import { getCollaboratorMeta, DEFAULT_METAS_SEED } from '../services/metasExcelParser';
import { 
  Store, 
  Target, 
  Users, 
  Activity, 
  ShoppingBag, 
  ArrowRight, 
  Calendar, 
  Clock, 
  Sun, 
  Moon, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Coffee, 
  Sunrise, 
  Sunset,
  ClipboardCheck,
  Warehouse
} from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  "El cliente vino solo 'a mirar'... pero hoy sale con calzado de alta gama, camiseta y 3 pares de medias Marathon. ¡A romperla!",
  "Nivel de energía: 100% actitud, 0% excusas. ¡Hoy Portal Carapungo lidera la tabla de ventas!",
  "Si los atletas entrenan 4 años para 10 segundos de gloria, ¡tú puedes superar tu meta de hoy en este turno!",
  "Cada '¿Tiene en talla 39?' es un pase gol frente al arco. ¡Asesora con pasión y cierra con fuerza!",
  "Hoy no se nos escapa ni un ticket. Venta cruzada activa: 'Llévese el limpiador, las medias y las canilleras de una vez'.",
  "El éxito en piso se construye cliente a cliente. Saluda con entusiasmo y transmite la grandeza de nuestra marca.",
  "Ponte las zapatillas más cómodas y la mejor sonrisa: hoy vas a superar todas tus marcas personales.",
  "El secreto del campeón: escuchar las necesidades del cliente, ofrecer la mejor tecnología y atender con 10 estrellas.",
  "¡Al cliente indeciso se le asesora con el corazón, se le inspira confianza y se le despide agradecido!",
  "Las ventas no son suerte, son constancia, técnica y buena vibra en cada metro cuadrado de la tienda.",
  "El calzado estrella no se vende solo; se vende con tu conocimiento y tu mejor recomendación.",
  "Si la mañana estuvo tranquila, la tarde es tu escenario para brillar y remontar el marcador.",
  "Tu meta diaria no es tu techo, es tu punto de partida. ¡Ve por ese ticket doble hoy!",
  "Vender en Marathon Sports es inspirar a otros a superarse. ¡Eres el mejor embajador del deporte!",
  "Un asesor extraordinario no espera que las ventas lleguen; sale a buscarlas con proactividad y energía."
];

export default function Dashboard() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const { empleados, turnosMap, fetchEmpleados, fetchTurnos } = useHorarioStore();
  const { storeStats, fetchMetas } = useMetasStore();

  const isLight = theme === 'clasico';

  const myNombres = user?.user_metadata?.nombres || user?.nombres || 'Colaborador';
  const myCargo = user?.user_metadata?.cargo || user?.cargo || 'Asesor de Ventas';
  const myCedula = user?.user_metadata?.cedula || user?.cedula || '';

  const isDirectivo = ['jefe', 'subjefe', 'supervisor', 'admin', 'tercer'].some(role => 
    myCargo.toLowerCase().includes(role)
  );
  const isBodeguero = ['bodega', 'bodeguero', 'asistente de bodega'].some(role =>
    myCargo.toLowerCase().includes(role) || (user?.user_metadata?.zona || '').toLowerCase().includes('bodega')
  );
  const isAsesor = !isDirectivo && !isBodeguero; // Exclusivo para Asesores de Ventas y Cajeros

  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  
  // Inicializar directamente con los datos de metas de Agosto predeterminados
  const [allMetas, setAllMetas] = useState(DEFAULT_METAS_SEED);

  const shuffleQuote = () => {
    setQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  };

  // Obtener fechas Hoy y Mañana formateadas para Ecuador (UTC-5)
  const { todayDateStr, tomorrowDateStr, todayFormatted, tomorrowFormatted } = (() => {
    try {
      const now = new Date();
      const tom = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const isoFormatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      const todayStr = isoFormatter.format(now);
      const tomorrowStr = isoFormatter.format(tom);

      const textFormatter = new Intl.DateTimeFormat('es-EC', {
        timeZone: 'America/Guayaquil',
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });

      return {
        todayDateStr: todayStr,
        tomorrowDateStr: tomorrowStr,
        todayFormatted: textFormatter.format(now),
        tomorrowFormatted: textFormatter.format(tom)
      };
    } catch {
      const now = new Date();
      const tom = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return {
        todayDateStr: now.toISOString().split('T')[0],
        tomorrowDateStr: tom.toISOString().split('T')[0],
        todayFormatted: 'Hoy',
        tomorrowFormatted: 'Mañana'
      };
    }
  })();

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Buenos días' : currentHour < 19 ? 'Buenas tardes' : 'Buenas noches';

  useEffect(() => {
    fetchEmpleados('todos');
    fetchTurnos();
    fetchMetas();

    const loadLiveMetas = async () => {
      try {
        const { data, error } = await supabase
          .from('metas')
          .select('*')
          .order('cargo', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setAllMetas(data);
        }
      } catch (e) {
        console.error('Error fetching live metas in Dashboard:', e);
      }
    };
    loadLiveMetas();

    const loadPendingCounts = async () => {
      try {
        if (!myCedula) return;
        const [bRes, rRes, cRes] = await Promise.all([
          supabase.from('bitacoras_jefes').select('id, cedula_jefe, colaborador').order('fecha', { ascending: false }).limit(10),
          supabase.from('reportes_bodega').select('id, colaborador').order('fecha', { ascending: false }).limit(10),
          supabase.from('tienda_lecturas_checkin').select('referencia_id, usuario_cedula').eq('usuario_cedula', myCedula)
        ]);

        const myReadIds = new Set((cRes.data || []).map(c => String(c.referencia_id)));

        if (bRes.data) {
          const pendingB = bRes.data.filter(b => {
            const isCreator = String(b.cedula_jefe || '') === myCedula || (b.colaborador || '').toLowerCase().includes(myNombres.toLowerCase());
            return !isCreator && !myReadIds.has(String(b.id));
          });
          setPendingBitacorasCount(pendingB.length);
        }

        if (rRes.data) {
          const pendingR = rRes.data.filter(r => {
            const isCreator = (r.colaborador || '').toLowerCase().includes(myNombres.toLowerCase());
            return !isCreator && !myReadIds.has(String(r.id));
          });
          setPendingBodegaCount(pendingR.length);
        }
      } catch (e) {
        console.error('Error fetching pending counts:', e);
      }
    };
    loadPendingCounts();
  }, [user, myCedula, myNombres]);

  const [pendingBitacorasCount, setPendingBitacorasCount] = useState(0);
  const [pendingBodegaCount, setPendingBodegaCount] = useState(0);

  const selectedDay = 24; // Día de hoy para la asignación de metas

  const {
    metaRecord: myMetaRec,
    storeRecord: storeMetaRec,
    miMetaHoy,
    miMetaPeriodo,
    miMetaMes,
    tiendaMetaHoy,
    tiendaMetaMes
  } = getCollaboratorMeta(allMetas, user, empleados, selectedDay);

  // Turno Hoy del usuario activo
  const miTurnoHoy = turnosMap[`${myCedula}_${todayDateStr}`] || { tipo_turno: 'Descanso', hora_inicio: '00:00', hora_fin: '00:00' };

  // Turno Mañana del usuario activo
  const miTurnoManana = turnosMap[`${myCedula}_${tomorrowDateStr}`] || { tipo_turno: 'Descanso', hora_inicio: '00:00', hora_fin: '00:00' };

  // Encontrar el objeto empleado del usuario actual para extraer su zona
  const myEmployeeData = empleados.find(e => e.cedula === myCedula);
  const myZona = myEmployeeData?.zona || 'CATEGORIZACION';

  // Turnos de hoy de todo el equipo
  const turnosHoyEquipo = empleados.map(emp => {
    const turno = turnosMap[`${emp.cedula}_${todayDateStr}`];
    return {
      empleado: emp,
      turno: turno || { tipo_turno: 'Descanso', hora_inicio: '00:00', hora_fin: '00:00' }
    };
  });

  const enTurnoHoy = turnosHoyEquipo.filter(t => t.turno.tipo_turno !== 'Descanso');

  // Turnos de mañana de todo el equipo
  const turnosMananaEquipo = empleados.map(emp => {
    const turno = turnosMap[`${emp.cedula}_${tomorrowDateStr}`];
    return {
      empleado: emp,
      turno: turno || { tipo_turno: 'Descanso', hora_inicio: '00:00', hora_fin: '00:00' }
    };
  });

  const enTurnoManana = turnosMananaEquipo.filter(t => t.turno.tipo_turno !== 'Descanso');

  // Helper visual para estilos de turno adaptado a Claro y Oscuro
  const getShiftVisual = (shift) => {
    const isOff = shift.tipo_turno === 'Descanso';
    const isMorning = shift.tipo_turno.includes('Apertura') || shift.tipo_turno.includes('M1') || shift.tipo_turno.includes('M2');
    const isMid = shift.tipo_turno.includes('Intermedio') || shift.tipo_turno.includes('I1') || shift.tipo_turno.includes('I2');

    if (isOff) {
      return {
        badgeBg: isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        innerCard: isLight ? 'bg-amber-50/70 border-amber-200/80 text-slate-900' : 'bg-slate-950/60 border-slate-800/80 text-white',
        iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white',
        code: 'LIBRE',
        icon: <Coffee className="w-5 h-5 text-white" />,
        status: '🌴 Día de Descanso',
        timeText: 'Día Libre Oficial'
      };
    }
    if (isMorning) {
      return {
        badgeBg: isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        innerCard: isLight ? 'bg-emerald-50/70 border-emerald-200/80 text-slate-900' : 'bg-slate-950/60 border-slate-800/80 text-white',
        iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white',
        code: 'APERTURA',
        icon: <Sunrise className="w-5 h-5 text-white" />,
        status: '🟢 Turno de Apertura',
        timeText: `${shift.hora_inicio} - ${shift.hora_fin}`
      };
    }
    if (isMid) {
      return {
        badgeBg: isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        innerCard: isLight ? 'bg-amber-50/70 border-amber-200/80 text-slate-900' : 'bg-slate-950/60 border-slate-800/80 text-white',
        iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-white',
        code: 'INTERMEDIO',
        icon: <Clock className="w-5 h-5 text-white" />,
        status: '🟡 Turno Intermedio',
        timeText: `${shift.hora_inicio} - ${shift.hora_fin}`
      };
    }
    return {
      badgeBg: isLight ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      innerCard: isLight ? 'bg-blue-50/70 border-blue-200/80 text-slate-900' : 'bg-slate-950/60 border-slate-800/80 text-white',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white',
      code: 'CIERRE',
      icon: <Sunset className="w-5 h-5 text-white" />,
      status: '🔵 Turno de Cierre',
      timeText: `${shift.hora_inicio} - ${shift.hora_fin}`
    };
  };

  const visualHoy = getShiftVisual(miTurnoHoy);
  const visualManana = getShiftVisual(miTurnoManana);

  // Helper visual para zona
  const getZoneBadgeStyle = (zona) => {
    const z = (zona || '').toUpperCase();
    if (z.includes('HOMBRE')) return isLight ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    if (z.includes('MUJER')) return isLight ? 'bg-pink-100 text-pink-800 border-pink-300' : 'bg-pink-500/20 text-pink-300 border-pink-500/40';
    if (z.includes('CATEGORIZACION')) return isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (z.includes('ROTATIVO')) return isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (z.includes('BODEGA')) return isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    if (z.includes('CAJA')) return isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    return isLight ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isLight ? 'bg-slate-100/90 text-slate-900' : 'bg-[#060b17] text-white'
    }`}>
      
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

        {/* Hero Welcome Banner */}
        <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden shadow-xl transition-all ${
          isLight
            ? 'bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/50 text-slate-900 border-slate-200/90 shadow-blue-500/5'
            : 'bg-gradient-to-br from-[#0c1427] via-[#0e1b38] to-[#070e1c] text-white border-blue-900/40'
        }`}>
          {/* Ambient Glows */}
          <div className={`absolute top-[-30%] right-[-10%] w-[380px] h-[380px] rounded-full blur-[120px] pointer-events-none ${
            isLight ? 'bg-blue-300/30' : 'bg-blue-500/20'
          }`}></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className={`text-2xl sm:text-4xl font-title font-black tracking-tight ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">{myNombres.split(' ')[0]}</span> 👋
              </h1>
              
              {/* Frases Motivacionales & Comerciales Rotativas (Exclusivo para Asesores) */}
              {isAsesor && (
                <div className="mt-3 max-w-2xl">
                  <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold shadow-sm transition-all ${
                    isLight 
                      ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/60' 
                      : 'bg-white/10 backdrop-blur-md border-white/15 text-slate-100 shadow-lg'
                  }`}>
                    <span className="text-base select-none">🔥</span>
                    <span className="italic leading-snug">"{currentQuote}"</span>
                    <button
                      onClick={shuffleQuote}
                      className={`p-1.5 rounded-xl transition cursor-pointer shrink-0 ml-1 ${
                        isLight ? 'hover:bg-slate-100 text-amber-600' : 'hover:bg-white/20 text-amber-300'
                      }`}
                      title="Cambiar frase motivacional"
                    >
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tarjeta de Perfil y Área / Zona del Colaborador */}
            <div className={`p-4 sm:p-5 rounded-2xl border shadow-lg flex items-center gap-3.5 shrink-0 transition-all ${
              isLight 
                ? 'bg-white/95 border-slate-200 shadow-slate-200/50 text-slate-800' 
                : 'bg-slate-900/80 backdrop-blur-xl border-slate-800 text-white'
            }`}>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                {myNombres.charAt(0)}{myCargo.charAt(0)}
              </div>
              <div className="text-left">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {myCargo}
                </span>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-lg border shadow-xs ${getZoneBadgeStyle(myZona)}`}>
                    <MapPin className="w-3 h-3" />
                    <span>{myZona}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN PRINCIPAL: TURNO HOY Y TURNO MAÑANA CONECTADOS AL HORARIO */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className={`font-title font-black text-sm uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Tu Programación de Turnos
              </h2>
            </div>

            <button
              onClick={() => navigate('/horarios')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Matriz Mensual Completa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* TARJETA 1: TURNO HOY */}
            <div className={`p-6 rounded-3xl border shadow-lg relative overflow-hidden transition-all duration-300 ${
              isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-900/85 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/15 text-blue-400'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                      Programación de Hoy
                    </span>
                    <span className={`text-xs font-bold capitalize ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {todayFormatted}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${visualHoy.badgeBg}`}>
                  {visualHoy.status}
                </span>
              </div>

              {/* Detalle del Turno Hoy con Recuadro Claro */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${visualHoy.innerCard}`}>
                <div className={`w-12 h-12 rounded-2xl text-white font-black text-sm flex items-center justify-center shadow-md shrink-0 ${visualHoy.iconBg}`}>
                  {visualHoy.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={`font-title font-black text-base block leading-tight truncate ${
                    isLight ? 'text-slate-950' : 'text-white'
                  }`}>
                    {miTurnoHoy.tipo_turno}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-blue-700' : 'text-slate-400'}`} />
                    <span className={`text-sm font-mono font-extrabold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                      {visualHoy.timeText}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`mt-3.5 flex items-center justify-between text-[11px] font-semibold ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <span>Compañeros en piso hoy:</span>
                <span className={`font-black font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  {enTurnoHoy.length} colaboradores
                </span>
              </div>
            </div>

            {/* TARJETA 2: TURNO MAÑANA */}
            <div className={`p-6 rounded-3xl border shadow-lg relative overflow-hidden transition-all duration-300 ${
              isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-900/85 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/15 text-purple-400'}`}>
                    <Sunrise className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                      Programación de Mañana
                    </span>
                    <span className={`text-xs font-bold capitalize ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {tomorrowFormatted}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${visualManana.badgeBg}`}>
                  {visualManana.status}
                </span>
              </div>

              {/* Detalle del Turno Mañana con Recuadro Claro */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${visualManana.innerCard}`}>
                <div className={`w-12 h-12 rounded-2xl text-white font-black text-sm flex items-center justify-center shadow-md shrink-0 ${visualManana.iconBg}`}>
                  {visualManana.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={`font-title font-black text-base block leading-tight truncate ${
                    isLight ? 'text-slate-950' : 'text-white'
                  }`}>
                    {miTurnoManana.tipo_turno}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-purple-700' : 'text-slate-400'}`} />
                    <span className={`text-sm font-mono font-extrabold ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>
                      {visualManana.timeText}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`mt-3.5 flex items-center justify-between text-[11px] font-semibold ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <span>Compañeros en piso mañana:</span>
                <span className={`font-black font-mono ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                  {enTurnoManana.length} colaboradores
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Grid de KPIs Comerciales & Operativos Adaptados por Rol */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* ========================================================= */}
          {/* CASO 1: VISTA EXCLUSIVA PARA JEFATURA                    */}
          {/* ========================================================= */}
          {isDirectivo && (
            <>
              {/* KPI 1: Meta Diaria de la Tienda (Hoy vs Mañana) */}
              <div 
                onClick={() => navigate('/metas')}
                className={`p-5 rounded-3xl border shadow-md cursor-pointer group transition hover:-translate-y-0.5 ${
                  isLight ? 'bg-white border-slate-200/90 hover:border-emerald-500/50 shadow-slate-100' : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    🏪 Meta Tienda (Hoy & Mañana)
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                
                {/* Meta Hoy vs Meta Mañana */}
                <div className="mt-3 grid grid-cols-2 gap-2 pb-1 border-b border-slate-800/40">
                  <div>
                    <span className="text-[10px] uppercase font-black text-emerald-400 block">🎯 Hoy (d24)</span>
                    <span className={`text-xl font-black font-mono block mt-0.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                      ${tiendaMetaHoy.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-l border-slate-800/40 pl-2.5">
                    <span className="text-[10px] uppercase font-black text-amber-400 block">🌅 Mañana (d25)</span>
                    <span className={`text-xl font-black font-mono block mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                      ${(storeMetaRec?.metas_diarias?.[25] || 7826).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center justify-between mt-2.5 text-[10px] font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  <span>Ver Matriz de Metas & Coaching</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* KPI 2: Personal en Tienda */}
              <div 
                onClick={() => navigate('/personal')}
                className={`p-5 rounded-3xl border shadow-md cursor-pointer group transition hover:-translate-y-0.5 ${
                  isLight ? 'bg-white border-slate-200/90 hover:border-emerald-500/50 shadow-slate-100' : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Personal en Tienda
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`text-2xl font-black ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                    {enTurnoHoy.length} <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>de {empleados.length} en nómina</span>
                  </span>
                  <div className={`flex items-center justify-between mt-2.5 text-[10px] font-bold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                    <span>Ir a Gestión de Personal</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* KPI 3: Bitácoras de Jefes por Revisar (Con Check-in Interactivo) */}
              <div 
                onClick={() => {
                  const el = document.getElementById('bitacoras-peer-hub');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigate('/bitacoras');
                }}
                className={`p-5 rounded-3xl border shadow-md cursor-pointer group transition hover:-translate-y-0.5 ${
                  pendingBitacorasCount > 0
                    ? isLight ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400' : 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                    : isLight ? 'bg-white border-slate-200/90 hover:border-blue-500/50 shadow-slate-100' : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    pendingBitacorasCount > 0 ? 'text-amber-500 font-black' : isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    📋 Bitácoras por Revisar
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    pendingBitacorasCount > 0 ? 'bg-amber-500/20 text-amber-400' : isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    <ClipboardCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`text-2xl font-black ${
                    pendingBitacorasCount > 0 ? 'text-amber-400 font-mono' : isLight ? 'text-emerald-600' : 'text-emerald-400'
                  }`}>
                    {pendingBitacorasCount > 0 ? `${pendingBitacorasCount} pendientes` : '¡Al día!'}
                  </span>
                  <div className={`flex items-center justify-between mt-2.5 text-[10px] font-bold ${
                    pendingBitacorasCount > 0 ? 'text-amber-400' : isLight ? 'text-blue-700' : 'text-blue-400'
                  }`}>
                    <span>{pendingBitacorasCount > 0 ? 'Toca para leer y dar Check-in' : 'Auditoría Entre Jefes'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* CASO 2: VISTA EXCLUSIVA PARA ASESORES DE VENTAS           */}
          {/* ========================================================= */}
          {isAsesor && (
            <>
              {/* KPI 1: Meta Diaria Personal (Hoy vs Mañana) */}
              <div 
                onClick={() => navigate('/metas')}
                className={`p-5 rounded-3xl border shadow-md cursor-pointer group transition hover:-translate-y-0.5 ${
                  isLight ? 'bg-white border-slate-200/90 hover:border-emerald-500/50 shadow-slate-100' : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    🎯 Tu Meta Diaria (Hoy & Mañana)
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                
                {/* Meta Hoy vs Meta Mañana */}
                <div className="mt-3 grid grid-cols-2 gap-2 pb-1 border-b border-slate-800/40">
                  <div>
                    <span className="text-[10px] uppercase font-black text-emerald-400 block">🎯 Hoy (d24)</span>
                    <span className={`text-xl font-black font-mono block mt-0.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                      ${(miMetaHoy || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-l border-slate-800/40 pl-2.5">
                    <span className="text-[10px] uppercase font-black text-amber-400 block">🌅 Mañana (d25)</span>
                    <span className={`text-xl font-black font-mono block mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                      ${(myMetaRec?.metas_diarias?.[25] || 0) > 0 
                        ? Number(myMetaRec.metas_diarias[25]).toLocaleString('en-US', { minimumFractionDigits: 2 })
                        : 'Libre / $0'}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center justify-between mt-2.5 text-[10px] font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  <span>Ver Mi Gestión de Metas</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* KPI 2: Ticket Promedio Recomendado & Venta Cruzada */}
              <div className={`p-5 rounded-3xl border shadow-md ${
                isLight ? 'bg-white border-slate-200/90 shadow-slate-100' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    🛍️ Ticket Promedio Objetivo
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/15 text-purple-400'}`}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`text-2xl font-black font-mono ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
                    ${(storeStats.ticketPromedio || 112.82).toFixed(2)}
                  </span>
                  <div className={`flex items-center justify-between text-[10px] mt-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>Conversión Tienda:</span>
                    <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{storeStats.conversion || 72.47}%</span>
                  </div>
                </div>
              </div>

              {/* KPI 3: Mensaje Motivacional & Comentario de Aliento */}
              <div className={`p-5 rounded-3xl border shadow-md relative overflow-hidden flex flex-col justify-between ${
                isLight 
                  ? 'bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-amber-100/50 border-amber-200/80 text-amber-950' 
                  : 'bg-gradient-to-br from-[#161208] via-[#1c140a] to-[#0e0c06] border-amber-500/30 text-amber-200 shadow-xl shadow-amber-950/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🔥</span>
                    <span className={`text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                      Aliento del Día
                    </span>
                  </div>
                  <button
                    onClick={shuffleQuote}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                      isLight 
                        ? 'bg-white/90 hover:bg-white text-amber-900 border-amber-300' 
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    }`}
                    title="Ver otra frase motivacional"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Cambiar</span>
                  </button>
                </div>
                <p className={`text-xs italic font-medium leading-relaxed my-auto ${isLight ? 'text-amber-900' : 'text-amber-100/90'}`}>
                  "{currentQuote}"
                </p>
                <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex items-center justify-between ${
                  isLight ? 'border-amber-200/80 text-amber-700' : 'border-amber-500/20 text-amber-400'
                }`}>
                  <span>¡A darlo todo en piso! 👟⚡</span>
                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500">Marathon MCP1</span>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* CASO 3: VISTA PARA EL DEMÁS PERSONAL (BODEGA / OTROS)     */}
          {/* ========================================================= */}
          {!isDirectivo && !isAsesor && (
            <>
              {/* KPI 1: Meta Diaria de la Tienda (Hoy vs Mañana) */}
              <div 
                onClick={() => navigate('/metas')}
                className={`p-5 rounded-3xl border shadow-md cursor-pointer group transition hover:-translate-y-0.5 ${
                  isLight ? 'bg-white border-slate-200/90 hover:border-emerald-500/50 shadow-slate-100' : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    🏪 Meta Tienda (Hoy & Mañana)
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                
                {/* Meta Hoy vs Meta Mañana */}
                <div className="mt-3 grid grid-cols-2 gap-2 pb-1 border-b border-slate-800/40">
                  <div>
                    <span className="text-[10px] uppercase font-black text-emerald-400 block">🎯 Hoy (d24)</span>
                    <span className={`text-xl font-black font-mono block mt-0.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                      ${tiendaMetaHoy.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-l border-slate-800/40 pl-2.5">
                    <span className="text-[10px] uppercase font-black text-amber-400 block">🌅 Mañana (d25)</span>
                    <span className={`text-xl font-black font-mono block mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                      ${(storeMetaRec?.metas_diarias?.[25] || 7826).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center justify-between mt-2.5 text-[10px] font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  <span>Meta General de Tienda</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* KPI 2: Turno Programado con Hora de Ingreso y Salida */}
              <div 
                onClick={() => navigate('/horarios')}
                className={`p-5 rounded-3xl border shadow-md cursor-pointer group transition hover:-translate-y-0.5 ${
                  isLight ? 'bg-white border-slate-200/90 hover:border-blue-500/50 shadow-slate-100' : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    📅 Turno Programado
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`text-xl font-black block leading-tight ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                    {miTurnoHoy.tipo_turno || 'Turno Activo'}
                  </span>
                  
                  {/* Horas de Ingreso y Salida */}
                  {miTurnoHoy.hora_inicio && miTurnoHoy.hora_inicio !== '00:00' ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono font-black text-emerald-400">
                      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Ingreso: {miTurnoHoy.hora_inicio} • Salida: {miTurnoHoy.hora_fin}</span>
                    </div>
                  ) : (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <span>🌴 Día de Descanso / Libre</span>
                    </div>
                  )}

                  <div className={`flex items-center justify-between mt-2 text-[10px] font-bold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                    <span>Ver Horarios Semanales</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* KPI 3: Reportes de Bodega por Revisar (Con Check-in Interactivo) */}
              <div 
                onClick={() => {
                  const el = document.getElementById('bitacoras-peer-hub');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigate('/bodega-admin');
                }}
                className={`p-5 rounded-3xl border shadow-md cursor-pointer group transition hover:-translate-y-0.5 ${
                  pendingBodegaCount > 0
                    ? isLight ? 'bg-cyan-50/70 border-cyan-300 hover:border-cyan-400' : 'bg-cyan-950/20 border-cyan-500/40 hover:border-cyan-400'
                    : isLight ? 'bg-white border-slate-200/90 hover:border-cyan-500/50 shadow-slate-100' : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    pendingBodegaCount > 0 ? 'text-cyan-500 font-black' : isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    📦 Reportes de Bodega
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    pendingBodegaCount > 0 ? 'bg-cyan-500/20 text-cyan-400' : isLight ? 'bg-cyan-100 text-cyan-600' : 'bg-cyan-500/15 text-cyan-400'
                  }`}>
                    <Warehouse className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`text-2xl font-black ${
                    pendingBodegaCount > 0 ? 'text-cyan-400 font-mono' : isLight ? 'text-emerald-600' : 'text-emerald-400'
                  }`}>
                    {pendingBodegaCount > 0 ? `${pendingBodegaCount} pendientes` : '¡Al día!'}
                  </span>
                  <div className={`flex items-center justify-between mt-2.5 text-[10px] font-bold ${
                    pendingBodegaCount > 0 ? 'text-cyan-400' : isLight ? 'text-cyan-700' : 'text-cyan-400'
                  }`}>
                    <span>{pendingBodegaCount > 0 ? 'Toca para leer y dar Check-in' : 'Auditoría Entre Bodega'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Sección Unificada: Promos en Tienda & Anuncios de Jefatura con Check-in */}
        <PromosYAnunciosHub
          isDirectivo={isDirectivo}
          isLight={isLight}
          user={user}
          totalEmpleadosCount={empleados.length || 13}
        />

        {/* Sección: Bitácoras de Jefes & Reportes de Bodega con Check-in entre Pares */}
        {(isDirectivo || isBodeguero) && (
          <div id="bitacoras-peer-hub">
            <BitacorasPeerCheckinHub
              isDirectivo={isDirectivo}
              isBodeguero={isBodeguero}
              isLight={isLight}
              user={user}
            />
          </div>
        )}

      </main>

    </div>
  );
}
