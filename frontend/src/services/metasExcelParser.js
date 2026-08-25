import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

export const PERIOD_COLORS = {
  '#666699': { name: 'Período 1 (1 - 8 Ago)', bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40', hex: '#666699' },
  '#339966': { name: 'Período 2 (9 - 16 Ago)', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', hex: '#339966' },
  '#993366': { name: 'Período 3 (17 - 24 Ago)', bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/40', hex: '#993366' },
  '#FFCC99': { name: 'Período 4 (25 - 31 Ago)', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', hex: '#FFCC99' }
};

export const DEFAULT_METAS_SEED = [
  {
    cedula: '0000000000',
    nombres: 'PORTAL SHOPPING',
    apellidos: 'CARAPUNGO',
    cargo: 'TOTAL TIENDA',
    meta_diaria: 5217,
    meta_semanal: 89456,
    meta_mensual: 326079,
    metas_diarias: {"1":13040,"2":12433,"3":3561,"4":4487,"5":5615,"6":7500,"7":10076,"8":15260,"9":17902,"10":8804,"11":5869,"12":6456,"13":6450,"14":8100,"15":19565,"16":16630,"17":6522,"18":8804,"19":9782,"20":6848,"21":10108,"22":20426,"23":21749,"24":5217,"25":7826,"26":8152,"27":8478,"28":10761,"29":15198.5,"30":17807.5,"31":6652},
    periodos: [
      { id: 1, dias: [1,2,3,4,5,6,7,8], color: '#666699', nombre: 'Período 1 (1 - 8 Ago)', meta_periodo: 71972 },
      { id: 2, dias: [9,10,11,12,13,14,15,16], color: '#339966', nombre: 'Período 2 (9 - 16 Ago)', meta_periodo: 89776 },
      { id: 3, dias: [17,18,19,20,21,22,23,24], color: '#993366', nombre: 'Período 3 (17 - 24 Ago)', meta_periodo: 89456 },
      { id: 4, dias: [25,26,27,28,29,30,31], color: '#FFCC99', nombre: 'Período 4 (25 - 31 Ago)', meta_periodo: 74875 }
    ]
  },
  {
    cedula: '1310559917',
    nombres: 'ANGEL CASIMIRO',
    apellidos: 'VELASQUEZ DELGADO',
    cargo: 'ASESOR DE VENTAS (R)',
    meta_diaria: 1638.76,
    meta_semanal: 18020.88,
    meta_mensual: 58359.39,
    metas_diarias: {"1":2018.56,"2":2321.2,"3":972.45,"4":1134.29,"5":0,"6":0,"7":2949.74,"8":2196.98,"9":3008.04,"10":2551.15,"11":1698.73,"12":0,"13":0,"14":2172.52,"15":2904.94,"16":2817.19,"17":2041.42,"18":2723.95,"19":0,"20":0,"21":3040.98,"22":4432.16,"23":4143.61,"24":1638.76,"25":2176.99,"26":0,"27":0,"28":3381.8,"29":3303.48,"30":3183.8,"31":1546.65},
    periodos: [
      { id: 1, dias: [1,2,3,4,5,6,7,8], color: '#666699', nombre: 'Período 1 (1 - 8 Ago)', meta_periodo: 11593.22 },
      { id: 2, dias: [9,10,11,12,13,14,15,16], color: '#339966', nombre: 'Período 2 (9 - 16 Ago)', meta_periodo: 15152.57 },
      { id: 3, dias: [17,18,19,20,21,22,23,24], color: '#993366', nombre: 'Período 3 (17 - 24 Ago)', meta_periodo: 18020.88 },
      { id: 4, dias: [25,26,27,28,29,30,31], color: '#FFCC99', nombre: 'Período 4 (25 - 31 Ago)', meta_periodo: 13592.72 }
    ]
  },
  {
    cedula: '0931982136',
    nombres: 'KERLY MELISA',
    apellidos: 'ROSADO SANCHEZ',
    cargo: 'ASESOR DE VENTAS (R)',
    meta_diaria: 1491.44,
    meta_semanal: 18862.87,
    meta_mensual: 36463.73,
    metas_diarias: {"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":3136.9,"17":1871.78,"18":2558.45,"19":2936.14,"20":1834.48,"21":0,"22":3957.07,"23":4213.51,"24":1491.44,"25":2518.61,"26":2196.92,"27":2363.5,"28":0,"29":2511.17,"30":3651.49,"31":1222.27},
    periodos: [
      { id: 1, dias: [1,2,3,4,5,6,7,8], color: '#666699', nombre: 'Período 1 (1 - 8 Ago)', meta_periodo: 0 },
      { id: 2, dias: [9,10,11,12,13,14,15,16], color: '#339966', nombre: 'Período 2 (9 - 16 Ago)', meta_periodo: 3136.9 },
      { id: 3, dias: [17,18,19,20,21,22,23,24], color: '#993366', nombre: 'Período 3 (17 - 24 Ago)', meta_periodo: 18862.87 },
      { id: 4, dias: [25,26,27,28,29,30,31], color: '#FFCC99', nombre: 'Período 4 (25 - 31 Ago)', meta_periodo: 14463.96 }
    ]
  },
  {
    cedula: '0803422948',
    nombres: 'PAOLA ESTEFANIA',
    apellidos: 'BRAVO FARIAS',
    cargo: 'ASESOR DE VENTAS (R)',
    meta_diaria: 991.23,
    meta_semanal: 8814.32,
    meta_mensual: 30804.12,
    metas_diarias: {"1":1768.66,"2":1019.32,"3":310.06,"4":0,"5":0,"6":796.52,"7":1059.94,"8":2213.32,"9":1487.15,"10":753.36,"11":0,"12":0,"13":581.37,"14":901.9,"15":2690.28,"16":1379.09,"17":1239.18,"18":1672.76,"19":0,"20":0,"21":1114.27,"22":1805.33,"23":1991.55,"24":991.23,"25":1486.94,"26":0,"27":0,"28":1074.77,"29":1516.99,"30":1686.25,"31":1263.88},
    periodos: [
      { id: 1, dias: [1,2,3,4,5,6,7,8], color: '#666699', nombre: 'Período 1 (1 - 8 Ago)', meta_periodo: 7167.82 },
      { id: 2, dias: [9,10,11,12,13,14,15,16], color: '#339966', nombre: 'Período 2 (9 - 16 Ago)', meta_periodo: 7793.15 },
      { id: 3, dias: [17,18,19,20,21,22,23,24], color: '#993366', nombre: 'Período 3 (17 - 24 Ago)', meta_periodo: 8814.32 },
      { id: 4, dias: [25,26,27,28,29,30,31], color: '#FFCC99', nombre: 'Período 4 (25 - 31 Ago)', meta_periodo: 7028.83 }
    ]
  },
  {
    cedula: '1729461796',
    nombres: 'ELIANE FERNANDO',
    apellidos: 'HERRERA CORREA',
    cargo: 'ASESOR DE VENTAS (R)',
    meta_diaria: 939.06,
    meta_semanal: 9431.14,
    meta_mensual: 28503.88,
    metas_diarias: {"1":1166.12,"2":1218.62,"3":330.92,"4":807.66,"5":0,"6":0,"7":0,"8":1337.05,"9":1735.21,"10":831.36,"11":1056.42,"12":0,"13":0,"14":0,"15":1777.26,"16":1614.31,"17":1173.96,"18":1584.72,"19":0,"20":0,"21":0,"22":1818.58,"23":3914.82,"24":939.06,"25":1408.68,"26":0,"27":0,"28":0,"29":1386.41,"30":3205.36,"31":1197.36},
    periodos: [
      { id: 1, dias: [1,2,3,4,5,6,7,8], color: '#666699', nombre: 'Período 1 (1 - 8 Ago)', meta_periodo: 4860.37 },
      { id: 2, dias: [9,10,11,12,13,14,15,16], color: '#339966', nombre: 'Período 2 (9 - 16 Ago)', meta_periodo: 7014.56 },
      { id: 3, dias: [17,18,19,20,21,22,23,24], color: '#993366', nombre: 'Período 3 (17 - 24 Ago)', meta_periodo: 9431.14 },
      { id: 4, dias: [25,26,27,28,29,30,31], color: '#FFCC99', nombre: 'Período 4 (25 - 31 Ago)', meta_periodo: 7197.81 }
    ]
  },
  {
    cedula: '1727839142',
    nombres: 'WILSON OMAR',
    apellidos: 'ARMIJOS MORETA',
    cargo: 'ASESOR DE VENTAS (R)',
    meta_diaria: 0,
    meta_semanal: 8182.32,
    meta_mensual: 31823.48,
    metas_diarias: {"1":1561.47,"2":1361.07,"3":432.96,"4":0,"5":0,"6":928.48,"7":1257.54,"8":1666.33,"9":2217.67,"10":1001.48,"11":0,"12":0,"13":902.13,"14":961.1,"15":2249.8,"16":1903.71,"17":0,"18":0,"19":1858.58,"20":1301.12,"21":806.25,"22":2075.61,"23":2140.76,"24":0,"25":0,"26":1548.88,"27":1610.82,"28":969.82,"29":1370.73,"30":1697.17,"31":0},
    periodos: [
      { id: 1, dias: [1,2,3,4,5,6,7,8], color: '#666699', nombre: 'Período 1 (1 - 8 Ago)', meta_periodo: 7207.85 },
      { id: 2, dias: [9,10,11,12,13,14,15,16], color: '#339966', nombre: 'Período 2 (9 - 16 Ago)', meta_periodo: 9235.89 },
      { id: 3, dias: [17,18,19,20,21,22,23,24], color: '#993366', nombre: 'Período 3 (17 - 24 Ago)', meta_periodo: 8182.32 },
      { id: 4, dias: [25,26,27,28,29,30,31], color: '#FFCC99', nombre: 'Período 4 (25 - 31 Ago)', meta_periodo: 7197.42 }
    ]
  },
  {
    cedula: '1753997376',
    nombres: 'LUIS RENE',
    apellidos: 'CARRION CAJAMARCA',
    cargo: 'ASESOR DE VENTAS (R)',
    meta_diaria: 0,
    meta_semanal: 16789.85,
    meta_mensual: 62264.97,
    metas_diarias: {"1":1973.34,"2":2462.76,"3":0,"4":0,"5":1765.33,"6":2245.59,"7":2692.82,"8":2154.89,"9":3678.48,"10":0,"11":0,"12":1903.15,"13":2253.22,"14":2363.48,"15":2977.32,"16":3358.71,"17":0,"18":0,"19":2933.06,"20":2274.32,"21":3023.82,"22":3866.37,"23":4692.28,"24":0,"25":0,"26":2694.28,"27":2723.3,"28":3074.8,"29":3304.45,"30":3849.2,"31":0},
    periodos: [
      { id: 1, dias: [1,2,3,4,5,6,7,8], color: '#666699', nombre: 'Período 1 (1 - 8 Ago)', meta_periodo: 13294.73 },
      { id: 2, dias: [9,10,11,12,13,14,15,16], color: '#339966', nombre: 'Período 2 (9 - 16 Ago)', meta_periodo: 16534.36 },
      { id: 3, dias: [17,18,19,20,21,22,23,24], color: '#993366', nombre: 'Período 3 (17 - 24 Ago)', meta_periodo: 16789.85 },
      { id: 4, dias: [25,26,27,28,29,30,31], color: '#FFCC99', nombre: 'Período 4 (25 - 31 Ago)', meta_periodo: 15646.03 }
    ]
  },
  {
    cedula: '1755859038',
    nombres: 'LAYLA VALENTINA',
    apellidos: 'MONTANO HURTADO',
    cargo: 'ASESOR DE VENTAS (R)',
    meta_diaria: 0,
    meta_semanal: 6670.94,
    meta_mensual: 25241.36,
    metas_diarias: {"1":1181.08,"2":0,"3":0,"4":0,"5":1010.7,"6":1350,"7":1813.68,"8":1409.75,"9":0,"10":0,"11":0,"12":1162.08,"13":1161,"14":1458,"15":1744.44,"16":0,"17":0,"18":0,"19":1760.76,"20":1232.64,"21":1819.44,"22":1858.1,"23":0,"24":0,"25":0,"26":1467.36,"27":1526.04,"28":1936.98,"29":1349.31,"30":0,"31":0},
    periodos: [
      { id: 1, dias: [1,2,3,4,5,6,7,8], color: '#666699', nombre: 'Período 1 (1 - 8 Ago)', meta_periodo: 6765.21 },
      { id: 2, dias: [9,10,11,12,13,14,15,16], color: '#339966', nombre: 'Período 2 (9 - 16 Ago)', meta_periodo: 5525.52 },
      { id: 3, dias: [17,18,19,20,21,22,23,24], color: '#993366', nombre: 'Período 3 (17 - 24 Ago)', meta_periodo: 6670.94 },
      { id: 4, dias: [25,26,27,28,29,30,31], color: '#FFCC99', nombre: 'Período 4 (25 - 31 Ago)', meta_periodo: 6279.69 }
    ]
  },
  {
    cedula: '1724158850',
    nombres: 'JOSE LEONARDO',
    apellidos: 'POSLIGUA MOLINA',
    cargo: 'ASESOR DE VENTAS (R)',
    meta_diaria: 0,
    meta_semanal: 0,
    meta_mensual: 25417.12,
    metas_diarias: {"1":1541.84,"2":2178.52,"3":1021.71,"4":1378.43,"5":1379.07,"6":1954.41,"7":0,"8":1980.41,"9":3338.6,"10":2379.09,"11":1587.91,"12":1712.21,"13":1358.78,"14":0,"15":2383.86,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":1222.28},
    periodos: [
      { id: 1, dias: [1,2,3,4,5,6,7,8], color: '#666699', nombre: 'Período 1 (1 - 8 Ago)', meta_periodo: 11434.39 },
      { id: 2, dias: [9,10,11,12,13,14,15,16], color: '#339966', nombre: 'Período 2 (9 - 16 Ago)', meta_periodo: 12760.45 },
      { id: 3, dias: [17,18,19,20,21,22,23,24], color: '#993366', nombre: 'Período 3 (17 - 24 Ago)', meta_periodo: 0 },
      { id: 4, dias: [25,26,27,28,29,30,31], color: '#FFCC99', nombre: 'Período 4 (25 - 31 Ago)', meta_periodo: 1222.28 }
    ]
  },
  {
    cedula: '1714768486',
    nombres: ' TARAPUES JOSE   GUSTAVO',
    apellidos: 'VALENZUELA ',
    cargo: 'JEFE DE ALMACEN (R)',
    meta_diaria: 156.51,
    meta_semanal: 2683.68,
    meta_mensual: 9782.38,
    metas_diarias: {"1":391.2,"2":372.99,"3":106.83,"4":134.61,"5":168.45,"6":225,"7":302.28,"8":457.8,"9":537.06,"10":264.12,"11":176.07,"12":193.68,"13":193.5,"14":243,"15":586.95,"16":498.9,"17":195.66,"18":264.12,"19":293.46,"20":205.44,"21":303.24,"22":612.78,"23":652.47,"24":156.51,"25":234.78,"26":244.56,"27":254.34,"28":322.83,"29":455.96,"30":534.23,"31":199.56},
    periodos: [
      { id: 1, dias: [1,2,3,4,5,6,7,8], color: '#666699', nombre: 'Período 1 (1 - 8 Ago)', meta_periodo: 2159.16 },
      { id: 2, dias: [9,10,11,12,13,14,15,16], color: '#339966', nombre: 'Período 2 (9 - 16 Ago)', meta_periodo: 2693.28 },
      { id: 3, dias: [17,18,19,20,21,22,23,24], color: '#993366', nombre: 'Período 3 (17 - 24 Ago)', meta_periodo: 2683.68 },
      { id: 4, dias: [25,26,27,28,29,30,31], color: '#FFCC99', nombre: 'Período 4 (25 - 31 Ago)', meta_periodo: 2246.26 }
    ]
  }
];

/**
 * Parsea el archivo Excel de Plantilla de Metas
 * @param {ArrayBuffer|File} fileData 
 * @returns {Promise<{ periodos: Array, tiendaMeta: Object, asesores: Array, daysCount: number }>}
 */
export async function parseMetasExcel(fileData) {
  const dataBuffer = fileData instanceof File ? await fileData.arrayBuffer() : fileData;
  const workbook = XLSX.read(dataBuffer, { cellStyles: true, type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // 1. Extraer columnas de días y colores de períodos
  const dayCols = [];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:AH20');
  
  for (let c = 3; c <= range.e.c; c++) {
    const colLetter = XLSX.utils.encode_col(c);
    const cell = worksheet[colLetter + '1'];
    if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
      const dayNum = parseInt(cell.v);
      if (!isNaN(dayNum)) {
        let colorHex = cell.s?.fgColor?.rgb || cell.s?.bgColor?.rgb || '';
        if (colorHex) {
          colorHex = '#' + colorHex.toUpperCase();
        } else {
          // Fallback a períodos estándar si el excel no incluye estilos RGB
          if (dayNum <= 8) colorHex = '#666699';
          else if (dayNum <= 16) colorHex = '#339966';
          else if (dayNum <= 24) colorHex = '#993366';
          else colorHex = '#FFCC99';
        }

        dayCols.push({
          colLetter,
          day: dayNum,
          color: colorHex
        });
      }
    }
  }

  // 2. Agrupar períodos contiguos
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

  // 3. Extraer filas
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rawRows.length < 2) {
    throw new Error('El archivo de metas no contiene datos suficientes.');
  }

  // Determinar día actual (o fallback al día 1)
  const todayNum = Math.min(Math.max(new Date().getDate(), 1), dayCols.length || 31);
  const currentPeriod = periodos.find(p => p.dias.includes(todayNum)) || periodos[0] || { dias: [1,2,3,4,5,6,7,8] };

  // Fila 2: Meta General de Tienda
  const storeRow = rawRows[1] || [];
  const storeMetasDiarias = {};
  let storeMetaMensual = 0;
  let storeMetaPeriodoActual = 0;

  dayCols.forEach((col, idx) => {
    const val = parseFloat(storeRow[idx + 3]) || 0;
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
    nombres: 'PORTAL CARAPUNGO',
    apellidos: 'TIENDA TOTAL',
    cargo: 'TOTAL TIENDA',
    meta_diaria: storeMetasDiarias[todayNum] || 0,
    meta_semanal: storeMetaPeriodoActual,
    meta_mensual: storeMetaMensual,
    metas_diarias: storeMetasDiarias,
    periodos: storePeriodosStats
  };

  // Filas 3..N: Asesores y Personal
  const asesores = [];
  for (let r = 2; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || !row[0]) continue;

    const nombreCompleto = String(row[0] || '').trim();
    const cargo = String(row[1] || 'ASESOR DE VENTAS').trim();
    let rawCedula = String(row[2] || '').trim();
    // Asegurar 10 dígitos para cédulas de Ecuador
    if (rawCedula.length < 10 && /^\d+$/.test(rawCedula)) {
      rawCedula = rawCedula.padStart(10, '0');
    }

    const asesorMetasDiarias = {};
    let asesorMetaMensual = 0;
    let asesorMetaPeriodoActual = 0;

    dayCols.forEach((col, idx) => {
      const val = parseFloat(row[idx + 3]) || 0;
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
      cedula: rawCedula,
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
  const { tiendaMeta, asesores, periodos } = parsedData;

  const recordsToUpsert = [];

  // 1. Registro de Tienda General
  recordsToUpsert.push({
    cedula: '0000000000',
    nombres: 'PORTAL SHOPPING',
    apellidos: 'CARAPUNGO',
    cargo: 'TOTAL TIENDA',
    meta_diaria: tiendaMeta.meta_diaria,
    meta_semanal: tiendaMeta.meta_semanal,
    meta_mensual: tiendaMeta.meta_mensual,
    metas_diarias: tiendaMeta.metas_diarias,
    periodos: tiendaMeta.periodos,
    mes_anio: '2026-08',
    updated_at: new Date().toISOString()
  });

  // 2. Registros de Asesores
  asesores.forEach(a => {
    const parts = a.nombre_completo.split(' ');
    const apellidos = parts.slice(0, 2).join(' ') || parts[0] || 'Asesor';
    const nombres = parts.slice(2).join(' ') || parts.slice(1).join(' ') || a.nombre_completo;

    recordsToUpsert.push({
      cedula: a.cedula,
      nombres,
      apellidos,
      cargo: a.cargo,
      meta_diaria: a.meta_diaria,
      meta_semanal: a.meta_semanal,
      meta_mensual: a.meta_mensual,
      metas_diarias: a.metas_diarias,
      periodos: a.periodos,
      mes_anio: '2026-08',
      updated_at: new Date().toISOString()
    });
  });

  // Upsert en tabla `metas`
  const { error } = await supabase
    .from('metas')
    .upsert(recordsToUpsert, { onConflict: 'cedula' });

  if (error) throw error;

  // Actualizar también `tienda_stats`
  await supabase
    .from('tienda_stats')
    .upsert({
      tienda_id: '00000000-0000-0000-0000-000000000000',
      meta_diaria_tienda: tiendaMeta.meta_diaria,
      meta_semanal_tienda: tiendaMeta.meta_semanal,
      meta_mensual: tiendaMeta.meta_mensual,
      updated_at: new Date().toISOString()
    }, { onConflict: 'tienda_id' })
    .select();

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

  const dayKey = targetDay || 24;
  
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

