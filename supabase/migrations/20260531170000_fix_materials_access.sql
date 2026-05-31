grant select on public.materials to anon;
grant select, insert, update, delete on public.materials to authenticated;

alter table public.materials enable row level security;

drop policy if exists "Published materials are public" on public.materials;
create policy "Published materials are public"
  on public.materials
  for select
  using (status = 'published');

drop policy if exists "Organization members can manage materials" on public.materials;
create policy "Organization members can manage materials"
  on public.materials
  for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
