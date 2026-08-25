// Query Supabase directly to get real employee names
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gkjsnhbczjnljfjvmdoe.supabase.co',
  'sb_publishable_1TLdvss9uF_X31iT5u7GNA_WV9dvBjH'
);

const { data, error } = await supabase
  .from('empleados')
  .select('cedula, nombres, apellidos, cargo, activo')
  .eq('cargo', 'Asesor de Ventas')
  .order('nombres');

if (error) {
  console.error('Error:', error);
} else {
  console.log(`Found ${data.length} Asesores de Ventas:\n`);
  for (const emp of data) {
    const normNombres = emp.nombres.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const normApellidos = emp.apellidos.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    console.log(`  ${emp.activo ? '✅' : '❌'} ${emp.cedula} | ${emp.nombres} ${emp.apellidos} | Normalized: ${normNombres} ${normApellidos}`);
  }
}
