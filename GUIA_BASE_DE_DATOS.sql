-- ==============================================================================
-- 🚀 EASYPLANNING AI — SaaS MULTI-COLEGIO v3.3 (RECONSTRUCCIÓN TOTAL)
-- SCRIPT DE EMERGENCIA: Limpia TODO y restaura Colegio + Super Admin
-- ==============================================================================

-- ============================================================
-- PASO 0: LIMPIEZA ABSOLUTA (Para arreglar errores de schema)
-- ============================================================
-- DROP TABLE IF EXISTS public.banco_preguntas CASCADE;
-- DROP TABLE IF EXISTS public.generated_sequences CASCADE;
-- DROP TABLE IF EXISTS public.usage_logs CASCADE;
-- DROP TABLE IF EXISTS public.api_key_logs CASCADE;
-- DROP TABLE IF EXISTS public.app_users CASCADE;
-- DROP TABLE IF EXISTS public.instituciones CASCADE;

DROP PUBLICATION IF EXISTS supabase_realtime;

-- ============================================================
-- PASO 1: TABLA INSTITUCIONES (SaaS Core)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.instituciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  slug text UNIQUE NOT NULL,
  nit text,
  municipio text,
  dominio_email text,
  config_visual jsonb DEFAULT '{
    "logo_url": null,
    "color_primario": "#1e40af",
    "codigo_formato": "F-PA-03",
    "modelo_pedagogico": "ADI"
  }'::jsonb,
  plan_suscripcion text DEFAULT 'bronce' CHECK (plan_suscripcion IN ('bronce', 'plata', 'oro')),
  creditos_usados int4 DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 2: USUARIOS (SOPORTE LOCAL + GOOGLE)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password text, -- ¡OJO! Esta columna es vital para el login admin
  name text NOT NULL,
  role text NOT NULL DEFAULT 'docente' CHECK (role IN ('super_admin', 'admin', 'docente')),
  institucion_id uuid REFERENCES instituciones(id) ON DELETE CASCADE,
  assigned_grades text[] DEFAULT '{}',
  assigned_subjects text[] DEFAULT '{}',
  session_id text,
  auth_link_id uuid UNIQUE, -- Para Google Auth
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 3: REPOSITORIOS (Multi-Tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generated_sequences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  institucion_id uuid REFERENCES instituciones(id) ON DELETE CASCADE,
  grado text,
  area text,
  tema text,
  content jsonb NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 4: SEGURIDAD (RLS)
-- ============================================================
ALTER TABLE instituciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_sequences ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas
DROP POLICY IF EXISTS "Instituciones: Lectura Global" ON instituciones;
DROP POLICY IF EXISTS "Usuarios: Autogestión" ON app_users;
DROP POLICY IF EXISTS "Secuencias: Aislamiento Colegios" ON generated_sequences;

-- Políticas de Seguridad SaaS (Aislamiento Estricto)
CREATE POLICY "Instituciones: Lectura Global" ON instituciones FOR SELECT USING (true);

CREATE POLICY "Usuarios: Aislamiento por Colegio" ON app_users FOR ALL USING (
    email = auth.jwt()->>'email' OR 
    (SELECT role FROM app_users WHERE email = auth.jwt()->>'email') IN ('super_admin') OR
    (institucion_id = (SELECT institucion_id FROM app_users WHERE email = auth.jwt()->>'email') AND (SELECT role FROM app_users WHERE email = auth.jwt()->>'email') = 'admin')
);

CREATE POLICY "Secuencias: Aislamiento por Dueño o Admin" ON generated_sequences FOR ALL USING (
    user_email = auth.jwt()->>'email' OR 
    (SELECT role FROM app_users WHERE email = auth.jwt()->>'email') = 'super_admin' OR
    (institucion_id = (SELECT institucion_id FROM app_users WHERE email = auth.jwt()->>'email') AND (SELECT role FROM app_users WHERE email = auth.jwt()->>'email') = 'admin')
);

-- ============================================================
-- PASO 5: RESTAURACIÓN DE TUS DATOS (Santander Galapa + Super Admin)
-- ============================================================

-- 1. Restaurar Colegio Santander Galapa
INSERT INTO instituciones (id, nombre, slug, municipio, dominio_email, plan_suscripcion, config_visual)
VALUES (
  'd1b6a1b6-0b3b-4b1a-9c1a-1a2b3c4d5e6f', 
  'Institución Educativa Técnica Francisco de Paula Santander de Galapa',
  'santander-galapa',
  'Galapa, Atlántico',
  'santander.edu.co',
  'oro',
  '{
    "logo_url": "https://upload.wikimedia.org/wikipedia/commons/b/b0/Escudo_de_Galapa.png",
    "color_primario": "#059669",
    "codigo_formato": "F-PA-03",
    "modelo_pedagogico": "ADI"
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  nombre = EXCLUDED.nombre,
  dominio_email = EXCLUDED.dominio_email,
  config_visual = EXCLUDED.config_visual;

-- 2. Restaurar Super Admin Maestro (TU ACCESO)
INSERT INTO app_users (email, password, name, role, institucion_id)
VALUES (
  'superadmin@eduplaneacion.com',
  'Mw==', -- Contraseña: 3 (ofuscada)
  'Super Admin Maestro',
  'super_admin',
  null
) ON CONFLICT (email) DO UPDATE SET 
  role = 'super_admin',
  password = EXCLUDED.password;

-- 3. Restaurar Admin Santander
INSERT INTO app_users (email, password, name, role, institucion_id)
VALUES (
  'admin@santander.edu.co',
  'Mw==',
  'Admin Santander Galapa',
  'admin',
  'd1b6a1b6-0b3b-4b1a-9c1a-1a2b3c4d5e6f'
) ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  institucion_id = EXCLUDED.institucion_id;

-- Realtime (Ignora si falla porque ya existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE instituciones, generated_sequences;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignorar si ya están añadidas
END $$;

-- ============================================================
-- PASO 6: SINCRONIZACIÓN AUTOMÁTICA Google -> app_users
-- ============================================================

-- Función para manejar nuevos usuarios registrados en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_inst_id uuid;
  v_role text := 'docente';
  v_email text;
  v_name text;
  v_domain text;
BEGIN
  v_email := NEW.email;
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(v_email, '@', 1));
  v_domain := split_part(v_email, '@', 2);

  -- 1. Si es el Super Admin maestro
  IF v_email = 'superadmin@eduplaneacion.com' THEN
    v_role := 'super_admin';
  END IF;

  -- 2. Buscar colegio por dominio del email
  SELECT id INTO v_inst_id FROM public.instituciones WHERE dominio_email = v_domain LIMIT 1;

  -- 3. Insertar o actualizar en app_users
  INSERT INTO public.app_users (id, email, name, role, institucion_id, auth_link_id)
  VALUES (NEW.id, v_email, v_name, v_role, v_inst_id, NEW.id)
  ON CONFLICT (email) DO UPDATE SET
    auth_link_id = EXCLUDED.id,
    name = EXCLUDED.name,
    institucion_id = COALESCE(public.app_users.institucion_id, EXCLUDED.institucion_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función al insertar en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Asegurar que los perfiles existentes tengan su auth_link_id sincronizado si el UUID coincide
UPDATE public.app_users 
SET auth_link_id = id 
WHERE auth_link_id IS NULL;
