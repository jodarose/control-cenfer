-- people
alter table people enable row level security;

create policy "people_select_admin_sst_recepcion"
  on people for select
  using (current_user_role() in ('super_admin', 'sst', 'recepcion'));

create policy "people_select_own_company"
  on people for select
  using (
    exists (
      select 1 from company_users cu
      where cu.user_id = auth.uid() and cu.company_id = people.company_id
    )
  );

create policy "people_write_admin_recepcion"
  on people for all
  using (current_user_role() in ('super_admin', 'recepcion'));

create policy "people_write_own_company"
  on people for all
  using (
    exists (
      select 1 from company_users cu
      where cu.user_id = auth.uid() and cu.company_id = people.company_id
    )
  );

-- access_requests
alter table access_requests enable row level security;

create policy "access_requests_select_admin_sst_recepcion"
  on access_requests for select
  using (current_user_role() in ('super_admin', 'sst', 'recepcion'));

create policy "access_requests_select_own_company"
  on access_requests for select
  using (
    exists (
      select 1 from company_users cu
      where cu.user_id = auth.uid() and cu.company_id = access_requests.company_id
    )
  );

create policy "access_requests_insert_recepcion"
  on access_requests for insert
  with check (current_user_role() in ('super_admin', 'recepcion'));

create policy "access_requests_update_recepcion_sst"
  on access_requests for update
  using (current_user_role() in ('super_admin', 'recepcion', 'sst'));

-- request_vehicles/tools/misc
alter table request_vehicles enable row level security;
alter table request_tools enable row level security;
alter table request_misc enable row level security;

create policy "request_vehicles_select"
  on request_vehicles for select using (
    exists (select 1 from access_requests ar where ar.id = access_request_id)
  );
create policy "request_vehicles_write"
  on request_vehicles for all
  using (current_user_role() in ('super_admin', 'recepcion'));

create policy "request_tools_select"
  on request_tools for select using (
    exists (select 1 from access_requests ar where ar.id = access_request_id)
  );
create policy "request_tools_write"
  on request_tools for all using (current_user_role() in ('super_admin', 'recepcion'));

create policy "request_misc_select"
  on request_misc for select using (
    exists (select 1 from access_requests ar where ar.id = access_request_id)
  );
create policy "request_misc_write"
  on request_misc for all using (current_user_role() in ('super_admin', 'recepcion'));

-- request_people
alter table request_people enable row level security;

create policy "request_people_select_admin_sst_recepcion"
  on request_people for select
  using (current_user_role() in ('super_admin', 'sst', 'recepcion'));

create policy "request_people_select_own_company"
  on request_people for select
  using (
    exists (
      select 1 from access_requests ar
      join company_users cu on cu.company_id = ar.company_id
      where ar.id = request_people.access_request_id
        and cu.user_id = auth.uid()
    )
  );

create policy "request_people_write_company_or_admin"
  on request_people for all
  using (
    current_user_role() in ('super_admin', 'recepcion', 'sst')
    or exists (
      select 1 from access_requests ar
      join company_users cu on cu.company_id = ar.company_id
      where ar.id = request_people.access_request_id
        and cu.user_id = auth.uid()
    )
  );

-- person_documents
alter table person_documents enable row level security;

create policy "person_documents_select"
  on person_documents for select
  using (
    current_user_role() in ('super_admin', 'sst', 'recepcion')
    or exists (
      select 1 from people p
      join company_users cu on cu.company_id = p.company_id
      where p.id = person_documents.person_id and cu.user_id = auth.uid()
    )
  );

create policy "person_documents_write"
  on person_documents for all
  using (
    current_user_role() in ('super_admin', 'sst', 'recepcion')
    or exists (
      select 1 from people p
      join company_users cu on cu.company_id = p.company_id
      where p.id = person_documents.person_id and cu.user_id = auth.uid()
    )
  );
