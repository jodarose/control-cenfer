-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enum de roles
create type role as enum (
  'super_admin',
  'sst',
  'recepcion',
  'empresa',
  'portero',
  'persona'
);

-- Tabla profiles (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  apellido text not null,
  telefono text,
  rol role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger updated_at automático
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- RLS profiles
alter table profiles enable row level security;

create policy "profiles_select_self_or_admin"
  on profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.rol = 'super_admin'
    )
  );

create policy "profiles_insert_self"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_self_or_admin"
  on profiles for update
  using (
    auth.uid() = id
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.rol = 'super_admin'
    )
  );

-- Función helper: obtener rol del usuario actual
create or replace function current_user_role()
returns role
language sql
stable
as $$
  select rol from profiles where id = auth.uid();
$$;
