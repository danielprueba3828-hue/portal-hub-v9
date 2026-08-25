import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  fetchNotifications: async (cedula) => {
    if (!cedula) return;
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_cedula', cedula)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      set({ notifications: data || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addNotification: (notif) => {
    set((state) => {
      // Evitar duplicados por ID
      if (state.notifications.some((n) => n.id === notif.id)) return state;
      return { notifications: [notif, ...state.notifications] };
    });
  },

  markAsRead: async (id) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leido: true })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, leido: true } : n
        ),
      }));
    } catch (err) {
      console.error('Error al marcar como leída:', err);
    }
  },

  markAllAsRead: async (cedula) => {
    if (!cedula) return;
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leido: true })
        .eq('usuario_cedula', cedula)
        .eq('leido', false);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, leido: true })),
      }));
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
    }
  },
}));
