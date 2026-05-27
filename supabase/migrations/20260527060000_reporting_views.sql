-- Vista: documentos por vencer
create or replace view v_documentos_por_vencer as
select
  pd.id,
  p.cedula,
  p.nombre,
  p.apellido,
  c.razon_social,
  pd.document_type,
  pd.fecha_vencimiento,
  (pd.fecha_vencimiento - current_date)::integer as dias_restantes,
  pd.estado
from person_documents pd
join people p on p.id = pd.person_id
join companies c on c.id = p.company_id
where pd.estado = 'aprobado'
  and pd.fecha_vencimiento is not null
  and pd.fecha_vencimiento <= current_date + interval '30 days';

-- Vista: personas que entraron hoy y no han salido
create or replace view v_no_salieron_hoy as
with last_event as (
  select distinct on (request_person_id)
    request_person_id, tipo, created_at
  from access_events
  where created_at >= current_date
  order by request_person_id, created_at desc
)
select
  le.request_person_id,
  p.cedula, p.nombre, p.apellido,
  c.razon_social,
  le.created_at as ultima_entrada
from last_event le
join request_people rp on rp.id = le.request_person_id
join people p on p.id = rp.person_id
join access_requests ar on ar.id = rp.access_request_id
join companies c on c.id = ar.company_id
where le.tipo = 'entrada';

-- Vista: dashboard por empresa
create or replace view v_dashboard_empresas as
select
  c.id as company_id,
  c.razon_social,
  c.nit,
  count(distinct ar.id) as total_solicitudes,
  count(distinct ar.id) filter (where ar.estado in ('aprobada', 'vigente')) as solicitudes_vigentes,
  count(distinct rp.id) filter (where rp.estado_individual = 'aprobada') as personas_aprobadas,
  count(distinct rp.id) filter (where rp.estado_individual = 'rechazada') as personas_rechazadas
from companies c
left join access_requests ar on ar.company_id = c.id
left join request_people rp on rp.access_request_id = ar.id
group by c.id, c.razon_social, c.nit;

-- Vista: dashboard por actividad
create or replace view v_dashboard_actividades as
select
  a.id as activity_id,
  a.nombre,
  a.nivel_riesgo_default,
  count(distinct ar.id) as total_solicitudes,
  count(distinct ar.id) filter (where ar.estado in ('aprobada', 'vigente')) as solicitudes_vigentes,
  count(distinct rp.person_id) as personas_unicas,
  count(distinct rp.person_id) filter (where rp.estado_individual = 'aprobada') as personas_aprobadas
from activities a
left join access_requests ar on ar.activity_id = a.id
left join request_people rp on rp.access_request_id = ar.id
group by a.id, a.nombre, a.nivel_riesgo_default;

-- RPC: historial de ingresos/salidas con filtros
create or replace function reporte_historial_eventos(
  p_desde date default current_date - 7,
  p_hasta date default current_date,
  p_company_id uuid default null
)
returns table (
  event_id uuid,
  fecha_hora timestamptz,
  tipo access_event_type,
  cedula text,
  nombre text,
  apellido text,
  razon_social text,
  activity_nombre text,
  porteria_nombre text,
  metodo access_event_method
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ae.id, ae.created_at, ae.tipo,
    p.cedula, p.nombre, p.apellido,
    c.razon_social, a.nombre, po.nombre, ae.metodo
  from access_events ae
  join request_people rp on rp.id = ae.request_person_id
  join people p on p.id = rp.person_id
  join access_requests ar on ar.id = rp.access_request_id
  join companies c on c.id = ar.company_id
  join activities a on a.id = ar.activity_id
  join porterias po on po.id = ae.porteria_id
  where ae.created_at::date between p_desde and p_hasta
    and (p_company_id is null or c.id = p_company_id)
  order by ae.created_at desc;
$$;

grant execute on function reporte_historial_eventos(date, date, uuid) to authenticated;
