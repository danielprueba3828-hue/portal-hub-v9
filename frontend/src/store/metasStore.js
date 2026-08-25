import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';

export const useMetasStore = create((set, get) => ({
  teamMetas: [],
  storeStats: {
    ticketPromedio: 112.82,
    facturas: 1528,
    conversion: 72.47,
    metaDiariaTienda: 3800.00,
    metaSemanalTienda: null,
    totalVentaLograda: null,
    ventaTienda: 1528 * 112.82,
    trafico: 1528 / (72.47 / 100)
  },
  loading: false,
  error: null,
  hasFetched: false,

  fetchMetas: async () => {
    set({ loading: true, error: null });
    try {
      // 1. Obtener empleados de la tienda seleccionada (o fallback a la tienda asignada al usuario)
      const selectedTiendaStr = sessionStorage.getItem('portal_selected_tienda');
      let tiendaId = null;
      if (selectedTiendaStr) {
        tiendaId = JSON.parse(selectedTiendaStr).id;
      } else {
        const user = useAuthStore?.getState()?.user;
        tiendaId = user?.user_metadata?.tienda_id;
      }

      if (!tiendaId) {
        const user = useAuthStore?.getState()?.user;
        const cedula = user?.user_metadata?.cedula;
        if (cedula) {
          const { data: empData } = await supabase
            .from('empleados')
            .select('tienda_id')
            .eq('cedula', cedula)
            .maybeSingle();
          if (empData) {
            tiendaId = empData.tienda_id;
          }
        }
      }

      let empsQuery = supabase.from('empleados').select('cedula, nombres, apellidos, cargo, tienda_id, activo');
      if (tiendaId) {
        empsQuery = empsQuery.eq('tienda_id', tiendaId);
      }
      
      const empsRes = await empsQuery;
      if (empsRes.error) throw empsRes.error;
      const empsData = empsRes.data || [];

      // Filtrar asesores activos (descartando la meta tienda 0000000000)
      const activeAdvisors = empsData.filter(e => 
        e.activo === true && 
        e.cargo && 
        e.cargo.toLowerCase().includes('asesor') &&
        e.cedula !== '0000000000'
      );
      const activeAdvisorCedulas = activeAdvisors.map(e => e.cedula);

      // 2. Obtener metas solo de los empleados de la tienda seleccionada
      let metasQuery = supabase.from('metas').select('*');
      if (tiendaId) {
        // Traer metas de los asesores activos más la meta global de tienda
        const queryCedulas = [...activeAdvisorCedulas, '0000000000'];
        metasQuery = metasQuery.in('cedula', queryCedulas);
      }
      
      const metasRes = await metasQuery;
      if (metasRes.error) throw metasRes.error;

      const metasData = metasRes.data || [];

      let statsQuery = supabase.from('tienda_stats').select('*');
      if (tiendaId) {
        statsQuery = statsQuery.eq('tienda_id', tiendaId);
      } else {
        statsQuery = statsQuery.eq('tienda_id', '00000000-0000-0000-0000-000000000000');
      }

      const { data: statsData, error: statsError } = await statsQuery.maybeSingle();

      if (statsError) throw statsError;

      let stats = get().storeStats;
      if (statsData) {
        stats = {
          ticketPromedio: parseFloat(statsData.ticket_promedio) || 112.82,
          facturas: parseInt(statsData.facturas) || 1528,
          conversion: parseFloat(statsData.conversion) || 72.47,
          metaDiariaTienda: parseFloat(statsData.meta_diaria_tienda) || 3800.00,
          metaSemanalTienda: statsData.meta_semanal_tienda !== null ? parseFloat(statsData.meta_semanal_tienda) : null,
          totalVentaLograda: statsData.total_venta_lograda !== null ? parseFloat(statsData.total_venta_lograda) : null,
          ventaTienda: parseFloat(statsData.venta_tienda) || (parseInt(statsData.facturas) * parseFloat(statsData.ticket_promedio)) || 0,
          trafico: parseFloat(statsData.trafico) || (parseFloat(statsData.conversion) > 0 ? (parseInt(statsData.facturas) / (parseFloat(statsData.conversion) / 100)) : 1) || 1,
          pdf_url: statsData.pdf_url || localStorage.getItem('marathon_metas_pdf_url') || null
        };
      }

      const capitalize = (str) => {
        if (!str) return '';
        return str
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };

      const storeRecord = metasData.find(m => m.cedula === '0000000000');
      if (storeRecord) {
        stats.dailyGoals = Array.isArray(storeRecord.daily_sales) ? storeRecord.daily_sales : [];
      }

      const createDefaultDailySales = () => {
        const sales = [];
        for (let i = 1; i <= 30; i++) {
          sales.push({ dia: i, goal: 0, monto: 0 });
        }
        return sales;
      };

      const normCedula = (c) => {
        const str = String(c || '').trim();
        if (str.length === 9 && /^\d+$/.test(str)) return '0' + str;
        return str;
      };

      const parsedMetas = activeAdvisors.map(emp => {
        const m = metasData.find(meta => normCedula(meta.cedula) === normCedula(emp.cedula));
        if (m) {
          return {
            cedula: emp.cedula,
            nombres: capitalize(emp.nombres),
            apellidos: capitalize(emp.apellidos),
            meta_mensual: parseFloat(m.meta_mensual) || 0,
            meta_semanal: parseFloat(m.meta_semanal) || 0,
            meta_diaria: parseFloat(m.meta_diaria) || 0,
            meta: parseFloat(m.meta_semanal) || 0,
            acum_ventas: parseFloat(m.acum_ventas) || 0,
            pct: parseInt(m.pct) || 0,
            comentario: m.comentario || '',
            daily_sales: Array.isArray(m.daily_sales) ? m.daily_sales : [],
            ticket_promedio: m.ticket_promedio !== null && m.ticket_promedio !== undefined ? parseFloat(m.ticket_promedio) : null,
            facturas: m.facturas !== null && m.facturas !== undefined ? parseFloat(m.facturas) : null,
            facturas_hora: m.facturas_hora !== null && m.facturas_hora !== undefined ? parseFloat(m.facturas_hora) : null,
            cumplimiento_fecha: m.cumplimiento_fecha !== null && m.cumplimiento_fecha !== undefined ? parseFloat(m.cumplimiento_fecha) : null,
            diferencia_fecha: m.diferencia_fecha !== null && m.diferencia_fecha !== undefined ? parseFloat(m.diferencia_fecha) : null,
            conversion: m.conversion !== null && m.conversion !== undefined ? parseFloat(m.conversion) : null
          };
        } else {
          return {
            cedula: emp.cedula,
            nombres: capitalize(emp.nombres),
            apellidos: capitalize(emp.apellidos),
            meta_mensual: 0,
            meta_semanal: 0,
            meta_diaria: 0,
            meta: 0,
            acum_ventas: 0,
            pct: 0,
            comentario: 'Nuevo asesor de ventas.',
            daily_sales: createDefaultDailySales(),
            ticket_promedio: null,
            facturas: null,
            facturas_hora: null,
            cumplimiento_fecha: null,
            diferencia_fecha: null,
            conversion: null
          };
        }
      });

      // Guardar respaldo local
      localStorage.setItem('marathon_metas_ventas', JSON.stringify(parsedMetas));
      localStorage.setItem('marathon_metas_stats', JSON.stringify(stats));

      set({
        teamMetas: parsedMetas,
        storeStats: stats,
        loading: false,
        hasFetched: true
      });
    } catch (err) {
      console.error('Error al obtener metas de Supabase:', err);
      // Fallback silencioso a localStorage en caso de error
      const saved = localStorage.getItem('marathon_metas_ventas');
      const savedStats = localStorage.getItem('marathon_metas_stats');
      if (saved) {
        set({
          teamMetas: JSON.parse(saved),
          storeStats: savedStats ? JSON.parse(savedStats) : get().storeStats,
          error: err.message,
          loading: false,
          hasFetched: true
        });
      } else {
        set({ error: err.message, loading: false, hasFetched: true });
      }
    }
  },

  // Guardar metas y estadísticas en el estado, localStorage y Supabase
  saveMetasState: async (newMetas, newStats, isImport = false, pdfUrl = null) => {
    const effectivePdfUrl = pdfUrl !== null ? pdfUrl : (newStats?.pdf_url || localStorage.getItem('marathon_metas_pdf_url') || null);
    if (effectivePdfUrl) {
      localStorage.setItem('marathon_metas_pdf_url', effectivePdfUrl);
    }
    const statsToSave = newStats ? { ...newStats, pdf_url: effectivePdfUrl } : null;
    localStorage.setItem('marathon_metas_ventas', JSON.stringify(newMetas));
    if (statsToSave) {
      localStorage.setItem('marathon_metas_stats', JSON.stringify(statsToSave));
      set({ teamMetas: newMetas, storeStats: statsToSave });
    } else {
      set({ teamMetas: newMetas });
    }

    try {
      const selectedTiendaStr = sessionStorage.getItem('portal_selected_tienda');
      let tiendaId = null;
      if (selectedTiendaStr) {
        tiendaId = JSON.parse(selectedTiendaStr).id;
      } else {
        const user = useAuthStore?.getState()?.user;
        tiendaId = user?.user_metadata?.tienda_id;
      }

      if (!tiendaId) {
        const user = useAuthStore?.getState()?.user;
        const cedula = user?.user_metadata?.cedula;
        if (cedula) {
          const { data: empData } = await supabase
            .from('empleados')
            .select('tienda_id')
            .eq('cedula', cedula)
            .maybeSingle();
          if (empData) {
            tiendaId = empData.tienda_id;
          }
        }
      }

      // 1. Guardar metas individuales en Supabase
      if (newMetas && newMetas.length > 0) {

        const dbMetas = newMetas.map(m => {
          const obj = {
            cedula: m.cedula,
            acum_ventas: m.acum_ventas,
            pct: m.pct,
            comentario: m.comentario || '',
            daily_sales: m.daily_sales || [],
            ticket_promedio: (m.ticket_promedio !== null && m.ticket_promedio !== undefined) ? m.ticket_promedio : null,
            facturas: (m.facturas !== null && m.facturas !== undefined) ? m.facturas : null,
            facturas_hora: (m.facturas_hora !== null && m.facturas_hora !== undefined) ? m.facturas_hora : null,
            cumplimiento_fecha: (m.cumplimiento_fecha !== null && m.cumplimiento_fecha !== undefined) ? m.cumplimiento_fecha : null,
            diferencia_fecha: (m.diferencia_fecha !== null && m.diferencia_fecha !== undefined) ? m.diferencia_fecha : null,
            conversion: (m.conversion !== null && m.conversion !== undefined) ? m.conversion : null
          };
          if (isImport) {
            obj.meta_mensual = m.meta_mensual;
            obj.meta_semanal = m.meta_semanal;
            obj.meta_diaria = m.meta_diaria;
          }
          return obj;
        });

        // Upsert dummy store employee to satisfy foreign key constraint
        const dummyEmp = {
          cedula: '0000000000',
          nombres: 'Meta',
          apellidos: 'Tienda',
          email: 'meta_tienda@portal-shopping.ec',
          cargo: 'Asesor de Ventas',
          rol: 'empleado',
          activo: false,
          password_hash: '0000000000',
          debe_cambiar_password: false,
          tienda_id: tiendaId
        };
        await supabase
          .from('empleados')
          .upsert(dummyEmp, { onConflict: 'cedula' });

        if (newStats && newStats.dailyGoals) {
          const storeDummy = {
            cedula: '0000000000',
            acum_ventas: 0,
            pct: 0,
            comentario: 'Metas diarias oficiales de la tienda.',
            daily_sales: newStats.dailyGoals
          };
          if (isImport) {
            storeDummy.meta_mensual = newStats.dailyGoals.reduce((sum, d) => sum + d.monto, 0);
            storeDummy.meta_semanal = newStats.metaSemanalTienda || 0;
            storeDummy.meta_diaria = newStats.metaDiariaTienda || 0;
          }
          dbMetas.push(storeDummy);
        }

        const { error: metasError } = await supabase
          .from('metas')
          .upsert(dbMetas, { onConflict: 'cedula' });

        if (metasError) throw metasError;

        if (isImport) {
          try {
            const notificationPayloads = newMetas
              .filter(m => m.cedula !== '0000000000' && m.cedula !== 'x')
              .map(m => ({
                usuario_cedula: m.cedula,
                titulo: '📈 Nuevas Metas Asignadas',
                mensaje: `Se han publicado tus metas de ventas para esta semana (Meta semanal: $${m.meta_semanal || 0}). ¡Revisa tus objetivos y avance diario!`,
                tipo: 'meta',
                leido: false
              }));
            if (notificationPayloads.length > 0) {
              await supabase.from('notificaciones').insert(notificationPayloads);
            }
          } catch (notifErr) {
            console.error('Error al insertar notificaciones masivas de metas:', notifErr);
          }
        }
      }

      // 2. Guardar estadísticas generales de tienda en Supabase
      if (newStats) {
        if (!tiendaId) throw new Error("No hay tienda seleccionada.");

        const dbStats = {
          tienda_id: tiendaId,
          ticket_promedio: newStats.ticketPromedio,
          facturas: Math.round(newStats.facturas) || 0,
          conversion: newStats.conversion,
          meta_diaria_tienda: newStats.metaDiariaTienda,
          meta_semanal_tienda: newStats.metaSemanalTienda,
          total_venta_lograda: newStats.totalVentaLograda,
          venta_tienda: newStats.ventaTienda,
          trafico: newStats.trafico,
          pdf_url: pdfUrl !== null ? pdfUrl : (newStats.pdf_url || null)
        };

        const { error: statsError } = await supabase
          .from('tienda_stats')
          .upsert(dbStats, { onConflict: 'tienda_id' });

        if (statsError) throw statsError;
      }
      return { success: true };
    } catch (err) {
      console.error('Error al guardar metas en Supabase:', err);
      return { success: false, error: err };
    }
  },

  // Actualizar meta individual de un asesor
  updateMetaIndividual: async (cedula, metaMensual, metaSemanal, metaDiaria, dailyValues, comentario) => {
    const metas = get().teamMetas.map(m => {
      if (m.cedula === cedula) {
        const metaNum = parseFloat(metaMensual) || 0;
        const metaSem = parseFloat(metaSemanal) || 0;
        const metaDia = parseFloat(metaDiaria) || 0;
        
        let updatedDaily = m.daily_sales ? [...m.daily_sales] : [];
        if (Array.isArray(dailyValues)) {
          updatedDaily = dailyValues;
        }

        const newAcum = updatedDaily.reduce((sum, d) => sum + (parseFloat(d.monto) || 0), 0);
        
        const getEcuadorDayIndex = () => {
          try {
            const formatter = new Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil', day: 'numeric' });
            return parseInt(formatter.format(new Date()), 10);
          } catch {
            return new Date().getDate();
          }
        };
        const todayDayIndex = Math.min(30, Math.max(1, getEcuadorDayIndex()));
        const todayAchieved = updatedDaily.find(d => d.dia === todayDayIndex)?.monto || 0;
        const newPct = metaDia > 0 ? Math.round((todayAchieved / metaDia) * 100) : 0;

        return {
          ...m,
          meta_mensual: metaNum,
          meta_semanal: metaSem,
          meta_diaria: metaDia,
          meta: metaSem, // meta_semanal
          acum_ventas: newAcum,
          pct: newPct,
          comentario: comentario !== undefined ? comentario : m.comentario,
          daily_sales: updatedDaily
        };
      }
      return m;
    });

    const currentStats = get().storeStats;
    const saveRes = await get().saveMetasState(metas, currentStats);
    if (saveRes && saveRes.success) {
      try {
        const notifsToInsert = [
          {
            usuario_cedula: cedula,
            titulo: '📈 Meta Individual Actualizada',
            mensaje: `Jefatura ha modificado tus metas de ventas. Meta semanal asignada: $${metaSemanal}.`,
            tipo: 'meta',
            leido: false
          }
        ];

        if (comentario && comentario.trim() !== '') {
          notifsToInsert.push({
            usuario_cedula: cedula,
            titulo: '🎯 Nuevo Coaching de Jefatura',
            mensaje: `Has recibido un nuevo Coaching / Feedback de Jefatura: "${comentario.substring(0, 80)}${comentario.length > 80 ? '...' : ''}". ¡Revisa tus observaciones!`,
            tipo: 'coaching',
            leido: false
          });
        }

        await supabase.from('notificaciones').insert(notifsToInsert);
      } catch (notifErr) {
        console.error('Error al insertar notificación de meta/coaching individual:', notifErr);
      }
    }
  },

  // Actualizar datos generales de la tienda
  updateStoreStats: async (newStats) => {
    const currentStats = get().storeStats;
    const facturas = parseInt(newStats.facturas) || 0;
    
    const ventaTienda = currentStats.ventaTienda || (currentStats.facturas * currentStats.ticketPromedio) || 0;
    const trafico = currentStats.trafico || (currentStats.conversion > 0 ? (currentStats.facturas / (currentStats.conversion / 100)) : 0) || 1;
    
    const ticketPromedio = facturas > 0 ? parseFloat((ventaTienda / facturas).toFixed(2)) : currentStats.ticketPromedio;
    const conversion = trafico > 0 ? parseFloat(((facturas / trafico) * 100).toFixed(2)) : currentStats.conversion;
    
    const updatedStats = {
      ...currentStats,
      ...newStats,
      ticketPromedio,
      conversion,
      ventaTienda,
      trafico
    };
    
    const currentMetas = get().teamMetas;
    await get().saveMetasState(currentMetas, updatedStats);
  }
}));
