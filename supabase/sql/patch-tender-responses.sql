alter table public.tender_responses
  add column if not exists responder_type text,
  add column if not exists expert_id uuid references public.expert_profiles(id) on delete set null;

update public.tender_responses
set responder_type = coalesce(
  responder_type,
  case
    when expert_id is not null then 'expert'
    else 'contractor'
  end
);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'tender_responses_responder_type_check'
      and conrelid = 'public.tender_responses'::regclass
  ) then
    alter table public.tender_responses
      drop constraint tender_responses_responder_type_check;
  end if;

  alter table public.tender_responses
    add constraint tender_responses_responder_type_check
    check (responder_type in ('contractor', 'expert'));
end $$;

create index if not exists tender_responses_expert_id_idx
  on public.tender_responses (expert_id);

create index if not exists tender_responses_responder_type_idx
  on public.tender_responses (responder_type);

notify pgrst, 'reload schema';
