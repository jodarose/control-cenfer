create or replace function get_request_by_token(token uuid)
returns table (
  id uuid,
  company_id uuid,
  activity_id uuid,
  area_id uuid,
  fecha_desde date,
  fecha_hasta date,
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
  select id, company_id, activity_id, area_id, fecha_desde, fecha_hasta,
         nivel_riesgo, cantidad_estimada, observaciones, estado, public_token_expires_at
  from access_requests
  where public_token = token
    and public_token_expires_at > now()
    and estado in ('enviada', 'en_carga');
$$;

grant execute on function get_request_by_token(uuid) to anon, authenticated;
