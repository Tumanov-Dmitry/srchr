-- Comments and reactions are a separate user layer over published materials.

create table if not exists public.material_comments (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.material_reactions (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (
    reaction in ('insightful', 'useful', 'wow', 'love', 'applause')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (material_id, user_id)
);

create index if not exists material_comments_material_created_idx
  on public.material_comments (material_id, created_at desc);

create index if not exists material_reactions_material_idx
  on public.material_reactions (material_id, reaction);

alter table public.material_comments enable row level security;
alter table public.material_reactions enable row level security;

grant select on public.material_comments, public.material_reactions to anon;
grant select, insert, update, delete
  on public.material_comments, public.material_reactions to authenticated;

drop policy if exists "Published material comments are public" on public.material_comments;
create policy "Published material comments are public"
  on public.material_comments for select
  using (
    exists (
      select 1 from public.materials
      where materials.id = material_comments.material_id
        and materials.status = 'published'
    )
  );

drop policy if exists "Users can comment on published materials" on public.material_comments;
create policy "Users can comment on published materials"
  on public.material_comments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.materials
      where materials.id = material_comments.material_id
        and materials.status = 'published'
    )
  );

drop policy if exists "Users can update own material comments" on public.material_comments;
create policy "Users can update own material comments"
  on public.material_comments for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own material comments" on public.material_comments;
create policy "Users can delete own material comments"
  on public.material_comments for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Published material reactions are public" on public.material_reactions;
create policy "Published material reactions are public"
  on public.material_reactions for select
  using (
    exists (
      select 1 from public.materials
      where materials.id = material_reactions.material_id
        and materials.status = 'published'
    )
  );

drop policy if exists "Users can react to published materials" on public.material_reactions;
create policy "Users can react to published materials"
  on public.material_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.materials
      where materials.id = material_reactions.material_id
        and materials.status = 'published'
    )
  );

drop policy if exists "Users can update own material reaction" on public.material_reactions;
create policy "Users can update own material reaction"
  on public.material_reactions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can remove own material reaction" on public.material_reactions;
create policy "Users can remove own material reaction"
  on public.material_reactions for delete to authenticated
  using (user_id = (select auth.uid()));
