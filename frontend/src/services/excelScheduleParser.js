/**
 * excelScheduleParser.js
 * Parser inteligente y tolerante a fallos para archivos Excel de horarios oficiales de Marathon Sports MCP1.
 */
import * as XLSX from 'xlsx';
import { SHIFT_PRESETS, formatLocalDateStr } from './scheduleEngine';

/**
 * Normaliza cadenas de texto eliminando acentos y espacios adicionales
 */
export function normalizeString(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ');
}

/**
 * Normaliza cédula a 10 dígitos
 */
export function normalizeCedula(val) {
  if (!val) return '';
  let str = String(val).trim().replace(/[\s.-]/g, '');
  if (str.length === 9 && /^\d+$/.test(str)) {
    str = '0' + str;
  }
  return str;
}

/**
 * Formatea valores de hora de Excel (decimales o strings) a 'HH:MM'
 */
export function formatExcelTime(val) {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number') {
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  const str = String(val).trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const parts = str.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return str;
}

/**
 * Encuentra a un empleado en la lista por Cédula o por Nombre Normalizado
 */
export function matchEmployee(cedulaVal, nameVal, employeesList) {
  if (!employeesList || employeesList.length === 0) return null;

  let cleanCedula = normalizeCedula(cedulaVal);
  const cleanName = normalizeString(nameVal);

  // Mapeo canónico: Santiago Morocho reemplaza cualquier mención de la cédula 1761707502 o nombre Santiago
  if (cleanCedula === '1761707502' || cleanName.includes('SANTIAGO')) {
    cleanCedula = '1752334951';
  }

  // 1. Coincidencia por Cédula
  if (cleanCedula && cleanCedula.length >= 9) {
    const byCedula = employeesList.find(e => normalizeCedula(e.cedula) === cleanCedula);
    if (byCedula) return byCedula;
  }

  // 2. Coincidencia por Nombre
  if (!nameVal) return null;

  // Exacto
  const byExactName = employeesList.find(e => {
    const fn1 = normalizeString(`${e.nombres} ${e.apellidos}`);
    const fn2 = normalizeString(`${e.apellidos} ${e.nombres}`);
    const n = normalizeString(e.nombres);
    return fn1 === cleanName || fn2 === cleanName || n === cleanName;
  });
  if (byExactName) return byExactName;

  // Tokens de nombres
  const words = cleanName.split(' ').filter(w => w.length > 2);
  if (words.length > 0) {
    const byTokens = employeesList.find(e => {
      const full = normalizeString(`${e.nombres} ${e.apellidos}`);
      const matches = words.filter(w => full.includes(w)).length;
      return matches >= 1;
    });
    if (byTokens) return byTokens;
  }

  return null;
}

/**
 * Parsea el texto o código del turno a objeto normalizado
 */
export function interpretShiftCell(rawVal) {
  if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
    return {
      tipo_turno: 'Descanso',
      hora_inicio: '00:00',
      hora_fin: '00:00',
      raw: ''
    };
  }

  const rawStr = String(rawVal).trim();
  const upper = rawStr.toUpperCase();

  // 1. Buscar en presets de turnos
  const preset = SHIFT_PRESETS.find(p => p.code.toUpperCase() === upper);
  if (preset) {
    return {
      tipo_turno: preset.type,
      hora_inicio: preset.start,
      hora_fin: preset.end,
      raw: rawStr
    };
  }

  // 2. Descansos / Libres
  if (upper === 'L' || upper === 'LIBRE' || upper.includes('DESCANSO') || upper === 'OFF') {
    return {
      tipo_turno: 'Descanso',
      hora_inicio: '00:00',
      hora_fin: '00:00',
      raw: rawStr
    };
  }

  // 3. Vacaciones
  if (upper === 'VAC' || upper.includes('VACACION')) {
    return {
      tipo_turno: 'Feriado/Novedad',
      hora_inicio: '00:00',
      hora_fin: '00:00',
      raw: rawStr
    };
  }

  // 4. Permisos / Feriados / Novedades
  if (upper === 'PER' || upper.includes('PERMISO') || upper.includes('FERIADO') || upper.includes('MEDIC')) {
    return {
      tipo_turno: 'Feriado/Novedad',
      hora_inicio: '00:00',
      hora_fin: '00:00',
      raw: rawStr
    };
  }

  // 5. Rango de Horas tipo '09:30-18:30' o '9:30 A 18:30'
  const timeRangeMatch = upper.match(/(\d{1,2}(?::\d{2})?)\s*(?:-|A|HASTA)\s*(\d{1,2}(?::\d{2})?)/);
  if (timeRangeMatch) {
    let t1 = timeRangeMatch[1].includes(':') ? timeRangeMatch[1] : `${timeRangeMatch[1]}:00`;
    let t2 = timeRangeMatch[2].includes(':') ? timeRangeMatch[2] : `${timeRangeMatch[2]}:00`;
    t1 = formatExcelTime(t1);
    t2 = formatExcelTime(t2);

    const [h] = t1.split(':').map(Number);
    let tipo = 'Intermedio';
    if (h < 11) tipo = 'Apertura';
    else if (h >= 13) tipo = 'Cierre';

    return {
      tipo_turno: tipo,
      hora_inicio: t1,
      hora_fin: t2,
      raw: rawStr
    };
  }

  return {
    tipo_turno: 'Turno',
    hora_inicio: '09:30',
    hora_fin: '18:30',
    raw: rawStr
  };
}

/**
 * Parsea una hoja de cálculo completa en formato MATRIZ sincronizando siempre el Día 1 del Excel con el Día 1 del mes seleccionado
 */
export function parseScheduleExcelSheet(workbook, employeesList, targetMonth = null, targetYear = null) {
  // Buscar hoja HORARIO o la primera disponible
  let sheetName = workbook.SheetNames.find(n => n.toUpperCase() === 'HORARIO') || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) {
    throw new Error('La hoja de cálculo está vacía o no tiene formato válido.');
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (!data || data.length < 4) {
    throw new Error('El archivo no contiene suficientes filas de horario.');
  }

  const now = new Date();
  const year = targetYear || now.getFullYear();
  const month = targetMonth || (now.getMonth() + 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  // 1. Detectar columnas de días (Día 1 a Día 31) en las primeras filas (por ejemplo fila 3 o 2)
  let dayCols = [];

  for (let r = 0; r <= Math.min(data.length - 1, 8); r++) {
    const row = data[r] || [];
    const tempDayCols = [];

    row.forEach((val, colIdx) => {
      const num = typeof val === 'number' ? val : parseInt(String(val).trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= 31) {
        tempDayCols.push({ dayNumber: num, colIndex: colIdx });
      }
    });

    if (tempDayCols.length >= 15) {
      dayCols = tempDayCols;
      break;
    }
  }

  // Si no se encontró fila numérica de días, generar columnas consecutivas a partir de la col 9
  if (dayCols.length === 0) {
    for (let d = 1; d <= 31; d++) {
      dayCols.push({ dayNumber: d, colIndex: 8 + d });
    }
  }

  dayCols.sort((a, b) => a.dayNumber - b.dayNumber);

  // Filtrar solo los días que pertenecen al mes destino seleccionado (ej: 1..28, 1..30 o 1..31)
  const targetDayCols = dayCols.filter(d => d.dayNumber <= daysInMonth);

  const turnosParsed = [];
  const employeesFound = new Set();
  const unmappedRows = [];
  const zonesDetected = {};

  // 2. Recorrer colaboradores
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (!row || row.length === 0) continue;

    const rawName = row[1];
    const rawCedula = row[3];
    const rawZona = row[2];

    if (!rawName || typeof rawName !== 'string' || rawName.trim() === '') continue;
    if (rawName.toUpperCase().includes('NOMBRE') || rawName.toUpperCase().includes('GENERAL') || rawName.toUpperCase().includes('TOTAL')) continue;

    const matchedEmp = matchEmployee(rawCedula, rawName, employeesList);

    if (!matchedEmp) {
      unmappedRows.push(`Fila ${r + 1}: ${rawName} (${rawCedula || 'Sin cédula'})`);
      continue;
    }

    employeesFound.add(matchedEmp.cedula);

    if (rawZona && String(rawZona).trim() !== '' && String(rawZona).toUpperCase() !== 'UNDEFINED') {
      zonesDetected[matchedEmp.cedula] = String(rawZona).trim().toUpperCase();
    }

    // Verificar si el formato tiene 5 filas por empleado (Entrada, Salida Almuerzo, Entrada Almuerzo, Salida, Total)
    const hasMultipleRows = data[r + 3] && data[r + 3][1] === undefined;

    targetDayCols.forEach(({ dayNumber, colIndex }) => {
      const entryRaw = row[colIndex];
      const exitRaw = hasMultipleRows ? (data[r + 3] ? data[r + 3][colIndex] : null) : null;

      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

      let turnoObj = {
        empleado_cedula: matchedEmp.cedula,
        fecha: dateStr,
        tipo_turno: 'Descanso',
        hora_inicio: '00:00',
        hora_fin: '00:00',
        horas_programadas: 0,
        creado_por: 'importador_excel'
      };

      if (hasMultipleRows) {
        const entryTime = formatExcelTime(entryRaw);
        const exitTime = formatExcelTime(exitRaw);

        if (entryTime && exitTime && entryTime !== '00:00' && exitTime !== '00:00') {
          const h = parseInt(entryTime.split(':')[0], 10);
          let tipo = 'Intermedio';
          if (h < 11) tipo = 'Apertura (M1)';
          else if (h >= 11 && h < 12) tipo = 'Intermedio (I1)';
          else if (h >= 12 && h < 13) tipo = 'Intermedio (I2)';
          else tipo = 'Cierre (T1)';

          turnoObj.tipo_turno = tipo;
          turnoObj.hora_inicio = entryTime;
          turnoObj.hora_fin = exitTime;
          turnoObj.horas_programadas = 8;
        }
      } else {
        const interpreted = interpretShiftCell(entryRaw);
        turnoObj.tipo_turno = interpreted.tipo_turno;
        turnoObj.hora_inicio = interpreted.hora_inicio;
        turnoObj.hora_fin = interpreted.hora_fin;
        turnoObj.horas_programadas = interpreted.tipo_turno === 'Descanso' ? 0 : 8;
      }

      turnosParsed.push(turnoObj);
    });

    if (hasMultipleRows) {
      r += 4; // Saltar las filas complementarias del mismo empleado
    }
  }

  return {
    year,
    month,
    daysCount: daysInMonth,
    turnos: turnosParsed,
    totalTurnos: turnosParsed.length,
    employeesFoundCount: employeesFound.size,
    totalEmployeesInDB: employeesList.length,
    unmappedRows,
    zonesDetected
  };
}
