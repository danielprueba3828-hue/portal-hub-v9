import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://gkjsnhbczjnljfjvmdoe.supabase.co',
  'sb_publishable_1TLdvss9uF_X31iT5u7GNA_WV9dvBjH'
);

const { data: dbEmpleados } = await supabase.from('empleados').select('*');
const { data: teamMetas } = await supabase.from('metas').select('*');

const matchAdvisorByName = (rowText, list) => {
  const cleanText = rowText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanTextY = cleanText.replace(/y/g, 'i');
  const advisors = list.filter(emp => {
    const cargoLower = (emp.cargo || '').toLowerCase();
    return cargoLower.includes('asesor') || cargoLower.includes('vendedor') || cargoLower.includes('caj') || cargoLower.includes('bodeg');
  });
  for (const emp of advisors) {
    const empNombres = emp.nombres.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(' ').filter(w => w.length >= 2);
    const empApellidos = emp.apellidos.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(' ').filter(w => w.length >= 2);
    const hasName = empNombres.some(name => cleanText.includes(name) || cleanTextY.includes(name.replace(/y/g, 'i')));
    const hasLastName = empApellidos.some(lastName => cleanText.includes(lastName) || cleanTextY.includes(lastName.replace(/y/g, 'i')));
    if (hasName && hasLastName) return emp;
  }
  return null;
};

async function parse() {
  const data = new Uint8Array(fs.readFileSync('C:/Users/User/Desktop/venta_22-06-2026.pdf'));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  
  let allAssessors = [];
  let pdfDayIndex = 22;
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items;
    
    const rowsMap = new Map();
    items.forEach(item => {
      if (!item.str.trim()) return;
      const y = item.transform[5];
      let foundY = null;
      for (const key of rowsMap.keys()) {
        if (Math.abs(key - y) < 1.5) { foundY = key; break; }
      }
      if (foundY !== null) rowsMap.get(foundY).push(item);
      else rowsMap.set(y, [item]);
    });
    
    for (const [y, rowItems] of rowsMap.entries()) {
      rowItems.sort((a, b) => a.transform[4] - b.transform[4]);
      const cedulaItem = rowItems.find(item => /^\d{9,10}$/.test(item.str.trim()));
      
      let cedula = "";
      let nameText = "";
      let afterCedula = [];
      let systemEmp = null;
      
      if (cedulaItem) {
        cedula = cedulaItem.str.trim();
        if (cedula.length === 9) cedula = "0" + cedula;
        const cedulaIndex = rowItems.indexOf(cedulaItem);
        nameText = rowItems.slice(0, cedulaIndex).map(item => item.str).join(' ').trim();
        afterCedula = rowItems.slice(cedulaIndex + 1).map(item => item.str.trim()).filter(str => str !== "$" && str !== "");
        systemEmp = dbEmpleados.find(emp => String(emp.cedula).trim() === String(cedula).trim());
      } else {
        const firstStatsIndex = rowItems.findIndex(item => /^[-+$\d#%]/.test(item.str.trim()) || item.str.trim() === '-$');
        if (firstStatsIndex > 0) {
          nameText = rowItems.slice(0, firstStatsIndex).map(item => item.str).join(' ').trim();
          afterCedula = rowItems.slice(firstStatsIndex).map(item => item.str.trim()).filter(str => str !== "$" && str !== "");
          systemEmp = matchAdvisorByName(nameText, dbEmpleados);
          if (systemEmp) cedula = systemEmp.cedula;
        }
      }
      
      if (systemEmp && cedula) {
        if (afterCedula.length >= 10) {
          const ventaDiaVal = parseFloat(afterCedula[0].replace(/,/g, '')) || 0;
          const vtaPromedioVal = parseFloat(afterCedula[1].replace(/,/g, '')) || 0;
          const facturasVal = parseFloat(afterCedula[2].replace(/,/g, '')) || 0;
          const facturasHoraVal = parseFloat(afterCedula[3].replace(/,/g, '')) || 0;
          const cumplimientoFechaVal = parseFloat(afterCedula[4].replace(/%/g, '')) || 0;
          const diferenciaFechaVal = parseFloat(afterCedula[5].replace(/,/g, '')) || 0;
          const metaMensualVal = parseFloat(afterCedula[8].replace(/,/g, '')) || 0;
          const acumVentasVal = parseFloat(afterCedula[9].replace(/,/g, '')) || 0;
          
          allAssessors.push({
            name: `${systemEmp.nombres} ${systemEmp.apellidos}`,
            cedula,
            ventaDia: ventaDiaVal,
            vtaPromedio: vtaPromedioVal,
            facturas: facturasVal,
            facturasHora: facturasHoraVal,
            cumplimientoFecha: cumplimientoFechaVal,
            diferenciaFecha: diferenciaFechaVal,
            metaMensual: metaMensualVal,
            acumVentas: acumVentasVal,
            conversion: 72.47,
            systemEmp
          });
        }
      }
    }
  }
  
  const parsedMetas = allAssessors.map(adv => {
    const existingAdv = teamMetas.find(m => m.cedula === adv.cedula);
    const metaMensual = adv.metaMensual > 0 ? adv.metaMensual : ((existingAdv && existingAdv.meta_mensual > 0) ? existingAdv.meta_mensual : 0);
    const metaSemanal = metaMensual > 0 ? parseFloat((metaMensual / 4.0).toFixed(2)) : ((existingAdv && existingAdv.meta_semanal > 0) ? existingAdv.meta_semanal : 0);
    const metaDiaria = metaSemanal > 0 ? parseFloat((metaSemanal / 6.0).toFixed(2)) : ((existingAdv && existingAdv.meta_diaria > 0) ? existingAdv.meta_diaria : 0);
    
    return {
      cedula: adv.cedula,
      name: adv.name,
      metaMensualParsed: adv.metaMensual,
      metaMensualFinal: metaMensual,
      metaSemanalFinal: metaSemanal,
      metaDiariaFinal: metaDiaria,
      acumVentasParsed: adv.acumVentas
    };
  });
  
  console.log(JSON.stringify(parsedMetas, null, 2));
}

parse().catch(console.error);
