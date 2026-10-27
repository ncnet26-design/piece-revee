-- Stockage privé : chaque utilisateur n'accède qu'à son dossier (premier segment du chemin = son identifiant).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  ('renders', 'renders', false, 26214400, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy photos_own_read on storage.objects for select to authenticated
  using (bucket_id in ('photos', 'renders') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy photos_own_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy photos_own_delete on storage.objects for delete to authenticated
  using (bucket_id in ('photos', 'renders') and (storage.foldername(name))[1] = (select auth.uid())::text);
