import { useState, useEffect, useRef, Fragment } from 'react';
import { useAuthStore } from '../store/authStore';
import { useHorarioStore } from '../store/horarioStore';
import { useMetasStore } from '../store/metasStore';
import { getEmployeeTheme } from '../utils/themeHelper';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';
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
  Upload, 
  Edit3, 
  CheckCircle2,
  RefreshCw,
  Search,
  AlertCircle,
  AlertTriangle,
  Info,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const getDaysInCurrentMonth = () => {
  try {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  } catch {
    return 30;
  }
};

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

const getReportingDayIndex = (teamMetas) => {
  return Math.min(getDaysInCurrentMonth(), Math.max(1, getEcuadorDayIndex()));
};

const normCedula = (c) => {
  const str = String(c || '').trim();
  if (str.length === 9 && /^\d+$/.test(str)) return '0' + str;
  return str;
};

const getWeekDays = (dayIdx) => {
  const daysInMonth = getDaysInCurrentMonth();
  if (dayIdx <= 8) return [1, 2, 3, 4, 5, 6, 7, 8];
  if (dayIdx <= 15) return [9, 10, 11, 12, 13, 14, 15];
  if (dayIdx <= 23) return [16, 17, 18, 19, 20, 21, 22, 23];
  return Array.from({ length: daysInMonth - 23 }, (_, i) => 24 + i);
};

const parseRawBossSheet = (sheet) => {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (rows.length < 3) return null;

  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r];
    if (row && row.some(cell => String(cell).toUpperCase().includes('APELLIDO')) &&
               row.some(cell => String(cell).toUpperCase().includes('CARGO')) &&
               row.some(cell => String(cell).toUpperCase().includes('CEDULA'))) {
      headerRowIdx = r;
      break;
    }
  }

  if (headerRowIdx === -1) return null;

  const headers = rows[headerRowIdx].map(h => String(h || '').trim().toUpperCase());
  const nameIdx = headers.findIndex(h => h.includes('APELLIDO') || h.includes('NOMBRE'));
  const cargoIdx = headers.findIndex(h => h.includes('CARGO'));
  const cedulaIdx = headers.findIndex(h => h.includes('CEDULA'));

  const dayCols = [];
  headers.forEach((h, idx) => {
    const num = parseInt(h);
    if (!isNaN(num) && num >= 1 && num <= 31) {
      dayCols.push({ day: num, colIdx: idx });
    }
  });

  dayCols.sort((a, b) => a.day - b.day);
  if (dayCols.length === 0) return null;

  const parsedAdvisors = [];
  const storeDailyGoalsMap = {};
  dayCols.forEach(dc => {
    storeDailyGoalsMap[dc.day] = 0;
  });

  const firstRowAfterHeader = rows[headerRowIdx + 1];
  let storeTotalsRowFound = false;
  if (firstRowAfterHeader) {
    const nameVal = String(firstRowAfterHeader[nameIdx] || '').trim();
    const cargoVal = String(firstRowAfterHeader[cargoIdx] || '').trim();
    const cedulaVal = String(firstRowAfterHeader[cedulaIdx] || '').trim();
    if (!nameVal && !cargoVal && !cedulaVal) {
      storeTotalsRowFound = true;
      dayCols.forEach(dc => {
        const val = parseFloat(firstRowAfterHeader[dc.colIdx]);
        if (!isNaN(val)) {
          storeDailyGoalsMap[dc.day] = val;
        }
      });
    }
  }

  const startRowIdx = headerRowIdx + (storeTotalsRowFound ? 2 : 1);

  const daysInMonth = getDaysInCurrentMonth();
  const todayDayIndex = Math.min(daysInMonth, Math.max(1, getEcuadorDayIndex()));
  const weekDays = getWeekDays(todayDayIndex);

  for (let r = startRowIdx; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length <= Math.max(nameIdx, cargoIdx, cedulaIdx)) continue;

    const nameVal = String(row[nameIdx] || '').trim();
    const cargoVal = String(row[cargoIdx] || '').trim().toUpperCase();
    let cedulaVal = String(row[cedulaIdx] || '').trim();

    if (!cedulaVal || cedulaVal.toLowerCase() === 'null') continue;

    if (cedulaVal.length === 9 && /^\d+$/.test(cedulaVal)) {
      cedulaVal = '0' + cedulaVal;
    }

    if (!/^\d+$/.test(cedulaVal)) continue;
    if (!cargoVal.includes('ASESOR')) continue;

    const daily_sales = [];
    dayCols.forEach(dc => {
      const val = row[dc.colIdx];
      const goal = (val !== undefined && val !== null && val !== '') ? parseFloat(val) : 0.0;
      daily_sales.push({
        dia: dc.day,
        goal: goal,
        sale: 0,
        monto: 0
      });
    });

    const meta_mensual = daily_sales.reduce((sum, d) => sum + d.goal, 0);
    const meta_semanal = daily_sales.filter(d => weekDays.includes(d.dia)).reduce((sum, d) => sum + d.goal, 0) || (meta_mensual / 4.0);
    const todayGoalObj = daily_sales.find(d => d.dia === todayDayIndex);
    const meta_diaria = (todayGoalObj && todayGoalObj.goal > 0) ? todayGoalObj.goal : (parseFloat((meta_semanal / 6).toFixed(2)) || 0);

    parsedAdvisors.push({
      cedula: cedulaVal,
      nombres: nameVal,
      apellidos: '',
      meta_mensual,
      meta_semanal,
      meta_diaria,
      meta: meta_semanal,
      acum_ventas: 0.0,
      pct: 0,
      comentario: 'Metas asignadas desde la plantilla del jefe.',
      daily_sales
    });
  }

  // If storeTotalsRow was not found or was zero, compute as sum of advisors
  dayCols.forEach(dc => {
    if (storeDailyGoalsMap[dc.day] === 0) {
      const sumAdvisors = parsedAdvisors.reduce((acc, adv) => {
        const val = adv.daily_sales.find(d => d.dia === dc.day)?.goal || 0;
        return acc + val;
      }, 0);
      storeDailyGoalsMap[dc.day] = sumAdvisors;
    }
  });

  return {
    advisors: parsedAdvisors,
    storeDailyGoalsMap
  };
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
  const activePeriod = getPeriodIndex(Math.min(getDaysInCurrentMonth(), Math.max(1, getEcuadorDayIndex())));
  if (period === activePeriod) {
    return comentarioStr;
  }
  return '';
};

export default function MetasAdmin() {
  const { user } = useAuthStore();
  const { theme: activeTheme } = useThemeStore();
  const cargo = user?.user_metadata?.cargo || 'Jefe';
  const isTercero = cargo && (cargo.toLowerCase().includes('tercer') || cargo === 'Tercero a bordo');
  const myTheme = getEmployeeTheme(cargo, user?.user_metadata?.nombres || '', user?.user_metadata?.cargo_anterior || '');
  const tc = getThemeClasses(activeTheme, myTheme);

  // Zustand Store
  const { empleados, fetchEmpleados } = useHorarioStore();
  const { teamMetas, storeStats, hasFetched, fetchMetas, saveMetasState, updateMetaIndividual, updateStoreStats } = useMetasStore();

  // Local States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('2026-06-01_2026-06-07');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [showStoreEditModal, setShowStoreEditModal] = useState(false);
  const [formTicketPromedio, setFormTicketPromedio] = useState('');
  const [formConversion, setFormConversion] = useState('');
  const [formFacturas, setFormFacturas] = useState('');
  const [formMetaDiariaTienda, setFormMetaDiariaTienda] = useState('');
  const [formMetaSemanalTienda, setFormMetaSemanalTienda] = useState('');
  const [formTotalVentaLograda, setFormTotalVentaLograda] = useState('');
  
  // Quick Edit form states
  const [formMeta, setFormMeta] = useState('');
  const [formMetaSemanal, setFormMetaSemanal] = useState('');
  const [formMetaDiaria, setFormMetaDiaria] = useState('');
  const [formComentario, setFormComentario] = useState('');
  const [coachingP1, setCoachingP1] = useState('');
  const [coachingP2, setCoachingP2] = useState('');
  const [coachingP3, setCoachingP3] = useState('');
  const [coachingP4, setCoachingP4] = useState('');
  const [activeModalPeriodTab, setActiveModalPeriodTab] = useState(1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(1);
  const [dayValue, setDayValue] = useState('0');
  const [dailySalesList, setDailySalesList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Excel Pending Upload preview states
  const [pendingUploadData, setPendingUploadData] = useState(null);
  const [isConfirmingUpload, setIsConfirmingUpload] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // Helper para capitalizar nombres de forma estética
  const capitalize = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Cargar datos al montar
  useEffect(() => {
    fetchEmpleados();
    fetchMetas();
  }, [fetchEmpleados, fetchMetas]);

  // Sincronización en tiempo real para empleados y metas en panel de metas
  useEffect(() => {
    const channelMetas = supabase
      .channel('realtime-metas-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'empleados' },
        () => {
          fetchEmpleados();
          fetchMetas();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'metas' },
        () => {
          fetchMetas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelMetas);
    };
  }, [fetchEmpleados, fetchMetas]);

  // Si la tienda local está vacía, la poblamos inicialmente con los asesores activos del sistema
  useEffect(() => {
    if (hasFetched && empleados.length > 0 && teamMetas.length === 0) {
      const asesores = empleados.filter(e => e.cargo === 'Asesor de Ventas' && e.activo);
      const initialMetas = asesores.map((emp, index) => {
        const defaultGoals = [
          { meta: 3500.00, alcanzado: 2850.00, comentario: 'Buen avance de ventas.' },
          { meta: 3500.00, alcanzado: 3600.00, comentario: 'Excelente, meta superada!' },
          { meta: 3200.00, alcanzado: 3450.00, comentario: 'Desempeño sobresaliente en calzado.' },
          { meta: 3000.00, alcanzado: 1500.00, comentario: 'Falta empuje para lograr el objetivo.' },
          { meta: 3200.00, alcanzado: 2900.00, comentario: 'Cerca del objetivo semanal.' },
          { meta: 2800.00, alcanzado: 2600.00, comentario: 'Buen esfuerzo semanal.' },
          { meta: 3100.00, alcanzado: 3050.00, comentario: 'Ventas constantes en textil.' }
        ];
        const dg = defaultGoals[index % defaultGoals.length];
        
        const metaDiaria = parseFloat((dg.meta / 6).toFixed(2));
        
        // Generar días del mes con valores por defecto acumulados
        const daily_sales = [];
        const daysInMonth = getDaysInCurrentMonth();
        for (let i = 1; i <= daysInMonth; i++) {
          let val = 0;
          if (i === 1) val = dg.alcanzado * 0.45;
          if (i === 2) val = dg.alcanzado * 0.55;
          daily_sales.push({ 
            dia: i, 
            goal: metaDiaria,
            monto: parseFloat(val.toFixed(2)) 
          });
        }

        const todayDayIndex = Math.min(daysInMonth, Math.max(1, getEcuadorDayIndex()));
        const todayAchieved = daily_sales.find(d => d.dia === todayDayIndex)?.monto || 0;
        const pct = metaDiaria > 0 ? Math.round((todayAchieved / metaDiaria) * 100) : 0;

        return {
          cedula: emp.cedula,
          nombres: capitalize(emp.nombres),
          apellidos: capitalize(emp.apellidos),
          meta_mensual: dg.meta * 4,
          meta_semanal: dg.meta,
          meta_diaria: metaDiaria,
          meta: dg.meta,
          acum_ventas: dg.alcanzado,
          pct,
          comentario: dg.comentario,
          daily_sales
        };
      });
      saveMetasState(initialMetas, storeStats);
    }
  }, [hasFetched, empleados, teamMetas, saveMetasState, storeStats]);

  // Lector de Excel adaptado a la plantilla oficial Marathon_Metas_Final_2.xlsx
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Detección dinámica de hojas (nombre específico o contenido)
        const sheetNames = workbook.SheetNames;

        // 1. Intentar detectar si es la plantilla de metas del jefe (formato crudo .xls/.xlsx)
        let isBossSheet = false;
        let bossData = null;
        for (const name of sheetNames) {
          const sheet = workbook.Sheets[name];
          const parsed = parseRawBossSheet(sheet);
          if (parsed && parsed.advisors.length > 0) {
            isBossSheet = true;
            bossData = parsed;
            break;
          }
        }

        if (isBossSheet && bossData) {
          const { advisors: parsedAdvisors, storeDailyGoalsMap } = bossData;
          const daysInMonth = getDaysInCurrentMonth();
          const todayDayIndex = Math.min(daysInMonth, Math.max(1, getEcuadorDayIndex()));
          const weekDays = getWeekDays(todayDayIndex);

          const parsedMetas = parsedAdvisors.map(adv => {
            const systemEmp = empleados.find(emp => normCedula(emp.cedula) === normCedula(adv.cedula));
            const nombres = systemEmp ? capitalize(systemEmp.nombres) : capitalize(adv.nombres);
            const apellidos = systemEmp ? capitalize(systemEmp.apellidos) : '';
            
            const existing = teamMetas.find(tm => normCedula(tm.cedula) === normCedula(adv.cedula));
            const comentario = existing ? existing.comentario : 'Metas y avance diarios sincronizados.';
            
            // Preservar ventas diarias ya logradas previamente este mes
            const mergedDailySales = adv.daily_sales.map(dObj => {
              let saleVal = 0;
              if (existing && existing.daily_sales) {
                const existingDay = existing.daily_sales.find(x => x.dia === dObj.dia);
                if (existingDay && (existingDay.monto > 0 || existingDay.sale > 0)) {
                  saleVal = existingDay.monto || existingDay.sale || 0;
                }
              }
              return {
                ...dObj,
                sale: saleVal,
                monto: saleVal
              };
            });

            const acum_ventas = (existing && existing.acum_ventas !== undefined && existing.acum_ventas !== null && existing.acum_ventas > 0)
              ? existing.acum_ventas
              : mergedDailySales.reduce((sum, d) => sum + d.monto, 0);

            const todayAchieved = mergedDailySales.find(d => d.dia === todayDayIndex)?.monto || 0;
            const pct = adv.meta_diaria > 0 ? Math.round((todayAchieved / adv.meta_diaria) * 100) : 0;

            return {
              ...adv,
              nombres,
              apellidos,
              comentario,
              daily_sales: mergedDailySales,
              acum_ventas,
              pct
            };
          });

          const metaDiariaTienda = storeDailyGoalsMap[todayDayIndex] || storeStats.metaDiariaTienda || 3800.00;
          const metaSemanalTienda = weekDays.reduce((acc, d) => acc + (storeDailyGoalsMap[d] || 0), 0) || storeStats.metaSemanalTienda || 15000.00;

          const storeDailyGoals = Array.from({ length: daysInMonth }, (_, i) => ({
            dia: i + 1,
            monto: storeDailyGoalsMap[i + 1] || 0
          }));

          const totalVentaLograda = storeStats.totalVentaLograda || parsedMetas.reduce((acc, m) => acc + (m.acum_ventas || 0), 0);

          const shopStats = {
            ticketPromedio: storeStats.ticketPromedio || 112.82,
            facturas: storeStats.facturas || 1528,
            conversion: storeStats.conversion || 72.47,
            metaDiariaTienda,
            metaSemanalTienda,
            totalVentaLograda,
            ventaTienda: storeStats.ventaTienda || totalVentaLograda || 0,
            trafico: (storeStats.conversion || 72.47) > 0 ? ((storeStats.facturas || 1528) / ((storeStats.conversion || 72.47) / 100)) : 1,
            dailyGoals: storeDailyGoals
          };

          setPendingUploadData({
            parsedMetas,
            shopStats,
            fileName: file.name,
            type: 'boss'
          });
          return;
        }

        let detalleDiarioSheet = workbook.Sheets['DETALLE_DIARIO'];
        let configuracionSheet = workbook.Sheets['CONFIGURACION'];
        let datosTiendaSheet = workbook.Sheets['DATOS_TIENDA'];
        let vntSheet = workbook.Sheets['Hoja1'] || workbook.Sheets['VNT011'];

        // Fallbacks por contenido
        if (!detalleDiarioSheet) {
          for (const name of sheetNames) {
            const sheet = workbook.Sheets[name];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (rows[0] && String(rows[0][0]).toUpperCase().includes('DETALLE METAS')) {
              detalleDiarioSheet = sheet;
              break;
            }
          }
        }
        if (!datosTiendaSheet) {
          for (const name of sheetNames) {
            const sheet = workbook.Sheets[name];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (rows[0] && rows[0].some(cell => String(cell).toLowerCase().includes('meta dia'))) {
              datosTiendaSheet = sheet;
              break;
            }
          }
        }
        if (!vntSheet) {
          for (const name of sheetNames) {
            const sheet = workbook.Sheets[name];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (rows.some(r => r && r.some(cell => String(cell).toLowerCase().includes('listado de ventas')))) {
              vntSheet = sheet;
              break;
            }
          }
        }

        if (!detalleDiarioSheet) {
          alert("Error: El archivo Excel no contiene la pestaña de historial 'DETALLE_DIARIO' ni ninguna equivalente.");
          return;
        }

        // 1. Procesar Reporte Diario de Ventas (Hoja 3 / VNT011) si existe
        let salesByCedula = {};
        let storeFacturas = 0;
        let storeVentaTotal = 0.0;
        let reportDay = null;

        if (vntSheet) {
          const vntRows = XLSX.utils.sheet_to_json(vntSheet, { header: 1 });
          
          // Buscar fecha en las primeras 10 filas
          let dateStr = "";
          for (let r = 0; r < Math.min(10, vntRows.length); r++) {
            const row = vntRows[r];
            if (!row) continue;
            for (let c = 0; c < row.length; c++) {
              const cellVal = String(row[c] || '');
              if (cellVal.includes('Fecha:')) {
                dateStr = cellVal;
                break;
              }
            }
            if (dateStr) break;
          }

          const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (dateMatch) {
            reportDay = parseInt(dateMatch[1]);
          }

          // Encontrar índice de columna de "NOMBRE VENDEDOR" dinámicamente
          let cIdx = -1;
          for (let r = 0; r < vntRows.length; r++) {
            const row = vntRows[r];
            if (!row) continue;
            const idx = row.findIndex(cell => cell && String(cell).trim().toUpperCase() === "NOMBRE VENDEDOR");
            if (idx !== -1) {
              cIdx = idx;
              break;
            }
          }
          if (cIdx === -1) cIdx = 1; // fallback por defecto

          let currentSellerId = null;
          let currentSellerName = null;
          let totalVentaColIdx = cIdx + 10; // fallback por defecto

          for (let r = 0; r < vntRows.length; r++) {
            const row = vntRows[r];
            if (!row || row.length < cIdx + 1) continue;

            const cellVal = String(row[cIdx] || '').trim().toUpperCase();

            // Detectar bloque de vendedor
            if (cellVal === 'NOMBRE VENDEDOR') {
              const nextRow = vntRows[r + 1];
              if (nextRow && nextRow.length > cIdx + 5) {
                currentSellerId = String(nextRow[cIdx] || '').trim();
                currentSellerName = String(nextRow[cIdx + 5] || '').trim();
              }
              continue;
            }

            // Cabecera de grupo para encontrar el índice de "TOTAL VENTA"
            if (cellVal === 'GRUPO') {
              const idx = row.indexOf('TOTAL VENTA');
              if (idx !== -1) {
                totalVentaColIdx = idx;
              }
              continue;
            }

            // Totales de vendedor
            if (currentSellerId && cellVal === 'TOTALES') {
              const totalVenta = parseFloat(row[totalVentaColIdx]) || 0.0;
              let normalizedCedula = currentSellerId;
              if (normalizedCedula.length === 9 && /^\d+$/.test(normalizedCedula)) {
                normalizedCedula = '0' + normalizedCedula;
              }
              salesByCedula[normalizedCedula] = {
                name: currentSellerName,
                total: totalVenta
              };
              currentSellerId = null;
              currentSellerName = null;
              continue;
            }

            // Totales de Tienda
            const hasStoreTotals = row.some(cell => cell && String(cell).trim().toUpperCase() === 'TOTALES TIENDA');
            if (hasStoreTotals) {
              const totalsRow = vntRows[r + 2];
              if (totalsRow) {
                // Las facturas están en la columna cIdx, la venta total en totalVentaColIdx (o cIdx + 10)
                storeFacturas = parseInt(totalsRow[cIdx]) || 0;
                storeVentaTotal = parseFloat(totalsRow[totalVentaColIdx]) || 0.0;
              }
            }
          }
        }

        // 2. Procesar Metas y Avances (Hoja 1 / DETALLE_DIARIO)
        const rawRows = XLSX.utils.sheet_to_json(detalleDiarioSheet, { header: 1 });
        if (rawRows.length < 3) {
          alert("Error: La pestaña 'DETALLE_DIARIO' está vacía o mal estructurada.");
          return;
        }

        // Mapear los índices de CONFIGURACION si existe (formato antiguo)
        const configRows = configuracionSheet ? XLSX.utils.sheet_to_json(configuracionSheet, { header: 1 }) : [];
        const configMap = {};
        if (configuracionSheet) {
          for (let r = 3; r < configRows.length; r++) {
            const row = configRows[r];
            if (!row || !row[1]) continue;
            const nameKey = String(row[1]).trim().toUpperCase();
            if (nameKey.includes('TOTAL')) continue;
            
            const metaSem = parseFloat(row[3]) || 0;
            configMap[nameKey] = {
              metaMensual: parseFloat(row[2]) || 0,
              metaSemanal: metaSem,
              metaDiaria: parseFloat((metaSem / 6).toFixed(2)) || 0
            };
          }
        }

        // Mapear dinámicamente las columnas de días (DIA_01 a DIA_30) desde las cabeceras
        const headers = rawRows[1] || [];
        const dayCols = [];
        headers.forEach((h, idx) => {
          const hStr = String(h || '').trim().toUpperCase();
          if (hStr.startsWith('DIA_')) {
            dayCols.push(idx);
          }
        });

        // Encontrar índices de meta mensual y semanal dinámicamente
        const metaMensualColIdx = headers.findIndex(h => String(h || '').trim().toUpperCase() === 'META_MENSUAL');
        const metaSemanalColIdx = headers.findIndex(h => String(h || '').trim().toUpperCase() === 'META_SEMANAL');
        const metaMensualIdx = metaMensualColIdx !== -1 ? metaMensualColIdx : 36;
        const metaSemanalIdx = metaSemanalColIdx !== -1 ? metaSemanalColIdx : 37;

        const parsedMetas = [];

        // Leer filas a partir de la fila 2 (índice 2)
        for (let r = 2; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || !row[1]) continue; // Omitir si la cédula está vacía

          const nombreExcel = String(row[0]).trim();
          let cedula = String(row[1]).trim();
          if (cedula.length === 9 && /^\d+$/.test(cedula)) {
            cedula = '0' + cedula;
          }

          // Ignorar fila de totales u otras filas vacías
          if (nombreExcel.toUpperCase().includes('TOTAL') || cedula.toLowerCase() === 'null' || !/^\d+$/.test(cedula)) {
            continue;
          }

          // Intentar asociar con empleado del sistema por cédula
          const systemEmp = empleados.find(emp => normCedula(emp.cedula) === normCedula(cedula));
          
          // Filtrar: solo permitir si es un Asesor de Ventas
          if (systemEmp && systemEmp.cargo !== 'Asesor de Ventas') {
            continue;
          }

          const nombres = systemEmp ? capitalize(systemEmp.nombres) : capitalize(nombreExcel);
          const apellidos = systemEmp ? capitalize(systemEmp.apellidos) : '';

          // Obtener metas correctas (de CONFIGURACION o directamente de DETALLE_DIARIO)
          let metaMensual = 0;
          let metaSemanal = 0;

          if (configuracionSheet) {
            const lookupName = nombreExcel.toUpperCase();
            const configEntry = configMap[lookupName] || { metaMensual: 0, metaSemanal: 0 };
            metaMensual = configEntry.metaMensual;
            metaSemanal = configEntry.metaSemanal;
          } else {
            // Usar los índices detectados dinámicamente para metas
            metaMensual = parseFloat(row[metaMensualIdx]) || 0;
            metaSemanal = parseFloat(row[metaSemanalIdx]) || 0;
          }

          const metaDiaria = parseFloat((metaSemanal / 6).toFixed(2)) || 0;

          // Extraer las ventas diarias y combinar con VNT011
          const daily_sales = [];
          const existingAdv = teamMetas.find(m => normCedula(m.cedula) === normCedula(cedula));
          dayCols.forEach((colIdx, dIdx) => {
            const dayNum = dIdx + 1;
            let val = row[colIdx];
            let goalVal = (val !== undefined && val !== null && val !== '') ? parseFloat(val) : 0;
            let saleVal = 0;

            // Preservar venta anterior si ya existe en la base de datos
            if (existingAdv && existingAdv.daily_sales) {
              const existingDay = existingAdv.daily_sales.find(d => d.dia === dayNum);
              if (existingDay && (existingDay.monto > 0 || existingDay.sale > 0)) {
                saleVal = existingDay.monto || existingDay.sale || 0;
              }
            }

            // Si coincide con el día de VNT011, sobrescribir
            if (reportDay && dayNum === reportDay) {
              const vendedorData = salesByCedula[cedula] || salesByCedula[parseInt(cedula)];
              saleVal = vendedorData ? vendedorData.total : 0.0;
            }

            daily_sales.push({
              dia: dayNum,
              goal: goalVal,
              sale: saleVal,
              monto: saleVal
            });
          });

          // Calcular acumulado de ventas
          const acum_ventas = daily_sales.reduce((sum, d) => sum + d.monto, 0);
          
          // Progreso diario
          const daysInMonth = dayCols.length || getDaysInCurrentMonth();
          const todayDayIndex = reportDay || Math.min(daysInMonth, Math.max(1, getEcuadorDayIndex()));
          const todayAchieved = daily_sales.find(d => d.dia === todayDayIndex)?.monto || 0;
          const pct = metaDiaria > 0 ? Math.round((todayAchieved / metaDiaria) * 100) : 0;

          const existing = teamMetas.find(tm => normCedula(tm.cedula) === normCedula(cedula));
          const comentario = existing ? existing.comentario : 'Metas y avance diarios sincronizados.';

          parsedMetas.push({
            cedula,
            nombres,
            apellidos,
            meta_mensual: metaMensual,
            meta_semanal: metaSemanal,
            meta_diaria: metaDiaria,
            meta: metaSemanal,
            acum_ventas,
            pct,
            comentario,
            daily_sales
          });
        }

        // 3. Procesar Estadísticas Generales (Hoja 2 / DATOS_TIENDA)
        const daysInMonth = dayCols.length || getDaysInCurrentMonth();
        const storeDailyGoals = Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1;
          const sum = parsedMetas.reduce((acc, m) => acc + (m.daily_sales?.find(d => d.dia === dayNum)?.goal || 0), 0);
          return { dia: dayNum, monto: sum };
        });

        const shopStats = {
          ticketPromedio: 112.82,
          facturas: 1528,
          conversion: 72.47,
          metaDiariaTienda: 3800.00,
          metaSemanalTienda: null,
          totalVentaLograda: null,
          ventaTienda: 1528 * 112.82,
          trafico: 1528 / (72.47 / 100),
          dailyGoals: storeDailyGoals
        };

        // Meta Diaria y Semanal de la Tienda desde fila 'SUMA TOTAL' en DETALLE_DIARIO
        const sumaTotalRow = rawRows.find(r => r && r[0] && String(r[0]).trim().toUpperCase() === 'SUMA TOTAL');
        if (sumaTotalRow) {
          const todayDayIndex = reportDay || Math.min(daysInMonth, Math.max(1, getEcuadorDayIndex()));
          const todayColIdx = dayCols[todayDayIndex - 1];
          
          const dailyVal = parseFloat(sumaTotalRow[todayColIdx]);
          if (!isNaN(dailyVal)) {
            shopStats.metaDiariaTienda = dailyVal;
          }

          const weeklyVal = parseFloat(sumaTotalRow[metaSemanalIdx]);
          if (!isNaN(weeklyVal)) {
            shopStats.metaSemanalTienda = weeklyVal;
          }
        }

        // Leer conversión y otros de DATOS_TIENDA
        if (datosTiendaSheet) {
          const dtRows = XLSX.utils.sheet_to_json(datosTiendaSheet, { header: 1 });
          
          // Detectar diseño de la hoja
          let isNewFormat = false;
          for (let r = 0; r < Math.min(5, dtRows.length); r++) {
            if (dtRows[r] && dtRows[r].some(cell => String(cell).toUpperCase().includes('TICKET_PROMEDIO'))) {
              isNewFormat = true;
              break;
            }
          }

          let firstEmpRow = null;
          let tgRow = null;
          let ticketVal = NaN, facturasVal = NaN, conversionVal = NaN, logradaVal = NaN;

          if (isNewFormat) {
            firstEmpRow = dtRows.find(r => r && r[3] && /^\d+$/.test(String(r[3]).trim()));
            if (firstEmpRow) {
              ticketVal = parseFloat(firstEmpRow[10]);
              facturasVal = parseFloat(firstEmpRow[12]);
              conversionVal = parseFloat(firstEmpRow[14]);
            }
            tgRow = dtRows.find(r => r && r[2] && String(r[2]).trim().toLowerCase().includes('total general'));
            if (tgRow) {
              logradaVal = parseFloat(tgRow[5]);
            }
          } else {
            firstEmpRow = dtRows.find(r => r && r[3] && /^\d+$/.test(String(r[3]).trim()));
            if (firstEmpRow) {
              ticketVal = parseFloat(firstEmpRow[9]);
              facturasVal = parseFloat(firstEmpRow[11]);
              conversionVal = parseFloat(firstEmpRow[13]);
            }
            tgRow = dtRows.find(r => r && (
              (r[1] && String(r[1]).trim().toLowerCase().includes('total general')) ||
              (r[2] && String(r[2]).trim().toLowerCase().includes('total general'))
            ));
            if (tgRow) {
              logradaVal = parseFloat(tgRow[4]);
            }
          }

          if (firstEmpRow) {
            if (!isNaN(ticketVal)) shopStats.ticketPromedio = parseFloat(ticketVal.toFixed(2));
            if (!isNaN(facturasVal)) shopStats.facturas = facturasVal > 1000000 ? Math.round(facturasVal / 10000) : Math.round(facturasVal);
            if (!isNaN(conversionVal)) {
              const scale = conversionVal <= 1.0 ? 100 : 1;
              shopStats.conversion = parseFloat((conversionVal * scale).toFixed(2));
            }
            shopStats.ventaTienda = shopStats.facturas * shopStats.ticketPromedio;
            shopStats.trafico = shopStats.conversion > 0 ? (shopStats.facturas / (shopStats.conversion / 100)) : 0;
          }

          if (!isNaN(logradaVal)) {
            shopStats.totalVentaLograda = logradaVal;
          }
        }

        // Si se procesó la hoja VNT011, usar sus totales más actualizados
        if (vntSheet) {
          shopStats.facturas = storeFacturas;
          shopStats.totalVentaLograda = storeVentaTotal;
          shopStats.ticketPromedio = storeFacturas > 0 ? parseFloat((storeVentaTotal / storeFacturas).toFixed(2)) : 0.0;
          shopStats.ventaTienda = storeVentaTotal;
          shopStats.trafico = shopStats.conversion > 0 ? (storeFacturas / (shopStats.conversion / 100)) : 0;
        }

        setPendingUploadData({
          parsedMetas,
          shopStats,
          fileName: file.name,
          type: 'standard'
        });
      } catch (err) {
        console.error(err);
        alert("❌ Error al leer el archivo de metas: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const parseLocaleFloat = (str) => {
      if (!str) return 0;
      let clean = str.replace(/[^0-9.,-]/g, '').trim();
      if (clean.includes(',') && clean.includes('.')) {
        if (clean.indexOf(',') < clean.indexOf('.')) {
          clean = clean.replace(/,/g, '');
        } else {
          clean = clean.replace(/\./g, '').replace(',', '.');
        }
      } else if (clean.includes(',')) {
        const parts = clean.split(',');
        if (parts[parts.length - 1].length === 3) {
          clean = clean.replace(/,/g, '');
        } else {
          clean = clean.replace(',', '.');
        }
      } else if (clean.includes('.')) {
        const parts = clean.split('.');
        if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
          clean = clean.replace(/\./g, '');
        }
      }
      return parseFloat(clean) || 0;
    };

    const findEmpleadoByName = (parsedName) => {
      if (!parsedName) return null;
      
      const normalize = (str) => {
        return str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/ñ/g, "n")
          .replace(/[^a-z0-9\s]/g, "")
          .trim();
      };

      const levenshtein = (a, b) => {
        if (a.length < b.length) return levenshtein(b, a);
        if (b.length === 0) return a.length;
        let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 0; i < a.length; i++) {
          let currRow = [i + 1];
          for (let j = 0; j < b.length; j++) {
            let insertions = prevRow[j + 1] + 1;
            let deletions = currRow[j] + 1;
            let substitutions = prevRow[j] + (a[i] === b[j] ? 0 : 1);
            currRow.push(Math.min(insertions, deletions, substitutions));
          }
          prevRow = currRow;
        }
        return prevRow[prevRow.length - 1];
      };

      const areTokensSimilar = (t1, t2) => {
        if (t1 === t2) return true;
        if (t1.length <= 3 || t2.length <= 3) return false;
        if (Math.abs(t1.length - t2.length) > 2) return false;
        if (levenshtein(t1, t2) <= 1) return true;
        
        const normY = (t) => t.endsWith('y') ? t.slice(0, -1) + 'i' : (t.endsWith('i') ? t.slice(0, -1) + 'y' : t);
        if (normY(t1) === normY(t2)) return true;
        
        return false;
      };

      const cleanName = normalize(parsedName);
      const nameTokens = cleanName.split(/\s+/).filter(t => t.length > 0);
      if (nameTokens.length === 0) return null;

      // 1. Try exact subset token match first (all search tokens are in database employee name)
      let matches = empleados.filter(emp => {
        const fullName = normalize(`${emp.nombres || ''} ${emp.apellidos || ''}`);
        const empTokens = fullName.split(/\s+/).filter(t => t.length > 0);
        return nameTokens.every(token => empTokens.includes(token));
      });

      if (matches.length === 1) return matches[0];
      if (matches.length > 1) return matches[0];

      // 2. Try fuzzy subset match: every token in PDF name matches at least one token in employee name fuzzily
      matches = empleados.filter(emp => {
        const fullName = normalize(`${emp.nombres || ''} ${emp.apellidos || ''}`);
        const empTokens = fullName.split(/\s+/).filter(t => t.length > 0);
        return nameTokens.every(token => empTokens.some(et => areTokensSimilar(token, et)));
      });

      if (matches.length === 1) return matches[0];
      if (matches.length > 1) return matches[0];

      // 3. Try fallback token overlap match (majority of tokens)
      let bestMatch = null;
      let maxMatchedTokens = 0;
      empleados.forEach(emp => {
        const fullName = normalize(`${emp.nombres || ''} ${emp.apellidos || ''}`);
        const empTokens = fullName.split(/\s+/).filter(t => t.length > 0);
        const matchedCount = nameTokens.filter(token => empTokens.some(et => areTokensSimilar(token, et))).length;
        if (matchedCount > maxMatchedTokens && matchedCount >= Math.min(2, nameTokens.length)) {
          maxMatchedTokens = matchedCount;
          bestMatch = emp;
        }
      });

      return bestMatch;
    };

    setUploadError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let allAssessors = [];
      let pdfDayIndex = null;
      let totalGeneralDia = null;
      let totalGeneralAcum = null;
      if (file.name) {
        const dateMatch = file.name.match(/(\d{1,2})[-_.](\d{1,2})[-_.](\d{4})/);
        if (dateMatch) {
          pdfDayIndex = parseInt(dateMatch[1], 10);
        } else {
          const ventaMatch = file.name.match(/venta[-_.]?(\d{1,2})/i);
          if (ventaMatch) {
            pdfDayIndex = parseInt(ventaMatch[1], 10);
          } else {
            const anyMatch = file.name.match(/(\d{1,2})/);
            if (anyMatch) {
              pdfDayIndex = parseInt(anyMatch[1], 10);
            }
          }
        }
      }

      const pdfPreviewUrl = URL.createObjectURL(file);

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items;

        if (!pdfDayIndex) {
          const fullPageText = items.map(item => item.str).join(' ');
          const match = fullPageText.match(/Suma\s+de(?:l)?\s+(\d+)/i);
          if (match) {
            pdfDayIndex = parseInt(match[1], 10);
          }
        }

        // Group sorted items into rows using Y tolerance of 2.5
        const rowsMap = new Map();
        items.forEach(item => {
          if (!item.str.trim()) return;
          const y = item.transform[5];
          let foundY = null;
          for (const key of rowsMap.keys()) {
            if (Math.abs(key - y) < 2.5) {
              foundY = key;
              break;
            }
          }
          if (foundY !== null) {
            rowsMap.get(foundY).push(item);
          } else {
            rowsMap.set(y, [item]);
          }
        });

        const sortedYKeys = Array.from(rowsMap.keys()).sort((a, b) => b - a);

        // Detect dynamic header centers if available
        const headerCenters = {};
        sortedYKeys.forEach(y => {
          const rowItems = rowsMap.get(y);
          const textComb = rowItems.map(it => it.str.toLowerCase()).join(' ');
          if (textComb.includes('vta') || textComb.includes('venta al dia') || textComb.includes('cumpl/fec')) {
            rowItems.forEach(it => {
              const txt = it.str.toLowerCase().trim();
              const x = it.transform[4];
              if (txt.includes('vta_dia') || txt.includes('vta/dia') || txt.includes('vta.dia') || txt.includes('vta dia')) headerCenters.vtaDia = x;
              else if (txt.includes('vta/pro') || txt.includes('vta_pro') || txt.includes('vta.pro') || txt.includes('vta/promedio')) headerCenters.vtaPro = x;
              else if (txt.includes('facturas') && !txt.includes('hora')) headerCenters.facturas = x;
              else if (txt.includes('por hora') || txt.includes('facturas/hora')) headerCenters.facturasHora = x;
              else if (txt.includes('cumpl/fec') || txt.includes('cumpl_fec')) headerCenters.cumplFecha = x;
              else if (txt.includes('dif/fecha') || txt.includes('dif_fecha')) headerCenters.difFecha = x;
              else if (txt.includes('cumpl/meta') || txt.includes('cumpl_meta')) headerCenters.cumplMeta = x;
              else if (txt.includes('periodo')) headerCenters.metaPeriodo = x;
              else if (txt.includes('mensual')) headerCenters.metaMensual = x;
              else if (txt.includes('venta al dia') || txt.includes('venta al día')) headerCenters.ventaAcum = x;
            });
          }
        });

        // Compute dynamic bounds
        const b0 = 120;
        const b1 = headerCenters.vtaDia ? headerCenters.vtaDia - 10 : 218;
        const b2 = (headerCenters.vtaDia && headerCenters.vtaPro) ? (headerCenters.vtaDia + headerCenters.vtaPro) / 2 : 242;
        const b3 = (headerCenters.vtaPro && headerCenters.facturas) ? (headerCenters.vtaPro + headerCenters.facturas) / 2 : 270;
        const b4 = (headerCenters.facturas && headerCenters.facturasHora) ? (headerCenters.facturas + headerCenters.facturasHora) / 2 : 295;
        const b5 = (headerCenters.facturasHora && headerCenters.cumplFecha) ? (headerCenters.facturasHora + headerCenters.cumplFecha) / 2 : 318;
        const b6 = (headerCenters.cumplFecha && headerCenters.difFecha) ? (headerCenters.cumplFecha + headerCenters.difFecha) / 2 : 342;
        const b7 = (headerCenters.difFecha && headerCenters.cumplMeta) ? (headerCenters.difFecha + headerCenters.cumplMeta) / 2 : 370;
        const b8 = (headerCenters.cumplMeta && headerCenters.metaPeriodo) ? (headerCenters.cumplMeta + headerCenters.metaPeriodo) / 2 : 400;
        const b9 = (headerCenters.metaPeriodo && headerCenters.metaMensual) ? (headerCenters.metaPeriodo + headerCenters.metaMensual) / 2 : 431;
        const b10 = (headerCenters.metaMensual && headerCenters.ventaAcum) ? (headerCenters.metaMensual + headerCenters.ventaAcum) / 2 : 464;
        const b11 = headerCenters.ventaAcum ? headerCenters.ventaAcum + 55 : 532;

        const ranges = {
          name: [b0, b1],
          vtaDia: [b1, b2],
          vtaPro: [b2, b3],
          facturas: [b3, b4],
          facturasHora: [b4, b5],
          cumplFecha: [b5, b6],
          difFecha: [b6, b7],
          cumplMeta: [b7, b8],
          metaPeriodo: [b8, b9],
          metaMensual: [b9, b10],
          ventaAcum: [b10, b11]
        };

        sortedYKeys.forEach(y => {
          const rowItems = rowsMap.get(y);
          rowItems.sort((a, b) => a.transform[4] - b.transform[4]);

          const rowText = rowItems.map(it => it.str.trim()).join(' ');

          if (rowText.toUpperCase().includes('TOTAL GENERAL')) {
            const dataVals = rowItems.map(it => parseLocaleFloat(it.str)).filter(v => v > 0);
            if (dataVals.length >= 2) {
              totalGeneralDia = dataVals[0];
              totalGeneralAcum = dataVals[dataVals.length - 1];
            }
            return;
          }

          let systemEmp = null;

          // 1. Match by name item in range
          const nameItem = rowItems.find(it => 
            it.transform[4] >= ranges.name[0] && 
            it.transform[4] < ranges.name[1] && 
            !it.str.toUpperCase().includes('TOTAL') &&
            !it.str.toUpperCase().includes('NOMBRE')
          );

          if (nameItem) {
            systemEmp = findEmpleadoByName(nameItem.str.trim());
          }

          // 2. If not found by name item, search candidate name tokens in row
          if (!systemEmp) {
            const wordTokens = rowItems
              .filter(it => it.transform[4] < ranges.vtaDia[0] && !/[0-9%]/.test(it.str))
              .map(it => it.str.trim());
            const prefixes = ['TOTAL', 'CATEGORIZACION', 'ZONA', 'HOMBRE', 'MUJER', 'GENERAL', 'SUBTOTAL', 'SUMA', 'EN', 'BLANCO', 'N/A'];
            const cleanWords = wordTokens.filter(word => !prefixes.includes(word.toUpperCase()));
            const candidateName = cleanWords.join(' ').trim();
            if (candidateName.length >= 3) {
              systemEmp = findEmpleadoByName(candidateName);
            }
          }

          if (systemEmp && systemEmp.cargo === 'Asesor de Ventas') {
            const cedula = String(systemEmp.cedula).trim();

            const getColVal = (range) => {
              const matching = rowItems.filter(it => it.transform[4] >= range[0] && it.transform[4] < range[1] && it.str.trim() !== '$');
              const comb = matching.map(it => it.str.trim()).join(' ');
              return parseLocaleFloat(comb);
            };

            const ventaDiaVal = getColVal(ranges.vtaDia);
            const vtaPromedioVal = getColVal(ranges.vtaPro);
            const facturasVal = getColVal(ranges.facturas);
            const facturasHoraVal = getColVal(ranges.facturasHora);
            const cumplimientoFechaVal = getColVal(ranges.cumplFecha);
            const diferenciaFechaVal = getColVal(ranges.difFecha);
            const cumplimientoMetaVal = getColVal(ranges.cumplMeta);
            const metaPeriodoVal = getColVal(ranges.metaPeriodo);
            const metaMensualVal = getColVal(ranges.metaMensual);
            const acumVentasVal = getColVal(ranges.ventaAcum);

            const storeTicketProm = storeStats.ticketPromedio || 112.82;
            const storeConv = storeStats.conversion || 72.47;
            const calculatedConversion = vtaPromedioVal > 0 ? parseFloat((storeConv * (vtaPromedioVal / storeTicketProm)).toFixed(2)) : 0;
            const finalConversion = Math.max(1, Math.min(100, calculatedConversion)) || storeConv;

            const displayName = `${systemEmp.nombres || ''} ${systemEmp.apellidos || ''}`.trim();

            if (!allAssessors.some(a => normCedula(a.cedula) === normCedula(cedula))) {
              allAssessors.push({
                name: displayName,
                cedula,
                ventaDia: ventaDiaVal,
                vtaPromedio: vtaPromedioVal,
                facturas: facturasVal,
                facturasHora: facturasHoraVal,
                cumplimientoFecha: cumplimientoFechaVal,
                diferenciaFecha: diferenciaFechaVal,
                metaMensual: metaMensualVal,
                acumVentas: acumVentasVal,
                conversion: finalConversion,
                systemEmp
              });
            }
          }
        });
      }
      
      if (!pdfDayIndex && file.name) {
        const dateMatch = file.name.match(/(\d{1,2})[-_.](\d{1,2})[-_.](\d{4})/);
        if (dateMatch) {
          pdfDayIndex = parseInt(dateMatch[1], 10);
        } else {
          const ventaMatch = file.name.match(/venta[-_.]?(\d{1,2})/i);
          if (ventaMatch) {
            pdfDayIndex = parseInt(ventaMatch[1], 10);
          } else {
            const anyMatch = file.name.match(/(\d{1,2})/);
            if (anyMatch) {
              pdfDayIndex = parseInt(anyMatch[1], 10);
            }
          }
        }
      }
      
      const daysInMonth = getDaysInCurrentMonth();
      const todayDayIndex = pdfDayIndex || Math.min(daysInMonth, Math.max(1, getEcuadorDayIndex()));
      
      if (allAssessors.length === 0) {
        alert("⚠️ No se encontraron asesores de venta en el PDF. Verifique que el formato sea el correcto.");
        return;
      }
      
      const parsedMetas = allAssessors.map(adv => {
        const nombres = adv.systemEmp ? capitalize(adv.systemEmp.nombres) : capitalize(adv.name);
        const apellidos = adv.systemEmp ? capitalize(adv.systemEmp.apellidos) : '';
        
        const existingAdv = teamMetas.find(m => normCedula(m.cedula) === normCedula(adv.cedula));
        const metaMensual = (existingAdv && existingAdv.meta_mensual > 0) ? existingAdv.meta_mensual : (adv.metaMensual || 0);
        const metaSemanal = (existingAdv && existingAdv.meta_semanal > 0) ? existingAdv.meta_semanal : 0;
        const metaDiaria = (existingAdv && existingAdv.meta_diaria > 0) ? existingAdv.meta_diaria : 0;
        
        let daily_sales = [];
        
        if (existingAdv && existingAdv.daily_sales && existingAdv.daily_sales.length > 0) {
          daily_sales = existingAdv.daily_sales.map(d => {
            const goalVal = d.goal !== undefined ? d.goal : d.monto;
            return {
              dia: d.dia,
              goal: goalVal,
              sale: d.sale !== undefined ? d.sale : 0,
              monto: d.monto !== undefined ? d.monto : 0
            };
          });
          
          const todayItem = daily_sales.find(d => d.dia === todayDayIndex);
          if (todayItem) {
            todayItem.sale = adv.ventaDia;
            todayItem.monto = adv.ventaDia;
          }
          
          daily_sales.forEach(d => {
            if (d.dia > todayDayIndex) {
              d.sale = 0;
              d.monto = 0;
            }
          });

          const pastDays = daily_sales.filter(d => d.dia < todayDayIndex);
          const expectedOtherDaysSum = adv.acumVentas - adv.ventaDia;
          const pastDaysOriginalSum = pastDays.reduce((sum, d) => sum + (d.sale || d.monto || 0), 0);
          const hasNegative = pastDays.some(d => d.monto < 0 || d.sale < 0);
          const isCorrupt = hasNegative || pastDaysOriginalSum <= 0.1;

          if (!isCorrupt) {
            // CONSERVAR INTEGRIDAD DE HISTORIAL REAL: No recalculamos ni modificamos las ventas de los días anteriores,
            // ya que fueron cargadas y validadas en sus respectivos días. Esto evita que cambien con cada nueva carga de PDF.
          } else {
            const numPrevDays = todayDayIndex - 1;
            if (numPrevDays > 0) {
              const dailyVal = parseFloat((expectedOtherDaysSum / numPrevDays).toFixed(2));
              daily_sales.forEach(d => {
                if (d.dia < todayDayIndex) {
                  d.sale = dailyVal;
                  d.monto = dailyVal;
                }
              });
              // Ajustar remanente por redondeo en el primer día
              const currentSum = daily_sales.reduce((sum, d) => sum + d.monto, 0);
              const diff = parseFloat((adv.acumVentas - currentSum).toFixed(2));
              if (diff !== 0) {
                const firstDay = daily_sales.find(d => d.dia === 1);
                if (firstDay) {
                  firstDay.sale = parseFloat((firstDay.sale + diff).toFixed(2));
                  firstDay.monto = firstDay.sale;
                }
              }
            }
          }
        } else {
          const numPrevDays = todayDayIndex - 1;
          const expectedOtherDaysSum = adv.acumVentas - adv.ventaDia;
          const dailyVal = numPrevDays > 0 ? parseFloat((expectedOtherDaysSum / numPrevDays).toFixed(2)) : 0;
          
          for (let d = 1; d <= daysInMonth; d++) {
            let sale = 0;
            if (d === todayDayIndex) {
              sale = adv.ventaDia;
            } else if (d < todayDayIndex) {
              sale = dailyVal;
            }
            daily_sales.push({ 
              dia: d, 
              goal: 0, 
              sale: sale, 
              monto: sale 
            });
          }
        }
        
        const finalAcum = parseFloat(daily_sales.reduce((sum, d) => sum + d.monto, 0).toFixed(2));
        const realAcumVentas = (adv.acumVentas !== undefined && adv.acumVentas !== null) ? adv.acumVentas : finalAcum;
        const pct = metaDiaria > 0 ? Math.round((adv.ventaDia / metaDiaria) * 100) : 0;
        
        return {
          cedula: adv.cedula,
          nombres,
          apellidos,
          meta_mensual: metaMensual,
          meta_semanal: metaSemanal,
          meta_diaria: metaDiaria,
          meta: metaSemanal,
          acum_ventas: realAcumVentas,
          pct,
          comentario: existingAdv ? existingAdv.comentario || '' : '',
          daily_sales,
          ticket_promedio: adv.vtaPromedio,
          facturas: adv.facturas,
          facturas_hora: adv.facturasHora,
          cumplimiento_fecha: adv.cumplimientoFecha,
          diferencia_fecha: adv.diferenciaFecha,
          conversion: adv.conversion
        };
      });
      
      const shopStats = {
        ticketPromedio: storeStats.ticketPromedio || 112.82,
        facturas: storeStats.facturas || 1528,
        conversion: storeStats.conversion || 72.47,
        metaDiariaTienda: storeStats.metaDiariaTienda || 3800.00,
        metaSemanalTienda: storeStats.metaSemanalTienda || 26600.00,
        totalVentaLograda: storeStats.totalVentaLograda || 0,
        ventaTienda: storeStats.ventaTienda || 0,
        trafico: storeStats.trafico || 1500,
        dailyGoals: storeStats.dailyGoals || null
      };

      let totalFacturas = 0;
      let totalVentaLograda = 0;
      let totalMetaSemanal = 0;
      let totalMetaDiaria = 0;

      parsedMetas.forEach(m => {
        totalFacturas += m.facturas || 0;
        totalVentaLograda += m.acum_ventas || 0;
        totalMetaSemanal += m.meta_semanal || 0;
        totalMetaDiaria += m.meta_diaria || 0;
      });

      let sumAdvisorsVentaDia = 0;
      allAssessors.forEach(a => {
        sumAdvisorsVentaDia += a.ventaDia || 0;
      });

      let sumAdvisorsAcumVentas = 0;
      parsedMetas.forEach(m => {
        sumAdvisorsAcumVentas += m.acum_ventas || 0;
      });

      const hasDiscrepancy = (totalGeneralDia !== null && Math.abs(totalGeneralDia - sumAdvisorsVentaDia) > 0.05) ||
                             (totalGeneralAcum !== null && Math.abs(totalGeneralAcum - sumAdvisorsAcumVentas) > 0.05);

      if (allAssessors.length > 0) {
        if (totalGeneralAcum !== null && !isNaN(totalGeneralAcum)) {
          shopStats.totalVentaLograda = totalGeneralAcum;
        } else {
          shopStats.totalVentaLograda = parseFloat(totalVentaLograda.toFixed(2));
        }

        if (totalGeneralDia !== null && !isNaN(totalGeneralDia)) {
          shopStats.ventaTienda = totalGeneralDia;
        } else {
          shopStats.ventaTienda = parseFloat(sumAdvisorsVentaDia.toFixed(2));
        }

        if (totalFacturas > 0) {
          shopStats.facturas = totalFacturas;
          shopStats.ticketPromedio = parseFloat((shopStats.totalVentaLograda / totalFacturas).toFixed(2));
        }
        shopStats.metaDiariaTienda = totalMetaDiaria > 0 ? totalMetaDiaria : (storeStats.metaDiariaTienda || 3800.00);
        shopStats.metaSemanalTienda = totalMetaSemanal > 0 ? totalMetaSemanal : (storeStats.metaSemanalTienda || 26600.00);
        shopStats.dailyGoals = storeStats.dailyGoals || null;
        shopStats.trafico = shopStats.conversion > 0 ? Math.round(shopStats.facturas / (shopStats.conversion / 100)) : 1500;
      }
      
      setPendingUploadData({
        parsedMetas,
        shopStats,
        fileObj: file,
        fileName: file.name,
        pdfPreviewUrl,
        type: 'pdf',
        hasDiscrepancy,
        totalGeneralDia,
        totalGeneralAcum,
        sumAdvisorsVentaDia,
        sumAdvisorsAcumVentas
      });
      
    } catch (err) {
      console.error(err);
      alert("❌ Error al leer el archivo PDF: " + err.message);
    }
  };

  const handleConfirmMetasUpload = async () => {
    if (!pendingUploadData) return;
    setIsConfirmingUpload(true);
    setUploadError(null);
    try {
      let pdfUrl = pendingUploadData.pdfPreviewUrl || null;
      if (pendingUploadData.type === 'pdf' && pendingUploadData.fileObj) {
        try {
          const fileObj = pendingUploadData.fileObj;
          const bucketName = 'evidencias-jefes';
          const fileExt = fileObj.name.split('.').pop() || 'pdf';
          const fileNameClean = fileObj.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filePath = `metas_pdf/${Date.now()}_${fileNameClean}`;

          const { data, error: uploadErr } = await supabase.storage
            .from(bucketName)
            .upload(filePath, fileObj, { cacheControl: '3600', upsert: true });

          if (!uploadErr && data) {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);

            if (urlData?.publicUrl) {
              pdfUrl = urlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn("Storage upload error (using local preview fallback):", storageErr);
        }
      }

      if (pdfUrl) {
        localStorage.setItem('marathon_metas_pdf_url', pdfUrl);
      }

      const res = await saveMetasState(
        pendingUploadData.parsedMetas, 
        pendingUploadData.shopStats, 
        pendingUploadData.type !== 'pdf', 
        pdfUrl
      );
      if (res && res.success === false) {
        console.error("Database save failed:", res.error);
        const errMsg = res.error?.message === 'Failed to fetch' 
          ? 'Error de conexión a internet o Supabase. Por favor reintenta.' 
          : (res.error?.message || res.error || 'Error al guardar en la base de datos');
        setUploadError(errMsg);
      } else {
        setPendingUploadData(null);
        alert("✅ Metas de ventas y estadísticas de tienda guardadas con éxito.");
      }
    } catch (err) {
      console.error("Database save error:", err);
      const errMsg = err.message === 'Failed to fetch'
        ? 'Error de conexión a internet o Supabase. Por favor reintenta.'
        : (err.message || 'Error inesperado al guardar metas');
      setUploadError(errMsg);
    } finally {
      setIsConfirmingUpload(false);
    }
  };

  const handleCancelUpload = () => {
    setPendingUploadData(null);
    setUploadError(null);
  };

  const handleOpenEdit = (meta) => {
    setSelectedMeta(meta);
    setFormMeta(meta.meta_mensual.toString());
    setFormMetaSemanal(meta.meta_semanal.toString());
    setFormMetaDiaria(meta.meta_diaria ? meta.meta_diaria.toString() : parseFloat((meta.meta_semanal / 6).toFixed(2)).toString());
    setFormComentario(meta.comentario || '');
    setCoachingP1(getCoachingForPeriod(meta.comentario, 1));
    setCoachingP2(getCoachingForPeriod(meta.comentario, 2));
    setCoachingP3(getCoachingForPeriod(meta.comentario, 3));
    setCoachingP4(getCoachingForPeriod(meta.comentario, 4));
    setActiveModalPeriodTab(getPeriodIndex(actualTodayDay));
    setDailySalesList(meta.daily_sales ? [...meta.daily_sales] : []);
    setSelectedDayIndex(1);
    
    // Cargar venta del día 1 inicialmente
    const day1 = meta.daily_sales?.find(d => d.dia === 1);
    setDayValue(day1 ? day1.monto.toString() : '0');

    setSubmitSuccess(false);
    setShowEditModal(true);
  };



  // Actualizar venta del día seleccionado
  const handleDayValueChange = (valStr) => {
    setDayValue(valStr);
    const val = parseFloat(valStr) || 0;
    const updated = dailySalesList.map(d => {
      if (d.dia === selectedDayIndex) {
        return { ...d, monto: parseFloat(val.toFixed(2)) };
      }
      return d;
    });
    setDailySalesList(updated);
  };

  const handleSaveMeta = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const finalComentarioObj = {
      "1": coachingP1,
      "2": coachingP2,
      "3": coachingP3,
      "4": coachingP4
    };
    const finalComentarioStr = JSON.stringify(finalComentarioObj);
    
    setTimeout(async () => {
      try {
        await updateMetaIndividual(
          selectedMeta.cedula, 
          parseFloat(formMeta) || 0, 
          parseFloat(formMetaSemanal) || 0,
          parseFloat(formMetaDiaria) || 0,
          dailySalesList, 
          finalComentarioStr
        );
        setIsSubmitting(false);
        setSubmitSuccess(true);
        setTimeout(() => {
          setShowEditModal(false);
        }, 1200);
      } catch (err) {
        setIsSubmitting(false);
        alert("Error al guardar: " + err.message);
      }
    }, 500);
  };

  const handleOpenStoreEdit = () => {
    setFormTicketPromedio(storeStats.ticketPromedio.toString());
    setFormConversion(storeStats.conversion.toString());
    setFormFacturas(storeStats.facturas.toString());
    setFormMetaDiariaTienda((storeStats.metaDiariaTienda || 3800).toString());
    setFormMetaSemanalTienda((storeStats.metaSemanalTienda !== null && storeStats.metaSemanalTienda !== undefined ? storeStats.metaSemanalTienda : totalBranchTarget).toString());
    setFormTotalVentaLograda((storeStats.totalVentaLograda !== null && storeStats.totalVentaLograda !== undefined ? storeStats.totalVentaLograda : totalBranchAchieved).toString());
    setShowStoreEditModal(true);
  };

  const handleFacturasChange = (val) => {
    setFormFacturas(val);
    const facturasNum = parseInt(val) || 0;
    if (facturasNum > 0) {
      const ventaTienda = storeStats.ventaTienda || (storeStats.facturas * storeStats.ticketPromedio) || 0;
      const trafico = storeStats.trafico || (storeStats.conversion > 0 ? (storeStats.facturas / (storeStats.conversion / 100)) : 0) || 1;
      
      const newTicket = (ventaTienda / facturasNum).toFixed(2);
      const newConv = ((facturasNum / trafico) * 100).toFixed(2);
      
      setFormTicketPromedio(newTicket);
      setFormConversion(newConv);
    } else {
      setFormTicketPromedio('0.00');
      setFormConversion('0.00');
    }
  };

  const handleSaveStoreStats = async (e) => {
    e.preventDefault();
    try {
      await updateStoreStats({
        ticketPromedio: parseFloat(formTicketPromedio) || 0,
        conversion: parseFloat(formConversion) || 0,
        facturas: parseInt(formFacturas) || 0,
        metaDiariaTienda: parseFloat(formMetaDiariaTienda) || 0,
        metaSemanalTienda: parseFloat(formMetaSemanalTienda) || 0,
        totalVentaLograda: parseFloat(formTotalVentaLograda) || 0
      });
      setShowStoreEditModal(false);
    } catch (err) {
      alert("Error al guardar estadísticas de la tienda: " + err.message);
    }
  };

  const actualTodayDay = getEcuadorDayIndex();
  const todayDayIndex = getReportingDayIndex(teamMetas);
  const daysInMonth = getDaysInCurrentMonth();
  const tomorrowDayIndex = Math.min(daysInMonth, actualTodayDay + 1);

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

  // Calcular las metas de la tienda sumando las metas de los asesores
  const storeDailyGoals = (storeStats.dailyGoals && storeStats.dailyGoals.length > 0)
    ? storeStats.dailyGoals
    : Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = i + 1;
        const sum = teamMetas.reduce((acc, m) => acc + (m.daily_sales?.find(d => d.dia === dayNum)?.goal || m.daily_sales?.find(d => d.dia === dayNum)?.monto || 0), 0);
        return { dia: dayNum, monto: sum };
      });

  const storeTodayGoal = storeDailyGoals.find(d => d.dia === actualTodayDay)?.monto || 3800;
  const storeTomorrowGoal = storeDailyGoals.find(d => d.dia === tomorrowDayIndex)?.monto || 3800;
  const storeWeeklyGoal = storeDailyGoals.filter(d => weekDays.includes(d.dia)).reduce((acc, d) => acc + d.monto, 0) || 15000;

  const totalBranchTarget = teamMetas.reduce((sum, m) => sum + (m.meta_semanal || 0), 0);
  const totalBranchAchieved = teamMetas.reduce((sum, m) => sum + (m.acum_ventas || 0), 0);

  const mappedTeam = teamMetas.map(m => {
    const emp = empleados.find(e => normCedula(e.cedula) === normCedula(m.cedula));
    return {
      ...m,
      nombres: emp ? capitalize(emp.nombres) : m.nombres || '',
      apellidos: emp ? capitalize(emp.apellidos) : m.apellidos || ''
    };
  });

  const filteredTeam = mappedTeam.filter(m => 
    m.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cedula.includes(searchTerm)
  );



  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-accent-bg { background-color: ${myTheme.primary} !important; }
        .theme-accent-text { color: ${myTheme.primary} !important; }
        .theme-accent-border { border-color: ${myTheme.primary} !important; }
        .theme-accent-border-soft { border-color: ${myTheme.primary}30 !important; }
        .theme-accent-bg-soft { background-color: ${myTheme.primary}10 !important; }
        .theme-accent-bg-medium { background-color: ${myTheme.primary}20 !important; }
      ` }} />

      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`text-3xl font-title font-black flex items-center gap-3 ${tc.textPrimary}`}>
              <Target className="w-8 h-8 theme-accent-text" />
              Gestión de Metas Comerciales
            </h1>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 uppercase tracking-wider">
              V8 Edition
            </span>
          </div>
          <p className={`mt-1 text-xs font-medium ${tc.textMuted}`}>
            Asignación de objetivos semanales y mensuales, monitoreo de avance de ventas y comentarios.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {!isTercero && (
            <button
              type="button"
              onClick={handleOpenStoreEdit}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold uppercase shadow-md flex items-center gap-1.5 transition-all cursor-pointer animate-fade-in"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Editar Métricas Tienda</span>
            </button>
          )}

          <select 
            value={selectedWeek} 
            onChange={(e) => setSelectedWeek(e.target.value)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold outline-none ${tc.inputBg}`}
          >
            <option value="2026-06-01_2026-06-07">Semana 23 (01 Jun - 07 Jun)</option>
            <option value="2026-05-25_2026-05-31">Semana 22 (25 May - 31 May)</option>
            <option value="2026-05-18_2026-05-24">Semana 21 (18 May - 24 May)</option>
          </select>
        </div>
      </div>

      {/* Grid de Estadísticas Globales de Tienda (Modificables) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Período Actual */}
        <div className={`p-4 rounded-2xl border shadow-sm ${tc.cardBg}`} style={tc.cardBgStyle}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Período Actual</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className={`text-xl sm:text-2xl font-title font-black mt-2 ${tc.textPrimary}`}>
            {currentPeriodLabel}
          </p>
          <span className="text-[10px] text-slate-455 font-bold block mt-1">Semanas según color</span>
        </div>

        {/* Resultados de Hoy */}
        {(() => {
          const metaDia = storeDailyGoals.find(d => d.dia === actualTodayDay)?.monto || 0;
          const ventaDia = teamMetas.reduce((acc, m) => acc + (m.daily_sales?.find(d => d.dia === actualTodayDay)?.monto || 0), 0);
          const cumplDia = metaDia > 0 ? parseFloat((ventaDia / metaDia * 100).toFixed(1)) : 0;
          const difDia = parseFloat((ventaDia - metaDia).toFixed(2));
          const arriba = difDia >= 0;

          return (
            <div className={`p-4 rounded-2xl border shadow-sm ${tc.cardBg}`} style={tc.cardBgStyle}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Venta de Hoy (Día {actualTodayDay})</span>
                <TrendingUp className={`w-5 h-5 ${arriba ? 'text-emerald-500' : 'text-red-400'}`} />
              </div>
              <p className={`text-xl sm:text-2xl font-title font-black mt-2 ${tc.textPrimary}`}>
                ${ventaDia.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-slate-455 font-bold block mt-1">
                Meta: ${metaDia.toLocaleString('es-EC', { maximumFractionDigits: 0 })} | <span className={arriba ? 'text-emerald-500 font-bold' : 'text-red-400 font-bold'}>{arriba ? '+' : ''}{Math.round(difDia)} ({cumplDia}%)</span>
              </span>
            </div>
          );
        })()}

        {/* Meta de Hoy */}
        <div className={`p-4 rounded-2xl border shadow-sm ${tc.cardBg}`} style={tc.cardBgStyle}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta de Hoy (Día {actualTodayDay})</span>
            <Target className="w-5 h-5 theme-accent-text" />
          </div>
          <p className={`text-xl sm:text-2xl font-title font-black mt-2 ${tc.textPrimary}`}>
            ${storeTodayGoal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-455 font-bold block mt-1">Presupuesto diario global</span>
        </div>

        {/* Meta de Mañana */}
        <div className={`p-4 rounded-2xl border shadow-sm ${tc.cardBg}`} style={tc.cardBgStyle}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta de Mañana (Día {tomorrowDayIndex})</span>
            <Calendar className="w-5 h-5 text-emerald-500" />
          </div>
          <p className={`text-xl sm:text-2xl font-title font-black mt-2 ${tc.textPrimary}`}>
            ${storeTomorrowGoal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-455 font-bold block mt-1">Presupuesto día siguiente</span>
        </div>

        {/* Meta de la Semana */}
        <div className={`p-4 rounded-2xl border shadow-sm ${tc.cardBg}`} style={tc.cardBgStyle}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta de la Semana</span>
            <Target className="w-5 h-5 theme-accent-text" />
          </div>
          <p className={`text-xl sm:text-2xl font-title font-black mt-2 ${tc.textPrimary}`}>
            ${storeWeeklyGoal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-450 font-bold block mt-1">Presupuesto de período</span>
        </div>

      </div>

      {/* Objetivos Operativos de Tienda (General) */}
      <div className={`p-5 rounded-3xl border shadow-md flex flex-col justify-between text-left ${tc.cardBg}`} style={tc.cardBgStyle}>
        <div className="space-y-3">
          <div className="border-b pb-2.5 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${tc.textPrimary}`}>Objetivos Operativos de Tienda (General)</h3>
            </div>
            {!isTercero && (
              <button
                onClick={handleOpenStoreEdit}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-[10px] font-bold uppercase shadow-sm transition-all cursor-pointer"
              >
                Editar Métricas
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Meta Diaria Global */}
            <div className="p-3 rounded-xl border bg-slate-500/5 dark:border-slate-800/50">
              <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Meta Diaria Tienda</span>
              <span className={`text-sm sm:text-base font-mono font-black mt-1 block ${tc.textPrimary}`}>
                ${storeTodayGoal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {/* Meta Semanal Global */}
            <div className="p-3 rounded-xl border bg-slate-500/5 dark:border-slate-800/50">
              <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Meta Semanal Tienda</span>
              <span className={`text-sm sm:text-base font-mono font-black mt-1 block ${tc.textPrimary}`}>
                ${storeWeeklyGoal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {/* Ticket Promedio */}
            <div className="p-3 rounded-xl border bg-slate-500/5 dark:border-slate-800/50">
              <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Ticket Promedio Tienda</span>
              <span className="text-sm sm:text-base font-mono font-black mt-1 block text-indigo-500">
                ${(storeStats?.ticketPromedio || 112.82).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {/* Conversión */}
            <div className="p-3 rounded-xl border bg-slate-500/5 dark:border-slate-800/50">
              <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">% Conversión Tienda</span>
              <span className="text-sm sm:text-base font-mono font-black mt-1 block text-emerald-500">
                {(storeStats?.conversion || 72.47).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-3 border-t pt-2 dark:border-slate-800 flex justify-between items-center">
          <span>Valores generales calculados e importados desde la plantilla de metas y reportes de venta</span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-black uppercase">Tienda Sincronizada</span>
        </div>
      </div>

      {/* Importador de Archivos (Excel y PDF) - Solo para Jefes/Admin, no Tercero */}
      {!isTercero && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cargador de Metas desde Excel */}
          <div className={`p-6 rounded-3xl border shadow-lg ${tc.cardBg}`} style={tc.cardBgStyle}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${tc.textPrimary}`}>Cargar Metas de Ventas (Excel)</h3>
            <p className={`text-xs font-semibold mb-4 ${tc.textMuted}`}>
              Importa masivamente presupuestos mensuales, avances y datos diarios arrastrando archivo Excel (.xlsx, .xls).
            </p>

            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-700 transition-colors p-8 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/20 dark:bg-slate-950/10 w-full min-h-[140px]">
              <Upload className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
              <span className={`text-xs font-bold uppercase tracking-wider ${tc.textPrimary}`}>Selecciona o arrastra tu archivo Excel</span>
              <span className={`text-[10px] ${tc.textMuted} mt-1 block`}>Formatos permitidos: .xlsx, .xls</span>
              <input 
                key={pendingUploadData ? 'has-pending-excel' : 'no-pending-excel'}
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleExcelUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
            </div>
          </div>

          {/* Cargador de Avance desde PDF */}
          <div className={`p-6 rounded-3xl border shadow-lg ${tc.cardBg}`} style={tc.cardBgStyle}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${tc.textPrimary}`}>Cargar Avance de Ventas (PDF)</h3>
            <p className={`text-xs font-semibold mb-4 ${tc.textMuted}`}>
              Reconoce automáticamente los acumulados de venta, metas y facturas para cada asesor desde el reporte PDF de ventas.
            </p>

            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-700 transition-colors p-8 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/20 dark:bg-slate-950/10 w-full min-h-[140px]">
              <FileText className="w-8 h-8 text-slate-400 mb-2 animate-pulse" />
              <span className={`text-xs font-bold uppercase tracking-wider ${tc.textPrimary}`}>Selecciona o arrastra tu archivo PDF</span>
              <span className={`text-[10px] ${tc.textMuted} mt-1 block`}>Formato permitido: .pdf</span>
              <input 
                key={pendingUploadData ? 'has-pending-pdf' : 'no-pending-pdf'}
                type="file" 
                accept=".pdf,application/pdf,*/*" 
                onChange={handlePdfUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Documento PDF Oficial de Metas Activo */}
      {(storeStats?.pdf_url || localStorage.getItem('marathon_metas_pdf_url')) && !pendingUploadData && (
        <PdfPreviewCard pdfUrl={storeStats?.pdf_url || localStorage.getItem('marathon_metas_pdf_url')} title="Reporte PDF Oficial de Ventas del Día" />
      )}

      {/* Vista Previa de Carga de Metas Pendiente de Confirmar */}
      {pendingUploadData && (
        <div className={`p-6 rounded-3xl border shadow-lg space-y-4 animate-fade-in ${tc.cardBg}`} style={tc.cardBgStyle}>
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-blue-500 animate-pulse" />
              <h3 className={`text-sm font-bold uppercase tracking-wider ${tc.textPrimary}`}>
                {pendingUploadData.type === 'pdf' ? 'Confirmar Carga de Avance (PDF)' : 'Confirmar Carga de Metas (Excel)'}
              </h3>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${activeTheme === 'oscuro' ? 'bg-slate-900 border-slate-700 text-slate-450' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              Vista Previa
            </span>
          </div>

          {/* Información del Archivo y Tienda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-500/5 border border-slate-200/40 dark:border-slate-800/35">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Archivo</span>
              <span className={`text-xs font-bold truncate block ${tc.textPrimary}`}>{pendingUploadData.fileName}</span>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                {pendingUploadData.type === 'pdf' ? 'Asesores en PDF' : 'Asesores en Excel'}
              </span>
              <span className={`text-xs font-bold block ${tc.textPrimary}`}>{pendingUploadData.parsedMetas.length} colaboradores</span>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Meta Diaria de Tienda</span>
              <span className={`text-xs font-bold font-mono block ${tc.textPrimary}`}>
                ${pendingUploadData.shopStats.metaDiariaTienda?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Meta Semanal de Tienda</span>
              <span className={`text-xs font-bold font-mono block ${tc.textPrimary}`}>
                ${pendingUploadData.shopStats.metaSemanalTienda?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Tabla de Previsualización */}
          <div className="overflow-x-auto max-h-[300px] border border-slate-200/50 dark:border-slate-800 rounded-2xl bg-slate-500/5">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b dark:border-slate-800">
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Asesor</th>
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Cédula</th>
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Meta Mensual</th>
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Meta Semanal</th>
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Meta Diaria</th>
                </tr>
              </thead>
              <tbody>
                {pendingUploadData.parsedMetas.map((adv) => (
                  <tr key={adv.cedula} className="border-b border-slate-200/30 dark:border-slate-800/30">
                    <td className={`p-3 text-xs font-bold ${tc.textPrimary}`}>{adv.apellidos} {adv.nombres}</td>
                    <td className="p-3 text-xs font-mono font-semibold text-center text-slate-400">{adv.cedula}</td>
                    <td className={`p-3 text-xs font-mono font-semibold text-center ${tc.textPrimary}`}>
                      ${adv.meta_mensual?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-xs font-mono font-semibold text-center ${tc.textPrimary}`}>
                      ${adv.meta_semanal?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-xs font-mono font-semibold text-center ${tc.textPrimary}`}>
                      ${adv.meta_diaria?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pendingUploadData.type === 'pdf' && pendingUploadData.hasDiscrepancy && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-start space-x-2.5 text-[11px] font-semibold">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px]">⚠️ Alerta de Discrepancia en Ventas</p>
                <p className="mt-1 opacity-90 leading-relaxed">
                  Se detectó una diferencia entre el <strong>Total General</strong> del reporte PDF y la suma de las ventas individuales de los asesores:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 font-mono text-[10px]">
                  <li>Venta Diaria Tienda (PDF): ${pendingUploadData.totalGeneralDia?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</li>
                  <li>Suma de Ventas Asesores: ${pendingUploadData.sumAdvisorsVentaDia?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</li>
                  <li className="text-red-450 font-bold">Diferencia Diaria: ${Math.abs(pendingUploadData.totalGeneralDia - pendingUploadData.sumAdvisorsVentaDia).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</li>
                  <li className="mt-1.5">Venta Acumulada Tienda (PDF): ${pendingUploadData.totalGeneralAcum?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</li>
                  <li>Suma Acumulados Asesores: ${pendingUploadData.sumAdvisorsAcumVentas?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</li>
                  <li className="text-red-450 font-bold">Diferencia Acumulada: ${Math.abs(pendingUploadData.totalGeneralAcum - pendingUploadData.sumAdvisorsAcumVentas).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</li>
                </ul>
                <p className="mt-2.5 opacity-95 text-[10px] italic">
                  * Nota: El sistema utilizará los valores globales del Total General del PDF en las estadísticas generales del dashboard para mantener consistencia con los reportes comerciales de Marathon.
                </p>
              </div>
            </div>
          )}

          {/* Visualización Directa del PDF en Vista Previa */}
          {pendingUploadData.type === 'pdf' && (pendingUploadData.pdfPreviewUrl || storeStats?.pdf_url || localStorage.getItem('marathon_metas_pdf_url')) && (
            <div className="mt-4">
              <PdfPreviewCard 
                pdfUrl={pendingUploadData.pdfPreviewUrl || storeStats?.pdf_url || localStorage.getItem('marathon_metas_pdf_url')} 
                title={`Visualización Directa del Documento PDF (${pendingUploadData.fileName})`} 
              />
            </div>
          )}

          {/* Mensaje de Advertencia */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-start space-x-2 text-[11px] font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">Atención antes de guardar</p>
              <p className="mt-0.5 opacity-90">
                Al hacer clic en "Confirmar y Guardar", se eliminarán las metas activas del período correspondiente en la base de datos y se sobrescribirán con la información de este archivo Excel. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          {/* Mensaje de Error si existió alguno al guardar */}
          {uploadError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center space-x-2 text-xs font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-2.5 pt-3 border-t dark:border-slate-800">
            <button
              type="button"
              onClick={handleCancelUpload}
              disabled={isConfirmingUpload}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors ${
                activeTheme === 'oscuro' ? 'bg-slate-900 hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-250 text-slate-700'
              }`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmMetasUpload}
              disabled={isConfirmingUpload}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-750 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isConfirmingUpload ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar y Guardar</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Control de Asesores e Historial */}
      <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${tc.cardBg}`} style={tc.cardBgStyle}>
        
        {/* Barra de Búsqueda y Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider ${tc.textPrimary}`}>Presupuesto de Asesores</h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">Control de metas de ventas semanales individuales</span>
          </div>

          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar asesor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl border outline-none text-xs font-semibold ${tc.inputBg}`}
            />
          </div>
        </div>

        {/* Resumen de Tienda */}
        {(() => {
          const totalAcum = filteredTeam.reduce((sum, m) => {
            const sumDaily = m.daily_sales ? m.daily_sales.reduce((s, d) => s + (d.monto || 0), 0) : 0;
            const val = (m.acum_ventas !== undefined && m.acum_ventas !== null) ? m.acum_ventas : sumDaily;
            return sum + val;
          }, 0);

          const totalMeta = filteredTeam.reduce((sum, m) => sum + (m.meta_mensual || 0), 0);
          
          const storeDailyGoals = (storeStats?.dailyGoals && storeStats.dailyGoals.length > 0)
            ? storeStats.dailyGoals
            : Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const sum = teamMetas.reduce((acc, m) => acc + (m.daily_sales?.find(d => d.dia === dayNum)?.goal || m.daily_sales?.find(d => d.dia === dayNum)?.monto || 0), 0);
                return { dia: dayNum, monto: sum };
              });

          const totalMetaPror = storeDailyGoals
            .filter(d => d.dia <= todayDayIndex)
            .reduce((sum, d) => sum + d.monto, 0);

          const totalDif = parseFloat((totalAcum - totalMetaPror).toFixed(2));
          const totalCumpl = totalMetaPror > 0 ? parseFloat((totalAcum / totalMetaPror * 100).toFixed(1)) : 0;
          const totalArriba = totalDif >= 0;
          return (
            <div className={`p-4 rounded-2xl border mb-4 ${activeTheme === 'oscuro' ? 'bg-slate-800/20 border-slate-700/50' : 'bg-gradient-to-r from-slate-50 to-blue-50/50 border-slate-100'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Acumulado Tienda</span>
                  <span className={`text-lg font-title font-black ${tc.textPrimary}`}>${totalAcum.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Cumplimiento al Día (Día {todayDayIndex})</span>
                  <span className={`text-lg font-title font-black ${totalCumpl >= 100 ? 'text-emerald-500' : totalCumpl >= 70 ? 'text-amber-500' : 'text-red-400'}`}>{totalCumpl}%</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Diferencia vs Meta al Día</span>
                  <span className={`text-lg font-title font-black ${totalArriba ? 'text-emerald-500' : 'text-red-400'}`}>{totalArriba ? '+' : ''}${totalDif.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${activeTheme === 'oscuro' ? 'bg-slate-800' : 'bg-slate-200/60'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${totalCumpl >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : totalCumpl >= 70 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`}
                  style={{ width: `${Math.min(100, totalCumpl)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[8px] text-slate-400 font-bold">0%</span>
                <span className="text-[8px] text-slate-400 font-bold">
                  Meta al Día (Día {todayDayIndex}): ${totalMetaPror.toLocaleString('es-EC', { minimumFractionDigits: 2 })} | Meta Total Mes: ${totalMeta.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] text-slate-400 font-bold">100%</span>
              </div>
            </div>
          );
        })()}

        {/* Barra Resumen de Diagnóstico de Coaching */}
        {(() => {
          let goldCount = 0;
          let greenCount = 0;
          let yellowCount = 0;
          let redCount = 0;

          filteredTeam.forEach(m => {
            const sumDaily = m.daily_sales ? m.daily_sales.reduce((sum, d) => sum + (d.monto || 0), 0) : 0;
            const acum = (m.acum_ventas !== undefined && m.acum_ventas !== null) ? m.acum_ventas : sumDaily;
            const metaPers = m.meta_mensual || 0;
            const metaPror = m.daily_sales && m.daily_sales.length > 0
              ? m.daily_sales.filter(d => d.dia <= todayDayIndex).reduce((sum, d) => sum + (d.goal !== undefined ? d.goal : d.monto), 0)
              : (metaPers > 0 ? parseFloat((metaPers * todayDayIndex / daysInMonth).toFixed(2)) : 0);
            const cumpl = metaPror > 0 ? parseFloat((acum / metaPror * 100).toFixed(1)) : 0;

            if (cumpl >= 100) goldCount++;
            else if (cumpl >= 85) greenCount++;
            else if (cumpl >= 60) yellowCount++;
            else redCount++;
          });

          const activePeriodIdx = getPeriodIndex(actualTodayDay);
          const missingCoachingAdvisors = filteredTeam.filter(m => {
            const coachingVal = getCoachingForPeriod(m.comentario, activePeriodIdx);
            return !coachingVal || coachingVal.trim() === '';
          });
          const missingCoachingCount = missingCoachingAdvisors.length;

          return (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 mb-4 text-xs font-bold">
              <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Diagnóstico de Coaching del Equipo (P{activePeriodIdx}):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-orange-500/25 text-orange-300 border border-orange-500/50 text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                  🎯 {missingCoachingCount} Sin Coaching P{activePeriodIdx}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                  🚨 {redCount} Urgentes
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 text-[10px] font-black uppercase flex items-center gap-1">
                  ⚠️ {yellowCount} Seguimiento
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                  ✅ {greenCount} En Meta
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-amber-500/20 text-[10px] font-black uppercase flex items-center gap-1">
                  🏆 {goldCount} Sobresalientes
                </span>
              </div>
            </div>
          );
        })()}

        {/* Tabla de Asesores */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`border-b ${activeTheme === 'oscuro' ? 'border-slate-800' : 'border-slate-100'}`}>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Colaborador</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acumulado / Meta</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center" style={{minWidth:'140px'}}>% Cumpl. al Día</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Dif. vs Meta (al Día)</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Venta / Meta Hoy (Día {actualTodayDay})</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Meta Mañana (Día {tomorrowDayIndex})</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Venta / Meta Sem.</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.map((m) => {
                const actualTodaySale = m.daily_sales?.find(d => d.dia === actualTodayDay)?.monto || 0;
                const actualTodayGoalObj = m.daily_sales?.find(d => d.dia === actualTodayDay);
                const actualTodayGoalVal = actualTodayGoalObj ? (actualTodayGoalObj.goal !== undefined ? actualTodayGoalObj.goal : 0) : (m.meta_diaria || 0);
                
                const tomorrowDailyGoalObj = m.daily_sales?.find(d => d.dia === tomorrowDayIndex);
                const tomorrowDailyGoalVal = tomorrowDailyGoalObj ? (tomorrowDailyGoalObj.goal !== undefined ? tomorrowDailyGoalObj.goal : 0) : (m.meta_diaria || 0);

                const weeklySaleAchieved = m.daily_sales?.filter(d => weekDays.includes(d.dia)).reduce((sum, d) => sum + (d.monto || 0), 0) || 0;
                const weeklyGoalAssigned = (m.daily_sales && m.daily_sales.length > 0)
                  ? m.daily_sales.filter(d => weekDays.includes(d.dia)).reduce((sum, d) => sum + (d.goal || 0), 0)
                  : (m.meta_semanal || 0);
                
                const sumDailySales = m.daily_sales ? m.daily_sales.reduce((sum, d) => sum + (d.monto || 0), 0) : 0;
                const acumPersonal = (m.acum_ventas !== undefined && m.acum_ventas !== null) ? m.acum_ventas : sumDailySales;
                
                const metaPersonal = m.meta_mensual || 0;
                const metaProrateadaPersonal = m.daily_sales && m.daily_sales.length > 0
                  ? m.daily_sales.filter(d => d.dia <= todayDayIndex).reduce((sum, d) => sum + (d.goal !== undefined ? d.goal : d.monto), 0)
                  : (metaPersonal > 0 ? parseFloat((metaPersonal * todayDayIndex / daysInMonth).toFixed(2)) : 0);
                
                const cumplPersonal = metaProrateadaPersonal > 0 ? parseFloat((acumPersonal / metaProrateadaPersonal * 100).toFixed(1)) : 0;
                const difPersonal = parseFloat((acumPersonal - metaProrateadaPersonal).toFixed(2));

                const arriba = difPersonal >= 0;

                // Cálculo dinámico del nivel de Coaching según el porcentaje de cumplimiento al día del PDF
                const getCoachingBadge = (cumpl, comentario) => {
                  const hasCustom = Boolean(comentario && comentario.trim() !== '');
                  if (cumpl >= 100) {
                    return {
                      style: 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-amber-500/20 shadow-sm ring-1 ring-amber-400/30',
                      text: hasCustom ? `Coaching: "${comentario.substring(0, 22)}${comentario.length > 22 ? '...' : ''}"` : '🏆 Sobresaliente (100%+)'
                    };
                  } else if (cumpl >= 85) {
                    return {
                      style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                      text: hasCustom ? `Coaching: "${comentario.substring(0, 22)}${comentario.length > 22 ? '...' : ''}"` : '✅ Meta al Día'
                    };
                  } else if (cumpl >= 60) {
                    return {
                      style: 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/45',
                      text: hasCustom ? `Coaching: "${comentario.substring(0, 22)}${comentario.length > 22 ? '...' : ''}"` : '⚠️ Seguimiento'
                    };
                  } else {
                    return {
                      style: 'bg-rose-500/25 text-rose-300 border-rose-500/50 animate-pulse font-black',
                      text: hasCustom ? `🚨 Coaching: "${comentario.substring(0, 22)}${comentario.length > 22 ? '...' : ''}"` : '🚨 REQUIERE COACHING URGENTE'
                    };
                  }
                };

                const activePeriodIdx = getPeriodIndex(actualTodayDay);
                const periodComentario = getCoachingForPeriod(m.comentario, activePeriodIdx);
                const coachingBadge = getCoachingBadge(cumplPersonal, periodComentario);

                const isExpanded = expandedRow === m.cedula;

                return (
                  <Fragment key={m.cedula}>
                    <tr 
                      className={`border-b transition-colors cursor-pointer ${activeTheme === 'oscuro' ? 'border-slate-800/50 hover:bg-slate-800/10' : 'border-slate-100 hover:bg-slate-50'} ${isExpanded ? (activeTheme === 'oscuro' ? 'bg-slate-800/10' : 'bg-slate-50/50') : ''}`}
                      onClick={() => setExpandedRow(isExpanded ? null : m.cedula)}
                    >
                      <td className={`py-4 text-xs font-extrabold ${tc.textPrimary}`}>
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                          <div>
                            <div>{m.apellidos} {m.nombres}</div>
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              <span className="text-[9px] font-mono text-slate-400">{m.cedula}</span>
                              <span 
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border inline-flex items-center gap-1 transition-all ${coachingBadge.style}`}
                                title={periodComentario || coachingBadge.text}
                              >
                                <Sparkles className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>{coachingBadge.text}</span>
                              </span>
                              {(!periodComentario || periodComentario.trim() === '') && (
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                                  Falta Coaching P{activePeriodIdx}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`py-4 text-xs font-mono font-bold text-center ${tc.textPrimary}`}>
                        <div className="flex flex-col items-center">
                          <span>${acumPersonal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Meta Mes: ${metaPersonal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[8.5px] text-blue-400/80 font-semibold">Meta al Día: ${metaProrateadaPersonal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-mono font-black ${
                            cumplPersonal >= 100 ? 'text-emerald-500' : cumplPersonal >= 70 ? 'text-amber-500' : 'text-red-400'
                          }`}>{cumplPersonal}%</span>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${activeTheme === 'oscuro' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                cumplPersonal >= 100 ? 'bg-emerald-500' : cumplPersonal >= 70 ? 'bg-amber-500' : 'bg-red-400'
                              }`}
                              style={{ width: `${Math.min(100, cumplPersonal)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-xs font-mono font-bold text-center">
                        <span className={arriba ? 'text-emerald-500' : 'text-red-400'}>
                          {arriba ? '+' : ''}${difPersonal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className={`py-4 text-xs font-mono font-bold text-center ${tc.textPrimary}`}>
                        <div className="flex flex-col items-center">
                          <span>${actualTodaySale.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Meta: ${actualTodayGoalVal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </td>
                      <td className={`py-4 text-xs font-mono font-bold text-center ${tc.textPrimary}`}>
                        <div className="flex flex-col items-center">
                          <span>${tomorrowDailyGoalVal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[9px] text-slate-455 font-bold mt-0.5 block uppercase font-sans">Meta Mañana</span>
                        </div>
                      </td>
                      <td className={`py-4 text-xs font-mono font-bold text-center ${tc.textPrimary}`}>
                        <div className="flex flex-col items-center">
                          <span>${weeklySaleAchieved.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Meta: ${weeklyGoalAssigned.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(m);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all duration-150 cursor-pointer ${
                            activeTheme === 'oscuro'
                              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modificar</span>
                        </button>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className={activeTheme === 'oscuro' ? 'bg-slate-900/30' : 'bg-slate-50/30'}>
                        <td colSpan={8} className="p-4 border-b border-slate-800/20">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-left">
                            <div className={`p-3 rounded-xl border ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-150'}`}>
                              <span className="text-[8px] font-black uppercase text-slate-400 block">Ticket Promedio (PDF)</span>
                              <span className={`text-xs font-mono font-black mt-1 block ${tc.textPrimary}`}>
                                ${(m.ticket_promedio || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}
                              </span>
                            </div>
                            <div className={`p-3 rounded-xl border ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-150'}`}>
                              <span className="text-[8px] font-black uppercase text-slate-400 block">Facturas (PDF)</span>
                              <span className={`text-xs font-mono font-black mt-1 block ${tc.textPrimary}`}>
                                {m.facturas || 0} tks
                              </span>
                            </div>
                            <div className={`p-3 rounded-xl border ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-150'}`}>
                              <span className="text-[8px] font-black uppercase text-slate-400 block">Facturas / Hora (PDF)</span>
                              <span className={`text-xs font-mono font-black mt-1 block ${tc.textPrimary}`}>
                                {m.facturas_hora || 0} /h
                              </span>
                            </div>
                            <div className={`p-3 rounded-xl border ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-150'}`}>
                              <span className="text-[8px] font-black uppercase text-slate-400 block">Cumpl. Fecha (Excel vs PDF)</span>
                              <span className={`text-xs font-mono font-black mt-1 block ${
                                cumplPersonal >= 100 ? 'text-emerald-500' : cumplPersonal >= 70 ? 'text-amber-500' : 'text-red-400'
                              }`}>
                                {cumplPersonal}%
                              </span>
                            </div>
                            <div className={`p-3 rounded-xl border ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-150'} col-span-2 sm:col-span-1`}>
                              <span className="text-[8px] font-black uppercase text-slate-400 block">Diferencia Fecha (Excel vs PDF)</span>
                              <span className={`text-xs font-mono font-black mt-1 block ${
                                difPersonal >= 0 ? 'text-emerald-500' : 'text-red-400'
                              }`}>
                                {difPersonal >= 0 ? '+' : ''}{difPersonal.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Quick Edit de Meta (Premium) */}
      {showEditModal && selectedMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-xl flex flex-col space-y-4 ${activeTheme === 'oscuro' ? 'bg-[#0c1427] border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 theme-accent-text" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Ajustar Meta y Coaching</h3>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border cursor-pointer ${activeTheme === 'oscuro' ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}
              >
                ✕ Cerrar
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 py-8">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
                <span className="text-xs font-black uppercase tracking-wider">¡Meta y Coaching Guardados!</span>
                <span className="text-[10px] font-medium text-slate-400">Se ha notificado al asesor y los cambios se reflejan de inmediato.</span>
              </div>
            ) : (
              <form onSubmit={handleSaveMeta} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Colaborador</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={`${selectedMeta.apellidos} ${selectedMeta.nombres}`}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-bold ${
                      activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800 text-slate-350' : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Meta Semanal ($)</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      step={0.01}
                      value={formMetaSemanal}
                      onChange={(e) => setFormMetaSemanal(e.target.value)}
                      disabled={isTercero}
                      className={`w-full px-2.5 py-2 rounded-xl border outline-none text-xs font-bold font-mono ${isTercero ? 'bg-slate-500/10 text-slate-450 border-slate-800' : tc.inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Meta Diaria ($)</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      step={0.01}
                      value={formMetaDiaria}
                      onChange={(e) => setFormMetaDiaria(e.target.value)}
                      disabled={isTercero}
                      className={`w-full px-2.5 py-2 rounded-xl border outline-none text-xs font-bold font-mono ${isTercero ? 'bg-slate-500/10 text-slate-450 border-slate-800' : tc.inputBg}`}
                    />
                  </div>
                </div>

                {/* Cuadrícula Interactiva de Metas Diarias (30 Días) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Planificación de Metas Diarias (Días 1 - ${daysInMonth}) {isTercero ? '(Solo lectura)' : '- Selecciona para editar'}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-2 border border-slate-200/50 dark:border-slate-800 rounded-2xl bg-slate-500/5">
                    {dailySalesList.map((dayObj) => {
                      const isSelected = dayObj.dia === selectedDayIndex;
                      return (
                        <button
                          key={dayObj.dia}
                          type="button"
                          disabled={isTercero}
                          onClick={() => {
                            setSelectedDayIndex(dayObj.dia);
                            setDayValue((dayObj.monto || 0).toString());
                          }}
                          className={`p-1.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-500/50 font-bold'
                              : 'bg-slate-500/10 border-slate-700/40 text-slate-300 ' + (isTercero ? 'opacity-80' : 'hover:bg-slate-500/20')
                          }`}
                        >
                          <span className="block text-[8px] opacity-75">D-{dayObj.dia}</span>
                          <span className="block text-[10px] font-mono">${Math.round(dayObj.monto || 0)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Campo para editar el día seleccionado */}
                  <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-700/40 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span>Venta del Día {selectedDayIndex}:</span>
                      <input 
                        type="number"
                        min={0}
                        step={0.01}
                        value={dayValue}
                        onChange={(e) => handleDayValueChange(e.target.value)}
                        disabled={isTercero}
                        className={`w-28 px-2 py-1 rounded-lg border outline-none text-right font-mono font-bold ${isTercero ? 'bg-slate-500/10 text-slate-400 border-slate-800' : tc.inputBg}`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Coaching / Feedback de Jefatura por Período
                  </label>
                  
                  {/* Selector de Períodos de Coaching (Tabs) */}
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4].map(pNum => {
                      const isActive = activeModalPeriodTab === pNum;
                      const isCurrentActual = getPeriodIndex(actualTodayDay) === pNum;
                      const hasText = pNum === 1 ? coachingP1 : pNum === 2 ? coachingP2 : pNum === 3 ? coachingP3 : coachingP4;
                      const hasTextBool = Boolean(hasText && hasText.trim() !== '');
                      
                      return (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => setActiveModalPeriodTab(pNum)}
                          className={`flex-1 py-1.5 px-1 rounded-lg border text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                              : 'bg-slate-500/10 border-slate-700/40 text-slate-300 hover:bg-slate-500/20'
                          }`}
                        >
                          <span>P{pNum}</span>
                          {isCurrentActual && <span title="Período Activo">✨</span>}
                          {hasTextBool && <span className="w-1 h-1 rounded-full bg-emerald-400"></span>}
                        </button>
                      );
                    })}
                  </div>

                  {activeModalPeriodTab === 1 && (
                    <textarea 
                      rows={2}
                      value={coachingP1}
                      onChange={(e) => setCoachingP1(e.target.value)}
                      placeholder="Escribe el coaching para el Período 1 (Días 1-8)..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-semibold focus:border-amber-500/50 ${tc.inputBg}`}
                    />
                  )}
                  {activeModalPeriodTab === 2 && (
                    <textarea 
                      rows={2}
                      value={coachingP2}
                      onChange={(e) => setCoachingP2(e.target.value)}
                      placeholder="Escribe el coaching para el Período 2 (Días 9-15)..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-semibold focus:border-amber-500/50 ${tc.inputBg}`}
                    />
                  )}
                  {activeModalPeriodTab === 3 && (
                    <textarea 
                      rows={2}
                      value={coachingP3}
                      onChange={(e) => setCoachingP3(e.target.value)}
                      placeholder="Escribe el coaching para el Período 3 (Días 16-23)..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-semibold focus:border-amber-500/50 ${tc.inputBg}`}
                    />
                  )}
                  {activeModalPeriodTab === 4 && (
                    <textarea 
                      rows={2}
                      value={coachingP4}
                      onChange={(e) => setCoachingP4(e.target.value)}
                      placeholder={`Escribe el coaching para el Período 4 (Días 24-${daysInMonth})...`}
                      className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-semibold focus:border-amber-500/50 ${tc.inputBg}`}
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setShowEditModal(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${activeTheme === 'oscuro' ? 'bg-slate-900 hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-250 text-slate-700'}`}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-750 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase shadow-md flex items-center gap-1.5 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>Guardar Cambios</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Edición Datos de Tienda */}
      {showStoreEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-xl flex flex-col space-y-4 ${activeTheme === 'oscuro' ? 'bg-[#0c1427] border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 theme-accent-text" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Modificar Datos de Tienda</h3>
              </div>
              <button 
                onClick={() => setShowStoreEditModal(false)}
                className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border cursor-pointer ${activeTheme === 'oscuro' ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}
              >
                ✕ Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveStoreStats} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block border-b pb-1 dark:border-slate-800">Resumen de Tienda (Tarjetas Superiores)</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 mb-1">
                    Meta Diaria ($) <span className="text-[8px] font-normal text-slate-400 lowercase">(excel)</span>
                  </label>
                  <input 
                    type="number" 
                    readOnly
                    value={formMetaDiariaTienda}
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none text-xs font-bold font-mono ${
                      activeTheme === 'oscuro'
                        ? 'bg-slate-900/40 text-slate-400 border-slate-800/80 cursor-not-allowed opacity-75'
                        : 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed opacity-75'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-455 mb-1">
                    Meta Semanal ($) <span className="text-[8px] font-normal text-slate-400 lowercase">(excel)</span>
                  </label>
                  <input 
                    type="number" 
                    readOnly
                    value={formMetaSemanalTienda}
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none text-xs font-bold font-mono ${
                      activeTheme === 'oscuro'
                        ? 'bg-slate-900/40 text-slate-400 border-slate-800/80 cursor-not-allowed opacity-75'
                        : 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed opacity-75'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Venta Lograda (Acumulado $) <span className="text-[8px] font-normal text-slate-400 lowercase">(excel)</span>
                </label>
                <input 
                  type="number" 
                  readOnly
                  value={formTotalVentaLograda}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-bold font-mono ${
                    activeTheme === 'oscuro'
                      ? 'bg-slate-900/40 text-slate-400 border-slate-800/80 cursor-not-allowed opacity-75'
                      : 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed opacity-75'
                  }`}
                />
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block border-b pb-1 pt-2 dark:border-slate-800">Métricas Operativas (Tarjetas Inferiores)</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-455 mb-1">
                    Ticket Promedio ($) <span className="text-[8px] font-normal text-slate-400 lowercase">(excel)</span>
                  </label>
                  <input 
                    type="number" 
                    readOnly
                    value={formTicketPromedio}
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none text-xs font-bold font-mono ${
                      activeTheme === 'oscuro'
                        ? 'bg-slate-900/40 text-slate-400 border-slate-800/80 cursor-not-allowed opacity-75'
                        : 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed opacity-75'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-455 mb-1">
                    Conversión (%) <span className="text-[8px] font-normal text-slate-400 lowercase">(excel)</span>
                  </label>
                  <input 
                    type="number" 
                    readOnly
                    value={formConversion}
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none text-xs font-bold font-mono ${
                      activeTheme === 'oscuro'
                        ? 'bg-slate-900/40 text-slate-400 border-slate-800/80 cursor-not-allowed opacity-75'
                        : 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed opacity-75'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-455 mb-1.5">Facturas Emitidas</label>
                <input 
                  type="number" 
                  required
                  min={0}
                  step={1}
                  value={formFacturas}
                  onChange={(e) => handleFacturasChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-bold font-mono ${tc.inputBg}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowStoreEditModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${activeTheme === 'oscuro' ? 'bg-slate-900 hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold uppercase shadow-md transition-all cursor-pointer"
                >
                  Guardar Datos de Tienda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
