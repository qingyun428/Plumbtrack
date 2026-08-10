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

create table if not exists public.water_pump_options (
  code text primary key,
  name text not null,
  description text,
  is_default boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.water_pump_projects (
  id uuid primary key default gen_random_uuid(),
  project_number integer not null unique,
  name text not null,
  address text,
  maincon text,
  contact text,
  status text not null default 'Waiting for Quotation',
  pub_status text not null default 'Not Submitted',
  updated_label text,
  final_confirmed_price numeric(12, 2),
  selected_supplier_name text default 'Not selected',
  confirmation_date date,
  po_number text,
  final_remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint water_pump_projects_status_check check (
    status in (
      'Waiting for Quotation',
      'Comparing Quotation',
      'Supplier Selected',
      'PUB Submitted',
      'PUB Approved',
      'Site Processing',
      'Completed'
    )
  ),
  constraint water_pump_projects_pub_status_check check (
    pub_status in ('Not Submitted', 'Submitted', 'Approved', 'Not Required')
  )
);

create table if not exists public.water_pump_project_pumps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.water_pump_projects(id) on delete cascade,
  option_code text not null references public.water_pump_options(code),
  option_name text not null,
  quantity integer not null default 1 check (quantity >= 0),
  location text,
  need_pub boolean not null default false,
  submitted_pub boolean not null default false,
  approved_pub boolean not null default false,
  remark text,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.water_pump_quotations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.water_pump_projects(id) on delete cascade,
  supplier_name text not null,
  quote_number text,
  quote_date date,
  total_price numeric(12, 2),
  contact_person text,
  contact_number text,
  gst_status text not null default 'Not Specified',
  lead_time text,
  warranty text,
  remark text,
  selected boolean not null default false,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint water_pump_quotations_gst_status_check check (
    gst_status in ('Not Specified', 'Included', 'Excluded')
  )
);

create table if not exists public.water_pump_tank_details (
  project_id uuid primary key references public.water_pump_projects(id) on delete cascade,
  supply_type text not null default 'Own Company Supply / Manufacture',
  supplier_scope text not null default 'Installation + Booster Pump',
  tank_size text,
  quantity integer not null default 1 check (quantity >= 0),
  location text,
  installation_fee numeric(12, 2),
  booster_pump_quantity integer not null default 1 check (booster_pump_quantity >= 0),
  remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists water_pump_projects_status_idx
  on public.water_pump_projects(status);
create index if not exists water_pump_projects_updated_idx
  on public.water_pump_projects(updated_at desc);
create index if not exists water_pump_project_pumps_project_idx
  on public.water_pump_project_pumps(project_id, sort_order);
create index if not exists water_pump_quotations_project_idx
  on public.water_pump_quotations(project_id, sort_order);
create index if not exists water_pump_quotations_supplier_idx
  on public.water_pump_quotations(supplier_name);

alter table public.water_pump_options enable row level security;
alter table public.water_pump_projects enable row level security;
alter table public.water_pump_project_pumps enable row level security;
alter table public.water_pump_quotations enable row level security;
alter table public.water_pump_tank_details enable row level security;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'touch_water_pump_options_updated_at') then
    create trigger touch_water_pump_options_updated_at
    before update on public.water_pump_options
    for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'touch_water_pump_projects_updated_at') then
    create trigger touch_water_pump_projects_updated_at
    before update on public.water_pump_projects
    for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'touch_water_pump_project_pumps_updated_at') then
    create trigger touch_water_pump_project_pumps_updated_at
    before update on public.water_pump_project_pumps
    for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'touch_water_pump_quotations_updated_at') then
    create trigger touch_water_pump_quotations_updated_at
    before update on public.water_pump_quotations
    for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'touch_water_pump_tank_details_updated_at') then
    create trigger touch_water_pump_tank_details_updated_at
    before update on public.water_pump_tank_details
    for each row execute function public.touch_updated_at();
  end if;
end
$$;

insert into public.water_pump_options (code, name, description, is_default, active, sort_order)
values
  ('WT', 'Water Tank Installation + Booster Pump', 'Own supply · Supplier installation', true, true, 1),
  ('EP', 'Ejector Pump', 'System default pump option', true, true, 2),
  ('ES', 'Ejector Sump Pump', 'System default pump option', true, true, 3),
  ('BW', 'Backwash Sump Pump', 'System default pump option', true, true, 4),
  ('RW', 'Rainwater Sump Pump', 'System default pump option', true, true, 5),
  ('OF', 'Overflow Sump Pump', 'System default pump option', true, true, 6),
  ('P+', 'Other Pump', 'Custom pump requirement', true, true, 7)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  is_default = excluded.is_default,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into public.water_pump_projects (
  id,
  project_number,
  name,
  address,
  maincon,
  contact,
  status,
  pub_status,
  updated_label,
  final_confirmed_price,
  selected_supplier_name,
  confirmation_date,
  po_number,
  final_remark
)
values (
  '00000000-0000-4000-8000-000000000001',
  1,
  '36 JALAN INTAN',
  'PROPOSED NEW ERECTION OF 2-STOREY INTERMEDIATE TERRACED DWELLING HOUSE WITH AN ATTIC ON LOT MK 10-00830C 36 JALAN INSTAN SINGAPORE 668796 (BUKIT BATOK PLANNING AREA)',
  'Foo Brothers Pte Ltd',
  '—',
  'Supplier Selected',
  'Not Submitted',
  '08 Aug 2026',
  0,
  'Not selected',
  '2026-02-02',
  '—',
  ''
)
on conflict (id) do update set
  project_number = excluded.project_number,
  name = excluded.name,
  address = excluded.address,
  maincon = excluded.maincon,
  contact = excluded.contact,
  status = excluded.status,
  pub_status = excluded.pub_status,
  updated_label = excluded.updated_label,
  final_confirmed_price = excluded.final_confirmed_price,
  selected_supplier_name = excluded.selected_supplier_name,
  confirmation_date = excluded.confirmation_date,
  po_number = excluded.po_number,
  final_remark = excluded.final_remark;

insert into public.water_pump_project_pumps (
  id,
  project_id,
  option_code,
  option_name,
  quantity,
  location,
  need_pub,
  submitted_pub,
  approved_pub,
  remark,
  sort_order
)
values
  (
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000001',
    'WT',
    'Water Tank Installation + Booster Pump',
    1,
    '1ST U/G',
    true,
    false,
    false,
    '',
    1
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000001',
    'OF',
    'Overflow Sump Pump',
    1,
    'Pump Room',
    false,
    false,
    false,
    '',
    2
  )
on conflict (id) do update set
  option_code = excluded.option_code,
  option_name = excluded.option_name,
  quantity = excluded.quantity,
  location = excluded.location,
  need_pub = excluded.need_pub,
  submitted_pub = excluded.submitted_pub,
  approved_pub = excluded.approved_pub,
  remark = excluded.remark,
  sort_order = excluded.sort_order;

insert into public.water_pump_quotations (
  id,
  project_id,
  supplier_name,
  quote_number,
  quote_date,
  total_price,
  contact_person,
  contact_number,
  gst_status,
  lead_time,
  warranty,
  remark,
  selected,
  sort_order
)
values (
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000001',
  'BNW',
  '—',
  '2026-02-02',
  null,
  'BEN',
  '',
  'Excluded',
  '',
  '',
  '',
  false,
  1
)
on conflict (id) do update set
  supplier_name = excluded.supplier_name,
  quote_number = excluded.quote_number,
  quote_date = excluded.quote_date,
  total_price = excluded.total_price,
  contact_person = excluded.contact_person,
  contact_number = excluded.contact_number,
  gst_status = excluded.gst_status,
  lead_time = excluded.lead_time,
  warranty = excluded.warranty,
  remark = excluded.remark,
  selected = excluded.selected,
  sort_order = excluded.sort_order;

insert into public.water_pump_tank_details (
  project_id,
  supply_type,
  supplier_scope,
  tank_size,
  quantity,
  location,
  installation_fee,
  booster_pump_quantity,
  remark
)
values (
  '00000000-0000-4000-8000-000000000001',
  'Own Company Supply / Manufacture',
  'Installation + Booster Pump',
  '1M X 1M X 1M',
  1,
  '1ST U/G',
  null,
  1,
  ''
)
on conflict (project_id) do update set
  supply_type = excluded.supply_type,
  supplier_scope = excluded.supplier_scope,
  tank_size = excluded.tank_size,
  quantity = excluded.quantity,
  location = excluded.location,
  installation_fee = excluded.installation_fee,
  booster_pump_quantity = excluded.booster_pump_quantity,
  remark = excluded.remark;
