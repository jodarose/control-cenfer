-- Bucket privado para documentos de personas
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos',
  'documentos',
  false,
  2097152,  -- 2 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Bucket privado para fotos de personas
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos_personas',
  'fotos_personas',
  false,
  524288,  -- 512 KB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "documentos_upload_authenticated"
  on storage.objects for insert
  with check (bucket_id = 'documentos');

create policy "documentos_read_authenticated"
  on storage.objects for select
  using (bucket_id = 'documentos');

create policy "documentos_update_authenticated"
  on storage.objects for update
  using (bucket_id = 'documentos');

create policy "documentos_delete_admin"
  on storage.objects for delete
  using (
    bucket_id = 'documentos'
    and current_user_role() in ('super_admin', 'sst')
  );

create policy "fotos_upload_any"
  on storage.objects for insert
  with check (bucket_id = 'fotos_personas');

create policy "fotos_read_any"
  on storage.objects for select
  using (bucket_id = 'fotos_personas');

create policy "fotos_update_any"
  on storage.objects for update
  using (bucket_id = 'fotos_personas');
