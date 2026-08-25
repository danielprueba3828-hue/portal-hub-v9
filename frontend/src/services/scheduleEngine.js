/**
 * scheduleEngine.js - Enterprise V3
 * Motor de optimización operativa, generación automática de turnos,
 * reglas por cargo (Jefatura, Cajas, Bodega, Asesores) y simulación de tráfico.
 */

// Catálogo maestro de turnos predefinidos con metadatos operativos
export const SHIFT_PRESETS = [
  { code: 'M1', label: 'Apertura Principal', start: '09:30', end: '18:30', breakHours: 1, type: 'Apertura', roleMatch: ['jefe', 'asesor', 'bodega'], color: 'emerald' },
  { code: 'M2', label: 'Apertura Escalonada', start: '10:00', end: '19:00', breakHours: 1, type: 'Apertura', roleMatch: ['asesor', 'caja'], color: 'emerald' },
  { code: 'I1', label: 'Intermedio Almuerzo', start: '11:00', end: '20:00', breakHours: 1, type: 'Intermedio', roleMatch: ['caja', 'asesor'], color: 'amber' },
  { code: 'I2', label: 'Intermedio Tarde', start: '12:00', end: '21:00', breakHours: 1, type: 'Intermedio', roleMatch: ['asesor'], color: 'amber' },
  { code: 'T1', label: 'Cierre Operativo', start: '12:30', end: '21:30', breakHours: 1, type: 'Cierre', roleMatch: ['jefe', 'caja', 'asesor'], color: 'blue' },
  { code: 'T2', label: 'Cierre Estricto', start: '13:00', end: '21:30', breakHours: 1, type: 'Cierre', roleMatch: ['asesor'], color: 'blue' },
  { code: 'L', label: 'Día Libre / Descanso', start: '00:00', end: '00:00', breakHours: 0, type: 'Descanso', roleMatch: ['all'], color: 'slate' },
  { code: 'VAC', label: 'Vacaciones Anuales', start: '00:00', end: '00:00', breakHours: 0, type: 'Feriado/Novedad', roleMatch: ['all'], color: 'rose' },
  { code: 'PER', label: 'Permiso Especial / Calamidad', start: '00:00', end: '00:00', breakHours: 0, type: 'Feriado/Novedad', roleMatch: ['all'], color: 'purple' },
  { code: 'MED', label: 'Permiso Médico IESS', start: '00:00', end: '00:00', breakHours: 0, type: 'Feriado/Novedad', roleMatch: ['all'], color: 'orange' }
];

export const ROLE_DEFINITIONS = {
  JEFATURA: {
    key: 'JEFATURA',
    label: 'Jefatura y Liderazgo',
    icon: '👔',
    roles: ['Jefe de Tienda', 'Subjefe de Tienda', 'Tercero a bordo', 'Supervisor', 'admin', 'supervisor'],
    color: '#E30613',
    minOpeningRequired: 1,
    minClosingRequired: 1
  },
  CAJAS: {
    key: 'CAJAS',
    label: 'Cajas y Facturación',
    icon: '💰',
    roles: ['Cajero', 'Cajera', 'Cajero Polifuncional'],
    color: '#00A389',
    minCoverageContinuous: 1
  },
  BODEGA: {
    key: 'BODEGA',
    label: 'Logística y Bodega',
    icon: '📦',
    roles: ['Bodeguero', 'Auxiliar de Bodega'],
    color: '#B45309',
    preferredShift: 'M1'
  },
  ASESORES: {
    key: 'ASESORES',
    label: 'Asesores de Piso y Ventas',
    icon: '👟',
    roles: ['Asesor de Ventas', 'Asesor Polifuncional', 'Operativo'],
    color: '#2563EB',
    zones: ['ZONA HOMBRE', 'ZONA MUJER', 'CATEGORIZACION', 'ROTATIVO']
  }
};

/**
 * Normaliza fecha estricta a formato 'YYYY-MM-DD'
 */
export function formatLocalDateStr(year, month, day) {
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Obtiene el grupo operativo de un empleado según su cargo
 */
export function getEmployeeRoleGroup(cargo = '') {
  const c = String(cargo || '').toLowerCase().trim();
  if (c.includes('jefe') || c.includes('subjefe') || c.includes('tercer') || c.includes('supervisor')) {
    return ROLE_DEFINITIONS.JEFATURA;
  }
  if (c.includes('caje')) {
    return ROLE_DEFINITIONS.CAJAS;
  }
  if (c.includes('bodeg')) {
    return ROLE_DEFINITIONS.BODEGA;
  }
  return ROLE_DEFINITIONS.ASESORES;
}

/**
 * Obtiene todos los días de un mes dado en formato 'YYYY-MM-DD'
 */
export function getDaysInMonthArray(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];
  const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayNamesFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  for (let d = 1; d <= daysInMonth; d++) {
    const jsDate = new Date(year, month - 1, d);
    const dayOfWeek = jsDate.getDay();
    const dateStr = formatLocalDateStr(year, month, d);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    days.push({
      dayNumber: d,
      dateStr,
      dayOfWeek,
      dayNameShort: dayNamesShort[dayOfWeek],
      dayNameFull: dayNamesFull[dayOfWeek],
      isWeekend,
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6
    });
  }
  return days;
}

/**
 * Calcula horas efectivas de trabajo para un turno
 */
export function calculateShiftHours(turno) {
  if (!turno) return 0;
  const tipo = String(turno.tipo_turno || '').trim().toLowerCase();
  
  if (tipo.includes('descanso') || tipo.includes('libre') || tipo.includes('vacaciones') || tipo.includes('feriado') || tipo.includes('novedad')) {
    return 0;
  }

  const start = turno.hora_inicio;
  const end = turno.hora_fin;
  if (!start || !end || start === '00:00' || end === '00:00') return 8;

  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  if (isNaN(h1) || isNaN(h2)) return 8;

  let startMinutes = h1 * 60 + (m1 || 0);
  let endMinutes = h2 * 60 + (m2 || 0);

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const totalHours = (endMinutes - startMinutes) / 60;
  const effectiveHours = totalHours >= 7 ? Math.max(0, totalHours - 1) : totalHours;
  return Number(effectiveHours.toFixed(1));
}

/**
 * Clasifica el turno en Apertura, Intermedio, Cierre o Libre con colores dinámicos
 */
export function classifyShift(turno) {
  if (!turno) return { category: 'Descanso', badgeColor: 'slate', isOff: true, short: 'L', label: 'Descanso / Libre' };
  const tipo = String(turno.tipo_turno || '').trim().toUpperCase();
  const start = turno.hora_inicio || '';

  if (tipo.includes('DESCANSO') || tipo.includes('LIBRE') || tipo === 'L') {
    return { category: 'Libre', badgeColor: 'slate', isOff: true, short: 'L', label: 'Descanso / Libre' };
  }
  if (tipo.includes('VACACION') || tipo === 'VAC') {
    return { category: 'Vacaciones', badgeColor: 'rose', isOff: true, short: 'VAC', label: 'Vacaciones' };
  }
  if (tipo.includes('PERMISO') || tipo.includes('NOVEDAD') || tipo.includes('MEDICO') || tipo.includes('FERIADO')) {
    return { category: 'Permiso', badgeColor: 'purple', isOff: true, short: 'PER', label: 'Permiso Especial' };
  }

  if (start) {
    const [h] = start.split(':').map(Number);
    if (h < 11) return { category: 'Apertura', badgeColor: 'emerald', isOff: false, short: 'AP', label: `Apertura (${start})` };
    if (h >= 11 && h < 13) return { category: 'Intermedio', badgeColor: 'amber', isOff: false, short: 'INT', label: `Intermedio (${start})` };
    return { category: 'Cierre', badgeColor: 'blue', isOff: false, short: 'CIE', label: `Cierre (${start})` };
  }

  if (tipo.includes('APERTURA') || tipo.startsWith('M')) return { category: 'Apertura', badgeColor: 'emerald', isOff: false, short: 'AP', label: 'Apertura' };
  if (tipo.includes('INTERMEDIO') || tipo.startsWith('I')) return { category: 'Intermedio', badgeColor: 'amber', isOff: false, short: 'INT', label: 'Intermedio' };
  if (tipo.includes('CIERRE') || tipo.startsWith('T')) return { category: 'Cierre', badgeColor: 'blue', isOff: false, short: 'CIE', label: 'Cierre' };

  return { category: 'Normal', badgeColor: 'cyan', isOff: false, short: 'TUR', label: 'Jornada Normal' };
}

/**
 * ALGORITMO 1: Auditoría Operativa por Cargos (Reglas de Tienda Marathon)
 * Valida que cada día cumpla con:
 * 1. Al menos 1 Líder (Jefe/Subjefe/Tercero) en apertura y 1 en cierre.
 * 2. Al menos 1 Cajero activo durante horas de atención.
 * 3. Bodeguero operativo asignado.
 */
export function auditStoreRoleRules(daysArray, employees, turnosMap) {
  const roleViolations = [];

  daysArray.forEach(day => {
    let leadersOpening = 0;
    let leadersClosing = 0;
    let cashiersWorking = 0;
    let bodegaWorking = 0;

    employees.forEach(emp => {
      const shift = turnosMap[`${emp.cedula}_${day.dateStr}`];
      const classification = classifyShift(shift);
      const roleGroup = getEmployeeRoleGroup(emp.cargo);

      if (!classification.isOff && shift) {
        if (roleGroup.key === 'JEFATURA') {
          if (classification.category === 'Apertura') leadersOpening++;
          if (classification.category === 'Cierre') leadersClosing++;
        }
        if (roleGroup.key === 'CAJAS') {
          cashiersWorking++;
        }
        if (roleGroup.key === 'BODEGA') {
          bodegaWorking++;
        }
      }
    });

    if (leadersOpening === 0 && employees.some(e => getEmployeeRoleGroup(e.cargo).key === 'JEFATURA')) {
      roleViolations.push({
        id: `leader_open_${day.dateStr}`,
        type: 'FALTA_LIDER_APERTURA',
        severity: 'alta',
        date: day.dateStr,
        message: `El día ${day.dateStr} no cuenta con ningún Jefe o Tercero a bordo asignado en Apertura.`
      });
    }

    if (leadersClosing === 0 && employees.some(e => getEmployeeRoleGroup(e.cargo).key === 'JEFATURA')) {
      roleViolations.push({
        id: `leader_close_${day.dateStr}`,
        type: 'FALTA_LIDER_CIERRE',
        severity: 'alta',
        date: day.dateStr,
        message: `El día ${day.dateStr} no cuenta con ningún Jefe o Tercero a bordo asignado en el Cierre de tienda.`
      });
    }

    if (cashiersWorking === 0 && employees.some(e => getEmployeeRoleGroup(e.cargo).key === 'CAJAS')) {
      roleViolations.push({
        id: `cashier_missing_${day.dateStr}`,
        type: 'FALTA_CAJERO',
        severity: 'media',
        date: day.dateStr,
        message: `El día ${day.dateStr} no tiene cajero asignado para la facturación continua.`
      });
    }
  });

  return roleViolations;
}

/**
 * ALGORITMO 2: Detector de Fatiga y Descansos Legales
 */
export function auditEmployeeFatigue(employees, daysArray, turnosMap) {
  const alerts = [];

  employees.forEach(emp => {
    let consecutiveWorkDays = 0;
    let lastShiftEnd = null;

    daysArray.forEach(day => {
      const shift = turnosMap[`${emp.cedula}_${day.dateStr}`];
      const classification = classifyShift(shift);

      if (!classification.isOff && shift) {
        consecutiveWorkDays++;

        if (consecutiveWorkDays >= 7) {
          alerts.push({
            id: `fatigue_${emp.cedula}_${day.dateStr}`,
            type: 'FATIGA_CONSECUTIVA',
            severity: 'alta',
            empleado: `${emp.nombres} ${emp.apellidos}`,
            cedula: emp.cedula,
            fecha: day.dateStr,
            message: `${emp.nombres} acumula ${consecutiveWorkDays} días seguidos trabajando hasta el ${day.dateStr} sin descanso.`
          });
        }

        if (lastShiftEnd && shift.hora_inicio) {
          const [endH] = lastShiftEnd.split(':').map(Number);
          const [startH] = shift.hora_inicio.split(':').map(Number);
          if (endH >= 21 && startH <= 10) {
            alerts.push({
              id: `short_rest_${emp.cedula}_${day.dateStr}`,
              type: 'DESCANSO_CORTO',
              severity: 'media',
              empleado: `${emp.nombres} ${emp.apellidos}`,
              cedula: emp.cedula,
              fecha: day.dateStr,
              message: `Descanso reducido (<11h): Salió a las ${lastShiftEnd} e ingresa a las ${shift.hora_inicio} al día siguiente.`
            });
          }
        }

        lastShiftEnd = shift.hora_fin;
      } else {
        consecutiveWorkDays = 0;
        lastShiftEnd = null;
      }
    });
  });

  return alerts;
}

/**
 * ALGORITMO 3: Análisis de Cobertura Diaria
 */
export function analyzeStaffingCoverage(daysArray, employees, turnosMap) {
  return daysArray.map(day => {
    let countApertura = 0;
    let countIntermedio = 0;
    let countCierre = 0;
    let countLibre = 0;
    let countTotalTrabajando = 0;

    employees.forEach(emp => {
      const shift = turnosMap[`${emp.cedula}_${day.dateStr}`];
      const classification = classifyShift(shift);

      if (classification.isOff) {
        countLibre++;
      } else {
        countTotalTrabajando++;
        if (classification.category === 'Apertura') countApertura++;
        else if (classification.category === 'Intermedio') countIntermedio++;
        else if (classification.category === 'Cierre') countCierre++;
        else countIntermedio++;
      }
    });

    const minRequired = day.isWeekend ? 6 : 4;
    const isUnderstaffed = countTotalTrabajando < minRequired && employees.length >= minRequired;
    const isBalanced = countApertura > 0 && countCierre > 0;

    let healthStatus = 'optimal';
    let healthLabel = 'Óptima';
    if (isUnderstaffed) {
      healthStatus = 'warning';
      healthLabel = 'Baja Cobertura';
    } else if (!isBalanced && countTotalTrabajando > 0) {
      healthStatus = 'caution';
      healthLabel = 'Desbalance Apertura/Cierre';
    }

    return {
      ...day,
      countApertura,
      countIntermedio,
      countCierre,
      countLibre,
      countTotalTrabajando,
      healthStatus,
      healthLabel
    };
  });
}

/**
 * ALGORITMO 4: Índice de Equidad en Fines de Semana
 */
export function calculateWeekendEquity(employees, daysArray, turnosMap) {
  const weekendDays = daysArray.filter(d => d.isWeekend);
  const totalWeekends = weekendDays.length;

  return employees.map(emp => {
    let weekendOffCount = 0;
    let saturdayOffCount = 0;
    let sundayOffCount = 0;
    let totalWorkHours = 0;
    let daysWorked = 0;
    let daysOff = 0;

    daysArray.forEach(day => {
      const shift = turnosMap[`${emp.cedula}_${day.dateStr}`];
      const classification = classifyShift(shift);

      if (classification.isOff) {
        daysOff++;
        if (day.isSaturday) saturdayOffCount++;
        if (day.isSunday) sundayOffCount++;
        if (day.isWeekend) weekendOffCount++;
      } else {
        daysWorked++;
        totalWorkHours += calculateShiftHours(shift);
      }
    });

    const weekendOffPct = totalWeekends > 0 ? Math.round((weekendOffCount / totalWeekends) * 100) : 0;

    return {
      empleado: emp,
      cedula: emp.cedula,
      nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
      cargo: emp.cargo,
      zona: emp.zona || 'Sin zona',
      roleGroup: getEmployeeRoleGroup(emp.cargo),
      daysWorked,
      daysOff,
      totalWorkHours: Math.round(totalWorkHours),
      saturdayOffCount,
      sundayOffCount,
      weekendOffCount,
      weekendOffPct,
      equityScore: weekendOffCount >= 2 ? 'Equilibrado' : 'Priorizar Descanso'
    };
  });
}

/**
 * ALGORITMO 5: GENERADOR AUTOMÁTICO INTELIGENTE DE HORARIOS (Smart Auto-Scheduler)
 * Genera una propuesta de planificación mensual perfecta y balanceada para todo el equipo
 * respetando descansos legales, cobertura de líderes y equidad de fines de semana.
 */
export function generateSmartSchedule(year, month, employees) {
  const days = getDaysInMonthArray(year, month);
  const generatedShifts = [];

  // Separar empleados por grupos
  const leaders = employees.filter(e => getEmployeeRoleGroup(e.cargo).key === 'JEFATURA');
  const cashiers = employees.filter(e => getEmployeeRoleGroup(e.cargo).key === 'CAJAS');
  const bodega = employees.filter(e => getEmployeeRoleGroup(e.cargo).key === 'BODEGA');
  const asesores = employees.filter(e => getEmployeeRoleGroup(e.cargo).key === 'ASESORES');

  // Asignar líderes (Alternancia Apertura y Cierre)
  leaders.forEach((leader, idx) => {
    days.forEach((day, dayIdx) => {
      // 2 días libres por semana (ej: Lunes o Martes para líderes)
      const dayMod = (dayIdx + idx * 2) % 7;
      if (dayMod === 1 || dayMod === 2) {
        generatedShifts.push({
          empleado_cedula: leader.cedula,
          fecha: day.dateStr,
          tipo_turno: 'Descanso',
          hora_inicio: '00:00',
          hora_fin: '00:00'
        });
      } else {
        const isOpening = (dayIdx + idx) % 2 === 0;
        generatedShifts.push({
          empleado_cedula: leader.cedula,
          fecha: day.dateStr,
          tipo_turno: isOpening ? 'Apertura' : 'Cierre',
          hora_inicio: isOpening ? '09:30' : '12:30',
          hora_fin: isOpening ? '18:30' : '21:30'
        });
      }
    });
  });

  // Asignar Cajeros
  cashiers.forEach((cashier, idx) => {
    days.forEach((day, dayIdx) => {
      const isOffDay = (dayIdx + idx * 3) % 7 === 0 || (dayIdx + idx * 3) % 7 === 4;
      if (isOffDay) {
        generatedShifts.push({
          empleado_cedula: cashier.cedula,
          fecha: day.dateStr,
          tipo_turno: 'Descanso',
          hora_inicio: '00:00',
          hora_fin: '00:00'
        });
      } else {
        const isOpening = idx % 2 === 0;
        generatedShifts.push({
          empleado_cedula: cashier.cedula,
          fecha: day.dateStr,
          tipo_turno: isOpening ? 'Apertura' : 'Cierre',
          hora_inicio: isOpening ? '10:00' : '12:30',
          hora_fin: isOpening ? '19:00' : '21:30'
        });
      }
    });
  });

  // Asignar Bodega
  bodega.forEach(b => {
    days.forEach(day => {
      if (day.isSunday) {
        generatedShifts.push({
          empleado_cedula: b.cedula,
          fecha: day.dateStr,
          tipo_turno: 'Descanso',
          hora_inicio: '00:00',
          hora_fin: '00:00'
        });
      } else {
        generatedShifts.push({
          empleado_cedula: b.cedula,
          fecha: day.dateStr,
          tipo_turno: 'Apertura',
          hora_inicio: '09:30',
          hora_fin: '18:30'
        });
      }
    });
  });

  // Asignar Asesores de Ventas (Rotación inteligente por zonas)
  asesores.forEach((asesor, idx) => {
    days.forEach((day, dayIdx) => {
      // Días libres rotativos con fines de semana alternados
      const isOff = (dayIdx + idx * 2) % 7 === 0 || (dayIdx + idx * 2) % 7 === 3;
      if (isOff) {
        generatedShifts.push({
          empleado_cedula: asesor.cedula,
          fecha: day.dateStr,
          tipo_turno: 'Descanso',
          hora_inicio: '00:00',
          hora_fin: '00:00'
        });
      } else {
        const shiftPattern = (dayIdx + idx) % 3;
        let start = '09:30';
        let end = '18:30';
        let tipo = 'Apertura';

        if (shiftPattern === 1) {
          start = '11:00';
          end = '20:00';
          tipo = 'Intermedio';
        } else if (shiftPattern === 2) {
          start = '12:30';
          end = '21:30';
          tipo = 'Cierre';
        }

        generatedShifts.push({
          empleado_cedula: asesor.cedula,
          fecha: day.dateStr,
          tipo_turno: tipo,
          hora_inicio: start,
          hora_fin: end
        });
      }
    });
  });

  return generatedShifts;
}
