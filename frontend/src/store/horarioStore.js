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
        map[`${t.empleado_cedula}_${t.fecha}`] = t;
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
      const startDayStr = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDayNum = new Date(y, m, 0).getDate();
      const endDayStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

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
      const { data, error } = await supabase
        .from('turnos')
        .upsert({
          empleado_cedula: turno.empleado_cedula,
          fecha: turno.fecha,
          tipo_turno: turno.tipo_turno,
          hora_inicio: turno.hora_inicio || '00:00',
          hora_fin: turno.hora_fin || '00:00',
          creado_por: turno.creado_por || 'Sistema'
        }, {
          onConflict: 'empleado_cedula,fecha'
        })
        .select();

      if (error) throw error;

      const savedTurno = data && data[0] ? data[0] : turno;
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

  saveTurnosMasivos: async (turnosArray, targetYear = null, targetMonth = null, zonesDetected = null) => {
    set({ saving: true, error: null });
    try {
      if (!turnosArray || turnosArray.length === 0) {
        set({ saving: false });
        return { success: true, count: 0 };
      }

      // 1. Limpiar campos que no estén en la base de datos de turnos
      const cleanTurnos = turnosArray.map(t => ({
        empleado_cedula: t.empleado_cedula,
        fecha: t.fecha,
        tipo_turno: t.tipo_turno || 'Descanso',
        hora_inicio: t.hora_inicio || '00:00',
        hora_fin: t.hora_fin || '00:00',
        creado_por: t.creado_por || '1714768486'
      }));

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
          await supabase
            .from('empleados')
            .update({ zona })
            .eq('cedula', cedula);
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

  addEmpleado: async (empleado) => {
    set({ saving: true, error: null });
    try {
      const selectedTiendaStr = sessionStorage.getItem('portal_selected_tienda');
      let defaultTiendaId = '7b1c4e92-3a8f-4d6e-9b2c-1f5e8d4a7c3b';
      if (selectedTiendaStr) {
        defaultTiendaId = JSON.parse(selectedTiendaStr).id;
      }

      const { data, error } = await supabase
        .from('empleados')
        .insert({
          tienda_id: empleado.tienda_id || defaultTiendaId,
          ...empleado,
          activo: true,
          debe_cambiar_password: false,
          intentos_fallidos: 0,
          bloqueado: false
        })
        .select();

      if (error) throw error;
      await get().fetchEmpleados();
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
      const { data, error } = await supabase
        .from('empleados')
        .update(empleado)
        .eq('cedula', empleado.cedula)
        .select();

      if (error) throw error;
      await get().fetchEmpleados();
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
