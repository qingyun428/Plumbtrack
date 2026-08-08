create extension if not exists "pgcrypto";

create type public.app_role as enum ('administrator', 'view_only');
create type public.project_status as enum ('active', 'attention_required', 'delayed', 'completed');
create type public.stage_status as enum ('not_started', 'in_progress', 'waiting_approval', 'completed', 'not_applicable');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.app_role not null default 'view_only',
  active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  reference text not null unique,
  description text not null,
  site_address text not null,
  maincon text not null,
  person_in_charge text not null,
  start_date date not null,
  target_completion_date date,
  status public.project_status not null default 'active',
  temporary_water_required boolean not null default true,
  public_sewer_connection boolean not null default false,
  progress smallint not null default 0 check (progress between 0 and 100),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_number smallint not null check (stage_number between 1 and 14),
  name text not null,
  description text not null,
  status public.stage_status not null default 'not_started',
  expected_date date,
  actual_completion_date date,
  applicable boolean not null default true,
  notes text,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, stage_number)
);

create table public.stage_field_values (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.project_stages(id) on delete cascade,
  field_key text not null,
  field_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(stage_id, field_key)
);

create table public.records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.project_stages(id) on delete set null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  category text not null default 'Other Record',
  revision integer not null default 1,
  uploader_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.project_stages(id) on delete cascade,
  title text not null,
  due_date date not null,
  completed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  project_id uuid references public.projects(id) on delete set null,
  stage_id uuid references public.project_stages(id) on delete set null,
  action text not null,
  subject text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create table public.settings (
  id boolean primary key default true check (id),
  company_name text not null default 'PlumbTrack Contractor',
  company_logo_path text,
  file_upload_limit_mb integer not null default 25,
  date_format text not null default 'DD/MM/YYYY',
  follow_up_days integer not null default 7,
  data_retention text not null default 'Permanent',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create index projects_status_idx on public.projects(status);
create index projects_target_date_idx on public.projects(target_completion_date);
create index stages_project_idx on public.project_stages(project_id, stage_number);
create index records_project_idx on public.records(project_id, created_at desc);
create index reminders_due_idx on public.reminders(due_date);
create index activity_project_idx on public.activity_logs(project_id, created_at desc);

create or replace function public.is_administrator()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'administrator' and active); $$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_stages enable row level security;
alter table public.stage_field_values enable row level security;
alter table public.records enable row level security;
alter table public.reminders enable row level security;
alter table public.activity_logs enable row level security;
alter table public.settings enable row level security;

create policy "authenticated read profiles" on public.profiles for select to authenticated using (true);
create policy "admins manage profiles" on public.profiles for all to authenticated using (public.is_administrator()) with check (public.is_administrator());
create policy "authenticated read projects" on public.projects for select to authenticated using (true);
create policy "admins manage projects" on public.projects for all to authenticated using (public.is_administrator()) with check (public.is_administrator());
create policy "authenticated read stages" on public.project_stages for select to authenticated using (true);
create policy "admins manage stages" on public.project_stages for all to authenticated using (public.is_administrator()) with check (public.is_administrator());
create policy "authenticated read stage fields" on public.stage_field_values for select to authenticated using (true);
create policy "admins manage stage fields" on public.stage_field_values for all to authenticated using (public.is_administrator()) with check (public.is_administrator());
create policy "authenticated read records" on public.records for select to authenticated using (true);
create policy "admins manage records" on public.records for all to authenticated using (public.is_administrator()) with check (public.is_administrator());
create policy "authenticated read reminders" on public.reminders for select to authenticated using (true);
create policy "admins manage reminders" on public.reminders for all to authenticated using (public.is_administrator()) with check (public.is_administrator());
create policy "authenticated read activity" on public.activity_logs for select to authenticated using (true);
create policy "admins append activity" on public.activity_logs for insert to authenticated with check (public.is_administrator());
create policy "authenticated read settings" on public.settings for select to authenticated using (true);
create policy "admins manage settings" on public.settings for all to authenticated using (public.is_administrator()) with check (public.is_administrator());

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-records', 'project-records', false, 26214400)
on conflict (id) do nothing;

create policy "authenticated download project records" on storage.objects
for select to authenticated using (bucket_id = 'project-records');
create policy "admins upload project records" on storage.objects
for insert to authenticated with check (bucket_id = 'project-records' and public.is_administrator());
create policy "admins update project records" on storage.objects
for update to authenticated using (bucket_id = 'project-records' and public.is_administrator());
create policy "admins delete project records" on storage.objects
for delete to authenticated using (bucket_id = 'project-records' and public.is_administrator());

insert into public.settings(id) values(true) on conflict(id) do nothing;

