import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

export const PERIOD_COLORS = {
  '#666699': { name: 'Período 1 (1 - 8 Ago)', bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40', hex: '#666699' },
  '#339966': { name: 'Período 2 (9 - 16 Ago)', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', hex: '#339966' },
  '#993366': { name: 'Período 3 (17 - 24 Ago)', bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/40', hex: '#993366' },
  '#FFCC99': { name: 'Período 4 (25 - 31 Ago)', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', hex: '#FFCC99' }
};

import seedMetas from './seed_metas_agosto.json';

export const DEFAULT_METAS_SEED = seedMetas;

/**
 * Parsea el archivo Excel de Plantilla de Metas
 * @param {ArrayBuffer|File} fileData 
 * @returns {Promise<{ periodos: Array, tiendaMeta: Object, asesores: Array, daysCount: number }>}
 */
export async function parseMetasExcel(fileData) {
  const dataBuffer = fileData instanceof File ? await fileData.arrayBuffer() : fileData;
  const workbook = XLSX.read(dataBuffer, { cellStyles: true, type: 'array' });
  
  // Buscar hoja de metas o tomar la primera hoja
  const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('meta')) || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rawRows.length < 2) {
    throw new Error('El archivo de metas no contiene datos suficientes.');
  }

  // 1. Detectar en qué fila están los días (1..31) y desde qué columna empiezan
  let dayRowIdx = 0;
  let startColIdx = 3;

  for (let r = 0; r < Math.min(5, rawRows.length); r++) {
    const row = rawRows[r] || [];
    let countDays = 0;
    for (let c = 0; c < row.length; c++) {
      const val = parseInt(row[c]);
      if (!isNaN(val) && val >= 1 && val <= 31) {
        countDays++;
        if (countDays === 1) startColIdx = c;
      }
    }
    if (countDays >= 10) {
      dayRowIdx = r;
      break;
    }
  }

  // 2. Extraer columnas de días y colores de períodos
  const dayCols = [];
  const dayRow = rawRows[dayRowIdx] || [];
  
  for (let c = startColIdx; c < dayRow.length; c++) {
    const dayVal = parseInt(dayRow[c]);
    if (!isNaN(dayVal) && dayVal >= 1 && dayVal <= 31) {
      const colLetter = XLSX.utils.encode_col(c);
      const cellAddress = colLetter + (dayRowIdx + 1);
      const cell = worksheet[cellAddress];

      let colorHex = cell?.s?.fgColor?.rgb || cell?.s?.bgColor?.rgb || '';
      if (colorHex) {
        colorHex = '#' + colorHex.toUpperCase();
      } else {
        // Fallback estándar de 4 períodos de Marathon si no hay estilos embebidos
        if (dayVal <= 8) colorHex = '#666699';
        else if (dayVal <= 16) colorHex = '#339966';
        else if (dayVal <= 24) colorHex = '#993366';
        else colorHex = '#FFCC99';
      }

      dayCols.push({
        colIdx: c,
        colLetter,
        day: dayVal,
        color: colorHex
      });
    }
  }

  if (dayCols.length === 0) {
    throw new Error('No se encontraron columnas de días válidas (1 a 31) en la hoja de Excel.');
  }

  // 3. Agrupar períodos contiguos
  const periodos = [];
  let currentGroup = null;
  let pIdx = 1;

  dayCols.forEach(item => {
    if (!currentGroup || currentGroup.color !== item.color) {
      currentGroup = {
        id: pIdx,
        nombre: PERIOD_COLORS[item.color]?.name || `Período ${pIdx}`,
        color: item.color,
        dias: [item.day]
      };
      periodos.push(currentGroup);
      pIdx++;
    } else {
      currentGroup.dias.push(item.day);
    }
  });

  // Determinar día actual
  const todayNum = Math.min(Math.max(new Date().getDate(), 1), dayCols.length || 31);
  const currentPeriod = periodos.find(p => p.dias.includes(todayNum)) || periodos[0] || { dias: [1,2,3,4,5,6,7,8] };

  // 4. Identificar Fila de Tienda vs Filas de Asesores
  let storeRow = null;
  const asesorRows = [];

  for (let r = dayRowIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row) continue;

    const firstCell = String(row[0] || '').trim().toUpperCase();
    const secondCell = String(row[1] || '').trim().toUpperCase();

    if (!storeRow && (r === dayRowIdx + 1 || firstCell.includes('TIENDA') || firstCell.includes('TOTAL') || secondCell.includes('TOTAL') || (!row[0] && !row[1] && !row[2]))) {
      storeRow = row;
    } else if (row[0] || row[1] || row[2]) {
      asesorRows.push(row);
    }
  }

  if (!storeRow && rawRows[dayRowIdx + 1]) {
    storeRow = rawRows[dayRowIdx + 1];
  }

  // Procesar Meta General de Tienda
  const storeMetasDiarias = {};
  let storeMetaMensual = 0;
  let storeMetaPeriodoActual = 0;

  dayCols.forEach((col) => {
    const val = parseFloat(storeRow?.[col.colIdx]) || 0;
    storeMetasDiarias[col.day] = val;
    storeMetaMensual += val;
    if (currentPeriod.dias.includes(col.day)) {
      storeMetaPeriodoActual += val;
    }
  });

  const storePeriodosStats = periodos.map(p => {
    const sumP = p.dias.reduce((acc, d) => acc + (storeMetasDiarias[d] || 0), 0);
    return {
      ...p,
      meta_periodo: sumP
    };
  });

  const tiendaMeta = {
    cedula: '0000000000',
    nombres: 'PORTAL SHOPPING',
    apellidos: 'CARAPUNGO',
    cargo: 'TOTAL TIENDA',
    meta_diaria: storeMetasDiarias[todayNum] || 0,
    meta_semanal: storeMetaPeriodoActual,
    meta_mensual: storeMetaMensual,
    metas_diarias: storeMetasDiarias,
    periodos: storePeriodosStats
  };

  // Procesar Asesores
  const asesores = [];
  for (const row of asesorRows) {
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();

    let nombreCompleto = col0;
    let cargo = col1 || 'ASESOR DE VENTAS';
    let rawCedula = col2;

    // Detectar si la cédula está en otra columna
    if (/^\d{6,10}$/.test(col0)) {
      rawCedula = col0;
      nombreCompleto = col1;
      cargo = col2 || 'ASESOR DE VENTAS';
    } else if (!/^\d+$/.test(rawCedula) && /^\d{6,10}$/.test(col1)) {
      rawCedula = col1;
      cargo = col2 || 'ASESOR DE VENTAS';
    }

    if (!nombreCompleto) continue;

    // Asegurar 10 dígitos para cédulas de Ecuador
    if (rawCedula.length > 0 && rawCedula.length < 10 && /^\d+$/.test(rawCedula)) {
      rawCedula = rawCedula.padStart(10, '0');
    }

    const asesorMetasDiarias = {};
    let asesorMetaMensual = 0;
    let asesorMetaPeriodoActual = 0;

    dayCols.forEach((col) => {
      const val = parseFloat(row[col.colIdx]) || 0;
      asesorMetasDiarias[col.day] = val;
      asesorMetaMensual += val;
      if (currentPeriod.dias.includes(col.day)) {
        asesorMetaPeriodoActual += val;
      }
    });

    const asesorPeriodosStats = periodos.map(p => {
      const sumP = p.dias.reduce((acc, d) => acc + (asesorMetasDiarias[d] || 0), 0);
      return {
        ...p,
        meta_periodo: sumP
      };
    });

    asesores.push({
      cedula: rawCedula || `TEMP_${nombreCompleto.replace(/\s+/g, '_')}`,
      nombre_completo: nombreCompleto,
      cargo,
      meta_diaria: asesorMetasDiarias[todayNum] || 0,
      meta_semanal: asesorMetaPeriodoActual,
      meta_mensual: asesorMetaMensual,
      metas_diarias: asesorMetasDiarias,
      periodos: asesorPeriodosStats
    });
  }

  return {
    periodos,
    tiendaMeta,
    asesores,
    daysCount: dayCols.length,
    todayNum
  };
}

/**
 * Guarda las metas procesadas en Supabase (tabla `metas` y `tienda_stats`)
 */
export async function syncMetasToSupabase(parsedData, tiendaId = null) {
  const { tiendaMeta, asesores } = parsedData;

  const recordsToUpsert = [];

  // 1. Registro de Tienda General
  if (tiendaMeta) {
    recordsToUpsert.push({
      cedula: '0000000000',
      nombres: 'PORTAL SHOPPING',
      apellidos: 'CARAPUNGO',
      cargo: 'TOTAL TIENDA',
      meta_diaria: tiendaMeta.meta_diaria || 0,
      meta_semanal: tiendaMeta.meta_semanal || 0,
      meta_mensual: tiendaMeta.meta_mensual || 0,
      metas_diarias: tiendaMeta.metas_diarias || {},
      periodos: Array.isArray(tiendaMeta.periodos) ? tiendaMeta.periodos : [],
      mes_anio: '2026-08',
      updated_at: new Date().toISOString()
    });
  }

  const OFFICIAL_ADVISOR_CEDULAS = new Set([
    '1753997376', // LUIS CARRION
    '1310559917', // ANGEL VELASQUEZ
    '1724158850', // LEONARDO POSLIGUA
    '1755859038', // LAYLA MONTANO
    '1729461796', // ELIANE HERRERA
    '1727839142', // WILSON ARMIJOS
    '0803422948', // PAOLA BRAVO
    '0931982136', // KERLY ROSADO
    '1750148155'  // MICHAEL GUEVARA
  ]);

  // 2. Registros de Asesores (Filtrar solo los 9 asesores oficiales activos)
  (asesores || []).forEach(a => {
    const ced = String(a.cedula || '').trim().padStart(10, '0');
    const cargoLower = (a.cargo || '').toLowerCase();
    
    // Omitir personal directivo/administración o inactivos de plantillas viejas
    if (cargoLower.includes('jefe') || cargoLower.includes('gerente') || ced === '0803695311') {
      return;
    }

    const rawName = String(a.nombre_completo || '').trim();
    const parts = rawName.split(/\s+/);
    const apellidos = parts.slice(0, 2).join(' ') || parts[0] || 'Asesor';
    const nombres = parts.slice(2).join(' ') || parts.slice(1).join(' ') || rawName;

    recordsToUpsert.push({
      cedula: ced,
      nombres,
      apellidos,
      cargo: 'Asesor de Ventas',
      meta_diaria: a.meta_diaria || 0,
      meta_semanal: a.meta_semanal || 0,
      meta_mensual: a.meta_mensual || 0,
      metas_diarias: a.metas_diarias || {},
      periodos: Array.isArray(a.periodos) ? a.periodos : [],
      mes_anio: '2026-08',
      updated_at: new Date().toISOString()
    });
  });

  // Limpiar posibles registros obsoletos en Supabase antes de upsertar
  try {
    await supabase.from('metas').delete().not('cedula', 'in', `(${Array.from(OFFICIAL_ADVISOR_CEDULAS).join(',')},0000000000)`);
  } catch (cleanErr) {
    console.warn('Nota limpieza de metas obsoletas:', cleanErr);
  }

  // Upsert en tabla `metas` (con cédula como clave primaria)
  const { error } = await supabase
    .from('metas')
    .upsert(recordsToUpsert, { onConflict: 'cedula' });

  if (error) throw error;

  // Actualizar también `tienda_stats` de manera segura (sin bloquear el guardado si falla)
  try {
    const { data: tiendasData } = await supabase
      .from('tiendas')
      .select('id')
      .limit(1);

    const targetTiendaId = tiendaId || tiendasData?.[0]?.id;

    if (targetTiendaId) {
      await supabase
        .from('tienda_stats')
        .update({
          meta_diaria_tienda: tiendaMeta?.meta_diaria || 0,
          meta_semanal_tienda: tiendaMeta?.meta_semanal || 0,
          venta_tienda: tiendaMeta?.meta_mensual || 0,
          updated_at: new Date().toISOString()
        })
        .eq('tienda_id', targetTiendaId);
    }
  } catch (statsErr) {
    console.warn('Nota: tienda_stats no se pudo actualizar pero metas se guardaron con éxito:', statsErr);
  }

  return true;
}

/**
 * Mapeador universal para obtener los datos precisos de metas de cualquier colaborador
 * @param {Array} allMetas - Lista de registros de metas desde Supabase
 * @param {Object} user - Usuario conectado desde authStore
 * @param {Array} empleados - Lista de empleados
 * @param {number} targetDay - Día a consultar (por defecto 24)
 */
export function getCollaboratorMeta(allMetas = [], user = null, empleados = [], targetDay = 24) {
  if (!allMetas || allMetas.length === 0) {
    return {
      metaRecord: null,
      storeRecord: null,
      miMetaHoy: 0,
      miMetaPeriodo: 0,
      miMetaMes: 0,
      tiendaMetaHoy: 5217,
      tiendaMetaMes: 326079
    };
  }

  const norm = (c) => {
    if (!c) return '';
    const s = String(c).trim();
    return s.length === 9 ? '0' + s : s;
  };

  // 1. Obtener datos del usuario desde authStore o tabla de empleados
  const userCedula = norm(user?.user_metadata?.cedula || user?.cedula || '');
  const userEmail = String(user?.email || '').toLowerCase().trim();
  const empMatch = empleados.find(e => 
    (userCedula && norm(e.cedula) === userCedula) ||
    (userEmail && e.email && e.email.toLowerCase() === userEmail)
  );

  const effectiveCedula = userCedula || norm(empMatch?.cedula || '');
  const rawNombres = (user?.user_metadata?.nombres || empMatch?.nombres || '').trim();
  const rawApellidos = (user?.user_metadata?.apellidos || empMatch?.apellidos || '').trim();
  const firstName = rawNombres.toLowerCase().split(' ')[0] || '';
  const lastName = rawApellidos.toLowerCase().split(' ')[0] || '';

  // 2. Buscar en allMetas
  const metaRec = allMetas.find(m => {
    if (m.cedula === '0000000000' || m.cargo === 'TOTAL TIENDA') return false;
    const metaCed = norm(m.cedula);
    if (effectiveCedula && metaCed === effectiveCedula) return true;

    const fullMetaName = `${m.nombres || ''} ${m.apellidos || ''}`.toLowerCase();
    if (firstName && lastName && fullMetaName.includes(firstName) && fullMetaName.includes(lastName)) return true;
    if (firstName && firstName.length >= 3 && fullMetaName.includes(firstName)) return true;
    return false;
  });

  const storeRec = allMetas.find(m => m.cedula === '0000000000' || m.cargo === 'TOTAL TIENDA');

  // 3. Parsear metas diarias si vienen como JSON string
  const parseDiarias = (rec) => {
    if (!rec) return {};
    if (typeof rec.metas_diarias === 'string') {
      try { return JSON.parse(rec.metas_diarias); } catch { return {}; }
    }
    return rec.metas_diarias || {};
  };

  const metaDiarias = parseDiarias(metaRec);
  const storeDiarias = parseDiarias(storeRec);

  const dayKey = targetDay || new Date().getDate();
  
  // Extraer meta del día específico o fallback a meta_diaria
  let miMetaHoy = 0;
  if (metaDiarias[dayKey] !== undefined && metaDiarias[dayKey] !== null) {
    miMetaHoy = parseFloat(metaDiarias[dayKey]) || 0;
  } else if (metaDiarias[String(dayKey)] !== undefined && metaDiarias[String(dayKey)] !== null) {
    miMetaHoy = parseFloat(metaDiarias[String(dayKey)]) || 0;
  } else if (metaRec?.meta_diaria) {
    miMetaHoy = parseFloat(metaRec.meta_diaria) || 0;
  }

  const miMetaMes = parseFloat(metaRec?.meta_mensual ?? 0);
  
  // Meta Período
  let miMetaPeriodo = 0;
  if (Array.isArray(metaRec?.periodos)) {
    const activeP = metaRec.periodos.find(p => p.dias?.includes(dayKey));
    if (activeP) miMetaPeriodo = parseFloat(activeP.meta_periodo ?? 0);
  }
  if (!miMetaPeriodo && metaRec?.meta_semanal) {
    miMetaPeriodo = parseFloat(metaRec.meta_semanal);
  }

  let tiendaMetaHoy = 5217;
  if (storeDiarias[dayKey] !== undefined && storeDiarias[dayKey] !== null) {
    tiendaMetaHoy = parseFloat(storeDiarias[dayKey]) || 0;
  } else if (storeDiarias[String(dayKey)] !== undefined && storeDiarias[String(dayKey)] !== null) {
    tiendaMetaHoy = parseFloat(storeDiarias[String(dayKey)]) || 0;
  } else if (storeRec?.meta_diaria) {
    tiendaMetaHoy = parseFloat(storeRec.meta_diaria) || 5217;
  }

  const tiendaMetaMes = parseFloat(storeRec?.meta_mensual ?? 326079);

  return {
    metaRecord: metaRec,
    storeRecord: storeRec,
    miMetaHoy,
    miMetaPeriodo,
    miMetaMes,
    tiendaMetaHoy,
    tiendaMetaMes
  };
}

