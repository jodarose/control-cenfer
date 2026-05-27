create type access_event_type as enum ('entrada', 'salida');
create type access_event_method as enum ('cedula', 'qr', 'manual');

create table access_events (
  id uuid primary key default uuid_generate_v4(),
  request_person_id uuid not null references request_people(id) on delete restrict,
  tipo access_event_type not null,
  portero_id uuid references auth.users(id),
  porteria_id uuid not null references porterias(id),
  metodo access_event_method not null default 'manual',
  created_at timestamptz not null default now()
);

create index access_events_created_porteria_idx on access_events(created_at, porteria_id);
create index access_events_request_person_idx on access_events(request_person_id, created_at);

alter table access_events enable row level security;

create policy "access_events_select_internal"
  on access_events for select
  using (current_user_role() in ('super_admin', 'sst', 'recepcion', 'portero'));

create policy "access_events_select_own_company"
  on access_events for select
  using (
    exists (
      select 1 from request_people rp
      join access_requests ar on ar.id = rp.access_request_id
      join company_users cu on cu.company_id = ar.company_id
      where rp.id = access_events.request_person_id
        and cu.user_id = auth.uid()
    )
  );

create policy "access_events_insert_portero"
  on access_events for insert
  with check (current_user_role() in ('super_admin', 'recepcion', 'portero'));

-- RPC: validar credencial por cédula o QR y registrar evento
create or replace function porteria_validate_and_log(
  p_lookup_value text,
  p_lookup_type text,
  p_porteria_id uuid,
  p_tipo access_event_type,
  p_dry_run boolean default false
)
returns table (
  ok boolean,
  motivo text,
  request_person_id uuid,
  person_id uuid,
  cedula text,
  nombre text,
  apellido text,
  foto_url text,
  company_razon_social text,
  activity_nombre text,
  area_nombre text,
  fecha_desde date,
  fecha_hasta date,
  horario_inicio time,
  horario_fin time,
  ultimo_evento access_event_type,
  event_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role role;
  v_rp request_people%rowtype;
  v_ar access_requests%rowtype;
  v_p people%rowtype;
  v_c companies%rowtype;
  v_a activities%rowtype;
  v_area areas%rowtype;
  v_last_event access_event_type;
  v_now_time time;
  v_today date;
  v_event_id uuid;
  v_motivo text;
  v_method access_event_method;
begin
  v_role := current_user_role();
  if v_role not in ('super_admin', 'sst', 'recepcion', 'portero') then
    raise exception 'No autorizado';
  end if;

  if p_lookup_type = 'qr' then
    select * into v_rp from request_people where qr_code = p_lookup_value;
    v_method := 'qr';
  elsif p_lookup_type = 'cedula' then
    select rp.* into v_rp
    from request_people rp
    join people p on p.id = rp.person_id
    join access_requests ar on ar.id = rp.access_request_id
    where p.cedula = p_lookup_value
      and ar.estado in ('aprobada', 'vigente')
      and ar.fecha_desde <= current_date
      and ar.fecha_hasta >= current_date
    order by rp.created_at desc
    limit 1;
    v_method := 'cedula';
  else
    raise exception 'p_lookup_type inválido (debe ser cedula o qr)';
  end if;

  if not found then
    return query select false, 'no_encontrado'::text,
      null::uuid, null::uuid, null::text, null::text, null::text, null::text,
      null::text, null::text, null::text,
      null::date, null::date, null::time, null::time,
      null::access_event_type, null::uuid;
    return;
  end if;

  select * into v_ar from access_requests where id = v_rp.access_request_id;
  select * into v_p from people where id = v_rp.person_id;
  select * into v_c from companies where id = v_ar.company_id;
  select * into v_a from activities where id = v_ar.activity_id;
  if v_ar.area_id is not null then
    select * into v_area from areas where id = v_ar.area_id;
  end if;

  v_today := current_date;
  v_now_time := current_time;

  if v_rp.estado_individual <> 'aprobada' then
    v_motivo := 'persona_no_aprobada';
  elsif v_ar.estado not in ('aprobada', 'vigente') then
    v_motivo := 'solicitud_no_vigente';
  elsif v_today < v_ar.fecha_desde then
    v_motivo := 'fuera_rango_fechas_anterior';
  elsif v_today > v_ar.fecha_hasta then
    v_motivo := 'fuera_rango_fechas_posterior';
  elsif v_rp.qr_expires_at is not null and v_rp.qr_expires_at < now() then
    v_motivo := 'credencial_vencida';
  elsif v_now_time < v_ar.horario_inicio or v_now_time > v_ar.horario_fin then
    v_motivo := 'fuera_horario';
  else
    v_motivo := null;
  end if;

  select tipo into v_last_event
  from access_events
  where request_person_id = v_rp.id
  order by created_at desc
  limit 1;

  if v_motivo is null and v_last_event = p_tipo then
    v_motivo := case
      when p_tipo = 'entrada' then 'ya_dentro'
      else 'ya_fuera'
    end;
  end if;

  if v_motivo is not null then
    return query select false, v_motivo,
      v_rp.id, v_p.id, v_p.cedula, v_p.nombre, v_p.apellido, v_p.foto_url,
      v_c.razon_social, v_a.nombre, v_area.nombre,
      v_ar.fecha_desde, v_ar.fecha_hasta, v_ar.horario_inicio, v_ar.horario_fin,
      v_last_event, null::uuid;
    return;
  end if;

  if not p_dry_run then
    insert into access_events (request_person_id, tipo, portero_id, porteria_id, metodo)
    values (v_rp.id, p_tipo, auth.uid(), p_porteria_id, v_method)
    returning id into v_event_id;
  end if;

  return query select true, null::text,
    v_rp.id, v_p.id, v_p.cedula, v_p.nombre, v_p.apellido, v_p.foto_url,
    v_c.razon_social, v_a.nombre, v_area.nombre,
    v_ar.fecha_desde, v_ar.fecha_hasta, v_ar.horario_inicio, v_ar.horario_fin,
    p_tipo, v_event_id;
end;
$$;

grant execute on function porteria_validate_and_log(text, text, uuid, access_event_type, boolean) to authenticated;
