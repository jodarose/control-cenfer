-- Trigger: cuando se aprueba/rechaza un documento, refresca el estado de request_people.
-- Si TODOS los documentos requeridos por la actividad están aprobados → 'aprobada'.
-- Si alguno está rechazado → 'rechazada'.

create or replace function refresh_person_request_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rp_rec record;
  required_docs document_type_key[];
  approved_count integer;
  rejected_count integer;
  required_count integer;
  v_person_id uuid;
begin
  v_person_id := coalesce(new.person_id, old.person_id);

  for rp_rec in
    select rp.id, rp.access_request_id, ar.activity_id
    from request_people rp
    join access_requests ar on ar.id = rp.access_request_id
    where rp.person_id = v_person_id
      and ar.estado in ('enviada', 'en_carga', 'en_revision_sst', 'aprobada', 'vigente')
  loop
    select documentos_requeridos into required_docs
    from activities where id = rp_rec.activity_id;

    required_count := coalesce(array_length(required_docs, 1), 0);

    if required_count = 0 then
      continue;
    end if;

    select count(*) into approved_count
    from person_documents pd
    where pd.person_id = v_person_id
      and pd.document_type = any(required_docs)
      and pd.estado = 'aprobado';

    select count(*) into rejected_count
    from person_documents pd
    where pd.person_id = v_person_id
      and pd.document_type = any(required_docs)
      and pd.estado = 'rechazado';

    if rejected_count > 0 then
      update request_people set estado_individual = 'rechazada' where id = rp_rec.id;
    elsif approved_count >= required_count then
      update request_people set estado_individual = 'aprobada' where id = rp_rec.id;
    end if;
  end loop;

  return coalesce(new, old);
end;
$$;

drop trigger if exists refresh_status_after_doc on person_documents;
create trigger refresh_status_after_doc
  after insert or update of estado on person_documents
  for each row execute function refresh_person_request_status();

-- Trigger: cuando una solicitud pasa a 'aprobada' o 'vigente', genera el qr_code para cada persona aprobada.
-- v1: UUID aleatorio (sin HMAC). El QR es no-falsificable por longitud + unicidad en BD.

create or replace function on_request_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado in ('aprobada', 'vigente')
     and (old.estado is null or old.estado not in ('aprobada', 'vigente')) then
    update request_people
    set
      qr_code = encode(gen_random_bytes(16), 'hex'),
      qr_expires_at = (new.fecha_hasta::timestamptz + interval '1 day')
    where access_request_id = new.id
      and estado_individual = 'aprobada'
      and qr_code is null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_request_approved_tg on access_requests;
create trigger on_request_approved_tg
  after update of estado on access_requests
  for each row execute function on_request_approved();

-- RPC: SST aprueba/rechaza un documento individual.
create or replace function sst_review_document(
  p_document_id uuid,
  p_estado document_status,
  p_motivo_rechazo text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role role;
begin
  v_role := current_user_role();
  if v_role not in ('super_admin', 'sst') then
    raise exception 'Solo SST puede revisar documentos';
  end if;

  if p_estado = 'rechazado' and (p_motivo_rechazo is null or trim(p_motivo_rechazo) = '') then
    raise exception 'Motivo de rechazo es obligatorio';
  end if;

  update person_documents
  set
    estado = p_estado,
    revisado_por = auth.uid(),
    revisado_at = now(),
    motivo_rechazo = case when p_estado = 'rechazado' then p_motivo_rechazo else null end
  where id = p_document_id;
end;
$$;

grant execute on function sst_review_document(uuid, document_status, text) to authenticated;

-- RPC: SST aprueba la solicitud completa.
create or replace function sst_approve_request(p_request_id uuid)
returns access_request_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role role;
  v_request access_requests%rowtype;
  v_pending integer;
  v_approved integer;
  v_new_estado access_request_status;
begin
  v_role := current_user_role();
  if v_role not in ('super_admin', 'sst') then
    raise exception 'Solo SST puede aprobar solicitudes';
  end if;

  select * into v_request from access_requests where id = p_request_id;
  if not found then
    raise exception 'Solicitud no encontrada';
  end if;

  select count(*) into v_pending
  from request_people
  where access_request_id = p_request_id
    and estado_individual in ('pendiente_docs', 'en_revision');

  if v_pending > 0 then
    raise exception 'Hay % personas con revisión pendiente', v_pending;
  end if;

  select count(*) into v_approved
  from request_people
  where access_request_id = p_request_id
    and estado_individual = 'aprobada';

  if v_approved = 0 then
    raise exception 'No hay personas aprobadas';
  end if;

  if v_request.fecha_desde <= current_date then
    v_new_estado := 'vigente';
  else
    v_new_estado := 'aprobada';
  end if;

  update access_requests set estado = v_new_estado where id = p_request_id;
  return v_new_estado;
end;
$$;

grant execute on function sst_approve_request(uuid) to authenticated;

-- RPC: SST rechaza solicitud.
create or replace function sst_reject_request(p_request_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role role;
begin
  v_role := current_user_role();
  if v_role not in ('super_admin', 'sst') then
    raise exception 'Solo SST puede rechazar solicitudes';
  end if;

  if p_motivo is null or trim(p_motivo) = '' then
    raise exception 'Motivo es obligatorio';
  end if;

  update access_requests
  set estado = 'rechazada',
      observaciones = coalesce(observaciones || E'\n', '') || '[Rechazo SST] ' || p_motivo
  where id = p_request_id;
end;
$$;

grant execute on function sst_reject_request(uuid, text) to authenticated;

-- RPC pública: dado un qr_code devuelve datos de credencial.
create or replace function get_credencial_by_qr(p_qr_code text)
returns table (
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
  qr_expires_at timestamptz,
  estado_solicitud access_request_status,
  estado_individual person_request_status
)
language sql
security definer
set search_path = public
as $$
  select
    rp.id, p.id, p.cedula, p.nombre, p.apellido, p.foto_url,
    c.razon_social, a.nombre, ar2.nombre,
    ar.fecha_desde, ar.fecha_hasta, ar.horario_inicio, ar.horario_fin,
    rp.qr_expires_at, ar.estado, rp.estado_individual
  from request_people rp
  join people p on p.id = rp.person_id
  join access_requests ar on ar.id = rp.access_request_id
  join companies c on c.id = ar.company_id
  join activities a on a.id = ar.activity_id
  left join areas ar2 on ar2.id = ar.area_id
  where rp.qr_code = p_qr_code;
$$;

grant execute on function get_credencial_by_qr(text) to anon, authenticated;
