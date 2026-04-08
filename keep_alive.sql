-- ==============================================================================
-- SUPABASE KEEP-ALIVE (Solución Interna via pg_cron)
-- ==============================================================================
-- Este script activa una tarea automática DENTRO de Supabase que hace una
-- consulta simple cada 5 días. Esto evita que el proyecto se pause.
-- ==============================================================================

-- 1. Habilitar la extensión pg_cron (si no está activa)
-- Nota: Esto debe hacerse en la pestaña "Database" -> "Extensions" o vía SQL.
create extension if not exists pg_cron;

-- 2. Limpiar tareas anteriores de despertador para evitar duplicados
select cron.unschedule('keep-alive-task') 
where exists (select 1 from cron.job where jobname = 'keep-alive-task');

-- 3. Programar la tarea de despertador
-- Se ejecuta cada 5 días a las 00:00 (medianoche)
select cron.schedule(
    'keep-alive-task',
    '0 0 */5 * *',
    $$
    -- Una consulta simple que genera actividad en la base de datos
    select count(*) from instituciones;
    $$
);

-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Ve al panel de Supabase (https://supabase.com/dashboard).
-- 2. Entra en tu proyecto y ve a "SQL Editor".
-- 3. Pega este código y haz clic en "Run".
-- 4. ¡Listo! Tu base de datos se mantendrá viva sola.
-- ==============================================================================
