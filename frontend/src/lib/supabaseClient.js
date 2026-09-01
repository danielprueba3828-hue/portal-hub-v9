import { createClient } from '@supabase/supabase-js';
import seedData from './seed_clean_data.json';

// Variables de entorno de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vptwhwuzmewtwpbbesgr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdHdod3V6bWV3dHdwYmJlc2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjE0ODcsImV4cCI6MjA1NTczNzQ4N30.8V5JbL4gUu4F4h0fQ5jC8M7eW2_tE5gJ_L6rY3_tY0M';

// Inicialización de cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Semilla de datos locales si la red está desconectada
export async function ensureSeedData() {
  try {
    const { data: emps, error } = await supabase.from('empleados').select('count').limit(1);
    if (!error && emps) {
      console.log('Conexión con Supabase activa.');
      return;
    }
  } catch (e) {
    console.warn('Usando fallback local offline:', e);
  }
}
