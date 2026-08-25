import React, { useMemo } from 'react';
import { 
  classifyShift, 
  calculateShiftHours, 
  getDaysInMonthArray, 
  analyzeStaffingCoverage,
  getEmployeeRoleGroup 
} from '../../services/scheduleEngine';
import RoleGroupingView from './RoleGroupingView';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  User, 
  Sparkles,
  MapPin,
  Layers
} from 'lucide-react';

export default function MatrizHorarios({
  year,
  month,
  employees,
  turnosMap,
  onCellClick,
  activePaintShift = null,
  matrixGroupingMode = 'cargo',
  searchTerm = '',
  filterZona = 'Todos',
  isDirectivo = false,
  theme = 'oscuro',
  density = 'compacto'
}) {
  const isLight = theme === 'clasico';
  const days = useMemo(() => getDaysInMonthArray(year, month), [year, month]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Filtrar empleados
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const fullName = `${emp.nombres || ''} ${emp.apellidos || ''}`.toLowerCase();
      const cedula = String(emp.cedula || '');
      const matchesSearch = !searchTerm || fullName.includes(searchTerm.toLowerCase()) || cedula.includes(searchTerm);
      const matchesZona = filterZona === 'Todos' || (emp.zona || 'CATEGORIZACION') === filterZona;
      return matchesSearch && matchesZona;
    });
  }, [employees, searchTerm, filterZona]);

  // Análisis de cobertura
  const coverageData = useMemo(() => {
    return analyzeStaffingCoverage(days, employees, turnosMap);
  }, [days, employees, turnosMap]);

  // Renderizador de badge de turno
  const getShiftBadge = (shift) => {
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
    let bgClasses = isLight 
      ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' 
      : 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-750';

    if (classification.category === 'Apertura') {
      bgClasses = isLight 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25';
    } else if (classification.category === 'Intermedio') {
      bgClasses = isLight 
        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
        : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25';
    } else if (classification.category === 'Cierre') {
      bgClasses = isLight 
        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
        : 'bg-blue-500/15 text-blue-300 border-blue-500/40 hover:bg-blue-500/25';
    } else if (classification.category === 'Libre') {
      bgClasses = isLight 
        ? 'bg-slate-50 text-slate-400 border-slate-200' 
        : 'bg-slate-800/40 text-slate-500 border-slate-700/40';
    } else if (classification.category === 'Vacaciones') {
      bgClasses = isLight 
        ? 'bg-rose-50 text-rose-700 border-rose-200' 
        : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }

    let displayText = classification.short;
    if (shift.hora_inicio && shift.hora_fin && shift.hora_inicio !== '00:00') {
      displayText = `${shift.hora_inicio.slice(0, 5)}`;
    }

    return (
      <div 
        className={`w-full h-8 flex flex-col items-center justify-center rounded-lg border text-[11px] font-black tracking-tight transition-all duration-150 shadow-xs select-none ${bgClasses}`}
        title={`${classification.label} - ${shift.hora_inicio || '00:00'} a ${shift.hora_fin || '00:00'}`}
      >
        <span>{displayText}</span>
        {shift.hora_fin && shift.hora_fin !== '00:00' && (
          <span className="text-[9px] opacity-70 font-normal leading-none -mt-0.5">
            {shift.hora_fin.slice(0, 5)}
          </span>
        )}
      </div>
    );
  };

  // Si está activada la vista por cargos
  if (matrixGroupingMode === 'cargo') {
    return (
      <div className="space-y-6">
        <RoleGroupingView
          days={days}
          employees={filteredEmployees}
          turnosMap={turnosMap}
          onCellClick={onCellClick}
          activePaintShift={activePaintShift}
          isDirectivo={isDirectivo}
          theme={theme}
          density={density}
          todayStr={todayStr}
        />
      </div>
    );
  }

  // Helper para acortar nombres largos (Primer nombre + Primer apellido)
  const formatAdvisorShortName = (nombres = '', apellidos = '') => {
    const n = (nombres || '').trim().split(/\s+/).filter(Boolean);
    const a = (apellidos || '').trim().split(/\s+/).filter(Boolean);
    const firstName = n[0] || 'Asesor';
    const lastName = a[0] || '';
    return `${firstName} ${lastName}`.trim();
  };

  // Vista plana estándar
  return (
    <div className={`rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ${
      isLight 
        ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' 
        : 'bg-slate-900/90 border-slate-800 text-white shadow-xl'
    }`}>
      <div className="overflow-x-auto overflow-y-auto max-h-[75vh] scrollbar-thin">
        <table className="w-full border-collapse text-left text-xs min-w-[700px] sm:min-w-[950px]">
          <thead>
            <tr className={`sticky top-0 z-30 border-b ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950/95 border-slate-800 text-slate-300'
            }`}>
              <th className={`sticky left-0 z-40 px-2 sm:px-4 py-2 sm:py-3 w-[125px] min-w-[125px] max-w-[130px] sm:w-[175px] sm:min-w-[175px] md:w-64 md:min-w-[240px] font-black border-r ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/95 border-slate-800'
              }`}>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
                  <span className="truncate text-[10px] sm:text-xs">Colaborador</span>
                </div>
              </th>

              {days.map(d => {
                const isToday = d.dateStr === todayStr;
                return (
                  <th
                    key={d.dateStr}
                    className={`px-0.5 sm:px-1.5 py-1.5 sm:py-2 text-center min-w-[42px] sm:min-w-[54px] border-r font-semibold select-none ${
                      isLight ? 'border-slate-200' : 'border-slate-800/60'
                    } ${
                      isToday 
                        ? 'bg-blue-600/20 text-blue-600 dark:text-blue-300 border-b-2 border-b-blue-500' 
                        : d.isWeekend 
                          ? isLight ? 'bg-amber-50 text-amber-700' : 'bg-slate-800/40 text-amber-300/90' 
                          : isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    <div className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider opacity-80">
                      {d.dayNameShort}
                    </div>
                    <div className={`text-xs sm:text-sm font-black mt-0.5 ${isToday ? 'text-blue-500' : ''}`}>
                      {d.dayNumber}
                    </div>
                  </th>
                );
              })}

              <th className={`px-2 sm:px-3 py-2 sm:py-3 text-center w-12 sm:w-16 min-w-[50px] sm:min-w-[90px] font-black border-l sticky right-0 z-30 ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950/95 border-slate-800 text-slate-300'
              }`}>
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[9px] sm:text-xs">Hrs/Lib</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={days.length + 2} className="px-6 py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No se encontraron colaboradores con los filtros seleccionados.</p>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp, empIdx) => {
                let totalHours = 0;
                let daysOff = 0;

                days.forEach(d => {
                  const shift = turnosMap[`${emp.cedula}_${d.dateStr}`];
                  const classification = classifyShift(shift);
                  if (classification.isOff) {
                    daysOff++;
                  } else {
                    totalHours += calculateShiftHours(shift);
                  }
                });

                const shortName = formatAdvisorShortName(emp.nombres, emp.apellidos);

                return (
                  <tr 
                    key={emp.cedula}
                    className={`transition-colors group ${
                      isLight 
                        ? empIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50' 
                        : empIdx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/80'
                    } ${isLight ? 'hover:bg-blue-50/40' : 'hover:bg-slate-800/40'}`}
                  >
                    <td className={`sticky left-0 z-20 px-2 sm:px-4 py-1.5 sm:py-2.5 w-[125px] min-w-[125px] max-w-[130px] sm:w-[175px] sm:min-w-[175px] md:w-64 md:min-w-[240px] border-r font-medium shadow-sm ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}>
                      <div className="min-w-0">
                        <div className={`text-[11px] sm:text-xs font-black truncate transition-colors ${
                          isLight ? 'text-slate-900 group-hover:text-blue-600' : 'text-white group-hover:text-blue-300'
                        }`} title={`${emp.nombres} ${emp.apellidos}`}>
                          {shortName}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 truncate">{emp.cargo || 'Asesor'}</span>
                        </div>
                        {emp.zona && (
                          <div className="mt-0.5">
                            <span className={`px-1.5 py-0.2 rounded-md text-[8px] font-extrabold border truncate block max-w-full ${
                              emp.zona.includes('HOMBRE') ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                              emp.zona.includes('MUJER') ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' :
                              emp.zona.includes('ROTATIVO') ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              emp.zona.includes('CATEGORIZACION') ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                              'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            }`}>
                              {emp.zona}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {days.map(d => {
                      const shift = turnosMap[`${emp.cedula}_${d.dateStr}`];
                      const isToday = d.dateStr === todayStr;

                      return (
                        <td
                          key={d.dateStr}
                          onClick={() => isDirectivo && onCellClick(emp, d.dateStr, shift)}
                          className={`px-1 py-1.5 text-center border-r ${
                            isLight ? 'border-slate-200/60' : 'border-slate-800/40'
                          } ${
                            isDirectivo ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/50 hover:z-10' : ''
                          } ${isToday ? 'bg-blue-500/10' : d.isWeekend ? (isLight ? 'bg-amber-50/40' : 'bg-slate-800/20') : ''}`}
                        >
                          {getShiftBadge(shift)}
                        </td>
                      );
                    })}

                    <td className={`sticky right-0 z-20 px-3 py-2.5 text-center border-l font-bold shadow-sm ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}>
                      <div className="text-xs text-emerald-500 font-mono font-black">
                        {Math.round(totalHours)}h
                      </div>
                      <div className={`text-[10px] font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {daysOff} libres
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          <tfoot>
            <tr className={`sticky bottom-0 z-30 border-t-2 ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-950/95 border-slate-700 text-slate-300'
            }`}>
              <td className={`sticky left-0 z-40 px-4 py-3 font-black text-xs border-r ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/95 border-slate-800'
              }`}>
                <span>Personal Activo / Día</span>
              </td>

              {coverageData.map(c => {
                const isToday = c.dateStr === todayStr;
                let badgeClass = 'text-emerald-500 bg-emerald-500/10';
                if (c.healthStatus === 'warning') badgeClass = 'text-rose-500 bg-rose-500/10';
                else if (c.healthStatus === 'caution') badgeClass = 'text-amber-500 bg-amber-500/10';

                return (
                  <td
                    key={c.dateStr}
                    className={`px-1 py-2 text-center border-r text-xs font-mono font-bold ${
                      isLight ? 'border-slate-200' : 'border-slate-800/60'
                    } ${isToday ? 'bg-blue-500/15' : ''}`}
                  >
                    <div className={`rounded py-0.5 ${badgeClass}`} title={`${c.healthLabel}: ${c.countTotalTrabajando} trabajando`}>
                      {c.countTotalTrabajando}
                    </div>
                  </td>
                );
              })}

              <td className={`sticky right-0 z-40 px-3 py-3 text-center border-l font-bold text-xs ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/95 border-slate-800'
              }`}>
                -
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
