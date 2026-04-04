import { createClient } from '@supabase/supabase-js';

// Acceso estándar de Vite a variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación diagnóstica para Vercel y Local
if (import.meta.env.PROD) {
    if (!supabaseUrl || !supabaseKey) {
        console.error("🚨 ERROR DE CONFIGURACIÓN: Faltan variables de entorno en Vercel (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY).");
    }
}

// Inicialización del cliente
export const supabase = (supabaseUrl && supabaseKey && supabaseKey.startsWith('eyJ'))
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
    const errorMsg = "⚠️ MODO OFFLINE: Supabase no está configurado correctamente.";
    console.warn(errorMsg);
    
    // Solo mostrar alerta en navegador si estamos en producción y falta la llave
    if (import.meta.env.PROD && typeof window !== 'undefined') {
        console.error("Verifica las Environment Variables en el dashboard de Vercel.");
    }
}
