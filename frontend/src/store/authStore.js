import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: false,
  error: null,

  // Iniciar Sesión por Cédula o Email
  login: async (cedulaOrEmail, password) => {
    set({ loading: true, error: null });
    try {
      const cleanInput = String(cedulaOrEmail || '').trim();
      const cleanPass = String(password || '').trim();

      if (!cleanInput || !cleanPass) {
        set({ error: "Por favor ingresa usuario y contraseña.", loading: false });
        return false;
      }

      // Buscar por cédula o email
      const { data: empList, error: empErr } = await supabase
        .from('empleados')
        .select('*')
        .or(`cedula.eq.${cleanInput},email.ilike.${cleanInput}`);

      if (empErr) throw empErr;

      if (!empList || empList.length === 0) {
        set({ error: "Usuario o Cédula no registrada en el sistema.", loading: false });
        return false;
      }

      const employee = empList[0];

      if (!employee.activo) {
        set({ error: "Esta cuenta está desactivada. Contacte a su administrador.", loading: false });
        return false;
      }

      if (employee.bloqueado) {
        set({ error: "Esta cuenta está bloqueada. Contacte a su administrador.", loading: false });
        return false;
      }

      // Validar contraseña
      if (employee.password_hash !== cleanPass) {
        const nuevosIntentos = (employee.intentos_fallidos || 0) + 1;
        const estaBloqueado = nuevosIntentos >= 5;
        
        await supabase
          .from('empleados')
          .update({ 
            intentos_fallidos: nuevosIntentos,
            bloqueado: estaBloqueado
          })
          .eq('cedula', employee.cedula);

        await supabase.from('log_accesos').insert({
          cedula: employee.cedula,
          resultado: estaBloqueado ? 'Bloqueado por intentos fallidos' : `Fallo (Intento ${nuevosIntentos})`,
          fecha_hora: new Date().toISOString()
        });

        set({ 
          error: estaBloqueado 
            ? "Cuenta bloqueada tras 5 intentos fallidos. Contacte a su administrador." 
            : "Contraseña incorrecta.", 
          loading: false 
        });
        return false;
      }

      // Login exitoso: Resetear intentos fallidos
      await supabase
        .from('empleados')
        .update({ intentos_fallidos: 0 })
        .eq('cedula', employee.cedula);

      await supabase.from('log_accesos').insert({
        cedula: employee.cedula,
        resultado: 'Exitoso',
        fecha_hora: new Date().toISOString()
      });

      const sessionUser = {
        id: employee.id,
        email: employee.email,
        user_metadata: {
          cedula: employee.cedula,
          nombres: employee.nombres,
          apellidos: employee.apellidos,
          cargo: employee.cargo,
          cargo_anterior: employee.cargo_anterior || null,
          rol: employee.rol,
          zona: employee.zona || null,
          debe_cambiar_password: employee.debe_cambiar_password,
          tienda_id: employee.tienda_id,
          politica_aceptada: employee.politica_aceptada === true
        }
      };

      const session = {
        access_token: `session-token-${employee.id}-${Date.now()}`,
        expires_at: Math.floor(Date.now() / 1000) + 8 * 3600,
        user: sessionUser
      };

      localStorage.setItem('marathon_session', JSON.stringify(session));

      set({
        user: sessionUser,
        session,
        loading: false
      });
      return true;
    } catch (err) {
      console.error('Login error:', err);
      set({ error: err.message || "Error al iniciar sesión.", loading: false });
      return false;
    }
  },

  // Cerrar Sesión
  logout: async () => {
    try {
      localStorage.removeItem('marathon_session');
      sessionStorage.removeItem('portal_selected_tienda');
      set({ user: null, session: null });
    } catch (err) {
      console.error('Logout error:', err);
    }
  },

  // Validar Sesión al Cargar la App
  checkSession: async () => {
    try {
      const stored = localStorage.getItem('marathon_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session.expires_at && session.expires_at * 1000 < Date.now()) {
          get().logout();
          return;
        }

        // Refrescar datos del empleado desde Supabase
        const cedula = session.user?.user_metadata?.cedula;
        if (cedula) {
          const { data: empList } = await supabase
            .from('empleados')
            .select('*')
            .eq('cedula', cedula);

          if (empList && empList.length > 0) {
            const employee = empList[0];
            session.user.user_metadata = {
              ...session.user.user_metadata,
              cedula: employee.cedula,
              nombres: employee.nombres,
              apellidos: employee.apellidos,
              cargo: employee.cargo,
              cargo_anterior: employee.cargo_anterior,
              rol: employee.rol,
              zona: employee.zona,
              tienda_id: employee.tienda_id,
              politica_aceptada: employee.politica_aceptada === true
            };
            localStorage.setItem('marathon_session', JSON.stringify(session));
          }
        }

        set({ user: session.user, session, loading: false });
      }
    } catch (err) {
      console.error('Check session error:', err);
    }
  },

  // Cambiar Contraseña
  changePassword: async (newPassword) => {
    try {
      const { user } = get();
      if (!user) return false;
      const cedula = user.user_metadata.cedula;

      const { error } = await supabase
        .from('empleados')
        .update({
          password_hash: newPassword,
          debe_cambiar_password: false
        })
        .eq('cedula', cedula);

      if (error) throw error;

      // Actualizar sesión local
      const stored = JSON.parse(localStorage.getItem('marathon_session') || '{}');
      if (stored.user) {
        stored.user.user_metadata.debe_cambiar_password = false;
        localStorage.setItem('marathon_session', JSON.stringify(stored));
        set({ user: stored.user, session: stored });
      }
      return true;
    } catch (err) {
      console.error('Change password error:', err);
      return false;
    }
  },

  // Aceptar Políticas de Privacidad y Tratamiento de Datos
  acceptPolicy: async () => {
    try {
      const { user } = get();
      if (!user) return false;
      const cedula = user.user_metadata?.cedula;

      if (cedula) {
        const { error } = await supabase
          .from('empleados')
          .update({
            politica_aceptada: true,
            fecha_politica_aceptada: new Date().toISOString()
          })
          .eq('cedula', cedula);

        if (error) throw error;
      }

      // Actualizar sesión local
      const stored = JSON.parse(localStorage.getItem('marathon_session') || '{}');
      if (stored.user) {
        stored.user.user_metadata = {
          ...stored.user.user_metadata,
          politica_aceptada: true
        };
        localStorage.setItem('marathon_session', JSON.stringify(stored));
        set({ user: stored.user, session: stored });
      }
      return true;
    } catch (err) {
      console.error('Accept policy error:', err);
      return false;
    }
  }
}));
