create type access_request_status as enum (
  'borrador', 'enviada', 'en_carga', 'en_revision_sst',
  'aprobada', 'rechazada', 'vigente', 'vencida', 'cancelada'
);

create type person_request_status as enum (
  'pendiente_docs', 'en_revision', 'aprobada', 'rechazada'
);

create type document_status as enum ('pendiente', 'aprobado', 'rechazado');

-- people: una persona física (cédula única)
create table people (
  id uuid primary key default uuid_generate_v4(),
  cedula text not null unique,
  nombre text not null,
  apellido text not null,
  telefono text,
  email text,
  eps text,
  arl text,
  cargo text,
  foto_url text,
  company_id uuid not null references companies(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index people_cedula_idx on people(cedula);
create index people_company_idx on people(company_id);

create trigger set_people_updated_at
  before update on people for each row execute function set_updated_at();

-- access_requests
create table access_requests (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete restrict,
  activity_id uuid not null references activities(id),
  area_id uuid references areas(id),
  fecha_desde date not null,
  fecha_hasta date not null,
  horario_inicio time not null default '06:00',
  horario_fin time not null default '20:00',
  responsable_cenfer_id uuid references auth.users(id),
  nivel_riesgo risk_level not null,
  cantidad_estimada integer not null check (cantidad_estimada > 0),
  observaciones text,
  estado access_request_status not null default 'borrador',
  public_token uuid not null default uuid_generate_v4(),
  public_token_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fecha_hasta >= fecha_desde)
);

create unique index access_requests_token_idx on access_requests(public_token);
create index access_requests_company_idx on access_requests(company_id);
create index access_requests_estado_idx on access_requests(estado);

create trigger set_access_requests_updated_at
  before update on access_requests for each row execute function set_updated_at();

create table request_vehicles (
  id uuid primary key default uuid_generate_v4(),
  access_request_id uuid not null references access_requests(id) on delete cascade,
  placa text not null,
  tipo text not null,
  conductor_person_id uuid references people(id)
);

create table request_tools (
  id uuid primary key default uuid_generate_v4(),
  access_request_id uuid not null references access_requests(id) on delete cascade,
  descripcion text not null,
  cantidad integer not null default 1,
  serial text
);

create table request_misc (
  id uuid primary key default uuid_generate_v4(),
  access_request_id uuid not null references access_requests(id) on delete cascade,
  descripcion text not null
);

create table request_people (
  id uuid primary key default uuid_generate_v4(),
  access_request_id uuid not null references access_requests(id) on delete cascade,
  person_id uuid not null references people(id) on delete restrict,
  estado_individual person_request_status not null default 'pendiente_docs',
  qr_code text unique,
  qr_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (access_request_id, person_id)
);

create table person_documents (
  id uuid primary key default uuid_generate_v4(),
  person_id uuid not null references people(id) on delete cascade,
  document_type document_type_key not null,
  archivo_url text not null,
  fecha_emision date,
  fecha_vencimiento date,
  estado document_status not null default 'pendiente',
  revisado_por uuid references auth.users(id),
  revisado_at timestamptz,
  motivo_rechazo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index person_documents_person_type_idx on person_documents(person_id, document_type);
create index person_documents_vencimiento_idx on person_documents(fecha_vencimiento);

create trigger set_person_documents_updated_at
  before update on person_documents for each row execute function set_updated_at();
