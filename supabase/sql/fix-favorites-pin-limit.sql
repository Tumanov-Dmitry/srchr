-- Atomically enforce the global limit of four pinned favorites per user.

create or replace function public.pin_favorite(target_favorite_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  favorite_row public.favorites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'favorite_not_found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));

  select *
  into favorite_row
  from public.favorites
  where id = target_favorite_id
    and user_id = auth.uid();

  if not found then
    raise exception 'favorite_not_found';
  end if;

  if favorite_row.is_pinned then
    return to_jsonb(favorite_row);
  end if;

  if (
    select count(*)
    from public.favorites
    where user_id = auth.uid()
      and is_pinned = true
  ) >= 4 then
    raise exception 'favorite_pin_limit';
  end if;

  update public.favorites
  set is_pinned = true,
      pinned_at = now(),
      updated_at = now()
  where id = target_favorite_id
    and user_id = auth.uid()
  returning * into favorite_row;

  return to_jsonb(favorite_row);
end;
$$;

revoke all on function public.pin_favorite(uuid) from public, anon;
grant execute on function public.pin_favorite(uuid) to authenticated;

notify pgrst, 'reload schema';
