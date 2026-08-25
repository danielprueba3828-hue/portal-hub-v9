import { createClient } from '@supabase/supabase-js';
import { supabaseMock } from './supabaseMock';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Comprobar si hay credenciales válidas y no de marcador
const isRealSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  !supabaseUrl.includes('xyzxyz.supabase.co') &&
  supabaseAnonKey.trim() !== '' &&
  supabaseAnonKey.trim() !== 'tu_anon_key_aqui';

// Activar FORCE_MOCK_MODE = true para forzar el simulador de base de datos en localStorage
// y hacer pruebas locales seguras sin modificar la base de datos real en Supabase.
const FORCE_MOCK_MODE = false;

export const supabase = (isRealSupabaseConfigured && !FORCE_MOCK_MODE)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : supabaseMock;

console.log(
  (isRealSupabaseConfigured && !FORCE_MOCK_MODE)
    ? '🔌 Conectado a la Base de Datos real de Supabase.'
    : FORCE_MOCK_MODE
      ? '💻 MODALIDAD SIMULADOR LOCAL ACTIVADA (Forzado para pruebas seguras en localStorage). Ningún cambio afectará a tu base de datos real.'
      : '💻 Iniciado en MODO SIMULADOR LOCAL (localStorage). Todo funciona al instante sin configurar base de datos externa.'
);
