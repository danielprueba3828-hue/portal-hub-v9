const XLSX = require('xlsx');
const fs = require('fs');

// We need to parse PDF. Since we are in Node, let's mock pdfjs-dist or read the text file that we know.
// Wait, we can use pdfjs-dist in Node if installed. Is pdfjs-dist in package.json?
// Yes, dependencies: "pdfjs-dist": "^6.0.227".
// But loading pdfjs-dist in node can sometimes be tricky. Let's write a script that uses pdfjs-dist and parses the PDF!
// Let's write it in CommonJS format.

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Mock a fake list of employees to match names
const empleados = [
  { cedula: "0931982136", nombres: "KERLY", apellidos: "ROSADO", cargo: "Asesor de Ventas", activo: true },
  { cedula: "1724158850", nombres: "LEONARDO", apellidos: "POSLIGUA", cargo: "Asesor de Ventas", activo: true },
  { cedula: "1755859038", nombres: "VALENTINA", apellidos: "MONTANO", cargo: "Asesor de Ventas", activo: true },
  { cedula: "1727839142", nombres: "WILSON", apellidos: "ARMIJOS", cargo: "Asesor de Ventas", activo: true },
  { cedula: "1729461796", nombres: "ELIANE", apellidos: "HERRERA", cargo: "Asesor de Ventas", activo: true },
  { cedula: "1753997376", nombres: "LUIS", apellidos: "CARRION", cargo: "Asesor de Ventas", activo: true },
  { cedula: "0803422948", nombres: "PAOLA", apellidos: "BRAVO", cargo: "Asesor de Ventas", activo: true },
  { cedula: "1310559917", nombres: "ANGEL", apellidos: "VELASQUEZ", cargo: "Asesor de Ventas", activo: true },
  { cedula: "1714768486", nombres: "GUSTAVO", apellidos: "VALENZUELA", cargo: "Asesor de Ventas", activo: true },
  { cedula: "1726889456", nombres: "JULEXI", apellidos: "ROBINZON", cargo: "Asesor de Ventas", activo: true }
];

const storeStats = {
  ticketPromedio: 112.82,
  facturas: 1528,
  conversion: 72.47,
  metaDiariaTienda: 3800.00,
  metaSemanalTienda: 26600.00,
  totalVentaLograda: 0,
  ventaTienda: 0,
  trafico: 1500,
  dailyGoals: null
};

const matchAdvisorByName = (rowText, empleadosList) => {
  const cleanText = rowText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanTextY = cleanText.replace(/y/g, 'i');
  const advisors = empleadosList.filter(emp => emp.cargo === 'Asesor de Ventas');
  for (const emp of advisors) {
    const empNombres = emp.nombres.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(' ').filter(w => w.length > 2);
    const empApellidos = emp.apellidos.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(' ').filter(w => w.length > 2);

    const hasName = empNombres.some(name => {
      const nameClean = name.replace(/y/g, 'i');
      return cleanText.includes(name) || cleanTextY.includes(nameClean);
    });

    const hasLastName = empApellidos.some(lastName => {
      const lastNameClean = lastName.replace(/y/g, 'i');
      return cleanText.includes(lastName) || cleanTextY.includes(lastNameClean);
    });

    if (hasName && hasLastName) {
      return emp;
    }
  }
  return null;
};

const parsePdf = async (pdfPath) => {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;

  let allAssessors = [];
  let pdfDayIndex = null;

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

    const rowsMap = new Map();
    items.forEach(item => {
      if (!item.str.trim()) return;
      const y = item.transform[5];
      let foundY = null;
      for (const key of rowsMap.keys()) {
        if (Math.abs(key - y) < 1.5) {
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

    for (const [y, rowItems] of rowsMap.entries()) {
      rowItems.sort((a, b) => a.transform[4] - b.transform[4]);

      const cedulaItem = rowItems.find(item => /^\d{9,10}$/.test(item.str.trim()));

      let cedula = "";
      let name = "";
      let afterCedula = [];
      let systemEmp = null;

      if (cedulaItem) {
        cedula = cedulaItem.str.trim();
        if (cedula.length === 9) {
          cedula = "0" + cedula;
        }

        const cedulaIndex = rowItems.indexOf(cedulaItem);
        if (cedulaIndex > 0) {
          const nameItem = rowItems[cedulaIndex - 1];
          name = nameItem.str.trim();
          afterCedula = rowItems.slice(cedulaIndex + 1)
            .map(item => item.str.trim())
            .filter(str => str !== "$" && str !== "");

          systemEmp = empleados.find(emp => String(emp.cedula).trim() === String(cedula).trim());
        }
      } else {
        const nameText = rowItems.map(item => item.str).join(' ').trim();
        systemEmp = matchAdvisorByName(nameText, empleados);
        if (systemEmp) {
          cedula = systemEmp.cedula;
          name = `${systemEmp.nombres} ${systemEmp.apellidos}`;
          afterCedula = rowItems.map(item => item.str.trim()).filter(str => str !== "$" && str !== "");
          // Filter out name words from afterCedula
          const nameWords = nameText.split(' ').map(w => w.toLowerCase().trim());
          afterCedula = afterCedula.filter(str => {
            const cleanStr = str.toLowerCase().trim();
            return !nameWords.includes(cleanStr) && cleanStr !== "total" && cleanStr !== "categorizacion" && cleanStr !== "zona" && cleanStr !== "hombre" && cleanStr !== "mujer";
          });
        }
      }

      if (systemEmp && cedula) {
        if (systemEmp.cargo !== 'Asesor de Ventas') {
          continue;
        }

        if (afterCedula.length >= 10) {
          try {
            const ventaDiaVal = parseFloat(afterCedula[0].replace(/,/g, '')) || 0;
            const vtaPromedioVal = parseFloat(afterCedula[1].replace(/,/g, '')) || 0;
            const facturasVal = parseFloat(afterCedula[2].replace(/,/g, '')) || 0;
            const facturasHoraVal = parseFloat(afterCedula[3].replace(/,/g, '')) || 0;
            const cumplimientoFechaVal = parseFloat(afterCedula[4].replace(/%/g, '')) || 0;
            const diferenciaFechaVal = parseFloat(afterCedula[5].replace(/,/g, '')) || 0;
            const metaMensualVal = parseFloat(afterCedula[8].replace(/,/g, '')) || 0;
            const acumVentasVal = parseFloat(afterCedula[9].replace(/,/g, '')) || 0;

            allAssessors.push({
              name,
              cedula,
              ventaDia: ventaDiaVal,
              vtaPromedio: vtaPromedioVal,
              facturas: facturasVal,
              facturasHora: facturasHoraVal,
              cumplimientoFecha: cumplimientoFechaVal,
              diferenciaFecha: diferenciaFechaVal,
              metaMensual: metaMensualVal,
              acumVentas: acumVentasVal
            });
          } catch (err) {
            console.warn(`Error parsing row values for ${name}:`, err);
          }
        }
      }
    }
  }

  console.log(`Parsed day index: ${pdfDayIndex}`);
  console.log("Assessors found:", allAssessors.length);
  
  let totalFacturas = 0;
  let totalVentaLograda = 0;
  allAssessors.forEach(a => {
    console.log(`Adv ${a.cedula} (${a.name}): VtaDia=${a.ventaDia}, Facturas=${a.facturas}, AcumVentas=${a.acumVentas}`);
    totalFacturas += a.facturas;
    totalVentaLograda += a.acumVentas;
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

  if (allAssessors.length > 0) {
    shopStats.totalVentaLograda = parseFloat(totalVentaLograda.toFixed(2));
    shopStats.ventaTienda = parseFloat(totalVentaLograda.toFixed(2));
    if (totalFacturas > 0) {
      shopStats.facturas = totalFacturas;
      shopStats.ticketPromedio = parseFloat((totalVentaLograda / totalFacturas).toFixed(2));
    }
    shopStats.metaDiariaTienda = storeStats.metaDiariaTienda || 3800.00;
    shopStats.metaSemanalTienda = storeStats.metaSemanalTienda || 26600.00;
    shopStats.dailyGoals = storeStats.dailyGoals || null;
    shopStats.trafico = shopStats.conversion > 0 ? Math.round(shopStats.facturas / (shopStats.conversion / 100)) : 1500;
  }

  console.log("\nShopStats:");
  console.log(shopStats);
};

parsePdf('C:/Users/User/Desktop/venta_19-06-2026.pdf')
  .catch(console.error);
