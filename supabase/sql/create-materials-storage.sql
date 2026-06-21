-- Optional infrastructure patch for the CMS image bucket.
-- The server upload route can create this public bucket lazily, while this
-- patch makes the desired self-hosted Storage state explicit and repeatable.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads material images" on storage.objects;
create policy "Public reads material images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'materials');

drop policy if exists "Users upload own material images" on storage.objects;
create policy "Users upload own material images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users manage own material images" on storage.objects;
create policy "Users manage own material images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'materials'
    and owner_id = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'materials'
    and owner_id = (select auth.uid()::text)
  );

drop policy if exists "Users delete own material images" on storage.objects;
create policy "Users delete own material images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'materials'
    and owner_id = (select auth.uid()::text)
  );
