-- Unique constraint required for upsert in person_documents (Postgres doesn't support IF NOT EXISTS on ADD CONSTRAINT)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'person_documents_person_type_unique'
  ) then
    alter table person_documents
      add constraint person_documents_person_type_unique unique (person_id, document_type);
  end if;
end$$;

-- Add a person (or get existing) to a request via public token
create or replace function public_add_person_to_request(
  p_token uuid,
  p_cedula text,
  p_nombre text,
  p_apellido text,
  p_telefono text default null,
  p_email text default null,
  p_cargo text default null
)
returns table (
  request_person_id uuid,
  person_id uuid,
  estado_individual person_request_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request access_requests%rowtype;
  v_person_id uuid;
  v_rp_id uuid;
  v_estado person_request_status;
begin
  select * into v_request
  from access_requests
  where public_token = p_token
    and public_token_expires_at > now()
    and estado in ('enviada', 'en_carga');

  if not found then
    raise exception 'Token inválido o expirado';
  end if;

  -- Upsert person
  insert into people (cedula, nombre, apellido, telefono, email, cargo, company_id)
  values (p_cedula, p_nombre, p_apellido, p_telefono, p_email, p_cargo, v_request.company_id)
  on conflict (cedula) do update set
    nombre = excluded.nombre,
    apellido = excluded.apellido,
    telefono = coalesce(excluded.telefono, people.telefono),
    email = coalesce(excluded.email, people.email),
    cargo = coalesce(excluded.cargo, people.cargo)
  returning id into v_person_id;

  -- Block if person belongs to another company
  perform 1 from people where id = v_person_id and company_id = v_request.company_id;
  if not found then
    raise exception 'Esta cédula está registrada con otra empresa';
  end if;

  -- Upsert request_people
  insert into request_people (access_request_id, person_id)
  values (v_request.id, v_person_id)
  on conflict (access_request_id, person_id) do nothing
  returning id, estado_individual into v_rp_id, v_estado;

  if v_rp_id is null then
    select id, estado_individual into v_rp_id, v_estado
    from request_people
    where access_request_id = v_request.id and person_id = v_person_id;
  end if;

  -- Move request to en_carga if it was enviada
  update access_requests
  set estado = 'en_carga'
  where id = v_request.id and estado = 'enviada';

  return query select v_rp_id, v_person_id, v_estado;
end;
$$;

grant execute on function public_add_person_to_request(uuid, text, text, text, text, text, text) to anon, authenticated;

-- Save a document URL after upload
create or replace function public_save_person_document(
  p_token uuid,
  p_person_id uuid,
  p_document_type document_type_key,
  p_archivo_url text,
  p_fecha_emision date default null,
  p_fecha_vencimiento date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_doc_id uuid;
begin
  -- Validate token + person belongs to this request
  select ar.id into v_request_id
  from access_requests ar
  join request_people rp on rp.access_request_id = ar.id
  where ar.public_token = p_token
    and ar.public_token_expires_at > now()
    and ar.estado in ('enviada', 'en_carga')
    and rp.person_id = p_person_id;

  if not found then
    raise exception 'Token inválido o persona no asociada';
  end if;

  -- Upsert document (one per person+type)
  insert into person_documents (person_id, document_type, archivo_url, fecha_emision, fecha_vencimiento, estado)
  values (p_person_id, p_document_type, p_archivo_url, p_fecha_emision, p_fecha_vencimiento, 'pendiente')
  on conflict (person_id, document_type) do update set
    archivo_url = excluded.archivo_url,
    fecha_emision = excluded.fecha_emision,
    fecha_vencimiento = excluded.fecha_vencimiento,
    estado = 'pendiente',
    revisado_por = null,
    revisado_at = null,
    motivo_rechazo = null
  returning id into v_doc_id;

  return v_doc_id;
end;
$$;

grant execute on function public_save_person_document(uuid, uuid, document_type_key, text, date, date) to anon, authenticated;

-- Submit request to SST review
create or replace function public_submit_request_to_sst(p_token uuid)
returns access_request_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_new_estado access_request_status := 'en_revision_sst';
begin
  select id into v_request_id
  from access_requests
  where public_token = p_token
    and public_token_expires_at > now()
    and estado in ('enviada', 'en_carga');

  if not found then
    raise exception 'Token inválido o expirado';
  end if;

  -- Check at least one person assigned
  perform 1 from request_people where access_request_id = v_request_id limit 1;
  if not found then
    raise exception 'No hay personas asignadas a la solicitud';
  end if;

  -- All people must be at least pendiente_docs (not rechazada)
  perform 1 from request_people
  where access_request_id = v_request_id
    and estado_individual = 'rechazada';
  if found then
    raise exception 'Hay personas rechazadas en la solicitud';
  end if;

  -- Set all en_revision and mark request
  update request_people
  set estado_individual = 'en_revision'
  where access_request_id = v_request_id
    and estado_individual = 'pendiente_docs';

  update access_requests
  set estado = v_new_estado
  where id = v_request_id;

  return v_new_estado;
end;
$$;

grant execute on function public_submit_request_to_sst(uuid) to anon, authenticated;

-- Read people + documents for a request via token (anon-safe view)
create or replace function public_get_request_people(p_token uuid)
returns table (
  request_person_id uuid,
  person_id uuid,
  cedula text,
  nombre text,
  apellido text,
  email text,
  telefono text,
  cargo text,
  estado_individual person_request_status,
  documents jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
begin
  select id into v_request_id
  from access_requests
  where public_token = p_token
    and public_token_expires_at > now()
    and estado in ('enviada', 'en_carga');

  if not found then
    return;
  end if;

  return query
    select
      rp.id,
      p.id,
      p.cedula,
      p.nombre,
      p.apellido,
      p.email,
      p.telefono,
      p.cargo,
      rp.estado_individual,
      coalesce(
        (
          select jsonb_agg(jsonb_build_object(
            'document_type', pd.document_type,
            'estado', pd.estado,
            'fecha_emision', pd.fecha_emision,
            'fecha_vencimiento', pd.fecha_vencimiento,
            'archivo_url', pd.archivo_url
          ))
          from person_documents pd
          where pd.person_id = p.id
        ),
        '[]'::jsonb
      ) as documents
    from request_people rp
    join people p on p.id = rp.person_id
    where rp.access_request_id = v_request_id;
end;
$$;

grant execute on function public_get_request_people(uuid) to anon, authenticated;

-- Full request meta for the public portal
create or replace function public_get_request_full(p_token uuid)
returns table (
  id uuid,
  company_id uuid,
  company_razon_social text,
  activity_id uuid,
  activity_nombre text,
  documentos_requeridos document_type_key[],
  area_nombre text,
  fecha_desde date,
  fecha_hasta date,
  horario_inicio time,
  horario_fin time,
  nivel_riesgo risk_level,
  cantidad_estimada integer,
  observaciones text,
  estado access_request_status,
  public_token_expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    ar.id, ar.company_id, c.razon_social,
    ar.activity_id, a.nombre, a.documentos_requeridos,
    ar2.nombre,
    ar.fecha_desde, ar.fecha_hasta, ar.horario_inicio, ar.horario_fin,
    ar.nivel_riesgo, ar.cantidad_estimada, ar.observaciones, ar.estado,
    ar.public_token_expires_at
  from access_requests ar
  join companies c on c.id = ar.company_id
  join activities a on a.id = ar.activity_id
  left join areas ar2 on ar2.id = ar.area_id
  where ar.public_token = p_token
    and ar.public_token_expires_at > now()
    and ar.estado in ('enviada', 'en_carga');
$$;

grant execute on function public_get_request_full(uuid) to anon, authenticated;
