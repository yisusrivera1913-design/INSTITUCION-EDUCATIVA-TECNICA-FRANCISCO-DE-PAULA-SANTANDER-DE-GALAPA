-- ==============================================================================
-- 🏫 I.E. FRANCISCO DE PAULA SANTANDER - SISTEMA DE CONTROL DE USUARIOS Y ESTADÍSTICAS
-- ==============================================================================
-- Copia y pega TODO este código en el "SQL Editor" de tu proyecto en Supabase.
-- Luego dale al botón "RUN".

-- 1. TABLA DE USUARIOS (Credenciales y Roles)
create table if not exists app_users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password text not null, 
  name text not null,
  role text not null check (role in ('admin', 'docente')),
  created_at timestamptz default now()
);

-- 2. TABLA DE REGISTRO DE ACTIVIDAD DOCENTE
create table if not exists usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  action text not null, -- Ej: "Generó Secuencia"
  timestamp timestamptz default now()
);

-- 3. TABLA DE MONITOREO DE LLAVES API (Global)
create table if not exists api_key_logs (
  id uuid default gen_random_uuid() primary key,
  key_name text not null, -- 'Laura', 'México', 'Yarelis'
  status text not null, -- 'success', 'error'
  action text, -- Ej: "Respuesta de Gemini 2.5 Flash"
  error_message text,
  timestamp timestamptz default now()
);

-- 4. HABILITAR SEGURIDAD (RLS)
alter table app_users enable row level security;
alter table usage_logs enable row level security;
alter table api_key_logs enable row level security;

-- 5. POLÍTICAS DE ACCESO PÚBLICO (Para prototipo rápido)
drop policy if exists "Acceso Total a Usuarios" on app_users;
create policy "Acceso Total a Usuarios" on app_users for all using (true) with check (true);

drop policy if exists "Acceso Total a Logs" on usage_logs;
create policy "Acceso Total a Logs" on usage_logs for all using (true) with check (true);

drop policy if exists "Acceso Total a Api Logs" on api_key_logs;
create policy "Acceso Total a Api Logs" on api_key_logs for all using (true) with check (true);

-- 6. HABILITAR REALTIME (CRÍTICO PARA EL ADMINISTRADOR)
-- Esto permite que el panel de Rector se actualice solo
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table usage_logs;
alter publication supabase_realtime add table api_key_logs;

-- 7. SEMILLA DE DATOS (Usuarios Iniciales)
insert into app_users (email, password, name, role) values
-- Administrador
('admin@santander.edu.co', 'Mw==', 'Admin Santander', 'admin'),

-- Docente Demo
('docente.demo@santander.edu.co', 'Mw==', 'Docente Demo', 'docente');

/* 
   PARA ELIMINAR UN USUARIO:
   DELETE FROM app_users WHERE email = 'correo@santander.edu.co';

   PARA AGREGAR UN USUARIO MANUALMENTE:
   INSERT INTO app_users (email, password, name, role) 
   VALUES ('nombre.apellido@santander.edu.co', 'Mw==', 'Nombre Completo', 'docente');
   
   Nota: 'Mw==' es la contraseña '3' obfuscada (ejemplo base), 
   pero el sistema usa 'santander2026' por defecto para nuevos registros.
*/
on conflict (email) do nothing;

-- 8. TABLA DE SECUENCIAS GENERADAS (Persistencia solicitada)
create table if not exists generated_sequences (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  grado text,
  area text,
  tema text,
  content jsonb not null,
  timestamp timestamptz default now()
);

-- 9. POLÍTICA DE ACCESO PARA SECUENCIAS
drop policy if exists "Acceso Total a Secuencias" on generated_sequences;
create policy "Acceso Total a Secuencias" on generated_sequences for all using (true) with check (true);

-- 10. REALTIME PARA SECUENCIAS
alter publication supabase_realtime add table generated_sequences;
