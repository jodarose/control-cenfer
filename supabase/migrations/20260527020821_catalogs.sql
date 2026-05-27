-- Niveles de riesgo
create type risk_level as enum ('bajo', 'medio', 'alto');

-- Tipos de documento
create type document_type_key as enum (
  'cedula', 'arl', 'eps', 'pila', 'foto',
  'induccion', 'alturas', 'examen_medico'
);

create table document_types (
  key document_type_key primary key,
  nombre text not null,
  requiere_vencimiento boolean not null default true,
  meses_vigencia_default integer,
  created_at timestamptz not null default now()
);

-- Actividades
create table activities (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  nivel_riesgo_default risk_level not null,
  documentos_requeridos document_type_key[] not null default '{}',
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_activities_updated_at
  before update on activities
  for each row execute function set_updated_at();

-- Áreas
create table areas (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  descripcion text,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_areas_updated_at
  before update on areas
  for each row execute function set_updated_at();

-- Porterías
create table porterias (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  ubicacion text,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS: lectura para usuarios autenticados, escritura solo admin
alter table document_types enable row level security;
alter table activities enable row level security;
alter table areas enable row level security;
alter table porterias enable row level security;

create policy "document_types_read_authenticated"
  on document_types for select using (auth.uid() is not null);
create policy "document_types_write_admin"
  on document_types for all using (current_user_role() = 'super_admin');

create policy "activities_read_authenticated"
  on activities for select using (auth.uid() is not null);
create policy "activities_write_admin"
  on activities for all using (current_user_role() = 'super_admin');

create policy "areas_read_authenticated"
  on areas for select using (auth.uid() is not null);
create policy "areas_write_admin"
  on areas for all using (current_user_role() = 'super_admin');

create policy "porterias_read_authenticated"
  on porterias for select using (auth.uid() is not null);
create policy "porterias_write_admin"
  on porterias for all using (current_user_role() = 'super_admin');

-- Seed inicial de document_types
insert into document_types (key, nombre, requiere_vencimiento, meses_vigencia_default) values
  ('cedula', 'Cédula', false, null),
  ('arl', 'ARL', true, 1),
  ('eps', 'EPS', true, 1),
  ('pila', 'Planilla PILA', true, 1),
  ('foto', 'Foto', false, null),
  ('induccion', 'Inducción SST', true, 12),
  ('alturas', 'Curso de alturas', true, 12),
  ('examen_medico', 'Examen médico ocupacional', true, 12);
