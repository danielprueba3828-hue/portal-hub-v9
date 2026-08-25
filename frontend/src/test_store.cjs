global.localStorage = {
  getItem: (key) => null,
  setItem: (key, val) => {},
  removeItem: (key) => {}
};

async function run() {
  const { useHorarioStore } = await import('./store/horarioStore.js');
  
  console.log('Initial empleados length:', useHorarioStore.getState().empleados.length);
  
  await useHorarioStore.getState().fetchEmpleados();
  
  console.log('After fetchEmpleados, length:', useHorarioStore.getState().empleados.length);
  console.log('Employees:', useHorarioStore.getState().empleados.map(e => e.cedula + ': ' + e.nombres));
}

run();
