import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import crypto from 'crypto';

// Paths
const excelPath = 'C:\\Users\\User\\Desktop\\Personal MCP1 2026.xlsx';
const mockPath = 'C:\\Users\\User\\.gemini\\antigravity\\scratch\\pagina horarios mcp1\\frontend\\src\\lib\\supabaseMock.js';
const sqlPath = 'C:\\Users\\User\\.gemini\\antigravity\\scratch\\pagina horarios mcp1\\seed_personal.sql';

const genderMap = {
  "ANGEL CASIMIRO VELASQUEZ DELGADO": "Hombre",
  "JOSE DANIEL LUNA ENRIQUEZ": "Hombre",
  "ANTONY STIVEN GAONA JIMENEZ": "Hombre",
  "SAMANTHA DENISSE VERA MORA": "Mujer",
  "LAYLA VALENTINA MONTANO HURTADO": "Mujer",
  "ALAIN CRUZ CEVALLOS": "Hombre",
  "KERLY MELISA ROSADO SANCHEZ": "Mujer",
  "WILSON OMAR ARMIJOS MORETA": "Hombre",
  "JOSE LEONARDO POSLIGUA MOLINA": "Hombre",
  "BRAYAN STIK NIETO RAMIREZ": "Hombre",
  "JOSE GUSTAVO VALENZUELA TARAPUES": "Hombre",
  "GENESIS DARLYN CHISCUET JIMENEZ": "Mujer",
  "SEGUNDO RAMIRO TENORIO TOAPANTA": "Hombre",
  "LUIS RENE CARRION CAJAMARCA": "Hombre",
  "SHANIA FIORELLA FELIX VILLEGAS": "Mujer",
  "ELIANE FERNANDO HERRERA CORREA": "Hombre",
  "PAOLA ESTEFANIE BRAVO FARIAS": "Mujer",
  "PABLO JULIÁN FLORES ARMAS": "Hombre",
  "JULEXY ANAIS ROBINZON VALENCIA": "Mujer"
};

const monthsMap = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12'
};

function parseSpanishDateToISO(str) {
  if (!str) return '2026-01-01';
  const clean = str.toLowerCase().replace(/de/g, '').trim().split(/\s+/);
  if (clean.length >= 2) {
    const day = clean[0].padStart(2, '0');
    const monthName = clean[1];
    const month = monthsMap[monthName] || '01';
    return `2026-${month}-${day}`;
  }
  return '2026-01-01';
}

function splitFullName(fullName) {
  const parts = fullName.trim().toUpperCase().split(/\s+/);
  if (parts.length === 4) {
    return { nombres: parts[0] + ' ' + parts[1], apellidos: parts[2] + ' ' + parts[3] };
  } else if (parts.length === 3) {
    return { nombres: parts[0], apellidos: parts[1] + ' ' + parts[2] };
  } else if (parts.length === 2) {
    return { nombres: parts[0], apellidos: parts[1] };
  } else {
    return { nombres: parts[0] || '', apellidos: parts.slice(1).join(' ') };
  }
}

function excelDateToISO(serial) {
  if (!serial) return "2026-01-01";
  const date = new Date((serial - 25569) * 86400 * 1000);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function mapCargoAndRol(cargoExcel, cargo1Excel) {
  const c = (cargoExcel || '').trim().toLowerCase();
  const c1 = (cargo1Excel || '').trim().toLowerCase();

  let cargo = 'Asesor de Ventas';
  let rol = 'empleado';

  if (c.includes('jefe') || c1.includes('jefe')) {
    cargo = 'Jefe de Tienda';
    rol = 'admin';
  } else if (c.includes('subjefe') || c1.includes('subjefe')) {
    cargo = 'Subjefe de Tienda';
    rol = 'supervisor';
  } else if (c.includes('tercer') || c1.includes('tercer')) {
    cargo = 'Tercero a bordo';
    rol = 'empleado';
  } else if (c.includes('bodeguero') || c1.includes('bodeguero')) {
    cargo = 'Bodeguero';
  } else if (c.includes('cajero') || c1.includes('cajer')) {
    cargo = 'Cajero';
  } else if (c.includes('operativo') || c1.includes('operativo')) {
    cargo = 'Asistente Operativo';
  } else if (c.includes('asesor') || c1.includes('asesor')) {
    cargo = 'Asesor de Ventas';
  }

  return { cargo, rol };
}

function normalizeCedula(val) {
  if (!val) return '';
  let s = String(val).replace(/\s+/g, '').replace(/\./g, '');
  if (s.length === 9) s = '0' + s;
  return s;
}

function normalizePhone(val) {
  if (!val) return '';
  let s = String(val).replace(/\s+/g, '');
  if (s.length === 9 && s.startsWith('9')) s = '0' + s;
  return s;
}

try {
  // 1. Read existing supabaseMock.js to parse existing SEED_DATA.empleados
  console.log('Loading supabaseMock.js...');
  const mockContent = fs.readFileSync(mockPath, 'utf8');
  
  // Find start and end of employees array
  const empStartIndex = mockContent.indexOf('  empleados: [');
  if (empStartIndex === -1) {
    throw new Error('Could not find employees array start in mock file.');
  }
  const arrayStart = empStartIndex + '  empleados: '.length;
  
  // Find next key which is "turnos:"
  const turnosIndex = mockContent.indexOf('  turnos: [');
  if (turnosIndex === -1) {
    throw new Error('Could not find turnos array start in mock file.');
  }
  
  // Find closing bracket before turnos
  const endBracketIndex = mockContent.lastIndexOf('],', turnosIndex);
  if (endBracketIndex === -1 || endBracketIndex < arrayStart) {
    throw new Error('Could not find employees array end bracket.');
  }
  
  const employeesArrayText = mockContent.substring(arrayStart, endBracketIndex + 1);
  
  // Filter out unwanted employees (Luis Peralta and Pablo Mock) from existing mock data
  const existingEmployees = JSON.parse(employeesArrayText).filter(e => 
    e.cedula !== '2450019076' && e.cedula !== '1700000001'
  );
  console.log(`Loaded ${existingEmployees.length} existing mock employees.`);

  // 2. Read excel file
  console.log(`Reading excel file from ${excelPath}...`);
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const excelData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  console.log(`Excel file contains ${excelData.length} records.`);

  // 3. Process records
  const updatedEmployeesMap = new Map();
  const addedCid = [];
  const updatedCid = [];

  // Parse Excel records
  for (const row of excelData) {
    const fullName = String(row['Nombre y Apellido'] || '').trim();
    if (!fullName) continue;

    const rawCedula = row['cedula'] || row['CI.'];
    const cedula = normalizeCedula(rawCedula);
    if (!cedula) {
      console.warn(`Warning: No cedula found for ${fullName}. Skipping.`);
      continue;
    }

    // Ignore Luis Peralta or Pablo Mock if they are in Excel (they shouldn't be, but just in case)
    if (cedula === '2450019076' || cedula === '1700000001') {
      continue;
    }

    const email = String(row['Correo'] || '').trim().toLowerCase();
    const phone = normalizePhone(row['telefono de contacto']);
    
    let birthday = '2026-01-01';
    const excelBday = row['cumpleaños'];
    if (typeof excelBday === 'number') {
      birthday = excelDateToISO(excelBday);
    } else if (excelBday) {
      const bdayStr = String(excelBday).trim();
      if (bdayStr.includes(' de ')) {
        birthday = parseSpanishDateToISO(bdayStr);
      } else {
        birthday = bdayStr;
      }
    }

    const cargoRaw = row['Cargo'] || '';
    const cargo1Raw = row['Cargo_1'] || '';
    let { cargo, rol } = mapCargoAndRol(cargoRaw, cargo1Raw);

    // Override to preserve Genesis Darlyn Chiscuet Jimenez as Tercero a bordo
    if (cedula === '1753544103') {
      cargo = 'Tercero a bordo';
      rol = 'empleado';
    }

    const { nombres, apellidos } = splitFullName(fullName);
    const genero = genderMap[fullName] || (fullName.endsWith('A') ? 'Mujer' : 'Hombre');

    // Check if employee already exists
    const existing = existingEmployees.find(e => e.cedula === cedula);
    let emp = {};

    if (existing) {
      emp = {
        ...existing,
        nombres,
        apellidos,
        email: email || existing.email,
        telefono: phone || existing.telefono,
        telefono_urgencia: phone || existing.telefono_urgencia || phone,
        cumpleanos: birthday,
        cargo,
        rol,
        activo: true,
        genero,
        password_hash: existing.password_hash || cedula
      };
      updatedCid.push(cedula);
    } else {
      // New employee
      const id = crypto.randomUUID();
      emp = {
        id,
        cedula,
        nombres,
        apellidos,
        email: email || `${nombres.toLowerCase().replace(/\s+/g, '')}@marathon.ec`,
        telefono: phone || '0999999999',
        telefono_urgencia: phone || '0999999999',
        cumpleanos: birthday,
        cargo,
        fecha_ingreso: '2024-01-01',
        rol,
        activo: true,
        debe_cambiar_password: false,
        intentos_fallidos: 0,
        bloqueado: false,
        password_hash: cedula,
        genero
      };
      addedCid.push(cedula);
    }

    updatedEmployeesMap.set(cedula, emp);
  }

  // 4. Merge other users that are NOT in the excel (like active supervisor accounts)
  const preservedCid = [];
  for (const ext of existingEmployees) {
    // Exclude unwanted employees completely
    if (ext.cedula === '2450019076' || ext.cedula === '1700000001') {
      continue;
    }

    if (!updatedEmployeesMap.has(ext.cedula)) {
      if (ext.rol === 'supervisor' || ext.rol === 'admin' || ext.cedula === 'sup_mcp1') {
        // Keep active supervisor or admin active
        const adminOrSupervisor = { ...ext, activo: true };
        updatedEmployeesMap.set(ext.cedula, adminOrSupervisor);
        preservedCid.push(ext.cedula);
      } else {
        // Deactivate other non-present mock users
        const deactivated = { ...ext, activo: false };
        updatedEmployeesMap.set(ext.cedula, deactivated);
      }
    }
  }

  const finalEmployees = Array.from(updatedEmployeesMap.values());
  console.log(`Final processed employees count: ${finalEmployees.length}`);
  console.log(`- Added: ${addedCid.length}`);
  console.log(`- Updated: ${updatedCid.length}`);
  console.log(`- Preserved Admins/Supervisors: ${preservedCid.length}`);

  // 5. Update supabaseMock.js
  const formattedEmployeesText = JSON.stringify(finalEmployees, null, 2);
  const newMockContent = 
    mockContent.substring(0, arrayStart) + 
    formattedEmployeesText + 
    mockContent.substring(endBracketIndex + 1);

  fs.writeFileSync(mockPath, newMockContent, 'utf8');
  console.log('Successfully updated supabaseMock.js!');

  // 6. Generate seed_personal.sql
  console.log('Generating seed_personal.sql...');
  let sqlContent = `-- =========================================================================\n`;
  sqlContent += `-- SCRIPT DE INYECCIÓN Y ACTUALIZACIÓN DE PERSONAL (MCP1 2026)\n`;
  sqlContent += `-- Ejecuta esto en el SQL Editor de tu consola de Supabase.\n`;
  sqlContent += `-- =========================================================================\n\n`;

  sqlContent += `-- 1. DATOS SEMILLA PARA TIENDA (tienda_stats)\n`;
  sqlContent += `INSERT INTO public.tienda_stats (\n`;
  sqlContent += `  id, ticket_promedio, facturas, conversion, meta_diaria_tienda, \n`;
  sqlContent += `  meta_semanal_tienda, total_venta_lograda, venta_tienda, trafico\n`;
  sqlContent += `) VALUES (\n`;
  sqlContent += `  1, 112.82, 1528, 72.47, 3800.00, 22800.00, 0.00, 172388.96, 2108.46\n`;
  sqlContent += `) ON CONFLICT (id) DO NOTHING;\n\n`;

  sqlContent += `-- 2. REGISTRO DE COLABORADORES (empleados)\n`;
  for (const emp of finalEmployees) {
    sqlContent += `INSERT INTO public.empleados (\n`;
    sqlContent += `  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, \n`;
    sqlContent += `  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, \n`;
    sqlContent += `  intentos_fallidos, bloqueado, password_hash, genero\n`;
    sqlContent += `) VALUES (\n`;
    sqlContent += `  '${emp.id}', '${emp.cedula}', '${emp.nombres}', '${emp.apellidos}', '${emp.email}', \n`;
    sqlContent += `  '${emp.telefono}', '${emp.telefono_urgencia}', ${emp.cumpleanos ? `'${emp.cumpleanos}'` : 'NULL'}, '${emp.cargo}', \n`;
    sqlContent += `  '${emp.fecha_ingreso}', '${emp.rol}', ${emp.activo}, ${emp.debe_cambiar_password}, \n`;
    sqlContent += `  ${emp.intentos_fallidos}, ${emp.bloqueado}, '${emp.password_hash}', '${emp.genero}'\n`;
    sqlContent += `) ON CONFLICT (cedula) DO UPDATE SET\n`;
    sqlContent += `  nombres = EXCLUDED.nombres,\n`;
    sqlContent += `  apellidos = EXCLUDED.apellidos,\n`;
    sqlContent += `  email = EXCLUDED.email,\n`;
    sqlContent += `  telefono = EXCLUDED.telefono,\n`;
    sqlContent += `  telefono_urgencia = EXCLUDED.telefono_urgencia,\n`;
    sqlContent += `  cumpleanos = EXCLUDED.cumpleanos,\n`;
    sqlContent += `  cargo = EXCLUDED.cargo,\n`;
    sqlContent += `  rol = EXCLUDED.rol,\n`;
    sqlContent += `  activo = EXCLUDED.activo,\n`;
    sqlContent += `  genero = EXCLUDED.genero;\n\n`;
  }

  fs.writeFileSync(sqlPath, sqlContent, 'utf8');
  
  // Copy to Desktop folder too
  const desktopSqlPath = 'C:\\Users\\User\\Desktop\\pagina horarios mcp1\\seed_personal.sql';
  fs.writeFileSync(desktopSqlPath, sqlContent, 'utf8');
  console.log('Successfully generated seed_personal.sql!');

} catch (err) {
  console.error('CRITICAL ERROR:', err);
  process.exit(1);
}
