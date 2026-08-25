/**
 * scheduleExporter.js
 * Generador de reportes en PDF y Excel para la planificación de horarios.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getDaysInMonthArray, classifyShift, calculateShiftHours } from './scheduleEngine';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Exporta la matriz de horarios del mes a PDF en formato apaisado (Landscape)
 */
export function exportSchedulePDF(year, month, employees, turnosMap, storeName = 'Marathon Sports') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3' // A3 landscape para acomodar los 31 días limpiamente
  });

  const days = getDaysInMonthArray(year, month);
  const monthName = MONTH_NAMES[month - 1];

  // Encabezado del documento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`PLANIFICACIÓN OFICIAL DE HORARIOS - ${storeName.toUpperCase()}`, 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${monthName} ${year} | Total Colaboradores: ${employees.length}`, 14, 22);

  // Columnas para la tabla
  const headDays = days.map(d => `${d.dayNameShort}\n${d.dayNumber}`);
  const headers = [['Colaborador / Cargo', 'Zona', ...headDays, 'Total Hrs']];

  // Filas
  const rows = employees.map(emp => {
    let totalHours = 0;
    const dayCells = days.map(d => {
      const shift = turnosMap[`${emp.cedula}_${d.dateStr}`];
      if (!shift) return '-';
      const classification = classifyShift(shift);
      if (classification.isOff) return classification.short;
      totalHours += calculateShiftHours(shift);
      return `${shift.hora_inicio || '09:30'}\n${shift.hora_fin || '18:30'}`;
    });

    return [
      `${emp.nombres} ${emp.apellidos}\n(${emp.cargo || 'Asesor'})`,
      emp.zona ? emp.zona.replace('ZONA ', '') : '-',
      ...dayCells,
      `${Math.round(totalHours)}h`
    ];
  });

  autoTable(doc, {
    startY: 26,
    head: headers,
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      halign: 'center',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 50, fontStyle: 'bold' },
      1: { halign: 'center', cellWidth: 22 },
      [headers[0].length - 1]: { halign: 'center', fontStyle: 'bold', fillColor: [240, 253, 244] }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index >= 2 && data.column.index < headers[0].length - 1) {
        const text = String(data.cell.raw || '');
        if (text === 'L') {
          data.cell.styles.fillColor = [241, 245, 249]; // Gris descanso
          data.cell.styles.textColor = [100, 116, 139];
        } else if (text === 'VAC' || text.includes('VAC')) {
          data.cell.styles.fillColor = [255, 228, 230]; // Rosa vacaciones
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    }
  });

  doc.save(`Horarios_${storeName.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`);
}

/**
 * Exporta la matriz a archivo Excel (.xlsx)
 */
export function exportScheduleExcel(year, month, employees, turnosMap, storeName = 'Marathon Sports') {
  const days = getDaysInMonthArray(year, month);
  const monthName = MONTH_NAMES[month - 1];

  const headers = ['Cédula', 'Nombres', 'Apellidos', 'Cargo', 'Zona'];
  days.forEach(d => {
    headers.push(`${d.dayNameShort} ${d.dayNumber}`);
  });
  headers.push('Total Horas');

  const rows = [headers];

  employees.forEach(emp => {
    let totalHours = 0;
    const row = [
      emp.cedula,
      emp.nombres,
      emp.apellidos,
      emp.cargo || 'Asesor de Ventas',
      emp.zona || 'CATEGORIZACION'
    ];

    days.forEach(d => {
      const shift = turnosMap[`${emp.cedula}_${d.dateStr}`];
      if (!shift) {
        row.push('-');
      } else {
        const classification = classifyShift(shift);
        if (classification.isOff) {
          row.push(classification.short);
        } else {
          totalHours += calculateShiftHours(shift);
          row.push(`${shift.hora_inicio || '09:30'} - ${shift.hora_fin || '18:30'}`);
        }
      }
    });

    row.push(Math.round(totalHours));
    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Horarios_${monthName}`);
  XLSX.writeFile(wb, `Horarios_${storeName.replace(/\s+/g, '_')}_${monthName}_${year}.xlsx`);
}
