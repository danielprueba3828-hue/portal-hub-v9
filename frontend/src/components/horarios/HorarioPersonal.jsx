import React, { useMemo, useState, useCallback } from 'react';
import { 
  getDaysInMonthArray, 
  classifyShift, 
  calculateShiftHours 
} from '../../services/scheduleEngine';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Coffee, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  Sun, 
  Moon, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Zap,
  Info
} from 'lucide-react';

function getDaysForWeek(baseDate = new Date(), weekOffset = 0) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + (weekOffset * 7));
  
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  
  const days = [];
  const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const dayNum = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dayNum}`;
    
    days.push({
      date: current,
      dateStr,
      dayNumber: current.getDate(),
      dayNameShort: dayNames[i],
      monthNameShort: monthNames[current.getMonth()],
      fullFormatted: `${dayNames[i]} ${current.getDate()} ${monthNames[current.getMonth()]}`
    });
  }
  return days;
}

export default function HorarioPersonal({
  currentUser,
  year,
  month,
  turnosMap,
  onRequestShiftChange,
  theme = 'oscuro'
}) {
  const isLight = theme === 'clasico';
  const cedula = currentUser?.user_metadata?.cedula || currentUser?.cedula || '';
  const nombres = currentUser?.user_metadata?.nombres || currentUser?.nombres || 'Colaborador';
  const cargo = currentUser?.user_metadata?.cargo || currentUser?.cargo || 'Asesor de Ventas';
  const zona = currentUser?.user_metadata?.zona || currentUser?.zona || 'Sin Zona';

  // Verificar si el usuario es de Jefatura / Directivo
  const isDirectivo = ['jefe', 'subjefe', 'tercer', 'supervisor', 'admin'].some(r => 
    (cargo || '').toLowerCase().includes(r)
  );

  // Offset de semana para navegación (-1: anterior, 0: actual, 1: siguiente)
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Para Jefatura: opción de alternar entre vista mensual y semanal si lo desean
  const [jefaturaViewMode, setJefaturaViewMode] = useState('mensual');

  const todayDate = useMemo(() => new Date(), []);

  const todayStr = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(todayDate);
    } catch {
      const y = todayDate.getFullYear();
      const m = String(todayDate.getMonth() + 1).padStart(2, '0');
      const d = String(todayDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }, [todayDate]);

  // Días de la semana seleccionada
  const weekDays = useMemo(() => {
    return getDaysForWeek(todayDate, weekOffset);
  }, [todayDate, weekOffset]);

  // Días de todo el mes (para Jefatura)
  const allMonthDays = useMemo(() => getDaysInMonthArray(year, month), [year, month]);

  const getShift = useCallback((dateStr) => {
    const rawCed = String(cedula || '').trim();
    const paddedCed = (rawCed.length > 0 && rawCed.length < 10) ? rawCed.padStart(10, '0') : rawCed;
    const strippedCed = rawCed.replace(/^0+/, '');
    return turnosMap[`${rawCed}_${dateStr}`] || turnosMap[`${paddedCed}_${dateStr}`] || turnosMap[`${strippedCed}_${dateStr}`];
  }, [cedula, turnosMap]);

  // Estadísticas del mes (para Jefatura)
  const monthlyStats = useMemo(() => {
    let totalHours = 0;
    let daysWorked = 0;
    let daysOff = 0;

    allMonthDays.forEach(d => {
      const shift = getShift(d.dateStr);
      const classification = classifyShift(shift);

      if (classification.isOff) {
        daysOff++;
      } else {
        daysWorked++;
        totalHours += calculateShiftHours(shift);
      }
    });

    return {
      totalHours: Math.round(totalHours),
      daysWorked,
      daysOff
    };
  }, [allMonthDays, getShift]);

  // Estadísticas de la semana seleccionada (para Asesores y demás cargos)
  const weeklyStats = useMemo(() => {
    let totalHours = 0;
    let daysWorked = 0;
    let daysOff = 0;

    weekDays.forEach(d => {
      const shift = getShift(d.dateStr);
      const classification = classifyShift(shift);

      if (classification.isOff) {
        daysOff++;
      } else {
        daysWorked++;
        totalHours += calculateShiftHours(shift);
      }
    });

    return {
      totalHours: Math.round(totalHours),
      daysWorked,
      daysOff
    };
  }, [weekDays, getShift]);

  const todayShift = getShift(todayStr);
  const todayClassification = classifyShift(todayShift);

  const startWeekLabel = weekDays[0]?.fullFormatted || '';
  const endWeekLabel = weekDays[6]?.fullFormatted || '';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Hero Welcome Card */}
      <div className={`p-6 lg:p-8 rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-300 ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' 
          : 'bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border ${
                isDirectivo 
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' 
                  : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isDirectivo ? 'Planificación Mensual Jefatura' : 'Horario Oficial Semanal'}</span>
              </span>

              {zona && zona !== 'Sin Zona' && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{zona}</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
              Hola, {nombres} 👋
            </h2>
            <p className={`text-xs lg:text-sm mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {cargo} • {isDirectivo 
                ? 'Visualización integral de cronograma mensual y control de tienda.' 
                : 'Tu planificación se gestiona semanalmente para adaptarse a la rotación operativa.'}
            </p>
          </div>

          {/* Today's Shift Quick Box */}
          <div className={`w-full lg:w-auto p-4 rounded-2xl border flex items-center gap-4 shadow-xl ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className={`p-3.5 rounded-2xl border ${
              todayClassification.isOff 
                ? (isLight ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700')
                : todayClassification.category === 'Apertura'
                  ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                  : todayClassification.category === 'Intermedio'
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-500 border-blue-500/30'
            }`}>
              {todayClassification.isOff ? <Coffee className="w-6 h-6" /> : todayClassification.category === 'Apertura' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </div>
            <div>
              <div className={`text-[10px] uppercase font-black tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Turno de Hoy ({todayStr})
              </div>
              <div className="text-base font-black mt-0.5">
                {todayClassification.isOff 
                  ? 'Día Libre / Descanso' 
                  : `${todayShift?.hora_inicio || '09:30'} - ${todayShift?.hora_fin || '18:30'}`}
              </div>
              <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {todayClassification.label}
              </div>
            </div>
          </div>
        </div>

        {/* Stat KPI Chips (Semanales para Asesores, Mensuales para Jefatura) */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <div className={`p-3.5 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800/60'
          }`}>
            <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isDirectivo && jefaturaViewMode === 'mensual' ? 'Horas Mes' : 'Horas Semana'}
            </span>
            <span className="text-xl font-black text-emerald-500 font-mono mt-0.5 block">
              {isDirectivo && jefaturaViewMode === 'mensual' ? monthlyStats.totalHours : weeklyStats.totalHours}h
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800/60'
          }`}>
            <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isDirectivo && jefaturaViewMode === 'mensual' ? 'Jornadas Mes' : 'Jornadas Semana'}
            </span>
            <span className="text-xl font-black text-blue-500 font-mono mt-0.5 block">
              {isDirectivo && jefaturaViewMode === 'mensual' ? monthlyStats.daysWorked : weeklyStats.daysWorked} días
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800/60'
          }`}>
            <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isDirectivo && jefaturaViewMode === 'mensual' ? 'Libres Mes' : 'Libres Semana'}
            </span>
            <span className="text-xl font-black text-slate-400 font-mono mt-0.5 block">
              {isDirectivo && jefaturaViewMode === 'mensual' ? monthlyStats.daysOff : weeklyStats.daysOff} días
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800/60'
          }`}>
            <div>
              <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Permisos / Cambios
              </span>
              <span className="text-xs font-black text-amber-500 mt-0.5 block">
                Solicitar Permiso
              </span>
            </div>
            <button
              onClick={onRequestShiftChange}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition active:scale-95 shadow-md shadow-blue-500/25 cursor-pointer"
              title="Solicitar Permiso o Cambio"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CASO 1: ASESORES, BODEGUEROS, CAJEROS -> EXCLUSIVAMENTE VISTA SEMANAL */}
      {(!isDirectivo || jefaturaViewMode === 'semanal') ? (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl transition-all space-y-6 ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800 text-white'
        }`}>
          
          {/* Header de la Semana con Navegador */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  Horario de la Semana Actual
                </h3>
                <span className={`text-xs font-bold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                  {startWeekLabel} — {endWeekLabel}
                </span>
              </div>
            </div>

            {/* Controles de Navegación de Semanas */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(prev => prev - 1)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Semana Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Semana Anterior</span>
              </button>

              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-md transition active:scale-95 cursor-pointer"
                >
                  Semana Actual
                </button>
              )}

              <button
                onClick={() => setWeekOffset(prev => prev + 1)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Semana Siguiente"
              >
                <span className="hidden sm:inline">Semana Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Botón para Jefatura para alternar a mensual si lo requiere */}
              {isDirectivo && (
                <button
                  onClick={() => setJefaturaViewMode('mensual')}
                  className="ml-2 px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-md transition cursor-pointer"
                >
                  Ver Todo el Mes
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5">
            {weekDays.map(d => {
              const shift = getShift(d.dateStr);
              const classification = classifyShift(shift);
              const isToday = d.dateStr === todayStr;
              const hours = calculateShiftHours(shift);

              let cardBg = isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#060b17]/80 border-slate-800';
              if (isToday) {
                cardBg = isLight 
                  ? 'bg-blue-50/95 border-blue-500 ring-2 ring-blue-500/30 shadow-md shadow-blue-500/10' 
                  : 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10';
              } else if (classification.category === 'Apertura') {
                cardBg = isLight ? 'bg-emerald-50/60 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30';
              } else if (classification.category === 'Intermedio') {
                cardBg = isLight ? 'bg-amber-50/60 border-amber-300' : 'bg-amber-950/20 border-amber-500/30';
              } else if (classification.category === 'Cierre') {
                cardBg = isLight ? 'bg-indigo-50/60 border-indigo-300' : 'bg-indigo-950/20 border-indigo-500/30';
              }

              return (
                <div
                  key={d.dateStr}
                  className={`rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between min-h-[160px] ${cardBg}`}
                >
                  <div>
                    {/* Header del Día */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-xs font-black uppercase tracking-wider block ${
                          isToday ? 'text-blue-600 dark:text-blue-400 font-extrabold' : isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          {d.dayNameShort}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {d.monthNameShort}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-600 text-white tracking-wider animate-pulse">
                            HOY
                          </span>
                        )}
                        <span className={`text-sm font-black px-2.5 py-1 rounded-xl font-mono ${
                          isToday 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-200'
                        }`}>
                          {d.dayNumber}
                        </span>
                      </div>
                    </div>

                    {/* Detalle del Turno */}
                    <div className="mt-4">
                      {classification.isOff ? (
                        <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20 flex items-center gap-2">
                          <Coffee className="w-5 h-5 text-slate-400" />
                          <div>
                            <span className="text-xs font-black block text-slate-400">Descanso</span>
                            <span className="text-[10px] text-slate-500">Día Libre Oficial</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-sm font-black font-mono tracking-tight text-white">
                            {shift?.hora_inicio || '09:30'} - {shift?.hora_fin || '18:30'}
                          </div>
                          <div className={`text-[11px] font-bold ${
                            classification.category === 'Apertura' ? 'text-emerald-500' :
                            classification.category === 'Intermedio' ? 'text-amber-500' : 'text-blue-400'
                          }`}>
                            {classification.category} • 1h Almuerzo
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer con Horas Efectivas */}
                  {!classification.isOff && (
                    <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
                      isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
                    }`}>
                      <span className="font-semibold">Efectivas:</span>
                      <span className="font-mono font-black text-emerald-500">{hours}h</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* CASO 2: CRONOGRAMA MENSUAL COMPLETO (EXCLUSIVO PARA JEFATURA) */
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl transition-all space-y-6 ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800 text-white'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/30">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  Cronograma Mensual Detallado (Jefatura)
                </h3>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Período: Mes {month} / {year}
                </span>
              </div>
            </div>

            <button
              onClick={() => setJefaturaViewMode('semanal')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              Cambiar a Vista Semanal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {allMonthDays.map(d => {
              const shift = getShift(d.dateStr);
              const classification = classifyShift(shift);
              const isToday = d.dateStr === todayStr;
              const hours = calculateShiftHours(shift);

              let borderClass = isLight ? 'border-slate-200 bg-slate-50/60' : 'border-slate-800/80 bg-slate-950/60';
              if (isToday) {
                borderClass = isLight 
                  ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50' 
                  : 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-950/30';
              } else if (classification.category === 'Apertura') {
                borderClass = isLight ? 'border-emerald-200 bg-emerald-50/40' : 'border-emerald-500/30 bg-emerald-950/15';
              } else if (classification.category === 'Intermedio') {
                borderClass = isLight ? 'border-amber-200 bg-amber-50/40' : 'border-amber-500/30 bg-amber-950/15';
              } else if (classification.category === 'Cierre') {
                borderClass = isLight ? 'border-blue-200 bg-blue-50/40' : 'border-blue-500/30 bg-blue-950/15';
              }

              return (
                <div
                  key={d.dateStr}
                  className={`rounded-2xl p-4 border transition-all flex flex-col justify-between min-h-[110px] ${borderClass}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] uppercase font-black tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {d.dayNameShort}
                      </span>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        isToday 
                          ? 'bg-blue-600 text-white' 
                          : isLight ? 'bg-slate-200 text-slate-700' : 'text-slate-300 bg-slate-800'
                      }`}>
                        {d.dayNumber}
                      </span>
                    </div>

                    <div className="mt-3">
                      {classification.isOff ? (
                        <div className="text-xs font-black text-slate-500 flex items-center gap-1.5">
                          <Coffee className="w-4 h-4 text-slate-400" />
                          <span>{classification.label}</span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-black font-mono">
                            {shift?.hora_inicio || '09:30'} - {shift?.hora_fin || '18:30'}
                          </div>
                          <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {classification.category} • 1h Receso
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {!classification.isOff && (
                    <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
                      isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
                    }`}>
                      <span>Jornada:</span>
                      <span className="font-mono font-bold text-emerald-500">{hours}h efectivas</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
