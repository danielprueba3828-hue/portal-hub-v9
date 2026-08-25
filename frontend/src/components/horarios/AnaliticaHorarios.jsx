import React, { useMemo } from 'react';
import { 
  getDaysInMonthArray, 
  analyzeStaffingCoverage, 
  auditEmployeeFatigue, 
  calculateWeekendEquity,
  auditStoreRoleRules,
  ROLE_DEFINITIONS 
} from '../../services/scheduleEngine';
import { 
  BarChart3, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  Users, 
  Calendar, 
  Clock, 
  Sun, 
  Moon, 
  TrendingUp,
  Award,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function AnaliticaHorarios({
  year,
  month,
  employees,
  turnosMap,
  theme = 'oscuro'
}) {
  const isLight = theme === 'clasico';
  const days = useMemo(() => getDaysInMonthArray(year, month), [year, month]);

  // 1. Cobertura diaria
  const coverageData = useMemo(() => {
    return analyzeStaffingCoverage(days, employees, turnosMap);
  }, [days, employees, turnosMap]);

  // 2. Auditoría de fatiga y descansos legales
  const fatigueAlerts = useMemo(() => {
    return auditEmployeeFatigue(employees, days, turnosMap);
  }, [employees, days, turnosMap]);

  // 3. Auditoría de reglas operativas por cargo
  const roleViolations = useMemo(() => {
    return auditStoreRoleRules(days, employees, turnosMap);
  }, [days, employees, turnosMap]);

  // 4. Índice de equidad en fines de semana
  const equityData = useMemo(() => {
    return calculateWeekendEquity(employees, days, turnosMap);
  }, [employees, days, turnosMap]);

  // Métricas globales
  const globalSummary = useMemo(() => {
    const totalWorkingShifts = coverageData.reduce((acc, c) => acc + c.countTotalTrabajando, 0);
    const totalAperturas = coverageData.reduce((acc, c) => acc + c.countApertura, 0);
    const totalIntermedios = coverageData.reduce((acc, c) => acc + c.countIntermedio, 0);
    const totalCierres = coverageData.reduce((acc, c) => acc + c.countCierre, 0);
    const daysUnderstaffed = coverageData.filter(c => c.healthStatus === 'warning').length;

    return {
      totalWorkingShifts,
      totalAperturas,
      totalIntermedios,
      totalCierres,
      daysUnderstaffed,
      fatigueIssuesCount: fatigueAlerts.length,
      roleIssuesCount: roleViolations.length,
      coverageRate: Math.round(((days.length - daysUnderstaffed) / days.length) * 100)
    };
  }, [coverageData, fatigueAlerts, roleViolations, days]);

  return (
    <div className="space-y-6">
      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-3xl border shadow-xl transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Tasa de Cobertura
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black mt-2 font-mono">
            {globalSummary.coverageRate}%
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {globalSummary.daysUnderstaffed === 0 ? 'Dotación completa todos los días' : `${globalSummary.daysUnderstaffed} días bajo el mínimo sugerido`}
          </p>
        </div>

        <div className={`p-5 rounded-3xl border shadow-xl transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Control por Cargos
            </span>
            <div className={`p-2.5 rounded-2xl ${globalSummary.roleIssuesCount > 0 ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black mt-2 font-mono">
            {globalSummary.roleIssuesCount === 0 ? '100% OK' : `${globalSummary.roleIssuesCount} alertas`}
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {globalSummary.roleIssuesCount === 0 ? 'Líderes y cajeros cubiertos en apertura y cierre' : 'Revisar presencia de líderes/cajas'}
          </p>
        </div>

        <div className={`p-5 rounded-3xl border shadow-xl transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Auditoría de Fatiga
            </span>
            <div className={`p-2.5 rounded-2xl ${globalSummary.fatigueIssuesCount > 0 ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black mt-2 font-mono">
            {globalSummary.fatigueIssuesCount}
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {globalSummary.fatigueIssuesCount === 0 ? 'Descansos legales y rotación óptima' : 'Días consecutivos o descansos cortos'}
          </p>
        </div>

        <div className={`p-5 rounded-3xl border shadow-xl transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Jornadas Planificadas
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-500">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black mt-2 font-mono">
            {globalSummary.totalWorkingShifts}
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {globalSummary.totalAperturas} Ap • {globalSummary.totalIntermedios} Int • {globalSummary.totalCierres} Cie
          </p>
        </div>
      </div>

      {/* Alertas Operativas por Cargo */}
      {roleViolations.length > 0 && (
        <div className="p-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-black text-rose-500">
              Reglas Operativas por Cargo ({roleViolations.length} Observaciones)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roleViolations.map(v => (
              <div key={v.id} className={`p-3.5 rounded-2xl border ${
                isLight ? 'bg-white border-rose-200 text-slate-800' : 'bg-slate-900 border-rose-500/30 text-slate-200'
              }`}>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500">
                  {v.date}
                </span>
                <p className="text-xs mt-1.5 font-medium">{v.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mapa de Calor Diario */}
      <div className={`p-6 rounded-3xl border shadow-xl transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-black">
              Distribución de Personal por Día y Franja ({month}/{year})
            </h3>
          </div>
          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Apertura • Intermedio • Cierre
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {coverageData.map(c => {
            let cardBg = isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800';
            if (c.healthStatus === 'warning') cardBg = isLight ? 'bg-rose-50 border-rose-200' : 'bg-rose-950/20 border-rose-500/30';

            return (
              <div key={c.dateStr} className={`p-3 rounded-2xl border transition-all ${cardBg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-black uppercase ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    {c.dayNameShort} {c.dayNumber}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500">
                    {c.countTotalTrabajando} act
                  </span>
                </div>

                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between text-emerald-500 font-bold">
                    <span>Apertura:</span>
                    <span className="font-mono">{c.countApertura}</span>
                  </div>
                  <div className="flex justify-between text-amber-500 font-bold">
                    <span>Intermedio:</span>
                    <span className="font-mono">{c.countIntermedio}</span>
                  </div>
                  <div className="flex justify-between text-blue-500 font-bold">
                    <span>Cierre:</span>
                    <span className="font-mono">{c.countCierre}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla de Equidad de Fines de Semana */}
      <div className={`p-6 rounded-3xl border shadow-xl transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-black">
              Índice de Equidad en Fines de Semana
            </h3>
          </div>
          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Sábados y Domingos libres por colaborador
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <th className="px-4 py-3 font-bold">Colaborador</th>
                <th className="px-3 py-3 font-bold text-center">Cargo / Rol</th>
                <th className="px-3 py-3 font-bold text-center">Horas Mes</th>
                <th className="px-3 py-3 font-bold text-center">Sábados Libres</th>
                <th className="px-3 py-3 font-bold text-center">Domingos Libres</th>
                <th className="px-3 py-3 font-bold text-center">Total Finde Libres</th>
                <th className="px-3 py-3 font-bold text-center">Diagnóstico</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
              {equityData.map(item => (
                <tr key={item.cedula} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}`}>
                  <td className="px-4 py-3 font-bold">
                    {item.nombreCompleto}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${
                      isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {item.cargo}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-bold text-emerald-500">
                    {item.totalWorkHours}h
                  </td>
                  <td className="px-3 py-3 text-center font-mono">
                    {item.saturdayOffCount}
                  </td>
                  <td className="px-3 py-3 text-center font-mono">
                    {item.sundayOffCount}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-bold text-blue-500">
                    {item.weekendOffCount}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      item.weekendOffCount >= 2 
                        ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' 
                        : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                    }`}>
                      {item.equityScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
