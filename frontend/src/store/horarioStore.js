import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { formatLocalDateStr } from '../services/scheduleEngine';

export const useHorarioStore = create((set, get) => ({
  empleados: [],
  turnos: [],
  turnosMap: {},
  solicitudes: [],
  logAccesos: [],
  logAuditoria: [],
  loading: false,
  saving: false,
  error: null,

  activeYear: new Date().getFullYear(),
  activeMonth: new Date().getMonth() + 1,
  selectedDate: formatLocalDateStr(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),

  setActivePeriod: (year, month) => {
    set({ activeYear: year, activeMonth: month });
  },

  setSelectedDate: (dateStr) => {
    set({ selectedDate: dateStr });
  },

  _indexTurnos: (turnosList) => {
    const map = {};
    (turnosList || []).forEach(t => {
      if (t.empleado_cedula && t.fecha) {
        const rawCed = String(t.empleado_cedula).trim();
        const paddedCed = (rawCed.length > 0 && rawCed.length < 10) ? rawCed.padStart(10, '0') : rawCed;
        const strippedCed = rawCed.replace(/^0+/, '');

        map[`${rawCed}_${t.fecha}`] = t;
        map[`${paddedCed}_${t.fecha}`] = t;
        if (strippedCed) {
          map[`${strippedCed}_${t.fecha}`] = t;
        }
      }
    });
    return map;
  },

  fetchEmpleados: async (forzarTiendaId = null) => {
    set({ loading: true, error: null });
    try {
      let query = supabase.from('empleados').select('*');
      
      if (forzarTiendaId) {
        if (forzarTiendaId !== 'todos') {
          query = query.eq('tienda_id', forzarTiendaId);
        }
      } else {
        const selectedTiendaStr = sessionStorage.getItem('portal_selected_tienda');
        if (selectedTiendaStr) {
          const tienda = JSON.parse(selectedTiendaStr);
          if (tienda.id) {
            query = query.eq('tienda_id', tienda.id);
          }
        }
      }

      let { data, error } = await query.order('apellidos', { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) {
        const fallbackRes = await supabase.from('empleados').select('*').order('apellidos', { ascending: true });
        data = fallbackRes.data || [];
      }

      const filtered = (data || []).filter(e => e.cedula !== '0000000000');
      set({ empleados: filtered, loading: false });
      return filtered;
    } catch (err) {
      console.error('Error fetching empleados:', err);
      set({ error: err.message, loading: false });
      return [];
    }
  },

  fetchTurnos: async (year = null, month = null) => {
    set({ loading: true, error: null });
    try {
      let empleados = get().empleados;
      if (empleados.length === 0) {
        empleados = await get().fetchEmpleados();
      }

      const y = year || get().activeYear;
      const m = month || get().activeMonth;

      // Calcular ventana amplia de 3 meses para cubrir cualquier cambio y semanas que crucen mes
      const prevM = m === 1 ? 12 : m - 1;
      const prevY = m === 1 ? y - 1 : y;
      const nextM = m === 12 ? 1 : m + 1;
      const nextY = m === 12 ? y + 1 : y;

      const startDayStr = `${prevY}-${String(prevM).padStart(2, '0')}-01`;
      const lastDayNext = new Date(nextY, nextM, 0).getDate();
      const endDayStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(lastDayNext).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('turnos')
        .select('*')
        .gte('fecha', startDayStr)
        .lte('fecha', endDayStr);

      if (error) throw error;

      const turnosData = data || [];
      set({ 
        turnos: turnosData, 
        turnosMap: get()._indexTurnos(turnosData),
        loading: false 
      });
      return turnosData;
    } catch (err) {
      console.error('Error fetching turnos:', err);
      set({ error: err.message, loading: false });
      return [];
    }
  },

  saveTurno: async (turno) => {
    set({ saving: true, error: null });
    try {
      const cleanCed = String(turno.empleado_cedula || '').trim().replace(/[\s.-]/g, '').slice(0, 10);
      let cleanTipo = String(turno.tipo_turno || 'Descanso').trim();
      if (cleanTipo.includes('Apertura') || cleanTipo.includes('M1') || cleanTipo.includes('M2')) cleanTipo = 'Apertura';
      else if (cleanTipo.includes('Intermedio') || cleanTipo.includes('I1') || cleanTipo.includes('I2')) cleanTipo = 'Intermedio';
      else if (cleanTipo.includes('Cierre') || cleanTipo.includes('T1') || cleanTipo.includes('T2') || cleanTipo.includes('Tarde')) cleanTipo = 'Cierre';
      else if (cleanTipo.includes('Descanso')) cleanTipo = 'Descanso';
      else cleanTipo = cleanTipo.slice(0, 10);

      let cleanCreadoPor = String(turno.creado_por || '1714768486').trim().replace(/[\s.-]/g, '');
      if (cleanCreadoPor.length > 10 || cleanCreadoPor === 'Sistema') cleanCreadoPor = '1714768486';

      const payload = {
        empleado_cedula: cleanCed,
        fecha: String(turno.fecha).slice(0, 10),
        tipo_turno: cleanTipo,
        hora_inicio: String(turno.hora_inicio || '00:00').slice(0, 5),
        hora_fin: String(turno.hora_fin || '00:00').slice(0, 5),
        creado_por: cleanCreadoPor.slice(0, 10)
      };

      const { data, error } = await supabase
        .from('turnos')
        .upsert(payload, {
          onConflict: 'empleado_cedula,fecha'
        })
        .select();

      if (error) throw error;

      const savedTurno = data && data[0] ? data[0] : payload;
      const updatedMap = {
        ...get().turnosMap,
        [`${savedTurno.empleado_cedula}_${savedTurno.fecha}`]: savedTurno
      };

      const existingIndex = get().turnos.findIndex(
        t => t.empleado_cedula === savedTurno.empleado_cedula && t.fecha === savedTurno.fecha
      );
      let updatedTurnos;
      if (existingIndex >= 0) {
        updatedTurnos = [...get().turnos];
        updatedTurnos[existingIndex] = savedTurno;
      } else {
        updatedTurnos = [...get().turnos, savedTurno];
      }

      set({
        turnos: updatedTurnos,
        turnosMap: updatedMap,
        saving: false
      });

      return { success: true, data: savedTurno };
    } catch (err) {
      console.error('Error saving turno:', err);
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  saveTurnosBatch: async (turnosArray) => {
    return get().saveTurnosMasivos(turnosArray);
  },

  saveTurnosMasivos: async (turnosArray, targetYear = null, targetMonth = null, zonesDetected = null, weeklyZonesDetected = null, newEmployeesDetected = null) => {
    set({ saving: true, error: null });
    try {
      if (!turnosArray || turnosArray.length === 0) {
        set({ saving: false });
        return { success: true, count: 0 };
      }

      // 0. Si hay colaboradores nuevos detectados en el Excel, agregarlos a la base de datos de forma segura
      if (newEmployeesDetected && newEmployeesDetected.length > 0) {
        for (const newEmp of newEmployeesDetected) {
          const cleanCed = String(newEmp.cedula || '').trim().replace(/[\s.-]/g, '').slice(0, 10);
          if (!cleanCed) continue;
          const { error: insErr } = await supabase
            .from('empleados')
            .upsert({
              cedula: cleanCed,
              nombres: String(newEmp.nombres || 'COLABORADOR').slice(0, 100),
              apellidos: String(newEmp.apellidos || '').slice(0, 100),
              email: String(newEmp.email || `${cleanCed}@marathonsports.ec`).slice(0, 150),
              cargo: String(newEmp.cargo || 'Asesor de Ventas').slice(0, 50),
              zona: String(newEmp.zona || 'CATEGORIZACION').slice(0, 50),
              rol: 'empleado',
              activo: true,
              password_hash: cleanCed,
              tienda_id: '7b1c4e92-3a8f-4d6e-9b2c-1f5e8d4a7c3b'
            }, { onConflict: 'cedula' });
          if (insErr) console.warn('Aviso insertando nuevo empleado:', insErr);
        }
      }

      // 1. Limpiar campos y garantizar longitud estricta compatible con PostgreSQL
      const cleanTurnos = turnosArray.map(t => {
        const cleanCed = String(t.empleado_cedula || '').trim().replace(/[\s.-]/g, '').slice(0, 10);
        let cleanTipo = String(t.tipo_turno || 'Descanso').trim();
        
        // Mapear tipos universales <= 10 caracteres
        if (cleanTipo.includes('Apertura') || cleanTipo.includes('M1') || cleanTipo.includes('M2')) {
          cleanTipo = 'Apertura';
        } else if (cleanTipo.includes('Intermedio') || cleanTipo.includes('I1') || cleanTipo.includes('I2')) {
          cleanTipo = 'Intermedio';
        } else if (cleanTipo.includes('Cierre') || cleanTipo.includes('T1') || cleanTipo.includes('T2') || cleanTipo.includes('Tarde')) {
          cleanTipo = 'Cierre';
        } else if (cleanTipo.includes('Descanso') || cleanTipo.toUpperCase() === 'L' || cleanTipo.toUpperCase() === 'LIBRE') {
          cleanTipo = 'Descanso';
        } else if (cleanTipo.includes('Vacacion') || cleanTipo.includes('Feriado') || cleanTipo.includes('Permiso')) {
          cleanTipo = 'Descanso';
        } else if (cleanTipo === 'Mañana') {
          cleanTipo = 'Mañana';
        } else {
          cleanTipo = cleanTipo.slice(0, 10);
        }

        const cleanInicio = String(t.hora_inicio || '00:00').trim().slice(0, 5);
        const cleanFin = String(t.hora_fin || '00:00').trim().slice(0, 5);
        let cleanCreadoPor = String(t.creado_por || '1714768486').trim().replace(/[\s.-]/g, '');
        if (cleanCreadoPor.length > 10 || cleanCreadoPor === 'importadorexcel' || cleanCreadoPor === 'Sistema') {
          cleanCreadoPor = '1714768486';
        }

        return {
          empleado_cedula: cleanCed,
          fecha: String(t.fecha).slice(0, 10),
          tipo_turno: cleanTipo,
          hora_inicio: cleanInicio,
          hora_fin: cleanFin,
          creado_por: cleanCreadoPor.slice(0, 10)
        };
      });

      // 2. Insertar/Upsert en bloques
      const chunkSize = 100;
      for (let i = 0; i < cleanTurnos.length; i += chunkSize) {
        const chunk = cleanTurnos.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('turnos')
          .upsert(chunk, { onConflict: 'empleado_cedula,fecha' });

        if (error) throw error;
      }

      // 3. Sincronizar zonas de empleados si se detectaron en el archivo
      if (zonesDetected && Object.keys(zonesDetected).length > 0) {
        for (const [cedula, zona] of Object.entries(zonesDetected)) {
          const cleanCed = String(cedula).trim().slice(0, 10);
          const updatePayload = { zona: String(zona).slice(0, 50) };
          if (weeklyZonesDetected && weeklyZonesDetected[cedula]) {
            try {
              const { error: zErr } = await supabase
                .from('empleados')
                .update({ ...updatePayload, zonas_semanales: weeklyZonesDetected[cedula] })
                .eq('cedula', cleanCed);
              if (zErr) {
                await supabase.from('empleados').update(updatePayload).eq('cedula', cleanCed);
              }
            } catch (e) {
              await supabase.from('empleados').update(updatePayload).eq('cedula', cleanCed);
            }
          } else {
            await supabase.from('empleados').update(updatePayload).eq('cedula', cleanCed);
          }
        }
        await get().fetchEmpleados('todos');
      }

      // 4. Refrescar turnos en estado
      await get().fetchTurnos(targetYear, targetMonth);
      set({ saving: false });
      return { success: true, count: cleanTurnos.length };
    } catch (err) {
      console.error('Error in saveTurnosMasivos:', err);
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  deleteTurno: async (cedula, fecha) => {
    set({ saving: true, error: null });
    try {
      const { error } = await supabase
        .from('turnos')
        .delete()
        .eq('empleado_cedula', cedula)
        .eq('fecha', fecha);

      if (error) throw error;

      const key = `${cedula}_${fecha}`;
      const newMap = { ...get().turnosMap };
      delete newMap[key];

      const newTurnos = get().turnos.filter(
        t => !(t.empleado_cedula === cedula && t.fecha === fecha)
      );

      set({
        turnos: newTurnos,
        turnosMap: newMap,
        saving: false
      });

      return { success: true };
    } catch (err) {
      console.error('Error deleting turno:', err);
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  fetchSolicitudes: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*, empleados(nombres, apellidos, cargo)')
        .order('fecha_solicitud', { ascending: false });

      if (error) throw error;
      set({ solicitudes: data || [], loading: false });
      return data || [];
    } catch (err) {
      console.error('Error fetching solicitudes:', err);
      set({ error: err.message, loading: false });
      return [];
    }
  },

  createSolicitud: async (solicitud) => {
    set({ saving: true, error: null });
    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .insert({
          ...solicitud,
          estado: 'Pendiente',
          fecha_solicitud: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      await get().fetchSolicitudes();
      set({ saving: false });
      return { success: true, data };
    } catch (err) {
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  // Alias para retrocompatibilidad
  addSolicitud: async (solicitud) => {
    return get().createSolicitud(solicitud);
  },

  processSolicitud: async (id, estado, comentarioAdmin, procesadoPorCedula) => {
    set({ saving: true, error: null });
    try {
      const { error } = await supabase
        .from('solicitudes')
        .update({
          estado,
          comentario_admin: comentarioAdmin,
          procesado_por: procesadoPorCedula,
          fecha_procesado: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      if (estado === 'Aprobado') {
        const { data: solList } = await supabase.from('solicitudes').select('*').eq('id', id);
        if (solList && solList.length > 0) {
          const sol = solList[0];
          
          if (sol.fecha_inicio) {
            const startParts = sol.fecha_inicio.split('-').map(Number);
            const endParts = (sol.fecha_fin || sol.fecha_inicio).split('-').map(Number);
            
            const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
            const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
            const newTurnos = [];

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              const fStr = formatLocalDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate());
              newTurnos.push({
                empleado_cedula: sol.empleado_cedula,
                fecha: fStr,
                tipo_turno: sol.tipo === 'Vacaciones' ? 'Feriado/Novedad' : 'Descanso',
                hora_inicio: '00:00',
                hora_fin: '00:00',
                creado_por: procesadoPorCedula || 'Supervisor'
              });
            }

            await supabase
              .from('turnos')
              .upsert(newTurnos, { onConflict: 'empleado_cedula,fecha' });
          }
        }
      }

      await get().fetchSolicitudes();
      await get().fetchTurnos();
      set({ saving: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  // Alias en español para retrocompatibilidad
  procesarSolicitud: async (id, estado, comentarioAdmin, procesadoPorCedula) => {
    return get().processSolicitud(id, estado, comentarioAdmin, procesadoPorCedula);
  },

  addEmpleado: async (empleado) => {
    set({ saving: true, error: null });
    try {
      let defaultTiendaId = '7b1c4e92-3a8f-4d6e-9b2c-1f5e8d4a7c3b';
      const selectedTiendaStr = sessionStorage.getItem('portal_selected_tienda');
      if (selectedTiendaStr) {
        defaultTiendaId = JSON.parse(selectedTiendaStr).id;
      }

      const sanitized = { ...empleado };
      if (sanitized.cumpleanos === '') sanitized.cumpleanos = null;
      if (sanitized.fecha_ingreso === '') sanitized.fecha_ingreso = null;

      const { data, error } = await supabase
        .from('empleados')
        .insert({
          tienda_id: sanitized.tienda_id || defaultTiendaId,
          ...sanitized,
          activo: true,
          debe_cambiar_password: false,
          intentos_fallidos: 0,
          bloqueado: false
        })
        .select();

      if (error) throw error;
      await get().fetchEmpleados('todos');
      set({ saving: false });
      return { success: true, data };
    } catch (err) {
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  updateEmpleado: async (empleado) => {
    set({ saving: true, error: null });
    try {
      const sanitized = { ...empleado };
      if (sanitized.cumpleanos === '') sanitized.cumpleanos = null;
      if (sanitized.fecha_ingreso === '') sanitized.fecha_ingreso = null;

      const { data, error } = await supabase
        .from('empleados')
        .update(sanitized)
        .eq('cedula', sanitized.cedula)
        .select();

      if (error) throw error;
      await get().fetchEmpleados('todos');
      set({ saving: false });
      return { success: true, data };
    } catch (err) {
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  updateEmpleadoZona: async (cedula, zona) => {
    set({ saving: true, error: null });
    try {
      const { error } = await supabase
        .from('empleados')
        .update({ zona })
        .eq('cedula', cedula);

      if (error) throw error;
      await get().fetchEmpleados();
      set({ saving: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  bajaEmpleado: async (cedula) => {
    set({ saving: true, error: null });
    try {
      const { error } = await supabase
        .from('empleados')
        .update({ activo: false })
        .eq('cedula', cedula);

      if (error) throw error;
      await get().fetchEmpleados();
      set({ saving: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  activarEmpleado: async (cedula) => {
    set({ saving: true, error: null });
    try {
      const { error } = await supabase
        .from('empleados')
        .update({ activo: true, bloqueado: false, intentos_fallidos: 0 })
        .eq('cedula', cedula);

      if (error) throw error;
      await get().fetchEmpleados();
      set({ saving: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  eliminarEmpleado: async (cedula) => {
    set({ saving: true, error: null });
    try {
      await supabase.from('turnos').delete().eq('empleado_cedula', cedula);
      await supabase.from('solicitudes').delete().eq('empleado_cedula', cedula);
      await supabase.from('metas').delete().eq('cedula', cedula);
      
      const { error } = await supabase
        .from('empleados')
        .delete()
        .eq('cedula', cedula);

      if (error) throw error;
      await get().fetchEmpleados();
      set({ saving: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  desbloquearEmpleado: async (cedula) => {
    set({ saving: true, error: null });
    try {
      const { error } = await supabase
        .from('empleados')
        .update({ bloqueado: false, intentos_fallidos: 0 })
        .eq('cedula', cedula);

      if (error) throw error;
      await get().fetchEmpleados();
      set({ saving: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  },

  resetPasswordEmpleado: async (cedula, nuevaPassword = null) => {
    set({ saving: true, error: null });
    try {
      const pass = nuevaPassword || cedula;
      const { error } = await supabase
        .from('empleados')
        .update({ password_hash: pass, debe_cambiar_password: false, bloqueado: false, intentos_fallidos: 0 })
        .eq('cedula', cedula);

      if (error) throw error;
      await get().fetchEmpleados();
      set({ saving: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, saving: false });
      return { success: false, error: err.message };
    }
  }
}));
