/**
 * Simulador de Supabase utilizando LocalStorage
 * Permite ejecutar la aplicación al 100% de manera local y offline.
 */
import seedCleanData from './seed_clean_data.json';
import seedMetas from '../services/seed_metas_agosto.json';

const OFFICIAL_CEDULAS = new Set(seedCleanData.empleados.map(e => e.cedula));

const SEED_DATA = {
  empleados: seedCleanData.empleados,
  turnos: seedCleanData.turnos,
  metas: seedMetas,
  solicitudes: [],
  bitacoras_jefes: [],
  reportes_bodega: [],
  notificaciones: [],
  tiendas: [
    {
      id: "7b1c4e92-3a8f-4d6e-9b2c-1f5e8d4a7c3b",
      nombre: "Marathon Sports - Portal Shopping",
      ciudad: "Quito",
      direccion: "Av. Simón Bolívar y Panamericana Norte",
      activo: true
    }
  ],
  tienda_stats: [
    {
      id: "1",
      tienda_id: "7b1c4e92-3a8f-4d6e-9b2c-1f5e8d4a7c3b",
      ticket_promedio: 112.82,
      facturas: 1528,
      conversion: 72.47,
      meta_diaria_tienda: 6848.00,
      meta_semanal_tienda: 74875.00,
      total_venta_lograda: 0.00,
      venta_tienda: 326079.00,
      trafico: 2108
    }
  ],
  preguntas_ninebox: [
    { id: "p1", seccion: "desempeno", pregunta: "Cumplimiento de metas", active: true },
    { id: "p2", seccion: "desempeno", pregunta: "Evaluación conductual", active: true },
    { id: "p3", seccion: "desempeno", pregunta: "Elementos clave de liderazgo", active: true },
    { id: "p4", seccion: "desempeno", pregunta: "Oportunidades de mejora", active: true },
    { id: "p5", seccion: "conocimientos", pregunta: "¿Cómo me siento?", active: true },
    { id: "p6", seccion: "conocimientos", pregunta: "¿Qué espero o necesito?", active: true },
    { id: "p7", seccion: "conocimientos", pregunta: "¿A qué me comprometo?", active: true }
  ],
  evaluaciones_ninebox: []
};

// Inicializar base de datos local y purgar registros obsoletos
const initDb = () => {
  const currentDb = localStorage.getItem('marathon_db');
  if (!currentDb) {
    localStorage.setItem('marathon_db', JSON.stringify(SEED_DATA));
    return;
  }
  try {
    const db = JSON.parse(currentDb);
    if (!db || !Array.isArray(db.empleados) || !Array.isArray(db.turnos)) {
      localStorage.setItem('marathon_db', JSON.stringify(SEED_DATA));
      return;
    }

    // Purgar empleados obsoletos o sincronizar cuando cambie el seed de turnos/empleados
    const hasObsolete = db.empleados.some(e => !OFFICIAL_CEDULAS.has(e.cedula));
    const santiagoTurnosOld = db.turnos.some(t => t.empleado_cedula === "1761707502");
    const turnosCountDiffers = db.turnos.length !== SEED_DATA.turnos.length;

    if (hasObsolete || santiagoTurnosOld || db.empleados.length !== SEED_DATA.empleados.length || turnosCountDiffers) {
      db.empleados = SEED_DATA.empleados;
      db.turnos = SEED_DATA.turnos;
      db.metas = SEED_DATA.metas;
      localStorage.setItem('marathon_db', JSON.stringify(db));
      console.log("marathon_db: Base local purgada y sincronizada con los datos oficiales.");
    }
  } catch (e) {
    localStorage.setItem('marathon_db', JSON.stringify(SEED_DATA));
  }
};
initDb();

const getDb = () => {
  try {
    const db = JSON.parse(localStorage.getItem('marathon_db'));
    if (db && Array.isArray(db.empleados) && Array.isArray(db.turnos)) {
      return db;
    }
  } catch (e) {}
  localStorage.setItem('marathon_db', JSON.stringify(SEED_DATA));
  return SEED_DATA;
};

const saveDb = (db) => {
  localStorage.setItem('marathon_db', JSON.stringify(db));
};

export const supabaseMock = {
  auth: {
    getUser: async () => {
      const u = localStorage.getItem('marathon_auth_user');
      return { data: { user: u ? JSON.parse(u) : null }, error: null };
    },
    getSession: async () => {
      const u = localStorage.getItem('marathon_auth_user');
      return { data: { session: u ? { user: JSON.parse(u) } : null }, error: null };
    },
    signInWithPassword: async ({ email, password }) => {
      const db = getDb();
      const user = db.empleados.find(e => 
        (e.email?.toLowerCase() === email?.toLowerCase() || e.cedula === email || e.cedula === password) &&
        (e.password_hash === password || e.cedula === password) &&
        e.activo
      );
      if (!user) {
        return { data: null, error: { message: 'Credenciales inválidas o usuario inactivo.' } };
      }
      localStorage.setItem('marathon_auth_user', JSON.stringify(user));
      return { data: { user }, error: null };
    },
    signOut: async () => {
      localStorage.removeItem('marathon_auth_user');
      return { error: null };
    },
    onAuthStateChange: (callback) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },

  storage: {
    from: (bucket) => ({
      upload: async (path, fileData, options = {}) => {
        return { data: { path }, error: null };
      },
      getPublicUrl: (path) => ({
        data: { publicUrl: `https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800` }
      })
    })
  },

  from: (table) => {
    let db = getDb();
    if (!db[table]) {
      db[table] = [];
      saveDb(db);
    }
    let queryData = [...(db[table] || [])];

    const builder = {
      select: (columns = '*') => builder,
      eq: (field, value) => {
        queryData = queryData.filter(row => String(row[field]) === String(value));
        return builder;
      },
      neq: (field, value) => {
        queryData = queryData.filter(row => String(row[field]) !== String(value));
        return builder;
      },
      gt: (field, value) => {
        queryData = queryData.filter(row => row[field] > value);
        return builder;
      },
      gte: (field, value) => {
        queryData = queryData.filter(row => row[field] >= value);
        return builder;
      },
      lt: (field, value) => {
        queryData = queryData.filter(row => row[field] < value);
        return builder;
      },
      lte: (field, value) => {
        queryData = queryData.filter(row => row[field] <= value);
        return builder;
      },
      in: (field, values = []) => {
        const valSet = new Set((values || []).map(v => String(v)));
        queryData = queryData.filter(row => valSet.has(String(row[field])));
        return builder;
      },
      order: (field, { ascending = true } = {}) => {
        queryData = [...queryData].sort((a, b) => {
          if (a[field] < b[field]) return ascending ? -1 : 1;
          if (a[field] > b[field]) return ascending ? 1 : -1;
          return 0;
        });
        return builder;
      },
      limit: (count) => {
        if (typeof count === 'number' && count >= 0) {
          queryData = queryData.slice(0, count);
        }
        return builder;
      },
      range: (from, to) => {
        queryData = queryData.slice(from, to + 1);
        return builder;
      },
      match: (obj) => {
        Object.entries(obj || {}).forEach(([k, v]) => {
          queryData = queryData.filter(row => String(row[k]) === String(v));
        });
        return builder;
      },
      maybeSingle: () => {
        return Promise.resolve({ data: queryData.length > 0 ? queryData[0] : null, error: null });
      },
      single: () => {
        if (queryData.length === 0) {
          return Promise.resolve({ data: null, error: { message: 'Row not found' } });
        }
        return Promise.resolve({ data: queryData[0], error: null });
      },
      insert: async (dataToInsert) => {
        const items = Array.isArray(dataToInsert) ? dataToInsert : [dataToInsert];
        const newItems = items.map(item => ({
          id: item.id || `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: item.created_at || new Date().toISOString(),
          ...item
        }));
        db = getDb();
        if (!db[table]) db[table] = [];
        db[table] = [...db[table], ...newItems];
        saveDb(db);
        return { data: newItems, error: null, select: () => Promise.resolve({ data: newItems, error: null }) };
      },
      upsert: async (dataToUpsert, { onConflict = 'id' } = {}) => {
        const items = Array.isArray(dataToUpsert) ? dataToUpsert : [dataToUpsert];
        db = getDb();
        if (!db[table]) db[table] = [];

        items.forEach(newItem => {
          const conflictFields = onConflict.split(',').map(f => f.trim());
          const matchIdx = db[table].findIndex(row => 
            conflictFields.every(f => String(row[f] ?? '') === String(newItem[f] ?? ''))
          );
          if (matchIdx >= 0) {
            db[table][matchIdx] = { ...db[table][matchIdx], ...newItem, updated_at: new Date().toISOString() };
          } else {
            db[table].push({
              id: newItem.id || `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString(),
              ...newItem
            });
          }
        });
        saveDb(db);
        return { data: items, error: null, select: () => Promise.resolve({ data: items, error: null }) };
      },
      update: (updates) => {
        const updateBuilder = {
          eq: (field, value) => {
            db = getDb();
            if (db[table]) {
              db[table] = db[table].map(row => {
                if (String(row[field]) === String(value)) {
                  return { ...row, ...updates, updated_at: new Date().toISOString() };
                }
                return row;
              });
              saveDb(db);
            }
            return Promise.resolve({ data: updates, error: null });
          },
          neq: (field, value) => {
            db = getDb();
            if (db[table]) {
              db[table] = db[table].map(row => {
                if (String(row[field]) !== String(value)) {
                  return { ...row, ...updates, updated_at: new Date().toISOString() };
                }
                return row;
              });
              saveDb(db);
            }
            return Promise.resolve({ data: updates, error: null });
          },
          then: (onSuccess, onError) => Promise.resolve({ data: updates, error: null }).then(onSuccess, onError)
        };
        return updateBuilder;
      },
      delete: () => {
        const deleteBuilder = {
          eq: (field, value) => {
            db = getDb();
            if (db[table]) {
              db[table] = db[table].filter(row => String(row[field]) !== String(value));
              saveDb(db);
            }
            return Promise.resolve({ data: [], error: null });
          },
          then: (onSuccess, onError) => Promise.resolve({ data: [], error: null }).then(onSuccess, onError)
        };
        return deleteBuilder;
      },
      then: (onSuccess, onError) => {
        return Promise.resolve({ data: queryData, error: null }).then(onSuccess, onError);
      }
    };

    return builder;
  },

  channel: (channelName) => {
    const mockChannel = {
      on: (event, filter, callback) => mockChannel,
      subscribe: (callback) => {
        if (callback) callback('SUBSCRIBED');
        return mockChannel;
      },
      unsubscribe: () => {}
    };
    return mockChannel;
  },

  removeChannel: (channel) => Promise.resolve({ error: null })
};
