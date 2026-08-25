global.localStorage = {
  getItem: (key) => null,
  setItem: (key, val) => {},
  removeItem: (key) => {}
};

async function run() {
  const { supabaseMock } = await import('./lib/supabaseMock.js');
  const { data: empleados } = await supabaseMock.from('empleados').select('*');
  const { data: metas } = await supabaseMock.from('metas').select('*');
  
  console.log('Mock empleados length:', empleados ? empleados.length : 'null');
  console.log('Mock metas length:', metas ? metas.length : 'null');
  
  if (metas && empleados) {
    metas.forEach(m => {
      const emp = empleados.find(e => e.cedula === m.cedula);
      console.log(`Meta Cedula: ${m.cedula} -> Emp Found: ${emp ? emp.nombres + ' ' + emp.apellidos : 'NOT FOUND'}`);
    });
  }
}

run();
