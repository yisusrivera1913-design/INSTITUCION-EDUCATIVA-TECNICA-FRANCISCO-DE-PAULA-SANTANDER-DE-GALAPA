-- ==============================================================================
-- 🏫 I.E. GUAIMARAL - SISTEMA DE CONTROL DE USUARIOS Y ESTADÍSTICAS
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
('admin@guaimaral.edu.co', 'Mw==', 'Admin', 'admin'),

-- Guaimaral Bachillerato (Orden Alfabético)
('alex.sanjuan@guaimaral.edu.co', 'Mw==', 'Alex San Juan', 'docente'),
('deisy.arroyo@guaimaral.edu.co', 'Mw==', 'Deisy Arroyo', 'docente'),
('jairo.blanco@guaimaral.edu.co', 'Mw==', 'Jairo Blanco', 'docente'),
('liliana.valle@guaimaral.edu.co', 'Mw==', 'Liliana Valle', 'docente'),
('paula.padilla@guaimaral.edu.co', 'Mw==', 'Paula Padilla', 'docente'),
('rocio.ramirez@guaimaral.edu.co', 'Mw==', 'Rocio Ramírez', 'docente'),

-- Guaimaral Primaria (Orden Alfabético)
('aleida.lara@guaimaral.edu.co', 'Mw==', 'Aleida Lara', 'docente'),
('alfredo.torres@guaimaral.edu.co', 'Mw==', 'Alfredo Torres', 'docente'),
('asterio.torres@guaimaral.edu.co', 'Mw==', 'Asterio Torres', 'docente'),
('carlos.sandoval@guaimaral.edu.co', 'Mw==', 'Carlos Sandoval', 'docente'),
('deisy.mercado@guaimaral.edu.co', 'Mw==', 'Deisy Mercado', 'docente'),
('eduardo@guaimaral.edu.co', 'Mw==', 'Eduardo', 'docente'),
('evaristo.vertel@guaimaral.edu.co', 'Mw==', 'Evaristo Vertel', 'docente'),
('ibeth.charris@guaimaral.edu.co', 'Mw==', 'Ibeth Charris', 'docente'),
('jairo.benavides@guaimaral.edu.co', 'Mw==', 'Jairo Benavides', 'docente'),
('jorge.delahoz@guaimaral.edu.co', 'Mw==', 'Jorge de la Hoz', 'docente'),
('jorge.ferrer@guaimaral.edu.co', 'Mw==', 'Jorge Ferrer', 'docente'),
('leovigilda.navarro@guaimaral.edu.co', 'Mw==', 'Leovigilda Navarro', 'docente'),
('linda.varela@guaimaral.edu.co', 'Mw==', 'Linda Varela', 'docente'),
('martin.celin@guaimaral.edu.co', 'Mw==', 'Martín Celin', 'docente'),
('nancy.vargas@guaimaral.edu.co', 'Mw==', 'Nancy Vargas', 'docente'),
('pedro.arroyo@guaimaral.edu.co', 'Mw==', 'Pedro Arroyo', 'docente'),
('roberto.daza@guaimaral.edu.co', 'Mw==', 'Roberto Daza', 'docente'),
('xilena.santiago@guaimaral.edu.co', 'Mw==', 'Xilena Santiago', 'docente')
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
