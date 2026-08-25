import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useTiendaStore = create((set) => ({
  tiendas: [],
  tiendaSeleccionada: null,
  loading: false,
  error: null,

  // Cargar tiendas filtradas según el rol del usuario
  fetchTiendas: async (user) => {
    set({ loading: true, error: null });
    try {
      if (!user) {
        set({ tiendas: [], loading: false });
        return;
      }
      const rol = user.user_metadata?.rol || 'empleado';

      let tiendasData = [];

      if (rol === 'superadmin' || rol === 'admin' || rol === 'regional_supervisor') {
        // Superadmin, regional_supervisor, o admin ven todas las tiendas
        const { data, error } = await supabase
          .from('tiendas')
          .select('*')
          .order('nombre', { ascending: true });
        if (error) throw error;
        tiendasData = data || [];
      } else if (rol === 'store_supervisor' || rol === 'supervisor') {
        // Supervisor de tienda: ve solo su propia tienda
        const tId = user.user_metadata?.tienda_id;
        if (tId) {
          const { data, error } = await supabase
            .from('tiendas')
            .select('*')
            .eq('id', tId);
          if (error) throw error;
          tiendasData = data || [];
        }
      } else {
        // Empleados: ven solo su propia tienda
        const tId = user.user_metadata?.tienda_id;
        if (tId) {
          const { data, error } = await supabase
            .from('tiendas')
            .select('*')
            .eq('id', tId);
          if (error) throw error;
          tiendasData = data || [];
        }
      }

      set({ tiendas: tiendasData, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // Seleccionar una tienda activa para la sesión
  seleccionarTienda: (tienda) => {
    sessionStorage.setItem('portal_selected_tienda', JSON.stringify(tienda));
    set({ tiendaSeleccionada: tienda });
  },

  // Cargar la tienda activa desde el almacenamiento de sesión
  inicializarTiendaActiva: async (user) => {
    const guardada = sessionStorage.getItem('portal_selected_tienda');
    if (guardada) {
      set({ tiendaSeleccionada: JSON.parse(guardada) });
      return;
    }

    // Si no hay guardada, pero el usuario tiene tienda_id asignada
    if (user && user.user_metadata?.tienda_id) {
      const tId = user.user_metadata.tienda_id;
      try {
        const { data, error } = await supabase
          .from('tiendas')
          .select('*')
          .eq('id', tId)
          .single();
        if (!error && data) {
          sessionStorage.setItem('portal_selected_tienda', JSON.stringify(data));
          set({ tiendaSeleccionada: data });
        }
      } catch (e) {
        console.error("Error al auto-seleccionar tienda:", e);
      }
    }
  },

  // Limpiar la tienda seleccionada (para que el supervisor elija otra)
  limpiarTiendaSeleccionada: () => {
    sessionStorage.removeItem('portal_selected_tienda');
    set({ tiendaSeleccionada: null });
  },

  // Crear una nueva tienda
  crearTienda: async (tiendaData) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tiendas')
        .insert(tiendaData)
        .select()
        .single();

      if (error) throw error;

      // Crear automáticamente estadísticas iniciales para esta tienda nueva
      const { error: statsError } = await supabase
        .from('tienda_stats')
        .insert({
          tienda_id: data.id,
          ticket_promedio: 112.82,
          facturas: 1528,
          conversion: 72.47,
          meta_diaria_tienda: 3800.00,
          meta_semanal_tienda: 26600.00,
          total_venta_lograda: 0.00,
          venta_tienda: 1528 * 112.82,
          trafico: 1528 / (72.47 / 100)
        });

      if (statsError) {
        console.error("Error al crear stats por defecto de la tienda nueva:", statsError);
      }
      
      set(state => ({
        tiendas: [...state.tiendas, data].sort((a, b) => a.nombre.localeCompare(b.nombre)),
        loading: false
      }));
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // Editar una tienda existente
  editarTienda: async (tiendaId, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tiendas')
        .update(updates)
        .eq('id', tiendaId)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        tiendas: state.tiendas.map(t => t.id === tiendaId ? data : t),
        tiendaSeleccionada: state.tiendaSeleccionada?.id === tiendaId ? data : state.tiendaSeleccionada,
        loading: false
      }));
      
      // Si la tienda editada es la que está guardada en sessionStorage, actualizarla
      const saved = sessionStorage.getItem('portal_selected_tienda');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === tiendaId) {
          sessionStorage.setItem('portal_selected_tienda', JSON.stringify(data));
        }
      }

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // Desactivar una tienda (activo = false)
  deactivarTienda: async (tiendaId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tiendas')
        .update({ activo: false })
        .eq('id', tiendaId)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        tiendas: state.tiendas.map(t => t.id === tiendaId ? data : t),
        tiendaSeleccionada: state.tiendaSeleccionada?.id === tiendaId ? null : state.tiendaSeleccionada,
        loading: false
      }));

      // Si la tienda desactivada es la que está guardada en sessionStorage, limpiarla
      const saved = sessionStorage.getItem('portal_selected_tienda');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === tiendaId) {
          sessionStorage.removeItem('portal_selected_tienda');
        }
      }

      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // Eliminar una tienda permanentemente
  borrarTienda: async (tiendaId) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('tiendas')
        .delete()
        .eq('id', tiendaId);

      if (error) throw error;

      set(state => ({
        tiendas: state.tiendas.filter(t => t.id !== tiendaId),
        tiendaSeleccionada: state.tiendaSeleccionada?.id === tiendaId ? null : state.tiendaSeleccionada,
        loading: false
      }));

      // Si la tienda eliminada es la seleccionada, limpiarla de sessionStorage
      const saved = sessionStorage.getItem('portal_selected_tienda');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === tiendaId) {
          sessionStorage.removeItem('portal_selected_tienda');
        }
      }

      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // Obtener los supervisores de una tienda
  fetchSupervisoresTienda: async (tiendaId) => {
    try {
      const { data, error } = await supabase
        .from('supervisor_tiendas')
        .select('supervisor_id')
        .eq('tienda_id', tiendaId);
      if (error) throw error;
      return (data || []).map(r => r.supervisor_id);
    } catch (err) {
      console.error("Error fetching store supervisors:", err);
      return [];
    }
  },

  // Asignar una lista de supervisores a una tienda
  asignarSupervisoresTienda: async (tiendaId, supervisorIds) => {
    try {
      // 1. Eliminar asignaciones existentes para esta tienda
      const { error: delErr } = await supabase
        .from('supervisor_tiendas')
        .delete()
        .eq('tienda_id', tiendaId);
      if (delErr) throw delErr;

      // 2. Insertar las nuevas asignaciones
      if (supervisorIds && supervisorIds.length > 0) {
        const inserts = supervisorIds.map(sid => ({
          tienda_id: tiendaId,
          supervisor_id: sid
        }));
        const { error: insErr } = await supabase
          .from('supervisor_tiendas')
          .insert(inserts);
        if (insErr) throw insErr;
      }
      return true;
    } catch (err) {
      console.error("Error assigning store supervisors:", err);
      return false;
    }
  }
}));
