import { createClient } from '@supabase/supabase-js';

// Acceso seguro y multiplataforma a variables de entorno
const getEnv = (key: string) => {
    return (import.meta as any).env?.[key] || (typeof process !== 'undefined' ? process.env?.[key] : undefined);
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Validación institucional de conexión
if (supabaseKey && !supabaseKey.startsWith('eyJ')) {
    console.warn("🚨 ALERTA INSTITUCIONAL: La VITE_SUPABASE_ANON_KEY no tiene el formato JWT esperado. Verifica la configuración.");
}

export const supabase = (supabaseUrl && supabaseKey && supabaseKey.startsWith('eyJ'))
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
    console.warn("⚠️ MODO OFFLINE: Supabase no está configurado. Las métricas y el historial se guardarán solo localmente.");
}
