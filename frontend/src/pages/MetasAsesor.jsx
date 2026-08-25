import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMetasStore } from '../store/metasStore';
import { getEmployeeTheme } from '../utils/themeHelper';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Percent, 
  Sparkles,
  Info,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileText,
  ExternalLink,
  CheckCircle2,
  Quote,
  Zap
} from 'lucide-react';

// Frases motivacionales diarias de ventas para asesores (rotan automáticamente cada día y son personalizadas por cédula)
const MOTIVATIONAL_QUOTES = [
  { quote: "El éxito en las ventas no es suerte, es constancia. Cada cliente que saludas es una oportunidad de superar tu meta.", author: "Mentalidad Ganadora Marathon" },
  { quote: "No vendemos productos, ofrecemos la mejor experiencia y equipamiento para las metas de nuestros clientes. ¡Haz que cada atención cuente!", author: "Excelencia Comercial" },
  { quote: "La diferencia entre un buen vendedor y un campeón es el empuje en las últimas horas del día. ¡Hoy se cierra fuerte!", author: "Empuje de Cierre" },
  { quote: "El cliente no compra solo lo que vendes, compra el entusiasmo con el que se lo ofreces. ¡Transmite pasión hoy!", author: "Actitud Comercial" },
  { quote: "Cada 'no' te acerca un paso más al 'sí' ganador. ¡Mantén la energía en alto y ve por ese calzado de alto valor!", author: "Superación Diaria" },
  { quote: "El producto estrella no se vende solo; se vende con tu conocimiento, recomendación sincera y tu mejor sonrisa.", author: "Calidad de Servicio" },
  { quote: "Las metas grandes se construyen factura a factura. Enfócate en el cliente que tienes enfrente y los números llegarán.", author: "Enfoque de Ventas" },
  { quote: "Un gran asesor escucha el doble de lo que habla. Descubre la necesidad del cliente y la venta estará asegurada.", author: "Escucha Activa" },
  { quote: "Tu actitud al abrir la tienda define tus resultados al cerrar la caja. ¡Hoy es un excelente día para romper récords!", author: "Motivación Diaria" },
  { quote: "El cliente satisfecho no solo regresa, te recomienda. Brinda un servicio memorable en cada atención.", author: "Fidelización de Clientes" },
  { quote: "Los obstáculos son oportunidades disfrazadas. Si la mañana estuvo floja, la tarde es tu escenario para destacar.", author: "Resiliencia Comercial" },
  { quote: "Conoce tu inventario, confía en tu talento y no dejes ir a ningún cliente sin ofrecerle el complemento perfecto.", author: "Venta Cruzada Efectiva" },
  { quote: "La meta no es el límite, es el punto de partida. ¡Supera tus propias expectativas hoy!", author: "Ambición Profesional" },
  { quote: "Trabajo en equipo, pasión por la marca y determinación individual son la fórmula invencible del éxito.", author: "Espíritu Marathon" },
  { quote: "El verdadero campeón busca soluciones donde otros ven excusas. ¡Hoy demostramos de qué estamos hechos!", author: "Determinación Total" },
  { quote: "Vender no es presionar, es conectar. Cuando entiendes lo que el cliente busca, el cierre ocurre de forma natural.", author: "Conexión con el Cliente" },
  { quote: "Cada interacción es una oportunidad de proyectar la grandeza de nuestra tienda. ¡Brilla con tu energía!", author: "Liderazgo en Tienda" },
  { quote: "El tiempo vale oro en el piso de ventas. Aprovecha cada minuto activo para asesorar, acompañar y concretar.", author: "Gestión Eficiente" },
  { quote: "Quien domina los detalles del producto gana la confianza del comprador. Capacítate y destaca hoy.", author: "Dominio de Producto" },
  { quote: "No cuentes los minutos, haz que cada minuto cuente en tu factura de ventas. ¡Enfócate en la cima!", author: "Disciplina de Campeones" },
  { quote: "El servicio de excelencia transforma a un comprador ocasional en un cliente para toda la vida.", author: "Valor de Marca" },
  { quote: "Visualiza tu meta desde la primera hora del día. Lo que la mente cree, las ventas lo consiguen.", author: "Enfoque Ganador" },
  { quote: "Un buen calzado no solo viste a una persona, la acompaña en sus propios retos. ¡Sé su mejor asesor!", author: "Experiencia Deportiva" },
  { quote: "La constancia supera al talento cuando el talento no se esfuerza. Sigue empujando hacia tu objetivo.", author: "Perseverancia" },
  { quote: "Saluda con calidez, asesora con conocimiento y despide con gratitud. Esa es la firma de un gran profesional.", author: "Protocolo de Servicio" },
  { quote: "Cuando superas tus metas diarias, no solo crecen tus números, crece tu liderazgo en el equipo.", author: "Crecimiento Profesional" },
  { quote: "Hoy es el día ideal para vender ese ticket alto que estabas esperando. Confía en tu técnica.", author: "Poder de Convencimiento" },
  { quote: "No esperes a que el cliente pregunte, anticipa sus necesidades y ofrécele alternativas de valor.", author: "Iniciativa Comercial" },
  { quote: "El éxito del piso de ventas se mide por la satisfacción del cliente y el orgullo de haber dado el 100%.", author: "Orgullo Marathon" },
  { quote: "Mantén la cabeza fría y el entusiasmo al máximo. ¡Tú tienes el control para hacer de hoy un día extraordinario!", author: "Actitud Ganadora" }
];

const getDailyQuote = (dayIndex, cedulaStr) => {
  let hash = 0;
  const str = String(cedulaStr || '0');
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i);
  }
  const index = (dayIndex + hash) % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
};

const getDaysInCurrentMonth = () => {
  try {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  } catch {
    return 30;
  }
};

const getPeriodIndex = (dayIdx) => {
  if (dayIdx <= 8) return 1;
  if (dayIdx <= 15) return 2;
  if (dayIdx <= 23) return 3;
  return 4;
};

const getCoachingForPeriod = (comentarioStr, period) => {
  if (!comentarioStr) return '';
  const trimmed = comentarioStr.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed[period] || parsed[String(period)] || '';
    } catch (e) {
      // Ignore
    }
  }
  const activePeriod = getPeriodIndex(Math.min(getDaysInCurrentMonth(), Math.max(1, getEcuadorDayIndexGlobal())));
  if (period === activePeriod) {
    return comentarioStr;
  }
  return '';
};

// Global helper for fallback in getCoachingForPeriod outside component
const getEcuadorDayIndexGlobal = () => {
  try {
    const formatter = new Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil', day: 'numeric' });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    return new Date().getDate();
  }
};

const getMotivationalContent = (cumpl, name) => {
  const firstName = name ? name.split(' ')[0] : 'Asesor';
  
  const superestrella = [
    `¡Eres una superestrella de las ventas, ${firstName}! 🌟 Sigue así, rompiendo récords.`,
    `¡Imparable, ${firstName}! Desempeño de nivel élite. ¡Sigue liderando el tablero!`,
    `¡Espectacular! Has superado la meta esperada, ${firstName}. ¡Tu esfuerzo se nota y se premia!`,
    `¡Vendedor estrella, sigue así lo estás haciendo increíblemente bien, ${firstName}! 🏆`
  ];
  
  const enMeta = [
    `¡Excelente trabajo, ${firstName}! Estás justo en el objetivo. ¡Mantén el ritmo! ✅`,
    `¡Golazo, ${firstName}! Cumpliendo las expectativas a la perfección. ¡Sigue así!`,
    `¡Muy buen paso, ${firstName}! La constancia es tu mejor aliada. ¡A asegurar el mes!`,
    `¡Sigue así, ${firstName}! Estás haciendo un gran trabajo manteniendo tu meta al día.`
  ];
  
  const cerca = [
    `¡Te falta muy poco para llegar, ${firstName}! 🎯 ¡Tú puedes, metele ganas!`,
    `¡Buen esfuerzo, ${firstName}! El objetivo está al alcance de tu mano. ¡Aprieta el paso hoy! 📈`,
    `¡Estás muy cerca, ${firstName}! Cada venta cuenta, enfócate en el cierre de ticket.`,
    `¡Dale con todo, ${firstName}! Estás a un paso de alcanzar la meta de este período.`
  ];
  
  const impulso = [
    `¡Metele ganas, ${firstName}, tú puedes! 💪 Cada cliente es una oportunidad de gol.`,
    `¡Es momento de remontar, ${firstName}! Enfócate en el calzado estrella y la venta cruzada.`,
    `¡Vamos arriba, ${firstName}! Tienes todo el potencial para subir ese porcentaje hoy mismo. 🔥`,
    `¡Mucha fuerza! No te rindas, un par de cierres fuertes te pondrán de vuelta en el juego, ${firstName}.`
  ];
  
  const remontada = [
    `¡Hora de cambiar la estrategia, ${firstName}! 🚀 Concéntrate en la conversión y el ticket promedio.`,
    `¡Tú puedes, ${firstName}! El mes aún es joven y cada día es una nueva oportunidad.`,
    `¡Metele garra, ${firstName}! Pide apoyo a tu jefatura para técnicas de venta adicionales. 🎯`,
    `¡Vamos con todo, ${firstName}! Confiamos en tu capacidad para darle la vuelta al marcador.`
  ];
  
  let list = cerca;
  let bg = 'from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-300';
  let textTheme = 'text-blue-400';
  let iconColor = 'text-blue-400 animate-pulse';
  
  if (cumpl >= 105) {
    list = superestrella;
    bg = 'from-amber-500/20 via-yellow-500/10 to-slate-900/40 border-amber-500/40 text-amber-300 bg-slate-900/30';
    textTheme = 'text-amber-400';
    iconColor = 'text-amber-400 animate-bounce';
  } else if (cumpl >= 95) {
    list = enMeta;
    bg = 'from-emerald-500/15 via-teal-500/10 to-slate-900/40 border-emerald-500/35 text-emerald-300 bg-slate-900/30';
    textTheme = 'text-emerald-400';
    iconColor = 'text-emerald-400';
  } else if (cumpl >= 75) {
    list = cerca;
    bg = 'from-blue-500/15 via-indigo-500/10 to-slate-900/40 border-blue-500/35 text-blue-300 bg-slate-900/30';
    textTheme = 'text-blue-400';
    iconColor = 'text-blue-400 animate-pulse';
  } else if (cumpl >= 50) {
    list = impulso;
    bg = 'from-yellow-500/15 via-orange-500/10 to-slate-900/40 border-yellow-500/35 text-yellow-300 bg-slate-900/30';
    textTheme = 'text-yellow-400';
    iconColor = 'text-yellow-400';
  } else {
    list = remontada;
    bg = 'from-rose-500/20 via-red-500/10 to-slate-900/40 border-rose-500/40 text-rose-350 bg-slate-900/30';
    textTheme = 'text-rose-450';
    iconColor = 'text-rose-400';
  }
  
  const EcuadorDay = Math.min(getDaysInCurrentMonth(), Math.max(1, new Date().getDate()));
  const index = EcuadorDay % list.length;
  
  return {
    phrase: list[index],
    bg,
    textTheme,
    iconColor
  };
};

export default function MetasAsesor() {
  const { user } = useAuthStore();
  const { theme: activeTheme } = useThemeStore();
  const cargo = user?.user_metadata?.cargo || 'Asesor de Ventas';
  const myTheme = getEmployeeTheme(cargo, user?.user_metadata?.nombres || '');
  const tc = getThemeClasses(activeTheme, myTheme);

  // Store de Metas
  const { teamMetas, storeStats, fetchMetas } = useMetasStore();

  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  const normCedula = (c) => {
    const str = String(c || '').trim();
    if (str.length === 9 && /^\d+$/.test(str)) return '0' + str;
    return str;
  };

  // Encontrar meta del asesor logueado por su cédula
  const myCedula = user?.user_metadata?.cedula;
  const myMeta = teamMetas.find(m => normCedula(m.cedula) === normCedula(myCedula));

  const activePeriodIdx = getPeriodIndex(getEcuadorDayIndexGlobal());
  const [selectedPeriodTab, setSelectedPeriodTab] = useState(activePeriodIdx);

  // Resolve coaching text for the selected period tab
  const commentForSelectedPeriod = myMeta ? getCoachingForPeriod(myMeta.comentario, selectedPeriodTab) : '';
  const hasJefeCoaching = Boolean(commentForSelectedPeriod && commentForSelectedPeriod.trim().length > 0);
  const defaultEncouragingText = "¡Ánimo equipo! Cada día es una nueva oportunidad para remontar y alcanzar la meta del mes. Mantén la mejor actitud y enfócate en tu atención al cliente.";
  const comentarioJefe = hasJefeCoaching ? commentForSelectedPeriod : defaultEncouragingText;

  // Estado de confirmación de lectura de coaching por el asesor
  const [, setConfirmedTick] = useState(0);
  const coachingStorageKey = (myCedula && commentForSelectedPeriod) ? `coaching_read_${myCedula}_P${selectedPeriodTab}_${commentForSelectedPeriod}` : null;
  const coachingRead = coachingStorageKey ? localStorage.getItem(coachingStorageKey) === 'true' : false;

  const handleConfirmCoachingRead = () => {
    if (!coachingStorageKey) return;
    localStorage.setItem(coachingStorageKey, 'true');
    setConfirmedTick(prev => prev + 1);
  };

  const daysInMonth = getDaysInCurrentMonth();

  // Obtener ventas diarias (Días 1 a N) del asesor
  const dailySales = (myMeta?.daily_sales && myMeta.daily_sales.length > 0)
    ? myMeta.daily_sales
    : Array.from({ length: daysInMonth }, (_, i) => ({
        dia: i + 1,
        monto: i === 0 ? 1606.05 : i === 1 ? 2645.96 : 0
      }));

  const activeDaysWithSales = dailySales.filter(d => d.monto > 0).length;

  // Calcular metas de Hoy y Mañana dinámicamente según el día del mes
  // Forzar zona horaria de Ecuador (UTC-5) para evitar el rollover de medianoche prematuro
  const getEcuadorDayIndex = () => {
    try {
      const formatter = new Intl.DateTimeFormat('es-EC', {
        timeZone: 'America/Guayaquil',
        day: 'numeric'
      });
      return parseInt(formatter.format(new Date()), 10);
    } catch {
      return new Date().getDate();
    }
  };

  const getReportingDayIndex = (metasList) => {
    return Math.min(daysInMonth, Math.max(1, getEcuadorDayIndex()));
  };

  const actualTodayDay = getEcuadorDayIndex();
  const todayDayIndex = getReportingDayIndex(teamMetas);

  const getWeekDays = (dayIdx) => {
    if (dayIdx <= 8) return [1, 2, 3, 4, 5, 6, 7, 8];
    if (dayIdx <= 15) return [9, 10, 11, 12, 13, 14, 15];
    if (dayIdx <= 23) return [16, 17, 18, 19, 20, 21, 22, 23];
    return Array.from({ length: daysInMonth - 23 }, (_, i) => 24 + i);
  };
  const weekDays = getWeekDays(actualTodayDay);

  const getPeriodLabel = (dayIdx) => {
    if (dayIdx <= 8) return "Período 1 (Días 1-8)";
    if (dayIdx <= 15) return "Período 2 (Días 9-15)";
    if (dayIdx <= 23) return "Período 3 (Días 16-23)";
    return `Período 4 (Días 24-${daysInMonth})`;
  };
  const currentPeriodLabel = getPeriodLabel(actualTodayDay);

  // Filtrar los días por períodos
  const p1Days = dailySales.filter(d => d.dia >= 1 && d.dia <= 8);
  const p2Days = dailySales.filter(d => d.dia >= 9 && d.dia <= 15);
  const p3Days = dailySales.filter(d => d.dia >= 16 && d.dia <= 23);
  const p4Days = dailySales.filter(d => d.dia >= 24);

  const p1Venta = p1Days.reduce((sum, d) => sum + (d.monto || 0), 0);
  const p1Meta = p1Days.reduce((sum, d) => sum + (d.goal || 0), 0);

  const p2Venta = p2Days.reduce((sum, d) => sum + (d.monto || 0), 0);
  const p2Meta = p2Days.reduce((sum, d) => sum + (d.goal || 0), 0);

  const p3Venta = p3Days.reduce((sum, d) => sum + (d.monto || 0), 0);
  const p3Meta = p3Days.reduce((sum, d) => sum + (d.goal || 0), 0);

  const p4Venta = p4Days.reduce((sum, d) => sum + (d.monto || 0), 0);
  const p4Meta = p4Days.reduce((sum, d) => sum + (d.goal || 0), 0);

  // === KPIs de Progreso Personal ===
  const acumVentas = dailySales.reduce((sum, d) => sum + d.monto, 0);
  const myAcumVentas = (myMeta?.acum_ventas !== null && myMeta?.acum_ventas !== undefined) 
    ? parseFloat(myMeta.acum_ventas) 
    : acumVentas;

  const dailyQuote = getDailyQuote(actualTodayDay, myCedula);

  const metaMensual = (dailySales && dailySales.length > 0)
    ? dailySales.reduce((sum, d) => sum + (d.goal ?? 0), 0) ?? (myMeta?.meta_mensual ?? 0)
    : (myMeta?.meta_mensual ?? 0);

  const metaSemanal = (dailySales && dailySales.length > 0)
    ? dailySales.filter(d => weekDays.includes(d.dia)).reduce((sum, d) => sum + (d.goal ?? 0), 0) ?? (myMeta?.meta_semanal ?? 0)
    : (myMeta?.meta_semanal ?? 0);

  const metaDiaria = (dailySales && dailySales.length > 0)
    ? (dailySales.find(d => d.dia === actualTodayDay)?.goal ?? dailySales.find(d => d.dia === todayDayIndex)?.goal ?? (myMeta?.meta_diaria ?? 0))
    : (myMeta?.meta_diaria ?? 0);

  // Meta prorrateada hasta hoy (suma de metas diarias del excel)
  const metaProrateada = (dailySales && dailySales.length > 0)
    ? dailySales.filter(d => d.dia <= todayDayIndex).reduce((sum, d) => sum + (d.goal !== undefined ? d.goal : d.monto), 0)
    : (metaMensual > 0 ? parseFloat((metaMensual * todayDayIndex / daysInMonth).toFixed(2)) : 0);
  const cumplimientoFecha = metaProrateada > 0 ? parseFloat((myAcumVentas / metaProrateada * 100).toFixed(1)) : 0;

  const diferenciaFecha = parseFloat((myAcumVentas - metaProrateada).toFixed(2));

  // Ticket promedio personal = acum / facturas estimadas (venta promedio diaria)
  const ventaPromedioPersonal = activeDaysWithSales > 0 ? parseFloat((myAcumVentas / activeDaysWithSales).toFixed(2)) : 0;

  // Proyección mensual
  const proyeccionMensual = activeDaysWithSales > 0 ? parseFloat((ventaPromedioPersonal * daysInMonth).toFixed(2)) : 0;

  const motivation = getMotivationalContent(cumplimientoFecha, user?.user_metadata?.nombres || '');

  return (
    <div className="max-w-6xl mx-auto py-3 sm:py-6 px-1 min-[380px]:px-3 sm:px-4 space-y-4 sm:space-y-6 animate-fade-in-up">
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-accent-bg { background-color: ${myTheme.primary} !important; }
        .theme-accent-text { color: ${myTheme.primary} !important; }
        .theme-accent-border { border-color: ${myTheme.primary} !important; }
        .theme-accent-border-soft { border-color: ${myTheme.primary}30 !important; }
        .theme-accent-bg-soft { background-color: ${myTheme.primary}10 !important; }
        .theme-accent-bg-medium { background-color: ${myTheme.primary}20 !important; }
      ` }} />

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b pb-3 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl sm:text-3xl font-title font-black flex flex-wrap items-center gap-2 ${tc.textPrimary}`}>
              <Target className="w-6 h-6 sm:w-8 sm:h-8 theme-accent-text flex-shrink-0" />
              <span>Mis Metas Diarias</span>
            </h1>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 uppercase tracking-wider">
              V8 Edition
            </span>
          </div>
          <p className={`mt-1 text-[10px] sm:text-xs font-medium ${tc.textMuted}`}>
            Visualización de tus objetivos de ventas y comentarios de jefatura.
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl border font-title font-black text-xs sm:text-sm flex items-center gap-2 ${activeTheme === 'oscuro' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>{currentPeriodLabel}</span>
        </div>
      </div>

      {/* Ventanita de Motivación / Estado de Meta (Burbuja de Diálogo Premium V8) */}
      <div className={`p-4 sm:p-5 rounded-3xl border ${motivation.bg} shadow-lg flex items-center gap-3.5 animate-fade-in relative overflow-hidden backdrop-blur-md`}>
        <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/10 flex-shrink-0 text-2xl shadow-inner flex items-center justify-center">
          {cumplimientoFecha >= 105 ? '🌟' : cumplimientoFecha >= 95 ? '🔥' : cumplimientoFecha >= 75 ? '⚡' : cumplimientoFecha >= 50 ? '🎯' : '🚀'}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest block opacity-90 px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
              💬 Mensaje Motivacional
            </span>
            <span className="text-[9px] font-extrabold opacity-80">
              {cumplimientoFecha >= 105 ? '🏆 Vendedor Estrella' : cumplimientoFecha >= 95 ? '✅ ¡En Meta!' : cumplimientoFecha >= 75 ? '📈 ¡Cerca de la Meta!' : '⚡ ¡Acelerando!'}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-extrabold leading-snug tracking-wide">
            "{motivation.phrase}"
          </p>
        </div>
      </div>

      {/* Tarjeta de Coaching Oficial de Jefatura (POSICIONADA ARRIBA DE TODO EN LA PÁGINA PRINCIPAL) */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-xl transition-all duration-300 flex flex-col justify-between text-left relative overflow-hidden ${
        activeTheme === 'oscuro'
          ? 'bg-gradient-to-br from-amber-500/15 via-[#0c1427] to-[#0c1427] border-amber-500/30'
          : 'bg-gradient-to-br from-amber-500/10 via-white to-white border-amber-300 shadow-amber-500/5'
      }`}>
        {/* Encabezado limpio y responsivo en móviles */}
        <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2.5 mb-3 border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400">Coaching de Jefatura por Período</h3>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold block">Selecciona un período para revisar tu feedback</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start min-[420px]:self-auto">
            {coachingRead ? (
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Leído / Confirmado
              </span>
            ) : (
              <button
                onClick={handleConfirmCoachingRead}
                className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 touch-manipulation min-h-[36px]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
                </span>
                ✓ Confirmar Lectura P{selectedPeriodTab}
              </button>
            )}
          </div>
        </div>

        {/* Selector de Períodos de Coaching (Tabs) */}
        <div className="flex gap-1 mb-3 max-w-sm">
          {[1, 2, 3, 4].map(pNum => {
            const isActive = selectedPeriodTab === pNum;
            const isCurrentActual = activePeriodIdx === pNum;
            const hasText = getCoachingForPeriod(myMeta?.comentario, pNum);
            const hasTextBool = Boolean(hasText && hasText.trim() !== '');
            
            return (
              <button
                key={pNum}
                type="button"
                onClick={() => setSelectedPeriodTab(pNum)}
                className={`flex-grow py-1.5 px-1 rounded-lg border text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                    : 'bg-slate-500/10 border-slate-700/40 text-slate-350 hover:bg-slate-500/20'
                }`}
              >
                <span>P{pNum}</span>
                {isCurrentActual && <span title="Período Activo">✨</span>}
                {hasTextBool && <span className="w-1 h-1 rounded-full bg-emerald-400"></span>}
              </button>
            );
          })}
        </div>

        {/* Bloque principal de Coaching (Burbuja de Feedback V8) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 border border-amber-500/30 text-slate-200 space-y-1.5 backdrop-blur-md relative shadow-inner">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 uppercase tracking-wider mb-0.5">
            <span>🗣️ Feedback de Jefatura · Período {selectedPeriodTab}</span>
          </div>
          <p className="text-xs sm:text-sm font-extrabold leading-relaxed text-amber-100 italic" title={comentarioJefe}>
            “{comentarioJefe}”
          </p>
        </div>

        {/* Nota informativa al pie */}
        <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400 font-semibold">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            {hasJefeCoaching ? `Observaciones personalizadas de Jefatura para el Período ${selectedPeriodTab}` : 'Mensaje motivacional automático del sistema'}
          </span>
          {coachingRead && (
            <span className="text-emerald-400 font-bold">✓ Has confirmado este coaching</span>
          )}
        </div>
      </div>

      {/* Fila 2: Mi Progreso Diario y Mensual */}
      <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-lg ${tc.cardBg}`} style={tc.cardBgStyle}>
        <div className="flex items-center gap-2 mb-6 border-b pb-3 dark:border-slate-800">
          <BarChart3 className="w-5 h-5 theme-accent-text" />
          <h3 className={`text-sm font-bold uppercase tracking-wider ${tc.textPrimary}`}>Mi Progreso y Avance de Ventas</h3>
        </div>

        {/* Columnas de Progreso (Diario vs Mensual) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Meta de Mañana */}
          {(() => {
            const tomorrowDay = Math.min(daysInMonth, actualTodayDay + 1);
            const tomorrowGoal = myMeta?.daily_sales?.find(d => d.dia === tomorrowDay)?.goal ?? myMeta?.daily_sales?.find(d => d.dia === tomorrowDay)?.monto ?? 0;
            const isDescanso = tomorrowGoal === 0;
            
            return (
              <div className={`p-3.5 min-[380px]:p-5 rounded-2xl min-[380px]:rounded-3xl border shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-300 ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center justify-between gap-1.5 mb-3.5">
                  <span className="text-[9px] min-[360px]:text-[10px] font-black uppercase tracking-wider text-slate-400">Meta de Mañana (Día {tomorrowDay})</span>
                  <span className={`px-2 py-0.5 min-[360px]:px-2.5 min-[360px]:py-1 rounded-lg min-[360px]:rounded-xl text-[8px] min-[360px]:text-[9px] font-black uppercase border tracking-wide transition-all self-start min-[400px]:self-auto bg-indigo-500/10 text-indigo-400 border-indigo-500/20`}>
                    {isDescanso ? 'Día Libre 🎉' : 'Planificado ⏳'}
                  </span>
                </div>
                
                <div className="space-y-3.5">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-xl min-[360px]:text-2xl sm:text-3xl font-title font-black tracking-tight text-indigo-400">
                        ${tomorrowGoal.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] min-[360px]:text-[10px] text-slate-450 font-bold ml-1.5 uppercase">Presupuesto</span>
                    </div>
                  </div>
                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${activeTheme === 'oscuro' ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                    <div
                      className="h-full rounded-full transition-all duration-1000 bg-indigo-500"
                      style={{ width: '0%' }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase leading-normal">
                    {isDescanso ? '¡Mañana tienes descanso! Disfrútalo.' : 'Planifica tu jornada para alcanzar este objetivo.'}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Progreso de Hoy */}
          {(() => {
            const hoyDay = actualTodayDay;
            const targetSale = dailySales.find(d => d.dia === hoyDay)?.monto || 0;
            const targetGoal = myMeta?.daily_sales?.find(d => d.dia === hoyDay)?.goal ?? myMeta?.daily_sales?.find(d => d.dia === hoyDay)?.monto ?? metaDiaria;
            const pctHoy = targetGoal > 0 ? Math.round((targetSale / targetGoal) * 100) : 0;
            const isPending = todayDayIndex < hoyDay;
            const isDescanso = targetGoal === 0;
            
            return (
              <div className={`p-3.5 min-[380px]:p-5 rounded-2xl min-[380px]:rounded-3xl border shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-300 ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center justify-between gap-1.5 mb-3.5">
                  <span className="text-[9px] min-[360px]:text-[10px] font-black uppercase tracking-wider text-slate-400">Resultados de Hoy (Día {hoyDay})</span>
                  <span className={`px-2 py-0.5 min-[360px]:px-2.5 min-[360px]:py-1 rounded-lg min-[360px]:rounded-xl text-[8px] min-[360px]:text-[9px] font-black uppercase border tracking-wide transition-all self-start min-[400px]:self-auto ${
                    isDescanso ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                    isPending ? 'bg-blue-500/10 text-blue-450 border-blue-500/20 animate-pulse' :
                    pctHoy >= 100 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    pctHoy >= 70 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {isDescanso ? 'Día Libre 🎉' : isPending ? 'Planificado ⏳' : pctHoy >= 100 ? 'Meta Lograda' : pctHoy >= 70 ? 'Cerca' : 'Reforzar'}
                  </span>
                </div>
                
                <div className="space-y-3.5">
                  <div className="flex flex-col min-[380px]:flex-row justify-between items-start min-[380px]:items-end gap-2">
                    <div>
                      <span className={`text-xl min-[360px]:text-2xl sm:text-3xl font-title font-black tracking-tight ${
                        isDescanso ? 'text-violet-400' :
                        isPending ? 'text-blue-500' : 
                        pctHoy >= 100 ? 'text-emerald-500' : 
                        pctHoy >= 70 ? 'text-amber-500' : 
                        'text-red-500'
                      }`}>
                        {isDescanso ? '100%' : `${pctHoy}%`}
                      </span>
                      <span className="text-[9px] min-[360px]:text-[10px] text-slate-400 font-bold ml-1.5 uppercase">{isDescanso ? 'descanso' : 'logrado'}</span>
                    </div>
                    <div className="text-left min-[380px]:text-right w-full min-[380px]:w-auto">
                      <span className={`text-sm min-[360px]:text-base sm:text-lg font-title font-black tracking-tight block ${tc.textPrimary}`}>
                        ${targetSale.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] min-[360px]:text-[10px] text-slate-455 font-bold block mt-0.5">
                        {isDescanso ? 'Día de descanso' : `de $${targetGoal.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${activeTheme === 'oscuro' ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isDescanso ? 'bg-violet-500' :
                        isPending ? 'bg-blue-500/60' :
                        pctHoy >= 100 ? 'bg-emerald-500' :
                        pctHoy >= 70 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${isDescanso ? 100 : Math.min(100, pctHoy)}%` }}
                    />
                  </div>
                  
                  {isPending && !isDescanso && (
                    <div className="text-[9px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-2 bg-blue-500/5 px-2.5 py-1.5 rounded-xl border border-blue-500/10 animate-pulse">
                      <span>⏳</span> El supervisor aún no carga el avance de hoy.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Progreso Mensual */}
          {(() => {
            const cumplFecha = cumplimientoFecha;
            const difFecha = diferenciaFecha;
            const arriba = difFecha >= 0;
            return (
              <div className={`p-3.5 min-[380px]:p-5 rounded-2xl min-[380px]:rounded-3xl border shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-300 ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center justify-between gap-1.5 mb-3.5">
                  <span className="text-[9px] min-[360px]:text-[10px] font-black uppercase tracking-wider text-slate-400">Progreso Mensual (A la Fecha)</span>
                  <span className={`px-2 py-0.5 min-[360px]:px-2.5 min-[360px]:py-1 rounded-lg min-[360px]:rounded-xl text-[8px] min-[360px]:text-[9px] font-black uppercase border tracking-wide transition-all self-start min-[400px]:self-auto ${
                    cumplFecha >= 100 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    cumplFecha >= 70 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {cumplFecha >= 100 ? 'En Meta' : cumplFecha >= 70 ? 'Cerca' : 'Reforzar'}
                  </span>
                </div>
                
                <div className="space-y-3.5">
                  <div className="flex flex-col min-[380px]:flex-row justify-between items-start min-[380px]:items-end gap-2">
                    <div>
                      <span className={`text-xl min-[360px]:text-2xl sm:text-3xl font-title font-black tracking-tight ${arriba ? 'text-emerald-500' : 'text-red-400'}`}>
                        {cumplFecha}%
                      </span>
                      <span className="text-[9px] min-[360px]:text-[10px] text-slate-400 font-bold ml-1.5 uppercase">cumplimiento</span>
                    </div>
                    <div className="text-left min-[380px]:text-right w-full min-[380px]:w-auto">
                      <span className={`text-sm min-[360px]:text-base sm:text-lg font-title font-black tracking-tight block ${tc.textPrimary}`}>
                        ${myAcumVentas.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] min-[360px]:text-[10px] text-slate-455 font-bold block mt-0.5">
                        de ${metaProrateada.toLocaleString('es-EC', { minimumFractionDigits: 2 })} esperados
                      </span>
                    </div>
                  </div>
                  
                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${activeTheme === 'oscuro' ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        cumplFecha >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                        cumplFecha >= 70 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                        'bg-gradient-to-r from-red-500 to-orange-400'
                      }`}
                      style={{ width: `${Math.min(100, cumplFecha)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

        {/* KPIs en grilla (Datos Oficiales del PDF de Ventas) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 min-[360px]:gap-3">
          {/* Diferencia Acumulada */}
          <div className={`p-2.5 min-[360px]:p-3 rounded-xl border text-left ${activeTheme === 'oscuro' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
            {(() => {
              const difFecha = diferenciaFecha;
              const arriba = difFecha >= 0;
              return (
                <>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    {arriba ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block mt-1">Diferencia Acumulada</span>
                  <span className={`text-[10px] min-[360px]:text-xs xs:text-sm sm:text-base font-mono font-black block mt-0.5 ${arriba ? 'text-emerald-500' : 'text-red-400'}`}>
                    {arriba ? '+' : ''}${difFecha.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                  </span>
                </>
              );
            })()}
          </div>
          {/* Venta Promedio (PDF) */}
          <div className={`p-2.5 min-[360px]:p-3 rounded-xl border text-left ${activeTheme === 'oscuro' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
            <Receipt className="w-3.5 h-3.5 text-indigo-500 mb-1" />
            <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Venta Promedio</span>
            <span className={`text-[10px] min-[360px]:text-xs xs:text-sm sm:text-base font-mono font-black block mt-0.5 ${tc.textPrimary}`}>
              ${((myMeta?.ticket_promedio !== null && myMeta?.ticket_promedio !== undefined) ? parseFloat(myMeta.ticket_promedio) : 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {/* Facturas (PDF) */}
          <div className={`p-2.5 min-[360px]:p-3 rounded-xl border text-left ${activeTheme === 'oscuro' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
            <Percent className="w-3.5 h-3.5 text-blue-500 mb-1" />
            <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Facturas (PDF)</span>
            <span className={`text-[10px] min-[360px]:text-xs xs:text-sm sm:text-base font-mono font-black block mt-0.5 ${tc.textPrimary}`}>
              {myMeta?.facturas !== null && myMeta?.facturas !== undefined ? myMeta.facturas : 0} tks
            </span>
          </div>
          {/* Facturas por Hora (PDF) */}
          <div className={`p-2.5 min-[360px]:p-3 rounded-xl border text-left ${activeTheme === 'oscuro' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
            <Calendar className="w-3.5 h-3.5 text-violet-500 mb-1" />
            <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Facturas / Hora</span>
            <span className={`text-[10px] min-[360px]:text-xs xs:text-sm sm:text-base font-mono font-black block mt-0.5 ${tc.textPrimary}`}>
              {myMeta?.facturas_hora !== null && myMeta?.facturas_hora !== undefined ? myMeta.facturas_hora : 0} /h
            </span>
          </div>
          {/* Proyección Mensual */}
          <div className={`p-2.5 min-[360px]:p-3 rounded-xl border text-left ${activeTheme === 'oscuro' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-500 mb-1" />
            <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Proyección Mes</span>
            <span className={`text-[10px] min-[360px]:text-xs xs:text-sm sm:text-base font-mono font-black block mt-0.5 ${
              proyeccionMensual >= metaMensual ? 'text-emerald-500' : 'text-amber-500'
            }`}>
              ${proyeccionMensual.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Fila 3: Objetivos de Tienda y Comentarios de Jefatura */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Objetivos Operativos Personales (Sincronizado con Reportes) */}
        <div className={`lg:col-span-2 p-3.5 min-[380px]:p-5 rounded-2xl sm:rounded-3xl border shadow-lg flex flex-col justify-between text-left ${tc.cardBg}`} style={tc.cardBgStyle}>
          <div className="space-y-3">
            <div className="border-b pb-2.5 dark:border-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${tc.textPrimary}`}>Mis Objetivos y Métricas Personales</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-[360px]:gap-3">
              {/* Meta Diaria Personal */}
              <div className="p-2.5 min-[360px]:p-3 rounded-xl border bg-slate-500/5 dark:border-slate-800/50">
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Mi Meta Diaria</span>
                <span className={`text-[11px] min-[360px]:text-xs xs:text-sm sm:text-base font-mono font-black mt-1 block ${tc.textPrimary}`}>
                  ${(metaDiaria || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {/* Meta Semanal Personal */}
              <div className="p-2.5 min-[360px]:p-3 rounded-xl border bg-slate-500/5 dark:border-slate-800/50">
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Mi Meta Semanal</span>
                <span className={`text-[11px] min-[360px]:text-xs xs:text-sm sm:text-base font-mono font-black mt-1 block ${tc.textPrimary}`}>
                  ${(metaSemanal || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {/* Venta Promedio Personal */}
              <div className="p-2.5 min-[360px]:p-3 rounded-xl border bg-slate-500/5 dark:border-slate-800/50">
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Mi Venta Promedio</span>
                <span className={`text-[11px] min-[360px]:text-xs xs:text-sm sm:text-base font-mono font-black mt-1 block text-indigo-500`}>
                  ${((myMeta?.ticket_promedio !== null && myMeta?.ticket_promedio !== undefined) 
                    ? parseFloat(myMeta.ticket_promedio) 
                    : ventaPromedioPersonal).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {/* Conversión Personal */}
              <div className="p-2.5 min-[360px]:p-3 rounded-xl border bg-slate-500/5 dark:border-slate-800/50">
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Mi % Conversión</span>
                <span className={`text-[11px] min-[360px]:text-xs xs:text-sm sm:text-base font-mono font-black mt-1 block text-emerald-500`}>
                  {(myMeta?.conversion || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-3 border-t pt-2 dark:border-slate-800 flex justify-between items-center">
            <span>Valores personales extraídos del reporte diario de ventas y plantilla de metas</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-black uppercase">Datos Personales</span>
          </div>
        </div>

        {/* Tarjeta de Frase Motivacional del Día (Ocupa el espacio vacío a la derecha) */}
        <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-lg flex flex-col justify-between text-left relative overflow-hidden ${
          activeTheme === 'oscuro'
            ? 'bg-gradient-to-br from-indigo-500/15 via-[#0c1427] to-[#0c1427] border-indigo-500/30'
            : 'bg-gradient-to-br from-indigo-500/5 via-white to-white border-indigo-200 shadow-indigo-500/5'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3 border-b border-indigo-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Quote className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">Frase Motivacional del Día</h3>
                  <span className="text-[9px] text-slate-400 font-semibold block">Inspiración Diaria de Ventas</span>
                </div>
              </div>
              
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-indigo-400" />
                Día {actualTodayDay}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-slate-200 space-y-1.5 my-2">
              <p className="text-xs font-bold leading-relaxed text-indigo-100 italic">
                “{dailyQuote.quote}”
              </p>
              <span className="text-[9.5px] font-extrabold text-indigo-400 uppercase block tracking-wider text-right">
                — {dailyQuote.author}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-indigo-500/15 flex items-center justify-between text-[9px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              Actualización diaria para impulsar tus ventas
            </span>
            <span className="text-indigo-400 font-bold">🚀 ¡A vender!</span>
          </div>
        </div>

      </div>

      {/* Documento PDF Oficial de Metas */}
      {(storeStats?.pdf_url || localStorage.getItem('marathon_metas_pdf_url')) && (
        <PdfPreviewCard pdfUrl={storeStats?.pdf_url || localStorage.getItem('marathon_metas_pdf_url')} title="Reporte PDF Oficial de Ventas del Día" />
      )}

      {/* Planificación Diaria por Períodos */}
      <div className="space-y-4 text-left pt-2">
        <div>
          <h3 className={`text-base sm:text-lg font-title font-black uppercase tracking-wider ${tc.textPrimary}`}>Planificación de Metas Diarias por Períodos</h3>
          <span className="text-[10px] sm:text-xs text-slate-400 block mt-0.5">Tus objetivos diarios agrupados en los 4 períodos del mes (según la división de colores oficial)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Período 1 */}
          <div className={`p-3.5 min-[380px]:p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-md flex flex-col justify-between ${activeTheme === 'oscuro' ? 'bg-[#0c1427]/45 border-slate-800/80 text-white' : 'bg-white border-slate-100'} border-t-4 border-t-[#666699]/85`}>
            <div className="space-y-3">
              <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1.5 border-b pb-2 dark:border-slate-800/40">
                <span className="text-[10px] sm:text-xs font-black uppercase text-[#666699] dark:text-[#a3a3c2] tracking-wider">Período 1 (Días 1-8)</span>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded bg-[#666699]/10 text-[#666699] dark:bg-[#666699]/20 dark:text-[#c2c2d6] text-[7.5px] min-[360px]:text-[8px] font-black uppercase">
                    Vta: ${p1Venta.toLocaleString('es-EC', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#666699]/10 text-[#666699] dark:bg-[#666699]/20 dark:text-[#c2c2d6] text-[7.5px] min-[360px]:text-[8px] font-black uppercase">
                    Meta: ${p1Meta.toLocaleString('es-EC', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 min-[360px]:gap-1.5">
                {p1Days.map((dayObj) => {
                  const isToday = dayObj.dia === todayDayIndex;
                  const isDayDescanso = dayObj.goal === 0;
                  return (
                    <div 
                      key={dayObj.dia} 
                      className={`p-1 min-[360px]:p-1.5 rounded-xl border text-center transition-all ${
                        isToday 
                          ? 'bg-[#666699]/20 border-[#666699] text-white ring-1 ring-[#666699]/50 scale-105 shadow-sm'
                          : 'bg-slate-500/5 border-slate-200/50 dark:border-slate-800/40'
                      }`}
                    >
                      <div className={`text-[6.5px] min-[360px]:text-[7.5px] sm:text-[8px] font-black ${isToday ? 'text-[#a3a3c2]' : 'text-slate-400'}`}>D-{dayObj.dia}</div>
                      <div className={`text-[8px] min-[360px]:text-[9.5px] sm:text-xs font-mono font-black mt-0.5 ${isToday ? 'text-white' : tc.textPrimary}`}>
                        ${Math.round(dayObj.monto || 0)}
                      </div>
                      <div className={`text-[6.5px] min-[360px]:text-[7px] sm:text-[8px] font-bold mt-0.5 ${isToday ? 'text-[#c2c2d6]' : 'text-slate-450'}`}>
                        {isDayDescanso ? 'Libre' : `M: $${Math.round(dayObj.goal || 0)}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Período 2 */}
          <div className={`p-3.5 min-[380px]:p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-md flex flex-col justify-between ${activeTheme === 'oscuro' ? 'bg-[#0c1427]/45 border-slate-800/80 text-white' : 'bg-white border-slate-100'} border-t-4 border-t-[#339966]/85`}>
            <div className="space-y-3">
              <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1.5 border-b pb-2 dark:border-slate-800/40">
                <span className="text-[10px] sm:text-xs font-black uppercase text-[#339966] dark:text-[#7ae0a7] tracking-wider">Período 2 (Días 9-15)</span>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded bg-[#339966]/10 text-[#339966] dark:bg-[#339966]/20 dark:text-[#a8e6c5] text-[7.5px] min-[360px]:text-[8px] font-black uppercase">
                    Vta: ${p2Venta.toLocaleString('es-EC', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#339966]/10 text-[#339966] dark:bg-[#339966]/20 dark:text-[#a8e6c5] text-[7.5px] min-[360px]:text-[8px] font-black uppercase">
                    Meta: ${p2Meta.toLocaleString('es-EC', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 min-[360px]:gap-1.5">
                {p2Days.map((dayObj) => {
                  const isToday = dayObj.dia === todayDayIndex;
                  const isDayDescanso = dayObj.goal === 0;
                  return (
                    <div 
                      key={dayObj.dia} 
                      className={`p-1 min-[360px]:p-1.5 rounded-xl border text-center transition-all ${
                        isToday 
                          ? 'bg-[#339966]/20 border-[#339966] text-white ring-1 ring-[#339966]/50 scale-105 shadow-sm'
                          : 'bg-slate-500/5 border-slate-200/50 dark:border-slate-800/40'
                      }`}
                    >
                      <div className={`text-[6.5px] min-[360px]:text-[7.5px] sm:text-[8px] font-black ${isToday ? 'text-[#7ae0a7]' : 'text-slate-400'}`}>D-{dayObj.dia}</div>
                      <div className={`text-[8px] min-[360px]:text-[9.5px] sm:text-xs font-mono font-black mt-0.5 ${isToday ? 'text-white' : tc.textPrimary}`}>
                        ${Math.round(dayObj.monto || 0)}
                      </div>
                      <div className={`text-[6.5px] min-[360px]:text-[7px] sm:text-[8px] font-bold mt-0.5 ${isToday ? 'text-[#7ae0a7]' : 'text-slate-450'}`}>
                        {isDayDescanso ? 'Libre' : `M: $${Math.round(dayObj.goal || 0)}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Período 3 */}
          <div className={`p-3.5 min-[380px]:p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-md flex flex-col justify-between ${activeTheme === 'oscuro' ? 'bg-[#0c1427]/45 border-slate-800/80 text-white' : 'bg-white border-slate-100'} border-t-4 border-t-[#993366]/85`}>
            <div className="space-y-3">
              <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1.5 border-b pb-2 dark:border-slate-800/40">
                <span className="text-[10px] sm:text-xs font-black uppercase text-[#993366] dark:text-[#df82b3] tracking-wider">Período 3 (Días 16-23)</span>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded bg-[#993366]/10 text-[#993366] dark:bg-[#993366]/20 dark:text-[#f2c6dd] text-[7.5px] min-[360px]:text-[8px] font-black uppercase">
                    Vta: ${p3Venta.toLocaleString('es-EC', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#993366]/10 text-[#993366] dark:bg-[#993366]/20 dark:text-[#f2c6dd] text-[7.5px] min-[360px]:text-[8px] font-black uppercase">
                    Meta: ${p3Meta.toLocaleString('es-EC', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 min-[360px]:gap-1.5">
                {p3Days.map((dayObj) => {
                  const isToday = dayObj.dia === todayDayIndex;
                  const isDayDescanso = dayObj.goal === 0;
                  return (
                    <div 
                      key={dayObj.dia} 
                      className={`p-1 min-[360px]:p-1.5 rounded-xl border text-center transition-all ${
                        isToday 
                          ? 'bg-[#993366]/20 border-[#993366] text-white ring-1 ring-[#993366]/50 scale-105 shadow-sm'
                          : 'bg-slate-500/5 border-slate-200/50 dark:border-slate-800/40'
                      }`}
                    >
                      <div className={`text-[6.5px] min-[360px]:text-[7.5px] sm:text-[8px] font-black ${isToday ? 'text-[#df82b3]' : 'text-slate-400'}`}>D-{dayObj.dia}</div>
                      <div className={`text-[8px] min-[360px]:text-[9.5px] sm:text-xs font-mono font-black mt-0.5 ${isToday ? 'text-white' : tc.textPrimary}`}>
                        ${Math.round(dayObj.monto || 0)}
                      </div>
                      <div className={`text-[6.5px] min-[360px]:text-[7px] sm:text-[8px] font-bold mt-0.5 ${isToday ? 'text-[#df82b3]' : 'text-slate-455'}`}>
                        {isDayDescanso ? 'Libre' : `M: $${Math.round(dayObj.goal || 0)}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Período 4 */}
          <div className={`p-3.5 min-[380px]:p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-md flex flex-col justify-between ${activeTheme === 'oscuro' ? 'bg-[#0c1427]/45 border-slate-800/80 text-white' : 'bg-white border-slate-100'} border-t-4 border-t-[#F97316]/85`}>
            <div className="space-y-3">
              <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1.5 border-b pb-2 dark:border-slate-800/40">
                <span className="text-[10px] sm:text-xs font-black uppercase text-[#F97316] dark:text-[#ffb380] tracking-wider">Período 4 (Días 24-${daysInMonth})</span>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded bg-[#F97316]/10 text-[#F97316] dark:bg-[#F97316]/20 dark:text-[#ffd9bf] text-[7.5px] min-[360px]:text-[8px] font-black uppercase">
                    Vta: ${p4Venta.toLocaleString('es-EC', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#F97316]/10 text-[#F97316] dark:bg-[#F97316]/20 dark:text-[#ffd9bf] text-[7.5px] min-[360px]:text-[8px] font-black uppercase">
                    Meta: ${p4Meta.toLocaleString('es-EC', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 min-[360px]:gap-1.5">
                {p4Days.map((dayObj) => {
                  const isToday = dayObj.dia === todayDayIndex;
                  const isDayDescanso = dayObj.goal === 0;
                  return (
                    <div 
                      key={dayObj.dia} 
                      className={`p-1 min-[360px]:p-1.5 rounded-xl border text-center transition-all ${
                        isToday 
                          ? 'bg-[#F97316]/20 border-[#F97316] text-white ring-1 ring-[#F97316]/50 scale-105 shadow-sm'
                          : 'bg-slate-500/5 border-slate-200/50 dark:border-slate-800/40'
                      }`}
                    >
                      <div className={`text-[6.5px] min-[360px]:text-[7.5px] sm:text-[8px] font-black ${isToday ? 'text-[#ffb380]' : 'text-slate-400'}`}>D-{dayObj.dia}</div>
                      <div className={`text-[8px] min-[360px]:text-[9.5px] sm:text-xs font-mono font-black mt-0.5 ${isToday ? 'text-white' : tc.textPrimary}`}>
                        ${Math.round(dayObj.monto || 0)}
                      </div>
                      <div className={`text-[6.5px] min-[360px]:text-[7px] sm:text-[8px] font-bold mt-0.5 ${isToday ? 'text-[#ffb380]' : 'text-slate-455'}`}>
                        {isDayDescanso ? 'Libre' : `M: $${Math.round(dayObj.goal || 0)}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de Vista Previa de PDF usando PDF.js Canvas con Fallback de Iframe Nativo
function PdfPreviewCard({ pdfUrl, title = "Reporte de Ventas Oficial (PDF)" }) {
  const [loading, setLoading] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);

  useEffect(() => {
    if (!pdfUrl) return;
    let isMounted = true;

    const loadPdf = async () => {
      setLoading(true);
      try {
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const uint8Data = new Uint8Array(arrayBuffer);

        const loadingTask = pdfjsLib.getDocument({ data: uint8Data });
        const doc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setUseIframeFallback(false);
        }
      } catch (err) {
        console.warn("PDF.js Canvas falló, cambiando a visor PDF nativo:", err);
        if (isMounted) {
          setUseIframeFallback(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfDoc || useIframeFallback) return;
    let isMounted = true;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (!isMounted) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const containerWidth = canvas.parentElement.clientWidth || 800;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = (containerWidth - 32) / baseViewport.width;
        const finalScale = Math.min(2.0, Math.max(0.8, scale));
        
        const viewport = page.getViewport({ scale: finalScale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        await page.render(renderContext).promise;

        if (!isMounted) return;

        // Auto-recortar el espacio en blanco sobrante en la parte inferior
        const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        let lastY = canvas.height;

        for (let y = canvas.height - 1; y >= 0; y--) {
          let isRowBlank = true;
          for (let x = 0; x < canvas.width * 4; x += 16) {
            const idx = (y * canvas.width * 4) + x;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a > 10 && (r < 240 || g < 240 || b < 240)) {
              isRowBlank = false;
              break;
            }
          }
          if (!isRowBlank) {
            lastY = y;
            break;
          }
        }

        const padding = Math.round(30 * finalScale);
        const croppedHeight = Math.max(200, Math.min(canvas.height, lastY + padding));

        if (croppedHeight < canvas.height) {
          const croppedData = context.getImageData(0, 0, canvas.width, croppedHeight);
          canvas.height = croppedHeight;
          context.putImageData(croppedData, 0, 0);
        }
      } catch (err) {
        console.warn("Error renderizando página en canvas, usando visor nativo:", err);
        if (isMounted) setUseIframeFallback(true);
      }
    };

    renderPage();
    return () => {
      isMounted = false;
    };
  }, [pdfDoc, currentPage, useIframeFallback]);

  if (!pdfUrl) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">{title}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Reporte oficial subido por jefatura</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setUseIframeFallback(!useIframeFallback)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            {useIframeFallback ? '📷 Vista Imagen' : '📄 Vista Documento'}
          </button>
          <a 
            href={pdfUrl} 
            target="_blank" 
            rel="noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Descargar
          </a>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-xs text-slate-400 font-bold">Cargando reporte de ventas...</p>
        </div>
      )}

      {!loading && useIframeFallback && (
        <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
          <iframe 
            src={`${pdfUrl}#toolbar=0`} 
            className="w-full h-[550px] sm:h-[700px] border-0 bg-white" 
            title={title}
          />
        </div>
      )}

      {!loading && !useIframeFallback && (
        <>
          <div className="overflow-x-auto flex justify-center bg-slate-950/50 rounded-2xl p-2 sm:p-4 border border-slate-800/40">
            <canvas ref={canvasRef} className="max-w-full rounded-lg shadow-sm bg-white" />
          </div>

          {numPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs font-bold text-slate-400">
              <button 
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-xl transition-all"
              >
                Anterior
              </button>
              <span>Página {currentPage} de {numPages}</span>
              <button 
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-xl transition-all"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
