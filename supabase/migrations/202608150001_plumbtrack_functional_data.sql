create extension if not exists "pgcrypto";

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  role text not null default 'View Only' check (role in ('Administrator', 'View Only')),
  active boolean not null default true,
  last_seen_label text not null default 'Just now',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_members_email_idx
  on public.team_members(email);

create index if not exists team_members_active_idx
  on public.team_members(active);

alter table public.team_members enable row level security;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'touch_team_members_updated_at') then
    create trigger touch_team_members_updated_at
    before update on public.team_members
    for each row execute function public.touch_updated_at();
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_members'
      and policyname = 'authenticated read team members'
  ) then
    execute 'create policy "authenticated read team members" on public.team_members for select to authenticated using (true)';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_members'
      and policyname = 'authenticated manage team members'
  ) then
    execute 'create policy "authenticated manage team members" on public.team_members for all to authenticated using (true) with check (true)';
  end if;
end
$$;

insert into public.team_members (full_name, email, role, active, last_seen_label)
values ('Chen QingYu', 'qingyuc832@gmail.com', 'Administrator', true, '08 Aug 2026')
on conflict (email) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  active = excluded.active,
  last_seen_label = excluded.last_seen_label;

insert into public.settings(id)
values(true)
on conflict(id) do nothing;
