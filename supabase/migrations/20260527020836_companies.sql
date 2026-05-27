create extension if not exists pg_trgm;

create table companies (
  id uuid primary key default uuid_generate_v4(),
  nit text not null unique,
  razon_social text not null,
  contacto_nombre text not null,
  contacto_email text not null,
  contacto_telefono text,
  documentos_legales jsonb not null default '{}'::jsonb,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index companies_nit_idx on companies(nit);
create index companies_razon_social_trgm_idx on companies using gin (razon_social gin_trgm_ops);

create trigger set_companies_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- Vincula auth.users con companies (un usuario "empresa" tiene 1 company)
create table company_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index company_users_company_idx on company_users(company_id);

-- RLS companies
alter table companies enable row level security;

create policy "companies_select_admin_sst_recepcion"
  on companies for select
  using (current_user_role() in ('super_admin', 'sst', 'recepcion'));

create policy "companies_select_own"
  on companies for select
  using (
    exists (
      select 1 from company_users cu
      where cu.user_id = auth.uid() and cu.company_id = companies.id
    )
  );

create policy "companies_write_recepcion_admin"
  on companies for all
  using (current_user_role() in ('super_admin', 'recepcion'));

alter table company_users enable row level security;

create policy "company_users_select_admin"
  on company_users for select
  using (current_user_role() in ('super_admin', 'sst', 'recepcion') or user_id = auth.uid());

create policy "company_users_write_admin"
  on company_users for all
  using (current_user_role() in ('super_admin', 'recepcion'));
