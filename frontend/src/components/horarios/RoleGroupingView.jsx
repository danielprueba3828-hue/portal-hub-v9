import React, { useState, useMemo } from 'react';
import { 
  ROLE_DEFINITIONS, 
  getEmployeeRoleGroup, 
  classifyShift, 
  calculateShiftHours 
} from '../../services/scheduleEngine';
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Clock, 
  Sparkles,
  MapPin
} from 'lucide-react';

export default function RoleGroupingView({
  days,
  employees,
  turnosMap,
  onCellClick,
  activePaintShift,
  isDirectivo,
  theme = 'oscuro',
  density = 'compacto',
  todayStr
}) {
  const isLight = theme === 'clasico';
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (groupKey) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const groupedEmployees = useMemo(() => {
    const groups = {
      JEFATURA: [],
      CAJAS: [],
      BODEGA: [],
      ASESORES: []
    };

    employees.forEach(emp => {
      const g = getEmployeeRoleGroup(emp.cargo);
      if (groups[g.key]) {
        groups[g.key].push(emp);
      } else {
        groups.ASESORES.push(emp);
      }
    });

    return groups;
  }, [employees]);

  // Estilo visual del chip de turno
  const renderShiftCell = (shift) => {
    if (!shift) {
      return (
        <div className={`w-full h-8 flex items-center justify-center text-[10px] font-mono ${
          isLight ? 'text-slate-400' : 'text-slate-600'
        }`}>
          -
        </div>
      );
    }

    const classification = classifyShift(shift);
    let bgStyle = isLight 
      ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' 
      : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-750';

    if (classification.category === 'Apertura') {
      bgStyle = isLight 
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 shadow-xs' 
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-xs';
    } else if (classification.category === 'Intermedio') {
      bgStyle = isLight 
        ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 shadow-xs' 
        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-xs';
    } else if (classification.category === 'Cierre') {
      bgStyle = isLight 
        ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 shadow-xs' 
        : 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30 shadow-xs';
    } else if (classification.category === 'Libre') {
      bgStyle = isLight 
        ? 'bg-slate-50 text-slate-400 border-slate-200' 
        : 'bg-slate-800/40 text-slate-500 border-slate-700/30';
    } else if (classification.category === 'Vacaciones') {
      bgStyle = isLight 
        ? 'bg-rose-100 text-rose-800 border-rose-300' 
        : 'bg-rose-500/25 text-rose-300 border-rose-500/40';
    }

    const displayText = (shift.hora_inicio && shift.hora_fin && shift.hora_inicio !== '00:00')
      ? `${shift.hora_inicio.slice(0, 5)}`
      : classification.short;

    return (
      <div 
        className={`w-full h-8 flex flex-col items-center justify-center rounded-lg border text-[11px] font-black tracking-tight transition-all duration-150 shadow-xs select-none ${bgStyle}`}
        title={`${classification.label}: ${shift.hora_inicio || '00:00'} - ${shift.hora_fin || '00:00'}`}
      >
        <span>{displayText}</span>
        {shift.hora_fin && shift.hora_fin !== '00:00' && (
          <span className="text-[9px] opacity-75 font-normal leading-none -mt-0.5">
            {shift.hora_fin.slice(0, 5)}
          </span>
        )}
      </div>
    );
  };

  const getGroupBadgeColor = (key) => {
    if (key === 'JEFATURA') return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    if (key === 'CAJAS') return 'bg-teal-500/15 text-teal-400 border-teal-500/30';
    if (key === 'BODEGA') return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  };

  // Helper visual para el badge de Zona
  const getZoneBadgeStyle = (zona) => {
    const z = (zona || '').toUpperCase().trim();
    if (z.includes('HOMBRE')) return {
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      label: '👕 ZONA HOMBRE'
    };
    if (z.includes('MUJER')) return {
      badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      label: '👗 ZONA MUJER'
    };
    if (z.includes('ROTATIVO')) return {
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      label: '🔄 ROTATIVO'
    };
    if (z.includes('CATEGORIZACION')) return {
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      label: '🏷️ CATEGORIZACIÓN'
    };
    if (z.includes('BODEGA')) return {
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      label: '📦 BODEGA'
    };
    if (z.includes('CAJA')) return {
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      label: '💰 CAJA'
    };
    if (z.includes('JEFATURA')) return {
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      label: '👑 JEFATURA'
    };
    if (z.includes('OPERATIVO')) return {
      badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      label: '⚙️ OPERATIVO'
    };
    return {
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      label: zona || 'ZONA GENERAL'
    };
  };

  // Helper para acortar nombres largos (Primer nombre + Primer apellido)
  const formatAdvisorShortName = (nombres = '', apellidos = '') => {
    const n = (nombres || '').trim().split(/\s+/).filter(Boolean);
    const a = (apellidos || '').trim().split(/\s+/).filter(Boolean);
    const firstName = n[0] || 'Asesor';
    const lastName = a[0] || '';
    return `${firstName} ${lastName}`.trim();
  };

  return (
    <div className="space-y-4">
      {Object.entries(ROLE_DEFINITIONS).map(([groupKey, groupDef]) => {
        const groupList = groupedEmployees[groupKey] || [];
        if (groupList.length === 0) return null;

        const isCollapsed = !!collapsedGroups[groupKey];
        const badgeColor = getGroupBadgeColor(groupKey);

        return (
          <div 
            key={groupKey}
            className={`rounded-3xl border transition-all overflow-hidden shadow-xl ${
              isLight 
                ? 'bg-white border-slate-200' 
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            {/* Group Accordion Header */}
            <div 
              onClick={() => toggleGroup(groupKey)}
              className={`px-3 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 cursor-pointer select-none transition-colors border-b ${
                isLight 
                  ? 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200' 
                  : 'bg-slate-950/60 hover:bg-slate-950/90 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-base sm:text-lg">{groupDef.icon}</span>
                <h3 className={`font-title font-black text-xs sm:text-sm uppercase tracking-wider ${
                  isLight ? 'text-slate-800' : 'text-white'
                }`}>
                  {groupDef.title}
                </h3>
                <span className={`text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                  {groupList.length} colaborad.
                </span>
              </div>

              {/* Si es el grupo de Asesores, mostrar resumen de zonas en cabecera */}
              {groupKey === 'ASESORES' && (
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap text-[8px] sm:text-[9px] font-bold">
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    👕 Hombre: {groupList.filter(e => (e.zona || '').includes('HOMBRE')).length}
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-300 border border-pink-500/30">
                    👗 Mujer: {groupList.filter(e => (e.zona || '').includes('MUJER')).length}
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    🏷️ Categ.: {groupList.filter(e => (e.zona || '').includes('CATEGORIZACION')).length}
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    🔄 Rot.: {groupList.filter(e => (e.zona || '').includes('ROTATIVO')).length}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {isCollapsed ? 'Expandir' : 'Colapsar'}
                </span>
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Matrix Table for this Group */}
            {!isCollapsed && (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse min-w-[700px] sm:min-w-[950px]">
                  <thead>
                    <tr className={`border-b text-[9px] sm:text-[10px] uppercase font-black tracking-wider ${
                      isLight 
                        ? 'bg-slate-100/90 border-slate-200 text-slate-700' 
                        : 'bg-slate-950/90 border-slate-800 text-slate-400'
                    }`}>
                      <th className={`py-2 px-2 sm:px-4 sticky left-0 z-20 w-[136px] min-w-[136px] max-w-[140px] sm:w-[175px] sm:min-w-[175px] md:w-64 md:min-w-[240px] border-r shadow-md font-black ${
                        isLight ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                      }`}>
                        Colaborador
                      </th>
                      {days.map(day => {
                        const isWeekend = day.dayOfWeek === 'Sáb' || day.dayOfWeek === 'Dom';
                        const isToday = day.dateStr === todayStr;

                        return (
                          <th 
                            key={day.dayNumber}
                            className={`py-1.5 px-0.5 sm:px-1 text-center font-mono w-9 sm:w-10 shrink-0 ${
                              isToday 
                                ? (isLight ? 'bg-blue-100 text-blue-800 font-black' : 'bg-blue-600/30 text-blue-300 font-black') 
                                : isWeekend 
                                ? (isLight ? 'bg-slate-200/50 text-slate-700' : 'bg-slate-800/40 text-slate-400') 
                                : ''
                            }`}
                          >
                            <span className="block text-[7px] sm:text-[8px] opacity-75">{day.dayOfWeek}</span>
                            <span className="text-[11px] sm:text-xs font-bold">{day.dayNumber}</span>
                          </th>
                        );
                      })}
                      <th className="py-2 px-2 text-center w-12 sm:w-16">Horas</th>
                      <th className="py-2 px-2 text-center w-12 sm:w-16">Libres</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
                    {groupList.map(emp => {
                      let totalHours = 0;
                      let totalDaysOff = 0;
                      const zoneInfo = getZoneBadgeStyle(emp.zona);
                      const shortName = formatAdvisorShortName(emp.nombres, emp.apellidos);

                      return (
                        <tr 
                          key={emp.cedula}
                          className={`transition-colors ${
                            isLight 
                              ? 'hover:bg-blue-50/40 text-slate-800' 
                              : 'hover:bg-slate-800/30 text-slate-200'
                          }`}
                        >
                          {/* Colaborador Info con Identificación Visual de Zona */}
                          <td className={`py-1.5 sm:py-2.5 px-2 sm:px-4 sticky left-0 z-10 w-[136px] min-w-[136px] max-w-[140px] sm:w-[175px] sm:min-w-[175px] md:w-64 md:min-w-[240px] border-r shadow-md font-bold text-xs ${
                            isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                          }`}>
                            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-[9px] sm:text-[10px] flex items-center justify-center shrink-0 shadow-md">
                                {(emp.nombres || '').charAt(0)}{(emp.apellidos || '').charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className={`block truncate leading-tight font-black text-[11px] sm:text-xs ${
                                  isLight ? 'text-slate-900' : 'text-white'
                                }`} title={`${emp.nombres} ${emp.apellidos}`}>
                                  {shortName}
                                </span>
                                
                                <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                                  <span className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                                    {emp.cargo}
                                  </span>
                                </div>
                                {emp.zona && (
                                  <div className="mt-0.5">
                                    <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-md border truncate block max-w-full ${zoneInfo.badge}`}>
                                      {zoneInfo.label}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Días del mes */}
                          {days.map(day => {
                            const turno = turnosMap[`${emp.cedula}_${day.dateStr}`];
                            const isToday = day.dateStr === todayStr;

                            if (turno) {
                              const hrs = calculateShiftHours(turno);
                              totalHours += hrs;
                              if (hrs === 0) totalDaysOff += 1;
                            } else {
                              totalDaysOff += 1;
                            }

                            return (
                              <td 
                                key={day.dayNumber}
                                onClick={() => onCellClick(emp, day.dateStr, turno)}
                                className={`p-0.5 text-center cursor-pointer transition-all ${
                                  isToday ? (isLight ? 'bg-blue-50/60' : 'bg-blue-950/20') : ''
                                } ${activePaintShift ? 'hover:scale-105 hover:z-20' : ''}`}
                              >
                                {renderShiftCell(turno)}
                              </td>
                            );
                          })}

                          {/* Totales */}
                          <td className="py-2 px-3 text-center font-mono font-bold text-xs text-blue-400">
                            {totalHours}h
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-xs text-slate-400">
                            {totalDaysOff}d
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
