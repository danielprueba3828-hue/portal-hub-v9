import { useState, useEffect } from 'react';
import { useHorarioStore } from '../store/horarioStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import { validarCedula, validarFormatoFecha, validarFormatoHora } from '../utils/validators';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  History,
  Info
} from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';

// Lector Inteligente de Excel en Formato Matriz (HORARIO PORTAL JUNIO 2026.xlsx)
function formatExcelTime(val) {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number') {
    let totalMinutes = Math.round(val * 24 * 60);
    let hours = Math.floor(totalMinutes / 60) % 24;
    let minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  let str = String(val).trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    let parts = str.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return str;
}

function findEmpleadoByExcelName(excelName, list) {
  if (!excelName) return null;
  const cleanExcel = excelName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "").trim();
  
  const directMaps = {
    'LUIS P': '2450019076', // LUIS FERNANDO PERALTA NIEVES
    'LUIS': '1753997376',   // LUIS RENE CARRION CAJAMARCA
    'VALENTINA': '1755859038',
    'DANIEL': '1729153807',
    'LEONARDO': '1724158850',
    'ALAIN C': '1753456738',
    'ANGEL': '1310559917',
    'ANTONY': '1150688420',
    'BRYAN': '1761707502',
    'ELIANE': '1729461796',
    'PAOLA': '0803422948',
    'WILSON': '1727839142',
    'SHANIA': '1726862194',
    'SAMANTHA': '1725290454',
    'GENESIS': '1753544103',
    'PABLO': '1756162903',
    'KERLY': '0931982136',
    'RAMIRO T': '1712323359' // SEGUNDO RAMIRO TENORIO TOAPANTA
  };

  if (directMaps[cleanExcel]) {
    const found = list.find(e => e.cedula === directMaps[cleanExcel]);
    if (found) return found;
  }

  const parts = cleanExcel.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;

  // 1. Coincidencia por nombre completo (Nombres Apellidos o Apellidos Nombres)
  let match = list.find(e => {
    const nom = (e.nombres || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const ape = (e.apellidos || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const fullName1 = `${nom} ${ape}`;
    const fullName2 = `${ape} ${nom}`;
    return nom === cleanExcel || ape === cleanExcel || fullName1.includes(cleanExcel) || fullName2.includes(cleanExcel) || cleanExcel.includes(fullName1) || cleanExcel.includes(fullName2);
  });
  if (match) return match;

  // 2. Coincidencia por tokens (todas las palabras claves del Excel coinciden en nombres o apellidos)
  match = list.find(e => {
    const nomApe = `${e.nombres || ''} ${e.apellidos || ''}`.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return parts.every(part => nomApe.includes(part));
  });
  if (match) return match;

  // 3. Coincidencia por primer nombre e inicial de apellido
  if (parts.length >= 2) {
    const firstWord = parts[0];
    const initial = parts[1][0];
    match = list.find(e => {
      const nom = (e.nombres || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
      const ape = (e.apellidos || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
      const nameOk = nom.includes(firstWord) || ape.includes(firstWord);
      const initialOk = ape.some(a => a.startsWith(initial)) || nom.some(n => n.startsWith(initial));
      return nameOk && initialOk;
    });
    if (match) return match;
  }

  // 4. Palabra clave simple (si contiene el primer término distintivo)
  match = list.find(e => {
    const nom = (e.nombres || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
    const ape = (e.apellidos || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
    return nom.includes(parts[0]) || ape.includes(parts[0]);
  });
  
  return match || null;
}

function detectZona(cellVal, previousZona) {
  if (!cellVal) return previousZona;
  const str = String(cellVal).trim().toUpperCase();
  if (str.includes('MUJER')) return 'ZONA MUJER';
  if (str.includes('HOMBRE')) return 'ZONA HOMBRE';
  if (str.includes('ROTATIVO')) return 'ROTATIVO';
  if (str.includes('CATEGORIZ')) return 'CATEGORIZACION';
  return previousZona;
}

function findEmpleadoByCedulaOrName(cedulaVal, nameVal, list) {
  if (cedulaVal) {
    let cleanCedula = String(cedulaVal).trim();
    cleanCedula = cleanCedula.replace(/[.\-\s]/g, '');
    if (cleanCedula.length === 9 && /^\d+$/.test(cleanCedula)) {
      cleanCedula = '0' + cleanCedula;
    }
    const foundByCedula = list.find(e => e.cedula === cleanCedula);
    if (foundByCedula) return foundByCedula;
  }
  return findEmpleadoByExcelName(nameVal, list);
}

function parseMatrixFormat(sheet, list, overrideMonth = null, overrideYear = null) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  
  let targetMonth = overrideMonth ? parseInt(overrideMonth, 10) : 8; // Por defecto Agosto (8)
  let targetYear = overrideYear ? parseInt(overrideYear, 10) : 2026;

  // Detectar mes desde celda E2 si no fue forzado
  if (!overrideMonth) {
    for (let c = 3; c <= Math.min(range.e.c, 45); c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: 1, c })];
      if (cell && cell.v) {
        const valUpper = String(cell.v).trim().toUpperCase();
        if (valUpper.includes('AGOSTO')) { targetMonth = 8; break; }
        if (valUpper.includes('JULIO')) { targetMonth = 7; break; }
        if (valUpper.includes('JUNIO')) { targetMonth = 6; break; }
      }
    }
  }

  // 1. Identificar columnas que representan días a partir de los números de la fila 4 (índice 3)
  const maxDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const colToDateStr = {};
  for (let c = 4; c <= range.e.c; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 3, c })];
    if (cell && cell.v !== undefined && cell.v !== '') {
      const val = typeof cell.v === 'number' ? cell.v : parseInt(String(cell.v).trim(), 10);
      if (!isNaN(val) && val >= 1 && val <= maxDaysInMonth) {
        const dStr = String(val).padStart(2, '0');
        const mStr = String(targetMonth).padStart(2, '0');
        colToDateStr[c] = `${dStr}/${mStr}/${targetYear}`;
      }
    }
  }

  // 2. Identificar columna de cédula (por defecto índice 3)
  let cedulaColIdx = 3;
  for (let c = 0; c <= Math.min(range.e.c, 10); c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 2, c })];
    if (cell && cell.v) {
      const valUpper = String(cell.v).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (valUpper.includes('CEDULA') || valUpper === 'ID') {
        cedulaColIdx = c;
        break;
      }
    }
  }

  const parsedRows = [];
  let r = 4;
  let lastZona = 'CATEGORIZACION';
  let currentArea = '';

  while (r <= range.e.r) {
    const cellA = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
    if (cellA && cellA.v) {
      const valA = String(cellA.v).trim().toUpperCase();
      if (valA && valA !== 'AREA' && valA !== 'ÁREA') currentArea = valA;
    }

    const cellB = sheet[XLSX.utils.encode_cell({ r, c: 1 })];
    const valB = cellB ? String(cellB.v).trim() : '';



    const cellC = sheet[XLSX.utils.encode_cell({ r, c: 2 })];
    const valC = cellC && cellC.v !== undefined && cellC.v !== null ? String(cellC.v).trim() : '';
    lastZona = detectZona(valC, lastZona);

    const cellD = sheet[XLSX.utils.encode_cell({ r, c: cedulaColIdx })];
    const valD = cellD ? String(cellD.v).trim() : '';

    const isName = valB && valB.length >= 3 && !/^\d+$/.test(valB) && !['TOTAL', 'GENERAL', 'SUMA', 'SUBTOTAL'].some(x => valB.toUpperCase().includes(x));

    if (isName) {
      const matchedEmp = findEmpleadoByCedulaOrName(valD, valB, list);

      if (matchedEmp) {
        const isAsesor = matchedEmp.cargo?.toLowerCase().includes('asesor') || currentArea.includes('ASESOR');
        const empZona = isAsesor ? lastZona : null;

        Object.entries(colToDateStr).forEach(([colStr, dateStr]) => {
          const col = parseInt(colStr, 10);
          const times = [];
          let isComp = false;

          for (let off = 0; off < 4; off++) {
            const tCell = sheet[XLSX.utils.encode_cell({ r: r + off, c: col })];
            if (tCell) {
              if (tCell.s && tCell.s.fgColor) {
                const rgb = String(tCell.s.fgColor.rgb || tCell.s.fgColor.theme || '');
                if (rgb.includes('FF0000') || rgb.includes('C00000')) isComp = true;
              }
              if (tCell.v !== undefined && tCell.v !== '') {
                const vStr = String(tCell.v).toUpperCase();
                if (vStr.includes('COMP')) isComp = true;
                const formatted = formatExcelTime(tCell.v);
                if (formatted) times.push(formatted);
              }
            }
          }

          let tipoTurno = 'Descanso';
          let horaInicio = '00:00';
          let horaFin = '00:00';
          let motivo = '';

          if (isComp) {
            tipoTurno = 'Feriado/Novedad';
            motivo = 'Día de compensación';
            if (times.length >= 2) {
              horaInicio = times[0];
              horaFin = times[times.length - 1];
            }
          } else if (times.length >= 2) {
            horaInicio = times[0];
            horaFin = times[times.length - 1];
            const startH = parseInt(horaInicio.split(':')[0], 10);
            tipoTurno = startH < 12 ? 'Mañana' : 'Tarde';
          }

          parsedRows.push({
            'cedula': matchedEmp.cedula,
            'nombre completo': `${matchedEmp.apellidos}, ${matchedEmp.nombres}`,
            'fecha': dateStr,
            'turno': tipoTurno,
            'hora inicio': horaInicio,
            'hora fin': horaFin,
            'zona': empZona,
            'motivo': motivo
          });
        });

        r += 5;
      } else {
        r += 5;
      }
    } else {
      r++;
    }
  }

  return parsedRows;
}

export default function CargaExcel() {
  const { user } = useAuthStore();
  const myCedula = user?.user_metadata?.cedula;
  
  const { theme: activeTheme } = useThemeStore();
  const myTheme = getEmployeeTheme(user?.user_metadata?.cargo || 'Asesor de Ventas', user?.user_metadata?.nombres || '');
  const tc = getThemeClasses(activeTheme, myTheme);
  
  const { 
    empleados, 
    turnos, 
    fetchEmpleados, 
    fetchTurnos, 
    saveTurno,
    saveTurnosMasivos,
    logAuditoria,
    fetchLogAuditoria,
    loading 
  } = useHorarioStore();

  const [file, setFile] = useState(null);
  const [rawFileBuffer, setRawFileBuffer] = useState(null);
  const [overrideMonth, setOverrideMonth] = useState('');
  const [overrideYear, setOverrideYear] = useState('2026');
  const [validationResults, setValidationResults] = useState({
    errors: 0,
    warnings: 0,
    isValid: false,
    rows: []
  });
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  // Estados para Edición Rápida de Turno Individual
  const [rapidoCedula, setRapidoCedula] = useState('');
  const [rapidoFecha, setRapidoFecha] = useState('');
  const [rapidoTurno, setRapidoTurno] = useState('Mañana');
  const [rapidoInicio, setRapidoInicio] = useState('08:00');
  const [rapidoFin, setRapidoFin] = useState('16:00');
  const [rapidoMotivo, setRapidoMotivo] = useState('');
  const [rapidoSuccess, setRapidoSuccess] = useState(false);

  const getTurnoBgColor = (tipo) => {
    switch (tipo) {
      case 'Mañana': return 'bg-blue-500';
      case 'Tarde': return 'bg-amber-500';
      case 'Descanso': return 'bg-slate-400';
      case 'Feriado/Novedad': return 'bg-red-500';
      default: return 'bg-slate-200';
    }
  };

  const handleRapidoTurnoChange = (tipo) => {
    let inicio = '08:00';
    let fin = '16:00';
    if (tipo === 'Tarde') {
      inicio = '13:00';
      fin = '21:00';
    } else if (tipo === 'Descanso' || tipo === 'Feriado/Novedad') {
      inicio = '00:00';
      fin = '00:00';
    }
    setRapidoTurno(tipo);
    setRapidoInicio(inicio);
    setRapidoFin(fin);
  };

  const handleRapidoSubmit = async (e) => {
    e.preventDefault();
    if (!rapidoCedula) {
      alert("Por favor, seleccione un colaborador.");
      return;
    }
    if (!rapidoFecha) {
      alert("Por favor, seleccione una fecha.");
      return;
    }

    const existing = turnos.find(t => t.empleado_cedula === rapidoCedula && t.fecha === rapidoFecha);

    const t = {
      id: existing ? existing.id : undefined,
      empleado_cedula: rapidoCedula,
      fecha: rapidoFecha,
      tipo_turno: rapidoTurno,
      hora_inicio: rapidoTurno === 'Descanso' ? '00:00' : rapidoInicio,
      hora_fin: rapidoTurno === 'Descanso' ? '00:00' : rapidoFin,
      motivo_cambio: rapidoMotivo || 'Cambio manual rápido',
      creado_por: myCedula
    };

    const res = await saveTurno(t);
    if (res.success) {
      setRapidoSuccess(true);
      setRapidoMotivo('');
      setTimeout(() => setRapidoSuccess(false), 3000);
      fetchTurnos();
      fetchLogAuditoria();
    } else {
      alert("Error al guardar turno: " + res.error);
    }
  };

  useEffect(() => {
    fetchEmpleados();
    fetchTurnos();
    fetchLogAuditoria();

    const channel = supabase
      .channel('realtime-carga-excel-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'empleados' },
        () => {
          fetchEmpleados();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEmpleados, fetchTurnos, fetchLogAuditoria]);

  // Generar y descargar la plantilla Excel oficial
  const handleDownloadTemplate = () => {
    const wsData = [
      ['Cédula', 'Nombre Completo', 'Fecha', 'Turno', 'Hora Inicio', 'Hora Fin'],
      ['1712345675', 'Juan Pérez', '01/06/2026', 'Mañana', '08:00', '16:00'],
      ['1798765432', 'María López', '01/06/2026', 'Tarde', '13:00', '21:00'],
      ['1712345675', 'Juan Pérez', '02/06/2026', 'Descanso', '00:00', '00:00'],
      ['1798765432', 'María López', '02/06/2026', 'Feriado/Novedad', '00:00', '00:00']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    ws['!cols'] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Horarios');
    XLSX.writeFile(wb, 'plantilla_horarios_marathon.xlsx');
  };

  // Re-procesar archivo si cambia mes/año
  const parseFileWithParams = (data, month, year) => {
    const workbook = XLSX.read(data, { type: 'binary', cellStyles: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const cellD3 = sheet['D3'] ? String(sheet['D3'].v).trim().toUpperCase() : '';
    const cellE3 = sheet['E3'] ? String(sheet['E3'].v).trim().toUpperCase() : '';
    const isMatrixFormat = cellD3.includes('CEDULA') || cellD3.includes('CÉDULA') || cellE3.includes('LUN') || cellE3.includes('MAR');

    let rowsToProcess;
    if (isMatrixFormat) {
      rowsToProcess = parseMatrixFormat(sheet, empleados, month, year);
    } else {
      rowsToProcess = XLSX.utils.sheet_to_json(sheet);
    }
    
    processAndValidate(rowsToProcess, month, year);
  };

  // Manejar el archivo subido
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      alert("Por favor, suba únicamente archivos Excel (.xlsx o .xls)");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("El tamaño del archivo supera el límite de 5 MB");
      return;
    }

    setFile(selectedFile);
    setUploadSuccess(false);

    let initialMonth = overrideMonth || '8';
    if (!overrideMonth) {
      const fNameUpper = selectedFile.name.toUpperCase();
      if (fNameUpper.includes('AGOSTO')) initialMonth = '8';
      else if (fNameUpper.includes('JULIO')) initialMonth = '7';
      else if (fNameUpper.includes('JUNIO')) initialMonth = '6';
      setOverrideMonth(initialMonth);
    }
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      setRawFileBuffer(data);
      parseFileWithParams(data, initialMonth, overrideYear);
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleMonthYearChange = (newMonth, newYear) => {
    setOverrideMonth(newMonth);
    setOverrideYear(newYear);
    if (rawFileBuffer) {
      parseFileWithParams(rawFileBuffer, newMonth, newYear);
    }
  };

  // Procesar y Validar Datos del Excel
  const processAndValidate = (rawRows, activeMonth = null, activeYear = null) => {
    const currentMonth = activeMonth || overrideMonth || '8';
    const currentYear = activeYear || overrideYear || '2026';
    let errorCount = 0;
    let warningCount = 0;
    const validatedRows = [];

    rawRows.forEach((row, index) => {
      const getVal = (keys) => {
        const foundKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
        return foundKey ? String(row[foundKey]).trim() : '';
      };

      const cedula = getVal(['cedula', 'id', 'documento']);
      const nombre = getVal(['nombre completo', 'nombre', 'empleado']);
      const fechaRaw = getVal(['fecha', 'dia']);
      const turno = getVal(['turno', 'tipo turno', 'tipo_turno']);
      const inicio = getVal(['hora inicio', 'inicio', 'entrada', 'hora_inicio']) || '00:00';
      const fin = getVal(['hora fin', 'fin', 'salida', 'hora_fin']) || '00:00';
      const zona = getVal(['zona']);

      const errors = [];
      const warnings = [];

      // 1. Validar existencia del Empleado por Cédula
      const empExists = empleados.some(e => e.cedula === cedula);
      if (!cedula) {
        errors.push("Cédula ausente o vacía.");
      } else if (!validarCedula(cedula)) {
        errors.push("Cédula inválida (Algoritmo nacional fallido).");
      } else if (!empExists) {
        errors.push(`Empleado con cédula ${cedula} no registrado en el sistema.`);
      }

      // 2. Validar y Forzar Fecha según Mes Seleccionado
      let fechaFormateada = '';
      if (!fechaRaw) {
        errors.push("Fecha ausente.");
      } else {
        let dayStr = '01';
        let monthStr = String(currentMonth).padStart(2, '0');
        let yearStr = String(currentYear);

        if (validarFormatoFecha(fechaRaw)) {
          const parts = fechaRaw.split('/');
          dayStr = parts[0].padStart(2, '0');
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) {
          const parts = fechaRaw.split('-');
          dayStr = parts[2].padStart(2, '0');
        } else {
          const excelSerial = Number(fechaRaw);
          if (!isNaN(excelSerial) && excelSerial > 30000) {
            const dateObj = new Date((excelSerial - 25569) * 86400 * 1000);
            dayStr = String(dateObj.getUTCDate()).padStart(2, '0');
          }
        }

        fechaFormateada = `${yearStr}-${monthStr}-${dayStr}`;
      }

      // 3. Validar Turno
      const turnosValidos = ['Mañana', 'Tarde', 'Descanso', 'Feriado/Novedad'];
      if (!turno) {
        errors.push("Tipo de turno ausente.");
      } else if (!turnosValidos.includes(turno)) {
        errors.push(`Turno inválido (${turno}). Opciones: Mañana, Tarde, Descanso, Feriado/Novedad.`);
      }

      // 4. Validar formato de horas
      if (turno !== 'Descanso') {
        if (!validarFormatoHora(inicio)) {
          errors.push(`Hora de inicio inválida (${inicio}). Formato de 24h HH:MM.`);
        }
        if (!validarFormatoHora(fin)) {
          errors.push(`Hora de fin inválida (${fin}). Formato de 24h HH:MM.`);
        }
      }

      // 5. Advertir duplicados
      if (fechaFormateada && empExists) {
        const dupInFile = validatedRows.some(r => r.cedula === cedula && r.fecha === fechaFormateada);
        if (dupInFile) {
          warnings.push("Turno duplicado en este mismo archivo Excel para esta fecha.");
        }

        const dupInDb = turnos.some(t => t.empleado_cedula === cedula && t.fecha === fechaFormateada);
        if (dupInDb) {
          warnings.push("Ya existe un turno en base de datos para este día. Se SOBRESCRIBIRÁ al confirmar.");
        }
      }

      errorCount += errors.length;
      warningCount += warnings.length;

      validatedRows.push({
        index: index + 1,
        cedula,
        nombre: nombre || 'Desconocido',
        fecha: fechaFormateada,
        fechaRaw,
        turno,
        inicio,
        fin,
        zona,
        errors,
        warnings
      });
    });

    setValidationResults({
      errors: errorCount,
      warnings: warningCount,
      isValid: errorCount === 0 && validatedRows.length > 0,
      rows: validatedRows
    });
  };

  const handleConfirmUpload = async () => {
    if (!validationResults.isValid) return;

    const dbTurnos = validationResults.rows.map(row => ({
      empleado_cedula: row.cedula,
      fecha: row.fecha,
      tipo_turno: row.turno,
      hora_inicio: row.turno === 'Descanso' ? '00:00' : row.inicio,
      hora_fin: row.turno === 'Descanso' ? '00:00' : row.fin,
      zona: row.zona || null,
      creado_por: myCedula
    }));

    // Construir lista de zonas únicas por empleado
    const uniqueZonasMap = {};
    validationResults.rows.forEach(row => {
      if (row.cedula && row.zona) {
        uniqueZonasMap[row.cedula] = row.zona;
      }
    });
    const dbZonas = Object.entries(uniqueZonasMap).map(([cedula, zona]) => ({
      cedula,
      zona
    }));

    const res = await saveTurnosMasivos(dbTurnos, dbZonas);
    if (res.success) {
      setUploadSuccess(true);
      setSuccessCount(res.count);
      setFile(null);
      setValidationResults({ errors: 0, warnings: 0, isValid: false, rows: [] });
      fetchLogAuditoria();
    } else {
      alert("Error al cargar turnos masivos: " + res.error);
    }
  };

  const importLogs = logAuditoria.filter(l => l.accion.includes("turnos") || l.accion.includes("Excel") || l.accion.includes("Inserción en turnos"));

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-accent-bg { background-color: ${myTheme.primary} !important; }
        .theme-accent-text { color: ${myTheme.primary} !important; }
        .theme-accent-border { border-color: ${myTheme.primary} !important; }
        .theme-accent-border-soft { border-color: ${myTheme.primary}30 !important; }
        .theme-accent-ring-focus:focus { border-color: ${myTheme.primary} !important; box-shadow: 0 0 0 3px ${myTheme.primary}20 !important; }
        .theme-accent-hover:hover { background-color: ${myTheme.primary}dd !important; }
        .theme-accent-border-hover:hover { border-color: ${myTheme.primary} !important; }
        .theme-accent-bg-hover:hover { background-color: ${myTheme.primary}20 !important; }
        .theme-accent-bg-soft { background-color: ${myTheme.primary}10 !important; }
        .theme-accent-bg-medium { background-color: ${myTheme.primary}20 !important; }
        .theme-tab-active { border-color: ${myTheme.primary}80 !important; background-color: ${myTheme.primary}15 !important; }
        .theme-gradient-bg { background: linear-gradient(135deg, ${myTheme.primary} 0%, ${myTheme.primary}dd 100%) !important; }
        .theme-accent-shadow { box-shadow: 0 4px 20px -2px ${myTheme.primary}30 !important; }
      ` }} />
      
      {/* Encabezado */}
      <div>
        <h2 className={`text-3xl font-title font-semibold uppercase tracking-tight ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Carga de Horarios desde Excel</h2>
        <p className={`text-xs font-medium ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Actualice la planificación del personal de manera masiva utilizando archivos de cálculo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
        
        {/* Panel de Carga y Descarga */}
        <div className="lg:col-span-1 space-y-6">

          {/* Card 1: Subir Archivo Excel (Carga Masiva) */}
          <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${tc.cardBg || 'bg-white border-marathon-light'}`} style={tc.cardBgStyle}>
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl border ${activeTheme === 'oscuro' ? 'bg-slate-900 border-slate-700 text-amber-500' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                <Upload className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Subir Archivo Excel</h3>
            </div>

            {/* SELECTOR DE MES A SUBIR */}
            <div className="p-4 rounded-2xl border-2 border-blue-500 bg-blue-50/20 text-left space-y-2.5 shadow-lg">
              <label className="block text-xs font-black uppercase text-blue-400 tracking-wider flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>MES AL QUE DESEAS SUBIR LOS HORARIOS:</span>
              </label>

              <div className="flex gap-2">
                <select
                  value={overrideMonth || '8'}
                  onChange={(e) => handleMonthYearChange(e.target.value, overrideYear)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-blue-500 bg-slate-900 text-white font-black text-sm outline-none cursor-pointer shadow-md"
                >
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
                <select
                  value={overrideYear}
                  onChange={(e) => handleMonthYearChange(overrideMonth || '8', e.target.value)}
                  className="w-28 px-3 py-3 rounded-xl border-2 border-blue-500 bg-slate-900 text-white font-black text-sm outline-none cursor-pointer shadow-md"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div className="text-[11px] font-extrabold text-emerald-400 text-center uppercase tracking-wide">
                ✓ Mes seleccionado para subir: {['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][parseInt(overrideMonth || '8')]} {overrideYear}
              </div>
            </div>

            {/* Input uploader */}
            <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative group ${activeTheme === 'oscuro' ? 'bg-slate-900/50 border-slate-700 hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:theme-accent-border'}`}>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileSpreadsheet className={`w-10 h-10 mx-auto mb-3 transition-colors ${activeTheme === 'oscuro' ? 'text-slate-500 group-hover:text-slate-400' : 'text-slate-400 group-hover:theme-accent-text'}`} />
              <span className={`block text-xs font-bold uppercase tracking-wide ${activeTheme === 'oscuro' ? 'text-slate-300' : 'text-slate-700'}`}>
                {file ? file.name : "Seleccione su Excel"}
              </span>
              <span className="block text-[10px] text-slate-400 font-semibold mt-1">
                Máximo 5 MB (.xlsx / .xls)
              </span>
            </div>

            {/* Resultados rápidos de validación y Selector de Mes */}
            {file && (
              <div className={`p-4 rounded-2xl border-2 space-y-3 text-xs ${activeTheme === 'oscuro' ? 'bg-slate-900 border-blue-500/50 text-slate-300' : 'bg-blue-50/50 border-blue-300 text-slate-800'}`}>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Filas analizadas:</span>
                  <span className={`font-black ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>{validationResults.rows.length}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Errores críticos:</span>
                  <span className={validationResults.errors > 0 ? "text-marathon-red flex items-center space-x-1 font-bold" : "text-emerald-500 font-bold"}>
                    {validationResults.errors > 0 && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span>{validationResults.errors}</span>
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Advertencias:</span>
                  <span className={validationResults.warnings > 0 ? "text-amber-400 flex items-center space-x-1 font-bold" : "text-slate-400 font-bold"}>
                    {validationResults.warnings > 0 && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span>{validationResults.warnings}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Confirmar e Insertar */}
            {file && (
              <button
                onClick={handleConfirmUpload}
                disabled={!validationResults.isValid || loading}
                className={`
                  w-full font-black py-4 px-5 rounded-2xl text-xs uppercase tracking-wider border-b-4 transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer shadow-xl
                  ${validationResults.isValid 
                    ? 'theme-accent-bg theme-accent-hover text-white theme-accent-border hover:border-blue-900' 
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }
                `}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{loading ? 'Confirmando...' : `CONFIRMAR E INSERTAR EN ${['', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'][parseInt(overrideMonth || '8')]} ${overrideYear}`}</span>
              </button>
            )}

            {/* Mensaje de Éxito */}
            {uploadSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-start space-x-3 text-emerald-800 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">¡Carga Procesada Exitosamente!</h4>
                  <p className="mt-1">Se han guardado y sobrescrito **{successCount}** turnos correctamente en la base de datos.</p>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Modificar Horario Individual (Gestión Rápida) */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-4 relative overflow-hidden ${tc.cardBg || 'bg-white border-marathon-light'}`} style={tc.cardBgStyle}>
            <div className="absolute top-0 left-0 w-full h-[4px] theme-accent-bg"></div>
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl border ${activeTheme === 'oscuro' ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-blue-50 border-blue-100 theme-accent-text'}`}>
                <History className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Modificar Horario Individual</h3>
            </div>
            
            <form onSubmit={handleRapidoSubmit} className="space-y-3.5">
              {/* Colaborador */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Colaborador</label>
                <select
                  required
                  value={rapidoCedula}
                  onChange={(e) => setRapidoCedula(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none text-xs font-semibold ${tc.inputBg || 'bg-slate-50 border-slate-200 text-slate-800 focus:theme-accent-border focus:ring-2 '}`}
                >
                  <option value="">-- Seleccione Colaborador --</option>
                  {empleados
                    .filter(e => e.activo && 
                      e.rol?.toLowerCase() !== 'supervisor' && 
                      e.rol?.toLowerCase() !== 'admin' && 
                      e.cargo?.toLowerCase() !== 'supervisor' && 
                      e.cargo?.toLowerCase() !== 'jefe' && 
                      e.cargo?.toLowerCase() !== 'subjefe'
                    )
                    .map(e => (
                      <option key={e.cedula} value={e.cedula}>
                        {e.apellidos}, {e.nombres} ({e.cargo})
                      </option>
                    ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Fecha del Horario</label>
                <input
                  type="date"
                  required
                  value={rapidoFecha}
                  onChange={(e) => setRapidoFecha(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none text-xs font-mono font-bold ${tc.inputBg || 'bg-slate-50 border-slate-200 text-slate-800 focus:theme-accent-border focus:ring-2 '}`}
                />
              </div>

              {/* Tipo de Turno */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Tipo de Turno</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Mañana', 'Tarde', 'Descanso', 'Feriado/Novedad'].map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => handleRapidoTurnoChange(tipo)}
                      className={`
                        py-1.5 px-2 text-[10px] font-bold uppercase rounded-lg border transition-all flex items-center justify-center space-x-1.5 cursor-pointer
                        ${rapidoTurno === tipo 
                          ? 'theme-accent-bg text-white theme-accent-border shadow-sm' 
                          : activeTheme === 'oscuro' 
                            ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }
                      `}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${getTurnoBgColor(tipo)}`}></span>
                      <span>{tipo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Horas (Inicio / Fin) */}
              {rapidoTurno !== 'Descanso' && (
                <div className={`grid grid-cols-2 gap-3 p-2.5 rounded-xl border ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <div>
                    <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-600'}`}>Hora Inicio</label>
                    <input
                      type="text"
                      required
                      placeholder="HH:MM"
                      value={rapidoInicio}
                      onChange={(e) => setRapidoInicio(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold outline-none ${tc.inputBg || 'bg-white border-slate-200 text-slate-800'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-600'}`}>Hora Fin</label>
                    <input
                      type="text"
                      required
                      placeholder="HH:MM"
                      value={rapidoFin}
                      onChange={(e) => setRapidoFin(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold outline-none ${tc.inputBg || 'bg-white border-slate-200 text-slate-800'}`}
                    />
                  </div>
                </div>
              )}

              {/* Motivo */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Motivo (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Calamidad, cobertura, etc."
                  value={rapidoMotivo}
                  onChange={(e) => setRapidoMotivo(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none text-xs font-semibold ${tc.inputBg || 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>

              {/* Botón de Guardar */}
              <button
                type="submit"
                className="w-full theme-accent-bg theme-accent-hover text-white font-bold py-2.5 px-4 rounded-xl border-b-4 theme-accent-border hover:border-blue-900 transition-all duration-150 text-xs uppercase tracking-wider shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Guardar Cambios</span>
              </button>
            </form>

            {/* Éxito temporal */}
            {rapidoSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] font-bold text-emerald-800 flex items-center space-x-1.5 animate-fade-in mt-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Turno guardado correctamente.</span>
              </div>
            )}

            {/* Descargar Plantilla */}
            <div className="pt-2 text-center border-t border-slate-700/40">
              <button 
                type="button"
                onClick={handleDownloadTemplate}
                className="text-[10px] font-bold text-[#E30613] hover:underline uppercase tracking-wider flex items-center justify-center space-x-1 mx-auto cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Plantilla Oficial Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Vista Previa y Validaciones */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card de Previsualización */}
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${tc.cardBg || 'bg-white border-marathon-light'}`} style={tc.cardBgStyle}>
            <div className={`flex items-center justify-between border-b pb-3 ${activeTheme === 'oscuro' ? 'border-slate-700/60' : 'border-slate-100'}`}>
              <div className="flex items-center space-x-2.5">
                <Info className="w-4 h-4 theme-accent-text" />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Vista Previa y Validaciones</h3>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${activeTheme === 'oscuro' ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                {validationResults.rows.length} Filas cargadas
              </span>
            </div>

            {/* Mensaje de "Cargue un archivo" */}
            {!file && !uploadSuccess && (
              <div className="py-20 text-center space-y-2 text-slate-400">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold uppercase tracking-wider">Previsualización de Datos</p>
                <p className="text-[11px] max-w-sm mx-auto font-medium text-slate-500">Suba un archivo Excel válido (incluyendo plantillas en formato de matriz mensual como el **Horario Portal Junio 2026**) para analizar filas e inconsistencias.</p>
              </div>
            )}

            {/* Tabla de previsualización */}
            {file && validationResults.rows.length > 0 && (
              <div className={`overflow-x-auto max-h-[450px] border rounded-xl shadow-inner ${activeTheme === 'oscuro' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-marathon-light'}`}>
                <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                  <thead>
                    <tr className={`${activeTheme === 'oscuro' ? 'bg-slate-950 border-b border-slate-800' : 'bg-marathon-deep border-b border-slate-700'} text-white font-title text-sm`}>
                      <th className="p-3 text-center w-12">FILA</th>
                      <th className="p-3 w-32">CÉDULA</th>
                      <th className="p-3 w-40">NOMBRE</th>
                      <th className="p-3 w-28">FECHA</th>
                      <th className="p-3 w-28">TURNO</th>
                      <th className="p-3">ESTADO / OBSERVACIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.rows.map((row, idx) => {
                      const hasErrors = row.errors.length > 0;
                      const hasWarnings = row.warnings.length > 0;

                      return (
                        <tr 
                          key={idx} 
                          className={`
                            border-b transition-colors
                            ${activeTheme === 'oscuro' 
                              ? 'border-slate-700/60 hover:bg-slate-700/40' 
                              : 'border-slate-100 hover:bg-slate-50'
                            }
                            ${hasErrors 
                              ? activeTheme === 'oscuro' ? 'bg-red-950/20' : 'bg-red-50/50 hover:bg-red-50' 
                              : hasWarnings 
                                ? activeTheme === 'oscuro' ? 'bg-amber-950/15' : 'bg-amber-50/30 hover:bg-amber-50/60' 
                                : ''
                            }
                          `}
                        >
                          <td className="p-3 text-center font-bold text-slate-400">{row.index}</td>
                          <td className={`p-3 font-mono font-semibold ${hasErrors && row.errors.some(e => e.includes('Cédula')) ? 'text-marathon-red font-bold' : activeTheme === 'oscuro' ? 'text-slate-200' : 'text-slate-800'}`}>{row.cedula}</td>
                          <td className={`p-3 font-semibold truncate max-w-[150px] ${activeTheme === 'oscuro' ? 'text-slate-300' : 'text-slate-700'}`}>{row.nombre}</td>
                          <td className={`p-3 font-mono font-semibold ${hasErrors && row.errors.some(e => e.includes('fecha')) ? 'text-marathon-red font-bold' : activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-600'}`}>{row.fecha || row.fechaRaw}</td>
                          <td className={`p-3 font-bold ${activeTheme === 'oscuro' ? 'text-slate-200' : 'text-slate-700'}`}>{row.turno}</td>
                          <td className="p-3">
                            {hasErrors ? (
                              <div className="space-y-1">
                                {row.errors.map((e, eIdx) => (
                                  <span key={eIdx} className="text-[10px] bg-red-100 text-marathon-red font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 w-max border border-red-200">
                                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                    <span>{e}</span>
                                  </span>
                                ))}
                              </div>
                            ) : hasWarnings ? (
                              <div className="space-y-1">
                                {row.warnings.map((w, wIdx) => (
                                  <span key={wIdx} className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 w-max border border-amber-200">
                                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                    <span>{w}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-md flex items-center space-x-1 w-max border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                <span>Correcto</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Historial de Cargas */}
            <div className={`pt-4 border-t ${activeTheme === 'oscuro' ? 'border-slate-700/60' : 'border-slate-100'}`}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <History className="w-4 h-4 text-slate-400" />
                <span className={activeTheme === 'oscuro' ? 'text-slate-300' : 'text-marathon-deep'}>Historial Reciente de Planificaciones</span>
              </h4>
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {importLogs.length > 0 ? (
                  importLogs.map((log, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl border text-[10px] font-semibold flex justify-between items-start gap-4 ${activeTheme === 'oscuro' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                      <div>
                        <span className={`font-bold block ${activeTheme === 'oscuro' ? 'text-white' : 'text-slate-800'}`}>{log.accion}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 block">{log.detalles}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="theme-accent-text block font-bold">Por: {log.usuario_cedula}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">{new Date(log.fecha_hora).toLocaleString('es-EC')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 font-medium italic text-center py-2">No se registran importaciones masivas previas.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}