alter table public.contractor_profiles
  add column if not exists short_description text,
  add column if not exists full_description text,
  add column if not exists telegram_url text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists min_budget integer,
  add column if not exists price_description text,
  add column if not exists team_size integer,
  add column if not exists website_url text;

comment on column public.contractor_profiles.short_description is 'Short public contractor summary.';
comment on column public.contractor_profiles.full_description is 'Full contractor profile description.';
comment on column public.contractor_profiles.telegram_url is 'Public Telegram contact URL.';
comment on column public.contractor_profiles.contact_email is 'Public contact email shown to authenticated users.';
comment on column public.contractor_profiles.contact_phone is 'Public contact phone shown to authenticated users.';
comment on column public.contractor_profiles.min_budget is 'Minimum project budget in rubles.';
comment on column public.contractor_profiles.price_description is 'Free-form pricing description.';
comment on column public.contractor_profiles.team_size is 'Contractor team size.';
comment on column public.contractor_profiles.website_url is 'Contractor website URL.';
